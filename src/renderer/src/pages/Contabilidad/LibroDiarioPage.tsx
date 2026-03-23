import { useState, useCallback } from 'react'
import {
  Card, Table, Typography, Row, Col, Button, Space, DatePicker, message, Empty
} from 'antd'
import {
  SearchOutlined, PrinterOutlined, BookOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { Dayjs } from 'dayjs'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

interface Detalle {
  id: number
  cuenta: { codigo: string; nombre: string }
  descripcion?: string
  debe: number | string
  haber: number | string
}

interface Asiento {
  id: number
  numero: number
  fecha: string
  descripcion: string
  totalDebe: number | string
  totalHaber: number | string
  periodo?: { nombre: string }
  detalles: Detalle[]
}

export default function LibroDiarioPage() {
  const [loading, setLoading] = useState(false)
  const [asientos, setAsientos] = useState<Asiento[]>([])
  const [rango, setRango] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs()
  ])

  const consultar = useCallback(async () => {
    if (!rango[0] || !rango[1]) {
      message.warning('Seleccione un rango de fechas')
      return
    }
    setLoading(true)
    try {
      const res = await window.contabilidad.libroDiario(
        rango[0].format('YYYY-MM-DD'),
        rango[1].format('YYYY-MM-DD')
      )
      setAsientos(res.asientos ?? [])
      if (!res.asientos?.length) {
        message.info('No se encontraron asientos en el rango seleccionado')
      }
    } catch (err: any) {
      message.error(err?.message ?? 'Error al consultar Libro Diario')
    } finally {
      setLoading(false)
    }
  }, [rango])

  const totalDebe = asientos.reduce((s, a) => s + Number(a.totalDebe), 0)
  const totalHaber = asientos.reduce((s, a) => s + Number(a.totalHaber), 0)

  const expandedRowRender = (record: Asiento) => {
    const detCols: ColumnsType<Detalle> = [
      {
        title: 'Codigo Cuenta',
        dataIndex: ['cuenta', 'codigo'],
        width: 140,
        render: (v: string) => <Text code>{v}</Text>
      },
      {
        title: 'Nombre Cuenta',
        dataIndex: ['cuenta', 'nombre'],
        width: 260
      },
      {
        title: 'Descripcion',
        dataIndex: 'descripcion',
        ellipsis: true,
        render: (v: string) => v || '-'
      },
      {
        title: 'Debe',
        dataIndex: 'debe',
        width: 130,
        align: 'right',
        render: (v: number | string) => {
          const n = Number(v)
          return n > 0
            ? <Text style={{ color: '#52c41a' }}>{fmt.format(n)}</Text>
            : <Text type="secondary">{fmt.format(0)}</Text>
        }
      },
      {
        title: 'Haber',
        dataIndex: 'haber',
        width: 130,
        align: 'right',
        render: (v: number | string) => {
          const n = Number(v)
          return n > 0
            ? <Text style={{ color: '#faad14' }}>{fmt.format(n)}</Text>
            : <Text type="secondary">{fmt.format(0)}</Text>
        }
      }
    ]

    return (
      <Table
        columns={detCols}
        dataSource={record.detalles}
        rowKey="id"
        pagination={false}
        size="small"
        style={{ margin: '0 16px' }}
      />
    )
  }

  const columns: ColumnsType<Asiento> = [
    {
      title: 'Partida #',
      dataIndex: 'numero',
      width: 100,
      render: (v: number) => <Text strong>#{v}</Text>
    },
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      width: 120,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY')
    },
    {
      title: 'Descripcion',
      dataIndex: 'descripcion',
      ellipsis: true
    },
    {
      title: 'Total Debe',
      dataIndex: 'totalDebe',
      width: 150,
      align: 'right',
      render: (v: number | string) => (
        <Text style={{ color: '#52c41a', fontWeight: 600 }}>{fmt.format(Number(v))}</Text>
      )
    },
    {
      title: 'Total Haber',
      dataIndex: 'totalHaber',
      width: 150,
      align: 'right',
      render: (v: number | string) => (
        <Text style={{ color: '#faad14', fontWeight: 600 }}>{fmt.format(Number(v))}</Text>
      )
    }
  ]

  return (
    <div style={{ padding: 24 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            <BookOutlined style={{ marginRight: 8 }} />
            Libro Diario
          </Title>
        </Col>
        <Col>
          <Button
            icon={<PrinterOutlined />}
            onClick={() => window.print()}
            disabled={asientos.length === 0}
          >
            Imprimir
          </Button>
        </Col>
      </Row>

      <Card size="small" style={{ borderRadius: 10, marginBottom: 16 }}>
        <Space wrap>
          <Text strong>Periodo:</Text>
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
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={consultar}
            loading={loading}
          >
            Consultar
          </Button>
        </Space>
      </Card>

      {asientos.length === 0 && !loading ? (
        <Card size="small" style={{ borderRadius: 10 }}>
          <Empty description="No hay datos. Seleccione un rango de fechas y presione Consultar." />
        </Card>
      ) : (
        <Card size="small" style={{ borderRadius: 10 }}>
          <Table
            columns={columns}
            dataSource={asientos}
            rowKey="id"
            loading={loading}
            size="small"
            pagination={{ pageSize: 50, showSizeChanger: true, showTotal: (t) => `${t} asientos` }}
            expandable={{ expandedRowRender }}
            summary={() => {
              if (asientos.length === 0) return null
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
