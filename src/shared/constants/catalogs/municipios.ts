// CAT-013 — Municipios/Distritos de El Salvador
// Fuente: Catálogos del Sistema de Transmisión V 1.2 — Ministerio de Hacienda El Salvador
//
// IMPORTANTE: Los códigos de municipio NO son globalmente únicos.
// Se repiten entre departamentos. El MH valida el par (departamentoCod, municipioCod).
// Usar siempre getMunicipiosByDepartamento(depCod) para obtener las opciones del select.
//
// Ejemplo: código "14" = "Ahuachapán Centro" (dept 01) Y "Santa Ana Norte" (dept 02)

export interface Municipio {
  codigo: string
  nombre: string
  departamento: string // código del departamento (CAT-012)
}

export const MUNICIPIOS: Municipio[] = [
  // ── 00 Extranjeros ────────────────────────────────────────
  { codigo: '00', nombre: 'Otro (Extranjero)',    departamento: '00' },

  // ── 01 Ahuachapán ─────────────────────────────────────────
  { codigo: '13', nombre: 'Ahuachapán Norte',     departamento: '01' },
  { codigo: '14', nombre: 'Ahuachapán Centro',    departamento: '01' },
  { codigo: '15', nombre: 'Ahuachapán Sur',       departamento: '01' },

  // ── 02 Santa Ana ──────────────────────────────────────────
  { codigo: '14', nombre: 'Santa Ana Norte',      departamento: '02' },
  { codigo: '15', nombre: 'Santa Ana Centro',     departamento: '02' },
  { codigo: '16', nombre: 'Santa Ana Este',       departamento: '02' },
  { codigo: '17', nombre: 'Santa Ana Oeste',      departamento: '02' },

  // ── 03 Sonsonate ──────────────────────────────────────────
  { codigo: '17', nombre: 'Sonsonate Norte',      departamento: '03' },
  { codigo: '18', nombre: 'Sonsonate Centro',     departamento: '03' },
  { codigo: '19', nombre: 'Sonsonate Este',       departamento: '03' },
  { codigo: '20', nombre: 'Sonsonate Oeste',      departamento: '03' },

  // ── 04 Chalatenango ───────────────────────────────────────
  { codigo: '34', nombre: 'Chalatenango Norte',   departamento: '04' },
  { codigo: '35', nombre: 'Chalatenango Centro',  departamento: '04' },
  { codigo: '36', nombre: 'Chalatenango Sur',     departamento: '04' },

  // ── 05 La Libertad ────────────────────────────────────────
  { codigo: '23', nombre: 'La Libertad Norte',    departamento: '05' },
  { codigo: '24', nombre: 'La Libertad Centro',   departamento: '05' },
  { codigo: '25', nombre: 'La Libertad Oeste',    departamento: '05' },
  { codigo: '26', nombre: 'La Libertad Este',     departamento: '05' },
  { codigo: '27', nombre: 'La Libertad Costa',    departamento: '05' },
  { codigo: '28', nombre: 'La Libertad Sur',      departamento: '05' },

  // ── 06 San Salvador ───────────────────────────────────────
  { codigo: '20', nombre: 'San Salvador Norte',   departamento: '06' },
  { codigo: '21', nombre: 'San Salvador Oeste',   departamento: '06' },
  { codigo: '22', nombre: 'San Salvador Este',    departamento: '06' },
  { codigo: '23', nombre: 'San Salvador Centro',  departamento: '06' },
  { codigo: '24', nombre: 'San Salvador Sur',     departamento: '06' },

  // ── 07 Cuscatlán ──────────────────────────────────────────
  { codigo: '17', nombre: 'Cuscatlán Norte',      departamento: '07' },
  { codigo: '18', nombre: 'Cuscatlán Sur',        departamento: '07' },

  // ── 08 La Paz ─────────────────────────────────────────────
  { codigo: '23', nombre: 'La Paz Oeste',         departamento: '08' },
  { codigo: '24', nombre: 'La Paz Centro',        departamento: '08' },
  { codigo: '25', nombre: 'La Paz Este',          departamento: '08' },

  // ── 09 Cabañas ────────────────────────────────────────────
  { codigo: '10', nombre: 'Cabañas Oeste',        departamento: '09' },
  { codigo: '11', nombre: 'Cabañas Este',         departamento: '09' },

  // ── 10 San Vicente ────────────────────────────────────────
  { codigo: '14', nombre: 'San Vicente Norte',    departamento: '10' },
  { codigo: '15', nombre: 'San Vicente Sur',      departamento: '10' },

  // ── 11 Usulután ───────────────────────────────────────────
  { codigo: '24', nombre: 'Usulután Norte',       departamento: '11' },
  { codigo: '25', nombre: 'Usulután Este',        departamento: '11' },
  { codigo: '26', nombre: 'Usulután Oeste',       departamento: '11' },

  // ── 12 San Miguel ─────────────────────────────────────────
  { codigo: '21', nombre: 'San Miguel Norte',     departamento: '12' },
  { codigo: '22', nombre: 'San Miguel Centro',    departamento: '12' },
  { codigo: '23', nombre: 'San Miguel Oeste',     departamento: '12' },

  // ── 13 Morazán ────────────────────────────────────────────
  { codigo: '27', nombre: 'Morazán Norte',        departamento: '13' },
  { codigo: '28', nombre: 'Morazán Sur',          departamento: '13' },

  // ── 14 La Unión ───────────────────────────────────────────
  { codigo: '19', nombre: 'La Unión Norte',       departamento: '14' },
  { codigo: '20', nombre: 'La Unión Sur',         departamento: '14' },
]

/** Obtiene los municipios/distritos de un departamento dado su código */
export const getMunicipiosByDepartamento = (depCodigo: string): Municipio[] =>
  MUNICIPIOS.filter(m => m.departamento === depCodigo)

/**
 * Obtiene un municipio por código Y departamento (ambos requeridos,
 * ya que el código no es globalmente único en el CAT-013 V1.2).
 */
export const getMunicipio = (codigo: string, departamento: string): Municipio | undefined =>
  MUNICIPIOS.find(m => m.codigo === codigo && m.departamento === departamento)

/** Devuelve el nombre del municipio dado su código y departamento */
export const getMunicipioNombre = (codigo: string, departamento: string): string =>
  getMunicipio(codigo, departamento)?.nombre ?? codigo
