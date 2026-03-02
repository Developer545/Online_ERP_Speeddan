// ══════════════════════════════════════════════════════════
// MÓDULO DE CLIENTES — CRUD COMPLETO
// ══════════════════════════════════════════════════════════

import { useState } from 'react'
import {
  Card, Table, Button, Input, Select, Space, Tag, Typography,
  Tooltip, Popconfirm, Row, Col, Statistic, Badge, Drawer,
  Descriptions, Divider, message
} from 'antd'
import {
  PlusOutlined, SearchOutlined, EditOutlined,
  DeleteOutlined, ReloadOutlined, EyeOutlined,
  TeamOutlined, FileTextOutlined, PhoneOutlined, MailOutlined,
  FilePdfOutlined
} from '@ant-design/icons'
import { imprimirEstadoCuenta } from '@renderer/utils/factura.pdf'
import type { ColumnsType } from 'antd/es/table'
import { useClientes } from '@hooks/useClientes'
import ClienteFormModal from '@components/Forms/ClienteFormModal'
import {
  DEPARTAMENTOS, getMunicipiosByDepartamento,
  TIPOS_DOCUMENTO_RECEPTOR
} from '@shared/constants/catalogs'
import { TIPOS_DOC_LABELS } from '@utils/documentos'

const { Text, Title } = Typography

// Colores por tipo de documento
const DOC_COLORS: Record<string, string> = {
  '13': 'blue',
  '36': 'purple',
  '37': 'cyan',
  '03': 'orange',
  '02': 'green'
}

export default function ClientesPage() {
  const { clientes, total, loading, filtros, cargar, crear, actualizar, desactivar } = useClientes()

  // Modal crear/editar
  const [modalOpen, setModalOpen] = useState(false)
  const [clienteEditando, setClienteEditando] = useState<ClienteRow | null>(null)
  const [guardando, setGuardando] = useState(false)

  // Drawer de detalle
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [clienteDetalle, setClienteDetalle] = useState<ClienteRow | null>(null)

  // Filtros locales
  const [busqueda, setBusqueda] = useState('')
  const [tipoDocFiltro, setTipoDocFiltro] = useState<string | undefined>()

  // ── Abrir modal para crear ─────────────────────────────
  const handleNuevo = () => {
    setClienteEditando(null)
    setModalOpen(true)
  }

  // ── Abrir modal para editar ────────────────────────────
  const handleEditar = (cliente: ClienteRow) => {
    setClienteEditando(cliente)
    setModalOpen(true)
  }

  // ── Ver detalle en Drawer ──────────────────────────────
  const handleVerDetalle = (cliente: ClienteRow) => {
    setClienteDetalle(cliente)
    setDrawerOpen(true)
  }

  // ── Guardar (crear o editar) ───────────────────────────
  const handleGuardar = async (values: Omit<ClienteRow, 'id'>) => {
    setGuardando(true)
    try {
      if (clienteEditando) {
        await actualizar(clienteEditando.id, values)
      } else {
        await crear(values)
      }
      setModalOpen(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('Unique constraint') || msg.includes('unique')) {
        message.error('Ya existe un cliente con ese tipo y número de documento')
      } else {
        message.error('Error al guardar el cliente')
      }
    } finally {
      setGuardando(false)
    }
  }

  // ── Filtrar ────────────────────────────────────────────
  const handleBuscar = () => {
    cargar({ busqueda: busqueda || undefined, tipoDocumento: tipoDocFiltro, page: 1 })
  }

  const handleLimpiarFiltros = () => {
    setBusqueda('')
    setTipoDocFiltro(undefined)
    cargar({ busqueda: undefined, tipoDocumento: undefined, page: 1 })
  }

  // ── Columnas de la tabla ───────────────────────────────
  const columns: ColumnsType<ClienteRow> = [
    {
      title: 'Tipo Doc.',
      dataIndex: 'tipoDocumento',
      key: 'tipoDoc',
      width: 90,
      render: (v: string) => (
        <Tag color={DOC_COLORS[v] ?? 'default'} style={{ fontSize: 11 }}>
          {TIPOS_DOC_LABELS[v] ?? v}
        </Tag>
      )
    },
    {
      title: 'N° Documento',
      dataIndex: 'numDocumento',
      key: 'numDoc',
      width: 130,
      render: (v: string) => <Text code style={{ fontSize: 12 }}>{v}</Text>
    },
    {
      title: 'Nombre / Razón Social',
      key: 'nombre',
      render: (_, r) => (
        <div>
          <Text strong>{r.nombre}</Text>
          {r.nombreComercial && (
            <div>
              <Text type="secondary" style={{ fontSize: 11 }}>{r.nombreComercial}</Text>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'NRC',
      dataIndex: 'nrc',
      key: 'nrc',
      width: 100,
      render: (v: string) => v
        ? <Text code style={{ fontSize: 12 }}>{v}</Text>
        : <Text type="secondary">—</Text>
    },
    {
      title: 'Contacto',
      key: 'contacto',
      width: 180,
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          {r.correo && (
            <Space size={4}>
              <MailOutlined style={{ fontSize: 11, color: '#8c8c8c' }} />
              <Text style={{ fontSize: 12 }}>{r.correo}</Text>
            </Space>
          )}
          {r.telefono && (
            <Space size={4}>
              <PhoneOutlined style={{ fontSize: 11, color: '#8c8c8c' }} />
              <Text style={{ fontSize: 12 }}>{r.telefono}</Text>
            </Space>
          )}
          {!r.correo && !r.telefono && <Text type="secondary">—</Text>}
        </Space>
      )
    },
    {
      title: 'Departamento',
      key: 'depto',
      width: 130,
      render: (_, r) => {
        if (!r.departamentoCod) return <Text type="secondary">—</Text>
        const depto = DEPARTAMENTOS.find(d => d.codigo === r.departamentoCod)
        const mun = getMunicipiosByDepartamento(r.departamentoCod ?? '')
          .find(m => m.codigo === r.municipioCod)
        return (
          <Space direction="vertical" size={0}>
            <Text style={{ fontSize: 12 }}>{depto?.nombre ?? r.departamentoCod}</Text>
            {mun && <Text type="secondary" style={{ fontSize: 11 }}>{mun.nombre}</Text>}
          </Space>
        )
      }
    },
    {
      title: 'DTE',
      key: 'dte',
      width: 80,
      align: 'center',
      render: (_, r) => (
        <Tooltip title={r.nrc
          ? 'Puede emitir Factura y CCF'
          : 'Solo puede emitir Factura Electrónica'
        }>
          <Space direction="vertical" size={0} style={{ textAlign: 'center' }}>
            <Badge status="success" text={<Text style={{ fontSize: 10 }}>FE-01</Text>} />
            {r.nrc && <Badge status="processing" text={<Text style={{ fontSize: 10 }}>CCF-03</Text>} />}
          </Space>
        </Tooltip>
      )
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 110,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Ver detalle">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleVerDetalle(record)}
            />
          </Tooltip>
          <Tooltip title="Estado de cuenta PDF">
            <Button
              size="small"
              icon={<FilePdfOutlined />}
              onClick={() => imprimirEstadoCuenta(record).catch(() => message.error('Error al generar PDF'))}
            />
          </Tooltip>
          <Tooltip title="Editar">
            <Button
              size="small"
              type="primary"
              ghost
              icon={<EditOutlined />}
              onClick={() => handleEditar(record)}
            />
          </Tooltip>
          <Popconfirm
            title="¿Desactivar este cliente?"
            description="No aparecerá en búsquedas pero su historial se conserva."
            okText="Desactivar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
            onConfirm={() => desactivar(record.id, record.nombre)}
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
      {/* ── Estadísticas rápidas ───────────────────────── */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title="Total Clientes"
              value={total}
              prefix={<TeamOutlined style={{ color: 'var(--theme-primary)' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title="Con NRC (CCF)"
              value={clientes.filter(c => c.nrc).length}
              prefix={<FileTextOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title="Con Correo"
              value={clientes.filter(c => c.correo).length}
              prefix={<MailOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title="Esta Página"
              value={clientes.length}
            />
          </Card>
        </Col>
      </Row>

      {/* ── Tabla principal ────────────────────────────── */}
      <Card
        title={<Title level={5} style={{ margin: 0 }}>Clientes</Title>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleNuevo}>
            Nuevo Cliente
          </Button>
        }
      >
        {/* Barra de filtros */}
        <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={10} md={8}>
            <Input
              placeholder="Buscar por nombre, documento o NRC..."
              prefix={<SearchOutlined />}
              allowClear
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              onPressEnter={handleBuscar}
            />
          </Col>
          <Col xs={12} sm={7} md={5}>
            <Select
              placeholder="Tipo de documento"
              allowClear
              style={{ width: '100%' }}
              value={tipoDocFiltro}
              onChange={setTipoDocFiltro}
              options={TIPOS_DOCUMENTO_RECEPTOR.map(t => ({ value: t.codigo, label: t.nombre }))}
            />
          </Col>
          <Col xs={12} sm={7} md={4}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleBuscar}>
                Buscar
              </Button>
              <Tooltip title="Limpiar filtros">
                <Button icon={<ReloadOutlined />} onClick={handleLimpiarFiltros} />
              </Tooltip>
            </Space>
          </Col>
        </Row>

        <Table
          dataSource={clientes}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          scroll={{ x: 900 }}
          pagination={{
            current: filtros.page,
            pageSize: filtros.pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t, range) => `${range[0]}–${range[1]} de ${t} clientes`,
            onChange: (page, pageSize) => cargar({ page, pageSize })
          }}
          locale={{
            emptyText: (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <TeamOutlined style={{ fontSize: 32, color: '#bfbfbf' }} />
                <div style={{ marginTop: 8, color: '#8c8c8c' }}>
                  No hay clientes. Cree el primero con "Nuevo Cliente".
                </div>
              </div>
            )
          }}
        />
      </Card>

      {/* ── Modal Crear / Editar ───────────────────────── */}
      <ClienteFormModal
        open={modalOpen}
        cliente={clienteEditando}
        onOk={handleGuardar}
        onCancel={() => setModalOpen(false)}
        loading={guardando}
      />

      {/* ── Drawer de Detalle ─────────────────────────── */}
      <Drawer
        title={
          <Space>
            <TeamOutlined />
            <span>Detalle del Cliente</span>
          </Space>
        }
        placement="right"
        width={480}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          <Button
            type="primary"
            ghost
            icon={<EditOutlined />}
            onClick={() => {
              setDrawerOpen(false)
              if (clienteDetalle) handleEditar(clienteDetalle)
            }}
          >
            Editar
          </Button>
        }
      >
        {clienteDetalle && <ClienteDetalleDrawer cliente={clienteDetalle} />}
      </Drawer>
    </>
  )
}

// ── Sub-componente: contenido del drawer ──────────────────
function ClienteDetalleDrawer({ cliente }: { cliente: ClienteRow }) {
  const depto = DEPARTAMENTOS.find(d => d.codigo === cliente.departamentoCod)
  const municipios = getMunicipiosByDepartamento(cliente.departamentoCod ?? '')
  const mun = municipios.find(m => m.codigo === cliente.municipioCod)

  return (
    <>
      {/* Identificación */}
      <Divider orientation="left">Identificación</Divider>
      <Descriptions column={1} size="small" bordered>
        <Descriptions.Item label="Tipo de Documento">
          <Tag color={DOC_COLORS[cliente.tipoDocumento] ?? 'default'}>
            {TIPOS_DOC_LABELS[cliente.tipoDocumento] ?? cliente.tipoDocumento}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Número de Documento">
          <Text code>{cliente.numDocumento}</Text>
        </Descriptions.Item>
        {cliente.nrc && (
          <Descriptions.Item label="NRC">
            <Text code>{cliente.nrc}</Text>
          </Descriptions.Item>
        )}
      </Descriptions>

      {/* Datos generales */}
      <Divider orientation="left">Datos Generales</Divider>
      <Descriptions column={1} size="small" bordered>
        <Descriptions.Item label="Nombre">{cliente.nombre}</Descriptions.Item>
        {cliente.nombreComercial && (
          <Descriptions.Item label="Nombre Comercial">{cliente.nombreComercial}</Descriptions.Item>
        )}
        {cliente.correo && (
          <Descriptions.Item label="Correo">{cliente.correo}</Descriptions.Item>
        )}
        {cliente.telefono && (
          <Descriptions.Item label="Teléfono">{cliente.telefono}</Descriptions.Item>
        )}
      </Descriptions>

      {/* Dirección */}
      {(cliente.departamentoCod || cliente.complemento) && (
        <>
          <Divider orientation="left">Dirección</Divider>
          <Descriptions column={1} size="small" bordered>
            {depto && <Descriptions.Item label="Departamento">{depto.nombre}</Descriptions.Item>}
            {mun && <Descriptions.Item label="Municipio">{mun.nombre}</Descriptions.Item>}
            {cliente.complemento && (
              <Descriptions.Item label="Dirección">{cliente.complemento}</Descriptions.Item>
            )}
          </Descriptions>
        </>
      )}

      {/* Capacidad DTE */}
      <Divider orientation="left">Documentos Tributarios</Divider>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Badge status="success" />
          <Text>Factura Electrónica (DTE-01)</Text>
        </div>
        {cliente.nrc ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Badge status="processing" />
            <Text>Comprobante de Crédito Fiscal (DTE-03)</Text>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Badge status="default" />
            <Text type="secondary">CCF no disponible (requiere NRC)</Text>
          </div>
        )}
      </Space>
    </>
  )
}
