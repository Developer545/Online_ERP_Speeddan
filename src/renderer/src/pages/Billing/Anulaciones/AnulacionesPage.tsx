// Módulo de Anulaciones / Invalidaciones de DTE

import { useState, useEffect, useCallback } from 'react'
import {
  Card, Table, Button, Tag, Space, Typography, Select, Modal, Form,
  Input, Alert, Spin, message, DatePicker, Row, Col, Statistic, Tooltip, Badge
} from 'antd'
import {
  StopOutlined, SearchOutlined, ReloadOutlined,
  ExclamationCircleOutlined, CheckCircleOutlined, AuditOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { Dayjs } from 'dayjs'
import { formatCurrency } from '@utils/format'
import type { FacturaRow } from '@shared/types/billing.types'

const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { TextArea } = Input

const TIPO_DTE_LABELS: Record<string, string> = {
  '01': 'Factura (01)',
  '03': 'CCF (03)',
  '05': 'Nota Crédito (05)',
  '06': 'Nota Débito (06)'
}

const ESTADO_COLORS: Record<string, string> = {
  RECIBIDO: 'green',
  RECHAZADO: 'red',
  CONTINGENCIA: 'gold',
  PENDIENTE_ENVIO: 'blue',
  ANULADO: 'default'
}

interface AnulacionForm {
  tipoInvalidacion: string
  motivoDescripcion: string
  nombreResponsable: string
  docResponsable: string
  nombreSolicita: string
  docSolicita: string
}

export default function AnulacionesPage() {
  const [facturas, setFacturas] = useState<FacturaRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [tipoDteFiltro, setTipoDteFiltro] = useState<string | undefined>()
  const [rango, setRango] = useState<[Dayjs, Dayjs] | null>(null)

  // Modal de anulación
  const [modalVisible, setModalVisible] = useState(false)
  const [facturaAnular, setFacturaAnular] = useState<FacturaRow | null>(null)
  const [anulando, setAnulando] = useState(false)
  const [form] = Form.useForm<AnulacionForm>()

  const cargar = useCallback(async (p = page, ps = pageSize) => {
    setLoading(true)
    try {
      const filtros: Record<string, unknown> = {
        estado: 'RECIBIDO', page: p, pageSize: ps
      }
      if (tipoDteFiltro) filtros.tipoDte = tipoDteFiltro
      if (rango) {
        filtros.desde = rango[0].format('YYYY-MM-DD')
        filtros.hasta = rango[1].format('YYYY-MM-DD')
      }
      const res = await window.billing.listar(filtros)
      setFacturas(res.facturas)
      setTotal(res.total)
    } catch {
      message.error('Error al cargar los comprobantes')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, tipoDteFiltro, rango])

  useEffect(() => { cargar() }, []) // eslint-disable-line

  const abrirModalAnulacion = (factura: FacturaRow) => {
    setFacturaAnular(factura)
    form.resetFields()
    setModalVisible(true)
  }

  const ejecutarAnulacion = async () => {
    if (!facturaAnular) return
    try {
      const values = await form.validateFields()
      setAnulando(true)
      const result = await window.billing.invalidar({
        facturaId: facturaAnular.id,
        ...values
      })
      if (result.ok) {
        message.success('Documento anulado correctamente')
        setModalVisible(false)
        setFacturaAnular(null)
        cargar()
      } else {
        message.error(result.error || 'Error al anular el documento')
      }
    } catch {
      // validación del form
    } finally {
      setAnulando(false)
    }
  }

  const anulados = facturas.filter(f => f.estado === 'ANULADO').length

  const columns: ColumnsType<FacturaRow> = [
    {
      title: 'Tipo DTE',
      dataIndex: 'tipoDte',
      key: 'tipoDte',
      width: 130,
      render: (v: string) => (
        <Tag color={v === '01' ? 'blue' : v === '03' ? 'purple' : 'default'}>
          {TIPO_DTE_LABELS[v] || v}
        </Tag>
      )
    },
    {
      title: 'N° Control DTE',
      dataIndex: 'numeroControl',
      key: 'numeroControl',
      width: 260,
      render: (v: string) => <Text code style={{ fontSize: 11 }}>{v}</Text>
    },
    {
      title: 'Fecha',
      dataIndex: 'fechaEmision',
      key: 'fechaEmision',
      width: 100,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY')
    },
    {
      title: 'Receptor',
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
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 110,
      render: (v: string) => <Tag color={ESTADO_COLORS[v] || 'default'}>{v}</Tag>
    },
    {
      title: 'Sello MH',
      dataIndex: 'selloRecepcion',
      key: 'selloRecepcion',
      width: 100,
      render: (v: string) => v
        ? <Badge status="success" text="Sí" />
        : <Badge status="default" text="No" />
    },
    {
      title: 'Anular',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        record.estado === 'RECIBIDO' ? (
          <Tooltip title="Iniciar proceso de anulación">
            <Button
              size="small"
              danger
              icon={<StopOutlined />}
              onClick={() => abrirModalAnulacion(record)}
            >
              Anular
            </Button>
          </Tooltip>
        ) : (
          <Tag color="default">No disponible</Tag>
        )
      )
    }
  ]

  return (
    <>
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic
              title="Documentos Anulables"
              value={total}
              prefix={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic
              title="Anulados en vista"
              value={anulados}
              valueStyle={{ color: '#8c8c8c' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic
              title="Total en vista"
              value={total}
              prefix={<AuditOutlined style={{ color: 'var(--theme-primary)' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <StopOutlined style={{ color: '#ff4d4f' }} />
            <Title level={5} style={{ margin: 0 }}>Anulaciones / Invalidaciones de DTE</Title>
          </Space>
        }
      >
        <Alert
          type="warning"
          showIcon
          message="Solo se muestran documentos con estado RECIBIDO que pueden ser anulados ante el MH."
          description="La anulación enviará un evento de invalidación al Ministerio de Hacienda. Esta acción no se puede deshacer."
          style={{ marginBottom: 16 }}
          closable
        />

        <Space wrap style={{ marginBottom: 16 }}>
          <Select
            placeholder="Tipo de DTE"
            allowClear
            style={{ width: 160 }}
            value={tipoDteFiltro}
            onChange={setTipoDteFiltro}
            options={[
              { value: '01', label: 'Facturas (01)' },
              { value: '03', label: 'CCF (03)' },
              { value: '05', label: 'Nota Crédito (05)' },
              { value: '06', label: 'Nota Débito (06)' }
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
            setTipoDteFiltro(undefined); setRango(null); cargar(1, pageSize)
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
            showTotal: t => `${t} documentos`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); cargar(p, ps) }
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Modal de anulación */}
      <Modal
        title={
          <Space>
            <StopOutlined style={{ color: '#ff4d4f' }} />
            Anular Documento DTE
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        {facturaAnular && (
          <Alert
            type="warning"
            showIcon
            message="Documento a anular"
            description={
              <Space direction="vertical" size={2}>
                <Text>N° Control: <Text code>{facturaAnular.numeroControl}</Text></Text>
                <Text>Tipo: <Tag>{TIPO_DTE_LABELS[facturaAnular.tipoDte] || facturaAnular.tipoDte}</Tag></Text>
                <span style={{ display: 'block' }}>Total: <Text strong>{formatCurrency(Number(facturaAnular.totalPagar))}</Text></span>
              </Space>
            }
            style={{ marginBottom: 20 }}
          />
        )}

        <Spin spinning={anulando}>
          <Form form={form} layout="vertical">
            <Form.Item
              name="tipoInvalidacion"
              label="Tipo de Invalidación"
              rules={[{ required: true, message: 'Seleccione el tipo' }]}
            >
              <Select
                placeholder="Seleccionar tipo"
                options={[
                  { value: '1', label: '1 — Error en la información del documento' },
                  { value: '2', label: '2 — Rechazo por parte del receptor' },
                  { value: '3', label: '3 — Otro' }
                ]}
              />
            </Form.Item>

            <Form.Item
              name="motivoDescripcion"
              label="Descripción del Motivo"
              rules={[{ required: true, message: 'Ingrese el motivo' }, { min: 10, message: 'Al menos 10 caracteres' }]}
            >
              <TextArea
                rows={3}
                placeholder="Describa el motivo de la anulación..."
                showCount
                maxLength={250}
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="nombreResponsable"
                  label="Nombre del Responsable"
                  rules={[{ required: true, message: 'Requerido' }]}
                >
                  <Input placeholder="Nombre completo" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="docResponsable"
                  label="Documento del Responsable"
                  rules={[{ required: true, message: 'Requerido' }]}
                >
                  <Input placeholder="DUI o NIT" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="nombreSolicita"
                  label="Nombre de quien Solicita"
                  rules={[{ required: true, message: 'Requerido' }]}
                >
                  <Input placeholder="Nombre completo" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="docSolicita"
                  label="Documento de quien Solicita"
                  rules={[{ required: true, message: 'Requerido' }]}
                >
                  <Input placeholder="DUI o NIT" />
                </Form.Item>
              </Col>
            </Row>

            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalVisible(false)}>Cancelar</Button>
              <Button
                type="primary"
                danger
                icon={<StopOutlined />}
                loading={anulando}
                onClick={ejecutarAnulacion}
              >
                Confirmar Anulación
              </Button>
            </Space>
          </Form>
        </Spin>
      </Modal>
    </>
  )
}
