import { useState, useEffect, useCallback } from 'react'
import {
  Card, Table, Typography, Row, Col, Button, Space, DatePicker, TreeSelect,
  Descriptions, message, Empty, Tag
} from 'antd'
import {
  SearchOutlined, PrinterOutlined, AccountBookOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { Dayjs } from 'dayjs'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

interface CuentaInfo {
  id: number
  codigo: string
  nombre: string
  tipo: string
  naturaleza: string
}

interface Movimiento {
  fecha: string
  asientoNumero: number
  asientoId: number
  descripcion: string
  debe: number
  haber: number
  saldo: number
}

interface CuentaOption {
  id: number
  codigo: string
  nombre: string
  children?: CuentaOption[]
}

function buildTreeData(cuentas: CuentaOption[]): any[] {
  return cuentas.map((c) => ({
    value: c.id,
    title: `${c.codigo} - ${c.nombre}`,
    children: c.children?.length ? buildTreeData(c.children) : undefined
  }))
}

export default function LibroMayorPage() {
  const [loading, setLoading] = useState(false)
  const [cuentas, setCuentas] = useState<any[]>([])
  const [cuentaId, setCuentaId] = useState<number | undefined>(undefined)
  const [rango, setRango] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs()
  ])
  const [cuenta, setCuenta] = useState<CuentaInfo | null>(null)
  const [saldoAnterior, setSaldoAnterior] = useState(0)
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])

  useEffect(() => {
    window.contabilidad.listarCuentas()
      .then((data: CuentaOption[]) => {
        setCuentas(buildTreeData(data))
      })
      .catch(() => {
        message.error('Error al cargar catalogo de cuentas')
      })
  }, [])

  const consultar = useCallback(async () => {
    if (!cuentaId) {
      message.warning('Seleccione una cuenta')
      return
    }
    if (!rango[0] || !rango[1]) {
      message.warning('Seleccione un rango de fechas')
      return
    }
    setLoading(true)
    try {
      const res = await window.contabilidad.libroMayor(
        cuentaId,
        rango[0].format('YYYY-MM-DD'),
        rango[1].format('YYYY-MM-DD')
      )
      setCuenta(res.cuenta)
      setSaldoAnterior(res.saldoAnterior ?? 0)
      setMovimientos(res.movimientos ?? [])
      if (!res.movimientos?.length) {
        message.info('No se encontraron movimientos en el rango seleccionado')
      }
    } catch (err: any) {
      message.error(err?.message ?? 'Error al consultar Libro Mayor')
    } finally {
      setLoading(false)
    }
  }, [cuentaId, rango])

  const totalDebe = movimientos.reduce((s, m) => s + Number(m.debe), 0)
  const totalHaber = movimientos.reduce((s, m) => s + Number(m.haber), 0)
  const saldoFinal = movimientos.length > 0
    ? movimientos[movimientos.length - 1].saldo
    : saldoAnterior

  const columns: ColumnsType<Movimiento> = [
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      width: 120,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY')
    },
    {
      title: 'Partida #',
      dataIndex: 'asientoNumero',
      width: 100,
      render: (v: number) => <Text strong>#{v}</Text>
    },
    {
      title: 'Descripcion',
      dataIndex: 'descripcion',
      ellipsis: true
    },
    {
      title: 'Debe',
      dataIndex: 'debe',
      width: 140,
      align: 'right',
      render: (v: number) => v > 0
        ? <Text style={{ color: '#52c41a' }}>{fmt.format(v)}</Text>
        : <Text type="secondary">{fmt.format(0)}</Text>
    },
    {
      title: 'Haber',
      dataIndex: 'haber',
      width: 140,
      align: 'right',
      render: (v: number) => v > 0
        ? <Text style={{ color: '#faad14' }}>{fmt.format(v)}</Text>
        : <Text type="secondary">{fmt.format(0)}</Text>
    },
    {
      title: 'Saldo',
      dataIndex: 'saldo',
      width: 150,
      align: 'right',
      render: (v: number) => (
        <Text strong style={{ color: v >= 0 ? '#1677ff' : '#ff4d4f' }}>
          {fmt.format(v)}
        </Text>
      )
    }
  ]

  const naturalezaColor = (n: string) => {
    switch (n?.toUpperCase()) {
      case 'DEUDORA': return 'green'
      case 'ACREEDORA': return 'orange'
      default: return 'default'
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            <AccountBookOutlined style={{ marginRight: 8 }} />
            Libro Mayor
          </Title>
        </Col>
        <Col>
          <Button
            icon={<PrinterOutlined />}
            onClick={() => window.print()}
            disabled={movimientos.length === 0}
          >
            Imprimir
          </Button>
        </Col>
      </Row>

      <Card size="small" style={{ borderRadius: 10, marginBottom: 16 }}>
        <Space wrap size="middle">
          <div>
            <Text strong style={{ display: 'block', marginBottom: 4 }}>Cuenta:</Text>
            <TreeSelect
              showSearch
              value={cuentaId}
              onChange={(val) => setCuentaId(val)}
              treeData={cuentas}
              placeholder="Seleccione una cuenta"
              style={{ width: 350 }}
              treeDefaultExpandAll={false}
              filterTreeNode={(input, node) =>
                (node?.title as string)?.toLowerCase().includes(input.toLowerCase())
              }
              allowClear
            />
          </div>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 4 }}>Periodo:</Text>
            <RangePicker
              value={rango}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setRango([dates[0], dates[1]])
                }
              }}
              format="DD/MM/YYYY"
              style={{ width: 280 }}
            />
          </div>
          <div style={{ paddingTop: 22 }}>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={consultar}
              loading={loading}
            >
              Consultar
            </Button>
          </div>
        </Space>
      </Card>

      {cuenta && (
        <Card size="small" style={{ borderRadius: 10, marginBottom: 16 }}>
          <Descriptions size="small" column={{ xs: 1, sm: 2, md: 4 }} bordered>
            <Descriptions.Item label="Codigo">
              <Text code>{cuenta.codigo}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Nombre">
              <Text strong>{cuenta.nombre}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Tipo">
              <Tag>{cuenta.tipo}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Naturaleza">
              <Tag color={naturalezaColor(cuenta.naturaleza)}>{cuenta.naturaleza}</Tag>
            </Descriptions.Item>
          </Descriptions>
          <div style={{ marginTop: 12 }}>
            <Text type="secondary">Saldo Anterior: </Text>
            <Text strong style={{ fontSize: 15, color: saldoAnterior >= 0 ? '#1677ff' : '#ff4d4f' }}>
              {fmt.format(saldoAnterior)}
            </Text>
          </div>
        </Card>
      )}

      {movimientos.length === 0 && !loading ? (
        <Card size="small" style={{ borderRadius: 10 }}>
          <Empty description="Seleccione una cuenta y rango de fechas, luego presione Consultar." />
        </Card>
      ) : (
        <Card size="small" style={{ borderRadius: 10 }}>
          <Table
            columns={columns}
            dataSource={movimientos}
            rowKey={(r) => `${r.asientoId}-${r.fecha}`}
            loading={loading}
            size="small"
            pagination={{ pageSize: 50, showSizeChanger: true, showTotal: (t) => `${t} movimientos` }}
            summary={() => {
              if (movimientos.length === 0) return null
              return (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={3}>
                      <Text strong>TOTALES</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <Text style={{ color: '#52c41a', fontWeight: 700, fontSize: 14 }}>
                        {fmt.format(totalDebe)}
                      </Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="right">
                      <Text style={{ color: '#faad14', fontWeight: 700, fontSize: 14 }}>
                        {fmt.format(totalHaber)}
                      </Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="right">
                      <Text style={{ color: saldoFinal >= 0 ? '#1677ff' : '#ff4d4f', fontWeight: 700, fontSize: 14 }}>
                        {fmt.format(saldoFinal)}
                      </Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )
            }}
          />
        </Card>
      )}
    </div>
  )
}
