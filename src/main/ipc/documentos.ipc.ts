import { ipcMain } from 'electron'
import fs from 'fs'
import path from 'path'

const JSON_DOC_DIR = path.join(process.cwd(), 'json_doc')

export function registerDocumentosIPC() {
    // Leer un JSON DTE guardado por codigoGeneracion
    ipcMain.handle('documentos:leerJson', (_event, codigoGeneracion: string) => {
        try {
            const filePath = path.join(JSON_DOC_DIR, `${codigoGeneracion}.json`)
            if (!fs.existsSync(filePath)) {
                return { ok: false, error: 'Archivo JSON no encontrado en json_doc/' }
            }
            const raw = fs.readFileSync(filePath, 'utf-8')
            return { ok: true, json: JSON.parse(raw) }
        } catch (err) {
            return { ok: false, error: String(err) }
        }
    })

    // Leer plantilla HTML por tipo de DTE (01, 03, 05, 06)
    ipcMain.handle('documentos:leerPlantilla', (_event, tipoDte: string) => {
        try {
            const plantillaPath = path.join(JSON_DOC_DIR, 'plantilla', `${tipoDte}.html`)
            if (!fs.existsSync(plantillaPath)) {
                return { ok: false, error: `Plantilla ${tipoDte}.html no encontrada` }
            }
            const html = fs.readFileSync(plantillaPath, 'utf-8')
            return { ok: true, html }
        } catch (err) {
            return { ok: false, error: String(err) }
        }
    })

    // Listar todos los JSON DTE guardados
    ipcMain.handle('documentos:listarJson', () => {
        try {
            if (!fs.existsSync(JSON_DOC_DIR)) return []
            return fs.readdirSync(JSON_DOC_DIR)
                .filter(f => f.endsWith('.json') && !f.startsWith('.'))
                .map(f => f.replace('.json', ''))
        } catch {
            return []
        }
    })
}
