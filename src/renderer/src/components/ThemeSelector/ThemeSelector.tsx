import { useState, useRef } from 'react'
import {
  Modal, Button, Space, Typography, Tooltip, message, Divider
} from 'antd'
import {
  BgColorsOutlined, CheckOutlined, ClearOutlined
} from '@ant-design/icons'
import { THEMES } from '../../themes/themes'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'

const { Text, Title } = Typography

interface ThemeSelectorProps {
  open: boolean
  onClose: () => void
}

const QUICK_COLORS = [
  { color: '#c9a227', label: 'Dorado' },
  { color: 'var(--theme-primary)', label: 'Azul' },
  { color: '#059669', label: 'Esmeralda' },
  { color: '#7c3aed', label: 'Violeta' },
  { color: '#db2777', label: 'Rosa' },
  { color: '#ea580c', label: 'Naranja' },
  { color: '#0891b2', label: 'Cian' },
  { color: '#475569', label: 'Pizarra' },
  { color: '#16a34a', label: 'Verde' },
  { color: '#dc2626', label: 'Rojo' },
]

const darkThemes = THEMES.filter(t => t.isDark)
const lightThemes = THEMES.filter(t => !t.isDark)

export default function ThemeSelector({ open, onClose }: ThemeSelectorProps) {
  const { themeId, customColor, setTheme, setCustomColor } = useTheme()
  const { user } = useAuth()
  const colorInputRef = useRef<HTMLInputElement>(null)

  const [pendingThemeId, setPendingThemeId] = useState(themeId)
  const [pendingColor, setPendingColor] = useState(customColor)
  const [hexInput, setHexInput] = useState(customColor)

  const handleOpen = () => {
    setPendingThemeId(themeId)
    setPendingColor(customColor)
    setHexInput(customColor)
  }

  const handleSave = () => {
    setTheme(pendingThemeId, user?.id)
    setCustomColor(pendingColor, user?.id)
    message.success('✨ Tema aplicado correctamente')
    onClose()
  }

  const handleCancel = () => {
    setPendingThemeId(themeId)
    setPendingColor(customColor)
    setHexInput(customColor)
    onClose()
  }

  const handleHexChange = (val: string) => {
    const clean = val.startsWith('#') ? val : `#${val}`
    setHexInput(clean)
    if (/^#[0-9a-fA-F]{6}$/.test(clean)) {
      setPendingColor(clean)
    }
  }

  const handleNativeColorChange = (val: string) => {
    setPendingColor(val)
    setHexInput(val)
  }

  const handleClearColor = () => {
    setPendingColor('')
    setHexInput('')
  }

  // Color activo para preview
  const activeColor = (pendingColor && /^#[0-9a-fA-F]{6}$/.test(pendingColor))
    ? pendingColor
    : THEMES.find(t => t.id === pendingThemeId)?.colorPrimary || 'var(--theme-primary)'

  const pendingTheme = THEMES.find(t => t.id === pendingThemeId)

  return (
    <Modal
      title={
        <Space>
          <BgColorsOutlined style={{ color: activeColor }} />
          <span>Apariencia y Temas</span>
        </Space>
      }
      open={open}
      afterOpenChange={visible => visible && handleOpen()}
      onCancel={handleCancel}
      width={700}
      styles={{ body: { padding: '16px 24px' } }}
      footer={
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            El tema se guarda por usuario en la base de datos
          </Text>
          <Space>
            <Button onClick={handleCancel}>Cancelar</Button>
            <Button
              type="primary"
              onClick={handleSave}
              style={{ background: activeColor, borderColor: activeColor }}
            >
              Guardar tema
            </Button>
          </Space>
        </Space>
      }
    >
      {/* ── Temas Oscuros ── */}
      <Title level={5} style={{ margin: '0 0 10px', fontSize: 13, opacity: 0.65, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        🌙 Temas Oscuros
      </Title>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {darkThemes.map(theme => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            isSelected={pendingThemeId === theme.id}
            onSelect={() => setPendingThemeId(theme.id)}
          />
        ))}
      </div>

      {/* ── Temas Claros ── */}
      <Title level={5} style={{ margin: '0 0 10px', fontSize: 13, opacity: 0.65, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        ☀️ Temas Claros
      </Title>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {lightThemes.map(theme => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            isSelected={pendingThemeId === theme.id}
            onSelect={() => setPendingThemeId(theme.id)}
          />
        ))}
      </div>

      <Divider style={{ margin: '0 0 16px' }} />

      {/* ── Color personalizado ── */}
      <Title level={5} style={{ margin: '0 0 4px', fontSize: 13 }}>
        <BgColorsOutlined /> Color de acento personalizado
      </Title>
      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 14 }}>
        Reemplaza el color primario del tema. Deja en blanco para usar el color original.
      </Text>

      {/* Preview + controles */}
      <Space align="center" wrap style={{ marginBottom: 12 }}>
        {/* Native color picker */}
        <Tooltip title="Abrir selector de color">
          <div
            onClick={() => colorInputRef.current?.click()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: activeColor,
              border: '2px solid var(--theme-border, #e8e8e8)',
              cursor: 'pointer',
              transition: 'transform 0.15s',
              flexShrink: 0,
              boxShadow: `0 2px 8px ${activeColor}60`
            }}
          />
        </Tooltip>

        {/* Input nativo oculto */}
        <input
          ref={colorInputRef}
          type="color"
          value={pendingColor || 'var(--theme-primary)'}
          onChange={e => handleNativeColorChange(e.target.value)}
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
        />

        {/* Hex input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          border: '1px solid var(--theme-border, #e8e8e8)',
          borderRadius: 8,
          overflow: 'hidden',
          height: 36
        }}>
          <span style={{
            padding: '0 10px',
            color: 'rgba(0,0,0,0.35)',
            fontFamily: 'monospace',
            fontSize: 13,
            borderRight: '1px solid var(--theme-border, #e8e8e8)'
          }}>#</span>
          <input
            type="text"
            placeholder="1677ff"
            value={hexInput.replace('#', '')}
            onChange={e => handleHexChange(e.target.value)}
            maxLength={6}
            style={{
              border: 'none',
              outline: 'none',
              width: 90,
              padding: '0 10px',
              fontFamily: 'monospace',
              fontSize: 13,
              background: 'transparent',
              color: 'inherit'
            }}
          />
        </div>

        {pendingColor && (
          <Tooltip title="Quitar color personalizado">
            <Button
              size="small"
              icon={<ClearOutlined />}
              onClick={handleClearColor}
            >
              Quitar
            </Button>
          </Tooltip>
        )}
      </Space>

      {/* Paleta de colores rápidos */}
      <div>
        <Text type="secondary" style={{ fontSize: 11 }}>Colores rápidos:</Text>
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          {QUICK_COLORS.map(({ color, label }) => (
            <Tooltip key={color} title={`${label} — ${color}`}>
              <div
                onClick={() => { setPendingColor(color); setHexInput(color) }}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  background: color,
                  cursor: 'pointer',
                  border: pendingColor === color ? '2px solid #fff' : '2px solid transparent',
                  boxShadow: pendingColor === color
                    ? `0 0 0 2px ${color}, 0 2px 6px ${color}80`
                    : `0 1px 3px ${color}60`,
                  transition: 'all 0.18s',
                  transform: pendingColor === color ? 'scale(1.15)' : 'scale(1)'
                }}
              />
            </Tooltip>
          ))}
        </div>
        {pendingTheme && (
          <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, background: pendingTheme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: '1px solid var(--theme-border, #e8e8e8)' }}>
            <Text style={{ fontSize: 12 }}>
              <span style={{ opacity: 0.5 }}>Tema seleccionado: </span>
              <strong>{pendingTheme.emoji} {pendingTheme.name}</strong>
              <span style={{ marginLeft: 8, padding: '1px 8px', borderRadius: 10, background: activeColor, color: '#fff', fontSize: 11 }}>
                {pendingColor ? 'Color personalizado' : 'Color original'}
              </span>
            </Text>
          </div>
        )}
      </div>
    </Modal>
  )
}

// ── Tarjeta de tema ─────────────────────────────────────────
interface ThemeCardProps {
  theme: typeof THEMES[0]
  isSelected: boolean
  onSelect: () => void
}

function ThemeCard({ theme, isSelected, onSelect }: ThemeCardProps) {
  return (
    <div
      onClick={onSelect}
      title={`${theme.name} — ${theme.description}`}
      style={{
        cursor: 'pointer',
        border: isSelected
          ? `2px solid ${theme.colorPrimary}`
          : '2px solid transparent',
        borderRadius: 10,
        overflow: 'hidden',
        background: theme.isDark ? '#1f1f1f' : '#f8fafc',
        transition: 'all 0.18s',
        position: 'relative',
        boxShadow: isSelected
          ? `0 0 0 3px ${theme.colorPrimary}30, 0 4px 16px rgba(0,0,0,0.12)`
          : '0 1px 4px rgba(0,0,0,0.08)',
        transform: isSelected ? 'translateY(-2px)' : 'none'
      }}
    >
      {/* Check badge */}
      {isSelected && (
        <div style={{
          position: 'absolute',
          top: 6,
          right: 6,
          background: theme.colorPrimary,
          borderRadius: '50%',
          width: 18,
          height: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
          boxShadow: `0 2px 6px ${theme.colorPrimary}60`
        }}>
          <CheckOutlined style={{ color: '#fff', fontSize: 9 }} />
        </div>
      )}

      {/* Preview miniatura: sider + content */}
      <div style={{ display: 'flex', height: 52 }}>
        {/* Sider mini */}
        <div style={{
          width: 28,
          background: theme.siderBg,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: '5px 4px',
          gap: 3
        }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: theme.colorPrimary, opacity: 0.9 }} />
          {[0.6, 0.35, 0.25].map((op, i) => (
            <div key={i} style={{ height: 4, borderRadius: 2, background: theme.menuItemColor, opacity: op }} />
          ))}
        </div>
        {/* Content mini */}
        <div style={{
          flex: 1,
          background: theme.contentBg,
          padding: '5px 6px',
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}>
          <div style={{ height: 5, borderRadius: 2, background: theme.colorPrimary, width: '60%' }} />
          <div style={{ height: 3, borderRadius: 2, background: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', width: '85%' }} />
          <div style={{ height: 3, borderRadius: 2, background: theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', width: '50%' }} />
          <div style={{ display: 'flex', gap: 3, marginTop: 2 }}>
            <div style={{ height: 8, flex: 1, borderRadius: 2, background: theme.colorPrimary, opacity: 0.15 }} />
            <div style={{ height: 8, flex: 1, borderRadius: 2, background: theme.colorSuccess, opacity: 0.15 }} />
          </div>
        </div>
      </div>

      {/* Nombre y color bar */}
      <div style={{ padding: '6px 8px 7px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: theme.isDark ? '#e0e0e0' : '#222', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {theme.emoji} {theme.name}
        </div>
        {/* Barra de color primario */}
        <div style={{ marginTop: 4, height: 3, borderRadius: 2, background: theme.colorPrimary }} />
      </div>
    </div>
  )
}
