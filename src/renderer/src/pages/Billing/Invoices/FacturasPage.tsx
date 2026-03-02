import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card, Table, Button, Tag, Space, Typography, Input, Select,
  DatePicker, Tooltip, Badge, message, Popconfirm, Row, Col, Statistic
} from 'antd'
import {
  PlusOutlined, SearchOutlined, ReloadOutlined,
  FilePdfOutlined, SendOutlined, StopOutlined, AuditOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { Dayjs } from 'dayjs'
import type { FacturaRow } from '@shared/types/billing.types'
import { imprimirFacturaPDF } from '@renderer/utils/factura.pdf'
import { formatCurrency } from '@utils/format'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

const ESTADO_COLORS: Record<string, string> = {
  RECIBIDO: 'green',
  RECHAZADO: 'red',
  CONTINGENCIA: 'gold',
  PENDIENTE_ENVIO: 'blue',
  BORRADOR: 'default',
  ANULADO: 'default'
}

export default function FacturasPage() {
  const navigate = useNavigate()
  const [facturas, setFacturas] = useState<FacturaRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [estadoFiltro, setEstadoFiltro] = useState<string | undefined>()
  const [rango, setRango] = useState<[Dayjs, Dayjs] | null>(null)

  const cargar = useCallback(async (p = page, ps = pageSize) => {
    setLoading(true)
    try {
      const filtros: Record<string, unknown> = {
        tipoDte: '01', page: p, pageSize: ps
      }
      if (estadoFiltro) filtros.estado = estadoFiltro
      if (rango) {
        filtros.desde = rango[0].format('YYYY-MM-DD')
        filtros.hasta = rango[1].format('YYYY-MM-DD')
      }
      const res = await window.billing.listar(filtros)
      setFacturas(res.facturas)
      setTotal(res.total)
    } catch {
      message.error('Error al cargar facturas')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, estadoFiltro, rango])

  useEffect(() => { cargar() }, []) // eslint-disable-line

  const handleReenviar = async (id: number) => {
    const result = await window.billing.reenviar(id)
    if (result.ok) {
      message.success('Factura reenviada al MH correctamente')
      cargar()
    } else {
      message.error(result.error || 'Error al reenviar')
    }
  }

  const handleAnular = async (id: number) => {
    message.info(`Anulación de factura ID ${id} — módulo de invalidaciones`)
  }

  const recibidas = facturas.filter(f => f.estado === 'RECIBIDO').length
  const contingencia = facturas.filter(f => f.estado === 'CONTINGENCIA').length
  const totalPagado = facturas.filter(f => f.estado === 'RECIBIDO').reduce((a, f) => a + Number(f.totalPagar), 0)

  const columns: ColumnsType<FacturaRow> = [
    {
      title: 'N° Control DTE',
      dataIndex: 'numeroControl',
      key: 'numeroControl',
      width: 270,
      render: (v: string) => (
        <Text code style={{ fontSize: 11 }}>{v}</Text>
      )
    },
    {
      title: 'Fecha',
      dataIndex: 'fechaEmision',
      key: 'fechaEmision',
      width: 100,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY')
    },
    {
      title: 'Cliente',
      key: 'cliente',
      render: (_, r) => r.cliente?.nombre || <Text type="secondary">Consumidor final</Text>
    },
    {
      title: 'Total',
      dataIndex: 'totalPagar',
      key: 'totalPagar',
      width: 110,
      align: 'right',
      render: (v: number | string) => <Text strong>{formatCurrency(v)}</Text>
    },
    {
      title: 'Estado MH',
      dataIndex: 'estado',
      key: 'estado',
      width: 140,
      render: (v: string) => (
        <Tag color={ESTADO_COLORS[v] || 'default'}>{v}</Tag>
      )
    },
    {
      title: 'Sello MH',
      dataIndex: 'selloRecepcion',
      key: 'selloRecepcion',
      width: 110,
      render: (v: string) => v
        ? <Badge status="success" text="Recibido" />
        : <Badge status="default" text="Pendiente" />
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Descargar PDF">
            <Button
              size="small"
              icon={<FilePdfOutlined />}
              onClick={async () => {
                try {
                  const detalle = await window.billing.getById(record.id)
                  if (detalle) await imprimirFacturaPDF(detalle)
                } catch {
                  message.error('Error al generar el PDF')
                }
              }}
            />
          </Tooltip>
          {record.estado === 'CONTINGENCIA' && (
            <Tooltip title="Reenviar al MH">
              <Button
                size="small"
                type="primary"
                icon={<SendOutlined />}
                onClick={() => handleReenviar(record.id)}
              />
            </Tooltip>
          )}
          {record.estado === 'RECIBIDO' && (
            <Popconfirm
              title="¿Anular esta factura?"
              description="Esta acción enviará un evento de invalidación al MH."
              onConfirm={() => handleAnular(record.id)}
            >
              <Tooltip title="Anular">
                <Button size="small" danger icon={<StopOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ]

  return (
    <>
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="Total Facturas" value={total} prefix={<AuditOutlined style={{ color: 'var(--theme-primary)' }} />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="Recibidas MH" value={recibidas} prefix={<AuditOutlined style={{ color: '#52c41a' }} />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="En Contingencia" value={contingencia} valueStyle={{ color: contingencia > 0 ? '#faad14' : '#8c8c8c' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="Total Facturado" value={totalPagado} precision={2} formatter={v => formatCurrency(Number(v))} />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <Title level={5} style={{ margin: 0 }}>Facturas Electrónicas (DTE-01)</Title>
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/facturacion/facturas/nueva')}>
            Nueva Factura
          </Button>
        }
      >
        <Space wrap style={{ marginBottom: 16 }}>
          <Select
            placeholder="Estado MH"
            allowClear
            style={{ width: 160 }}
            value={estadoFiltro}
            onChange={setEstadoFiltro}
            options={[
              { value: 'RECIBIDO', label: 'Recibido' },
              { value: 'RECHAZADO', label: 'Rechazado' },
              { value: 'CONTINGENCIA', label: 'Contingencia' },
              { value: 'PENDIENTE_ENVIO', label: 'Pendiente envío' },
              { value: 'ANULADO', label: 'Anulado' }
            ]}
          />
          <RangePicker
            format="DD/MM/YYYY"
            placeholder={['Desde', 'Hasta']}
            value={rango}
            onChange={v => setRango(v as [Dayjs, Dayjs] | null)}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={() => cargar(1, pageSize)}>
            Filtrar
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => {
            setEstadoFiltro(undefined); setRango(null); cargar(1, pageSize)
          }}>
            Limpiar
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={facturas}
          loading={loading}
          rowKey="id"
          size="small"
          pagination={{
            current: page, pageSize, total, showSizeChanger: true,
            showTotal: t => `${t} facturas`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); cargar(p, ps) }
          }}
          scroll={{ x: 980 }}
        />
      </Card>
    </>
  )
}
