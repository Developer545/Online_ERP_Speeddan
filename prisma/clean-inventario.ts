/**
 * Script: Limpieza de tablas de Inventario y Productos — DB Pruebas
 * Base de datos: speeddansys_dev (entorno de pruebas)
 *
 * Elimina en orden correcto para respetar foreign keys:
 *   1. Kardex (movimientos de inventario)
 *   2. DetalleCompra (detalles de compras)
 *   3. DetalleFactura (detalles de facturas)
 *   4. Producto (productos)
 *   5. Categoria (categorías — opcional, solo si lo indica el usuario)
 *
 * Ejecutar: npx tsx prisma/clean-inventario.ts
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function limpiarInventario() {
    console.log('🧹 Iniciando limpieza de tablas de inventario y productos...')
    console.log('📦 Base de datos: speeddansys_dev (PRUEBAS)\n')

    try {
        // ── 1. Conteo previo ──────────────────────────────────────
        const [kardexPrev, detCompPrev, detFacPrev, prodPrev, catPrev] = await Promise.all([
            db.kardex.count(),
            db.detalleCompra.count(),
            db.detalleFactura.count(),
            db.producto.count(),
            db.categoria.count()
        ])

        console.log('📊 Estado ANTES de la limpieza:')
        console.log(`   Kardex (movimientos):    ${kardexPrev}`)
        console.log(`   DetalleCompra:           ${detCompPrev}`)
        console.log(`   DetalleFactura:          ${detFacPrev}`)
        console.log(`   Productos:               ${prodPrev}`)
        console.log(`   Categorías:              ${catPrev}`)
        console.log('')

        // ── 2. Eliminar en orden de dependencias ──────────────────
        console.log('🗑️  Eliminando registros...')

        const delKardex = await db.kardex.deleteMany({})
        console.log(`   ✓ Kardex eliminados:         ${delKardex.count}`)

        const delDetalleCompra = await db.detalleCompra.deleteMany({})
        console.log(`   ✓ DetalleCompra eliminados:  ${delDetalleCompra.count}`)

        const delDetalleFactura = await db.detalleFactura.deleteMany({})
        console.log(`   ✓ DetalleFactura eliminados: ${delDetalleFactura.count}`)

        const delProductos = await db.producto.deleteMany({})
        console.log(`   ✓ Productos eliminados:      ${delProductos.count}`)

        const delCategorias = await db.categoria.deleteMany({})
        console.log(`   ✓ Categorías eliminadas:     ${delCategorias.count}`)

        // ── 3. Verificación final ─────────────────────────────────
        const [kardexPost, prodPost, catPost] = await Promise.all([
            db.kardex.count(),
            db.producto.count(),
            db.categoria.count()
        ])

        console.log('\n✅ Limpieza completada con éxito.')
        console.log('📊 Estado DESPUÉS de la limpieza:')
        console.log(`   Kardex:    ${kardexPost}`)
        console.log(`   Productos: ${prodPost}`)
        console.log(`   Categorías: ${catPost}`)
        console.log('\n💡 Listo para ejecutar el nuevo seed de productos tech.')

    } catch (error: any) {
        console.error('\n❌ Error durante la limpieza:', error.message)
        console.error(error)
        throw error
    }
}

if (require.main === module) {
    limpiarInventario()
        .catch(console.error)
        .finally(() => db.$disconnect())
}

export { limpiarInventario }
