import { useState, useEffect, useCallback } from 'react'
import {
  Card, Table, Button, Tag, Typography, Tooltip, Popconfirm,
  Row, Col, Statistic, message, Space, Modal, Form, Select,
  InputNumber, DatePicker, Input, Tabs, Divider, Badge
} from 'antd'
import {
  PlusOutlined, ReloadOutlined, DeleteOutlined, EditOutlined,
  DollarOutlined, FileExcelOutlined, TagsOutlined, WalletOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { formatCurrency } from '@utils/format'
import dayjs from 'dayjs'

const { Text, Title } = Typography

// Colores predefinidos para categorías
const COLORES_CATEGORIA = [
  '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1',
  '#13c2c2', '#eb2f96', '#fa8c16', '#a0d911', '#2f54eb'
]

export default function GastosPage() {
  const [activeTab, setActiveTab] = useState('gastos')

  // ── Estado: Gastos ────────────────────────────────────────
  const [gastos, setGastos] = useState<GastoInternoRow[]>([])
  const [totalGastos, setTotalGastos] = useState(0)
  const [loadingGastos, setLoadingGastos] = useState(false)
  const [pageG, setPageG] = useState(1)
  const [pageSizeG, setPageSizeG] = useState(20)
  const [filtroCatId, setFiltroCatId] = useState<number | undefined>()
  const [filtroDesde, setFiltroDesde] = useState<string | undefined>()
  const [filtroHasta, setFiltroHasta] = useState<string | undefined>()

  const [modalGastoOpen, setModalGastoOpen] = useState(false)
  const [editandoGasto, setEditandoGasto] = useState<GastoInternoRow | null>(null)
  const [guardandoGasto, setGuardandoGasto] = useState(false)
  const [formGasto] = Form.useForm()

  // ── Estado: Categorías ────────────────────────────────────
  const [categorias, setCategorias] = useState<CategoriaGastoRow[]>([])
  const [loadingCat, setLoadingCat] = useState(false)
  const [modalCatOpen, setModalCatOpen] = useState(false)
  const [editandoCat, setEditandoCat] = useState<CategoriaGastoRow | null>(null)
  const [guardandoCat, setGuardandoCat] = useState(false)
  const [formCat] = Form.useForm()

  // ── Cargar datos ──────────────────────────────────────────
  const cargarCategorias = useCallback(async () => {
    setLoadingCat(true)
    try {
      const res = await window.gastos.listarCategorias()
      setCategorias(res)
    } catch {
      message.error('Error al cargar categorías')
    } finally {
      setLoadingCat(false)
    }
  }, [])

  const cargarGastos = useCallback(async (p = pageG, ps = pageSizeG, catId = filtroCatId, desde = filtroDesde, hasta = filtroHasta) => {
    setLoadingGastos(true)
    try {
      const res = await window.gastos.listar(p, ps, catId, desde, hasta)
      setGastos(res.gastos)
      setTotalGastos(res.total)
    } catch {
      message.error('Error al cargar gastos')
    } finally {
      setLoadingGastos(false)
    }
  }, [pageG, pageSizeG, filtroCatId, filtroDesde, filtroHasta])

  useEffect(() => {
    cargarCategorias()
    cargarGastos()
  }, []) // eslint-disable-line

  // ── Gastos: Handlers ──────────────────────────────────────
  const abrirNuevoGasto = () => {
    setEditandoGasto(null)
    formGasto.resetFields()
    formGasto.setFieldsValue({ fecha: dayjs() })
    setModalGastoOpen(true)
  }

  const abrirEditarGasto = (g: GastoInternoRow) => {
    setEditandoGasto(g)
    formGasto.setFieldsValue({
      categoriaId: g.categoriaId,
      fecha: dayjs(g.fecha),
      monto: Number(g.monto),
      descripcion: g.descripcion,
      notas: g.notas
    })
    setModalGastoOpen(true)
  }

  const handleGuardarGasto = async () => {
    const values = await formGasto.validateFields()
    setGuardandoGasto(true)
    try {
      const payload = {
        ...values,
        fecha: values.fecha.format('YYYY-MM-DD')
      }
      if (editandoGasto) {
        await window.gastos.editar(editandoGasto.id, payload)
        message.success('Gasto actualizado')
      } else {
        await window.gastos.crear(payload)
        message.success('Gasto registrado')
      }
      setModalGastoOpen(false)
      cargarGastos(1)
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Error al guardar gasto')
    } finally {
      setGuardandoGasto(false)
    }
  }

  const handleEliminarGasto = async (id: number) => {
    try {
      await window.gastos.eliminar(id)
      message.success('Gasto eliminado')
      cargarGastos()
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  // ── Categorías: Handlers ──────────────────────────────────
  const abrirNuevaCategoria = () => {
    setEditandoCat(null)
    formCat.resetFields()
    formCat.setFieldsValue({ color: '#1890ff' })
    setModalCatOpen(true)
  }

  const abrirEditarCategoria = (cat: CategoriaGastoRow) => {
    setEditandoCat(cat)
    formCat.setFieldsValue({
      nombre: cat.nombre,
      descripcion: cat.descripcion,
      color: cat.color ?? '#1890ff'
    })
    setModalCatOpen(true)
  }

  const handleGuardarCategoria = async () => {
    const values = await formCat.validateFields()
    setGuardandoCat(true)
    try {
      if (editandoCat) {
        await window.gastos.editarCategoria(editandoCat.id, values)
        message.success('Categoría actualizada')
      } else {
        await window.gastos.crearCategoria(values)
        message.success('Categoría creada')
      }
      setModalCatOpen(false)
      cargarCategorias()
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Error al guardar categoría')
    } finally {
      setGuardandoCat(false)
    }
  }

  const handleEliminarCategoria = async (id: number) => {
    try {
      await window.gastos.eliminarCategoria(id)
      message.success('Categoría desactivada')
      cargarCategorias()
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Error al eliminar categoría')
    }
  }

  // ── Exportar Excel ────────────────────────────────────────
  const exportarXLSX = async () => {
    if (gastos.length === 0) { message.warning('No hay gastos para exportar'); return }
    const ExcelJS = (await import('exceljs')).default
    const wb = new ExcelJS.Workbook()
    wb.creator = 'Speeddansys ERP'
    wb.created = new Date()
    const ws = wb.addWorksheet('Gastos Internos')

    ws.mergeCells('A1:E1')
    const titleCell = ws.getCell('A1')
    titleCell.value = `Gastos Internos — ${new Date().toLocaleDateString('es-SV')}`
    titleCell.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } }
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFf5222d' } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    ws.getRow(1).height = 28

    const headers = ['Fecha', 'Categoría', 'Descripción', 'Monto', 'Notas']
    const headerRow = ws.addRow(headers)
    headerRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFa8071a' } }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
    })
    ws.columns = [{ width: 14 }, { width: 20 }, { width: 35 }, { width: 14 }, { width: 25 }]

    let grandTotal = 0
    gastos.forEach(g => {
      const row = ws.addRow([
        dayjs(g.fecha).format('DD/MM/YYYY'),
        g.categoria.nombre,
        g.descripcion,
        Number(g.monto),
        g.notas ?? ''
      ])
      grandTotal += Number(g.monto)
      row.getCell(4).numFmt = '"$"#,##0.00'
      row.getCell(4).alignment = { horizontal: 'right' }
    })

    const totalRow = ws.addRow(['', '', 'TOTAL:', grandTotal, ''])
    totalRow.getCell(3).font = { bold: true }
    totalRow.getCell(4).numFmt = '"$"#,##0.00'
    totalRow.getCell(4).font = { bold: true, color: { argb: 'FFf5222d' }, size: 11 }
    totalRow.getCell(4).alignment = { horizontal: 'right' }

    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gastos_internos_${new Date().toISOString().slice(0, 10)}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
    message.success('Excel exportado correctamente')
  }

  // ── Cálculos resumen ──────────────────────────────────────
  const totalMonto = gastos.reduce((acc, g) => acc + Number(g.monto), 0)
  const categoriaConMayor = gastos.length > 0
    ? [...gastos].sort((a, b) => Number(b.monto) - Number(a.monto))[0]?.categoria.nombre
    : '—'

  // ── Columnas: Gastos ──────────────────────────────────────
  const columnsGastos: ColumnsType<GastoInternoRow> = [
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      key: 'fecha',
      width: 110,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY')
    },
    {
      title: 'Categoría',
      key: 'categoria',
      width: 160,
      render: (_, r) => (
        <Badge
          color={r.categoria.color ?? '#1890ff'}
          text={<Text style={{ fontSize: 12 }}>{r.categoria.nombre}</Text>}
        />
      )
    },
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'desc',
      render: (v: string) => <Text>{v}</Text>
    },
    {
      title: 'Notas',
      dataIndex: 'notas',
      key: 'notas',
      render: (v: string) => <Text type="secondary" style={{ fontSize: 11 }}>{v ?? '—'}</Text>
    },
    {
      title: 'Monto',
      dataIndex: 'monto',
      key: 'monto',
      width: 110,
      align: 'right',
      render: (v: number | string) => <Text strong style={{ color: '#f5222d' }}>{formatCurrency(v)}</Text>
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 90,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Editar">
            <Button size="small" icon={<EditOutlined />} onClick={() => abrirEditarGasto(record)} />
          </Tooltip>
          <Popconfirm
            title="¿Eliminar este gasto?"
            okText="Eliminar" cancelText="Cancelar" okButtonProps={{ danger: true }}
            onConfirm={() => handleEliminarGasto(record.id)}
          >
            <Tooltip title="Eliminar">
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ]

  // ── Columnas: Categorías ──────────────────────────────────
  const columnsCategorias: ColumnsType<CategoriaGastoRow> = [
    {
      title: 'Color',
      dataIndex: 'color',
      key: 'color',
      width: 70,
      render: (v: string) => (
        <div style={{ width: 24, height: 24, borderRadius: 4, background: v ?? '#1890ff', border: '1px solid #d9d9d9' }} />
      )
    },
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      render: (v: string, r) => (
        <Space>
          <Text strong>{v}</Text>
          <Badge count={r._count?.gastos ?? 0} style={{ backgroundColor: '#8c8c8c' }} showZero />
        </Space>
      )
    },
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'desc',
      render: (v: string) => <Text type="secondary">{v ?? '—'}</Text>
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 90,
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Editar">
            <Button size="small" icon={<EditOutlined />} onClick={() => abrirEditarCategoria(record)} />
          </Tooltip>
          <Popconfirm
            title="¿Desactivar esta categoría?"
            description="Solo se puede desactivar si no tiene gastos registrados."
            okText="Desactivar" cancelText="Cancelar" okButtonProps={{ danger: true }}
            onConfirm={() => handleEliminarCategoria(record.id)}
          >
            <Tooltip title="Desactivar">
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'gastos',
            label: <span><WalletOutlined /> Gastos Internos</span>,
            children: (
              <>
                {/* Cards resumen */}
                <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                  <Col xs={12} md={8}>
                    <Card size="small">
                      <Statistic
                        title="Total Gastos (página)"
                        value={totalGastos}
                        prefix={<WalletOutlined style={{ color: '#f5222d' }} />}
                      />
                    </Card>
                  </Col>
                  <Col xs={12} md={8}>
                    <Card size="small">
                      <Statistic
                        title="Monto (página)"
                        value={totalMonto}
                        precision={2}
                        formatter={v => formatCurrency(Number(v))}
                        prefix={<DollarOutlined style={{ color: '#f5222d' }} />}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} md={8}>
                    <Card size="small">
                      <Statistic
                        title="Mayor Gasto (página)"
                        value={categoriaConMayor}
                        prefix={<TagsOutlined style={{ color: '#faad14' }} />}
                      />
                    </Card>
                  </Col>
                </Row>

                <Card
                  title={<Title level={5} style={{ margin: 0 }}>Gastos Internos</Title>}
                  extra={
                    <Space>
                      <Button icon={<FileExcelOutlined />} onClick={exportarXLSX} style={{ color: '#237804', borderColor: '#237804' }}>
                        Excel
                      </Button>
                      <Button type="primary" icon={<PlusOutlined />} onClick={abrirNuevoGasto}>
                        Nuevo Gasto
                      </Button>
                    </Space>
                  }
                >
                  {/* Filtros */}
                  <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
                    <Col xs={24} sm={8} md={6}>
                      <Select
                        placeholder="Todas las categorías"
                        allowClear
                        style={{ width: '100%' }}
                        value={filtroCatId}
                        onChange={v => { setFiltroCatId(v); cargarGastos(1, pageSizeG, v, filtroDesde, filtroHasta) }}
                        options={categorias.map(c => ({ value: c.id, label: c.nombre }))}
                      />
                    </Col>
                    <Col xs={12} sm={6} md={4}>
                      <DatePicker
                        placeholder="Desde"
                        style={{ width: '100%' }}
                        format="DD/MM/YYYY"
                        onChange={d => {
                          const v = d ? d.format('YYYY-MM-DD') : undefined
                          setFiltroDesde(v)
                          cargarGastos(1, pageSizeG, filtroCatId, v, filtroHasta)
                        }}
                      />
                    </Col>
                    <Col xs={12} sm={6} md={4}>
                      <DatePicker
                        placeholder="Hasta"
                        style={{ width: '100%' }}
                        format="DD/MM/YYYY"
                        onChange={d => {
                          const v = d ? d.format('YYYY-MM-DD') : undefined
                          setFiltroHasta(v)
                          cargarGastos(1, pageSizeG, filtroCatId, filtroDesde, v)
                        }}
                      />
                    </Col>
                    <Col xs={24} sm={4}>
                      <Tooltip title="Recargar">
                        <Button icon={<ReloadOutlined />} onClick={() => cargarGastos()} />
                      </Tooltip>
                    </Col>
                  </Row>

                  <Table
                    dataSource={gastos}
                    columns={columnsGastos}
                    rowKey="id"
                    loading={loadingGastos}
                    size="small"
                    scroll={{ x: 800 }}
                    pagination={{
                      current: pageG, pageSize: pageSizeG, total: totalGastos, showSizeChanger: true,
                      showTotal: (t, range) => `${range[0]}–${range[1]} de ${t} gastos`,
                      onChange: (p, ps) => { setPageG(p); setPageSizeG(ps); cargarGastos(p, ps) }
                    }}
                  />
                </Card>
              </>
            )
          },
          {
            key: 'categorias',
            label: <span><TagsOutlined /> Categorías</span>,
            children: (
              <Card
                title={<Title level={5} style={{ margin: 0 }}>Categorías de Gastos</Title>}
                extra={
                  <Button type="primary" icon={<PlusOutlined />} onClick={abrirNuevaCategoria}>
                    Nueva Categoría
                  </Button>
                }
              >
                <Table
                  dataSource={categorias}
                  columns={columnsCategorias}
                  rowKey="id"
                  loading={loadingCat}
                  size="small"
                  pagination={false}
                />
              </Card>
            )
          }
        ]}
      />

      {/* Modal Gasto */}
      <Modal
        title={editandoGasto ? 'Editar Gasto' : 'Nuevo Gasto Interno'}
        open={modalGastoOpen}
        onOk={handleGuardarGasto}
        onCancel={() => setModalGastoOpen(false)}
        okText={editandoGasto ? 'Guardar Cambios' : 'Registrar Gasto'}
        cancelText="Cancelar"
        confirmLoading={guardandoGasto}
        destroyOnClose
      >
        <Form form={formGasto} layout="vertical" size="middle">
          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item label="Fecha" name="fecha" rules={[{ required: true, message: 'Seleccione una fecha' }]}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Categoría" name="categoriaId" rules={[{ required: true, message: 'Seleccione una categoría' }]}>
                <Select
                  placeholder="Seleccionar categoría"
                  options={categorias.map(c => ({
                    value: c.id,
                    label: (
                      <Space>
                        <div style={{ width: 12, height: 12, borderRadius: 2, background: c.color ?? '#1890ff', display: 'inline-block' }} />
                        {c.nombre}
                      </Space>
                    )
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Descripción" name="descripcion" rules={[{ required: true, message: 'Ingrese una descripción' }]}>
            <Input placeholder="Ej: Pago de energía eléctrica, viático, etc." />
          </Form.Item>
          <Form.Item label="Monto" name="monto" rules={[{ required: true, message: 'Ingrese el monto' }]}>
            <InputNumber
              style={{ width: '100%' }}
              min={0.01}
              precision={2}
              prefix="$"
              placeholder="0.00"
            />
          </Form.Item>
          <Form.Item label="Notas" name="notas">
            <Input.TextArea rows={2} placeholder="Observaciones adicionales (opcional)" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Categoría */}
      <Modal
        title={editandoCat ? 'Editar Categoría' : 'Nueva Categoría de Gasto'}
        open={modalCatOpen}
        onOk={handleGuardarCategoria}
        onCancel={() => setModalCatOpen(false)}
        okText={editandoCat ? 'Guardar Cambios' : 'Crear Categoría'}
        cancelText="Cancelar"
        confirmLoading={guardandoCat}
        destroyOnClose
      >
        <Form form={formCat} layout="vertical" size="middle">
          <Form.Item label="Nombre" name="nombre" rules={[{ required: true, message: 'Ingrese un nombre' }]}>
            <Input placeholder="Ej: Servicios Básicos, Transporte, Viáticos..." />
          </Form.Item>
          <Form.Item label="Descripción" name="descripcion">
            <Input placeholder="Descripción opcional" />
          </Form.Item>
          <Form.Item label="Color identificador" name="color">
            <Select
              options={COLORES_CATEGORIA.map(c => ({
                value: c,
                label: (
                  <Space>
                    <div style={{ width: 16, height: 16, borderRadius: 3, background: c, display: 'inline-block', verticalAlign: 'middle' }} />
                    <Text style={{ fontSize: 12 }}>{c}</Text>
                  </Space>
                )
              }))}
            />
          </Form.Item>
          <Divider style={{ margin: '8px 0' }} />
          <Text type="secondary" style={{ fontSize: 11 }}>
            Vista previa:
          </Text>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.color !== cur.color || prev.nombre !== cur.nombre}>
            {({ getFieldValue }) => (
              <div style={{ marginTop: 6 }}>
                <Badge
                  color={getFieldValue('color') ?? '#1890ff'}
                  text={<Text>{getFieldValue('nombre') || 'Nombre de categoría'}</Text>}
                />
              </div>
            )}
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
