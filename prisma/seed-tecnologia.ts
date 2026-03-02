/**
 * Seed: 25 Productos Tecnológicos — DB Pruebas
 * Base de datos: speeddansys_dev (entorno de pruebas)
 *
 * Productos únicos: computadoras, laptops, tablets, monitores, radios,
 * equipos de sonido, televisores, cámaras, accesorios tech y más.
 *
 * UNIDAD DE MEDIDA (U.M.) — Catálogo MH El Salvador:
 *   59 = Unidad (código estándar MH para artículos individuales)
 *   96 = Pieza
 *   Los productos tecnológicos se venden por "Unidad" = código 59
 *
 * Ejecutar: npx tsx prisma/seed-tecnologia.ts
 *
 * IMPORTANTE: Ejecutar clean-inventario.ts PRIMERO si desea limpiar
 * los datos anteriores: npx tsx prisma/clean-inventario.ts
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// ─── Unidad de Medida MH El Salvador ───────────────────────
// Código 59 = Unidad (el más usado para electrónicos y tecnología)
// Es el código correcto del catálogo del Ministerio de Hacienda
const UNI_MEDIDA = {
    UNIDAD: 59,   // Catálogo MH — Unidad (código oficial)
    PIEZA: 96,   // Catálogo MH — Pieza
}

// ─── Categorías para productos tecnológicos ─────────────────
const CATEGORIAS_TECH = [
    'Computadoras y Laptops',
    'Monitores y Pantallas',
    'Audio y Sonido',
    'Televisores',
    'Cámaras y Video',
    'Accesorios Tech',
    'Redes y Conectividad',
]

// ─── 25 Productos tecnológicos únicos ───────────────────────
interface ProductoTech {
    codigo: string
    nombre: string
    descripcion: string
    categoria: string
    uniMedida: number
    precioVenta: number
    costoPromedio: number
    stockMinimo: number
    stockActual: number
}

const PRODUCTOS_TECH: ProductoTech[] = [
    // ── Computadoras y Laptops (6) ──────────────────────────────
    {
        codigo: 'TECH-001',
        nombre: 'Laptop HP 15.6" Core i5 8GB RAM 512GB SSD',
        descripcion: 'Laptop HP Notebook, Pantalla 15.6" FHD, Intel Core i5-12th Gen, 8GB DDR4, 512GB SSD, Windows 11 Home. Ideal para oficina y trabajo remoto.',
        categoria: 'Computadoras y Laptops',
        uniMedida: UNI_MEDIDA.UNIDAD,
        precioVenta: 649.99,
        costoPromedio: 480.00,
        stockMinimo: 3,
        stockActual: 12,
    },
    {
        codigo: 'TECH-002',
        nombre: 'Laptop Dell Inspiron 14" Core i7 16GB RAM 1TB SSD',
        descripcion: 'Dell Inspiron 14, Procesador Intel Core i7-13th Gen, 16GB DDR5, 1TB SSD NVMe, Pantalla FHD IPS, Retroiluminación LED, Windows 11 Pro.',
        categoria: 'Computadoras y Laptops',
        uniMedida: UNI_MEDIDA.UNIDAD,
        precioVenta: 899.99,
        costoPromedio: 680.00,
        stockMinimo: 2,
        stockActual: 8,
    },
    {
        codigo: 'TECH-003',
        nombre: 'PC de Escritorio Acer Veriton Core i5 8GB RAM 256GB SSD',
        descripcion: 'Computadora de escritorio Acer Veriton, Intel Core i5, 8GB RAM, 256GB SSD, sin monitor, Windows 11 Pro. Diseñado para entornos empresariales.',
        categoria: 'Computadoras y Laptops',
        uniMedida: UNI_MEDIDA.UNIDAD,
        precioVenta: 549.99,
        costoPromedio: 400.00,
        stockMinimo: 2,
        stockActual: 7,
    },
    {
        codigo: 'TECH-004',
        nombre: 'MacBook Air M2 13" 8GB RAM 256GB SSD Space Gray',
        descripcion: 'Apple MacBook Air con chip M2, pantalla Liquid Retina 13.6", 8GB de memoria, 256GB SSD, batería de 18 horas. Diseño ultrafino.',
        categoria: 'Computadoras y Laptops',
        uniMedida: UNI_MEDIDA.UNIDAD,
        precioVenta: 1099.99,
        costoPromedio: 900.00,
        stockMinimo: 2,
        stockActual: 5,
    },
    {
        codigo: 'TECH-005',
        nombre: 'Tablet Samsung Galaxy Tab A8 10.5" 32GB WiFi',
        descripcion: 'Samsung Galaxy Tab A8, pantalla de 10.5" TFT, 3GB RAM, 32GB almacenamiento, Android 13, batería 7040 mAh, WiFi + Bluetooth. Color gris oscuro.',
        categoria: 'Computadoras y Laptops',
        uniMedida: UNI_MEDIDA.UNIDAD,
        precioVenta: 249.99,
        costoPromedio: 180.00,
        stockMinimo: 3,
        stockActual: 15,
    },
    {
        codigo: 'TECH-006',
        nombre: 'Mini PC Intel NUC Core i3 4GB RAM 128GB SSD HDMI',
        descripcion: 'Computadora Mini PC Intel NUC, procesador Core i3, 4GB RAM DDR4, 128GB SSD, doble HDMI, 4x USB 3.0, Windows 11 Pro. Compacto para escritorios pequeños.',
        categoria: 'Computadoras y Laptops',
        uniMedida: UNI_MEDIDA.UNIDAD,
        precioVenta: 329.99,
        costoPromedio: 240.00,
        stockMinimo: 2,
        stockActual: 9,
    },

    // ── Monitores y Pantallas (3) ───────────────────────────────
    {
        codigo: 'TECH-007',
        nombre: 'Monitor LG 24" Full HD IPS 75Hz HDMI VGA',
        descripcion: 'Monitor LG 24MK430H, pantalla IPS Full HD 1920x1080, 75Hz, tiempo de respuesta 5ms, HDMI + VGA, soporte VESA 75x75. Ideal para trabajo y multimedia.',
        categoria: 'Monitores y Pantallas',
        uniMedida: UNI_MEDIDA.UNIDAD,
        precioVenta: 179.99,
        costoPromedio: 130.00,
        stockMinimo: 3,
        stockActual: 18,
    },
    {
        codigo: 'TECH-008',
        nombre: 'Monitor Samsung 27" Curvo QHD 144Hz HDMI DisplayPort',
        descripcion: 'Samsung Odyssey G5 27", panel VA curvo 1000R, resolución 2560x1440 QHD, 144Hz, 1ms GTG, AMD FreeSync Premium, HDMI 2.0 + DisplayPort 1.2.',
        categoria: 'Monitores y Pantallas',
        uniMedida: UNI_MEDIDA.UNIDAD,
        precioVenta: 349.99,
        costoPromedio: 260.00,
        stockMinimo: 2,
        stockActual: 10,
    },
    {
        codigo: 'TECH-009',
        nombre: 'Smart TV Samsung 32" HD LED HDMI USB WiFi',
        descripcion: 'Samsung Smart TV 32" Series 4, HD (1366x768), 2x HDMI, 1x USB, WiFi integrado, Tizen OS, acceso a Netflix, YouTube, Prime Video. Diseño slim.',
        categoria: 'Monitores y Pantallas',
        uniMedida: UNI_MEDIDA.UNIDAD,
        precioVenta: 299.99,
        costoPromedio: 220.00,
        stockMinimo: 2,
        stockActual: 14,
    },

    // ── Audio y Sonido (5) ──────────────────────────────────────
    {
        codigo: 'TECH-010',
        nombre: 'Bocina Bluetooth JBL Charge 5 30W IPX7 Portátil',
        descripcion: 'JBL Charge 5, potencia 30W, Bluetooth 5.1, batería 20 horas, resistente agua y polvo IP67, carga USB-C, PartyBoost para conectar múltiples bocinas.',
        categoria: 'Audio y Sonido',
        uniMedida: UNI_MEDIDA.UNIDAD,
        precioVenta: 149.99,
        costoPromedio: 105.00,
        stockMinimo: 4,
        stockActual: 25,
    },
    {
        codigo: 'TECH-011',
        nombre: 'Sistema de Sonido Minicomponente LG XBOOM CJ44 2.0 550W',
        descripcion: 'LG XBOOM CJ44, sistema de sonido 2.0, potencia 550W, Bluetooth, USB, reproductor CD / DVD, FM, entrada auxiliar, iluminación multicolor.',
        categoria: 'Audio y Sonido',
        uniMedida: UNI_MEDIDA.UNIDAD,
        precioVenta: 299.99,
        costoPromedio: 220.00,
        stockMinimo: 2,
        stockActual: 8,
    },
    {
        codigo: 'TECH-012',
        nombre: 'Audífonos Sony WH-1000XM4 Noise Cancelling Bluetooth',
        descripcion: 'Sony WH-1000XM4, cancelación de ruido líder del sector, Bluetooth 5.0, hasta 30 horas de batería, llamadas manos libres, carga rápida USB-C. Color negro.',
        categoria: 'Audio y Sonido',
        uniMedida: UNI_MEDIDA.UNIDAD,
        precioVenta: 279.99,
        costoPromedio: 200.00,
        stockMinimo: 3,
        stockActual: 12,
    },
    {
        codigo: 'TECH-013',
        nombre: 'Radio AM/FM Digital Portátil con Bluetooth y USB',
        descripcion: 'Radio digital portátil, recepción AM/FM, Bluetooth 5.0 para streaming, entrada USB y Micro SD, pantalla LCD, batería recargable, altavoz integrado.',
        categoria: 'Audio y Sonido',
        uniMedida: UNI_MEDIDA.UNIDAD,
        precioVenta: 34.99,
        costoPromedio: 20.00,
        stockMinimo: 5,
        stockActual: 30,
    },
    {
        codigo: 'TECH-014',
        nombre: 'Barra de Sonido Samsung HW-B450 2.1ch 300W Subwoofer',
        descripcion: 'Samsung Soundbar HW-B450, configuración 2.1, potencia 300W, subwoofer inalámbrico, Bluetooth, HDMI ARC, entrada óptica. Ideal para TV 40" o más.',
        categoria: 'Audio y Sonido',
        uniMedida: UNI_MEDIDA.UNIDAD,
        precioVenta: 229.99,
        costoPromedio: 165.00,
        stockMinimo: 2,
        stockActual: 9,
    },
    {
        codigo: 'TECH-015',
        nombre: 'Micrófono de Condensador USB Blue Yeti para Streaming',
        descripcion: 'Blue Yeti USB, micrófono de condensador con 4 patrones de captación (cardioide, bidireccional, omnidireccional, estéreo), plug & play, ideal para podcast y streaming.',
        categoria: 'Audio y Sonido',
        uniMedida: UNI_MEDIDA.UNIDAD,
        precioVenta: 109.99,
        costoPromedio: 78.00,
        stockMinimo: 3,
        stockActual: 16,
    },

    // ── Televisores (3) ─────────────────────────────────────────
    {
        codigo: 'TECH-016',
        nombre: 'Smart TV TCL 55" 4K UHD HDR Google TV HDMI WiFi',
        descripcion: 'TCL 55C645, pantalla 4K UHD 55", Google TV, HDR10+, Dolby Atmos, 3x HDMI 2.0, 2x USB, WiFi y Ethernet, AirPlay, Google Assistant integrado.',
        categoria: 'Televisores',
        uniMedida: UNI_MEDIDA.UNIDAD,
        precioVenta: 499.99,
        costoPromedio: 370.00,
        stockMinimo: 2,
        stockActual: 6,
    },
    {
        codigo: 'TECH-017',
        nombre: 'Smart TV LG 43" 4K UHD NanoCell WebOS HDMI WiFi',
        descripcion: 'LG NANO756 43", 4K NanoCell, WebOS 22, procesador α5 Gen5 AI, ThinQ AI, 3x HDMI, 2x USB, WiFi, Magic Remote incluido. Colores más vivos y precisos.',
        categoria: 'Televisores',
        uniMedida: UNI_MEDIDA.UNIDAD,
        precioVenta: 449.99,
        costoPromedio: 330.00,
        stockMinimo: 2,
        stockActual: 7,
    },
    {
        codigo: 'TECH-018',
        nombre: 'Proyector Epson EX3280 3LCD SVGA 3300 Lúmenes HDMI',
        descripcion: 'Epson EX3280, proyector 3LCD SVGA (800x600), 3300 lúmenes de color y blanco, 15,000:1 contraste, HDMI, USB, hasta 300" imagen, ideal para presentaciones y cine en casa.',
        categoria: 'Televisores',
        uniMedida: UNI_MEDIDA.UNIDAD,
        precioVenta: 379.99,
        costoPromedio: 280.00,
        stockMinimo: 1,
        stockActual: 5,
    },

    // ── Cámaras y Video (2) ─────────────────────────────────────
    {
        codigo: 'TECH-019',
        nombre: 'Cámara de Seguridad IP Hikvision 4MP PoE Interior',
        descripcion: 'Hikvision DS-2CD2143G2-I, 4MP AcuSense, lente varifocal 2.8mm, PoE 802.3af, IR 40m, IP67, H.265+, SD card slot, detección inteligente de personas y vehículos.',
        categoria: 'Cámaras y Video',
        uniMedida: UNI_MEDIDA.UNIDAD,
        precioVenta: 89.99,
        costoPromedio: 60.00,
        stockMinimo: 5,
        stockActual: 30,
    },
    {
        codigo: 'TECH-020',
        nombre: 'Webcam Logitech C920 Pro Full HD 1080p USB',
        descripcion: 'Logitech C920 HD Pro, video Full HD 1080p a 30fps, micrófono estéreo, autofocus, campo de visión 78°, compatible Zoom/Teams/Meet, clip universal, USB-A.',
        categoria: 'Cámaras y Video',
        uniMedida: UNI_MEDIDA.UNIDAD,
        precioVenta: 79.99,
        costoPromedio: 55.00,
        stockMinimo: 4,
        stockActual: 22,
    },

    // ── Accesorios Tech (4) ─────────────────────────────────────
    {
        codigo: 'TECH-021',
        nombre: 'Teclado y Mouse Inalámbrico Logitech MK370 Español',
        descripcion: 'Combo Logitech MK370, teclado inalámbrico membrana + mouse óptico 1000 DPI, receptor USB Unifying, batería 36 meses teclado / 18 meses mouse, layout español.',
        categoria: 'Accesorios Tech',
        uniMedida: UNI_MEDIDA.UNIDAD,
        precioVenta: 49.99,
        costoPromedio: 33.00,
        stockMinimo: 5,
        stockActual: 35,
    },
    {
        codigo: 'TECH-022',
        nombre: 'Disco Duro Externo Seagate 1TB USB 3.0 Portátil',
        descripcion: 'Seagate Backup Plus Slim 1TB, USB 3.0, velocidad hasta 120MB/s, carcasa de aluminio ultradelgada 9.6mm, compatible Windows y Mac, incluye cable USB-A.',
        categoria: 'Accesorios Tech',
        uniMedida: UNI_MEDIDA.UNIDAD,
        precioVenta: 64.99,
        costoPromedio: 44.00,
        stockMinimo: 4,
        stockActual: 20,
    },
    {
        codigo: 'TECH-023',
        nombre: 'UPS APC 600VA 360W 8 Tomas con Protector de Voltaje',
        descripcion: 'APC Back-UPS BE600M1, 600VA / 360W, 8 tomas (4 con respaldo + 4 solo protección), puerto USB-A de carga, avisador de batería, protección contra sobretensiones.',
        categoria: 'Accesorios Tech',
        uniMedida: UNI_MEDIDA.UNIDAD,
        precioVenta: 89.99,
        costoPromedio: 62.00,
        stockMinimo: 3,
        stockActual: 18,
    },
    {
        codigo: 'TECH-024',
        nombre: 'Impresora Multifuncional HP DeskJet 2775 WiFi Color',
        descripcion: 'HP DeskJet 2775, impresora / copiadora / escáner a color, WiFi, USB, hasta 20ppm negro / 16ppm color, compatible HP Smart App, tinta HP 652. Ideal para hogar y oficina.',
        categoria: 'Accesorios Tech',
        uniMedida: UNI_MEDIDA.UNIDAD,
        precioVenta: 89.99,
        costoPromedio: 62.00,
        stockMinimo: 3,
        stockActual: 14,
    },

    // ── Redes y Conectividad (2) ────────────────────────────────
    {
        codigo: 'TECH-025',
        nombre: 'Router WiFi TP-Link Archer AX21 AX1800 Dual Band',
        descripcion: 'TP-Link Archer AX21, WiFi 6 AX1800, doble banda 2.4GHz + 5GHz, 4 antenas, OFDMA, MU-MIMO, 4x LAN Gigabit, compatible Alexa, VPN, WPA3. Hasta 1,500 m².',
        categoria: 'Redes y Conectividad',
        uniMedida: UNI_MEDIDA.UNIDAD,
        precioVenta: 69.99,
        costoPromedio: 47.00,
        stockMinimo: 3,
        stockActual: 20,
    },
]

// ─── Función principal ───────────────────────────────────────
async function seedTecnologia() {
    console.log('🌱 Iniciando seed de productos tecnológicos...')
    console.log('📦 Base de datos: speeddansys_dev (PRUEBAS)\n')

    try {
        // ── Crear / obtener categorías ────────────────────────────
        console.log('📂 Creando categorías tecnológicas...')
        const categoriasMap = new Map<string, number>()

        for (const nombre of CATEGORIAS_TECH) {
            const cat = await db.categoria.upsert({
                where: { nombre },
                update: {},
                create: { nombre, activa: true }
            })
            categoriasMap.set(nombre, cat.id)
            console.log(`   ✓ Categoría: ${nombre} (id=${cat.id})`)
        }

        console.log(`\n📝 Insertando ${PRODUCTOS_TECH.length} productos tecnológicos...\n`)

        let insertados = 0
        let errores = 0

        for (const p of PRODUCTOS_TECH) {
            const categoriaId = categoriasMap.get(p.categoria)

            if (!categoriaId) {
                console.warn(`   ⚠️  Categoría no encontrada: ${p.categoria}`)
                errores++
                continue
            }

            try {
                await db.producto.upsert({
                    where: { codigo: p.codigo },
                    update: {
                        nombre: p.nombre,
                        descripcion: p.descripcion,
                        categoriaId,
                        uniMedida: p.uniMedida,
                        precioVenta: p.precioVenta,
                        costoPromedio: p.costoPromedio,
                        stockMinimo: p.stockMinimo,
                        stockActual: p.stockActual,
                        tipoItem: 1,          // Bien
                        codTributo: '20',     // IVA (código MH El Salvador)
                        esGravado: true,
                        activo: true
                    },
                    create: {
                        codigo: p.codigo,
                        nombre: p.nombre,
                        descripcion: p.descripcion,
                        categoriaId,
                        uniMedida: p.uniMedida,
                        precioVenta: p.precioVenta,
                        costoPromedio: p.costoPromedio,
                        stockMinimo: p.stockMinimo,
                        stockActual: p.stockActual,
                        tipoItem: 1,
                        codTributo: '20',
                        esGravado: true,
                        activo: true
                    }
                })

                insertados++
                console.log(`   ✓ [${p.codigo}] ${p.nombre}`)

            } catch (error: any) {
                errores++
                console.error(`   ✗ Error en ${p.codigo}: ${error.message}`)
            }
        }

        // ── Resumen final ─────────────────────────────────────────
        console.log('\n════════════════════════════════════════')
        console.log('✅ SEED COMPLETADO')
        console.log('════════════════════════════════════════')
        console.log(`   ✓ Productos insertados: ${insertados}`)
        if (errores > 0) console.log(`   ✗ Errores: ${errores}`)

        const totalProductos = await db.producto.count()
        const valorInventario = await db.producto.aggregate({
            _sum: { stockActual: true }
        })

        console.log(`\n   📊 Total productos en BD: ${totalProductos}`)
        console.log(`   📦 Stock total (unidades): ${Number(valorInventario._sum.stockActual || 0).toLocaleString()}`)

        // Resumen por categoría
        console.log('\n   Por categoría:')
        for (const [cat, id] of categoriasMap.entries()) {
            const count = await db.producto.count({ where: { categoriaId: id } })
            console.log(`      ${cat}: ${count} productos`)
        }

        console.log('\n   💡 NOTA UNIDADES DE MEDIDA (U.M.):')
        console.log('      Código 59 = UNIDAD (catálogo MH El Salvador)')
        console.log('      Todos los productos tech usan U.M. = 59 (Unidad)')
        console.log('════════════════════════════════════════\n')

    } catch (error: any) {
        console.error('\n❌ Error en seed:', error.message)
        throw error
    }
}

if (require.main === module) {
    seedTecnologia()
        .catch(console.error)
        .finally(() => db.$disconnect())
}

export { seedTecnologia }
