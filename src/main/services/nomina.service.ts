// ══════════════════════════════════════════════════════════
// SERVICIO DE CÁLCULO DE NÓMINA — EL SALVADOR
// ══════════════════════════════════════════════════════════
// Funciones puras para calcular deducciones laborales,
// aportes patronales, aguinaldo, vacaciones y Quincena 25,
// según la legislación salvadoreña vigente (2025-2026).
// ══════════════════════════════════════════════════════════

import { prisma } from '@main/database/prisma.client'

const db = prisma

// ── Tipos ─────────────────────────────────────────────────

export interface ConfigPlanillaMap {
    ISSS_EMPLEADO: number
    ISSS_PATRONAL: number
    ISSS_TOPE_SALARIO: number
    AFP_EMPLEADO: number
    AFP_PATRONAL: number
    INSAFORP: number
    ISR_TRAMO1_LIMITE: number
    ISR_TRAMO2_LIMITE: number
    ISR_TRAMO2_CUOTA: number
    ISR_TRAMO2_PORCENTAJE: number
    ISR_TRAMO2_SOBRE_EXCESO: number
    ISR_TRAMO3_LIMITE: number
    ISR_TRAMO3_CUOTA: number
    ISR_TRAMO3_PORCENTAJE: number
    ISR_TRAMO3_SOBRE_EXCESO: number
    ISR_TRAMO4_CUOTA: number
    ISR_TRAMO4_PORCENTAJE: number
    ISR_TRAMO4_SOBRE_EXCESO: number
}

export interface DeduccionesEmpleado {
    isss: number
    afp: number
    renta: number
    totalDeducciones: number
    salarioNeto: number
}

export interface AportesPatronales {
    isssPatronal: number
    afpPatronal: number
    insaforp: number
    totalPatronal: number
}

export interface DetalleNominaCalc {
    empleadoId: number
    nombre: string
    cargo: string
    salarioBruto: number
    isss: number
    afp: number
    renta: number
    otrasDeducciones: number
    totalDeducciones: number
    salarioNeto: number
    isssPatronal: number
    afpPatronal: number
    insaforp: number
}

// ── Servicio ──────────────────────────────────────────────

export class NominaService {

    /**
     * Lee la configuración de planilla de la BD y la devuelve como un mapa tipado.
     */
    static async getConfig(): Promise<ConfigPlanillaMap> {
        const rows = await db.configPlanilla.findMany()
        const map: Record<string, number> = {}
        for (const r of rows) {
            map[r.clave] = Number(r.valor)
        }

        return {
            ISSS_EMPLEADO: map['ISSS_EMPLEADO'] ?? 3,
            ISSS_PATRONAL: map['ISSS_PATRONAL'] ?? 7.5,
            ISSS_TOPE_SALARIO: map['ISSS_TOPE_SALARIO'] ?? 1000,
            AFP_EMPLEADO: map['AFP_EMPLEADO'] ?? 7.25,
            AFP_PATRONAL: map['AFP_PATRONAL'] ?? 8.75,
            INSAFORP: map['INSAFORP'] ?? 1,
            ISR_TRAMO1_LIMITE: map['ISR_TRAMO1_LIMITE'] ?? 550,
            ISR_TRAMO2_LIMITE: map['ISR_TRAMO2_LIMITE'] ?? 895.24,
            ISR_TRAMO2_CUOTA: map['ISR_TRAMO2_CUOTA'] ?? 17.67,
            ISR_TRAMO2_PORCENTAJE: map['ISR_TRAMO2_PORCENTAJE'] ?? 10,
            ISR_TRAMO2_SOBRE_EXCESO: map['ISR_TRAMO2_SOBRE_EXCESO'] ?? 550,
            ISR_TRAMO3_LIMITE: map['ISR_TRAMO3_LIMITE'] ?? 2038.10,
            ISR_TRAMO3_CUOTA: map['ISR_TRAMO3_CUOTA'] ?? 60,
            ISR_TRAMO3_PORCENTAJE: map['ISR_TRAMO3_PORCENTAJE'] ?? 20,
            ISR_TRAMO3_SOBRE_EXCESO: map['ISR_TRAMO3_SOBRE_EXCESO'] ?? 895.24,
            ISR_TRAMO4_CUOTA: map['ISR_TRAMO4_CUOTA'] ?? 288.57,
            ISR_TRAMO4_PORCENTAJE: map['ISR_TRAMO4_PORCENTAJE'] ?? 30,
            ISR_TRAMO4_SOBRE_EXCESO: map['ISR_TRAMO4_SOBRE_EXCESO'] ?? 2038.10
        }
    }

    /**
     * Calcula ISR (Impuesto sobre la Renta) mensual para personas naturales.
     * Base imponible = Salario Bruto − ISSS − AFP.
     */
    static calcularISR(baseImponible: number, c: ConfigPlanillaMap): number {
        if (baseImponible <= c.ISR_TRAMO1_LIMITE) return 0
        if (baseImponible <= c.ISR_TRAMO2_LIMITE) {
            return round2(c.ISR_TRAMO2_CUOTA + (baseImponible - c.ISR_TRAMO2_SOBRE_EXCESO) * (c.ISR_TRAMO2_PORCENTAJE / 100))
        }
        if (baseImponible <= c.ISR_TRAMO3_LIMITE) {
            return round2(c.ISR_TRAMO3_CUOTA + (baseImponible - c.ISR_TRAMO3_SOBRE_EXCESO) * (c.ISR_TRAMO3_PORCENTAJE / 100))
        }
        return round2(c.ISR_TRAMO4_CUOTA + (baseImponible - c.ISR_TRAMO4_SOBRE_EXCESO) * (c.ISR_TRAMO4_PORCENTAJE / 100))
    }

    /**
     * Calcula deducciones laborales (empleado): ISSS, AFP, Renta
     */
    static calcularDeduccionesEmpleado(salarioBruto: number, c: ConfigPlanillaMap): DeduccionesEmpleado {
        // ISSS: porcentaje con tope
        const salarioBaseISS = Math.min(salarioBruto, c.ISSS_TOPE_SALARIO)
        const isss = round2(salarioBaseISS * (c.ISSS_EMPLEADO / 100))

        // AFP: sin tope
        const afp = round2(salarioBruto * (c.AFP_EMPLEADO / 100))

        // Renta: sobre base imponible (salario - ISSS - AFP)
        const baseImponible = salarioBruto - isss - afp
        const renta = this.calcularISR(baseImponible, c)

        const totalDeducciones = round2(isss + afp + renta)
        const salarioNeto = round2(salarioBruto - totalDeducciones)

        return { isss, afp, renta, totalDeducciones, salarioNeto }
    }

    /**
     * Calcula aportes patronales: ISSS, AFP, INSAFORP/INCAF
     */
    static calcularAportePatronal(salarioBruto: number, c: ConfigPlanillaMap): AportesPatronales {
        const salarioBaseISS = Math.min(salarioBruto, c.ISSS_TOPE_SALARIO)
        const isssPatronal = round2(salarioBaseISS * (c.ISSS_PATRONAL / 100))
        const afpPatronal = round2(salarioBruto * (c.AFP_PATRONAL / 100))
        const insaforp = round2(salarioBruto * (c.INSAFORP / 100))
        const totalPatronal = round2(isssPatronal + afpPatronal + insaforp)

        return { isssPatronal, afpPatronal, insaforp, totalPatronal }
    }

    /**
     * Calcula aguinaldo según antigüedad (Art. 196-202 CT).
     * @param salarioMensual  Salario mensual del empleado
     * @param fechaIngreso    Fecha de ingreso del empleado
     * @param fechaCorte      Fecha de cálculo (12 de diciembre normalmente)
     * @param otorgarCompleto Si true, otorga aguinaldo completo aunque no cumpla 1 año
     */
    static calcularAguinaldo(
        salarioMensual: number,
        fechaIngreso: Date,
        fechaCorte: Date = new Date(new Date().getFullYear(), 11, 12),
        otorgarCompleto = false
    ): { monto: number; dias: number; esProporcional: boolean; mesesTrabajados: number; antiguedadAnios: number } {
        const salarioDiario = salarioMensual / 30
        const antiguedadMs = fechaCorte.getTime() - new Date(fechaIngreso).getTime()
        const antiguedadAnios = antiguedadMs / (365.25 * 24 * 3600 * 1000)
        const mesesTrabajados = Math.min(12, Math.floor(antiguedadMs / (30.4375 * 24 * 3600 * 1000)))

        // Determinar días según antigüedad
        let diasLey = 15
        if (antiguedadAnios >= 10) diasLey = 21
        else if (antiguedadAnios >= 3) diasLey = 19
        else if (antiguedadAnios >= 1) diasLey = 15

        // Proporcional si menos de 1 año
        const esProporcional = antiguedadAnios < 1 && !otorgarCompleto
        const dias = esProporcional
            ? round2((diasLey * mesesTrabajados) / 12)
            : diasLey

        const monto = round2(dias * salarioDiario)

        return { monto, dias, esProporcional, mesesTrabajados, antiguedadAnios: round2(antiguedadAnios) }
    }

    /**
     * Calcula vacaciones: 15 días + 30% adicional (Art. 177 CT).
     * @param salarioMensual  Salario mensual
     * @param fechaIngreso    Fecha de ingreso
     * @param fechaCorte      Fecha de evaluación
     */
    static calcularVacaciones(
        salarioMensual: number,
        fechaIngreso: Date,
        fechaCorte: Date = new Date()
    ): { monto: number; dias: number; esProporcional: boolean; mesesTrabajados: number } {
        const salarioDiario = salarioMensual / 30
        const antiguedadMs = fechaCorte.getTime() - new Date(fechaIngreso).getTime()
        const antiguedadAnios = antiguedadMs / (365.25 * 24 * 3600 * 1000)
        const mesesTrabajados = Math.min(12, Math.floor(antiguedadMs / (30.4375 * 24 * 3600 * 1000)))

        const DIAS_VACACIONES = 15
        const RECARGO = 1.30 // 30% adicional

        const esProporcional = antiguedadAnios < 1
        const dias = esProporcional
            ? round2((DIAS_VACACIONES * mesesTrabajados) / 12)
            : DIAS_VACACIONES

        const monto = round2(dias * salarioDiario * RECARGO)

        return { monto, dias, esProporcional, mesesTrabajados }
    }

    /**
     * Calcula Quincena 25 (Decreto 499).
     * 50% del salario para empleados ≤$1,500. Proporcional si <1 año al 25/ene.
     * Sin descuentos (ISSS, AFP, ISR).
     */
    static calcularQuincena25(
        salarioMensual: number,
        fechaIngreso: Date,
        anio: number = new Date().getFullYear()
    ): { monto: number; aplica: boolean; esProporcional: boolean; mesesTrabajados: number } {
        const TOPE_SALARIO = 1500
        if (salarioMensual > TOPE_SALARIO) {
            return { monto: 0, aplica: false, esProporcional: false, mesesTrabajados: 0 }
        }

        const fechaCorte = new Date(anio, 0, 25) // 25 de enero
        const antiguedadMs = fechaCorte.getTime() - new Date(fechaIngreso).getTime()
        const antiguedadAnios = antiguedadMs / (365.25 * 24 * 3600 * 1000)
        const mesesTrabajados = Math.min(12, Math.max(0, Math.floor(antiguedadMs / (30.4375 * 24 * 3600 * 1000))))

        const montoCompleto = salarioMensual * 0.5
        const esProporcional = antiguedadAnios < 1
        const monto = esProporcional
            ? round2((montoCompleto * mesesTrabajados) / 12)
            : round2(montoCompleto)

        return { monto, aplica: true, esProporcional, mesesTrabajados }
    }
}

function round2(n: number): number {
    return Math.round((n + Number.EPSILON) * 100) / 100
}
