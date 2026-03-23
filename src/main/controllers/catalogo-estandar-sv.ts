// Catálogo de Cuentas Estándar — El Salvador
// Basado en NIIF para PYMES y práctica contable salvadoreña
// Código de Comercio Arts. 435-455

export interface CuentaEstandar {
  codigo: string
  nombre: string
  tipo: 'ACTIVO' | 'PASIVO' | 'PATRIMONIO' | 'INGRESO' | 'COSTO' | 'GASTO' | 'CIERRE' | 'ORDEN_DEUDORA' | 'ORDEN_ACREEDORA'
  naturaleza: 'DEUDORA' | 'ACREEDORA'
  nivel: number
  codigoPadre: string | null
  aceptaMovimiento: boolean
}

export const CATALOGO_ESTANDAR_SV: CuentaEstandar[] = [
  // ═══════════════════════════════════════
  // 1 — ACTIVO
  // ═══════════════════════════════════════
  { codigo: '1', nombre: 'Activo', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 1, codigoPadre: null, aceptaMovimiento: false },

  // 11 — Activo Corriente
  { codigo: '11', nombre: 'Activo Corriente', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 2, codigoPadre: '1', aceptaMovimiento: false },
  { codigo: '1101', nombre: 'Efectivo y Equivalentes de Efectivo', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '11', aceptaMovimiento: false },
  { codigo: '110101', nombre: 'Caja General', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 4, codigoPadre: '1101', aceptaMovimiento: true },
  { codigo: '110102', nombre: 'Caja Chica', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 4, codigoPadre: '1101', aceptaMovimiento: true },
  { codigo: '110103', nombre: 'Bancos - Cuenta Corriente', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 4, codigoPadre: '1101', aceptaMovimiento: true },
  { codigo: '110104', nombre: 'Bancos - Cuenta de Ahorro', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 4, codigoPadre: '1101', aceptaMovimiento: true },

  { codigo: '1102', nombre: 'Inversiones Temporales', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '11', aceptaMovimiento: true },

  { codigo: '1103', nombre: 'Cuentas por Cobrar Comerciales', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '11', aceptaMovimiento: false },
  { codigo: '110301', nombre: 'Clientes Locales', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 4, codigoPadre: '1103', aceptaMovimiento: true },
  { codigo: '110302', nombre: 'Clientes del Exterior', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 4, codigoPadre: '1103', aceptaMovimiento: true },
  { codigo: '110303', nombre: 'Estimación para Cuentas Incobrables (CR)', tipo: 'ACTIVO', naturaleza: 'ACREEDORA', nivel: 4, codigoPadre: '1103', aceptaMovimiento: true },

  { codigo: '1104', nombre: 'Cuentas por Cobrar - Otros', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '11', aceptaMovimiento: false },
  { codigo: '110401', nombre: 'Préstamos a Empleados', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 4, codigoPadre: '1104', aceptaMovimiento: true },
  { codigo: '110402', nombre: 'Anticipos a Proveedores', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 4, codigoPadre: '1104', aceptaMovimiento: true },
  { codigo: '110403', nombre: 'Deudores Varios', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 4, codigoPadre: '1104', aceptaMovimiento: true },

  { codigo: '1105', nombre: 'Inventarios', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '11', aceptaMovimiento: false },
  { codigo: '110501', nombre: 'Inventario de Mercadería', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 4, codigoPadre: '1105', aceptaMovimiento: true },
  { codigo: '110502', nombre: 'Inventario de Materia Prima', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 4, codigoPadre: '1105', aceptaMovimiento: true },
  { codigo: '110503', nombre: 'Inventario de Productos en Proceso', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 4, codigoPadre: '1105', aceptaMovimiento: true },
  { codigo: '110504', nombre: 'Inventario de Productos Terminados', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 4, codigoPadre: '1105', aceptaMovimiento: true },

  { codigo: '1106', nombre: 'Gastos Pagados por Anticipado', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '11', aceptaMovimiento: false },
  { codigo: '110601', nombre: 'Seguros Pagados por Anticipado', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 4, codigoPadre: '1106', aceptaMovimiento: true },
  { codigo: '110602', nombre: 'Alquileres Pagados por Anticipado', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 4, codigoPadre: '1106', aceptaMovimiento: true },

  { codigo: '1107', nombre: 'IVA - Crédito Fiscal', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '11', aceptaMovimiento: true },
  { codigo: '1108', nombre: 'Pago a Cuenta ISR', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '11', aceptaMovimiento: true },
  { codigo: '1109', nombre: 'Retenciones de IVA (a favor)', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '11', aceptaMovimiento: true },

  // 12 — Activo No Corriente
  { codigo: '12', nombre: 'Activo No Corriente', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 2, codigoPadre: '1', aceptaMovimiento: false },
  { codigo: '1201', nombre: 'Propiedad, Planta y Equipo', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '12', aceptaMovimiento: false },
  { codigo: '120101', nombre: 'Terrenos', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 4, codigoPadre: '1201', aceptaMovimiento: true },
  { codigo: '120102', nombre: 'Edificios', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 4, codigoPadre: '1201', aceptaMovimiento: true },
  { codigo: '120103', nombre: 'Mobiliario y Equipo de Oficina', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 4, codigoPadre: '1201', aceptaMovimiento: true },
  { codigo: '120104', nombre: 'Equipo de Transporte', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 4, codigoPadre: '1201', aceptaMovimiento: true },
  { codigo: '120105', nombre: 'Maquinaria y Equipo Industrial', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 4, codigoPadre: '1201', aceptaMovimiento: true },
  { codigo: '120106', nombre: 'Equipo de Computación', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 4, codigoPadre: '1201', aceptaMovimiento: true },
  { codigo: '120107', nombre: 'Herramientas', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 4, codigoPadre: '1201', aceptaMovimiento: true },

  { codigo: '1202', nombre: 'Depreciación Acumulada', tipo: 'ACTIVO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '12', aceptaMovimiento: false },
  { codigo: '120201', nombre: 'Depreciación Acum. Edificios', tipo: 'ACTIVO', naturaleza: 'ACREEDORA', nivel: 4, codigoPadre: '1202', aceptaMovimiento: true },
  { codigo: '120202', nombre: 'Depreciación Acum. Mobiliario', tipo: 'ACTIVO', naturaleza: 'ACREEDORA', nivel: 4, codigoPadre: '1202', aceptaMovimiento: true },
  { codigo: '120203', nombre: 'Depreciación Acum. Vehículos', tipo: 'ACTIVO', naturaleza: 'ACREEDORA', nivel: 4, codigoPadre: '1202', aceptaMovimiento: true },
  { codigo: '120204', nombre: 'Depreciación Acum. Maquinaria', tipo: 'ACTIVO', naturaleza: 'ACREEDORA', nivel: 4, codigoPadre: '1202', aceptaMovimiento: true },
  { codigo: '120205', nombre: 'Depreciación Acum. Eq. Cómputo', tipo: 'ACTIVO', naturaleza: 'ACREEDORA', nivel: 4, codigoPadre: '1202', aceptaMovimiento: true },

  { codigo: '1203', nombre: 'Activos Intangibles', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '12', aceptaMovimiento: false },
  { codigo: '120301', nombre: 'Software y Licencias', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 4, codigoPadre: '1203', aceptaMovimiento: true },
  { codigo: '120302', nombre: 'Amortización Acumulada (CR)', tipo: 'ACTIVO', naturaleza: 'ACREEDORA', nivel: 4, codigoPadre: '1203', aceptaMovimiento: true },

  { codigo: '1204', nombre: 'Inversiones Permanentes', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '12', aceptaMovimiento: true },

  // ═══════════════════════════════════════
  // 2 — PASIVO
  // ═══════════════════════════════════════
  { codigo: '2', nombre: 'Pasivo', tipo: 'PASIVO', naturaleza: 'ACREEDORA', nivel: 1, codigoPadre: null, aceptaMovimiento: false },

  // 21 — Pasivo Corriente
  { codigo: '21', nombre: 'Pasivo Corriente', tipo: 'PASIVO', naturaleza: 'ACREEDORA', nivel: 2, codigoPadre: '2', aceptaMovimiento: false },
  { codigo: '2101', nombre: 'Cuentas por Pagar Comerciales', tipo: 'PASIVO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '21', aceptaMovimiento: false },
  { codigo: '210101', nombre: 'Proveedores Locales', tipo: 'PASIVO', naturaleza: 'ACREEDORA', nivel: 4, codigoPadre: '2101', aceptaMovimiento: true },
  { codigo: '210102', nombre: 'Proveedores del Exterior', tipo: 'PASIVO', naturaleza: 'ACREEDORA', nivel: 4, codigoPadre: '2101', aceptaMovimiento: true },

  { codigo: '2102', nombre: 'Préstamos Bancarios a Corto Plazo', tipo: 'PASIVO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '21', aceptaMovimiento: true },
  { codigo: '2103', nombre: 'Documentos por Pagar CP', tipo: 'PASIVO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '21', aceptaMovimiento: true },
  { codigo: '2104', nombre: 'IVA - Débito Fiscal', tipo: 'PASIVO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '21', aceptaMovimiento: true },

  { codigo: '2105', nombre: 'Retenciones por Pagar', tipo: 'PASIVO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '21', aceptaMovimiento: false },
  { codigo: '210501', nombre: 'Retenciones de ISR', tipo: 'PASIVO', naturaleza: 'ACREEDORA', nivel: 4, codigoPadre: '2105', aceptaMovimiento: true },
  { codigo: '210502', nombre: 'Retenciones de IVA', tipo: 'PASIVO', naturaleza: 'ACREEDORA', nivel: 4, codigoPadre: '2105', aceptaMovimiento: true },
  { codigo: '210503', nombre: 'Retenciones ISSS', tipo: 'PASIVO', naturaleza: 'ACREEDORA', nivel: 4, codigoPadre: '2105', aceptaMovimiento: true },
  { codigo: '210504', nombre: 'Retenciones AFP', tipo: 'PASIVO', naturaleza: 'ACREEDORA', nivel: 4, codigoPadre: '2105', aceptaMovimiento: true },

  { codigo: '2106', nombre: 'Impuesto sobre la Renta por Pagar', tipo: 'PASIVO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '21', aceptaMovimiento: true },

  { codigo: '2107', nombre: 'Provisiones Corrientes', tipo: 'PASIVO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '21', aceptaMovimiento: false },
  { codigo: '210701', nombre: 'Aguinaldos por Pagar', tipo: 'PASIVO', naturaleza: 'ACREEDORA', nivel: 4, codigoPadre: '2107', aceptaMovimiento: true },
  { codigo: '210702', nombre: 'Vacaciones por Pagar', tipo: 'PASIVO', naturaleza: 'ACREEDORA', nivel: 4, codigoPadre: '2107', aceptaMovimiento: true },
  { codigo: '210703', nombre: 'Indemnizaciones por Pagar', tipo: 'PASIVO', naturaleza: 'ACREEDORA', nivel: 4, codigoPadre: '2107', aceptaMovimiento: true },

  { codigo: '2108', nombre: 'Cuota Patronal ISSS por Pagar', tipo: 'PASIVO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '21', aceptaMovimiento: true },
  { codigo: '2109', nombre: 'Cuota Patronal AFP por Pagar', tipo: 'PASIVO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '21', aceptaMovimiento: true },
  { codigo: '2110', nombre: 'INSAFORP por Pagar', tipo: 'PASIVO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '21', aceptaMovimiento: true },

  // 22 — Pasivo No Corriente
  { codigo: '22', nombre: 'Pasivo No Corriente', tipo: 'PASIVO', naturaleza: 'ACREEDORA', nivel: 2, codigoPadre: '2', aceptaMovimiento: false },
  { codigo: '2201', nombre: 'Préstamos Bancarios a Largo Plazo', tipo: 'PASIVO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '22', aceptaMovimiento: true },
  { codigo: '2202', nombre: 'Documentos por Pagar LP', tipo: 'PASIVO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '22', aceptaMovimiento: true },
  { codigo: '2203', nombre: 'Provisiones No Corrientes', tipo: 'PASIVO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '22', aceptaMovimiento: true },

  // ═══════════════════════════════════════
  // 3 — PATRIMONIO
  // ═══════════════════════════════════════
  { codigo: '3', nombre: 'Patrimonio', tipo: 'PATRIMONIO', naturaleza: 'ACREEDORA', nivel: 1, codigoPadre: null, aceptaMovimiento: false },
  { codigo: '31', nombre: 'Capital Social', tipo: 'PATRIMONIO', naturaleza: 'ACREEDORA', nivel: 2, codigoPadre: '3', aceptaMovimiento: false },
  { codigo: '3101', nombre: 'Capital Social Mínimo', tipo: 'PATRIMONIO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '31', aceptaMovimiento: true },
  { codigo: '3102', nombre: 'Capital Social Variable', tipo: 'PATRIMONIO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '31', aceptaMovimiento: true },

  { codigo: '32', nombre: 'Reservas', tipo: 'PATRIMONIO', naturaleza: 'ACREEDORA', nivel: 2, codigoPadre: '3', aceptaMovimiento: false },
  { codigo: '3201', nombre: 'Reserva Legal', tipo: 'PATRIMONIO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '32', aceptaMovimiento: true },
  { codigo: '3202', nombre: 'Otras Reservas', tipo: 'PATRIMONIO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '32', aceptaMovimiento: true },

  { codigo: '33', nombre: 'Resultados Acumulados', tipo: 'PATRIMONIO', naturaleza: 'ACREEDORA', nivel: 2, codigoPadre: '3', aceptaMovimiento: false },
  { codigo: '3301', nombre: 'Utilidades Retenidas', tipo: 'PATRIMONIO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '33', aceptaMovimiento: true },
  { codigo: '3302', nombre: 'Pérdidas Acumuladas', tipo: 'PATRIMONIO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '33', aceptaMovimiento: true },

  { codigo: '34', nombre: 'Resultado del Ejercicio', tipo: 'PATRIMONIO', naturaleza: 'ACREEDORA', nivel: 2, codigoPadre: '3', aceptaMovimiento: false },
  { codigo: '3401', nombre: 'Utilidad del Ejercicio', tipo: 'PATRIMONIO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '34', aceptaMovimiento: true },
  { codigo: '3402', nombre: 'Pérdida del Ejercicio', tipo: 'PATRIMONIO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '34', aceptaMovimiento: true },

  { codigo: '35', nombre: 'Superávit por Revaluación', tipo: 'PATRIMONIO', naturaleza: 'ACREEDORA', nivel: 2, codigoPadre: '3', aceptaMovimiento: true },

  // ═══════════════════════════════════════
  // 4 — INGRESOS (Cuentas de Resultado Acreedoras)
  // ═══════════════════════════════════════
  { codigo: '4', nombre: 'Ingresos', tipo: 'INGRESO', naturaleza: 'ACREEDORA', nivel: 1, codigoPadre: null, aceptaMovimiento: false },

  { codigo: '41', nombre: 'Ingresos de Operación', tipo: 'INGRESO', naturaleza: 'ACREEDORA', nivel: 2, codigoPadre: '4', aceptaMovimiento: false },
  { codigo: '4101', nombre: 'Ventas', tipo: 'INGRESO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '41', aceptaMovimiento: true },
  { codigo: '4102', nombre: 'Devoluciones sobre Ventas (DR)', tipo: 'INGRESO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '41', aceptaMovimiento: true },
  { codigo: '4103', nombre: 'Rebajas y Descuentos sobre Ventas (DR)', tipo: 'INGRESO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '41', aceptaMovimiento: true },

  { codigo: '42', nombre: 'Otros Ingresos', tipo: 'INGRESO', naturaleza: 'ACREEDORA', nivel: 2, codigoPadre: '4', aceptaMovimiento: false },
  { codigo: '4201', nombre: 'Ingresos Financieros', tipo: 'INGRESO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '42', aceptaMovimiento: true },
  { codigo: '4202', nombre: 'Ganancia en Venta de Activos', tipo: 'INGRESO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '42', aceptaMovimiento: true },
  { codigo: '4203', nombre: 'Otros Ingresos No Operacionales', tipo: 'INGRESO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '42', aceptaMovimiento: true },

  // ═══════════════════════════════════════
  // 5 — COSTOS
  // ═══════════════════════════════════════
  { codigo: '5', nombre: 'Costos', tipo: 'COSTO', naturaleza: 'DEUDORA', nivel: 1, codigoPadre: null, aceptaMovimiento: false },

  { codigo: '51', nombre: 'Costo de Ventas', tipo: 'COSTO', naturaleza: 'DEUDORA', nivel: 2, codigoPadre: '5', aceptaMovimiento: false },
  { codigo: '5101', nombre: 'Costo de la Mercadería Vendida', tipo: 'COSTO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '51', aceptaMovimiento: true },

  { codigo: '52', nombre: 'Costos de Producción', tipo: 'COSTO', naturaleza: 'DEUDORA', nivel: 2, codigoPadre: '5', aceptaMovimiento: false },
  { codigo: '5201', nombre: 'Materia Prima Utilizada', tipo: 'COSTO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '52', aceptaMovimiento: true },
  { codigo: '5202', nombre: 'Mano de Obra Directa', tipo: 'COSTO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '52', aceptaMovimiento: true },
  { codigo: '5203', nombre: 'Costos Indirectos de Fabricación', tipo: 'COSTO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '52', aceptaMovimiento: true },

  // ═══════════════════════════════════════
  // 6 — GASTOS DE OPERACIÓN
  // ═══════════════════════════════════════
  { codigo: '6', nombre: 'Gastos de Operación', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 1, codigoPadre: null, aceptaMovimiento: false },

  { codigo: '61', nombre: 'Gastos de Administración', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 2, codigoPadre: '6', aceptaMovimiento: false },
  { codigo: '6101', nombre: 'Sueldos y Salarios - Administración', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '61', aceptaMovimiento: true },
  { codigo: '6102', nombre: 'Cuota Patronal ISSS - Admin', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '61', aceptaMovimiento: true },
  { codigo: '6103', nombre: 'Cuota Patronal AFP - Admin', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '61', aceptaMovimiento: true },
  { codigo: '6104', nombre: 'Aguinaldos - Admin', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '61', aceptaMovimiento: true },
  { codigo: '6105', nombre: 'Vacaciones - Admin', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '61', aceptaMovimiento: true },
  { codigo: '6106', nombre: 'Indemnizaciones - Admin', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '61', aceptaMovimiento: true },
  { codigo: '6107', nombre: 'Depreciación - Admin', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '61', aceptaMovimiento: true },
  { codigo: '6108', nombre: 'Alquileres - Admin', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '61', aceptaMovimiento: true },
  { codigo: '6109', nombre: 'Servicios Básicos - Admin', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '61', aceptaMovimiento: true },
  { codigo: '6110', nombre: 'Papelería y Útiles - Admin', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '61', aceptaMovimiento: true },
  { codigo: '6111', nombre: 'Honorarios Profesionales', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '61', aceptaMovimiento: true },
  { codigo: '6112', nombre: 'INSAFORP - Admin', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '61', aceptaMovimiento: true },

  { codigo: '62', nombre: 'Gastos de Venta', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 2, codigoPadre: '6', aceptaMovimiento: false },
  { codigo: '6201', nombre: 'Sueldos y Salarios - Ventas', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '62', aceptaMovimiento: true },
  { codigo: '6202', nombre: 'Comisiones sobre Ventas', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '62', aceptaMovimiento: true },
  { codigo: '6203', nombre: 'Publicidad y Propaganda', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '62', aceptaMovimiento: true },
  { codigo: '6204', nombre: 'Fletes y Acarreos', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '62', aceptaMovimiento: true },
  { codigo: '6205', nombre: 'Cuota Patronal ISSS - Ventas', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '62', aceptaMovimiento: true },
  { codigo: '6206', nombre: 'Cuota Patronal AFP - Ventas', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '62', aceptaMovimiento: true },

  { codigo: '63', nombre: 'Gastos Financieros', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 2, codigoPadre: '6', aceptaMovimiento: false },
  { codigo: '6301', nombre: 'Intereses Bancarios', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '63', aceptaMovimiento: true },
  { codigo: '6302', nombre: 'Comisiones Bancarias', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '63', aceptaMovimiento: true },

  { codigo: '64', nombre: 'Otros Gastos', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 2, codigoPadre: '6', aceptaMovimiento: false },
  { codigo: '6401', nombre: 'Pérdida en Venta de Activos', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '64', aceptaMovimiento: true },
  { codigo: '6402', nombre: 'Gastos No Deducibles', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '64', aceptaMovimiento: true },

  // ═══════════════════════════════════════
  // 7 — CUENTAS DE CIERRE
  // ═══════════════════════════════════════
  { codigo: '7', nombre: 'Cuentas de Cierre', tipo: 'CIERRE', naturaleza: 'DEUDORA', nivel: 1, codigoPadre: null, aceptaMovimiento: false },
  { codigo: '71', nombre: 'Pérdidas y Ganancias', tipo: 'CIERRE', naturaleza: 'DEUDORA', nivel: 2, codigoPadre: '7', aceptaMovimiento: true },

  // ═══════════════════════════════════════
  // 8 — CUENTAS DE ORDEN DEUDORAS
  // ═══════════════════════════════════════
  { codigo: '8', nombre: 'Cuentas de Orden Deudoras', tipo: 'ORDEN_DEUDORA', naturaleza: 'DEUDORA', nivel: 1, codigoPadre: null, aceptaMovimiento: false },
  { codigo: '81', nombre: 'Contingencias', tipo: 'ORDEN_DEUDORA', naturaleza: 'DEUDORA', nivel: 2, codigoPadre: '8', aceptaMovimiento: true },

  // ═══════════════════════════════════════
  // 9 — CUENTAS DE ORDEN ACREEDORAS
  // ═══════════════════════════════════════
  { codigo: '9', nombre: 'Cuentas de Orden Acreedoras', tipo: 'ORDEN_ACREEDORA', naturaleza: 'ACREEDORA', nivel: 1, codigoPadre: null, aceptaMovimiento: false },
  { codigo: '91', nombre: 'Contingencias por Contra', tipo: 'ORDEN_ACREEDORA', naturaleza: 'ACREEDORA', nivel: 2, codigoPadre: '9', aceptaMovimiento: true }
]
