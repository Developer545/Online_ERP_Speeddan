import { useState, useEffect, useRef, useCallback } from 'react'
import { Modal, Input, List, Tag, Typography, Space, Divider, Spin } from 'antd'
import {
  TeamOutlined, InboxOutlined, AuditOutlined,
  SearchOutlined, RightOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import animeLib from 'animejs/lib/anime.es.js'
const anime: any = animeLib || null

const { Text } = Typography

interface SearchResult {
  type: 'cliente' | 'producto' | 'factura'
  id: number
  titulo: string
  subtitulo?: string
  tag?: string
  tagColor?: string
  ruta: string
}

interface Props {
  open: boolean
  onClose: () => void
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  cliente: <TeamOutlined style={{ color: '#722ed1' }} />,
  producto: <InboxOutlined style={{ color: 'var(--theme-primary)' }} />,
  factura: <AuditOutlined style={{ color: '#52c41a' }} />
}

const TYPE_LABELS: Record<string, string> = {
  cliente: 'Cliente',
  producto: 'Producto',
  factura: 'Factura'
}

export default function GlobalSearchModal({ open, onClose }: Props) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<any>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  // Focus al abrir
  useEffect(() => {
    if (open) {
      setQuery('')
      setResultados([])
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  // Animación de entrada de resultados
  useEffect(() => {
    if (resultados.length > 0 && listRef.current && anime) {
      try {
        anime({
          targets: listRef.current.querySelectorAll('.search-item'),
          opacity: [0, 1],
          translateX: [-12, 0],
          duration: 250,
          delay: anime.stagger(40),
          easing: 'easeOutCubic'
        })
      } catch {
        // silently skip animation if anime fails
      }
    }
  }, [resultados])

  const buscar = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) { setResultados([]); return }
    setLoading(true)
    try {
      const [clientes, productos] = await Promise.all([
        window.clients.buscar(q),
        window.products.buscar(q)
      ])

      const items: SearchResult[] = [
        ...clientes.slice(0, 4).map(c => ({
          type: 'cliente' as const,
          id: c.id,
          titulo: c.nombre,
          subtitulo: c.numDocumento,
          tag: c.nrc ? 'CCF' : 'FAC',
          tagColor: c.nrc ? 'purple' : 'blue',
          ruta: '/clientes'
        })),
        ...productos.slice(0, 4).map(p => ({
          type: 'producto' as const,
          id: p.id,
          titulo: p.nombre,
          subtitulo: `Código: ${p.codigo} — Stock: ${Number(p.stockActual).toFixed(0)}`,
          tag: `$${Number(p.precioVenta).toFixed(2)}`,
          tagColor: 'green',
          ruta: '/productos'
        }))
      ]

      setResultados(items)
      setSelected(0)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  // Debounce search
  useEffect(() => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => buscar(query), 280)
    return () => clearTimeout(timerRef.current)
  }, [query, buscar])

  // Navegación teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected(s => Math.min(s + 1, resultados.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected(s => Math.max(s - 1, 0))
    } else if (e.key === 'Enter' && resultados.length > 0) {
      handleNavegar(resultados[selected])
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  const handleNavegar = (item: SearchResult) => {
    navigate(item.ruta)
    onClose()
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      width={580}
      style={{ top: 120 }}
      styles={{ body: { padding: 0 } }}
    >
      {/* Input de búsqueda */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
        <Input
          ref={inputRef}
          size="large"
          placeholder="Buscar clientes, productos, facturas..."
          prefix={loading ? <Spin size="small" /> : <SearchOutlined style={{ color: '#bfbfbf' }} />}
          suffix={
            <Text type="secondary" style={{ fontSize: 11 }}>
              <kbd style={{ background: '#f5f5f5', border: '1px solid #d9d9d9', borderRadius: 3, padding: '1px 5px', fontSize: 10 }}>ESC</kbd>
            </Text>
          }
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          bordered={false}
          style={{ fontSize: 15 }}
          autoComplete="off"
        />
      </div>

      {/* Resultados */}
      <div ref={listRef} style={{ maxHeight: 380, overflowY: 'auto' }}>
        {query.length >= 2 && resultados.length === 0 && !loading && (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <Text type="secondary">Sin resultados para "{query}"</Text>
          </div>
        )}

        {query.length < 2 && (
          <div style={{ padding: '20px 16px' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Escribe al menos 2 caracteres para buscar...</Text>
            <Divider style={{ margin: '12px 0 8px' }} />
            <Space wrap>
              {[
                { label: 'Clientes', ruta: '/clientes', color: 'purple' },
                { label: 'Productos', ruta: '/productos', color: 'blue' },
                { label: 'Facturas', ruta: '/facturacion/facturas', color: 'green' },
                { label: 'Compras', ruta: '/compras', color: 'orange' },
                { label: 'Dashboard', ruta: '/dashboard', color: 'default' }
              ].map(acc => (
                <Tag
                  key={acc.ruta}
                  color={acc.color}
                  style={{ cursor: 'pointer', padding: '3px 10px' }}
                  onClick={() => { navigate(acc.ruta); onClose() }}
                >
                  {acc.label}
                </Tag>
              ))}
            </Space>
          </div>
        )}

        {resultados.length > 0 && (
          <List
            size="small"
            dataSource={resultados}
            renderItem={(item, idx) => (
              <List.Item
                className="search-item"
                onClick={() => handleNavegar(item)}
                style={{
                  cursor: 'pointer',
                  padding: '8px 16px',
                  background: idx === selected ? 'rgba(22, 119, 255, 0.06)' : undefined,
                  borderLeft: idx === selected ? '3px solid var(--theme-primary)' : '3px solid transparent',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={() => setSelected(idx)}
              >
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Space>
                    {TYPE_ICONS[item.type]}
                    <div>
                      <Text strong style={{ fontSize: 13 }}>{item.titulo}</Text>
                      {item.subtitulo && (
                        <div><Text type="secondary" style={{ fontSize: 11 }}>{item.subtitulo}</Text></div>
                      )}
                    </div>
                  </Space>
                  <Space>
                    <Tag style={{ fontSize: 10 }}>{TYPE_LABELS[item.type]}</Tag>
                    {item.tag && <Tag color={item.tagColor} style={{ fontSize: 10 }}>{item.tag}</Tag>}
                    <RightOutlined style={{ fontSize: 10, color: '#bfbfbf' }} />
                  </Space>
                </Space>
              </List.Item>
            )}
          />
        )}
      </div>

      {/* Footer */}
      {resultados.length > 0 && (
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid #f0f0f0',
          display: 'flex',
          gap: 12
        }}>
          {[
            { key: '↑↓', label: 'Navegar' },
            { key: '↵', label: 'Abrir' },
            { key: 'Esc', label: 'Cerrar' }
          ].map(h => (
            <Space key={h.key} size={4}>
              <kbd style={{ background: '#f5f5f5', border: '1px solid #d9d9d9', borderRadius: 3, padding: '1px 6px', fontSize: 10 }}>{h.key}</kbd>
              <Text type="secondary" style={{ fontSize: 11 }}>{h.label}</Text>
            </Space>
          ))}
        </div>
      )}
    </Modal>
  )
}
