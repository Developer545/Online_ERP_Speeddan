import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import animeLib from 'animejs/lib/anime.es.js'
const anime: any = animeLib || null

import {
  Row, Col, Card, Statistic, Typography, Table, Tag, Alert, Space, Spin
} from 'antd'
import {
  FileTextOutlined, DollarOutlined, TeamOutlined,
  ExclamationCircleOutlined, InboxOutlined, RiseOutlined,
  FallOutlined, WarningOutlined, CheckCircleOutlined,
  ShoppingCartOutlined, ThunderboltOutlined
} from '@ant-design/icons'
import {
  AreaChart, Area, BarChart, Bar, ComposedChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import dayjs from 'dayjs'
import type { FacturaRow } from '@shared/types/billing.types'
import { formatCurrency, formatNumber } from '../../utils/format'

const { Title, Text } = Typography

const COLORS_PIE = ['var(--theme-primary)', '#52c41a', '#faad14', '#f5222d']

function TooltipMoney({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--ant-color-bg-elevated, #fff)',
        border: '1px solid var(--ant-color-border, #d9d9d9)',
        borderRadius: 8, padding: '8px 12px', fontSize: 12
      }}>
        <p style={{ margin: 0, fontWeight: 600 }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ margin: '2px 0', color: p.color }}>
            {p.name}: {p.name?.toLowerCase().includes('cantidad') ? formatNumber(p.value) : formatCurrency(p.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [facturas, setFacturas] = useState<FacturaRow[]>([])
  const kpiRef = useRef<HTMLDivElement>(null)
  const chartsRef = useRef<HTMLDivElement>(null)
  const [kpi, setKpi] = useState<KpiResumen | null>(null)
  const [ventasPorDia, setVentasPorDia] = useState<VentaPorDia[]>([])
  const [topProductos, setTopProductos] = useState<TopProducto[]>([])
  const [ventasVsCompras, setVentasVsCompras] = useState<VentasVsCompras[]>([])
  const [distribucionTipo, setDistribucionTipo] = useState<DistribucionTipo[]>([])
  const [utilidadReal, setUtilidadReal] = useState<UtilidadRealMes[]>([])

  useEffect(() => {
    const cargar = async () => {
      try {
        const hoy = dayjs().format('YYYY-MM-DD')
        const [billingRes, kpiRes, diasRes, topRes, vsRes, distRes, utilidadRes] = await Promise.all([
          window.billing.listar({ desde: hoy, hasta: hoy, page: 1, pageSize: 15 }),
          window.analytics.kpiResumen(),
          window.analytics.ventasPorDia(),
          window.analytics.topProductos(),
          window.analytics.ventasVsCompras(),
          window.analytics.distribucionTipo(),
          window.analytics.utilidadReal()
        ])
        setFacturas(billingRes?.facturas || [])
        setKpi(kpiRes || null)
        setVentasPorDia(diasRes?.length ? diasRes : [])
        setTopProductos(topRes?.length ? topRes : [])
        setVentasVsCompras(vsRes?.length ? vsRes : [])
        setDistribucionTipo(distRes?.length ? distRes : [])
        setUtilidadReal(utilidadRes?.length ? utilidadRes : [])
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [])

  // Animaciones de entrada con anime.js
  useEffect(() => {
    if (loading || !anime) return
    // KPI Cards — entran desde abajo con stagger
    if (kpiRef.current) {
      try {
        anime({
          targets: kpiRef.current.querySelectorAll('.ant-col'),
          opacity: [0, 1],
          translateY: [32, 0],
          duration: 600,
          delay: anime.stagger(100),
          easing: 'easeOutCubic'
        })
      } catch {
        // silently skip if anime fails
      }
    }
    // Gráficas — entran con fade + scale
    if (chartsRef.current) {
      try {
        anime({
          targets: chartsRef.current.querySelectorAll('.ant-card'),
          opacity: [0, 1],
          scale: [0.96, 1],
          duration: 700,
          delay: anime.stagger(120, { start: 200 }),
          easing: 'easeOutQuart'
        })
      } catch {
        // silently skip if anime fails
      }
    }
  }, [loading])

  const crecimiento = kpi && kpi.ventasMesAnterior > 0
    ? ((kpi.ventasMes - kpi.ventasMesAnterior) / kpi.ventasMesAnterior * 100)
    : null

  const pendientesMH = facturas.filter(f =>
    f.estado === 'CONTINGENCIA' || f.estado === 'PENDIENTE_ENVIO'
  ).length

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Spin size="large" tip="Cargando panel..." />
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: 24 }}>
      <Title level={4} style={{ marginBottom: 20 }}>Panel Ejecutivo</Title>

      {/* ── FILA 1: KPI Cards ─────────────────────────────── */}
      <div ref={kpiRef}>
        <Row gutter={[16, 16]} align="stretch">
          <Col xs={24} sm={12} lg={6} style={{ display: 'flex' }}>
            <Card style={{ borderRadius: 10, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Statistic
                title="Ventas Hoy"
                value={kpi?.ventasHoy ?? 0}
                precision={2}
                formatter={v => formatCurrency(Number(v))}
                prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6} style={{ display: 'flex' }}>
            <Card style={{ borderRadius: 10, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Statistic
                title="Ventas del Mes"
                value={kpi?.ventasMes ?? 0}
                precision={2}
                formatter={v => formatCurrency(Number(v))}
                prefix={<FileTextOutlined style={{ color: 'var(--theme-primary)' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6} style={{ display: 'flex' }}>
            <Card style={{ borderRadius: 10, width: '100%' }}>
              <Statistic
                title="Crecimiento vs Mes Anterior"
                value={crecimiento !== null ? Math.abs(crecimiento) : 0}
                precision={1}
                suffix="%"
                valueStyle={{ color: crecimiento !== null && crecimiento >= 0 ? '#52c41a' : '#f5222d' }}
                prefix={crecimiento !== null && crecimiento >= 0
                  ? <RiseOutlined style={{ color: '#52c41a' }} />
                  : <FallOutlined style={{ color: '#f5222d' }} />}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>
                Mes anterior: {formatCurrency(kpi?.ventasMesAnterior ?? 0)}
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6} style={{ display: 'flex' }}>
            <Card style={{ borderRadius: 10, width: '100%' }}>
              <Statistic
                title="Clientes Activos"
                value={kpi?.totalClientes ?? 0}
                prefix={<TeamOutlined style={{ color: '#722ed1' }} />}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>
                {kpi?.totalProductos ?? 0} productos en catálogo
              </Text>
            </Card>
          </Col>
        </Row>
      </div>

      {/* ── FILA 2: AreaChart + PieChart ─────────────────── */}
      <div ref={chartsRef}>
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} lg={16}>
            <Card
              title="Tendencia de Ventas — Últimos 30 Días"
              size="small"
              style={{ borderRadius: 10 }}
            >
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={ventasPorDia} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradVentas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--theme-primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--theme-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis
                    dataKey="fecha"
                    tickFormatter={d => dayjs(d).format('DD/MM')}
                    tick={{ fontSize: 10 }}
                    interval={4}
                  />
                  <YAxis
                    tickFormatter={v => `$${formatNumber(v)}`}
                    tick={{ fontSize: 10 }}
                    width={55}
                  />
                  <Tooltip content={<TooltipMoney />} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Ventas"
                    stroke="var(--theme-primary)"
                    strokeWidth={2}
                    fill="url(#gradVentas)"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card
              title="Distribución por Tipo DTE (Mes Actual)"
              size="small"
              style={{ borderRadius: 10 }}
            >
              {distribucionTipo.length === 0 ? (
                <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Text type="secondary">Sin datos este mes</Text>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={distribucionTipo}
                      dataKey="cantidad"
                      nameKey="tipo"
                      cx="50%"
                      cy="50%"
                      outerRadius={65}
                      innerRadius={30}
                      label={({ tipo, percent, x, y }: { tipo?: string; percent?: number; x?: number; y?: number }) => (
                        <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={9} fill="#333">
                          {`${tipo ?? ''} ${formatNumber((percent ?? 0) * 100)}%`}
                        </text>
                      )}
                      labelLine={{ strokeWidth: 1, stroke: '#999' }}
                    >
                      {distribucionTipo.map((_, index) => (
                        <Cell key={index} fill={COLORS_PIE[index % COLORS_PIE.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, name) => [`${v} documentos`, name]} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 10, lineHeight: '16px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>
          </Col>
        </Row>

        {/* ── FILA 3: BarChart Top Productos + ComposedChart Ventas vs Compras ── */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} lg={12}>
            <Card
              title="Top 5 Productos Más Vendidos"
              size="small"
              style={{ borderRadius: 10 }}
            >
              {topProductos.length === 0 ? (
                <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Text type="secondary">Sin datos de ventas</Text>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={topProductos}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.06)" />
                    <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => formatNumber(v)} />
                    <YAxis
                      type="category"
                      dataKey="nombre"
                      tick={{ fontSize: 10 }}
                      width={90}
                    />
                    <Tooltip content={<TooltipMoney />} />
                    <Bar dataKey="cantidad" name="Cantidad vendida" fill="var(--theme-primary)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title="Ventas vs Compras — Últimos 6 Meses"
              size="small"
              style={{ borderRadius: 10 }}
            >
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={ventasVsCompras} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={v => `$${formatNumber(v)}`} tick={{ fontSize: 10 }} width={55} />
                  <Tooltip content={<TooltipMoney />} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="ventas" name="Ventas" fill="#52c41a" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="compras" name="Compras" fill="#ff7875" radius={[3, 3, 0, 0]} />
                  <Line
                    type="monotone"
                    dataKey={(d) => Number((d.ventas - d.compras).toFixed(2))}
                    name="Margen"
                    stroke="#faad14"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>

        {/* ── FILA 4: Utilidad Real ─────────────────────────────── */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24}>
            <Card
              title="Utilidad Real — Últimos 6 Meses (Ventas − Compras − Gastos Internos)"
              size="small"
              style={{ borderRadius: 10 }}
            >
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={utilidadReal} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={v => `$${formatNumber(v)}`} tick={{ fontSize: 10 }} width={60} />
                  <Tooltip content={<TooltipMoney />} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="ventas" name="Ventas" fill="#52c41a" radius={[3, 3, 0, 0]} stackId="ingresos" />
                  <Bar dataKey="compras" name="Compras" fill="#ff7875" radius={[0, 0, 0, 0]} stackId="egresos" />
                  <Bar dataKey="gastos" name="Gastos Internos" fill="#d48806" radius={[3, 3, 0, 0]} stackId="egresos" />
                  <Line
                    type="monotone"
                    dataKey="utilidad"
                    name="Utilidad Neta"
                    stroke="#fa8c16"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#fa8c16' }}
                    activeDot={{ r: 6 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>

        {/* ── FILA 5: Alertas + Últimas Facturas + Stats Inventario ── */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          {/* Alertas */}
          <Col xs={24} lg={6}>
            <Card title="Alertas del Sistema" size="small" style={{ borderRadius: 10 }}>
              <Space direction="vertical" style={{ width: '100%' }} size={8}>
                {pendientesMH > 0 && (
                  <Alert
                    type="warning"
                    showIcon
                    icon={<ExclamationCircleOutlined />}
                    message={`${pendientesMH} DTE(s) pendiente(s) MH`}
                    description="Reenvíe desde el módulo Facturas."
                    style={{ fontSize: 11 }}
                  />
                )}
                {(kpi?.stockBajo ?? 0) > 0 && (
                  <Alert
                    type="warning"
                    showIcon
                    icon={<WarningOutlined />}
                    message={`${kpi?.stockBajo} producto(s) stock crítico`}
                    description="Reponga existencias pronto."
                    style={{ fontSize: 11 }}
                  />
                )}
                {crecimiento !== null && crecimiento >= 5 && (
                  <Alert
                    type="success"
                    showIcon
                    icon={<RiseOutlined />}
                    message={`Ventas crecieron +${crecimiento.toFixed(1)}%`}
                    description="Excelente desempeño este mes."
                    style={{ fontSize: 11 }}
                  />
                )}
                {pendientesMH === 0 && (kpi?.stockBajo ?? 0) === 0 && (
                  <Alert
                    type="success"
                    showIcon
                    icon={<CheckCircleOutlined />}
                    message="Sistema operando con normalidad"
                    style={{ fontSize: 11 }}
                  />
                )}

                <Card size="small" style={{ marginTop: 4, borderRadius: 8 }}>
                  <Text style={{ fontSize: 11, display: 'block', marginBottom: 6, fontWeight: 600 }}>
                    <ThunderboltOutlined style={{ marginRight: 4, color: 'var(--theme-primary)' }} />
                    Accesos Rápidos
                  </Text>
                  <Space wrap size={4}>
                    {[
                      { label: 'Nueva Factura', path: '/facturacion/facturas/nueva' },
                      { label: 'Nuevo CCF', path: '/facturacion/ccf/nuevo' },
                      { label: 'Productos', path: '/productos' },
                      { label: 'Clientes', path: '/clientes' },
                      { label: 'Libro Ventas', path: '/reportes/libro-ventas' }
                    ].map(item => (
                      <Tag
                        key={item.path}
                        color="blue"
                        style={{ cursor: 'pointer', fontSize: 11, margin: '1px 0' }}
                        onClick={() => navigate(item.path)}
                      >
                        {item.label}
                      </Tag>
                    ))}
                  </Space>
                </Card>
              </Space>
            </Card>
          </Col>

          {/* Últimas Facturas */}
          <Col xs={24} lg={12}>
            <Card title="Facturas Emitidas Hoy" size="small" style={{ borderRadius: 10 }}>
              <Table
                size="small"
                dataSource={facturas}
                rowKey="id"
                columns={[
                  {
                    title: 'N° Control',
                    dataIndex: 'numeroControl',
                    key: 'nc',
                    render: (v: string) => <Text code style={{ fontSize: 10 }}>{v?.slice(-12)}</Text>
                  },
                  {
                    title: 'Cliente',
                    key: 'c',
                    render: (_, r) => (
                      <Text style={{ fontSize: 12 }}>
                        {r.cliente?.nombre || <Text type="secondary">Consumidor final</Text>}
                      </Text>
                    )
                  },
                  {
                    title: 'Total',
                    dataIndex: 'totalPagar',
                    key: 't',
                    align: 'right',
                    width: 90,
                    render: (v: number | string) => (
                      <Text strong style={{ fontSize: 12 }}>{formatCurrency(Number(v))}</Text>
                    )
                  },
                  {
                    title: 'Estado',
                    dataIndex: 'estado',
                    key: 'e',
                    width: 100,
                    render: (v: string) => (
                      <Tag
                        color={v === 'RECIBIDO' ? 'green' : v === 'RECHAZADO' ? 'red' : 'gold'}
                        style={{ fontSize: 10 }}
                      >
                        {v}
                      </Tag>
                    )
                  }
                ]}
                locale={{ emptyText: 'Sin facturas emitidas hoy' }}
                pagination={false}
                scroll={{ y: 200 }}
              />
            </Card>
          </Col>

          {/* Stats Inventario */}
          <Col xs={24} lg={6}>
            <Card title="Inventario" size="small" style={{ borderRadius: 10 }}>
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                <Statistic
                  title="Valor Total Inventario"
                  value={kpi?.valorInventario ?? 0}
                  precision={2}
                  formatter={v => formatCurrency(Number(v))}
                  prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                />
                <Statistic
                  title="Productos Activos"
                  value={kpi?.totalProductos ?? 0}
                  prefix={<InboxOutlined style={{ color: 'var(--theme-primary)' }} />}
                />
                <Statistic
                  title="Con Stock Crítico"
                  value={kpi?.stockBajo ?? 0}
                  valueStyle={{ color: (kpi?.stockBajo ?? 0) > 0 ? '#faad14' : '#52c41a' }}
                  prefix={<WarningOutlined style={{ color: (kpi?.stockBajo ?? 0) > 0 ? '#faad14' : '#52c41a' }} />}
                />
                <div style={{ marginTop: 4 }}>
                  <Text style={{ fontSize: 11 }}>
                    <ShoppingCartOutlined style={{ marginRight: 6, color: '#8c8c8c' }} />
                    ERP Speeddansys — DTE El Salvador
                  </Text>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  )
}
