// ══════════════════════════════════════════════════════════
// VERCEL SERVERLESS ENTRY POINT — Speeddansys ERP Web
// ══════════════════════════════════════════════════════════

let app: any
let initError: Error | null = null

try {
  app = require('../src/server/index').default
} catch (err: any) {
  initError = err
  console.error('[VERCEL] Error loading app:', err.message, err.stack)
}

export default function handler(req: any, res: any) {
  if (initError) {
    return res.status(500).json({
      error: 'App failed to initialize',
      message: initError.message,
      stack: initError.stack?.split('\n').slice(0, 5)
    })
  }
  return app(req, res)
}
