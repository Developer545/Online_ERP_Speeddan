// ══════════════════════════════════════════════════════════
// DB SETUP — CONFIGURACIÓN AUTOMÁTICA DE BASE DE DATOS
// Verifica PostgreSQL, crea la DB y aplica migraciones.
// ══════════════════════════════════════════════════════════

import { app, dialog } from 'electron'
import { Client } from 'pg'
import { join } from 'path'
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from 'fs'
import { randomUUID } from 'crypto'
import * as bcrypt from 'bcryptjs'

const DB_NAME = 'cliente_db'
const DEFAULT_HOST = 'localhost'
const DEFAULT_PORT = 5432
const DEFAULT_USER = 'postgres'

// ── Credenciales de conexión ───────────────────────────
export interface DbCredentials {
  host: string
  port: number
  user: string
  password: string
}

// ── Ruta del archivo de credenciales guardadas ─────────
function getCredentialsPath(): string {
  return join(app.getPath('userData'), 'pg-credentials.json')
}

// ── Guardar credenciales para próximos arranques ───────
export function saveCredentials(creds: DbCredentials): void {
  try {
    writeFileSync(getCredentialsPath(), JSON.stringify(creds), 'utf-8')
  } catch { /* ignorar errores de escritura */ }
}

// ── Cargar credenciales guardadas previamente ──────────
export function loadSavedCredentials(): DbCredentials | null {
  try {
    const path = getCredentialsPath()
    if (!existsSync(path)) return null
    return JSON.parse(readFileSync(path, 'utf-8')) as DbCredentials
  } catch {
    return null
  }
}

// ── Ruta raíz de la app en producción y desarrollo ────────
function getAppDir(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'app')
  }
  // En dev: __dirname es out/main/, subir 3 niveles al root
  return join(__dirname, '../../..')
}

// ── Construir DATABASE_URL con la DB del cliente ──────────
export function buildClientDbUrl(password = '', host = DEFAULT_HOST, port = DEFAULT_PORT, user = DEFAULT_USER): string {
  const pw = password ? `:${encodeURIComponent(password)}` : ''
  return `postgresql://${user}${pw}@${host}:${port}/${DB_NAME}?schema=public`
}

// ── Probar conexión a PostgreSQL (DB postgres por defecto) ─
async function testPostgresConnection(password = ''): Promise<boolean> {
  const client = new Client({
    host: DEFAULT_HOST,
    port: DEFAULT_PORT,
    user: DEFAULT_USER,
    password: password,
    database: 'postgres',
    connectionTimeoutMillis: 4000
  })
  try {
    await client.connect()
    await client.end()
    return true
  } catch {
    await client.end().catch(() => {})
    return false
  }
}

// ── Probar conexión con credenciales personalizadas ───────
export async function testPostgresConnectionCustom(creds: DbCredentials): Promise<boolean> {
  const client = new Client({
    host: creds.host,
    port: creds.port,
    user: creds.user,
    password: creds.password,
    database: 'postgres',
    connectionTimeoutMillis: 5000
  })
  try {
    await client.connect()
    await client.end()
    return true
  } catch {
    await client.end().catch(() => {})
    return false
  }
}

// ── Verificar si la base de datos existe ──────────────────
async function databaseExists(password = ''): Promise<boolean> {
  const client = new Client({
    host: DEFAULT_HOST,
    port: DEFAULT_PORT,
    user: DEFAULT_USER,
    password: password,
    database: 'postgres',
    connectionTimeoutMillis: 4000
  })
  await client.connect()
  try {
    const result = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [DB_NAME]
    )
    return result.rows.length > 0
  } finally {
    await client.end()
  }
}

// ── Verificar si hay una licencia activa en la BD ─────────
async function hasActiveLicense(password = ''): Promise<boolean> {
  const client = new Client({
    host: DEFAULT_HOST,
    port: DEFAULT_PORT,
    user: DEFAULT_USER,
    password: password,
    database: DB_NAME,
    connectionTimeoutMillis: 4000
  })
  try {
    await client.connect()
    const result = await client.query(
      `SELECT valor FROM "AppConfig" WHERE clave = 'license_key' LIMIT 1`
    )
    return result.rows.length > 0 && !!result.rows[0].valor
  } catch {
    // La tabla no existe o hay error → sin licencia
    return false
  } finally {
    await client.end().catch(() => {})
  }
}

// ── Borrar la base de datos para instalación limpia ───────
async function dropDatabase(password = ''): Promise<void> {
  const client = new Client({
    host: DEFAULT_HOST,
    port: DEFAULT_PORT,
    user: DEFAULT_USER,
    password: password,
    database: 'postgres',
    connectionTimeoutMillis: 4000
  })
  await client.connect()
  try {
    // Terminar todas las conexiones activas a la BD antes de borrarla
    await client.query(
      `SELECT pg_terminate_backend(pid)
       FROM pg_stat_activity
       WHERE datname = $1 AND pid <> pg_backend_pid()`,
      [DB_NAME]
    )
    await client.query(`DROP DATABASE IF EXISTS "${DB_NAME}"`)
  } finally {
    await client.end()
  }
}

// ── Crear la base de datos si no existe ───────────────────
async function ensureDatabase(password = ''): Promise<void> {
  const client = new Client({
    host: DEFAULT_HOST,
    port: DEFAULT_PORT,
    user: DEFAULT_USER,
    password: password,
    database: 'postgres',
    connectionTimeoutMillis: 4000
  })
  await client.connect()
  try {
    const result = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [DB_NAME]
    )
    if (result.rows.length === 0) {
      await client.query(`CREATE DATABASE "${DB_NAME}"`)
    }
  } finally {
    await client.end()
  }
}

// ── Aplicar migraciones pendientes ────────────────────────
async function applyMigrations(password = ''): Promise<void> {
  const client = new Client({
    host: DEFAULT_HOST,
    port: DEFAULT_PORT,
    user: DEFAULT_USER,
    password: password,
    database: DB_NAME,
    connectionTimeoutMillis: 4000
  })
  await client.connect()

  try {
    // Crear tabla de control de migraciones (igual que Prisma)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        "id"                  VARCHAR(36)   NOT NULL,
        "checksum"            VARCHAR(64)   NOT NULL,
        "finished_at"         TIMESTAMPTZ,
        "migration_name"      VARCHAR(255)  NOT NULL,
        "logs"                TEXT,
        "rolled_back_at"      TIMESTAMPTZ,
        "started_at"          TIMESTAMPTZ   NOT NULL DEFAULT now(),
        "applied_steps_count" INTEGER       NOT NULL DEFAULT 0,
        CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
      )
    `)

    // Leer carpetas de migración en orden
    const migrationsDir = join(getAppDir(), 'prisma', 'migrations')
    const folders = readdirSync(migrationsDir)
      .filter(f => {
        if (f.endsWith('.toml')) return false
        return statSync(join(migrationsDir, f)).isDirectory()
      })
      .sort()

    for (const migrationName of folders) {
      // Verificar si ya fue aplicada
      const applied = await client.query(
        `SELECT id FROM "_prisma_migrations" WHERE migration_name = $1 AND finished_at IS NOT NULL`,
        [migrationName]
      )
      if (applied.rows.length > 0) continue

      const sqlPath = join(migrationsDir, migrationName, 'migration.sql')
      const sql = readFileSync(sqlPath, 'utf-8')

      await client.query('BEGIN')
      try {
        await client.query(sql)
        await client.query(
          `INSERT INTO "_prisma_migrations"
             (id, checksum, finished_at, migration_name, applied_steps_count)
           VALUES ($1, $2, now(), $3, 1)`,
          [randomUUID(), 'speeddansys-managed', migrationName]
        )
        await client.query('COMMIT')
      } catch (err) {
        await client.query('ROLLBACK')
        throw err
      }
    }
  } finally {
    await client.end()
  }
}

// ── Intentar passwords comunes ────────────────────────────
// IMPORTANTE: el string vacío va AL FINAL.
// Prisma no acepta URLs sin contraseña aunque pg_hba.conf use trust auth.
// Con trust auth cualquier password no-vacío funciona, por eso intentamos
// los candidatos típicos antes que el vacío.
async function tryCommonPasswords(): Promise<string | null> {
  const candidates = ['postgres', 'admin', '123456', '1234', 'root', '123321', '123', 'password', '']
  for (const pw of candidates) {
    if (await testPostgresConnection(pw)) return pw
  }
  return null
}

// ── Garantizar password válido para la URL de Prisma ──────
// Si pg detectó trust auth (password vacío), usamos 'postgres' en la URL
// porque con trust PostgreSQL acepta cualquier string no-vacío.
function normalizePrismaPassword(password: string): string {
  return password === '' ? 'postgres' : password
}

// ── Funciones internas con credenciales personalizadas ────
async function databaseExistsCustom(creds: DbCredentials): Promise<boolean> {
  const client = new Client({ ...creds, database: 'postgres', connectionTimeoutMillis: 5000 })
  await client.connect()
  try {
    const result = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [DB_NAME])
    return result.rows.length > 0
  } finally {
    await client.end()
  }
}

async function hasActiveLicenseCustom(creds: DbCredentials): Promise<boolean> {
  const client = new Client({ ...creds, database: DB_NAME, connectionTimeoutMillis: 5000 })
  try {
    await client.connect()
    const result = await client.query(
      `SELECT valor FROM "AppConfig" WHERE clave = 'license_key' LIMIT 1`
    )
    return result.rows.length > 0 && !!result.rows[0].valor
  } catch {
    return false
  } finally {
    await client.end().catch(() => {})
  }
}

async function dropDatabaseCustom(creds: DbCredentials): Promise<void> {
  const client = new Client({ ...creds, database: 'postgres', connectionTimeoutMillis: 5000 })
  await client.connect()
  try {
    await client.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
      [DB_NAME]
    )
    await client.query(`DROP DATABASE IF EXISTS "${DB_NAME}"`)
  } finally {
    await client.end()
  }
}

async function ensureDatabaseCustom(creds: DbCredentials): Promise<void> {
  const client = new Client({ ...creds, database: 'postgres', connectionTimeoutMillis: 5000 })
  await client.connect()
  try {
    const result = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [DB_NAME])
    if (result.rows.length === 0) {
      await client.query(`CREATE DATABASE "${DB_NAME}"`)
    }
  } finally {
    await client.end()
  }
}

async function applyMigrationsCustom(creds: DbCredentials): Promise<void> {
  const client = new Client({ ...creds, database: DB_NAME, connectionTimeoutMillis: 10000 })
  await client.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        "id"                  VARCHAR(36)   NOT NULL,
        "checksum"            VARCHAR(64)   NOT NULL,
        "finished_at"         TIMESTAMPTZ,
        "migration_name"      VARCHAR(255)  NOT NULL,
        "logs"                TEXT,
        "rolled_back_at"      TIMESTAMPTZ,
        "started_at"          TIMESTAMPTZ   NOT NULL DEFAULT now(),
        "applied_steps_count" INTEGER       NOT NULL DEFAULT 0,
        CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
      )
    `)
    const migrationsDir = join(getAppDir(), 'prisma', 'migrations')
    const folders = readdirSync(migrationsDir)
      .filter(f => !f.endsWith('.toml') && statSync(join(migrationsDir, f)).isDirectory())
      .sort()

    for (const migrationName of folders) {
      const applied = await client.query(
        `SELECT id FROM "_prisma_migrations" WHERE migration_name = $1 AND finished_at IS NOT NULL`,
        [migrationName]
      )
      if (applied.rows.length > 0) continue

      const sqlPath = join(migrationsDir, migrationName, 'migration.sql')
      const sql = readFileSync(sqlPath, 'utf-8')
      await client.query('BEGIN')
      try {
        await client.query(sql)
        await client.query(
          `INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, applied_steps_count) VALUES ($1, $2, now(), $3, 1)`,
          [randomUUID(), 'speeddansys-managed', migrationName]
        )
        await client.query('COMMIT')
      } catch (err) {
        await client.query('ROLLBACK')
        throw err
      }
    }
  } finally {
    await client.end()
  }
}

async function seedInitialDataCustom(creds: DbCredentials): Promise<void> {
  const client = new Client({ ...creds, database: DB_NAME, connectionTimeoutMillis: 10000 })
  await client.connect()
  try {
    // Rol Administrador
    const roleCheck = await client.query(`SELECT id FROM "Role" WHERE nombre = 'Administrador' LIMIT 1`)
    let roleId: number
    if (roleCheck.rows.length === 0) {
      const permisos = JSON.stringify([
        'clientes:ver', 'clientes:crear', 'clientes:editar', 'clientes:eliminar',
        'proveedores:ver', 'proveedores:crear', 'proveedores:editar', 'proveedores:eliminar',
        'empleados:ver', 'empleados:crear', 'empleados:editar', 'empleados:eliminar',
        'inventario:ver', 'inventario:ajustar', 'productos:crear', 'productos:editar', 'productos:eliminar',
        'compras:ver', 'compras:crear', 'compras:anular',
        'facturacion:ver', 'facturacion:emitir', 'facturacion:anular', 'facturacion:configurar',
        'reportes:ver', 'reportes:exportar',
        'seguridad:ver', 'seguridad:usuarios', 'seguridad:roles'
      ])
      const rol = await client.query(
        `INSERT INTO "Role" (nombre, descripcion, permisos, activo, "createdAt", "updatedAt") VALUES ($1, $2, $3, true, now(), now()) RETURNING id`,
        ['Administrador', 'Acceso completo al sistema', permisos]
      )
      roleId = rol.rows[0].id
    } else {
      roleId = roleCheck.rows[0].id
    }
    // Usuario admin
    const userCheck = await client.query(`SELECT id FROM "User" WHERE username = 'admin' LIMIT 1`)
    if (userCheck.rows.length === 0) {
      const passwordHash = await bcrypt.hash('Admin123!', 10)
      await client.query(
        `INSERT INTO "User" (nombre, username, "passwordHash", correo, "roleId", activo, tema, "createdAt", "updatedAt") VALUES ('Administrador', 'admin', $1, 'admin@speeddansys.com', $2, true, 'ocean-blue', now(), now())`,
        [passwordHash, roleId]
      )
    }
    // Categorías
    const categorias = ['General', 'Electrónica', 'Ropa y Calzado', 'Alimentos', 'Servicios', 'Tecnología', 'Hogar']
    for (const cat of categorias) {
      await client.query(`INSERT INTO "Categoria" (nombre, activa) VALUES ($1, true) ON CONFLICT (nombre) DO NOTHING`, [cat])
    }
  } finally {
    await client.end()
  }
}

// ══════════════════════════════════════════════════════════
// SETUP CON CREDENCIALES PERSONALIZADAS — llamar desde setup.ipc.ts
// ══════════════════════════════════════════════════════════
export async function setupDatabaseWithCredentials(creds: DbCredentials): Promise<SetupResult> {
  try {
    const dbExiste = await databaseExistsCustom(creds)
    if (dbExiste) {
      const tieneL = await hasActiveLicenseCustom(creds)
      if (!tieneL) {
        await dropDatabaseCustom(creds)
      }
    }
    await ensureDatabaseCustom(creds)
    await applyMigrationsCustom(creds)
    await seedInitialDataCustom(creds)
    const prismaPassword = normalizePrismaPassword(creds.password)
    const credsToSave = { ...creds, password: prismaPassword }
    saveCredentials(credsToSave)
    const databaseUrl = buildClientDbUrl(prismaPassword, creds.host, creds.port, creds.user)
    return { success: true, password: prismaPassword, databaseUrl }
  } catch (err: any) {
    return {
      success: false,
      password: creds.password,
      databaseUrl: '',
      error: `Error al preparar la base de datos: ${err?.message ?? String(err)}`
    }
  }
}

// ══════════════════════════════════════════════════════════
// FUNCIÓN PRINCIPAL — llamar desde index.ts
// ══════════════════════════════════════════════════════════
export interface SetupResult {
  success: boolean
  password: string
  databaseUrl: string
  error?: string
  needsInstall?: boolean
}

export async function setupDatabase(): Promise<SetupResult> {
  // 0. Intentar con credenciales guardadas de instalación anterior
  const savedCreds = loadSavedCredentials()
  // Ignorar credenciales guardadas con password vacío (Prisma no puede usarlas)
  if (savedCreds && savedCreds.password !== '') {
    const savedOk = await testPostgresConnectionCustom(savedCreds)
    if (savedOk) {
      // Usar las credenciales guardadas en el flujo normal
      try {
        const dbExiste = await databaseExistsCustom(savedCreds)
        if (dbExiste) {
          const tieneL = await hasActiveLicenseCustom(savedCreds)
          if (!tieneL) await dropDatabaseCustom(savedCreds)
        }
        await ensureDatabaseCustom(savedCreds)
        await applyMigrationsCustom(savedCreds)
        await seedInitialDataCustom(savedCreds)
        const databaseUrl = buildClientDbUrl(savedCreds.password, savedCreds.host, savedCreds.port, savedCreds.user)
        return { success: true, password: savedCreds.password, databaseUrl }
      } catch (err: any) {
        return { success: false, password: savedCreds.password, databaseUrl: '', error: `Error al preparar la base de datos: ${err?.message ?? String(err)}` }
      }
    }
  }

  // 1. Intentar conectar automáticamente con passwords comunes
  const password = await tryCommonPasswords()

  if (password === null) {
    // No se pudo conectar con ningún password conocido → pedir al usuario
    return {
      success: false,
      password: '',
      databaseUrl: '',
      needsInstall: true,
      error: 'No se pudo conectar a PostgreSQL. Verifique que PostgreSQL esté instalado y corriendo.'
    }
  }

  try {
    // 2. Verificar si la BD existe y tiene licencia activa
    const dbExiste = await databaseExists(password)
    if (dbExiste) {
      const tieneL = await hasActiveLicense(password)
      if (!tieneL) {
        // Sin licencia = instalación nueva o datos de prueba del desarrollador
        // → borrar y recrear limpia para que el cliente empiece con BD vacía
        await dropDatabase(password)
      }
      // Con licencia = actualización de cliente real → mantener sus datos
    }

    // 3. Crear la base de datos (si no existía o fue borrada)
    await ensureDatabase(password)

    // 4. Aplicar migraciones pendientes
    await applyMigrations(password)

    // 5. Seed datos mínimos: roles y categorías (el usuario se crea desde la licencia)
    await seedInitialData(password)

    // Normalizar password para que Prisma acepte la URL (trust auth → usar 'postgres')
    const prismaPassword = normalizePrismaPassword(password)
    const databaseUrl = buildClientDbUrl(prismaPassword)
    // Guardar las credenciales reales (no la normalizada) para próximas conexiones pg
    saveCredentials({ host: DEFAULT_HOST, port: DEFAULT_PORT, user: DEFAULT_USER, password: prismaPassword })
    return { success: true, password: prismaPassword, databaseUrl }
  } catch (err: any) {
    return {
      success: false,
      password: password,
      databaseUrl: '',
      error: `Error al preparar la base de datos: ${err?.message ?? String(err)}`
    }
  }
}

// ── Seed datos iniciales (roles, usuario admin, categorías) ──
async function seedInitialData(password = ''): Promise<void> {
  const client = new Client({
    host: DEFAULT_HOST,
    port: DEFAULT_PORT,
    user: DEFAULT_USER,
    password: password,
    database: DB_NAME,
    connectionTimeoutMillis: 4000
  })
  await client.connect()
  try {
    // Crear rol Administrador si no existe
    const roleCheck = await client.query(
      `SELECT id FROM "Role" WHERE nombre = 'Administrador' LIMIT 1`
    )
    let roleId: number
    if (roleCheck.rows.length === 0) {
      const permisos = JSON.stringify([
        'clientes:ver', 'clientes:crear', 'clientes:editar', 'clientes:eliminar',
        'proveedores:ver', 'proveedores:crear', 'proveedores:editar', 'proveedores:eliminar',
        'empleados:ver', 'empleados:crear', 'empleados:editar', 'empleados:eliminar',
        'inventario:ver', 'inventario:ajustar', 'productos:crear', 'productos:editar', 'productos:eliminar',
        'compras:ver', 'compras:crear', 'compras:anular',
        'facturacion:ver', 'facturacion:emitir', 'facturacion:anular', 'facturacion:configurar',
        'reportes:ver', 'reportes:exportar',
        'seguridad:ver', 'seguridad:usuarios', 'seguridad:roles'
      ])
      const rolResult = await client.query(
        `INSERT INTO "Role" (nombre, descripcion, permisos, activo, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, true, now(), now()) RETURNING id`,
        ['Administrador', 'Acceso completo al sistema', permisos]
      )
      roleId = rolResult.rows[0].id
    } else {
      roleId = roleCheck.rows[0].id
    }

    // Crear usuario administrador por defecto (admin / Admin123!)
    const userCheck = await client.query(
      `SELECT id FROM "User" WHERE username = 'admin' LIMIT 1`
    )
    if (userCheck.rows.length === 0) {
      const passwordHash = await bcrypt.hash('Admin123!', 10)
      await client.query(
        `INSERT INTO "User" (nombre, username, "passwordHash", correo, "roleId", activo, tema, "createdAt", "updatedAt")
         VALUES ('Administrador', 'admin', $1, 'admin@speeddansys.com', $2, true, 'ocean-blue', now(), now())`,
        [passwordHash, roleId]
      )
    }

    // Crear categorías de productos básicas
    const categorias = ['General', 'Electrónica', 'Ropa y Calzado', 'Alimentos', 'Servicios', 'Tecnología', 'Hogar']
    for (const cat of categorias) {
      await client.query(
        `INSERT INTO "Categoria" (nombre, activa) VALUES ($1, true) ON CONFLICT (nombre) DO NOTHING`,
        [cat]
      )
    }
  } finally {
    await client.end()
  }
}

// ── Mostrar diálogo de error si PostgreSQL no está instalado
export function showPostgresNotFoundDialog(): void {
  dialog.showMessageBoxSync({
    type: 'error',
    title: 'PostgreSQL Requerido',
    message: 'PostgreSQL no está instalado o no está corriendo.',
    detail:
      'Speeddansys ERP requiere PostgreSQL 14 o superior.\n\n' +
      'Por favor:\n' +
      '1. Descargue e instale PostgreSQL desde https://www.postgresql.org/download/windows/\n' +
      '2. Durante la instalación, recuerde la contraseña del usuario "postgres"\n' +
      '3. Asegúrese de que el servicio PostgreSQL esté iniciado\n' +
      '4. Vuelva a abrir Speeddansys ERP',
    buttons: ['Entendido']
  })
}

// ── Mostrar diálogo para ingresar contraseña manualmente ──
export function showPasswordPrompt(): string | null {
  // electron showMessageBox no soporta inputs — usaremos un dialog nativo básico
  const result = dialog.showMessageBoxSync({
    type: 'question',
    title: 'Contraseña de PostgreSQL',
    message: 'No se pudo conectar con las contraseñas predeterminadas.',
    detail:
      'Si su instalación de PostgreSQL tiene una contraseña personalizada,\n' +
      'configure la variable de entorno DATABASE_URL antes de abrir la aplicación.\n\n' +
      'Ejemplo: postgresql://postgres:SU_CONTRASENA@localhost:5432/cliente_db\n\n' +
      'Contacte a soporte@speeddansys.com si necesita ayuda.',
    buttons: ['Cerrar aplicación', 'Reintentar sin contraseña']
  })
  return result === 1 ? '' : null
}
