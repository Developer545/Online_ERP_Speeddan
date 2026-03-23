import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Card, Table, Typography, Row, Col, Statistic, Tag, Space,
  Button, message, Select, Modal, Form, Input, InputNumber,
  DatePicker, Popconfirm, Drawer, Divider, Tooltip
} from 'antd'
import {
  PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined,
  CheckCircleOutlined, StopOutlined, EyeOutlined, MinusCircleOutlined,
  FileTextOutlined, WarningOutlined, BookOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { formatCurrency } from '@utils/format'
import dayjs from 'dayjs'

const { Title, Text } = Typography

// --------------- helpers ---------------

const ESTADO_TAG: Record<string, { color: string; label: string }> = {
  BORRADOR: { color: 'warning', label: 'Borrador' },
  APROBADO: { color: 'success', label: 'Aprobado' },
  ANULADO: { color: 'error', label: 'Anulado' }
}

const TIPO_TAG: Record<string, { color: string; label: string }> = {
  DIARIO: { color: 'blue', label: 'Diario' },
  AJUSTE: { color: 'orange', label: 'Ajuste' },
  CIERRE: { color: 'red', label: 'Cierre' },
  APERTURA: { color: 'green', label: 'Apertura' }
}

interface LineaForm {
  key: number
  cuentaId: number | undefined
  descripcion: string
  debe: number
  haber: number
}

let lineaKeyCounter = 0
const newLinea = (): LineaForm => ({
  key: ++lineaKeyCounter,
  cuentaId: undefined,
  descripcion: '',
  debe: 0,
  haber: 0
})

// --------------- component ---------------

export default function AsientosContablesPage() {
  // data
  const [asientos, setAsientos] = useState<AsientoContableRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [periodos, setPeriodos] = useState<PeriodoContableRow[]>([])
  const [cuentas, setCuentas] = useState<CatalogoCuentaRow[]>([])

  // filters
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [filtroPeriodo, setFiltroPeriodo] = useState<number | undefined>()
  const [filtroEstado, setFiltroEstado] = useState<string | undefined>()

  // modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()
  const [lineas, setLineas] = useState<LineaForm[]>([newLinea(), newLinea()])

  // drawer
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [detalle, setDetalle] = useState<AsientoContableDetalle | null>(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)

  // ------------- fetch helpers ----------------

  const fetchAsientos = useCallback(async () => {
    setLoading(true)
    try {
      const res = await window.contabilidad.listarAsientos(filtroPeriodo, filtroEstado, page, pageSize)
      setAsientos(res.asientos)
      setTotal(res.total)
    } catch (e: any) {
      message.error(e?.message ?? 'Error al cargar asientos')
    } finally {
      setLoading(false)
    }
  }, [filtroPeriodo, filtroEstado, page, pageSize])

  const fetchPeriodos = useCallback(async () => {
    try {
      const res = await window.contabilidad.listarPeriodos()
      setPeriodos(res)
    } catch { /* ignore */ }
  }, [])

  const fetchCuentas = useCallback(async () => {
    try {
      const res = await window.contabilidad.listarCuentas()
      setCuentas(res.filter(c => c.aceptaMovimiento && c.activa))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { fetchPeriodos() }, [fetchPeriodos])
  useEffect(() => { fetchAsientos() }, [fetchAsientos])

  // ------------- KPIs ----------------

  const kpis = useMemo(() => {
    const totalAsientos = total
    const borradores = asientos.filter(a => a.estado === 'BORRADOR').length
    const totalMovimiento = asientos
      .filter(a => a.estado === 'APROBADO')
      .reduce((sum, a) => sum + Number(a.totalDebe), 0)
    return { totalAsientos, borradores, totalMovimiento }
  }, [asientos, total])

  // ------------- modal actions ----------------

  const openCreate = () => {
    setEditingId(null)
    form.resetFields()
    lineaKeyCounter = 0
    setLineas([newLinea(), newLinea()])
    fetchCuentas()
    setModalOpen(true)
  }

  const openEdit = async (record: AsientoContableRow) => {
    setEditingId(record.id)
    fetchCuentas()
    try {
      const full = await window.contabilidad.obtenerAsiento(record.id)
      if (!full) { message.error('Asiento no encontrado'); return }
      form.setFieldsValue({
        fecha: dayjs(full.fecha),
        descripcion: full.descripcion,
        tipo: full.tipo,
        periodoId: full.periodoId
      })
      lineaKeyCounter = 0
      const mapped: LineaForm[] = full.detalles.map(d => ({
        key: ++lineaKeyCounter,
        cuentaId: d.cuentaId,
        descripcion: d.descripcion ?? '',
        debe: Number(d.debe),
        haber: Number(d.haber)
      }))
      setLineas(mapped.length >= 2 ? mapped : [...mapped, newLinea()])
      setModalOpen(true)
    } catch (e: any) {
      message.error(e?.message ?? 'Error al cargar asiento')
    }
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      const totalDebe = lineas.reduce((s, l) => s + (l.debe || 0), 0)
      const totalHaber = lineas.reduce((s, l) => s + (l.haber || 0), 0)

      if (lineas.length < 2) {
        message.warning('Debe agregar al menos 2 líneas')
        return
      }
      if (lineas.some(l => !l.cuentaId)) {
        message.warning('Todas las líneas deben tener una cuenta seleccionada')
        return
      }
      if (lineas.some(l => (l.debe || 0) === 0 && (l.haber || 0) === 0)) {
        message.warning('Cada línea debe tener un monto en Debe o Haber')
        return
      }
      if (Math.abs(totalDebe - totalHaber) > 0.009) {
        message.error('La partida no cuadra: Total Debe debe ser igual a Total Haber')
        return
      }

      setSaving(true)
      const payload = {
        fecha: values.fecha.format('YYYY-MM-DD'),
        descripcion: values.descripcion,
        tipo: values.tipo,
        periodoId: values.periodoId,
        detalles: lineas.map(l => ({
          cuentaId: l.cuentaId!,
          descripcion: l.descripcion || undefined,
          debe: l.debe || 0,
          haber: l.haber || 0
        }))
      }

      if (editingId) {
        await window.contabilidad.editarAsiento(editingId, payload)
        message.success('Asiento actualizado')
      } else {
        await window.contabilidad.crearAsiento(payload)
        message.success('Asiento creado')
      }
      setModalOpen(false)
      fetchAsientos()
    } catch (e: any) {
      if (e?.errorFields) return // form validation
      message.error(e?.message ?? 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleAprobar = async (id: number) => {
    try {
      await window.contabilidad.aprobarAsiento(id)
      message.success('Asiento aprobado')
      fetchAsientos()
    } catch (e: any) {
      message.error(e?.message ?? 'Error al aprobar')
    }
  }

  const handleAnular = async (id: number) => {
    try {
      await window.contabilidad.anularAsiento(id)
      message.success('Asiento anulado')
      fetchAsientos()
    } catch (e: any) {
      message.error(e?.message ?? 'Error al anular')
    }
  }

  const handleEliminar = async (id: number) => {
    try {
      await window.contabilidad.eliminarAsiento(id)
      message.success('Asiento eliminado')
      fetchAsientos()
    } catch (e: any) {
      message.error(e?.message ?? 'Error al eliminar')
    }
  }

  const openDetalle = async (id: number) => {
    setDrawerOpen(true)
    setLoadingDetalle(true)
    try {
      const full = await window.contabilidad.obtenerAsiento(id)
      setDetalle(full)
    } catch (e: any) {
      message.error(e?.message ?? 'Error al cargar detalle')
    } finally {
      setLoadingDetalle(false)
    }
  }

  // ------------- lineas helpers ----------------

  const updateLinea = (key: number, field: keyof LineaForm, value: any) => {
    setLineas(prev => prev.map(l => {
      if (l.key !== key) return l
      const updated = { ...l, [field]: value }
      // auto-clear opposite field
      if (field === 'debe' && (value || 0) > 0) updated.haber = 0
      if (field === 'haber' && (value || 0) > 0) updated.debe = 0
      return updated
    }))
  }

  const removeLinea = (key: number) => {
    setLineas(prev => prev.filter(l => l.key !== key))
  }

  const totalDebe = lineas.reduce((s, l) => s + (l.debe || 0), 0)
  const totalHaber = lineas.reduce((s, l) => s + (l.haber || 0), 0)
  const diferencia = Math.abs(totalDebe - totalHaber)

  // ------------- columns ----------------

  const columns: ColumnsType<AsientoContableRow> = [
    {
      title: '#Partida',
      dataIndex: 'numero',
      width: 90,
      render: (v: number) => <Text strong>#{v}</Text>
    },
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      width: 110,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY')
    },
    {
      title: 'Descripcion',
      dataIndex: 'descripcion',
      ellipsis: true,
      width: 220
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      width: 100,
      render: (v: string) => {
        const t = TIPO_TAG[v] || { color: 'default', label: v }
        return <Tag color={t.color}>{t.label}</Tag>
      }
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      width: 110,
      render: (v: string) => {
        const t = ESTADO_TAG[v] || { color: 'default', label: v }
        return <Tag color={t.color}>{t.label}</Tag>
      }
    },
    {
      title: 'Total Debe',
      dataIndex: 'totalDebe',
      width: 130,
      align: 'right',
      render: (v: number | string) => <Text strong>{formatCurrency(v)}</Text>
    },
    {
      title: 'Total Haber',
      dataIndex: 'totalHaber',
      width: 130,
      align: 'right',
      render: (v: number | string) => <Text strong>{formatCurrency(v)}</Text>
    },
    {
      title: 'Periodo',
      dataIndex: ['periodo', 'nombre'],
      width: 130,
      render: (v: string) => v || '-'
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 200,
      fixed: 'right',
      render: (_: any, record: AsientoContableRow) => (
        <Space size={4}>
          <Tooltip title="Ver detalle">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => openDetalle(record.id)}
            />
          </Tooltip>
          {record.estado === 'BORRADOR' && (
            <Tooltip title="Editar">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => openEdit(record)}
              />
            </Tooltip>
          )}
          {record.estado === 'BORRADOR' && (
            <Popconfirm
              title="Aprobar asiento"
              description="Una vez aprobado no se podra editar. Continuar?"
              onConfirm={() => handleAprobar(record.id)}
              okText="Aprobar"
              cancelText="Cancelar"
            >
              <Tooltip title="Aprobar">
                <Button type="text" size="small" icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />} />
              </Tooltip>
            </Popconfirm>
          )}
          {record.estado !== 'ANULADO' && (
            <Popconfirm
              title="Anular asiento"
              description="Esta accion no se puede deshacer."
              onConfirm={() => handleAnular(record.id)}
              okText="Anular"
              cancelText="Cancelar"
            >
              <Tooltip title="Anular">
                <Button type="text" size="small" icon={<StopOutlined style={{ color: '#ff4d4f' }} />} />
              </Tooltip>
            </Popconfirm>
          )}
          {record.estado === 'BORRADOR' && (
            <Popconfirm
              title="Eliminar asiento"
              description="Se eliminara permanentemente."
              onConfirm={() => handleEliminar(record.id)}
              okText="Eliminar"
              okButtonProps={{ danger: true }}
              cancelText="Cancelar"
            >
              <Tooltip title="Eliminar">
                <Button type="text" size="small" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ]

  // ------------- detail drawer columns ----------------

  const detalleColumns: ColumnsType<DetalleAsientoRow> = [
    {
      title: 'Codigo',
      dataIndex: ['cuenta', 'codigo'],
      width: 110
    },
    {
      title: 'Cuenta',
      dataIndex: ['cuenta', 'nombre'],
      ellipsis: true
    },
    {
      title: 'Descripcion',
      dataIndex: 'descripcion',
      ellipsis: true,
      width: 180,
      render: (v: string | null) => v || '-'
    },
    {
      title: 'Debe',
      dataIndex: 'debe',
      width: 130,
      align: 'right',
      render: (v: number | string) => {
        const n = Number(v)
        return n > 0 ? <Text strong>{formatCurrency(n)}</Text> : '-'
      }
    },
    {
      title: 'Haber',
      dataIndex: 'haber',
      width: 130,
      align: 'right',
      render: (v: number | string) => {
        const n = Number(v)
        return n > 0 ? <Text strong>{formatCurrency(n)}</Text> : '-'
      }
    }
  ]

  // ------------- cuentas options for select ----------------

  const cuentaOptions = useMemo(() => {
    return cuentas.map(c => ({
      value: c.id,
      label: `${c.codigo} - ${c.nombre}`
    }))
  }, [cuentas])

  // ------------- render ----------------

  return (
    <div style={{ padding: 24, height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            <BookOutlined style={{ marginRight: 8 }} />
            Asientos Contables
          </Title>
        </Col>
        <Col>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchAsientos}>
              Actualizar
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Nuevo Asiento
            </Button>
          </Space>
        </Col>
      </Row>

      {/* KPIs */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: 10 }}>
            <Statistic
              title="Total Asientos"
              value={kpis.totalAsientos}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: 10 }}>
            <Statistic
              title="Borradores Pendientes"
              value={kpis.borradores}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: 10 }}>
            <Statistic
              title="Total Movimiento (Aprobados)"
              value={kpis.totalMovimiento}
              prefix="$"
              precision={2}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters + Table */}
      <Card size="small" style={{ borderRadius: 10 }}>
        <Row gutter={12} style={{ marginBottom: 12 }}>
          <Col>
            <Select
              placeholder="Filtrar por periodo"
              allowClear
              style={{ width: 200 }}
              value={filtroPeriodo}
              onChange={v => { setFiltroPeriodo(v); setPage(1) }}
              options={periodos.map(p => ({ value: p.id, label: p.nombre }))}
            />
          </Col>
          <Col>
            <Select
              placeholder="Filtrar por estado"
              allowClear
              style={{ width: 170 }}
              value={filtroEstado}
              onChange={v => { setFiltroEstado(v); setPage(1) }}
              options={[
                { value: 'BORRADOR', label: 'Borrador' },
                { value: 'APROBADO', label: 'Aprobado' },
                { value: 'ANULADO', label: 'Anulado' }
              ]}
            />
          </Col>
        </Row>

        <Table<AsientoContableRow>
          columns={columns}
          dataSource={asientos}
          rowKey="id"
          size="small"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: ['10', '15', '25', '50'],
            showTotal: (t, range) => `${range[0]}-${range[1]} de ${t}`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps) }
          }}
        />
      </Card>

      {/* Modal crear / editar */}
      <Modal
        title={editingId ? 'Editar Asiento Contable' : 'Nuevo Asiento Contable'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText={editingId ? 'Guardar Cambios' : 'Crear Asiento'}
        confirmLoading={saving}
        width={900}
        destroyOnClose
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        <Form form={form} layout="vertical" size="small">
          <Row gutter={12}>
            <Col span={6}>
              <Form.Item name="fecha" label="Fecha" rules={[{ required: true, message: 'Requerido' }]}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="descripcion" label="Descripcion" rules={[{ required: true, message: 'Requerido' }]}>
                <Input placeholder="Descripcion del asiento" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="tipo" label="Tipo" rules={[{ required: true, message: 'Requerido' }]} initialValue="DIARIO">
                <Select
                  options={[
                    { value: 'DIARIO', label: 'Diario' },
                    { value: 'AJUSTE', label: 'Ajuste' },
                    { value: 'CIERRE', label: 'Cierre' },
                    { value: 'APERTURA', label: 'Apertura' }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="periodoId" label="Periodo" rules={[{ required: true, message: 'Requerido' }]}>
                <Select
                  placeholder="Seleccionar"
                  options={periodos
                    .filter(p => p.estado === 'ABIERTO')
                    .map(p => ({ value: p.id, label: p.nombre }))}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <Divider style={{ margin: '8px 0 12px' }}>Lineas de la Partida</Divider>

        {/* Dynamic lines */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #30363d' }}>
                <th style={{ padding: '6px 8px', textAlign: 'left', width: 280 }}>Cuenta</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', width: 180 }}>Descripcion</th>
                <th style={{ padding: '6px 8px', textAlign: 'right', width: 140 }}>Debe</th>
                <th style={{ padding: '6px 8px', textAlign: 'right', width: 140 }}>Haber</th>
                <th style={{ padding: '6px 8px', textAlign: 'center', width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {lineas.map(linea => (
                <tr key={linea.key} style={{ borderBottom: '1px solid #21262d' }}>
                  <td style={{ padding: '4px 4px' }}>
                    <Select
                      showSearch
                      style={{ width: '100%' }}
                      size="small"
                      placeholder="Buscar cuenta..."
                      value={linea.cuentaId}
                      onChange={v => updateLinea(linea.key, 'cuentaId', v)}
                      options={cuentaOptions}
                      filterOption={(input, option) =>
                        (option?.label as string ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                    />
                  </td>
                  <td style={{ padding: '4px 4px' }}>
                    <Input
                      size="small"
                      placeholder="Descripcion"
                      value={linea.descripcion}
                      onChange={e => updateLinea(linea.key, 'descripcion', e.target.value)}
                    />
                  </td>
                  <td style={{ padding: '4px 4px' }}>
                    <InputNumber
                      size="small"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                      value={linea.debe || undefined}
                      placeholder="0.00"
                      onChange={v => updateLinea(linea.key, 'debe', v ?? 0)}
                    />
                  </td>
                  <td style={{ padding: '4px 4px' }}>
                    <InputNumber
                      size="small"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                      value={linea.haber || undefined}
                      placeholder="0.00"
                      onChange={v => updateLinea(linea.key, 'haber', v ?? 0)}
                    />
                  </td>
                  <td style={{ padding: '4px 4px', textAlign: 'center' }}>
                    {lineas.length > 2 && (
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<MinusCircleOutlined />}
                        onClick={() => removeLinea(linea.key)}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #30363d' }}>
                <td style={{ padding: '8px 4px' }} colSpan={2}>
                  <Button
                    type="dashed"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => setLineas(prev => [...prev, newLinea()])}
                  >
                    Agregar Linea
                  </Button>
                </td>
                <td style={{ padding: '8px 4px', textAlign: 'right' }}>
                  <Text strong>{formatCurrency(totalDebe)}</Text>
                </td>
                <td style={{ padding: '8px 4px', textAlign: 'right' }}>
                  <Text strong>{formatCurrency(totalHaber)}</Text>
                </td>
                <td></td>
              </tr>
              {diferencia > 0.009 && (
                <tr>
                  <td colSpan={2} style={{ padding: '4px 4px', textAlign: 'right' }}>
                    <Text type="danger" strong>Diferencia:</Text>
                  </td>
                  <td colSpan={2} style={{ padding: '4px 4px', textAlign: 'center' }}>
                    <Text type="danger" strong>{formatCurrency(diferencia)}</Text>
                  </td>
                  <td></td>
                </tr>
              )}
            </tfoot>
          </table>
        </div>
      </Modal>

      {/* Drawer detalle */}
      <Drawer
        title={detalle ? `Partida #${detalle.numero}` : 'Detalle del Asiento'}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setDetalle(null) }}
        width={700}
        loading={loadingDetalle}
      >
        {detalle && (
          <>
            <Row gutter={[16, 12]}>
              <Col span={8}>
                <Text type="secondary">Fecha</Text>
                <br />
                <Text strong>{dayjs(detalle.fecha).format('DD/MM/YYYY')}</Text>
              </Col>
              <Col span={8}>
                <Text type="secondary">Tipo</Text>
                <br />
                <Tag color={TIPO_TAG[detalle.tipo]?.color ?? 'default'}>
                  {TIPO_TAG[detalle.tipo]?.label ?? detalle.tipo}
                </Tag>
              </Col>
              <Col span={8}>
                <Text type="secondary">Estado</Text>
                <br />
                <Tag color={ESTADO_TAG[detalle.estado]?.color ?? 'default'}>
                  {ESTADO_TAG[detalle.estado]?.label ?? detalle.estado}
                </Tag>
              </Col>
              <Col span={12}>
                <Text type="secondary">Descripcion</Text>
                <br />
                <Text>{detalle.descripcion}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">Periodo</Text>
                <br />
                <Text>{detalle.periodo?.nombre ?? '-'}</Text>
              </Col>
              {detalle.documentoRef && (
                <Col span={12}>
                  <Text type="secondary">Documento Ref.</Text>
                  <br />
                  <Text>{detalle.documentoRef}</Text>
                </Col>
              )}
              {detalle.creadoPor && (
                <Col span={12}>
                  <Text type="secondary">Creado Por</Text>
                  <br />
                  <Text>{detalle.creadoPor}</Text>
                </Col>
              )}
            </Row>

            <Divider />

            <Table<DetalleAsientoRow>
              columns={detalleColumns}
              dataSource={detalle.detalles}
              rowKey="id"
              size="small"
              pagination={false}
              summary={() => {
                const sumDebe = detalle.detalles.reduce((s, d) => s + Number(d.debe), 0)
                const sumHaber = detalle.detalles.reduce((s, d) => s + Number(d.haber), 0)
                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={3} align="right">
                        <Text strong>Totales</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3} align="right">
                        <Text strong style={{ color: '#1677ff' }}>{formatCurrency(sumDebe)}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4} align="right">
                        <Text strong style={{ color: '#1677ff' }}>{formatCurrency(sumHaber)}</Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                )
              }}
            />
          </>
        )}
      </Drawer>
    </div>
  )
}
