// ══════════════════════════════════════════════════════════
// IPC HANDLER — FACTURACIÓN
// ══════════════════════════════════════════════════════════
// Bridge de comunicación entre el proceso renderer (React)
// y el proceso main (Node.js / servicios DTE).
//
// Todos los canales siguen el patrón: billing:accion
// ══════════════════════════════════════════════════════════

import { ipcMain } from 'electron'
import { BillingController } from '@main/controllers/billing.controller'

export function registerBillingIPC(): void {

  // Emitir un DTE (Factura, CCF, etc.)
  ipcMain.handle('billing:emitir', async (_event, input) => {
    return BillingController.emitir(input)
  })

  // Listar facturas con filtros y paginación
  ipcMain.handle('billing:listar', async (_event, filtros) => {
    return BillingController.listar(filtros)
  })

  // Obtener factura por ID (con detalles)
  ipcMain.handle('billing:getById', async (_event, id: number) => {
    return BillingController.getById(id)
  })

  // Reenviar factura en contingencia al MH
  ipcMain.handle('billing:reenviar', async (_event, facturaId: number) => {
    return BillingController.reenviar(facturaId)
  })

  // Invalidar / Anular un DTE
  ipcMain.handle('billing:invalidar', async (_event, input) => {
    return BillingController.invalidar(input)
  })

  // Verificar certificado digital configurado
  ipcMain.handle('billing:verificarCertificado', async (_event, certFileName: string, certPassword: string) => {
    return BillingController.verificarCertificado(certFileName, certPassword)
  })

  // Listar certificados disponibles en la carpeta
  ipcMain.handle('billing:listCertificados', async () => {
    return BillingController.listCertificados()
  })
}
