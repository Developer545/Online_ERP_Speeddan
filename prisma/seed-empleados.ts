/**
 * Script Seed para generar 50 empleados de prueba
 * Empleados salvadoreños con diversos cargos
 * 
 * Ejecutar: npx ts-node prisma/seed-empleados.ts
 * O agregar al package.json: "seed:empleados": "ts-node prisma/seed-empleados.ts"
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// Nombres salvadoreños
const NOMBRES = [
  'Carlos', 'Juan', 'José', 'Roberto', 'Manuel', 'Miguel', 'Antonio', 'Fernando',
  'Angel', 'Ramón', 'Ricardo', 'Ernesto', 'Javier', 'Luis', 'Oscar', 'Julio',
  'Humberto', 'Alfredo', 'Pedro', 'Sergio', 'Eduardo', 'Raúl', 'Alonso', 'Guillermo',
  'Víctor', 'Rogelio', 'Wilmer', 'Walter', 'Teodoro', 'Marvin', 'María', 'Rosa',
  'Carmen', 'Ana', 'Isabel', 'Martha', 'Patricia', 'Teresa', 'Miriam', 'Sandra',
  'Claudia', 'Gloria', 'Silvia', 'Mónica', 'Elena', 'Lidia', 'Raquel', 'Susana',
  'Beatriz', 'Verónica', 'Victoria'
]

const APELLIDOS = [
  'Gutiérrez', 'López', 'García', 'Martínez', 'Rodríguez', 'Hernández', 'González', 'Pérez',
  'Flores', 'Morales', 'Vega', 'Castro', 'Molina', 'Reyes', 'Soto', 'Romero',
  'Rivera', 'Navarro', 'Fuentes', 'Ríos', 'Salazar', 'Córdova', 'Medina', 'Vargas',
  'Campos', 'Gómez', 'Fernández', 'Torres', 'Díaz', 'Ramírez', 'Alvarez', 'Chávez'
]

// Cargos disponibles
const CARGOS = [
  'Gerente General',
  'Gerente de Ventas',
  'Gerente de Operaciones',
  'Gerente de Recursos Humanos',
  'Gerente de Finanzas',
  'Jefe de Almacén',
  'Contador',
  'Asistente Contable',
  'Asesor de Ventas',
  'Ejecutivo de Ventas',
  'Vendedor',
  'Operario de Almacén',
  'Encargado de Inventario',
  'Técnico de Sistemas',
  'Asistente de Sistemas',
  'Recepcionista',
  'Secretaria Ejecutiva',
  'Asistente Administrativo',
  'Conductor',
  'Mensajero',
  'Especialista en Marketing',
  'Community Manager',
  'Analista de Sistemas',
  'Programador',
  'Diseñador Gráfico',
  'Cajero',
  'Cobranza',
  'Auditor Interno',
  'Inspector de Calidad',
  'Supervisor de Producción'
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

// Salarios base por cargo (en USD)
const SALARIOS_BASE: { [key: string]: number } = {
  'Gerente General': 4500,
  'Gerente de Ventas': 3500,
  'Gerente de Operaciones': 3500,
  'Gerente de Recursos Humanos': 3200,
  'Gerente de Finanzas': 3500,
  'Jefe de Almacén': 2000,
  'Contador': 2200,
  'Asistente Contable': 1200,
  'Asesor de Ventas': 1500,
  'Ejecutivo de Ventas': 1800,
  'Vendedor': 1200,
  'Operario de Almacén': 900,
  'Encargado de Inventario': 1300,
  'Técnico de Sistemas': 1600,
  'Asistente de Sistemas': 1000,
  'Recepcionista': 900,
  'Secretaria Ejecutiva': 1100,
  'Asistente Administrativo': 900,
  'Conductor': 1000,
  'Mensajero': 800,
  'Especialista en Marketing': 1800,
  'Community Manager': 1300,
  'Analista de Sistemas': 1800,
  'Programador': 2000,
  'Diseñador Gráfico': 1500,
  'Cajero': 900,
  'Cobranza': 1000,
  'Auditor Interno': 1700,
  'Inspector de Calidad': 1100,
  'Supervisor de Producción': 1600
}

function generarDUI(): string {
  const numeros = Math.floor(Math.random() * 99999999).toString().padStart(8, '0')
  const verificador = Math.floor(Math.random() * 9)
  return `${numeros}-${verificador}`
}

function generarNIT(): string {
  const numeros = Math.floor(Math.random() * 9999999).toString().padStart(7, '0')
  const verificador = Math.floor(Math.random() * 9)
  return `${numeros}-${verificador}`
}

function generarTelefono(): string {
  const operadores = ['2', '6', '7']
  const operador = operadores[Math.floor(Math.random() * operadores.length)]
  const numeros = Math.floor(Math.random() * 10000000).toString().padStart(7, '0')
  return `${operador}${numeros}`
}

function generarCorreo(nombre: string): string {
  const dominios = ['gmail.com', 'hotmail.com', 'company.sv', 'outlook.com']
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

function crearEmpleado(index: number) {
  const nombre = NOMBRES[Math.floor(Math.random() * NOMBRES.length)]
  const apellido1 = APELLIDOS[Math.floor(Math.random() * APELLIDOS.length)]
  const apellido2 = APELLIDOS[Math.floor(Math.random() * APELLIDOS.length)]
  const nombreCompleto = `${nombre} ${apellido1} ${apellido2}`
  const cargo = CARGOS[index % CARGOS.length]
  const { depto, municipio } = obtenerDeptoYMunicipio()

  // Salary con pequeña variación
  const salarioBase = SALARIOS_BASE[cargo] || 1200
  const salario = salarioBase + Math.floor(Math.random() * 300) - 150

  // Fecha de ingreso entre hace 1 y 5 años
  const diasAtras = Math.floor(Math.random() * (365 * 5 - 365)) + 365
  const fechaIngreso = new Date()
  fechaIngreso.setDate(fechaIngreso.getDate() - diasAtras)

  return {
    nombre: nombreCompleto,
    dui: generarDUI(),
    nit: generarNIT(),
    correo: generarCorreo(nombre),
    telefono: generarTelefono(),
    cargo,
    salario,
    fechaIngreso: fechaIngreso,
    departamentoCod: depto,
    municipioCod: municipio,
    direccion: `Residencial ${municipio}, Calle Principal ${index + 1}`,
    activo: true
  }
}

export async function seedEmpleados() {
  try {
    console.log('🌱 Iniciando seed de 50 empleados...')

    const empleados = []

    // Generar 50 empleados
    console.log('👥 Generando 50 empleados salvadoreños...')
    for (let i = 0; i < 50; i++) {
      empleados.push(crearEmpleado(i))
    }

    // Insertar en base de datos
    console.log('📝 Insertando empleados en la base de datos...')
    let insertados = 0
    let errores = 0

    for (const empleado of empleados) {
      try {
        await db.empleado.create({
          data: empleado
        })
        insertados++
        if (insertados % 10 === 0) {
          console.log(`   ✓ ${insertados} empleados insertados...`)
        }
      } catch (error: any) {
        errores++
        if (!error.message.includes('Unique constraint failed')) {
          console.error(`   ✗ Error: ${error.message}`)
        }
      }
    }

    console.log(`\n✅ Seed de empleados completado:`)
    console.log(`   ✓ ${insertados} empleados insertados correctamente`)
    if (errores > 0) {
      console.log(`   ⚠️  ${errores} empleados omitidos (posibles duplicados)`)
    }

    const total = await db.empleado.count()
    console.log(`   📊 Total de empleados: ${total}`)

    // Estadísticas por cargo
    const porCargo = await db.empleado.groupBy({
      by: ['cargo'],
      _count: true,
      _avg: {
        salario: true
      }
    })
    console.log(`\n   Por cargo (Top 10):`)
    porCargo.slice(0, 10).forEach(cargo => {
      const salarioPromedio = (cargo._avg.salario || 0).toFixed(2)
      console.log(`      - ${cargo.cargo}: ${cargo._count} empleados | Salario promedio: $${salarioPromedio}`)
    })
  } catch (error) {
    console.error('❌ Error en seed de empleados:', error)
    throw error
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedEmpleados()
    .catch(console.error)
    .finally(() => db.$disconnect())
}
