/**
 * Script Seed para generar 100+ productos de prueba
 * Productos variados de diferentes categorías
 * 
 * Ejecutar: npx ts-node prisma/seed-productos.ts
 * O agregar al package.json: "seed:productos": "ts-node prisma/seed-productos.ts"
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// Unidades de medida
const UNIDADES = {
  UNIDAD: 1,
  CAJA: 2,
  DOCENA: 3,
  PAQUETE: 4,
  BOLSA: 5,
  LITRO: 6,
  KILOGRAMO: 7,
  METRO: 8,
  GALÓN: 9,
  LATA: 10
}

// Productos por categoría
const PRODUCTOS_POR_CATEGORIA = {
  'General': [
    { nombre: 'Artículo General 1', costo: 10, precio: 15, stock: 500 },
    { nombre: 'Artículo General 2', costo: 20, precio: 30, stock: 300 }
  ],
  'Electrónica': [
    { nombre: 'Laptop Dell', costo: 600, precio: 899, stock: 15, uni: UNIDADES.UNIDAD },
    { nombre: 'Mouse Inalámbrico', costo: 15, precio: 25, stock: 100, uni: UNIDADES.UNIDAD },
    { nombre: 'Teclado Mecánico', costo: 50, precio: 85, stock: 40, uni: UNIDADES.UNIDAD },
    { nombre: 'Monitor 24"', costo: 150, precio: 249, stock: 20, uni: UNIDADES.UNIDAD },
    { nombre: 'Webcam Full HD', costo: 40, precio: 65, stock: 35, uni: UNIDADES.UNIDAD },
    { nombre: 'Micrófono Condensador', costo: 60, precio: 99, stock: 25, uni: UNIDADES.UNIDAD },
    { nombre: 'Auriculares Bluetooth', costo: 30, precio: 55, stock: 80, uni: UNIDADES.UNIDAD },
    { nombre: 'Hub USB Tipo C', costo: 25, precio: 45, stock: 60, uni: UNIDADES.UNIDAD },
    { nombre: 'Cable HDMI 1.8m', costo: 8, precio: 15, stock: 200, uni: UNIDADES.UNIDAD },
    { nombre: 'Adaptador VGA', costo: 10, precio: 18, stock: 150, uni: UNIDADES.UNIDAD }
  ],
  'Ropa y Calzado': [
    { nombre: 'Camiseta Básica Blanca', costo: 8, precio: 15, stock: 200, uni: UNIDADES.UNIDAD },
    { nombre: 'Pantalón Jeans Azul', costo: 20, precio: 45, stock: 100, uni: UNIDADES.UNIDAD },
    { nombre: 'Zapatos Deportivos', costo: 35, precio: 75, stock: 60, uni: UNIDADES.UNIDAD },
    { nombre: 'Chaqueta de Cuero', costo: 80, precio: 150, stock: 20, uni: UNIDADES.UNIDAD },
    { nombre: 'Calcetines (12 pares)', costo: 12, precio: 20, stock: 300, uni: UNIDADES.PAQUETE },
    { nombre: 'Gorro de Lana', costo: 5, precio: 12, stock: 150, uni: UNIDADES.UNIDAD },
    { nombre: 'Bufanda Térmica', costo: 10, precio: 20, stock: 120, uni: UNIDADES.UNIDAD },
    { nombre: 'Guantes Invierno', costo: 8, precio: 15, stock: 180, uni: UNIDADES.UNIDAD },
    { nombre: 'Cinturón Cuero', costo: 12, precio: 25, stock: 80, uni: UNIDADES.UNIDAD },
    { nombre: 'Pashmina Seda', costo: 15, precio: 35, stock: 90, uni: UNIDADES.UNIDAD }
  ],
  'Alimentos': [
    { nombre: 'Arroz 5kg', costo: 8, precio: 12, stock: 400, uni: UNIDADES.BOLSA },
    { nombre: 'Frijoles Negros 1kg', costo: 3, precio: 5, stock: 300, uni: UNIDADES.BOLSA },
    { nombre: 'Aceite Vegetal 1L', costo: 4, precio: 7, stock: 250, uni: UNIDADES.LITRO },
    { nombre: 'Azúcar 2kg', costo: 3, precio: 5, stock: 350, uni: UNIDADES.BOLSA },
    { nombre: 'Sal de Mesa 1kg', costo: 1, precio: 2, stock: 500, uni: UNIDADES.BOLSA },
    { nombre: 'Harina de Trigo 1kg', costo: 2, precio: 4, stock: 400, uni: UNIDADES.BOLSA },
    { nombre: 'Avena Integral 500g', costo: 2.50, precio: 4.50, stock: 200, uni: UNIDADES.BOLSA },
    { nombre: 'Atún Enlatado 170g', costo: 2, precio: 3.50, stock: 300, uni: UNIDADES.LATA },
    { nombre: 'Leche Condensada 397g', costo: 1.50, precio: 2.50, stock: 250, uni: UNIDADES.LATA },
    { nombre: 'Café Molido 500g', costo: 4, precio: 7, stock: 150, uni: UNIDADES.BOLSA },
    { nombre: 'Azúcar de Caña 1kg', costo: 3, precio: 5, stock: 200, uni: UNIDADES.BOLSA },
    { nombre: 'Chocolate en Polvo 400g', costo: 3, precio: 5, stock: 180, uni: UNIDADES.BOLSA }
  ],
  'Servicios': [
    { nombre: 'Instalación Sistema', costo: 100, precio: 200, stock: 50, uni: UNIDADES.UNIDAD },
    { nombre: 'Consultoría por Hora', costo: 30, precio: 75, stock: 500, uni: UNIDADES.UNIDAD },
    { nombre: 'Soporte Técnico (1 mes)', costo: 50, precio: 100, stock: 100, uni: UNIDADES.UNIDAD }
  ],
  'Tecnología': [
    { nombre: 'SSD 500GB', costo: 45, precio: 75, stock: 50, uni: UNIDADES.UNIDAD },
    { nombre: 'RAM 8GB DDR4', costo: 35, precio: 60, stock: 60, uni: UNIDADES.UNIDAD },
    { nombre: 'Procesador Ryzen 5', costo: 150, precio: 250, stock: 15, uni: UNIDADES.UNIDAD },
    { nombre: 'Motherboard B550', costo: 120, precio: 200, stock: 20, uni: UNIDADES.UNIDAD },
    { nombre: 'Fuente 650W', costo: 60, precio: 100, stock: 30, uni: UNIDADES.UNIDAD },
    { nombre: 'Cooler de CPU', costo: 25, precio: 45, stock: 40, uni: UNIDADES.UNIDAD },
    { nombre: 'Case ATX Gaming', costo: 80, precio: 140, stock: 25, uni: UNIDADES.UNIDAD },
    { nombre: 'GPU RTX 3060', costo: 300, precio: 500, stock: 10, uni: UNIDADES.UNIDAD },
    { nombre: 'Disco Duro 2TB', costo: 50, precio: 80, stock: 40, uni: UNIDADES.UNIDAD },
    { nombre: 'Tarjeta de Red', costo: 15, precio: 30, stock: 100, uni: UNIDADES.UNIDAD }
  ],
  'Hogar': [
    { nombre: 'Lámpara LED 40W', costo: 15, precio: 30, stock: 120, uni: UNIDADES.UNIDAD },
    { nombre: 'Bombilla Blanca Fría', costo: 3, precio: 7, stock: 200, uni: UNIDADES.UNIDAD },
    { nombre: 'Interruptor Simple', costo: 2, precio: 5, stock: 300, uni: UNIDADES.UNIDAD },
    { nombre: 'Enchufe Doble', costo: 3, precio: 7, stock: 250, uni: UNIDADES.UNIDAD },
    { nombre: 'Breaker 20A', costo: 8, precio: 15, stock: 150, uni: UNIDADES.UNIDAD },
    { nombre: 'Cable Número 12 (100m)', costo: 25, precio: 45, stock: 50, uni: UNIDADES.METRO },
    { nombre: 'Tubo PVC 3"', costo: 5, precio: 10, stock: 100, uni: UNIDADES.METRO },
    { nombre: 'Llave de Agua 1/2"', costo: 8, precio: 15, stock: 80, uni: UNIDADES.UNIDAD },
    { nombre: 'Regadera Cromada', costo: 12, precio: 25, stock: 60, uni: UNIDADES.UNIDAD },
    { nombre: 'Espejo de Baño 60x80', costo: 30, precio: 60, stock: 30, uni: UNIDADES.UNIDAD }
  ]
}

function generarCodigo(indice: number): string {
  const prefijo = Math.random() > 0.5 ? 'PRD' : 'ART'
  return `${prefijo}-${String(indice + 1).padStart(6, '0')}`
}

async function seedProductos() {
  try {
    console.log('🌱 Iniciando seed de productos...')

    // Obtener categorías existentes
    console.log('📂 Obteniendo categorías...')
    const categorias = await db.categoria.findMany()
    const categoriasMap = new Map(categorias.map(c => [c.nombre, c.id]))

    const productos = []
    let indice = 0

    // Generar productos por categoría
    for (const [categoriaNombre, productosList] of Object.entries(PRODUCTOS_POR_CATEGORIA)) {
      const categoriaId = categoriasMap.get(categoriaNombre)
      
      if (!categoriaId) {
        console.warn(`⚠️  Categoría '${categoriaNombre}' no encontrada`)
        continue
      }

      for (const p of productosList) {
        const costo = Number(p.costo)
        const precio = Number(p.precio)
        const margen = ((precio - costo) / precio * 100).toFixed(1)

        productos.push({
          codigo: generarCodigo(indice),
          nombre: p.nombre,
          descripcion: `${p.nombre} - Margen: ${margen}% - Categoría: ${categoriaNombre}`,
          categoriaId,
          uniMedida: p.uni || UNIDADES.UNIDAD,
          precioVenta: precio,
          costoPromedio: costo,
          stockMinimo: Math.ceil(Number(p.stock) * 0.15),
          stockActual: p.stock,
          tipoItem: 1,
          codTributo: '01',
          esGravado: true,
          activo: true
        })

        indice++
      }
    }

    // Insertar productos en base de datos
    console.log(`📝 Insertando ${productos.length} productos en la base de datos...`)
    let insertados = 0
    let errores = 0

    // Procesar en lotes para mejor rendimiento
    const LOTE_SIZE = 10
    for (let i = 0; i < productos.length; i += LOTE_SIZE) {
      const lote = productos.slice(i, i + LOTE_SIZE)
      
      for (const producto of lote) {
        try {
          await db.producto.create({ data: producto })
          insertados++
          if (insertados % 20 === 0) {
            console.log(`   ✓ ${insertados} productos insertados...`)
          }
        } catch (error: any) {
          errores++
          if (!error.message.includes('Unique constraint failed')) {
            console.error(`   ✗ Error: ${error.message}`)
          }
        }
      }
    }

    console.log(`\n✅ Seed de productos completado:`)
    console.log(`   ✓ ${insertados} productos insertados correctamente`)
    if (errores > 0) {
      console.log(`   ⚠️  ${errores} productos omitidos (posibles duplicados)`)
    }

    const total = await db.producto.count()
    console.log(`   📊 Total de productos: ${total}`)

    // Estadísticas por categoría
    const porCategoria = await db.producto.groupBy({
      by: ['categoriaId'],
      _count: true
    })
    console.log(`\n   Por categoría:`)
    for (const item of porCategoria) {
      const cat = categorias.find(c => c.id === item.categoriaId)
      console.log(`      - ${cat?.nombre}: ${item._count} productos`)
    }

    // Estadísticas de stock
    const stockTotal = await db.producto.aggregate({
      _sum: { stockActual: true }
    })
    const valorInventario = await db.producto.aggregate({
      _sum: {
        costoPromedio: true
      }
    })

    console.log(`\n   📦 Stock total: ${stockTotal._sum.stockActual}`)
    console.log(`   💰 Valor inventario (costo): $${(Number(valorInventario._sum.costoPromedio || 0) * 100).toFixed(2)}`)

  } catch (error) {
    console.error('❌ Error en seed:', error)
    throw error
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedProductos()
    .catch(console.error)
    .finally(() => db.$disconnect())
}

export { seedProductos }
