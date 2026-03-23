import { ipcMain } from 'electron'
import { Client } from 'pg'
import * as bcrypt from 'bcryptjs'
import { seguridadController } from '../controllers/seguridad.controller'

const ADMIN_PERMISOS = JSON.stringify([
  'clientes:ver', 'clientes:crear', 'clientes:editar', 'clientes:eliminar',
  'proveedores:ver', 'proveedores:crear', 'proveedores:editar', 'proveedores:eliminar',
  'empleados:ver', 'empleados:crear', 'empleados:editar', 'empleados:eliminar',
  'inventario:ver', 'inventario:ajustar', 'productos:crear', 'productos:editar', 'productos:eliminar',
  'compras:ver', 'compras:crear', 'compras:anular',
  'facturacion:ver', 'facturacion:emitir', 'facturacion:anular', 'facturacion:configurar',
  'reportes:ver', 'reportes:exportar',
  'seguridad:ver', 'seguridad:usuarios', 'seguridad:roles'
])

/**
 * Provisiona el usuario administrador inicial usando pg directamente (sin Prisma).
 * Crea o actualiza el rol Administrador y el usuario con las credenciales de la licencia.
 * Devuelve la sesión completa del usuario para auto-login inmediato.
 */
async function provisionUserWithPg(
  username: string,
  password: string
): Promise<{ ok: boolean; user?: UserSession; error?: string }> {
  const url = process.env['DATABASE_URL']
  if (!url) return { ok: false, error: 'DATABASE_URL no configurada' }

  const client = new Client({ connectionString: url, connectionTimeoutMillis: 8000 })
  await client.connect()

  try {
    // 1. Buscar o crear rol Administrador
    const roleCheck = await client.query(
      `SELECT id, permisos FROM "Role" WHERE nombre = 'Administrador' LIMIT 1`
    )
    let roleId: number
    let rolePermisos: string

    if (roleCheck.rows.length === 0) {
      const result = await client.query(
        `INSERT INTO "Role" (nombre, descripcion, permisos, activo, "createdAt", "updatedAt")
         VALUES ('Administrador', 'Acceso completo al sistema', $1, true, now(), now())
         RETURNING id`,
        [ADMIN_PERMISOS]
      )
      roleId = result.rows[0].id
      rolePermisos = ADMIN_PERMISOS
    } else {
      roleId = roleCheck.rows[0].id
      rolePermisos = roleCheck.rows[0].permisos
    }

    // 2. Hashear contraseña y crear/actualizar usuario
    const passwordHash = await bcrypt.hash(password, 10)
    const upsertResult = await client.query(
      `INSERT INTO "User" (nombre, username, "passwordHash", correo, "roleId", activo, tema, "createdAt", "updatedAt")
       VALUES ('Administrador', $1, $2, $3, $4, true, 'ocean-blue', now(), now())
       ON CONFLICT (username) DO UPDATE
         SET "passwordHash" = EXCLUDED."passwordHash",
             activo = true,
             "updatedAt" = now()
       RETURNING id, nombre, username, correo, "roleId", tema, "colorCustom"`,
      [username, passwordHash, `${username}@speeddansys.com`, roleId]
    )
    const u = upsertResult.rows[0]

    return {
      ok: true,
      user: {
        id: u.id,
        username: u.username,
        nombre: u.nombre,
        correo: u.correo ?? undefined,
        roleId: u.roleId,
        role: { id: roleId, nombre: 'Administrador', permisos: rolePermisos },
        tema: u.tema ?? 'ocean-blue',
        colorCustom: u.colorCustom ?? null
      }
    }
  } catch (err: any) {
    console.error('[provisionUser pg] Error:', err)
    return { ok: false, error: err?.message ?? 'Error al provisionar usuario' }
  } finally {
    await client.end().catch(() => {})
  }
}

export function registerSeguridadIPC() {
  // Usuarios
  ipcMain.handle('seguridad:listarUsuarios', (_, page, pageSize, busqueda) =>
    seguridadController.listarUsuarios(page, pageSize, busqueda))

  ipcMain.handle('seguridad:crearUsuario', (_, data) =>
    seguridadController.crearUsuario(data))

  ipcMain.handle('seguridad:actualizarUsuario', (_, id, data) =>
    seguridadController.actualizarUsuario(id, data))

  ipcMain.handle('seguridad:desactivarUsuario', (_, id) =>
    seguridadController.desactivarUsuario(id))

  // Roles
  ipcMain.handle('seguridad:listarRoles', () =>
    seguridadController.listarRoles())

  ipcMain.handle('seguridad:crearRol', (_, data) =>
    seguridadController.crearRol(data))

  ipcMain.handle('seguridad:actualizarRol', (_, id, data) =>
    seguridadController.actualizarRol(id, data))

  ipcMain.handle('seguridad:eliminarRol', (_, id) =>
    seguridadController.eliminarRol(id))

  // Auth
  ipcMain.handle('seguridad:login', async (_, username, password) => {
    try {
      console.log('[seguridad:login] DATABASE_URL =', process.env['DATABASE_URL']?.replace(/:[^@]+@/, ':***@'))
      return await seguridadController.login(username, password)
    } catch (err: unknown) {
      console.error('[seguridad:login] Error:', err)
      throw err
    }
  })

  // Provisionamiento de usuario inicial (activación de licencia) — usa pg directamente
  ipcMain.handle('seguridad:provisionUser', (_, username: string, password: string) =>
    provisionUserWithPg(username, password))

  // Tema
  ipcMain.handle('seguridad:guardarTema', (_, userId, tema, colorCustom) =>
    seguridadController.guardarTema(userId, tema, colorCustom))
}
