// FacturaViewer — Visor de comprobantes DTE
// Carga la plantilla HTML de json_doc/plantilla/{tipoDte}.html
// e inyecta los datos del DTE para renderizarla en un iframe imprimible.

import { useState, useEffect, useRef } from 'react'
import { Modal, Button, Space, Spin, Alert, Tag, Tooltip, message } from 'antd'
import {
    PrinterOutlined, DownloadOutlined, CloseOutlined,
    FileDoneOutlined
} from '@ant-design/icons'
import type { FacturaDetalle } from '@shared/types/billing.types'

const TIPO_LABELS: Record<string, string> = {
    '01': 'Factura Electrónica',
    '03': 'Comprobante de Crédito Fiscal',
    '05': 'Nota de Crédito',
    '06': 'Nota de Débito',
    '11': 'Factura de Exportación'
}

const CONDICION_PAGO: Record<string, string> = { '1': 'Contado', '2': 'A crédito', '3': 'Otro' }

interface Props {
    facturaId: number | null
    onClose: () => void
}

function fmtn(n: number | string | undefined): string {
    const val = Number(n ?? 0)
    return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function FacturaViewer({ facturaId, onClose }: Props) {
    const [loading, setLoading] = useState(false)
    const [detalle, setDetalle] = useState<FacturaDetalle | null>(null)
    const [dteRaw, setDteRaw] = useState<Record<string, unknown> | null>(null)
    const [emisor, setEmisor] = useState<Record<string, unknown> | null>(null)
    const [templateHtml, setTemplateHtml] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const iframeRef = useRef<HTMLIFrameElement>(null)

    useEffect(() => {
        if (!facturaId) return
        setLoading(true)
        setError(null)
        setDetalle(null)
        setDteRaw(null)
        setTemplateHtml(null)

        Promise.all([
            window.billing.getById(facturaId),
            window.configuracion.getEmisor()
        ]).then(async ([f, em]) => {
            if (!f) { setError('Comprobante no encontrado'); return }
            const factura = f as unknown as FacturaDetalle
            setDetalle(factura)
            setEmisor(em as unknown as Record<string, unknown>)

            // Cargar JSON guardado
            try {
                const jres = await window.documentos.leerJson(f.codigoGeneracion)
                if (jres.ok) setDteRaw(jres.json as Record<string, unknown>)
            } catch { /* JSON puede no existir */ }

            // Cargar plantilla HTML
            try {
                const tres = await window.documentos.leerPlantilla(factura.tipoDte)
                if (tres.ok && tres.html) setTemplateHtml(tres.html)
                else setTemplateHtml(null)
            } catch { setTemplateHtml(null) }
        }).catch(err => setError(String(err))).finally(() => setLoading(false))
    }, [facturaId])

    // Inyectar datos en la plantilla
    useEffect(() => {
        if (!templateHtml || !detalle || !iframeRef.current) return

        const doc = iframeRef.current.contentDocument
        if (!doc) return

        doc.open()
        doc.write(templateHtml)
        doc.close()

        setTimeout(() => {
            const set = (id: string, val: string) => {
                const el = doc.getElementById(id)
                if (el) el.textContent = val
            }
            const show = (id: string) => {
                const el = doc.getElementById(id)
                if (el) el.style.display = ''
            }
            const setAttr = (id: string, attr: string, val: string) => {
                const el = doc.getElementById(id)
                if (el) el.setAttribute(attr, val)
            }

            const esSimulacion = detalle.selloRecepcion?.startsWith('SIM-')

            // === SIMULACIÓN ===
            if (esSimulacion) show('simAlert')

            // === EMISOR ===
            if (emisor) {
                set('emisorRazon', String(emisor.nombre ?? ''))
                set('emisorNit', String(emisor.nit ?? ''))
                set('emisorNrc', String(emisor.nrc ?? ''))
                set('emisorActividad', String(emisor.descActividad ?? ''))
                set('emisorDireccion', String(emisor.complementoDireccion ?? ''))
                set('emisorTelefono', String(emisor.telefono ?? ''))
                set('emisorCorreo', String(emisor.correo ?? ''))
                // Logo nombre
                const logoEl = doc.getElementById('emisorNombre')
                if (logoEl) {
                    logoEl.innerHTML = `${String(emisor.nombre ?? 'Speeddansys')}<br><span>ERP</span>`
                }
            }

            // === IDENTIFICACIÓN DEL DTE ===
            set('codGen', detalle.codigoGeneracion)
            set('numControl', detalle.numeroControl)
            set('selloRecepcion', detalle.selloRecepcion ?? '—')
            set('footerSello', detalle.selloRecepcion ?? '')

            const fechaStr = detalle.fechaEmision
                ? new Date(detalle.fechaEmision).toLocaleString('es-SV')
                : ''
            set('fechaEmision', fechaStr)

            // Condición de pago
            const cond = (detalle as unknown as Record<string, unknown>).condicionPago as string
            set('formaPago', CONDICION_PAGO[cond] ?? 'Contado')

            // === RECEPTOR ===
            set('receptorNombre', detalle.cliente?.nombre ?? 'Consumidor Final')
            set('receptorDoc', detalle.cliente?.numDocumento ?? '')

            // Campos extra de receptor (para CCF, NC, ND)
            const cli = detalle.cliente as unknown as Record<string, unknown> | null
            if (cli) {
                set('receptorNrc', String(cli.nrc ?? ''))
                set('receptorActividad', String(cli.descActividad ?? ''))
                set('receptorDireccion', String(cli.complemento ?? ''))
                set('receptorCorreo', String(cli.correo ?? ''))
                set('receptorTipoDoc', String(cli.tipoDocumento ?? 'DUI'))
            }

            // === ITEMS ===
            const tbody = doc.getElementById('itemsBody')
            if (tbody) {
                let html = ''
                detalle.detalles.forEach((d) => {
                    html += `<tr>
            <td class="bold">${d.numItem}</td>
            <td>${d.producto?.codigo ?? ''}</td>
            <td>${d.descripcion}</td>
            <td class="text-center">Unidad</td>
            <td>${fmtn(d.cantidad)}</td>
            <td>${fmtn(d.precioUnitario)}</td>
            <td>${fmtn(d.descuento)}</td>
            <td>0.00</td>
            <td>${fmtn(d.ventaNoSuj)}</td>
            <td>${fmtn(d.ventaExenta)}</td>
            <td>${fmtn(d.ventaGravada)}</td>
          </tr>`
                    // Tributos row
                    html += `<tr class="tributos-row">
            <td colspan="11">
              <span style="color:#888; margin-right: 50px;">Tributos de la línea</span>
              <span>20 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Impuesto al Valor Agregado 13%</span>
            </td>
          </tr>`
                })
                tbody.innerHTML = html
            }

            // === TOTALES ===
            const tGravada = Number(detalle.totalGravada)
            const tExenta = Number(detalle.totalExenta)
            const tNoSuj = Number(detalle.totalNoSuj)

            set('sumaNoSuj', fmtn(tNoSuj))
            set('sumaExenta', fmtn(tExenta))
            set('sumaGravada', fmtn(tGravada))

            const sumatoria = tGravada + tExenta + tNoSuj
            set('tSumatoria', fmtn(sumatoria))
            set('tDescuento', fmtn(detalle.totalDescuento))
            set('tSubTotal', fmtn(detalle.subTotal))
            set('tIva', fmtn(detalle.totalIva))
            set('tMontoTotal', fmtn(Number(detalle.subTotal) + Number(detalle.totalIva)))
            set('tTotal', fmtn(detalle.totalPagar))

            // CCF-specific totals
            set('tIvaPerc', '0.00')
            set('tIvaRet', '0.00')
            set('tRetRenta', '0.00')

            // === QR CODE ===
            const qrUrl = `https://admin.factura.gob.sv/consultaPublica?ambiente=00&codGen=${detalle.codigoGeneracion}&fechaEmi=${detalle.fechaEmision?.toString().slice(0, 10)}`
            setAttr('qrCode', 'src', `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrUrl)}`)

            // === FECHA IMPRESIÓN ===
            set('fechaImpresion', new Date().toLocaleString('es-SV'))

        }, 80)
    }, [templateHtml, detalle, emisor])

    const handlePrint = () => {
        if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.print()
        }
    }

    const handleDescargarJson = () => {
        if (!detalle) return
        const contenido = JSON.stringify(dteRaw ?? { nota: 'JSON no disponible', facturaId: detalle.id }, null, 2)
        const blob = new Blob([contenido], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `DTE_${detalle.tipoDte}_${detalle.codigoGeneracion}.json`
        a.click()
        URL.revokeObjectURL(url)
        message.success('JSON descargado')
    }

    const tipoLabel = detalle ? (TIPO_LABELS[detalle.tipoDte] ?? `DTE-${detalle.tipoDte}`) : ''
    const esSimulacion = detalle?.selloRecepcion?.startsWith('SIM-')

    return (
        <Modal
            open={!!facturaId}
            onCancel={onClose}
            title={
                <Space>
                    <FileDoneOutlined style={{ color: 'var(--theme-primary)' }} />
                    <span>Comprobante DTE</span>
                    {detalle && <Tag color="blue">{tipoLabel}</Tag>}
                    {esSimulacion && <Tag color="orange">SIMULACIÓN</Tag>}
                </Space>
            }
            width={1020}
            styles={{ body: { padding: 0, height: 700 } }}
            footer={
                <Space>
                    <Tooltip title="Imprimir o Guardar como PDF (Ctrl+P)">
                        <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint} disabled={!detalle}>
                            Imprimir / Guardar PDF
                        </Button>
                    </Tooltip>
                    <Tooltip title="Descargar el JSON DTE para reenviar por correo">
                        <Button icon={<DownloadOutlined />} onClick={handleDescargarJson} disabled={!detalle}>
                            Descargar JSON
                        </Button>
                    </Tooltip>
                    <Button icon={<CloseOutlined />} onClick={onClose}>Cerrar</Button>
                </Space>
            }
            destroyOnClose
        >
            {loading && <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>}
            {error && <Alert type="error" message={error} showIcon style={{ margin: 16 }} />}

            {!loading && !error && detalle && (
                <>
                    {templateHtml ? (
                        <iframe
                            ref={iframeRef}
                            title="Vista DTE"
                            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                        />
                    ) : (
                        <Alert
                            type="info"
                            message={`Plantilla ${detalle.tipoDte}.html no encontrada en json_doc/plantilla/`}
                            description="Cree la plantilla HTML para este tipo de DTE en la carpeta json_doc/plantilla/"
                            style={{ margin: 16 }}
                        />
                    )}
                </>
            )}
        </Modal>
    )
}
