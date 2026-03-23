// ══════════════════════════════════════════════════════════
// BALANCE DE COMPROBACION
// Reporte contable: saldos de todas las cuentas del periodo
// ══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import {
  Card, Table, Button, Typography, Row, Col, Statistic,
  DatePicker, Select, Space, message, Tag
} from 'antd'
import {
  PrinterOutlined, SearchOutlined, CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { Dayjs } from 'dayjs'
import { formatCurrency } from '@utils/format'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

// ── Tipos ─────────────────────────────────────────────────

interface CuentaBalance {
  cuentaId: number
  codigo: string
  nombre: string
  tipo: string
  naturaleza: string
  nivel: number
  debitos: number
  creditos: number
  saldoDeudor: number
  saldoAcreedor: number
}

interface BalanceComprobacionResult {
  cuentas: CuentaBalance[]
  totalDebitos: number
  totalCreditos: number
  totalSaldoDeudor: number
  totalSaldoAcreedor: number
}

interface Periodo {
  id: number
  nombre: string
  desde: string
  hasta: string
  estado: string
}

// ── Componente ────────────────────────────────────────────

export default function BalanceComprobacionPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<BalanceComprobacionResult | null>(null)
  const [periodos, setPeriodos] = useState<Periodo[]>([])
  const [periodoId, setPeriodoId] = useState<number | undefined>()
  const [rango, setRango] = useState<[Dayjs, Dayjs] | null>(null)
  const [modo, setModo] = useState<'periodo' | 'rango'>('periodo')

  useEffect(() => {
    cargarPeriodos()
  }, [])

  async function cargarPeriodos() {
    try {
      const res = await window.contabilidad.listarPeriodos()
      setPeriodos(res ?? [])
    } catch {
      message.error('Error al cargar períodos contables')
    }
  }

  async function generar() {
    setLoading(true)
    try {
      let desde: string | undefined
      let hasta: string | undefined

      if (modo === 'rango' && rango) {
        desde = rango[0].format('YYYY-MM-DD')
        hasta = rango[1].format('YYYY-MM-DD')
      }

      const res = await window.contabilidad.balanceComprobacion(
        modo === 'periodo' ? periodoId : undefined,
        desde,
        hasta
      )
      setData(res)
    } catch {
      message.error('Error al generar el balance de comprobación')
    } finally {
      setLoading(false)
    }
  }

  function imprimir() {
    window.print()
  }

  const cuadra = data
    ? Math.abs(data.totalDebitos - data.totalCreditos) < 0.01
    : false

  // ── Columnas ──────────────────────────────────────────

  const columns: ColumnsType<CuentaBalance> = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      width: 120,
      render: (v: string, r: CuentaBalance) => (
        <Text strong={r.nivel <= 2} style={{ paddingLeft: (r.nivel - 1) * 16 }}>
          {v}
        </Text>
      )
    },
    {
      title: 'Cuenta',
      dataIndex: 'nombre',
      key: 'nombre',
      ellipsis: true,
      render: (v: string, r: CuentaBalance) => (
        <Text strong={r.nivel <= 2} style={{ paddingLeft: (r.nivel - 1) * 16 }}>
          {v}
        </Text>
      )
    },
    {
      title: 'Débitos',
      dataIndex: 'debitos',
      key: 'debitos',
      width: 140,
      align: 'right',
      render: (v: number) => formatCurrency(v)
    },
    {
      title: 'Créditos',
      dataIndex: 'creditos',
      key: 'creditos',
      width: 140,
      align: 'right',
      render: (v: number) => formatCurrency(v)
    },
    {
      title: 'Saldo Deudor',
      dataIndex: 'saldoDeudor',
      key: 'saldoDeudor',
      width: 140,
      align: 'right',
      render: (v: number) => v > 0 ? formatCurrency(v) : ''
    },
    {
      title: 'Saldo Acreedor',
      dataIndex: 'saldoAcreedor',
      key: 'saldoAcreedor',
      width: 140,
      align: 'right',
      render: (v: number) => v > 0 ? formatCurrency(v) : ''
    }
  ]

  // ── Render ────────────────────────────────────────────

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginBottom: 24 }}>Balance de Comprobaci&oacute;n</Title>

      {/* Filtros */}
      <Card size="small" style={{ borderRadius: 10, marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Select
              value={modo}
              onChange={setModo}
              style={{ width: 160 }}
              options={[
                { label: 'Por Periodo', value: 'periodo' },
                { label: 'Por Rango', value: 'rango' }
              ]}
            />
          </Col>

          {modo === 'periodo' ? (
            <Col>
              <Select
                placeholder="Seleccione un per\u00EDodo"
                value={periodoId}
                onChange={setPeriodoId}
                style={{ width: 260 }}
                allowClear
                options={periodos.map(p => ({
                  label: `${p.nombre} (${p.estado})`,
                  value: p.id
                }))}
              />
            </Col>
          ) : (
            <Col>
              <RangePicker
                value={rango}
                onChange={(vals) => setRango(vals as [Dayjs, Dayjs] | null)}
                format="DD/MM/YYYY"
              />
            </Col>
          )}

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

      {/* KPIs */}
      {data && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={5}>
            <Card size="small" style={{ borderRadius: 10 }}>
              <Statistic
                title="Total D\u00E9bitos"
                value={data.totalDebitos}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#1677ff' }}
              />
            </Card>
          </Col>
          <Col span={5}>
            <Card size="small" style={{ borderRadius: 10 }}>
              <Statistic
                title="Total Cr\u00E9ditos"
                value={data.totalCreditos}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#1677ff' }}
              />
            </Card>
          </Col>
          <Col span={5}>
            <Card size="small" style={{ borderRadius: 10 }}>
              <Statistic
                title="Saldo Deudor"
                value={data.totalSaldoDeudor}
                precision={2}
                prefix="$"
              />
            </Card>
          </Col>
          <Col span={5}>
            <Card size="small" style={{ borderRadius: 10 }}>
              <Statistic
                title="Saldo Acreedor"
                value={data.totalSaldoAcreedor}
                precision={2}
                prefix="$"
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small" style={{ borderRadius: 10 }}>
              {cuadra ? (
                <Tag
                  icon={<CheckCircleOutlined />}
                  color="success"
                  style={{ fontSize: 14, padding: '4px 12px', marginTop: 8 }}
                >
                  Cuadra
                </Tag>
              ) : (
                <Tag
                  icon={<CloseCircleOutlined />}
                  color="error"
                  style={{ fontSize: 14, padding: '4px 12px', marginTop: 8 }}
                >
                  No cuadra
                </Tag>
              )}
            </Card>
          </Col>
        </Row>
      )}

      {/* Tabla */}
      {data && (
        <Card size="small" style={{ borderRadius: 10 }}>
          <Table<CuentaBalance>
            size="small"
            columns={columns}
            dataSource={data.cuentas}
            rowKey="cuentaId"
            pagination={false}
            scroll={{ y: 500 }}
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row
                  style={{ background: '#161b22', fontWeight: 700 }}
                >
                  <Table.Summary.Cell index={0} colSpan={2}>
                    <Text strong>TOTALES</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right">
                    <Text strong>{formatCurrency(data.totalDebitos)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="right">
                    <Text strong>{formatCurrency(data.totalCreditos)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="right">
                    <Text strong>{formatCurrency(data.totalSaldoDeudor)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} align="right">
                    <Text strong>{formatCurrency(data.totalSaldoAcreedor)}</Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        </Card>
      )}
    </div>
  )
}
