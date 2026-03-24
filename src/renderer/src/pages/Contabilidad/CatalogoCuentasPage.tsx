import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  Card, Table, Button, Form, Modal, Input, Select, Space, Row, Col,
  Statistic, message, Tag, TreeSelect, Popconfirm, Typography, InputNumber,
  Checkbox, Alert, Divider, Steps
} from 'antd'
import {
  PlusOutlined, ReloadOutlined, DeleteOutlined, EditOutlined,
  ImportOutlined, CheckOutlined, CloseOutlined, SearchOutlined,
  AccountBookOutlined, ApartmentOutlined, DownloadOutlined,
  FileExcelOutlined, WarningOutlined, CloudUploadOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import * as XLSX from 'xlsx'

const { Text } = Typography

const TIPO_OPTIONS = [
  'ACTIVO', 'PASIVO', 'PATRIMONIO', 'INGRESO', 'COSTO',
  'GASTO', 'CIERRE', 'ORDEN_DEUDORA', 'ORDEN_ACREEDORA'
]

const NATURALEZA_OPTIONS = ['DEUDORA', 'ACREEDORA']

const TIPO_COLORS: Record<string, string> = {
  ACTIVO: 'blue',
  PASIVO: 'red',
  PATRIMONIO: 'purple',
  INGRESO: 'green',
  COSTO: 'orange',
  GASTO: 'volcano',
  CIERRE: 'default',
  ORDEN_DEUDORA: 'cyan',
  ORDEN_ACREEDORA: 'magenta'
}

const TIPOS_VALIDOS = ['ACTIVO','PASIVO','PATRIMONIO','INGRESO','COSTO','GASTO','CIERRE','ORDEN_DEUDORA','ORDEN_ACREEDORA']
const NATURALEZAS_VALIDAS = ['DEUDORA','ACREEDORA']

interface FilaCatalogo {
  codigo: string
  nombre: string
  tipo: string
  naturaleza: string
  nivel: number
  codigo_padre: string
  acepta_movimiento: boolean
  descripcion: string
  // validacion
  errores: string[]
  fila: number
}

// ── Descarga plantilla Excel ──────────────────────────────
function descargarPlantilla() {
  const headers = ['codigo','nombre','tipo','naturaleza','nivel','codigo_padre','acepta_movimiento','descripcion']
  const ejemplos = [
    ['1','Activo','ACTIVO','DEUDORA',1,'','NO','Grupo activos'],
    ['11','Activo Corriente','ACTIVO','DEUDORA',2,'1','NO',''],
    ['1101','Efectivo y Equivalentes','ACTIVO','DEUDORA',3,'11','NO',''],
    ['110101','Caja General','ACTIVO','DEUDORA',4,'1101','SI','Efectivo en caja principal'],
    ['110102','Caja Chica','ACTIVO','DEUDORA',4,'1101','SI',''],
    ['110103','Bancos','ACTIVO','DEUDORA',4,'1101','SI',''],
    ['2','Pasivo','PASIVO','ACREEDORA',1,'','NO',''],
    ['21','Pasivo Corriente','PASIVO','ACREEDORA',2,'2','NO',''],
    ['2101','Proveedores','PASIVO','ACREEDORA',3,'21','SI',''],
  ]
  const ws = XLSX.utils.aoa_to_sheet([headers, ...ejemplos])
  ws['!cols'] = [14,35,16,12,8,16,18,30].map(w => ({ wch: w }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Catalogo')
  XLSX.writeFile(wb, 'plantilla_catalogo_cuentas.xlsx')
}

// ── Parsea y valida archivo Excel/CSV ─────────────────────
function parsearArchivo(file: File): Promise<FilaCatalogo[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as string[][]

        if (rows.length < 2) { reject(new Error('El archivo está vacío o sin datos')); return }

        // Detectar índice de columnas desde el header (case-insensitive, permite variantes)
        const header = rows[0].map(h => String(h).toLowerCase().trim().replace(/\s+/g,'_'))
        const idx = (names: string[]) => names.reduce((f, n) => f >= 0 ? f : header.indexOf(n), -1)

        const iCodigo   = idx(['codigo','code','cuenta'])
        const iNombre   = idx(['nombre','name','descripcion_cuenta','descripcion cuenta'])
        const iTipo     = idx(['tipo','type','tipo_cuenta'])
        const iNat      = idx(['naturaleza','nat','naturaleza_cuenta'])
        const iNivel    = idx(['nivel','level','profundidad'])
        const iPadre    = idx(['codigo_padre','padre','parent','cuenta_padre','codigopadre'])
        const iMov      = idx(['acepta_movimiento','movimiento','mov','acepta movimiento'])
        const iDesc     = idx(['descripcion','description','obs','observacion'])

        if (iCodigo < 0) { reject(new Error('No se encontró columna "codigo"')); return }
        if (iNombre < 0) { reject(new Error('No se encontró columna "nombre"')); return }

        const codigos = new Set<string>()
        const resultado: FilaCatalogo[] = []

        for (let i = 1; i < rows.length; i++) {
          const r = rows[i]
          if (!r || r.every(c => !c)) continue // fila vacía

          const codigo   = String(r[iCodigo] ?? '').trim()
          const nombre   = String(r[iNombre] ?? '').trim()
          const tipo     = String(r[iTipo] ?? '').trim().toUpperCase()
          const nat      = String(r[iNat] ?? '').trim().toUpperCase()
          const nivel    = parseInt(String(r[iNivel] ?? '1')) || 1
          const padre    = iPadre >= 0 ? String(r[iPadre] ?? '').trim() : ''
          const movRaw   = String(r[iMov] ?? 'NO').trim().toUpperCase()
          const mov      = movRaw === 'SI' || movRaw === 'YES' || movRaw === '1' || movRaw === 'TRUE'
          const desc     = iDesc >= 0 ? String(r[iDesc] ?? '').trim() : ''

          const errores: string[] = []
          if (!codigo) errores.push('Código vacío')
          if (!nombre) errores.push('Nombre vacío')
          if (codigo && codigos.has(codigo)) errores.push(`Código duplicado: ${codigo}`)
          if (codigo) codigos.add(codigo)
          if (tipo && !TIPOS_VALIDOS.includes(tipo)) errores.push(`Tipo inválido: "${tipo}"`)
          if (nat && !NATURALEZAS_VALIDAS.includes(nat)) errores.push(`Naturaleza inválida: "${nat}"`)

          resultado.push({ codigo, nombre, tipo, naturaleza: nat, nivel, codigo_padre: padre, acepta_movimiento: mov, descripcion: desc, errores, fila: i + 1 })
        }

        // Validar que codigo_padre exista en el mismo archivo
        for (const f of resultado) {
          if (f.codigo_padre && !codigos.has(f.codigo_padre)) {
            f.errores.push(`codigo_padre "${f.codigo_padre}" no existe en el archivo`)
          }
        }

        resolve(resultado)
      } catch (err: any) {
        reject(new Error(`Error al leer el archivo: ${err.message}`))
      }
    }
    reader.onerror = () => reject(new Error('Error al leer el archivo'))
    reader.readAsArrayBuffer(file)
  })
}

/** Build tree structure for Table expandable rows */
function buildTree(cuentas: CatalogoCuentaRow[]): CatalogoCuentaRow[] {
  const map = new Map<number, CatalogoCuentaRow & { children?: CatalogoCuentaRow[] }>()
  const roots: (CatalogoCuentaRow & { children?: CatalogoCuentaRow[] })[] = []

  // First pass: index all accounts
  for (const c of cuentas) {
    map.set(c.id, { ...c })
  }

  // Second pass: build hierarchy
  for (const c of cuentas) {
    const node = map.get(c.id)!
    if (c.cuentaPadreId && map.has(c.cuentaPadreId)) {
      const parent = map.get(c.cuentaPadreId)!
      if (!parent.children) parent.children = []
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

/** Build TreeSelect data from flat accounts list */
function buildTreeSelectData(cuentas: CatalogoCuentaRow[], excludeId?: number): { title: string; value: number; children?: unknown[] }[] {
  const map = new Map<number, { title: string; value: number; children: unknown[] }>()
  const roots: { title: string; value: number; children: unknown[] }[] = []

  for (const c of cuentas) {
    if (c.id === excludeId) continue
    map.set(c.id, { title: `${c.codigo} - ${c.nombre}`, value: c.id, children: [] })
  }

  for (const c of cuentas) {
    if (c.id === excludeId) continue
    const node = map.get(c.id)!
    if (c.cuentaPadreId && map.has(c.cuentaPadreId)) {
      map.get(c.cuentaPadreId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  // Remove empty children arrays
  const clean = (items: unknown[]): unknown[] =>
    items.map((item: unknown) => {
      const i = item as { children: unknown[] }
      if (i.children.length === 0) {
        const { children: _, ...rest } = i
        return rest
      }
      i.children = clean(i.children)
      return i
    })

  return clean(roots) as { title: string; value: number; children?: unknown[] }[]
}

export default function CatalogoCuentasPage() {
  const [cuentas, setCuentas] = useState<CatalogoCuentaRow[]>([])
  const [loading, setLoading] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<string | undefined>()

  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<CatalogoCuentaRow | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [form] = Form.useForm()

  const [importando, setImportando] = useState(false)

  // import CSV/Excel
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importStep, setImportStep] = useState(0)       // 0=subir 1=preview 2=listo
  const [filasImport, setFilasImport] = useState<FilaCatalogo[]>([])
  const [importErrors, setImportErrors] = useState<string[]>([])
  const [importandoCustom, setImportandoCustom] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Cargar datos ──────────────────────────────────────────
  const cargar = useCallback(async (b = busqueda, t = filtroTipo) => {
    setLoading(true)
    try {
      const res = await window.contabilidad.listarCuentas(b || undefined, t)
      setCuentas(res)
    } catch {
      message.error('Error al cargar catálogo de cuentas')
    } finally {
      setLoading(false)
    }
  }, [busqueda, filtroTipo])

  useEffect(() => {
    cargar()
  }, []) // eslint-disable-line

  // ── KPIs ──────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total = cuentas.length
    const movimiento = cuentas.filter(c => c.aceptaMovimiento).length
    const porTipo: Record<string, number> = {}
    for (const c of cuentas) {
      porTipo[c.tipo] = (porTipo[c.tipo] || 0) + 1
    }
    return { total, movimiento, porTipo }
  }, [cuentas])

  // ── Tree data ─────────────────────────────────────────────
  const treeData = useMemo(() => buildTree(cuentas), [cuentas])

  const treeSelectData = useMemo(
    () => buildTreeSelectData(cuentas, editando?.id),
    [cuentas, editando]
  )

  // ── Handlers ──────────────────────────────────────────────
  const abrirCrear = () => {
    setEditando(null)
    form.resetFields()
    form.setFieldsValue({ nivel: 1, aceptaMovimiento: false })
    setModalOpen(true)
  }

  const abrirEditar = (cuenta: CatalogoCuentaRow) => {
    setEditando(cuenta)
    form.setFieldsValue({
      codigo: cuenta.codigo,
      nombre: cuenta.nombre,
      descripcion: cuenta.descripcion || '',
      tipo: cuenta.tipo,
      naturaleza: cuenta.naturaleza,
      nivel: cuenta.nivel,
      cuentaPadreId: cuenta.cuentaPadreId || undefined,
      aceptaMovimiento: cuenta.aceptaMovimiento
    })
    setModalOpen(true)
  }

  const guardar = async () => {
    try {
      const values = await form.validateFields()
      setGuardando(true)
      if (editando) {
        await window.contabilidad.editarCuenta(editando.id, values)
        message.success('Cuenta actualizada')
      } else {
        await window.contabilidad.crearCuenta(values)
        message.success('Cuenta creada')
      }
      setModalOpen(false)
      cargar()
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return
      message.error('Error al guardar cuenta')
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (id: number) => {
    try {
      await window.contabilidad.eliminarCuenta(id)
      message.success('Cuenta eliminada')
      cargar()
    } catch {
      message.error('Error al eliminar cuenta')
    }
  }

  const handleArchivoSeleccionado = async (file: File) => {
    try {
      const filas = await parsearArchivo(file)
      setFilasImport(filas)
      const errs = filas.flatMap(f => f.errores.map(e => `Fila ${f.fila}: ${e}`))
      setImportErrors(errs)
      setImportStep(1)
    } catch (err: any) {
      message.error(err.message)
    }
  }

  const confirmarImportacion = async () => {
    const validas = filasImport.filter(f => f.errores.length === 0)
    if (validas.length === 0) { message.error('No hay filas válidas para importar'); return }
    setImportandoCustom(true)
    try {
      const payload = validas.map(f => ({
        codigo: f.codigo,
        nombre: f.nombre,
        tipo: f.tipo,
        naturaleza: f.naturaleza,
        nivel: f.nivel,
        codigoPadre: f.codigo_padre || null,
        aceptaMovimiento: f.acepta_movimiento,
        descripcion: f.descripcion || undefined
      }))
      const result = await window.contabilidad.importarCatalogo(payload)
      message.success(`Catálogo importado: ${result.created} cuentas nuevas de ${result.total}`)
      setImportStep(2)
      cargar()
    } catch (err: any) {
      message.error(err.message ?? 'Error al importar')
    } finally {
      setImportandoCustom(false)
    }
  }

  const resetImport = () => {
    setImportStep(0)
    setFilasImport([])
    setImportErrors([])
    setImportModalOpen(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const importarCatalogo = async () => {
    setImportando(true)
    try {
      const catalogo = await window.contabilidad.obtenerCatalogoEstandar()
      const result = await window.contabilidad.importarCatalogo(catalogo)
      message.success(`Catálogo importado: ${result.created} cuentas creadas de ${result.total}`)
      cargar()
    } catch {
      message.error('Error al importar catálogo estándar')
    } finally {
      setImportando(false)
    }
  }

  // ── Filtros ───────────────────────────────────────────────
  const handleBusqueda = (value: string) => {
    setBusqueda(value)
    cargar(value, filtroTipo)
  }

  const handleFiltroTipo = (value: string | undefined) => {
    setFiltroTipo(value)
    cargar(busqueda, value)
  }

  // ── Columnas ──────────────────────────────────────────────
  const columns: ColumnsType<CatalogoCuentaRow> = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      width: 140,
      render: (v: string) => <Text strong style={{ fontFamily: 'monospace' }}>{v}</Text>
    },
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      ellipsis: true
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      width: 150,
      render: (v: string) => <Tag color={TIPO_COLORS[v] || 'default'}>{v}</Tag>
    },
    {
      title: 'Naturaleza',
      dataIndex: 'naturaleza',
      key: 'naturaleza',
      width: 120,
      render: (v: string) => <Tag>{v}</Tag>
    },
    {
      title: 'Nivel',
      dataIndex: 'nivel',
      key: 'nivel',
      width: 70,
      align: 'center'
    },
    {
      title: 'Acepta Mov.',
      dataIndex: 'aceptaMovimiento',
      key: 'aceptaMovimiento',
      width: 110,
      align: 'center',
      render: (v: boolean) =>
        v ? <CheckOutlined style={{ color: '#52c41a' }} /> : <CloseOutlined style={{ color: '#ff4d4f' }} />
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 120,
      align: 'center',
      render: (_: unknown, record: CatalogoCuentaRow) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => abrirEditar(record)}
          />
          <Popconfirm
            title="Eliminar cuenta"
            description={
              record._count?.subcuentas
                ? `Esta cuenta tiene ${record._count.subcuentas} subcuenta(s). No se puede eliminar.`
                : '¿Estás seguro de eliminar esta cuenta?'
            }
            onConfirm={() => eliminar(record.id)}
            okText="Sí"
            cancelText="No"
            disabled={!!record._count?.subcuentas || !!record._count?.detallesAsiento}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={!!record._count?.subcuentas || !!record._count?.detallesAsiento}
            />
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: 24 }}>
      {/* KPIs */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 10 }}>
            <Statistic
              title="Total Cuentas"
              value={kpis.total}
              prefix={<AccountBookOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 10 }}>
            <Statistic
              title="Cuentas de Movimiento"
              value={kpis.movimiento}
              prefix={<ApartmentOutlined />}
            />
          </Card>
        </Col>
        {Object.entries(kpis.porTipo).slice(0, 4).map(([tipo, count]) => (
          <Col xs={12} sm={6} key={tipo}>
            <Card size="small" style={{ borderRadius: 10 }}>
              <Statistic
                title={tipo}
                value={count}
                valueStyle={{ color: TIPO_COLORS[tipo] === 'default' ? undefined : undefined }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Tabla */}
      <Card
        size="small"
        style={{ borderRadius: 10 }}
        title="Catálogo de Cuentas"
        extra={
          <Space>
            <Input.Search
              placeholder="Buscar código o nombre..."
              allowClear
              onSearch={handleBusqueda}
              style={{ width: 250 }}
              prefix={<SearchOutlined />}
            />
            <Select
              placeholder="Filtrar tipo"
              allowClear
              style={{ width: 180 }}
              onChange={handleFiltroTipo}
              value={filtroTipo}
              options={TIPO_OPTIONS.map(t => ({ label: t, value: t }))}
            />
            <Button icon={<ReloadOutlined />} onClick={() => cargar()}>
              Recargar
            </Button>
            <Button
              icon={<FileExcelOutlined />}
              onClick={() => { setImportStep(0); setImportModalOpen(true) }}
            >
              Importar Excel/CSV
            </Button>
            <Button
              icon={<ImportOutlined />}
              onClick={importarCatalogo}
              loading={importando}
            >
              Catálogo Estándar SV
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={abrirCrear}>
              Nueva Cuenta
            </Button>
          </Space>
        }
      >
        <Table
          size="small"
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={treeData}
          expandable={{
            defaultExpandAllRows: false,
            childrenColumnName: 'children'
          }}
          pagination={false}
          scroll={{ y: 'calc(100vh - 380px)' }}
        />
      </Card>

      {/* ── Modal Importar Excel/CSV ── */}
      <Modal
        title={<Space><FileExcelOutlined style={{ color: '#52c41a' }} /> Importar Catálogo desde Excel / CSV</Space>}
        open={importModalOpen}
        onCancel={resetImport}
        width={900}
        footer={null}
        destroyOnClose
      >
        <Steps
          current={importStep}
          size="small"
          style={{ marginBottom: 20 }}
          items={[
            { title: 'Subir archivo' },
            { title: 'Validar y confirmar' },
            { title: 'Importado' }
          ]}
        />

        {/* Paso 0: subir archivo */}
        {importStep === 0 && (
          <div>
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              message="Instrucciones"
              description={
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
                  <li>Descarga la plantilla, llénala con tu catálogo y súbela.</li>
                  <li>El campo <b>codigo</b> puede usar cualquier formato: <code>1101</code>, <code>11-01-001</code>, <code>11.01.02</code></li>
                  <li><b>codigo_padre</b> debe coincidir exactamente con el código del padre. Déjalo vacío para cuentas raíz (nivel 1).</li>
                  <li>Solo las cuentas hoja (sin subcuentas) deben tener <b>acepta_movimiento = SI</b>.</li>
                  <li>Tipos válidos: ACTIVO · PASIVO · PATRIMONIO · INGRESO · COSTO · GASTO · CIERRE · ORDEN_DEUDORA · ORDEN_ACREEDORA</li>
                </ul>
              }
            />
            <Space>
              <Button icon={<DownloadOutlined />} onClick={descargarPlantilla} type="dashed">
                Descargar Plantilla Excel
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleArchivoSeleccionado(f) }}
              />
              <Button
                type="primary"
                icon={<CloudUploadOutlined />}
                onClick={() => fileInputRef.current?.click()}
              >
                Seleccionar archivo (.xlsx / .csv)
              </Button>
            </Space>
          </div>
        )}

        {/* Paso 1: preview y validación */}
        {importStep === 1 && (
          <div>
            {importErrors.length > 0 && (
              <Alert
                type="warning"
                showIcon
                icon={<WarningOutlined />}
                style={{ marginBottom: 12 }}
                message={`${importErrors.length} error(es) encontrados — las filas con error NO se importarán`}
                description={
                  <ul style={{ margin: 0, paddingLeft: 16, maxHeight: 120, overflowY: 'auto', fontSize: 12 }}>
                    {importErrors.slice(0, 20).map((e, i) => <li key={i}>{e}</li>)}
                    {importErrors.length > 20 && <li>...y {importErrors.length - 20} más</li>}
                  </ul>
                }
              />
            )}

            <div style={{ marginBottom: 8 }}>
              <Space>
                <Tag color="green">{filasImport.filter(f => f.errores.length === 0).length} cuentas válidas</Tag>
                {importErrors.length > 0 && <Tag color="red">{filasImport.filter(f => f.errores.length > 0).length} con errores</Tag>}
                <Text type="secondary" style={{ fontSize: 12 }}>Solo se importarán las cuentas válidas</Text>
              </Space>
            </div>

            <Table
              size="small"
              rowKey="fila"
              dataSource={filasImport}
              scroll={{ y: 320, x: 700 }}
              pagination={false}
              rowClassName={r => r.errores.length > 0 ? 'import-row-error' : ''}
              columns={[
                { title: '#', dataIndex: 'fila', width: 50 },
                { title: 'Código', dataIndex: 'codigo', width: 120, render: v => <Text code style={{ fontSize: 12 }}>{v}</Text> },
                { title: 'Nombre', dataIndex: 'nombre', ellipsis: true },
                { title: 'Tipo', dataIndex: 'tipo', width: 130, render: v => <Tag color={TIPO_COLORS[v] || 'default'} style={{ fontSize: 11 }}>{v}</Tag> },
                { title: 'Padre', dataIndex: 'codigo_padre', width: 100, render: v => v ? <Text code style={{ fontSize: 12 }}>{v}</Text> : <Text type="secondary">—</Text> },
                { title: 'Mov', dataIndex: 'acepta_movimiento', width: 60, align: 'center', render: v => v ? <CheckOutlined style={{ color: '#52c41a' }} /> : <CloseOutlined style={{ color: '#aaa' }} /> },
                {
                  title: 'Estado', width: 80, align: 'center',
                  render: (_, r) => r.errores.length > 0
                    ? <Tag color="error" title={r.errores.join('\n')}>Error</Tag>
                    : <Tag color="success">OK</Tag>
                }
              ]}
            />

            <Divider style={{ margin: '12px 0' }} />
            <Space>
              <Button onClick={() => setImportStep(0)}>← Cambiar archivo</Button>
              <Button
                type="primary"
                icon={<ImportOutlined />}
                loading={importandoCustom}
                disabled={filasImport.filter(f => f.errores.length === 0).length === 0}
                onClick={confirmarImportacion}
              >
                Importar {filasImport.filter(f => f.errores.length === 0).length} cuentas
              </Button>
            </Space>
          </div>
        )}

        {/* Paso 2: éxito */}
        {importStep === 2 && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <CheckOutlined style={{ fontSize: 48, color: '#52c41a', display: 'block', marginBottom: 16 }} />
            <Text strong style={{ fontSize: 16 }}>¡Catálogo importado correctamente!</Text>
            <br /><br />
            <Button type="primary" onClick={resetImport}>Cerrar</Button>
          </div>
        )}
      </Modal>

      {/* Modal Crear/Editar */}
      <Modal
        title={editando ? 'Editar Cuenta' : 'Nueva Cuenta'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={guardar}
        confirmLoading={guardando}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="codigo"
                label="Código"
                rules={[{ required: true, message: 'Ingrese el código' }]}
              >
                <Input placeholder="Ej: 1101" style={{ fontFamily: 'monospace' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="nombre"
                label="Nombre"
                rules={[{ required: true, message: 'Ingrese el nombre' }]}
              >
                <Input placeholder="Ej: Efectivo y Equivalentes" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="descripcion" label="Descripción">
            <Input.TextArea rows={2} placeholder="Descripción opcional" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="tipo"
                label="Tipo"
                rules={[{ required: true, message: 'Seleccione el tipo' }]}
              >
                <Select
                  placeholder="Tipo de cuenta"
                  options={TIPO_OPTIONS.map(t => ({ label: t, value: t }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="naturaleza"
                label="Naturaleza"
                rules={[{ required: true, message: 'Seleccione la naturaleza' }]}
              >
                <Select
                  placeholder="Naturaleza"
                  options={NATURALEZA_OPTIONS.map(n => ({ label: n, value: n }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="nivel"
                label="Nivel"
                rules={[{ required: true, message: 'Ingrese el nivel' }]}
              >
                <InputNumber min={1} max={10} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="cuentaPadreId" label="Cuenta Padre">
            <TreeSelect
              placeholder="Seleccione cuenta padre (opcional)"
              allowClear
              treeData={treeSelectData}
              treeDefaultExpandAll={false}
              showSearch
              treeNodeFilterProp="title"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item name="aceptaMovimiento" valuePropName="checked">
            <Checkbox>Acepta movimiento (cuenta de detalle)</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
