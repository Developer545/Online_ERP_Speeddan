// Seed inicial — datos de prueba para desarrollo
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { seedProveedores } from './seed-proveedores'
import { seedEmpleados } from './seed-empleados'
import { seedProductos } from './seed-productos'

const db = new PrismaClient()

async function main() {
  console.log('Iniciando seed de base de datos...')

  // Rol administrador
  const rolAdmin = await db.role.upsert({
    where: { nombre: 'Administrador' },
    update: {},
    create: {
      nombre: 'Administrador',
      descripcion: 'Acceso completo al sistema',
      permisos: JSON.stringify([
        'clientes:ver', 'clientes:crear', 'clientes:editar', 'clientes:eliminar',
        'proveedores:ver', 'proveedores:crear', 'proveedores:editar', 'proveedores:eliminar',
        'empleados:ver', 'empleados:crear', 'empleados:editar', 'empleados:eliminar',
        'inventario:ver', 'inventario:ajustar', 'productos:crear', 'productos:editar', 'productos:eliminar',
        'compras:ver', 'compras:crear', 'compras:anular',
        'facturacion:ver', 'facturacion:emitir', 'facturacion:anular', 'facturacion:configurar',
        'reportes:ver', 'reportes:exportar',
        'seguridad:ver', 'seguridad:usuarios', 'seguridad:roles'
      ])
    }
  })

  // Rol cajero
  await db.role.upsert({
    where: { nombre: 'Cajero' },
    update: {},
    create: {
      nombre: 'Cajero',
      descripcion: 'Puede emitir facturas y ver productos',
      permisos: JSON.stringify([
        'clientes:ver', 'clientes:crear',
        'inventario:ver',
        'facturacion:ver', 'facturacion:emitir'
      ])
    }
  })

  // Usuario administrador por defecto
  await db.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      nombre: 'Administrador',
      username: 'admin',
      passwordHash: await bcrypt.hash('Admin123!', 10),
      correo: 'admin@speeddansys.com',
      roleId: rolAdmin.id,
      activo: true
    }
  })

  // Categorías de productos
  await db.categoria.createMany({
    skipDuplicates: true,
    data: [
      { nombre: 'General' },
      { nombre: 'Electrónica' },
      { nombre: 'Ropa y Calzado' },
      { nombre: 'Alimentos' },
      { nombre: 'Servicios' },
      { nombre: 'Tecnología' },
      { nombre: 'Hogar' }
    ]
  })

  console.log('✓ Seed completado exitosamente')
  console.log('  Usuario: admin | Contraseña: Admin123!')
  
  // Ejecutar seeds de proveedores, empleados y productos
  console.log('\n--- Ejecutando seeds adicionales ---\n')
  await seedProveedores()
  await seedEmpleados()
  await seedProductos()
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
