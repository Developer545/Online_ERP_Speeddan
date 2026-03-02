// ══════════════════════════════════════════════════════════
// VISOR DE BOLETA DE PAGO / CONSTANCIA SALARIAL
// Carga plantilla HTML + inyecta datos (patrón FacturaViewer)
// ══════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react'
import { Modal, Button, Space, Spin, Alert, Tag, Tooltip } from 'antd'
import { PrinterOutlined, CloseOutlined, FileTextOutlined } from '@ant-design/icons'

interface BoletaProps {
    open: boolean
    planillaId: number | null
    empleadoId: number | null
    onClose: () => void
}

function fmtn(n: number | string | undefined): string {
    const val = Number(n ?? 0)
    return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function BoletaViewer({ open, planillaId, empleadoId, onClose }: BoletaProps) {
    const [loading, setLoading] = useState(false)
    const [boleta, setBoleta] = useState<Record<string, any> | null>(null)
    const [templateHtml, setTemplateHtml] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const iframeRef = useRef<HTMLIFrameElement>(null)

    useEffect(() => {
        if (!open || !planillaId || !empleadoId) return
        setLoading(true)
        setError(null)
        setBoleta(null)
        setTemplateHtml(null)

        Promise.all([
            (window as any).planilla.getBoleta(planillaId, empleadoId),
            (window as any).documentos.leerPlantilla('boleta_pago')
        ]).then(([b, t]) => {
            if (!b) { setError('Boleta no encontrada'); return }
            setBoleta(b)
            if (t.ok && t.html) setTemplateHtml(t.html)
            else setError('Plantilla boleta_pago.html no encontrada')
        }).catch(err => setError(String(err))).finally(() => setLoading(false))
    }, [open, planillaId, empleadoId])

    // Inyectar datos en la plantilla
    useEffect(() => {
        if (!templateHtml || !boleta || !iframeRef.current) return
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

            set('periodo', boleta.periodo)
            set('empNombre', boleta.empleado?.nombre ?? '—')
            set('empDUI', boleta.empleado?.dui ?? '—')
            set('empCargo', boleta.empleado?.cargo ?? '—')
            set('empFechaIngreso', boleta.empleado?.fechaIngreso
                ? new Date(boleta.empleado.fechaIngreso).toLocaleDateString('es-SV')
                : '—')

            set('salarioBruto', fmtn(boleta.salarioBruto))
            set('isss', `-${fmtn(boleta.isss)}`)
            set('afp', `-${fmtn(boleta.afp)}`)
            set('renta', boleta.renta > 0 ? `-${fmtn(boleta.renta)}` : '$0.00 (Exento)')
            set('otrasDeducciones', `-${fmtn(boleta.otrasDeducciones)}`)
            set('totalDeducciones', `-${fmtn(boleta.totalDeducciones)}`)
            set('salarioNeto', fmtn(boleta.salarioNeto))
            set('isssPatronal', fmtn(boleta.isssPatronal))
            set('afpPatronal', fmtn(boleta.afpPatronal))
            set('insaforp', fmtn(boleta.insaforp))
            set('fechaImpresion', new Date().toLocaleString('es-SV'))
        }, 80)
    }, [templateHtml, boleta])

    const handlePrint = () => {
        iframeRef.current?.contentWindow?.print()
    }

    return (
        <Modal
            open={open}
            onCancel={onClose}
            title={
                <Space>
                    <FileTextOutlined style={{ color: '#096dd9' }} />
                    <span>Boleta de Pago</span>
                    {boleta && <Tag color="blue">{boleta.periodo}</Tag>}
                </Space>
            }
            width={780}
            styles={{ body: { padding: 0, height: 600 } }}
            footer={
                <Space>
                    <Tooltip title="Imprimir o Guardar PDF">
                        <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint} disabled={!boleta}>
                            Imprimir / PDF
                        </Button>
                    </Tooltip>
                    <Button icon={<CloseOutlined />} onClick={onClose}>Cerrar</Button>
                </Space>
            }
            destroyOnClose
        >
            {loading && <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>}
            {error && <Alert type="error" message={error} showIcon style={{ margin: 16 }} />}

            {!loading && !error && boleta && (
                templateHtml ? (
                    <iframe
                        ref={iframeRef}
                        title="Boleta de Pago"
                        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                    />
                ) : (
                    <Alert
                        type="info"
                        message="Plantilla no encontrada"
                        description="Cree boleta_pago.html en json_doc/plantilla/"
                        style={{ margin: 16 }}
                    />
                )
            )}
        </Modal>
    )
}

// ══════════════════════════════════════════════════════════
// CONSTANCIA SALARIAL VIEWER
// ══════════════════════════════════════════════════════════

interface ConstanciaProps {
    open: boolean
    empleadoId: number | null
    meses?: number
    onClose: () => void
}

export function ConstanciaViewer({ open, empleadoId, meses = 6, onClose }: ConstanciaProps) {
    const [loading, setLoading] = useState(false)
    const [constancia, setConstancia] = useState<Record<string, any> | null>(null)
    const [templateHtml, setTemplateHtml] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const iframeRef = useRef<HTMLIFrameElement>(null)

    useEffect(() => {
        if (!open || !empleadoId) return
        setLoading(true)
        setError(null)
        setConstancia(null)
        setTemplateHtml(null)

        Promise.all([
            (window as any).planilla.constanciaSalarial(empleadoId, meses),
            (window as any).documentos.leerPlantilla('constancia_salarial')
        ]).then(([c, t]) => {
            if (!c) { setError('Empleado no encontrado'); return }
            setConstancia(c)
            if (t.ok && t.html) setTemplateHtml(t.html)
            else setError('Plantilla constancia_salarial.html no encontrada')
        }).catch(err => setError(String(err))).finally(() => setLoading(false))
    }, [open, empleadoId, meses])

    useEffect(() => {
        if (!templateHtml || !constancia || !iframeRef.current) return
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

            const emp = constancia.empleado
            set('empNombre', emp?.nombre ?? '—')
            set('empDUI', emp?.dui ?? '—')
            set('empNIT', emp?.nit ?? '—')
            set('empCargo', emp?.cargo ?? '—')
            set('empSalario', fmtn(emp?.salarioActual))
            set('empFechaIngreso', emp?.fechaIngreso
                ? new Date(emp.fechaIngreso).toLocaleDateString('es-SV')
                : '—')
            set('empDireccion', emp?.direccion ?? '—')
            set('fechaEmision', new Date().toLocaleDateString('es-SV'))

            // Inyectar historial como tabla HTML
            const tbody = doc.getElementById('historialBody')
            if (tbody && constancia.historial) {
                let html = ''
                for (const h of constancia.historial) {
                    html += `<tr>
            <td>${h.periodo}</td>
            <td class="monto">${fmtn(h.salarioBruto)}</td>
            <td class="monto negativo">${fmtn(h.totalDeducciones)}</td>
            <td class="monto positivo">${fmtn(h.salarioNeto)}</td>
          </tr>`
                }
                tbody.innerHTML = html
            }
        }, 80)
    }, [templateHtml, constancia])

    const handlePrint = () => {
        iframeRef.current?.contentWindow?.print()
    }

    return (
        <Modal
            open={open}
            onCancel={onClose}
            title={
                <Space>
                    <FileTextOutlined style={{ color: '#096dd9' }} />
                    <span>Constancia Salarial</span>
                </Space>
            }
            width={780}
            styles={{ body: { padding: 0, height: 600 } }}
            footer={
                <Space>
                    <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint} disabled={!constancia}>
                        Imprimir / PDF
                    </Button>
                    <Button icon={<CloseOutlined />} onClick={onClose}>Cerrar</Button>
                </Space>
            }
            destroyOnClose
        >
            {loading && <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>}
            {error && <Alert type="error" message={error} showIcon style={{ margin: 16 }} />}

            {!loading && !error && constancia && (
                templateHtml ? (
                    <iframe
                        ref={iframeRef}
                        title="Constancia Salarial"
                        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                    />
                ) : (
                    <Alert
                        type="info"
                        message="Plantilla no encontrada"
                        description="Cree constancia_salarial.html en json_doc/plantilla/"
                        style={{ margin: 16 }}
                    />
                )
            )}
        </Modal>
    )
}
