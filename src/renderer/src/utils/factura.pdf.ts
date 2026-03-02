import type { FacturaDetalle } from '@shared/types/billing.types'

// Carga pdfmake de forma lazy para no bloquear el bundle inicial
async function getPdfMake() {
  const [{ default: pdfMake }, pdfFonts] = await Promise.all([
    import('pdfmake/build/pdfmake'),
    import('pdfmake/build/vfs_fonts')
  ])
  const vfs = (pdfFonts as any).pdfMake?.vfs ?? (pdfFonts as any).vfs ?? (pdfFonts as any).default?.vfs
  if (vfs) pdfMake.vfs = vfs
  return pdfMake
}

const TIPO_LABELS: Record<string, string> = {
  '01': 'FACTURA ELECTRÓNICA',
  '03': 'COMPROBANTE DE CRÉDITO FISCAL',
  '05': 'NOTA DE CRÉDITO',
  '06': 'NOTA DE DÉBITO'
}

export async function imprimirFacturaPDF(factura: FacturaDetalle) {
  const pdfMake = await getPdfMake()

  // Intentar obtener datos del emisor
  let emisorNombre = 'Speeddansys ERP'
  let emisorNIT = ''
  let emisorNRC = ''
  let emisorDir = ''
  try {
    const emisor = await window.configuracion.getEmisor()
    if (emisor) {
      emisorNombre = emisor.nombre
      emisorNIT = emisor.nit
      emisorNRC = emisor.nrc
      emisorDir = emisor.complementoDireccion
    }
  } catch { /* silent */ }

  const tipoLabel = TIPO_LABELS[factura.tipoDte] ?? `DTE-${factura.tipoDte}`
  const fechaFormateada = new Date(factura.fechaEmision).toLocaleDateString('es-SV', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })

  // Calcular totales desde detalles
  const totalGravado = factura.detalles.reduce((a, d) => a + Number(d.ventaGravada), 0)
  const totalIVA = factura.detalles.reduce((a, d) => a + Number(d.ivaItem), 0)
  const totalDescuento = factura.detalles.reduce((a, d) => a + Number(d.descuento), 0)

  const docDef: any = {
    pageSize: 'LETTER',
    pageMargins: [40, 40, 40, 50],
    defaultStyle: { fontSize: 9, font: 'Roboto' },

    content: [
      // ── CABECERA ──────────────────────────────────────
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: emisorNombre, style: 'emisorNombre' },
              emisorNIT ? { text: `NIT: ${emisorNIT}`, style: 'emisorSub' } : {},
              emisorNRC ? { text: `NRC: ${emisorNRC}`, style: 'emisorSub' } : {},
              emisorDir ? { text: emisorDir, style: 'emisorSub' } : {}
            ]
          },
          {
            width: 200,
            stack: [
              {
                table: {
                  widths: ['*'],
                  body: [
                    [{ text: tipoLabel, style: 'tituloDTE', alignment: 'center', fillColor: '#f47920', color: '#fff' }],
                    [{ text: `N° Control: ${factura.numeroControl}`, fontSize: 8, margin: [4, 2, 4, 1] }],
                    [{ text: `Cód. Generación:`, fontSize: 7, margin: [4, 1, 4, 0] }],
                    [{ text: factura.codigoGeneracion, fontSize: 7, margin: [4, 0, 4, 2], color: '#555' }],
                    [{ text: `Fecha: ${fechaFormateada}`, fontSize: 9, bold: true, margin: [4, 2, 4, 4] }]
                  ]
                },
                layout: 'lightHorizontalLines'
              }
            ]
          }
        ],
        margin: [0, 0, 0, 16]
      },

      // ── RECEPTOR ──────────────────────────────────────
      {
        table: {
          widths: ['*'],
          body: [[
            {
              stack: [
                { text: 'DATOS DEL RECEPTOR', bold: true, fontSize: 8, color: '#f47920', margin: [0, 0, 0, 4] },
                {
                  columns: [
                    [
                      { text: `Nombre: ${factura.cliente?.nombre ?? 'Consumidor Final'}`, fontSize: 9 },
                      { text: `Documento: ${factura.cliente?.numDocumento ?? '—'}`, fontSize: 9 }
                    ]
                  ]
                }
              ],
              margin: [8, 6, 8, 6]
            }
          ]]
        },
        layout: { hLineColor: () => '#e8e8e8', vLineColor: () => '#e8e8e8' },
        margin: [0, 0, 0, 12]
      },

      // ── TABLA DE DETALLE ──────────────────────────────
      { text: 'DETALLE DE PRODUCTOS / SERVICIOS', bold: true, fontSize: 8, color: '#555', margin: [0, 0, 0, 4] },
      {
        table: {
          headerRows: 1,
          widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto'],
          body: [
            // Header
            [
              { text: '#', style: 'thCell' },
              { text: 'Descripción', style: 'thCell' },
              { text: 'Cant.', style: 'thCell' },
              { text: 'P. Unit.', style: 'thCell' },
              { text: 'Desc.', style: 'thCell' },
              { text: 'Gravado', style: 'thCell' },
              { text: 'IVA', style: 'thCell' }
            ],
            // Filas
            ...factura.detalles.map(d => [
              { text: d.numItem, alignment: 'center', fontSize: 8 },
              { text: d.descripcion, fontSize: 8 },
              { text: Number(d.cantidad).toFixed(2), alignment: 'right', fontSize: 8 },
              { text: `$${Number(d.precioUnitario).toFixed(2)}`, alignment: 'right', fontSize: 8 },
              { text: `$${Number(d.descuento).toFixed(2)}`, alignment: 'right', fontSize: 8 },
              { text: `$${Number(d.ventaGravada).toFixed(2)}`, alignment: 'right', fontSize: 8, bold: true },
              { text: `$${Number(d.ivaItem).toFixed(2)}`, alignment: 'right', fontSize: 8 }
            ])
          ]
        },
        layout: {
          hLineColor: (i: number) => i === 1 ? '#f47920' : '#e8e8e8',
          vLineColor: () => '#e8e8e8',
          fillColor: (ri: number) => ri === 0 ? '#f0f5ff' : ri % 2 === 0 ? '#fafafa' : null
        },
        margin: [0, 0, 0, 12]
      },

      // ── TOTALES ───────────────────────────────────────
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 220,
            table: {
              widths: ['*', 100],
              body: [
                [{ text: 'Subtotal gravado:', fontSize: 9 }, { text: `$${totalGravado.toFixed(2)}`, alignment: 'right', fontSize: 9 }],
                totalDescuento > 0
                  ? [{ text: 'Descuento:', fontSize: 9 }, { text: `-$${totalDescuento.toFixed(2)}`, alignment: 'right', fontSize: 9, color: '#52c41a' }]
                  : [{ text: '', fontSize: 1 }, { text: '', fontSize: 1 }],
                [{ text: 'IVA (13%):', fontSize: 9 }, { text: `$${totalIVA.toFixed(2)}`, alignment: 'right', fontSize: 9 }],
                [
                  { text: 'TOTAL A PAGAR:', bold: true, fontSize: 11, fillColor: '#f47920', color: '#fff', margin: [4, 4, 4, 4] },
                  { text: `$${Number(factura.totalPagar).toFixed(2)}`, bold: true, fontSize: 11, alignment: 'right', fillColor: '#f47920', color: '#fff', margin: [4, 4, 4, 4] }
                ]
              ]
            },
            layout: { hLineColor: () => '#e8e8e8', vLineColor: () => '#e8e8e8' }
          }
        ],
        margin: [0, 0, 0, 16]
      },

      // ── ESTADO MH ─────────────────────────────────────
      {
        columns: [
          {
            stack: [
              { text: `Estado MH: ${factura.estado}`, fontSize: 8, color: factura.estado === 'RECIBIDO' ? '#52c41a' : '#faad14' },
              factura.selloRecepcion ? { text: `Sello: ${factura.selloRecepcion}`, fontSize: 7, color: '#888' } : {}
            ]
          }
        ]
      }
    ],

    styles: {
      emisorNombre: { fontSize: 14, bold: true, color: '#f47920', margin: [0, 0, 0, 2] },
      emisorSub: { fontSize: 8, color: '#555', margin: [0, 1, 0, 0] },
      tituloDTE: { fontSize: 10, bold: true, margin: [4, 6, 4, 6] },
      thCell: { bold: true, fontSize: 8, fillColor: '#f0f5ff', color: '#f47920', margin: [3, 3, 3, 3] }
    },

    footer: (currentPage: number, pageCount: number) => ({
      text: `Speeddansys ERP — Página ${currentPage} de ${pageCount} — Documento generado electrónicamente`,
      alignment: 'center',
      fontSize: 7,
      color: '#aaa',
      margin: [40, 0, 40, 0]
    })
  }

  pdfMake.createPdf(docDef).download(
    `factura_${factura.numeroControl?.replace(/\//g, '-')}_${fechaFormateada.replace(/\//g, '-')}.pdf`
  )
}

export async function imprimirEstadoCuenta(cliente: ClienteRow) {
  const pdfMake = await getPdfMake()

  // Obtener todas las facturas del cliente
  const res = await window.billing.listar({ clienteId: cliente.id, pageSize: 999, page: 1 })
  const facturas = res.facturas

  const totalFacturado = facturas
    .filter(f => f.estado !== 'ANULADO')
    .reduce((a, f) => a + Number(f.totalPagar), 0)

  const fecha = new Date().toLocaleDateString('es-SV', { day: '2-digit', month: '2-digit', year: 'numeric' })

  const docDef: any = {
    pageSize: 'LETTER',
    pageMargins: [40, 40, 40, 50],
    defaultStyle: { fontSize: 9 },

    content: [
      // Título
      { text: 'ESTADO DE CUENTA DEL CLIENTE', style: 'titulo', alignment: 'center' },
      { text: `Generado: ${fecha}`, fontSize: 8, color: '#888', alignment: 'center', margin: [0, 0, 0, 16] },

      // Datos del cliente
      {
        table: {
          widths: ['*'],
          body: [[{
            stack: [
              { text: cliente.nombre, bold: true, fontSize: 13 },
              { text: `Documento: ${cliente.numDocumento}  |  NRC: ${cliente.nrc ?? '—'}`, fontSize: 9, color: '#555', margin: [0, 4, 0, 0] },
              cliente.correo ? { text: `Correo: ${cliente.correo}`, fontSize: 9, color: '#555' } : {},
              cliente.telefono ? { text: `Teléfono: ${cliente.telefono}`, fontSize: 9, color: '#555' } : {}
            ],
            margin: [8, 8, 8, 8]
          }]]
        },
        layout: { hLineColor: () => '#f47920', vLineColor: () => '#f47920' },
        margin: [0, 0, 0, 16]
      },

      // Tabla de facturas
      { text: `HISTORIAL DE DOCUMENTOS (${facturas.length} registros)`, bold: true, fontSize: 8, color: '#555', margin: [0, 0, 0, 6] },
      facturas.length === 0
        ? { text: 'No hay documentos registrados para este cliente.', color: '#888', italics: true }
        : {
            table: {
              headerRows: 1,
              widths: [70, '*', 60, 60, 70],
              body: [
                [
                  { text: 'Fecha', style: 'thCell' },
                  { text: 'N° Control', style: 'thCell' },
                  { text: 'Tipo', style: 'thCell' },
                  { text: 'Total', style: 'thCell' },
                  { text: 'Estado', style: 'thCell' }
                ],
                ...facturas.map(f => [
                  { text: new Date(f.fechaEmision).toLocaleDateString('es-SV'), fontSize: 8 },
                  { text: f.numeroControl?.slice(-20) ?? '—', fontSize: 7, color: '#555' },
                  { text: f.tipoDte === '01' ? 'FAC' : f.tipoDte === '03' ? 'CCF' : f.tipoDte, fontSize: 8, alignment: 'center' },
                  { text: `$${Number(f.totalPagar).toFixed(2)}`, fontSize: 8, alignment: 'right', bold: true },
                  {
                    text: f.estado,
                    fontSize: 7,
                    color: f.estado === 'RECIBIDO' ? '#52c41a' : f.estado === 'ANULADO' ? '#ff4d4f' : '#faad14',
                    bold: true
                  }
                ])
              ]
            },
            layout: {
              hLineColor: (i: number) => i === 1 ? '#f47920' : '#e8e8e8',
              vLineColor: () => '#e8e8e8',
              fillColor: (ri: number) => ri === 0 ? '#f0f5ff' : ri % 2 === 0 ? '#fafafa' : null
            },
            margin: [0, 0, 0, 12]
          },

      // Total
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 200,
            table: {
              widths: ['*', 80],
              body: [[
                { text: 'TOTAL FACTURADO:', bold: true, fontSize: 11, fillColor: '#f47920', color: '#fff', margin: [6, 6, 6, 6] },
                { text: `$${totalFacturado.toFixed(2)}`, bold: true, fontSize: 11, alignment: 'right', fillColor: '#f47920', color: '#fff', margin: [6, 6, 6, 6] }
              ]]
            },
            layout: 'noBorders'
          }
        ]
      }
    ],

    styles: {
      titulo: { fontSize: 16, bold: true, color: '#f47920', margin: [0, 0, 0, 4] },
      thCell: { bold: true, fontSize: 8, fillColor: '#f0f5ff', color: '#f47920', margin: [3, 3, 3, 3] }
    },

    footer: (_: number, pageCount: number, page: number) => ({
      text: `Speeddansys ERP — Página ${page} de ${pageCount}`,
      alignment: 'center', fontSize: 7, color: '#aaa', margin: [40, 0, 40, 0]
    })
  }

  pdfMake.createPdf(docDef).download(`estado_cuenta_${cliente.nombre.replace(/\s+/g, '_')}_${fecha.replace(/\//g, '-')}.pdf`)
}
