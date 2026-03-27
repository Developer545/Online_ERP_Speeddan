# Speeddansys ERP — Contexto para Claude

> **DIRECTIVAS DE SESIÓN**: NO explorar el proyecto al inicio. Este archivo + memoria persistente contienen todo el contexto necesario. Ir directo a la tarea del usuario. Usar agentes para búsquedas paralelas. Usar skills cuando apliquen (xlsx, pdf, commit, etc.). Leer solo los archivos que la tarea requiera.

## Proyecto
ERP de facturación y contabilidad para El Salvador. Dos modos: **Desktop** (Electron .exe con licencia por PC) y **Web SaaS** (Express + JWT + suscripción).

## URLs
| Servicio | URL |
|----------|-----|
| ERP Web | `speeddansys.vercel.app` |
| Admin Licencias | `admin-licencias.vercel.app` (admin/admin123) |

## Stack
| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Ant Design 5 + Zustand + React Router 6 |
| Backend | Express 5 + Prisma 5 + PostgreSQL (Neon prod) |
| Desktop | Electron 33 + electron-vite + Vite 5 |
| Lenguaje | TypeScript 5.9 |
| UI Tema | Dark: bg `#0d1117`, surface `#161b22`, primary `#1677ff` |
| Deploy | Vercel (SPA + serverless) + Neon PostgreSQL |

## Estructura src/
```
src/main/         → Electron main: controllers/ services/ ipc/ repositories/ database/
src/server/       → Express API: routes/ middleware/ context/
src/renderer/src/ → React SPA: pages/ components/ hooks/ store/ context/ lib/
src/shared/       → Tipos compartidos
src/preload/      → Electron preload
prisma/           → schema.prisma (736 líneas) + migrations/
admin-licencias/  → Panel licencias (Express + vanilla JS)
landing_page/     → Landing page estática
```

## Arquitectura clave

### Dual-mode
- **Desktop**: Electron → IPC → Controllers → Prisma (sin HTTP)
- **Web**: React SPA → Express API → JWT → Controllers → Prisma
- Detección: `VITE_CLOUD_MODE` + `src/renderer/src/lib/webApiMock.ts`

### Multi-tenancy
- `src/server/context/tenant.context.ts` → AsyncLocalStorage
- `src/main/database/prisma.client.ts` → Prisma middleware filtra por `empresa_id`
- Controllers NUNCA filtran por tenant — es automático

### Licencias (Desktop)
Admin genera clave → Cliente activa en `ActivationScreen.tsx` → `POST /api/licenses/activate` con HWID → enlace único PC

### Suscripciones (Web SaaS)
Admin crea empresa → `POST /api/seguridad/provision-internal` → Crea Emisor + usuario → Cliente accede con JWT

### Empaquetado Electron
- `"asar": false` OBLIGATORIO (Prisma)
- `extraResources` copia `node_modules` completo
- `files`: solo `out/**`, schema, migrations, resources, package.json

### Setup Wizard
- `SetupWizard.tsx` si auto-detect PostgreSQL falla
- Guarda en `userData/pg-credentials.json`
- `App.tsx` verifica setup ANTES de licencia

## Comandos
```bash
npm run build          # compilar ERP
npm run package        # generar .exe (~124MB)
npm run dev            # dev electron
npm run dev:web        # dev web mode
# admin-licencias/:
node server.js         # puerto 4000
```

## Archivos clave
| Archivo | Propósito |
|---------|-----------|
| `src/main/ipc/license.ipc.ts` | Licencias (getHardwareId nativo) |
| `src/main/ipc/setup.ipc.ts` | Wizard de configuración |
| `src/main/utils/db-setup.ts` | Auto-detección PostgreSQL |
| `src/renderer/src/lib/webApiMock.ts` | Puente IPC↔HTTP |
| `src/server/index.ts` | Entry Express + rutas públicas |
| `src/server/context/tenant.context.ts` | Multi-tenant AsyncLocalStorage |
| `admin-licencias/server.js` | Panel admin backend |
| `prisma/schema.prisma` | Esquema BD completo |

## Módulos
Facturación DTE (firma RS512 + QR + PDF), Clientes, Proveedores, Productos, Inventario/Kardex, Compras, Gastos, CxC, CxP, Contabilidad (asientos, catálogo, libros, estados financieros), Planilla (quincenal + aguinaldo), Seguridad (roles + permisos), Dashboard, Reportes

## Patrones UI
- Tablas: `Table size="small"` + KPIs `Statistic` arriba
- Cards: `borderRadius: 10`, `size="small"`
- Tema oscuro — usar `var(--theme-primary)`, NO colores hardcoded

## Nuevo módulo (checklist)
1. Controller: `src/main/controllers/[mod].controller.ts`
2. Ruta Express: `src/server/routes/[mod].ts`
3. IPC handler: `src/main/ipc/[mod].ipc.ts`
4. Registrar ruta: `src/server/index.ts`
5. Registrar IPC: `src/main/index.ts`
6. Página React: `src/renderer/src/pages/[Mod]/`
7. Ruta App: `src/renderer/src/App.tsx`

## Skills de agente disponibles (.agents/skills/)
arquitectura, backend-frontend, seguridad, ui-ux, testing, cache-redis, logging, code-integrity
