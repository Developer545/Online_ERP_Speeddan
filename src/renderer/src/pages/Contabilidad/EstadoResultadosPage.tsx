// ══════════════════════════════════════════════════════════
// ESTADO DE RESULTADOS
// NIIF para PYMES - Seccion 5
// ══════════════════════════════════════════════════════════

import { useState } from 'react'
import {
  Card, Button, Typography, Row, Col, DatePicker, Space, message, Divider
} from 'antd'
import {
  PrinterOutlined, SearchOutlined
} from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import { formatCurrency } from '@utils/format'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

// ── Tipos ─────────────────────────────────────────────────

interface LineaEstado {
  nombre: string
  codigo: string
  saldo: number
}

interface EstadoResultadosResult {
  ingresos: LineaEstado[]
  costos: LineaEstado[]
  gastos: LineaEstado[]
  totalIngresos: number
  totalCostos: number
  totalGastos: number
  utilidadBruta: number
  utilidadOperacion: number
  utilidadNeta: number
  desde: string
  hasta: string
}

// ── Estilos ───────────────────────────────────────────────

const sectionHeaderStyle: React.CSSProperties = {
  background: '#1c2333',
  padding: '8px 16px',
  borderRadius: 6,
  marginTop: 16,
  marginBottom: 8
}

const lineStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '4px 24px',
  fontSize: 14
}

const totalLineStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '6px 16px',
  fontWeight: 700,
  fontSize: 14,
  borderTop: '1px solid #30363d',
  marginTop: 4
}

const grandTotalStyle = (isPositive: boolean): React.CSSProperties => ({
  display: 'flex',
  justifyContent: 'space-between',
  padding: '10px 16px',
  fontWeight: 700,
  fontSize: 16,
  borderRadius: 6,
  marginTop: 8,
  background: isPositive ? 'rgba(22, 163, 74, 0.15)' : 'rgba(220, 38, 38, 0.15)',
  border: `1px solid ${isPositive ? '#16a34a' : '#dc2626'}`
})

// ── Componente ────────────────────────────────────────────

export default function EstadoResultadosPage() {
  const currentYear = dayjs().year()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<EstadoResultadosResult | null>(null)
  const [rango, setRango] = useState<[Dayjs, Dayjs]>([
    dayjs(`${currentYear}-01-01`),
    dayjs(`${currentYear}-12-31`)
  ])

  async function generar() {
    if (!rango) return
    setLoading(true)
    try {
      const res = await window.contabilidad.estadoResultados(
        rango[0].format('YYYY-MM-DD'),
        rango[1].format('YYYY-MM-DD')
      )
      setData(res)
    } catch {
      message.error('Error al generar el estado de resultados')
    } finally {
      setLoading(false)
    }
  }

  function imprimir() {
    window.print()
  }

  // ── Render helpers ────────────────────────────────────

  function renderLinea(item: LineaEstado) {
    const isNegative = item.saldo < 0
    return (
      <div key={item.codigo} style={lineStyle}>
        <Text style={{ color: '#c9d1d9' }}>
          {item.codigo} {item.nombre}
        </Text>
        <Text style={{ color: isNegative ? '#f87171' : '#c9d1d9', fontVariantNumeric: 'tabular-nums' }}>
          {isNegative ? `(${formatCurrency(Math.abs(item.saldo))})` : formatCurrency(item.saldo)}
        </Text>
      </div>
    )
  }

  function renderSeccion(titulo: string, items: LineaEstado[], total: number, labelTotal: string) {
    return (
      <>
        <div style={sectionHeaderStyle}>
          <Text strong style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {titulo}
          </Text>
        </div>
        {items.map(renderLinea)}
        <div style={totalLineStyle}>
          <Text strong>{labelTotal}</Text>
          <Text strong style={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrency(total)}
          </Text>
        </div>
      </>
    )
  }

  // ── Render ────────────────────────────────────────────

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginBottom: 4 }}>Estado de Resultados</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        NIIF para PYMES - Secci&oacute;n 5
      </Text>

      {/* Filtros */}
      <Card size="small" style={{ borderRadius: 10, marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <RangePicker
              value={rango}
              onChange={(vals) => {
                if (vals) setRango(vals as [Dayjs, Dayjs])
              }}
              format="DD/MM/YYYY"
            />
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              loading={loading}
              onClick={generar}
            >
              Generar
            </Button>
          </Col>
          {data && (
            <Col>
              <Button icon={<PrinterOutlined />} onClick={imprimir}>
                Imprimir
              </Button>
            </Col>
          )}
        </Row>
      </Card>

      {/* Reporte */}
      {data && (
        <Card
          size="small"
          style={{ borderRadius: 10, maxWidth: 800 }}
          title={
            <div style={{ textAlign: 'center' }}>
              <Text strong style={{ fontSize: 16 }}>ESTADO DE RESULTADOS</Text>
              <br />
              <Text type="secondary">
                Del {dayjs(data.desde).format('DD/MM/YYYY')} al {dayjs(data.hasta).format('DD/MM/YYYY')}
              </Text>
            </div>
          }
        >
          {/* Ingresos */}
          {renderSeccion(
            'Ingresos de Operaci\u00F3n',
            data.ingresos,
            data.totalIngresos,
            'Total Ingresos'
          )}

          {/* Costos */}
          {renderSeccion(
            'Costo de Ventas',
            data.costos,
            data.totalCostos,
            'Total Costos'
          )}

          {/* Utilidad Bruta */}
          <div style={grandTotalStyle(data.utilidadBruta >= 0)}>
            <span>UTILIDAD BRUTA</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatCurrency(data.utilidadBruta)}
            </span>
          </div>

          {/* Gastos */}
          {renderSeccion(
            'Gastos de Operaci\u00F3n',
            data.gastos,
            data.totalGastos,
            'Total Gastos'
          )}

          {/* Utilidad de Operacion */}
          <div style={grandTotalStyle(data.utilidadOperacion >= 0)}>
            <span>UTILIDAD DE OPERACI&Oacute;N</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatCurrency(data.utilidadOperacion)}
            </span>
          </div>

          <Divider style={{ margin: '12px 0', borderColor: '#30363d' }} />

          {/* Utilidad Neta */}
          <div
            style={{
              ...grandTotalStyle(data.utilidadNeta >= 0),
              fontSize: 18,
              padding: '12px 16px'
            }}
          >
            <span>UTILIDAD NETA DEL EJERCICIO</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatCurrency(data.utilidadNeta)}
            </span>
          </div>
        </Card>
      )}
    </div>
  )
}
