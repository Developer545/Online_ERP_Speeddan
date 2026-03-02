/**
 * Script Seed para generar 100 proveedores de prueba
 * Proveedores salvadoreños de diversos sectores
 * 
 * Ejecutar: npx ts-node prisma/seed-proveedores.ts
 * O agregar al package.json: "seed:proveedores": "ts-node prisma/seed-proveedores.ts"
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// Nombres de proveedores salvadoreños
const NOMBRES_PROVEEDORES = [
  'Distribuidora Metropolitana SA', 'Importadora Central SV', 'Proveedora Agrícola',
  'Textiles Salvadoreños', 'Manufactura Industrial', 'Equipos y Maquinaria',
  'Materiales de Construcción', 'Químicos Industriales', 'Alimentos Procesados',
  'Bebidas Refrescantes', 'Farmacéutica Central', 'Laboratorios Médicos',
  'Tecnología e Informática', 'Electrónica Salvadoreña', 'Telecomunicaciones',
  'Servicios de Energía', 'Agua Potable SV', 'Combustibles Salvadoreños',
  'Lubricantes Industriales', 'Productos de Limpieza', 'Sanitarios y Higiene',
  'Papelería Comercial', 'Empaques y Envases', 'Plásticos Industriales',
  'Madera y Derivados', 'Vidrio y Cristal', 'Acero Estructural',
  'Cerámicas y Azulejos', 'Tuberías y Conexiones', 'Herramientas y Tornillería',
  'Equipo de Seguridad', 'Uniformes de Trabajo', 'Mobiliario para Oficina',
  'Muebles Especializados', 'Artículos de Ferretería', 'Pinturas y Recubrimientos',
  'Adhesivos Industriales', 'Solventes y Disolventes', 'Lubricantes Automotrices',
  'Repuestos Automotrices', 'Llantas y Cauchos', 'Baterías Automotrices',
  'Acumuladores Industriales', 'Paneles Solares', 'Cables Eléctricos',
  'Transformadores Eléctricos', 'Generadores Diesel', 'Motores Eléctricos',
  'Compresores de Aire', 'Bombas Hidráulicas', 'Válvulas de Control',
  'Medidores y Sensores', 'Instrumentación Industrial', 'Sistemas de Refrigeración',
  'Equipo de Calefacción', 'Aires Acondicionados', 'Ventiladores Industriales'
]

// Tipos de proveedores
const TIPOS_PROVEEDORES = ['NACIONAL', 'IMPORTADOR', 'FABRICANTE', 'DISTRIBUIDOR', 'MAYORISTA']

// Apellidos para contactos
const APELLIDOS = [
  'Gutiérrez', 'López', 'García', 'Martínez', 'Rodríguez', 'Hernández', 'González', 'Pérez',
  'Flores', 'Morales', 'Vega', 'Castro', 'Molina', 'Reyes', 'Soto', 'Romero',
  'Rivera', 'Navarro', 'Fuentes', 'Ríos', 'Salazar', 'Córdova', 'Medina', 'Vargas'
]

const NOMBRES = [
  'Carlos', 'Juan', 'José', 'Roberto', 'Manuel', 'Miguel', 'Antonio', 'Fernando',
  'Angel', 'Ramón', 'Ricardo', 'Ernesto', 'Javier', 'Luis', 'Oscar', 'Julio'
]

// Departamentos
const DEPARTAMENTOS = [
  '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14'
]

const MUNICIPIOS: { [key: string]: string[] } = {
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

function generarNIT(): string {
  const numeros = Math.floor(Math.random() * 9999999).toString().padStart(7, '0')
  const verificador = Math.floor(Math.random() * 9)
  return `${numeros}-${verificador}`
}

function generarNRC(): string {
  return Math.floor(Math.random() * 999999).toString().padStart(6, '0')
}

function generarTelefono(): string {
  const operadores = ['2', '6', '7']
  const operador = operadores[Math.floor(Math.random() * operadores.length)]
  const numeros = Math.floor(Math.random() * 10000000).toString().padStart(7, '0')
  return `${operador}${numeros}`
}

function generarCorreo(nombre: string): string {
  const dominios = ['gmail.com', 'hotmail.com', 'yahoo.es', 'outlook.com', 'company.sv']
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
  const municipios = MUNICIPIOS[depto] || [depto]
  const municipio = municipios[Math.floor(Math.random() * municipios.length)]
  return { depto, municipio }
}

function crearProveedor(index: number) {
  const nombre = NOMBRES_PROVEEDORES[index % NOMBRES_PROVEEDORES.length]
  const contacto = `${NOMBRES[Math.floor(Math.random() * NOMBRES.length)]} ${APELLIDOS[Math.floor(Math.random() * APELLIDOS.length)]}`
  const { depto, municipio } = obtenerDeptoYMunicipio()
  const tipo = TIPOS_PROVEEDORES[Math.floor(Math.random() * TIPOS_PROVEEDORES.length)]

  return {
    nombre: `${nombre} - ${index + 1}`,
    nit: generarNIT(),
    nrc: generarNRC(),
    correo: generarCorreo(nombre),
    telefono: generarTelefono(),
    tipoProveedor: tipo,
    contacto,
    plazoCredito: [0, 7, 15, 30, 45, 60][Math.floor(Math.random() * 6)],
    direccion: `Zona Industrial ${index + 1}, ${municipio}`,
    departamentoCod: depto,
    municipioCod: municipio,
    activo: true
  }
}

export async function seedProveedores() {
  try {
    console.log('🌱 Iniciando seed de 100 proveedores...')

    const proveedores = []

    // Generar 100 proveedores
    console.log('🏭 Generando 100 proveedores salvadoreños...')
    for (let i = 0; i < 100; i++) {
      proveedores.push(crearProveedor(i))
    }

    // Insertar en base de datos
    console.log('📝 Insertando proveedores en la base de datos...')
    let insertados = 0
    let errores = 0

    for (const proveedor of proveedores) {
      try {
        await db.proveedor.create({
          data: proveedor
        })
        insertados++
        if (insertados % 25 === 0) {
          console.log(`   ✓ ${insertados} proveedores insertados...`)
        }
      } catch (error: any) {
        errores++
        if (!error.message.includes('Unique constraint failed')) {
          console.error(`   ✗ Error: ${error.message}`)
        }
      }
    }

    console.log(`\n✅ Seed de proveedores completado:`)
    console.log(`   ✓ ${insertados} proveedores insertados correctamente`)
    if (errores > 0) {
      console.log(`   ⚠️  ${errores} proveedores omitidos (posibles duplicados)`)
    }

    const total = await db.proveedor.count()
    console.log(`   📊 Total de proveedores: ${total}`)

    // Estadísticas por tipo
    const porTipo = await db.proveedor.groupBy({
      by: ['tipoProveedor'],
      _count: true
    })
    console.log(`\n   Por tipo de proveedor:`)
    porTipo.forEach(tipo => {
      console.log(`      - ${tipo.tipoProveedor}: ${tipo._count}`)
    })
  } catch (error) {
    console.error('❌ Error en seed de proveedores:', error)
    throw error
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedProveedores()
    .catch(console.error)
    .finally(() => db.$disconnect())
}
