/**
 * Script Seed para generar 200 clientes de prueba
 * - 100 Personas Naturales (DUI)
 * - 100 Personas Jurídicas (NIT)
 * 
 * Ejecutar: npx ts-node prisma/seed-clientes.ts
 * O agregar al package.json: "seed:clientes": "ts-node prisma/seed-clientes.ts"
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// Nombres salvadoreños (personas naturales)
const NOMBRES_PERSONAS = [
  // Nombres masculinos
  'Carlos', 'Juan', 'José', 'Roberto', 'Manuel', 'Miguel', 'Antonio', 'Francisco',
  'Fernando', 'Angel', 'Ramón', 'Ricardo', 'Ernesto', 'Javier', 'Luis', 'Oscar',
  'Julio', 'Humberto', 'Alfredo', 'Pedro', 'Sergio', 'Eduardo', 'Raúl', 'Alonso',
  'Guillermo', 'Víctor', 'Rogelio', 'Wilmer', 'Walter', 'Teodoro', 'Marvin', 'Reynaldo',
  'Melvin', 'Rigoberto', 'Salvador', 'Efraín', 'Jesús', 'Silvio', 'Adalberto', 'Froilán',
  'Celestino', 'Donato', 'Eucario', 'Florentino', 'Gilberto', 'Gumersindo', 'Heberto', 'Ildefonso',
  // Nombres femeninos
  'María', 'Rosa', 'Carmen', 'Ana', 'Isabel', 'Martha', 'Patricia', 'Teresa',
  'Francisco', 'Miriam', 'Sandra', 'Claudia', 'Gloria', 'Silvia', 'Mónica', 'Elena',
  'Lidia', 'Raquel', 'Susana', 'Beatriz', 'Verónica', 'Victoria', 'Yolanda', 'Zoila',
  'Ximena', 'Wendy', 'Vanessa', 'Ursaline', 'Tomasa', 'Sofía', 'Rosario', 'Quintina',
  'Pamela', 'Olga', 'Norma', 'Magdalena', 'Lorena', 'Karina', 'Julia', 'Iris',
  'Hortensia', 'Graciela', 'Francisca', 'Esperanza', 'Diana', 'Cecilia', 'Brenda', 'Aurora'
]

const APELLIDOS_SALVADORENOS = [
  'Gutiérrez', 'López', 'García', 'Martínez', 'Rodríguez', 'Hernández', 'González', 'Pérez',
  'Flores', 'Morales', 'Vega', 'Castro', 'Molina', 'Reyes', 'Soto', 'Romero',
  'Rivera', 'Navarro', 'Fuentes', 'Ríos', 'Salazar', 'Córdova', 'Medina', 'Vargas',
  'Campos', 'Gómez', 'Fernández', 'Torres', 'Díaz', 'Ramírez', 'Alvarez', 'Chávez',
  'Acosta', 'Aguilar', 'Andino', 'Argueta', 'Ayala', 'Bazán', 'Benítez', 'Bernal',
  'Blanco', 'Bonilla', 'Boyes', 'Brenes', 'Cáceres', 'Camacho', 'Canales', 'Carballo',
  'Carranza', 'Carrillo', 'Carvajal', 'Cascante', 'Castellanos', 'Castilla', 'Castillo',
  'Catalán', 'Catán', 'Cerna', 'Cervantes', 'Cifuentes', 'Cisneros', 'Cladera', 'Claramunt',
  'Clará', 'Claros', 'Claveriano', 'Clemente', 'Colocho', 'Colon', 'Copete', 'Córdoba'
]

// Nombres de empresas salvadoreñas (variados sectores)
const NOMBRES_EMPRESAS = [
  'Tech Solutions El Salvador', 'Construcciones Salvadoreñas SA', 'Distribuidora Central',
  'Servicios Integrales', 'Comercial Metropolitana', 'Industrias Salvadoreñas',
  'Transportes Rápidos', 'Almacenes Globales', 'Soluciones a Medida',
  'Comercio Exterior SV', 'Consultores de Negocios', 'Importadora Central',
  'Exportadora Cafetalera', 'Manufacturas Locales', 'Distribución Regional',
  'Servicios Técnicos', 'Automatización Industrial', 'Consultoría Empresarial',
  'Inversiones Salvadoreñas', 'Capital Financiero', 'Negocios Integrales',
  'Productor Agrícola SV', 'Procesadora de Alimentos', 'Energías Renovables',
  'Telecomunicaciones', 'Publicidad y Marketing', 'Agencia Digital',
  'Restaurantes Unidos', 'Hotel Continental', 'Transporte Turístico',
  'Textiles Exportadora', 'Muebles Salvadoreños', 'Herramientas Industriales',
  'Equipos Electrónicos', 'Farmacéutica Central', 'Laboratorio Médico',
  'Clínica Especializada', 'Seguros Salvadoreños', 'Corretaje de Seguros'
]

// Departamentos de El Salvador
const DEPARTAMENTOS = [
  { cod: '01', nombre: 'Ahuachapán' },
  { cod: '02', nombre: 'Santa Ana' },
  { cod: '03', nombre: 'Sonsonate' },
  { cod: '04', nombre: 'Chalatenango' },
  { cod: '05', nombre: 'La Libertad' },
  { cod: '06', nombre: 'San Salvador' },
  { cod: '07', nombre: 'Cuscatlán' },
  { cod: '08', nombre: 'La Paz' },
  { cod: '09', nombre: 'Cabañas' },
  { cod: '10', nombre: 'San Vicente' },
  { cod: '11', nombre: 'Usulután' },
  { cod: '12', nombre: 'San Miguel' },
  { cod: '13', nombre: 'Morazán' },
  { cod: '14', nombre: 'La Unión' }
]

// Municipios principales por departamento (simplificado)
const MUNICIPIOS_POR_DEPTO: { [key: string]: string[] } = {
  '01': ['Ahuachapán', 'Atiquizaya', 'Tacuba', 'Jujutla'],
  '02': ['Santa Ana', 'Metapán', 'Chalchuapa', 'Texistepeque'],
  '03': ['Sonsonate', 'Izalco', 'Nahuizalco', 'Santa Catarina Masahuat'],
  '04': ['Chalatenango', 'Nueva Concepción', 'La Palma', 'Arcatao'],
  '05': ['Santa Tecla', 'La Libertad', 'Antiguo Cuscatlán', 'San Juan Opico'],
  '06': ['San Salvador', 'Mejicanos', 'Cuscatancingo', 'Delgado'],
  '07': ['Cuscatlán', 'Candelaria', 'Tenancingo', 'San Cristóbal'],
  '08': ['Zacatecoluca', 'San Pedro Nonualco', 'Paraíso de Osorio', 'San Luis Talpa'],
  '09': ['Sensuntepeque', 'Dolores', 'Ilobasco', 'Victoria'],
  '10': ['San Vicente', 'Verapaz', 'Guadalupe', 'Apastepeque'],
  '11': ['Usulután', 'Puerto El Triunfo', 'San Alejo', 'Jiquilisco'],
  '12': ['San Miguel', 'Ciudad Barrios', 'El Transito', 'Chapeltique'],
  '13': ['San Francisco Gotera', 'Morazán', 'Joateca', 'Cacaopera'],
  '14': ['La Unión', 'Conchagua', 'Yayantique', 'San José La Fuente']
}

function generarDUI(): string {
  // Formato: 00000000-0 (8 dígitos + guión + verificador)
  const numeros = Math.floor(Math.random() * 99999999).toString().padStart(8, '0')
  const verificador = Math.floor(Math.random() * 9)
  return `${numeros}-${verificador}`
}

function generarNIT(): string {
  // Formato: 0000000-0 (7 dígitos + guión + verificador)
  const numeros = Math.floor(Math.random() * 9999999).toString().padStart(7, '0')
  const verificador = Math.floor(Math.random() * 9)
  return `${numeros}-${verificador}`
}

function generarNRC(): string {
  // Formato: 000000 (6 dígitos)
  return Math.floor(Math.random() * 999999).toString().padStart(6, '0')
}

function generarTelefono(): string {
  const operadores = ['2', '6', '7'] // Claro, Digicel, Tigo
  const operador = operadores[Math.floor(Math.random() * operadores.length)]
  const numeros = Math.floor(Math.random() * 10000000).toString().padStart(7, '0')
  return `${operador}${numeros}`
}

function generarCorreo(nombre: string, tipo: 'persona' | 'empresa'): string {
  const dominios = ['gmail.com', 'hotmail.com', 'yahoo.es', 'outlook.com']
  const dominio = dominios[Math.floor(Math.random() * dominios.length)]
  const user = nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '.')
  const random = Math.floor(Math.random() * 1000)
  return `${user}${random}@${dominio}`
}

function obtenerDeptoYMunicipio(): { depto: string; municipio: string } {
  const depto = DEPARTAMENTOS[Math.floor(Math.random() * DEPARTAMENTOS.length)]
  const municipios = MUNICIPIOS_POR_DEPTO[depto.cod] || [depto.nombre]
  const municipio = municipios[Math.floor(Math.random() * municipios.length)]
  return { depto: depto.cod, municipio }
}

function crearPersonaNatural(index: number) {
  const nombre1 = NOMBRES_PERSONAS[Math.floor(Math.random() * NOMBRES_PERSONAS.length)]
  const apellido1 = APELLIDOS_SALVADORENOS[Math.floor(Math.random() * APELLIDOS_SALVADORENOS.length)]
  const apellido2 = APELLIDOS_SALVADORENOS[Math.floor(Math.random() * APELLIDOS_SALVADORENOS.length)]
  const nombre = `${nombre1} ${apellido1} ${apellido2}`
  const { depto, municipio } = obtenerDeptoYMunicipio()

  return {
    tipoDocumento: 'DUI',
    numDocumento: generarDUI(),
    nombre,
    nombreComercial: null,
    nrc: null,
    correo: generarCorreo(nombre.split(' ')[0], 'persona'),
    telefono: generarTelefono(),
    departamentoCod: depto,
    municipioCod: municipio,
    complemento: `Casa, Barrio, Frente a...`,
    activo: true
  }
}

function crearPersonaJuridica(index: number) {
  const nombreEmpresa = NOMBRES_EMPRESAS[Math.floor(Math.random() * NOMBRES_EMPRESAS.length)]
  const { depto, municipio } = obtenerDeptoYMunicipio()

  return {
    tipoDocumento: 'NIT',
    numDocumento: generarNIT(),
    nombre: nombreEmpresa,
    nombreComercial: `${nombreEmpresa} - Sucursal SV`,
    nrc: generarNRC(),
    correo: generarCorreo(nombreEmpresa.split(' ')[0], 'empresa'),
    telefono: generarTelefono(),
    departamentoCod: depto,
    municipioCod: municipio,
    complemento: 'Ubicado en zona comercial',
    activo: true
  }
}

async function main() {
  try {
    console.log('🌱 Iniciando seed de 200 clientes...')

    const clientes = []

    // Generar 100 personas naturales
    console.log('👤 Generando 100 personas naturales...')
    for (let i = 0; i < 100; i++) {
      clientes.push(crearPersonaNatural(i))
    }

    // Generar 100 personas jurídicas
    console.log('🏢 Generando 100 personas jurídicas...')
    for (let i = 0; i < 100; i++) {
      clientes.push(crearPersonaJuridica(i))
    }

    // Insertar en base de datos
    console.log('📝 Insertando clientes en la base de datos...')
    let insertados = 0
    let errores = 0

    for (const cliente of clientes) {
      try {
        await db.cliente.create({
          data: cliente
        })
        insertados++
        if (insertados % 20 === 0) {
          console.log(`   ✓ ${insertados} clientes insertados...`)
        }
      } catch (error: any) {
        errores++
        // Ignorar duplicados
        if (!error.message.includes('Unique constraint failed')) {
          console.error(`   ✗ Error al insertar cliente: ${error.message}`)
        }
      }
    }

    console.log(`\n✅ Seed completado:`)
    console.log(`   ✓ ${insertados} clientes insertados correctamente`)
    if (errores > 0) {
      console.log(`   ⚠️  ${errores} clientes omitidos (posibles duplicados)`)
    }
    console.log(`   📊 Total de clientes en base de datos:`)

    const total = await db.cliente.count()
    const persona = await db.cliente.count({ where: { tipoDocumento: 'DUI' } })
    const juridica = await db.cliente.count({ where: { tipoDocumento: 'NIT' } })

    console.log(`      - Personas naturales (DUI): ${persona}`)
    console.log(`      - Personas jurídicas (NIT): ${juridica}`)
    console.log(`      - Total: ${total}`)
  } catch (error) {
    console.error('❌ Error en seed:', error)
    process.exit(1)
  } finally {
    await db.$disconnect()
  }
}

main()
