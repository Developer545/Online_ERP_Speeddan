// ══════════════════════════════════════════════════════════
// PROCESO PRINCIPAL — ELECTRON MAIN
// Speeddansys ERP — Facturación Electrónica DTE El Salvador
// ══════════════════════════════════════════════════════════

import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { applyEnvMode, overrideDatabaseUrl } from './config/env.config'
import { disconnectPrisma, setDatabaseUrl } from './database/prisma.client'
import { setupDatabase } from './utils/db-setup'
import { registerSetupIPC, setSetupNeeded } from './ipc/setup.ipc'

// ── Modo Cloud: el renderer usa HTTP en lugar de IPC ──────
// En este modo no se necesita BD local ni wizard de setup
const IS_CLOUD_BUILD = import.meta.env.VITE_CLOUD_MODE === 'true'
import { registerAppIPC } from './ipc/app.ipc'
import { registerBillingIPC } from './ipc/billing.ipc'
import { registerClientsIPC } from './ipc/clients.ipc'
import { registerProductsIPC } from './ipc/products.ipc'
import { registerSucursalesIPC } from './ipc/sucursales.ipc'
import { registerProveedoresIPC } from './ipc/proveedores.ipc'
import { registerEmpleadosIPC } from './ipc/empleados.ipc'
import { registerComprasIPC } from './ipc/compras.ipc'
import { registerSeguridadIPC } from './ipc/seguridad.ipc'
import { registerReportesIPC } from './ipc/reportes.ipc'
import { registerConfiguracionIPC } from './ipc/configuracion.ipc'
import { registerAnalyticsIPC } from './ipc/analytics.ipc'
import { registerCxcIPC } from './ipc/cxc.ipc'
import { registerCxpIPC } from './ipc/cxp.ipc'
import { registerNotificationsIPC } from './ipc/notifications.ipc'
import { registerDocumentosIPC } from './ipc/documentos.ipc'
import { registerPagosCxcIPC } from './ipc/pagos-cxc.ipc'
import { registerPagosCxpIPC } from './ipc/pagos-cxp.ipc'
import { registerPlanillaIPC } from './ipc/planilla.ipc'
import { registerGastosIPC } from './ipc/gastos.ipc'
import { registerLicenseIPC } from './ipc/license.ipc'
import { registerContabilidadIPC } from './ipc/contabilidad.ipc'

// Aplicar modo de entorno ANTES de que Prisma sea instanciado
// (solo en modo local — en cloud no hay BD local)
if (!IS_CLOUD_BUILD) applyEnvMode()

if (IS_CLOUD_BUILD) {
  console.log('[main] ══ MODO CLOUD ══ — Sin BD local, usando servidor online')
}

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    title: IS_CLOUD_BUILD ? 'Speeddansys ERP Cloud' : 'Speeddansys ERP',
    icon: join(__dirname, '../../resources/icon.ico'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // Abrir links externos en el navegador del sistema
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.speeddansys.erp')

  if (!IS_CLOUD_BUILD) {
    // ── Registrar setup IPC PRIMERO (antes de crear la ventana) ──
    registerSetupIPC()

    // ── Setup de base de datos (solo en producción / app empaquetada) ──
    if (app.isPackaged) {
      console.log('[main] App empaquetada — iniciando setup de BD...')
      console.log('[main] resourcesPath =', process.resourcesPath)
      const setup = await setupDatabase()

      if (!setup.success) {
        console.error('[main] Setup falló:', setup.error)
        // No cerramos la app — el renderer mostrará el wizard de configuración
        setSetupNeeded(true)
      } else {
        console.log('[main] Setup exitoso, DATABASE_URL =', setup.databaseUrl.replace(/:[^@]+@/, ':***@'))
        overrideDatabaseUrl(setup.databaseUrl)
        setDatabaseUrl(setup.databaseUrl)
      }
    } else {
      console.log('[main] Modo desarrollo — DATABASE_URL =', process.env['DATABASE_URL']?.replace(/:[^@]+@/, ':***@'))
    }
  }

  // Registrar todos los IPC handlers
  registerAppIPC()
  registerBillingIPC()
  registerClientsIPC()
  registerProductsIPC()
  registerSucursalesIPC()
  registerProveedoresIPC()
  registerEmpleadosIPC()
  registerComprasIPC()
  registerSeguridadIPC()
  registerReportesIPC()
  registerConfiguracionIPC()
  registerAnalyticsIPC()
  registerCxcIPC()
  registerCxpIPC()
  registerNotificationsIPC()
  registerDocumentosIPC()
  registerPagosCxcIPC()
  registerPagosCxpIPC()
  registerPlanillaIPC()
  registerGastosIPC()
  registerLicenseIPC()
  registerContabilidadIPC()

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', async () => {
  await disconnectPrisma()
  if (process.platform !== 'darwin') app.quit()
})
