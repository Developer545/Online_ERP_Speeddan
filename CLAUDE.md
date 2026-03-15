# Speeddansys ERP — Contexto para Claude

## ¿Qué es este proyecto?
ERP de facturación y contabilidad empresarial con **dos modos**:
- **Desktop**: aplicación Electron instalable (.exe) con licencia por PC
- **Web SaaS**: misma app servida desde Express, acceso por suscripción

## Acceso rápido

### ERP Web (producción)
- URL: `https://speeddansys.vercel.app`
- Credenciales: creadas desde el panel admin según tenant

### Panel Admin de Licencias
- URL: `https://admin-licencias.vercel.app`
- Usuario: `admin` | Contraseña: `admin123`
- Gestiona: licencias Desktop (claves + HWID) y Empresas Web (SaaS)

## Stack técnico
- **Desktop/Web**: Electron + React + TypeScript + Vite
- **UI**: Ant Design tema oscuro — bg `#0d1117`, surface `#161b22`, primary `#1677ff`
- **Backend**: Express + Node.js + Prisma + PostgreSQL
- **Panel Admin**: Express + HTML/CSS/JS vanilla + PostgreSQL (`admin-licencias/`)
- **BD prod**: Neon PostgreSQL | **BD local**: `cliente_db` (postgres/123321, puerto 5432)
- **Deploy**: Vercel (ERP web + panel admin) | BD: Neon PostgreSQL

## Rutas locales
- ERP principal: `C:\ProjectosDev\Speeddansys\`
- Panel admin: `C:\ProjectosDev\Speeddansys\admin-licencias\`

## Comandos frecuentes
```bash
npm run build      # compilar ERP
npm run package    # generar instalador .exe (~124MB)

# Panel admin (desde admin-licencias/):
node server.js     # puerto 4000
```

## Arquitectura clave

### Sistema de licencias (Desktop)
1. Admin genera clave en `https://admin-licencias.vercel.app`
2. Cliente instala .exe → `ActivationScreen.tsx` pide la clave
3. App llama `POST /api/licenses/activate` con `license_key + hardware_id`
4. Servidor enlaza HWID → clave no reutilizable en otra PC

### Sistema de suscripciones (Web SaaS)
1. Admin crea empresa en panel → llama `POST /api/seguridad/provision-internal`
2. ERP crea Emisor + usuario admin del cliente
3. Cliente accede con sus credenciales, ERP valida suscripción

### Empaquetado Electron (IMPORTANTE)
- `"asar": false` OBLIGATORIO — Prisma no funciona dentro de ASAR
- `extraResources` copia `node_modules` completo (electron-builder omite ~339 paquetes)
- `files`: solo `out/**`, schema, migrations, resources, package.json

### Setup Wizard
- Si auto-detect PostgreSQL falla al instalar → muestra `SetupWizard.tsx`
- Pide credenciales PG al cliente → guarda en `userData/pg-credentials.json`
- `App.tsx` verifica `window.setup.getStatus()` ANTES de verificar licencia

## Archivos clave
- `src/main/ipc/license.ipc.ts` — licencias (usa `getHardwareId()` nativo, NO node-machine-id)
- `src/main/ipc/setup.ipc.ts` — handlers del wizard de configuración
- `src/main/utils/db-setup.ts` — auto-detección y setup de PostgreSQL
- `src/renderer/src/lib/webApiMock.ts` — modo web: licencia siempre activa, JWT en localStorage
- `admin-licencias/server.js` — servidor del panel
- `admin-licencias/db.js` — conexión PostgreSQL (pg Pool, async/await, placeholders $1 $2)

## Patrones de diseño UI
- Tablas: antd `Table size="small"` con KPIs `Statistic` arriba
- Cards: `borderRadius: 10`, siempre con `size="small"`
- Tema oscuro consistente — usar `var(--theme-primary)`, NO colores hardcoded

## Otros proyectos del mismo usuario (Daniel)
- **DTE Online ERP**: `C:\ProjectosDev\Facturacion DTE online\` → `https://dte-speeddan.vercel.app`
- **Speeddan Barbería**: `C:\ProjectosDev\Speeddan_Barbería\` → `https://speeddan-barberia.vercel.app`
- Todos usan Neon PostgreSQL como BD de producción
