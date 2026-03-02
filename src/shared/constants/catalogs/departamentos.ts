// CAT-012 — Departamentos de El Salvador
// Fuente: Ministerio de Hacienda El Salvador

export interface Departamento {
  codigo: string
  nombre: string
}

export const DEPARTAMENTOS: Departamento[] = [
  { codigo: '00', nombre: 'Otro (Extranjero)' },
  { codigo: '01', nombre: 'Ahuachapán' },
  { codigo: '02', nombre: 'Santa Ana' },
  { codigo: '03', nombre: 'Sonsonate' },
  { codigo: '04', nombre: 'Chalatenango' },
  { codigo: '05', nombre: 'La Libertad' },
  { codigo: '06', nombre: 'San Salvador' },
  { codigo: '07', nombre: 'Cuscatlán' },
  { codigo: '08', nombre: 'La Paz' },
  { codigo: '09', nombre: 'Cabañas' },
  { codigo: '10', nombre: 'San Vicente' },
  { codigo: '11', nombre: 'Usulután' },
  { codigo: '12', nombre: 'San Miguel' },
  { codigo: '13', nombre: 'Morazán' },
  { codigo: '14', nombre: 'La Unión' }
]

export const getDepartamento = (codigo: string): Departamento | undefined =>
  DEPARTAMENTOS.find(d => d.codigo === codigo)
