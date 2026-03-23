// ══════════════════════════════════════════════════════════
// BALANCE GENERAL — Estado de Situacion Financiera
// NIIF para PYMES - Seccion 4
// ══════════════════════════════════════════════════════════

import { useState } from 'react'
import {
  Card, Button, Typography, Row, Col, DatePicker, Space, message, Tag, Divider
} from 'antd'
import {
  PrinterOutlined, SearchOutlined, CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import { formatCurrency } from '@utils/format'

const { Title, Text } = Typography

// ── Tipos ─────────────────────────────────────────────────

interface CuentaBalanceGeneral {
  codigo: string
  nombre: string
  tipo: string
  saldo: number
  nivel: number
}

interface BalanceGeneralResult {
  activos: CuentaBalanceGeneral[]
  pasivos: CuentaBalanceGeneral[]
  patrimonio: CuentaBalanceGeneral[]
  resultadoEjercicio: number
  totalActivos: number
  totalPasivos: number
  totalPatrimonio: number
  cuadra: boolean
  fecha: string
}

// ── Estilos ───────────────────────────────────────────────

const sectionHeaderStyle: React.CSSProperties = {
  background: '#1c2333',
  padding: '8px 16px',
  borderRadius: 6,
  marginBottom: 8,
  marginTop: 12
}

const lineStyle = (nivel: number): React.CSSProperties => ({
  display: 'flex',
  justifyContent: 'space-between',
  padding: `3px ${16}px 3px ${16 + (nivel - 1) * 20}px`,
  fontSize: 14
})

const subTotalStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '6px 16px',
  fontWeight: 700,
  fontSize: 14,
  borderTop: '1px solid #30363d',
  marginTop: 4
}

const grandTotalStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '10px 16px',
  fontWeight: 700,
  fontSize: 16,
  borderRadius: 6,
  marginTop: 12,
  background: 'rgba(22, 119, 255, 0.1)',
  border: '1px solid #1677ff'
}

// ── Helpers ───────────────────────────────────────────────

function agruparPorTipo(cuentas: CuentaBalanceGeneral[]): Map<string, CuentaBalanceGeneral[]> {
  const map = new Map<string, CuentaBalanceGeneral[]>()
  for (const c of cuentas) {
    const grupo = map.get(c.tipo) ?? []
    grupo.push(c)
    map.set(c.tipo, grupo)
  }
  return map
}

function sumarGrupo(cuentas: CuentaBalanceGeneral[]): number {
  return cuentas.reduce((acc, c) => acc + c.saldo, 0)
}

// ── Componente ────────────────────────────────────────────

export default function BalanceGeneralPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<BalanceGeneralResult | null>(null)
  const [fecha, setFecha] = useState<Dayjs>(dayjs())

  async function generar() {
    setLoading(true)
    try {
      const res = await window.contabilidad.balanceGeneral(
        fecha.format('YYYY-MM-DD')
      )
      setData(res)
    } catch {
      message.error('Error al generar el balance general')
    } finally {
      setLoading(false)
    }
  }

  function imprimir() {
    window.print()
  }

  // ── Render helpers ────────────────────────────────────

  function renderCuenta(c: CuentaBalanceGeneral) {
    const isTotalizador = c.nivel <= 2
    return (
      <div key={c.codigo} style={lineStyle(c.nivel)}>
        <Text strong={isTotalizador} style={{ color: '#c9d1d9' }}>
          {c.codigo} {c.nombre}
        </Text>
        <Text
          strong={isTotalizador}
          style={{ fontVariantNumeric: 'tabular-nums', color: '#c9d1d9' }}
        >
          {formatCurrency(c.saldo)}
        </Text>
      </div>
    )
  }

  function renderSeccionCuentas(
    titulo: string,
    cuentas: CuentaBalanceGeneral[],
    total: number,
    labelTotal: string
  ) {
    const grupos = agruparPorTipo(cuentas)
    return (
      <>
        <div style={sectionHeaderStyle}>
          <Text strong style={{ fontSize: 15, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {titulo}
          </Text>
        </div>

        {Array.from(grupos.entries()).map(([tipo, items]) => (
          <div key={tipo}>
            <div style={{ padding: '4px 16px', marginTop: 6 }}>
              <Text strong type="secondary" style={{ fontSize: 13, textTransform: 'uppercase' }}>
                {tipo}
              </Text>
            </div>
            {items.map(renderCuenta)}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '4px 16px',
                borderTop: '1px dashed #30363d',
                marginTop: 2
              }}
            >
              <Text type="secondary" style={{ fontWeight: 600, fontSize: 13 }}>
                Total {tipo}
              </Text>
              <Text type="secondary" style={{ fontWeight: 600, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(sumarGrupo(items))}
              </Text>
            </div>
          </div>
        ))}

        <div style={subTotalStyle}>
          <Text strong>{labelTotal}</Text>
          <Text strong style={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrency(total)}
          </Text>
        </div>
      </>
    )
  }

  const totalPasivoPatrimonio = data
    ? data.totalPasivos + data.totalPatrimonio
    : 0

  // ── Render ────────────────────────────────────────────

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginBottom: 4 }}>Balance General</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        Estado de Situaci&oacute;n Financiera &mdash; NIIF para PYMES Sec. 4
      </Text>

      {/* Filtros */}
      <Card size="small" style={{ borderRadius: 10, marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Text style={{ marginRight: 8 }}>Fecha de corte:</Text>
            <DatePicker
              value={fecha}
              onChange={(val) => { if (val) setFecha(val) }}
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
        <>
          <Row gutter={16}>
            {/* Columna Izquierda: Activos */}
            <Col xs={24} lg={12}>
              <Card
                size="small"
                style={{ borderRadius: 10, minHeight: '100%' }}
                title={
                  <div style={{ textAlign: 'center' }}>
                    <Text strong style={{ fontSize: 15 }}>ACTIVOS</Text>
                  </div>
                }
              >
                {renderSeccionCuentas(
                  'Activos',
                  data.activos,
                  data.totalActivos,
                  'TOTAL ACTIVOS'
                )}
              </Card>
            </Col>

            {/* Columna Derecha: Pasivos + Patrimonio */}
            <Col xs={24} lg={12}>
              <Card
                size="small"
                style={{ borderRadius: 10, minHeight: '100%' }}
                title={
                  <div style={{ textAlign: 'center' }}>
                    <Text strong style={{ fontSize: 15 }}>PASIVOS Y PATRIMONIO</Text>
                  </div>
                }
              >
                {renderSeccionCuentas(
                  'Pasivos',
                  data.pasivos,
                  data.totalPasivos,
                  'TOTAL PASIVOS'
                )}

                <Divider style={{ margin: '12px 0', borderColor: '#30363d' }} />

                {/* Patrimonio */}
                <div style={sectionHeaderStyle}>
                  <Text strong style={{ fontSize: 15, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Patrimonio
                  </Text>
                </div>

                {data.patrimonio.map(renderCuenta)}

                {/* Resultado del Ejercicio */}
                <div style={lineStyle(2)}>
                  <Text style={{ color: '#c9d1d9', fontStyle: 'italic' }}>
                    Resultado del Ejercicio
                  </Text>
                  <Text
                    style={{
                      fontVariantNumeric: 'tabular-nums',
                      color: data.resultadoEjercicio >= 0 ? '#4ade80' : '#f87171'
                    }}
                  >
                    {formatCurrency(data.resultadoEjercicio)}
                  </Text>
                </div>

                <div style={subTotalStyle}>
                  <Text strong>TOTAL PATRIMONIO</Text>
                  <Text strong style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(data.totalPatrimonio)}
                  </Text>
                </div>

                <Divider style={{ margin: '8px 0', borderColor: '#30363d' }} />

                <div style={subTotalStyle}>
                  <Text strong>TOTAL PASIVO + PATRIMONIO</Text>
                  <Text strong style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(totalPasivoPatrimonio)}
                  </Text>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Ecuacion contable */}
          <Card size="small" style={{ borderRadius: 10, marginTop: 16 }}>
            <Row gutter={24} align="middle" justify="center">
              <Col>
                <div style={grandTotalStyle}>
                  <span style={{ marginRight: 24 }}>TOTAL ACTIVOS</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(data.totalActivos)}
                  </span>
                </div>
              </Col>
              <Col>
                <Text strong style={{ fontSize: 20 }}>=</Text>
              </Col>
              <Col>
                <div style={grandTotalStyle}>
                  <span style={{ marginRight: 24 }}>TOTAL PASIVO + PATRIMONIO</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(totalPasivoPatrimonio)}
                  </span>
                </div>
              </Col>
              <Col>
                {data.cuadra ? (
                  <Tag
                    icon={<CheckCircleOutlined />}
                    color="success"
                    style={{ fontSize: 14, padding: '6px 16px' }}
                  >
                    La ecuaci&oacute;n contable cuadra
                  </Tag>
                ) : (
                  <Tag
                    icon={<CloseCircleOutlined />}
                    color="error"
                    style={{ fontSize: 14, padding: '6px 16px' }}
                  >
                    La ecuaci&oacute;n contable NO cuadra
                  </Tag>
                )}
              </Col>
            </Row>
          </Card>
        </>
      )}
    </div>
  )
}
