// ══════════════════════════════════════════════════════════
// CONTROLADOR DE PLANILLA / NÓMINA
// ══════════════════════════════════════════════════════════

import { prisma } from '../database/prisma.client'
import { NominaService } from '../services/nomina.service'
import fs from 'fs'
import path from 'path'

const db = prisma
const JSON_DOC_DIR = path.join(process.cwd(), 'json_doc')

// ── Helpers ───────────────────────────────────────────────

function ensureDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true })
}

function round2(n: number): number {
    return Math.round((n + Number.EPSILON) * 100) / 100
}

// ══════════════════════════════════════════════════════════

export const planillaController = {

    // ── CONFIGURACIÓN ─────────────────────────────────────

    async getConfig() {
        const rows = await db.configPlanilla.findMany({ orderBy: { clave: 'asc' } })
        return rows.map(r => ({
            ...r,
            valor: Number(r.valor),
            topeMaximo: r.topeMaximo ? Number(r.topeMaximo) : null
        }))
    },

    async updateConfig(items: Array<{ clave: string; valor: number; topeMaximo?: number | null; descripcion?: string }>) {
        for (const item of items) {
            await db.configPlanilla.upsert({
                where: { clave: item.clave },
                update: {
                    valor: item.valor,
                    topeMaximo: item.topeMaximo ?? null,
                    descripcion: item.descripcion
                },
                create: {
                    clave: item.clave,
                    valor: item.valor,
                    topeMaximo: item.topeMaximo ?? null,
                    descripcion: item.descripcion
                }
            })
        }
        return { ok: true }
    },

    async seedConfigDefaults() {
        const defaults = [
            { clave: 'ISSS_EMPLEADO', valor: 3, descripcion: 'ISSS — Aporte empleado (%)', topeMaximo: 30 },
            { clave: 'ISSS_PATRONAL', valor: 7.5, descripcion: 'ISSS — Aporte patronal (%)', topeMaximo: 75 },
            { clave: 'ISSS_TOPE_SALARIO', valor: 1000, descripcion: 'ISSS — Salario tope para cálculo ($)' },
            { clave: 'AFP_EMPLEADO', valor: 7.25, descripcion: 'AFP — Aporte empleado (%)' },
            { clave: 'AFP_PATRONAL', valor: 8.75, descripcion: 'AFP — Aporte patronal (%)' },
            { clave: 'INSAFORP', valor: 1, descripcion: 'INSAFORP/INCAF — Aporte patronal (%)' },
            { clave: 'ISR_TRAMO1_LIMITE', valor: 550, descripcion: 'ISR Tramo 1 — Límite exento ($)' },
            { clave: 'ISR_TRAMO2_LIMITE', valor: 895.24, descripcion: 'ISR Tramo 2 — Límite ($)' },
            { clave: 'ISR_TRAMO2_CUOTA', valor: 17.67, descripcion: 'ISR Tramo 2 — Cuota fija ($)' },
            { clave: 'ISR_TRAMO2_PORCENTAJE', valor: 10, descripcion: 'ISR Tramo 2 — Porcentaje (%)' },
            { clave: 'ISR_TRAMO2_SOBRE_EXCESO', valor: 550, descripcion: 'ISR Tramo 2 — Sobre exceso de ($)' },
            { clave: 'ISR_TRAMO3_LIMITE', valor: 2038.10, descripcion: 'ISR Tramo 3 — Límite ($)' },
            { clave: 'ISR_TRAMO3_CUOTA', valor: 60, descripcion: 'ISR Tramo 3 — Cuota fija ($)' },
            { clave: 'ISR_TRAMO3_PORCENTAJE', valor: 20, descripcion: 'ISR Tramo 3 — Porcentaje (%)' },
            { clave: 'ISR_TRAMO3_SOBRE_EXCESO', valor: 895.24, descripcion: 'ISR Tramo 3 — Sobre exceso de ($)' },
            { clave: 'ISR_TRAMO4_CUOTA', valor: 288.57, descripcion: 'ISR Tramo 4 — Cuota fija ($)' },
            { clave: 'ISR_TRAMO4_PORCENTAJE', valor: 30, descripcion: 'ISR Tramo 4 — Porcentaje (%)' },
            { clave: 'ISR_TRAMO4_SOBRE_EXCESO', valor: 2038.10, descripcion: 'ISR Tramo 4 — Sobre exceso de ($)' }
        ]

        for (const d of defaults) {
            const exists = await db.configPlanilla.findUnique({ where: { clave: d.clave } })
            if (!exists) {
                await db.configPlanilla.create({
                    data: {
                        clave: d.clave,
                        valor: d.valor,
                        descripcion: d.descripcion,
                        topeMaximo: ('topeMaximo' in d) ? (d as { topeMaximo?: number }).topeMaximo ?? null : null
                    }
                })
            }
        }
        return { ok: true, message: 'Configuración por defecto aplicada' }
    },

    // ── PLANILLAS ─────────────────────────────────────────

    async listarPlanillas(page = 1, pageSize = 20) {
        const skip = (page - 1) * pageSize
        const [planillas, total] = await Promise.all([
            db.planilla.findMany({
                skip, take: pageSize,
                orderBy: { createdAt: 'desc' },
                include: { _count: { select: { detalles: true } } }
            }),
            db.planilla.count()
        ])

        return {
            planillas: planillas.map(p => ({
                ...p,
                totalBruto: Number(p.totalBruto),
                totalISS: Number(p.totalISS),
                totalAFP: Number(p.totalAFP),
                totalRenta: Number(p.totalRenta),
                totalDeducciones: Number(p.totalDeducciones),
                totalNeto: Number(p.totalNeto),
                totalPatronalISS: Number(p.totalPatronalISS),
                totalPatronalAFP: Number(p.totalPatronalAFP),
                totalINSAFORP: Number(p.totalINSAFORP),
                empleados: p._count.detalles
            })),
            total, page, pageSize
        }
    },

    async getPlanillaById(id: number) {
        const planilla = await db.planilla.findUnique({
            where: { id },
            include: { detalles: { orderBy: { nombre: 'asc' } } }
        })
        if (!planilla) return null

        return {
            ...planilla,
            totalBruto: Number(planilla.totalBruto),
            totalISS: Number(planilla.totalISS),
            totalAFP: Number(planilla.totalAFP),
            totalRenta: Number(planilla.totalRenta),
            totalDeducciones: Number(planilla.totalDeducciones),
            totalNeto: Number(planilla.totalNeto),
            totalPatronalISS: Number(planilla.totalPatronalISS),
            totalPatronalAFP: Number(planilla.totalPatronalAFP),
            totalINSAFORP: Number(planilla.totalINSAFORP),
            detalles: planilla.detalles.map(d => ({
                ...d,
                salarioBruto: Number(d.salarioBruto),
                isss: Number(d.isss),
                afp: Number(d.afp),
                renta: Number(d.renta),
                otrasDeducciones: Number(d.otrasDeducciones),
                totalDeducciones: Number(d.totalDeducciones),
                salarioNeto: Number(d.salarioNeto),
                isssPatronal: Number(d.isssPatronal),
                afpPatronal: Number(d.afpPatronal),
                insaforp: Number(d.insaforp)
            }))
        }
    },

    async generarPlanilla(periodo: string, tipoPago = 'MENSUAL') {
        // Verificar que no exista ya
        const existe = await db.planilla.findUnique({
            where: { periodo_tipoPago: { periodo, tipoPago } }
        })
        if (existe) {
            return { ok: false, error: `Ya existe una planilla para ${periodo} (${tipoPago})` }
        }

        // Obtener config y empleados activos con salario > 0
        const config = await NominaService.getConfig()
        const empleados = await db.empleado.findMany({
            where: { activo: true, salario: { gt: 0 } },
            orderBy: { nombre: 'asc' }
        })

        if (empleados.length === 0) {
            return { ok: false, error: 'No hay empleados activos con salario asignado' }
        }

        // Calcular cada detalle
        const detalles = empleados.map(emp => {
            const salarioBruto = Number(emp.salario)
            const ded = NominaService.calcularDeduccionesEmpleado(salarioBruto, config)
            const pat = NominaService.calcularAportePatronal(salarioBruto, config)

            return {
                empleadoId: emp.id,
                nombre: emp.nombre,
                cargo: emp.cargo ?? 'Sin cargo',
                salarioBruto,
                isss: ded.isss,
                afp: ded.afp,
                renta: ded.renta,
                otrasDeducciones: 0,
                totalDeducciones: ded.totalDeducciones,
                salarioNeto: ded.salarioNeto,
                isssPatronal: pat.isssPatronal,
                afpPatronal: pat.afpPatronal,
                insaforp: pat.insaforp
            }
        })

        // Totales
        const totalBruto = round2(detalles.reduce((a, d) => a + d.salarioBruto, 0))
        const totalISS = round2(detalles.reduce((a, d) => a + d.isss, 0))
        const totalAFP = round2(detalles.reduce((a, d) => a + d.afp, 0))
        const totalRenta = round2(detalles.reduce((a, d) => a + d.renta, 0))
        const totalDeducciones = round2(detalles.reduce((a, d) => a + d.totalDeducciones, 0))
        const totalNeto = round2(detalles.reduce((a, d) => a + d.salarioNeto, 0))
        const totalPatronalISS = round2(detalles.reduce((a, d) => a + d.isssPatronal, 0))
        const totalPatronalAFP = round2(detalles.reduce((a, d) => a + d.afpPatronal, 0))
        const totalINSAFORP = round2(detalles.reduce((a, d) => a + d.insaforp, 0))

        // Crear planilla con detalles
        const planilla = await db.planilla.create({
            data: {
                periodo,
                tipoPago,
                totalBruto,
                totalISS,
                totalAFP,
                totalRenta,
                totalDeducciones,
                totalNeto,
                totalPatronalISS,
                totalPatronalAFP,
                totalINSAFORP,
                detalles: { create: detalles }
            },
            include: { detalles: true }
        })

        // Guardar JSON en json_doc/planillas/{periodo}/
        try {
            const planillaDir = path.join(JSON_DOC_DIR, 'planillas', periodo)
            ensureDir(planillaDir)

            // JSON completo de la planilla
            const planillaJson = {
                id: planilla.id,
                periodo,
                tipoPago,
                estado: 'BORRADOR',
                generadoEl: new Date().toISOString(),
                totales: { totalBruto, totalISS, totalAFP, totalRenta, totalDeducciones, totalNeto, totalPatronalISS, totalPatronalAFP, totalINSAFORP },
                empleados: detalles
            }
            fs.writeFileSync(path.join(planillaDir, 'planilla.json'), JSON.stringify(planillaJson, null, 2), 'utf-8')

            // JSON individual por empleado (boleta)
            for (const det of detalles) {
                const boletaJson = {
                    planillaId: planilla.id,
                    periodo,
                    generadoEl: new Date().toISOString(),
                    empleado: {
                        id: det.empleadoId,
                        nombre: det.nombre,
                        cargo: det.cargo
                    },
                    ingresos: { salarioBruto: det.salarioBruto },
                    deducciones: {
                        isss: det.isss,
                        afp: det.afp,
                        renta: det.renta,
                        otrasDeducciones: det.otrasDeducciones,
                        totalDeducciones: det.totalDeducciones
                    },
                    salarioNeto: det.salarioNeto,
                    patronal: {
                        isss: det.isssPatronal,
                        afp: det.afpPatronal,
                        insaforp: det.insaforp
                    }
                }
                fs.writeFileSync(
                    path.join(planillaDir, `boleta_${det.empleadoId}.json`),
                    JSON.stringify(boletaJson, null, 2), 'utf-8'
                )
            }
        } catch (err) {
            console.warn('[planilla] Error guardando JSON:', err)
        }

        return {
            ok: true,
            planillaId: planilla.id,
            periodo,
            empleados: detalles.length,
            totalNeto,
            totalPatronal: round2(totalPatronalISS + totalPatronalAFP + totalINSAFORP)
        }
    },

    async aprobarPlanilla(id: number) {
        const planilla = await db.planilla.findUnique({ where: { id } })
        if (!planilla) return { ok: false, error: 'Planilla no encontrada' }
        if (planilla.estado !== 'BORRADOR') return { ok: false, error: `Planilla ya está en estado ${planilla.estado}` }

        await db.planilla.update({ where: { id }, data: { estado: 'APROBADA' } })
        return { ok: true, estado: 'APROBADA' }
    },

    async eliminarPlanilla(id: number) {
        const planilla = await db.planilla.findUnique({ where: { id } })
        if (!planilla) return { ok: false, error: 'Planilla no encontrada' }
        if (planilla.estado !== 'BORRADOR') return { ok: false, error: 'Solo se pueden eliminar planillas en estado BORRADOR' }

        await db.planilla.delete({ where: { id } })
        return { ok: true }
    },

    // ── BOLETAS Y CONSTANCIA ──────────────────────────────

    async getBoleta(planillaId: number, empleadoId: number) {
        const detalle = await db.detallePlanilla.findFirst({
            where: { planillaId, empleadoId },
            include: { planilla: true }
        })
        if (!detalle) return null

        const empleado = await db.empleado.findUnique({ where: { id: empleadoId } })

        return {
            periodo: detalle.planilla.periodo,
            estado: detalle.planilla.estado,
            empleado: empleado ? {
                id: empleado.id,
                nombre: empleado.nombre,
                dui: empleado.dui,
                cargo: empleado.cargo,
                fechaIngreso: empleado.fechaIngreso
            } : null,
            salarioBruto: Number(detalle.salarioBruto),
            isss: Number(detalle.isss),
            afp: Number(detalle.afp),
            renta: Number(detalle.renta),
            otrasDeducciones: Number(detalle.otrasDeducciones),
            totalDeducciones: Number(detalle.totalDeducciones),
            salarioNeto: Number(detalle.salarioNeto),
            isssPatronal: Number(detalle.isssPatronal),
            afpPatronal: Number(detalle.afpPatronal),
            insaforp: Number(detalle.insaforp)
        }
    },

    async getConstanciaSalarial(empleadoId: number, meses = 6) {
        const empleado = await db.empleado.findUnique({ where: { id: empleadoId } })
        if (!empleado) return null

        // Obtener los últimos N períodos de planilla para este empleado
        const detalles = await db.detallePlanilla.findMany({
            where: { empleadoId },
            include: { planilla: { select: { periodo: true, estado: true } } },
            orderBy: { planilla: { periodo: 'desc' } },
            take: meses
        })

        return {
            empleado: {
                id: empleado.id,
                nombre: empleado.nombre,
                dui: empleado.dui,
                nit: empleado.nit,
                cargo: empleado.cargo,
                salarioActual: Number(empleado.salario),
                fechaIngreso: empleado.fechaIngreso,
                direccion: empleado.direccion
            },
            historial: detalles.map(d => ({
                periodo: d.planilla.periodo,
                estado: d.planilla.estado,
                salarioBruto: Number(d.salarioBruto),
                totalDeducciones: Number(d.totalDeducciones),
                salarioNeto: Number(d.salarioNeto)
            })),
            generadoEl: new Date().toISOString()
        }
    },

    // ── AGUINALDO ─────────────────────────────────────────

    async calcularAguinaldoTodos(anio?: number, otorgarCompleto = false) {
        const year = anio ?? new Date().getFullYear()
        const fechaCorte = new Date(year, 11, 12) // 12 de diciembre

        const empleados = await db.empleado.findMany({
            where: { activo: true, salario: { gt: 0 } },
            orderBy: { nombre: 'asc' }
        })

        return empleados.map(emp => {
            const salario = Number(emp.salario)
            const resultado = NominaService.calcularAguinaldo(salario, emp.fechaIngreso ?? new Date(), fechaCorte, otorgarCompleto)

            return {
                empleadoId: emp.id,
                nombre: emp.nombre,
                cargo: emp.cargo ?? 'Sin cargo',
                salarioMensual: salario,
                fechaIngreso: emp.fechaIngreso,
                ...resultado
            }
        })
    },

    // ── VACACIONES ────────────────────────────────────────

    async calcularVacacionesTodos() {
        const empleados = await db.empleado.findMany({
            where: { activo: true, salario: { gt: 0 } },
            orderBy: { nombre: 'asc' }
        })

        return empleados.map(emp => {
            const salario = Number(emp.salario)
            const resultado = NominaService.calcularVacaciones(salario, emp.fechaIngreso ?? new Date())

            return {
                empleadoId: emp.id,
                nombre: emp.nombre,
                cargo: emp.cargo ?? 'Sin cargo',
                salarioMensual: salario,
                fechaIngreso: emp.fechaIngreso,
                ...resultado
            }
        })
    },

    // ── QUINCENA 25 ───────────────────────────────────────

    async calcularQuincena25Todos(anio?: number) {
        const year = anio ?? new Date().getFullYear()

        const empleados = await db.empleado.findMany({
            where: { activo: true, salario: { gt: 0 } },
            orderBy: { nombre: 'asc' }
        })

        return empleados.map(emp => {
            const salario = Number(emp.salario)
            const resultado = NominaService.calcularQuincena25(salario, emp.fechaIngreso ?? new Date(), year)

            return {
                empleadoId: emp.id,
                nombre: emp.nombre,
                cargo: emp.cargo ?? 'Sin cargo',
                salarioMensual: salario,
                fechaIngreso: emp.fechaIngreso,
                ...resultado
            }
        })
    }
}
