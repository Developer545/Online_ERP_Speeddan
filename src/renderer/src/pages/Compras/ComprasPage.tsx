import { useState, useEffect, useCallback } from 'react'
import {
  Card, Table, Button, Input, Tag, Typography, Tooltip, Popconfirm,
  Row, Col, Statistic, message, Space, Modal, Form, Select,
  InputNumber, DatePicker, Divider, Drawer
} from 'antd'
import {
  PlusOutlined, SearchOutlined, ReloadOutlined, EyeOutlined,
  StopOutlined, ShoppingCartOutlined, DollarOutlined, FileExcelOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { formatCurrency, formatNumber } from '@utils/format'
import dayjs from 'dayjs'

const { Text, Title } = Typography

const TIPOS_DOC = [
  { value: 'FACTURA', label: 'Factura' },
  { value: 'CCF', label: 'Crédito Fiscal (CCF)' },
  { value: 'RECIBO', label: 'Recibo' },
  { value: 'TICKET', label: 'Ticket / Tiquete' },
  { value: 'NOTA', label: 'Nota de Entrada' }
]

const CONDICIONES = [
  { value: 'CONTADO', label: 'Contado' },
  { value: 'CREDITO', label: 'Crédito' }
]

interface DetalleItem {
  productoId: number
  productoNombre: string
  descripcion: string
  cantidad: number
  costoUnitario: number
  descuento: number
}

const TIPOS_COMPRA = [
  { value: 'PRODUCTO', label: 'Compra de Productos' },
  { value: 'GASTO_SERVICIO', label: 'Gasto / Servicio (con doc. fiscal)' }
]

export default function ComprasPage() {
  const [compras, setCompras] = useState<CompraRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [busqueda, setBusqueda] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [detalleDrawer, setDetalleDrawer] = useState<CompraDetalle | null>(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)

  const [proveedores, setProveedores] = useState<ProveedorRow[]>([])
  const [productos, setProductos] = useState<ProductoRow[]>([])
  const [detalles, setDetalles] = useState<DetalleItem[]>([])
  const [tipoCompra, setTipoCompra] = useState<'PRODUCTO' | 'GASTO_SERVICIO'>('PRODUCTO')
  const [form] = Form.useForm()

  const cargar = useCallback(async (p = page, ps = pageSize, b = busqueda) => {
    setLoading(true)
    try {
      const res = await window.compras.listar(p, ps, b || undefined)
      setCompras(res.compras)
      setTotal(res.total)
    } catch {
      message.error('Error al cargar compras')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, busqueda])

  useEffect(() => {
    cargar()
    window.proveedores.listar(1, 200).then(r => setProveedores(r.proveedores))
    window.products.listar(1, 500).then(r => setProductos(r.productos))
  }, []) // eslint-disable-line

  const calcTotales = () => {
    const subtotal = detalles.reduce((acc, d) => acc + d.cantidad * d.costoUnitario * (1 - d.descuento / 100), 0)
    const iva = subtotal * 0.13
    return { subtotal, iva, total: subtotal + iva }
  }

  const agregarDetalle = () => {
    setDetalles(prev => [...prev, { productoId: 0, productoNombre: '', descripcion: '', cantidad: 1, costoUnitario: 0, descuento: 0 }])
  }

  const actualizarDetalle = (index: number, campo: keyof DetalleItem, valor: unknown) => {
    setDetalles(prev => {
      const nuevos = [...prev]
      if (campo === 'productoId') {
        const prod = productos.find(p => p.id === valor)
        if (prod) {
          nuevos[index] = {
            ...nuevos[index],
            productoId: prod.id,
            productoNombre: prod.nombre,
            costoUnitario: Number(prod.costoPromedio),
            descripcion: prod.nombre
          }
        }
      } else {
        nuevos[index] = { ...nuevos[index], [campo]: valor }
      }
      return nuevos
    })
  }

  const eliminarDetalle = (index: number) => {
    setDetalles(prev => prev.filter((_, i) => i !== index))
  }

  const handleGuardar = async () => {
    const values = await form.validateFields()
    if (detalles.length === 0) { message.warning('Agregue al menos un ítem'); return }
    if (tipoCompra === 'PRODUCTO' && detalles.some(d => !d.productoId || d.cantidad <= 0)) {
      message.warning('Complete todos los detalles de productos'); return
    }
    if (tipoCompra === 'GASTO_SERVICIO' && detalles.some(d => !d.descripcion || d.cantidad <= 0)) {
      message.warning('Ingrese la descripción y cantidad en todos los ítems'); return
    }
    setGuardando(true)
    try {
      await window.compras.crear({
        ...values,
        tipoCompra,
        fecha: values.fecha.format('YYYY-MM-DD'),
        detalles: detalles.map(d => ({
          productoId: tipoCompra === 'PRODUCTO' ? d.productoId : undefined,
          descripcion: d.descripcion,
          cantidad: d.cantidad,
          costoUnitario: d.costoUnitario,
          descuento: d.descuento
        }))
      })
      message.success('Compra registrada exitosamente')
      setModalOpen(false)
      form.resetFields()
      setDetalles([])
      setTipoCompra('PRODUCTO')
      cargar(1)
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Error al registrar compra')
    } finally {
      setGuardando(false)
    }
  }

  const handleVerDetalle = async (id: number) => {
    setLoadingDetalle(true)
    try {
      const det = await window.compras.getById(id)
      setDetalleDrawer(det)
    } catch {
      message.error('Error al cargar detalle')
    } finally {
      setLoadingDetalle(false)
    }
  }

  const handleAnular = async (id: number, numeroDocumento: string) => {
    try {
      await window.compras.anular(id, 'Anulación manual')
      message.success(`Compra #${numeroDocumento} anulada`)
      cargar()
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Error al anular')
    }
  }

  const exportarXLSX = async () => {
    if (compras.length === 0) { message.warning('No hay compras para exportar'); return }
    const ExcelJS = (await import('exceljs')).default
    const wb = new ExcelJS.Workbook()
    wb.creator = 'Speeddansys ERP'
    wb.created = new Date()

    const ws = wb.addWorksheet('Compras')

    // Título
    ws.mergeCells('A1:H1')
    const titleCell = ws.getCell('A1')
    titleCell.value = `Registro de Compras — ${new Date().toLocaleDateString('es-SV')}`
    titleCell.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } }
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF52c41a' } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    ws.getRow(1).height = 28

    // Encabezados
    const headers = ['Fecha', 'N° Documento', 'Tipo', 'Proveedor', 'Condición', 'Subtotal', 'IVA', 'Total', 'Estado']
    const headerRow = ws.addRow(headers)
    headerRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF237804' } }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFd9d9d9' } }
      }
    })
    headerRow.height = 20

    // Columnas
    ws.columns = [
      { width: 14 }, { width: 20 }, { width: 12 }, { width: 28 },
      { width: 12 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 12 }
    ]

    // Datos
    let grandTotal = 0
    compras.forEach((c, idx) => {
      const row = ws.addRow([
        dayjs(c.fecha).format('DD/MM/YYYY'),
        c.numeroDocumento,
        c.tipoDocumento,
        c.proveedor?.nombre ?? '—',
        c.condicionPago,
        Number(c.subtotal),
        Number(c.iva),
        Number(c.total),
        c.estado
      ])
      if (c.estado !== 'ANULADA') grandTotal += Number(c.total)

      // Alternar color de fila
      if (idx % 2 === 0) {
        row.eachCell(cell => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF6FFED' } }
        })
      }
      // Tachado en anuladas
      if (c.estado === 'ANULADA') {
        row.eachCell(cell => { cell.font = { strike: true, color: { argb: 'FFAAAAAA' } } })
      }
      // Formato moneda en columnas numéricas
      ;[6, 7, 8].forEach(colNum => {
        const cell = row.getCell(colNum)
        cell.numFmt = '"$"#,##0.00'
        cell.alignment = { horizontal: 'right' }
      })
    })

    // Fila de totales
    const totalRow = ws.addRow(['', '', '', '', 'TOTAL:', null, null, grandTotal, ''])
    totalRow.getCell(5).font = { bold: true }
    totalRow.getCell(8).numFmt = '"$"#,##0.00'
    totalRow.getCell(8).font = { bold: true, color: { argb: 'FF237804' }, size: 11 }
    totalRow.getCell(8).alignment = { horizontal: 'right' }

    // Descargar
    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `compras_${new Date().toISOString().slice(0, 10)}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
    message.success('Excel exportado correctamente')
  }

  const { subtotal, iva, total: totalCompra } = calcTotales()

  const columns: ColumnsType<CompraRow> = [
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      key: 'fecha',
      width: 110,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY')
    },
    {
      title: 'N° Documento',
      dataIndex: 'numeroDocumento',
      key: 'num',
      width: 150,
      render: (v: string) => <Text code>{v}</Text>
    },
    {
      title: 'Tipo',
      dataIndex: 'tipoDocumento',
      key: 'tipo',
      width: 100,
      render: (v: string) => <Tag>{v}</Tag>
    },
    {
      title: 'Proveedor',
      key: 'proveedor',
      render: (_, r) => r.proveedor?.nombre ?? <Text type="secondary">Sin proveedor</Text>
    },
    {
      title: 'Condición',
      dataIndex: 'condicionPago',
      key: 'cond',
      width: 90,
      render: (v: string) => <Tag color={v === 'CREDITO' ? 'orange' : 'green'}>{v}</Tag>
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: 110,
      align: 'right',
      render: (v: number | string) => <Text strong>{formatCurrency(v)}</Text>
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 110,
      render: (v: string) => (
        <Tag color={v === 'ANULADA' ? 'red' : 'green'}>{v}</Tag>
      )
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 90,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Ver detalle">
            <Button size="small" icon={<EyeOutlined />} onClick={() => handleVerDetalle(record.id)} />
          </Tooltip>
          {record.estado !== 'ANULADA' && (
            <Popconfirm
              title="¿Anular esta compra?"
              description="Se revertirá el movimiento de inventario."
              okText="Anular" cancelText="Cancelar" okButtonProps={{ danger: true }}
              onConfirm={() => handleAnular(record.id, record.numeroDocumento)}
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
        <Col xs={12} md={8}>
          <Card size="small">
            <Statistic title="Total Compras" value={total} prefix={<ShoppingCartOutlined style={{ color: 'var(--theme-primary)' }} />} />
          </Card>
        </Col>
        <Col xs={12} md={8}>
          <Card size="small">
            <Statistic title="Compras (página)" value={compras.filter(c => c.estado !== 'ANULADA').length} prefix={<DollarOutlined style={{ color: '#52c41a' }} />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small">
            <Statistic
              title="Valor (página)"
              value={compras.filter(c => c.estado !== 'ANULADA').reduce((a, c) => a + Number(c.total), 0)}
              precision={2}
              formatter={v => formatCurrency(Number(v))}
              prefix={<DollarOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={<Title level={5} style={{ margin: 0 }}>Registro de Compras</Title>}
        extra={
          <Space>
            <Button icon={<FileExcelOutlined />} onClick={exportarXLSX} style={{ color: '#237804', borderColor: '#237804' }}>
              Excel XLSX
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => {
              form.resetFields()
              form.setFieldsValue({ fecha: dayjs(), tipoDocumento: 'FACTURA', condicionPago: 'CONTADO' })
              setDetalles([])
              setTipoCompra('PRODUCTO')
              setModalOpen(true)
            }}>
              Nueva Compra
            </Button>
          </Space>
        }
      >
        <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Buscar por N° documento o proveedor..."
              prefix={<SearchOutlined />}
              allowClear
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              onPressEnter={() => cargar(1, pageSize, busqueda)}
            />
          </Col>
          <Col xs={24} sm={4}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={() => cargar(1, pageSize, busqueda)}>Buscar</Button>
              <Tooltip title="Limpiar"><Button icon={<ReloadOutlined />} onClick={() => { setBusqueda(''); cargar(1, pageSize, '') }} /></Tooltip>
            </Space>
          </Col>
        </Row>

        <Table
          dataSource={compras}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          scroll={{ x: 900 }}
          rowClassName={r => r.estado === 'ANULADA' ? 'ant-table-row-danger' : ''}
          pagination={{
            current: page, pageSize, total, showSizeChanger: true,
            showTotal: (t, range) => `${range[0]}–${range[1]} de ${t} compras`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); cargar(p, ps) }
          }}
        />
      </Card>

      {/* Modal Nueva Compra */}
      <Modal
        title="Nueva Compra"
        open={modalOpen}
        onOk={handleGuardar}
        onCancel={() => setModalOpen(false)}
        okText="Registrar Compra"
        cancelText="Cancelar"
        confirmLoading={guardando}
        width={900}
        destroyOnClose
      >
        <Form form={form} layout="vertical" size="middle">
          <Divider orientation="left" plain style={{ marginTop: 0 }}>Tipo de Compra</Divider>
          <Row gutter={12}>
            <Col xs={24} sm={14}>
              <Form.Item label="Tipo">
                <Select
                  value={tipoCompra}
                  onChange={(v: 'PRODUCTO' | 'GASTO_SERVICIO') => { setTipoCompra(v); setDetalles([]) }}
                  options={TIPOS_COMPRA}
                />
              </Form.Item>
            </Col>
            {tipoCompra === 'GASTO_SERVICIO' && (
              <Col xs={24} sm={10} style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 24 }}>
                <Tag color="warning" style={{ fontSize: 12, padding: '4px 10px' }}>
                  ⚠ No afecta inventario — aparece en Libro IVA Compras
                </Tag>
              </Col>
            )}
          </Row>
          <Divider orientation="left" plain style={{ marginTop: 0 }}>Datos del Documento</Divider>
          <Row gutter={12}>
            <Col xs={24} sm={6}>
              <Form.Item label="Tipo de Documento" name="tipoDocumento" rules={[{ required: true }]}>
                <Select options={TIPOS_DOC} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label="N° Documento" name="numeroDocumento" rules={[{ required: true, message: 'Ingrese el número de documento' }]}>
                <Input placeholder="FAC-001, CCF-001, etc." />
              </Form.Item>
            </Col>
            <Col xs={24} sm={5}>
              <Form.Item label="Fecha" name="fecha" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={5}>
              <Form.Item label="Condición de Pago" name="condicionPago" rules={[{ required: true }]}>
                <Select options={CONDICIONES} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item label="Proveedor" name="proveedorId">
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="Seleccionar proveedor (opcional)"
                  allowClear
                  options={proveedores.map(p => ({ value: p.id, label: p.nombre }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Notas" name="notas">
                <Input placeholder="Observaciones (opcional)" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" plain>{tipoCompra === 'GASTO_SERVICIO' ? 'Ítems / Servicios' : 'Productos'}</Divider>
          <div style={{ marginBottom: 8 }}>
            <Button size="small" icon={<PlusOutlined />} onClick={agregarDetalle}>
              {tipoCompra === 'GASTO_SERVICIO' ? 'Agregar Ítem' : 'Agregar Producto'}
            </Button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafafa' }}>
                  {tipoCompra === 'PRODUCTO' && (
                    <th style={{ padding: '6px 8px', textAlign: 'left', fontSize: 12 }}>Producto</th>
                  )}
                  <th style={{ padding: '6px 8px', textAlign: 'left', fontSize: 12, width: tipoCompra === 'GASTO_SERVICIO' ? undefined : 160 }}>Descripción</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', fontSize: 12, width: 90 }}>Cantidad</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', fontSize: 12, width: 100 }}>Costo U.</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', fontSize: 12, width: 80 }}>Desc. %</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', fontSize: 12, width: 100 }}>Subtotal</th>
                  <th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {detalles.map((d, i) => {
                  const lineTotal = d.cantidad * d.costoUnitario * (1 - d.descuento / 100)
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      {tipoCompra === 'PRODUCTO' && (
                        <td style={{ padding: '4px 8px' }}>
                          <Select
                            showSearch
                            optionFilterProp="label"
                            style={{ width: 180 }}
                            placeholder="Producto"
                            value={d.productoId || undefined}
                            onChange={v => actualizarDetalle(i, 'productoId', v)}
                            options={productos.map(p => ({ value: p.id, label: `${p.codigo} — ${p.nombre}` }))}
                          />
                        </td>
                      )}
                      <td style={{ padding: '4px 8px' }}>
                        <Input
                          size="small"
                          value={d.descripcion}
                          placeholder={tipoCompra === 'GASTO_SERVICIO' ? 'Descripción del servicio (requerida)' : 'Descripción'}
                          onChange={e => actualizarDetalle(i, 'descripcion', e.target.value)}
                        />
                      </td>
                      <td style={{ padding: '4px 8px' }}>
                        <InputNumber
                          size="small"
                          style={{ width: '100%' }}
                          value={d.cantidad}
                          min={0.01}
                          precision={2}
                          onChange={v => actualizarDetalle(i, 'cantidad', v ?? 0)}
                        />
                      </td>
                      <td style={{ padding: '4px 8px' }}>
                        <InputNumber
                          size="small"
                          style={{ width: '100%' }}
                          value={d.costoUnitario}
                          min={0}
                          precision={2}
                          prefix="$"
                          onChange={v => actualizarDetalle(i, 'costoUnitario', v ?? 0)}
                        />
                      </td>
                      <td style={{ padding: '4px 8px' }}>
                        <InputNumber
                          size="small"
                          style={{ width: '100%' }}
                          value={d.descuento}
                          min={0}
                          max={100}
                          precision={2}
                          formatter={v => `${v}%`}
                          parser={v => Number(v?.replace('%', '') ?? 0) as unknown as string}
                          onChange={v => actualizarDetalle(i, 'descuento', v ?? 0)}
                        />
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                        <Text strong>{formatCurrency(lineTotal)}</Text>
                      </td>
                      <td style={{ padding: '4px 8px' }}>
                        <Button
                          size="small" danger type="text"
                          onClick={() => eliminarDetalle(i)}
                        >✕</Button>
                      </td>
                    </tr>
                  )
                })}
                {detalles.length === 0 && (
                  <tr>
                    <td colSpan={tipoCompra === 'GASTO_SERVICIO' ? 6 : 7} style={{ textAlign: 'center', padding: 16, color: '#8c8c8c' }}>
                      {tipoCompra === 'GASTO_SERVICIO'
                        ? 'Sin ítems. Haz clic en "Agregar Ítem".'
                        : 'Sin productos. Haz clic en "Agregar Producto".'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {detalles.length > 0 && (
            <div style={{ marginTop: 12, textAlign: 'right', background: '#fafafa', padding: 12, borderRadius: 6 }}>
              <Space direction="vertical" size={4} style={{ textAlign: 'right' }}>
                <Text>Subtotal: <Text strong>{formatCurrency(subtotal)}</Text></Text>
                <Text>IVA (13%): <Text strong>{formatCurrency(iva)}</Text></Text>
                <Text style={{ fontSize: 16 }}>
                  Total: <Text strong style={{ color: 'var(--theme-primary)', fontSize: 16 }}>{formatCurrency(totalCompra)}</Text>
                </Text>
              </Space>
            </div>
          )}
        </Form>
      </Modal>

      {/* Drawer detalle compra */}
      <Drawer
        title={detalleDrawer ? `Compra #${detalleDrawer.numeroDocumento}` : 'Detalle de Compra'}
        open={!!detalleDrawer}
        onClose={() => setDetalleDrawer(null)}
        width={520}
        loading={loadingDetalle}
      >
        {detalleDrawer && (
          <div>
            <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
              <Col span={12}><Text type="secondary">Fecha:</Text> <Text>{dayjs(detalleDrawer.fecha).format('DD/MM/YYYY')}</Text></Col>
              <Col span={12}><Text type="secondary">Tipo:</Text> <Tag>{detalleDrawer.tipoDocumento}</Tag></Col>
              <Col span={12}><Text type="secondary">Condición:</Text> <Tag>{detalleDrawer.condicionPago}</Tag></Col>
              <Col span={12}><Text type="secondary">Estado:</Text> <Tag color={detalleDrawer.estado === 'ANULADA' ? 'red' : 'green'}>{detalleDrawer.estado}</Tag></Col>
              {detalleDrawer.proveedor && (
                <Col span={24}><Text type="secondary">Proveedor:</Text> <Text strong>{detalleDrawer.proveedor.nombre}</Text></Col>
              )}
            </Row>

            <Divider>Productos</Divider>
            {detalleDrawer.detalles?.map((d, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
                <div>
                  <Text strong>{d.producto?.nombre}</Text>
                  <div><Text type="secondary" style={{ fontSize: 11 }}>{formatNumber(d.cantidad)} × {formatCurrency(Number(d.costoUnitario))}</Text></div>
                </div>
                <Text strong>{formatCurrency(Number(d.subtotal))}</Text>
              </div>
            ))}

            <div style={{ marginTop: 16, background: '#fafafa', padding: 12, borderRadius: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">Subtotal:</Text><Text>{formatCurrency(Number(detalleDrawer.subtotal))}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">IVA (13%):</Text><Text>{formatCurrency(Number(detalleDrawer.iva))}</Text>
              </div>
              <Divider style={{ margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text strong>Total:</Text><Text strong style={{ color: 'var(--theme-primary)', fontSize: 16 }}>{formatCurrency(Number(detalleDrawer.total))}</Text>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </>
  )
}
