import { prisma } from '../database/prisma.client'
import { CATALOGO_ESTANDAR_SV } from './catalogo-estandar-sv'
import { Prisma } from '@prisma/client'

export const contabilidadController = {

  // ═══════════════════════════════════════
  // CATÁLOGO DE CUENTAS
  // ═══════════════════════════════════════

  async listarCuentas(busqueda?: string, tipo?: string) {
    const where: Record<string, unknown> = { activa: true }
    if (tipo) where.tipo = tipo
    if (busqueda) {
      where.OR = [
        { codigo: { contains: busqueda, mode: 'insensitive' } },
        { nombre: { contains: busqueda, mode: 'insensitive' } }
      ]
    }

    return prisma.catalogoCuenta.findMany({
      where,
      orderBy: { codigo: 'asc' },
      include: {
        cuentaPadre: { select: { id: true, codigo: true, nombre: true } },
        _count: { select: { subcuentas: true, detallesAsiento: true } }
      }
    })
  },

  async crearCuenta(data: {
    codigo: string
    nombre: string
    descripcion?: string
    tipo: string
    naturaleza: string
    nivel: number
    cuentaPadreId?: number
    aceptaMovimiento: boolean
  }) {
    // Validar que la cuenta padre exista si se proporcionó
    if (data.cuentaPadreId) {
      const padre = await prisma.catalogoCuenta.findUnique({ where: { id: data.cuentaPadreId } })
      if (!padre) throw new Error('La cuenta padre no existe')
      if (padre.aceptaMovimiento) throw new Error('La cuenta padre no puede ser una cuenta de detalle (acepta movimiento)')
    }

    return prisma.catalogoCuenta.create({
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        descripcion: data.descripcion,
        tipo: data.tipo as any,
        naturaleza: data.naturaleza as any,
        nivel: data.nivel,
        cuentaPadreId: data.cuentaPadreId || null,
        aceptaMovimiento: data.aceptaMovimiento
      },
      include: {
        cuentaPadre: { select: { id: true, codigo: true, nombre: true } },
        _count: { select: { subcuentas: true, detallesAsiento: true } }
      }
    })
  },

  async editarCuenta(id: number, data: {
    nombre?: string
    descripcion?: string
    aceptaMovimiento?: boolean
    activa?: boolean
  }) {
    // Si se intenta cambiar aceptaMovimiento a false, verificar que no tenga movimientos
    if (data.aceptaMovimiento === false) {
      const count = await prisma.detalleAsiento.count({ where: { cuentaId: id } })
      if (count > 0) throw new Error('La cuenta tiene movimientos registrados, no se puede cambiar')
    }

    return prisma.catalogoCuenta.update({
      where: { id },
      data,
      include: {
        cuentaPadre: { select: { id: true, codigo: true, nombre: true } },
        _count: { select: { subcuentas: true, detallesAsiento: true } }
      }
    })
  },

  async eliminarCuenta(id: number) {
    const cuenta = await prisma.catalogoCuenta.findUnique({
      where: { id },
      include: { _count: { select: { subcuentas: true, detallesAsiento: true } } }
    })
    if (!cuenta) throw new Error('Cuenta no encontrada')
    if (cuenta._count.subcuentas > 0) throw new Error('La cuenta tiene subcuentas, elimínelas primero')
    if (cuenta._count.detallesAsiento > 0) throw new Error('La cuenta tiene movimientos contables registrados')

    return prisma.catalogoCuenta.update({ where: { id }, data: { activa: false } })
  },

  async importarCatalogo(cuentas: Array<{
    codigo: string; nombre: string; descripcion?: string
    tipo: string; naturaleza: string; nivel: number
    codigoPadre: string | null; aceptaMovimiento: boolean
  }>) {
    // Insertar en orden de nivel para que los padres existan primero
    const sorted = [...cuentas].sort((a, b) => a.nivel - b.nivel)
    const codigoToId: Record<string, number> = {}
    let created = 0

    for (const c of sorted) {
      const exists = await prisma.catalogoCuenta.findFirst({ where: { codigo: c.codigo } })
      if (exists) {
        codigoToId[c.codigo] = exists.id
        continue
      }

      const padreId = c.codigoPadre ? codigoToId[c.codigoPadre] || null : null

      const nueva = await prisma.catalogoCuenta.create({
        data: {
          codigo: c.codigo,
          nombre: c.nombre,
          descripcion: c.descripcion,
          tipo: c.tipo as any,
          naturaleza: c.naturaleza as any,
          nivel: c.nivel,
          cuentaPadreId: padreId,
          aceptaMovimiento: c.aceptaMovimiento
        }
      })
      codigoToId[c.codigo] = nueva.id
      created++
    }

    return { created, total: sorted.length }
  },

  async obtenerCatalogoEstandar() {
    return CATALOGO_ESTANDAR_SV
  },

  // ═══════════════════════════════════════
  // PERÍODOS CONTABLES
  // ═══════════════════════════════════════

  async listarPeriodos(anio?: number) {
    const where: Record<string, unknown> = {}
    if (anio) where.anio = anio

    return prisma.periodoContable.findMany({
      where,
      orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
      include: { _count: { select: { asientos: true } } }
    })
  },

  async crearPeriodo(data: { nombre: string; anio: number; mes: number }) {
    const fechaInicio = new Date(data.anio, data.mes - 1, 1)
    const fechaFin = new Date(data.anio, data.mes, 0, 23, 59, 59)

    return prisma.periodoContable.create({
      data: {
        nombre: data.nombre,
        anio: data.anio,
        mes: data.mes,
        fechaInicio,
        fechaFin
      },
      include: { _count: { select: { asientos: true } } }
    })
  },

  async cerrarPeriodo(id: number) {
    const periodo = await prisma.periodoContable.findUnique({ where: { id } })
    if (!periodo) throw new Error('Período no encontrado')
    if (periodo.estado === 'CERRADO') throw new Error('El período ya está cerrado')

    // Verificar que no haya asientos en borrador
    const borradores = await prisma.asientoContable.count({
      where: { periodoId: id, estado: 'BORRADOR' }
    })
    if (borradores > 0) throw new Error(`Hay ${borradores} asiento(s) en borrador. Apruebe o elimine antes de cerrar.`)

    // Calcular saldos del período
    await this._calcularSaldosPeriodo(id)

    return prisma.periodoContable.update({
      where: { id },
      data: { estado: 'CERRADO' },
      include: { _count: { select: { asientos: true } } }
    })
  },

  async reabrirPeriodo(id: number) {
    return prisma.periodoContable.update({
      where: { id },
      data: { estado: 'ABIERTO' },
      include: { _count: { select: { asientos: true } } }
    })
  },

  // ═══════════════════════════════════════
  // ASIENTOS CONTABLES (PARTIDAS)
  // ═══════════════════════════════════════

  async listarAsientos(periodoId?: number, estado?: string, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize
    const where: Record<string, unknown> = {}
    if (periodoId) where.periodoId = periodoId
    if (estado) where.estado = estado

    const [asientos, total] = await Promise.all([
      prisma.asientoContable.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ fecha: 'desc' }, { numero: 'desc' }],
        include: {
          periodo: { select: { nombre: true } },
          _count: { select: { detalles: true } }
        }
      }),
      prisma.asientoContable.count({ where })
    ])

    return { asientos, total, page, pageSize }
  },

  async obtenerAsiento(id: number) {
    return prisma.asientoContable.findUnique({
      where: { id },
      include: {
        periodo: { select: { id: true, nombre: true, estado: true } },
        detalles: {
          include: {
            cuenta: { select: { id: true, codigo: true, nombre: true, tipo: true } }
          },
          orderBy: { id: 'asc' }
        }
      }
    })
  },

  async crearAsiento(data: {
    fecha: string
    descripcion: string
    periodoId: number
    tipo?: string
    documentoRef?: string
    creadoPor?: string
    detalles: Array<{ cuentaId: number; descripcion?: string; debe: number; haber: number }>
  }) {
    // Validar período abierto
    const periodo = await prisma.periodoContable.findUnique({ where: { id: data.periodoId } })
    if (!periodo) throw new Error('Período no encontrado')
    if (periodo.estado === 'CERRADO') throw new Error('El período está cerrado, no se pueden agregar asientos')

    // Validar partida doble
    const totalDebe = data.detalles.reduce((sum, d) => sum + d.debe, 0)
    const totalHaber = data.detalles.reduce((sum, d) => sum + d.haber, 0)
    if (Math.abs(totalDebe - totalHaber) > 0.005) {
      throw new Error(`La partida no cuadra: Debe ($${totalDebe.toFixed(2)}) ≠ Haber ($${totalHaber.toFixed(2)})`)
    }

    // Validar que las cuentas aceptan movimiento
    for (const d of data.detalles) {
      const cuenta = await prisma.catalogoCuenta.findUnique({ where: { id: d.cuentaId } })
      if (!cuenta) throw new Error(`Cuenta ID ${d.cuentaId} no encontrada`)
      if (!cuenta.aceptaMovimiento) throw new Error(`La cuenta "${cuenta.codigo} - ${cuenta.nombre}" no acepta movimientos directos`)
      if (d.debe === 0 && d.haber === 0) throw new Error(`La línea para cuenta "${cuenta.codigo}" debe tener valor en Debe o Haber`)
    }

    // Obtener siguiente número
    const ultimo = await prisma.asientoContable.findFirst({
      where: { periodoId: data.periodoId },
      orderBy: { numero: 'desc' },
      select: { numero: true }
    })
    const numero = (ultimo?.numero ?? 0) + 1

    return prisma.asientoContable.create({
      data: {
        numero,
        fecha: new Date(data.fecha),
        descripcion: data.descripcion,
        periodoId: data.periodoId,
        tipo: (data.tipo as any) || 'DIARIO',
        documentoRef: data.documentoRef,
        creadoPor: data.creadoPor,
        totalDebe,
        totalHaber,
        detalles: {
          create: data.detalles.map(d => ({
            cuentaId: d.cuentaId,
            descripcion: d.descripcion,
            debe: d.debe,
            haber: d.haber
          }))
        }
      },
      include: {
        periodo: { select: { id: true, nombre: true } },
        detalles: {
          include: { cuenta: { select: { id: true, codigo: true, nombre: true, tipo: true } } },
          orderBy: { id: 'asc' }
        }
      }
    })
  },

  async editarAsiento(id: number, data: {
    fecha?: string
    descripcion?: string
    tipo?: string
    documentoRef?: string
    detalles?: Array<{ cuentaId: number; descripcion?: string; debe: number; haber: number }>
  }) {
    const asiento = await prisma.asientoContable.findUnique({ where: { id } })
    if (!asiento) throw new Error('Asiento no encontrado')
    if (asiento.estado !== 'BORRADOR') throw new Error('Solo se pueden editar asientos en estado BORRADOR')

    const updateData: Record<string, unknown> = {}
    if (data.fecha) updateData.fecha = new Date(data.fecha)
    if (data.descripcion) updateData.descripcion = data.descripcion
    if (data.tipo) updateData.tipo = data.tipo
    if (data.documentoRef !== undefined) updateData.documentoRef = data.documentoRef

    if (data.detalles) {
      const totalDebe = data.detalles.reduce((sum, d) => sum + d.debe, 0)
      const totalHaber = data.detalles.reduce((sum, d) => sum + d.haber, 0)
      if (Math.abs(totalDebe - totalHaber) > 0.005) {
        throw new Error(`La partida no cuadra: Debe ($${totalDebe.toFixed(2)}) ≠ Haber ($${totalHaber.toFixed(2)})`)
      }

      updateData.totalDebe = totalDebe
      updateData.totalHaber = totalHaber

      // Borrar detalles anteriores y crear nuevos
      await prisma.detalleAsiento.deleteMany({ where: { asientoId: id } })
      await prisma.detalleAsiento.createMany({
        data: data.detalles.map(d => ({
          asientoId: id,
          cuentaId: d.cuentaId,
          descripcion: d.descripcion,
          debe: d.debe,
          haber: d.haber
        }))
      })
    }

    return prisma.asientoContable.update({
      where: { id },
      data: updateData,
      include: {
        periodo: { select: { id: true, nombre: true } },
        detalles: {
          include: { cuenta: { select: { id: true, codigo: true, nombre: true, tipo: true } } },
          orderBy: { id: 'asc' }
        }
      }
    })
  },

  async aprobarAsiento(id: number) {
    const asiento = await prisma.asientoContable.findUnique({ where: { id } })
    if (!asiento) throw new Error('Asiento no encontrado')
    if (asiento.estado !== 'BORRADOR') throw new Error('Solo se pueden aprobar asientos en estado BORRADOR')

    return prisma.asientoContable.update({
      where: { id },
      data: { estado: 'APROBADO' },
      include: {
        periodo: { select: { id: true, nombre: true } },
        detalles: {
          include: { cuenta: { select: { id: true, codigo: true, nombre: true, tipo: true } } }
        }
      }
    })
  },

  async anularAsiento(id: number) {
    const asiento = await prisma.asientoContable.findUnique({ where: { id } })
    if (!asiento) throw new Error('Asiento no encontrado')
    if (asiento.estado === 'ANULADO') throw new Error('El asiento ya está anulado')

    return prisma.asientoContable.update({
      where: { id },
      data: { estado: 'ANULADO' },
      include: {
        periodo: { select: { id: true, nombre: true } },
        detalles: {
          include: { cuenta: { select: { id: true, codigo: true, nombre: true, tipo: true } } }
        }
      }
    })
  },

  async eliminarAsiento(id: number) {
    const asiento = await prisma.asientoContable.findUnique({ where: { id } })
    if (!asiento) throw new Error('Asiento no encontrado')
    if (asiento.estado !== 'BORRADOR') throw new Error('Solo se pueden eliminar asientos en estado BORRADOR')

    return prisma.asientoContable.delete({ where: { id } })
  },

  // ═══════════════════════════════════════
  // REPORTES
  // ═══════════════════════════════════════

  async balanceComprobacion(periodoId?: number, desde?: string, hasta?: string) {
    const whereAsiento: Record<string, unknown> = { estado: 'APROBADO' }

    if (periodoId) {
      whereAsiento.periodoId = periodoId
    } else if (desde || hasta) {
      whereAsiento.fecha = {}
      if (desde) (whereAsiento.fecha as any).gte = new Date(desde)
      if (hasta) {
        const h = new Date(hasta)
        h.setHours(23, 59, 59, 999)
        ;(whereAsiento.fecha as any).lte = h
      }
    }

    // Obtener todos los detalles de asientos aprobados
    const detalles = await prisma.detalleAsiento.findMany({
      where: { asiento: whereAsiento },
      include: {
        cuenta: { select: { id: true, codigo: true, nombre: true, tipo: true, naturaleza: true, nivel: true } }
      }
    })

    // Agrupar por cuenta
    const mapa: Record<number, {
      cuentaId: number; codigo: string; nombre: string; tipo: string; naturaleza: string; nivel: number
      debitos: number; creditos: number; saldoDeudor: number; saldoAcreedor: number
    }> = {}

    for (const d of detalles) {
      if (!mapa[d.cuentaId]) {
        mapa[d.cuentaId] = {
          cuentaId: d.cuentaId,
          codigo: d.cuenta.codigo,
          nombre: d.cuenta.nombre,
          tipo: d.cuenta.tipo,
          naturaleza: d.cuenta.naturaleza,
          nivel: d.cuenta.nivel,
          debitos: 0, creditos: 0, saldoDeudor: 0, saldoAcreedor: 0
        }
      }
      mapa[d.cuentaId].debitos += Number(d.debe)
      mapa[d.cuentaId].creditos += Number(d.haber)
    }

    // Calcular saldos
    const cuentas = Object.values(mapa).map(c => {
      const diff = c.debitos - c.creditos
      c.saldoDeudor = diff > 0 ? Number(diff.toFixed(2)) : 0
      c.saldoAcreedor = diff < 0 ? Number(Math.abs(diff).toFixed(2)) : 0
      c.debitos = Number(c.debitos.toFixed(2))
      c.creditos = Number(c.creditos.toFixed(2))
      return c
    }).sort((a, b) => a.codigo.localeCompare(b.codigo))

    const totalDebitos = Number(cuentas.reduce((s, c) => s + c.debitos, 0).toFixed(2))
    const totalCreditos = Number(cuentas.reduce((s, c) => s + c.creditos, 0).toFixed(2))
    const totalSaldoDeudor = Number(cuentas.reduce((s, c) => s + c.saldoDeudor, 0).toFixed(2))
    const totalSaldoAcreedor = Number(cuentas.reduce((s, c) => s + c.saldoAcreedor, 0).toFixed(2))

    return { cuentas, totalDebitos, totalCreditos, totalSaldoDeudor, totalSaldoAcreedor }
  },

  async estadoResultados(desde: string, hasta: string) {
    const whereAsiento: Record<string, unknown> = {
      estado: 'APROBADO',
      fecha: {
        gte: new Date(desde),
        lte: (() => { const d = new Date(hasta); d.setHours(23, 59, 59, 999); return d })()
      }
    }

    const detalles = await prisma.detalleAsiento.findMany({
      where: { asiento: whereAsiento },
      include: {
        cuenta: { select: { codigo: true, nombre: true, tipo: true, naturaleza: true } }
      }
    })

    // Agrupar saldos por tipo de cuenta
    const saldos: Record<string, { nombre: string; codigo: string; saldo: number }[]> = {
      INGRESO: [], COSTO: [], GASTO: []
    }

    const mapaCuenta: Record<string, { nombre: string; codigo: string; debe: number; haber: number }> = {}
    for (const d of detalles) {
      const tipo = d.cuenta.tipo
      if (!['INGRESO', 'COSTO', 'GASTO'].includes(tipo)) continue

      const key = d.cuenta.codigo
      if (!mapaCuenta[key]) {
        mapaCuenta[key] = { nombre: d.cuenta.nombre, codigo: d.cuenta.codigo, debe: 0, haber: 0 }
      }
      mapaCuenta[key].debe += Number(d.debe)
      mapaCuenta[key].haber += Number(d.haber)
    }

    for (const [codigo, c] of Object.entries(mapaCuenta)) {
      const cuenta = detalles.find(d => d.cuenta.codigo === codigo)!.cuenta
      const saldo = cuenta.naturaleza === 'DEUDORA' ? c.debe - c.haber : c.haber - c.debe
      if (Math.abs(saldo) > 0.005) {
        saldos[cuenta.tipo]?.push({ nombre: c.nombre, codigo: c.codigo, saldo: Number(saldo.toFixed(2)) })
      }
    }

    // Ordenar
    for (const tipo of Object.keys(saldos)) {
      saldos[tipo].sort((a, b) => a.codigo.localeCompare(b.codigo))
    }

    const totalIngresos = Number(saldos.INGRESO.reduce((s, c) => s + c.saldo, 0).toFixed(2))
    const totalCostos = Number(saldos.COSTO.reduce((s, c) => s + c.saldo, 0).toFixed(2))
    const totalGastos = Number(saldos.GASTO.reduce((s, c) => s + c.saldo, 0).toFixed(2))
    const utilidadBruta = Number((totalIngresos - totalCostos).toFixed(2))
    const utilidadOperacion = Number((utilidadBruta - totalGastos).toFixed(2))
    const utilidadNeta = utilidadOperacion // Pre-impuestos y reserva legal

    return {
      ingresos: saldos.INGRESO,
      costos: saldos.COSTO,
      gastos: saldos.GASTO,
      totalIngresos,
      totalCostos,
      totalGastos,
      utilidadBruta,
      utilidadOperacion,
      utilidadNeta,
      desde,
      hasta
    }
  },

  async balanceGeneral(fecha: string) {
    const hastaFecha = new Date(fecha)
    hastaFecha.setHours(23, 59, 59, 999)

    const detalles = await prisma.detalleAsiento.findMany({
      where: {
        asiento: {
          estado: 'APROBADO',
          fecha: { lte: hastaFecha }
        }
      },
      include: {
        cuenta: { select: { codigo: true, nombre: true, tipo: true, naturaleza: true, nivel: true } }
      }
    })

    const mapaCuenta: Record<string, { codigo: string; nombre: string; tipo: string; naturaleza: string; nivel: number; debe: number; haber: number }> = {}

    for (const d of detalles) {
      const key = d.cuenta.codigo
      if (!mapaCuenta[key]) {
        mapaCuenta[key] = {
          codigo: d.cuenta.codigo,
          nombre: d.cuenta.nombre,
          tipo: d.cuenta.tipo,
          naturaleza: d.cuenta.naturaleza,
          nivel: d.cuenta.nivel,
          debe: 0,
          haber: 0
        }
      }
      mapaCuenta[key].debe += Number(d.debe)
      mapaCuenta[key].haber += Number(d.haber)
    }

    const cuentas = Object.values(mapaCuenta).map(c => {
      const saldo = c.naturaleza === 'DEUDORA' ? c.debe - c.haber : c.haber - c.debe
      return { ...c, saldo: Number(saldo.toFixed(2)) }
    }).filter(c => Math.abs(c.saldo) > 0.005)
      .sort((a, b) => a.codigo.localeCompare(b.codigo))

    const activos = cuentas.filter(c => c.tipo === 'ACTIVO')
    const pasivos = cuentas.filter(c => c.tipo === 'PASIVO')
    const patrimonio = cuentas.filter(c => c.tipo === 'PATRIMONIO')

    // Incluir resultado del ejercicio en patrimonio (ingresos - costos - gastos)
    const ingresos = cuentas.filter(c => c.tipo === 'INGRESO').reduce((s, c) => s + c.saldo, 0)
    const costos = cuentas.filter(c => c.tipo === 'COSTO').reduce((s, c) => s + c.saldo, 0)
    const gastos = cuentas.filter(c => c.tipo === 'GASTO').reduce((s, c) => s + c.saldo, 0)
    const resultadoEjercicio = Number((ingresos - costos - gastos).toFixed(2))

    const totalActivos = Number(activos.reduce((s, c) => s + c.saldo, 0).toFixed(2))
    const totalPasivos = Number(pasivos.reduce((s, c) => s + c.saldo, 0).toFixed(2))
    const totalPatrimonio = Number((patrimonio.reduce((s, c) => s + c.saldo, 0) + resultadoEjercicio).toFixed(2))
    const cuadra = Math.abs(totalActivos - (totalPasivos + totalPatrimonio)) < 0.01

    return {
      activos,
      pasivos,
      patrimonio,
      resultadoEjercicio,
      totalActivos,
      totalPasivos,
      totalPatrimonio,
      cuadra,
      fecha
    }
  },

  async libroMayor(cuentaId: number, desde: string, hasta: string) {
    const cuenta = await prisma.catalogoCuenta.findUnique({
      where: { id: cuentaId },
      select: { id: true, codigo: true, nombre: true, tipo: true, naturaleza: true }
    })
    if (!cuenta) throw new Error('Cuenta no encontrada')

    const hastaDate = new Date(hasta)
    hastaDate.setHours(23, 59, 59, 999)

    const detalles = await prisma.detalleAsiento.findMany({
      where: {
        cuentaId,
        asiento: {
          estado: 'APROBADO',
          fecha: { gte: new Date(desde), lte: hastaDate }
        }
      },
      include: {
        asiento: { select: { id: true, numero: true, fecha: true, descripcion: true, periodoId: true } }
      },
      orderBy: { asiento: { fecha: 'asc' } }
    })

    // Calcular saldo anterior (todos los movimientos antes de 'desde')
    const movAnteriores = await prisma.detalleAsiento.aggregate({
      where: {
        cuentaId,
        asiento: {
          estado: 'APROBADO',
          fecha: { lt: new Date(desde) }
        }
      },
      _sum: { debe: true, haber: true }
    })

    const debeAnterior = Number(movAnteriores._sum.debe ?? 0)
    const haberAnterior = Number(movAnteriores._sum.haber ?? 0)
    const saldoAnterior = cuenta.naturaleza === 'DEUDORA'
      ? Number((debeAnterior - haberAnterior).toFixed(2))
      : Number((haberAnterior - debeAnterior).toFixed(2))

    // Construir movimientos con saldo acumulado
    let saldoAcum = saldoAnterior
    const movimientos = detalles.map(d => {
      const debe = Number(d.debe)
      const haber = Number(d.haber)
      if (cuenta.naturaleza === 'DEUDORA') {
        saldoAcum = saldoAcum + debe - haber
      } else {
        saldoAcum = saldoAcum + haber - debe
      }
      return {
        fecha: d.asiento.fecha,
        asientoNumero: d.asiento.numero,
        asientoId: d.asiento.id,
        descripcion: d.descripcion || d.asiento.descripcion,
        debe,
        haber,
        saldo: Number(saldoAcum.toFixed(2))
      }
    })

    return { cuenta, saldoAnterior, movimientos, desde, hasta }
  },

  async libroDiario(desde: string, hasta: string) {
    const hastaDate = new Date(hasta)
    hastaDate.setHours(23, 59, 59, 999)

    const asientos = await prisma.asientoContable.findMany({
      where: {
        estado: 'APROBADO',
        fecha: { gte: new Date(desde), lte: hastaDate }
      },
      include: {
        periodo: { select: { nombre: true } },
        detalles: {
          include: {
            cuenta: { select: { codigo: true, nombre: true } }
          },
          orderBy: { id: 'asc' }
        }
      },
      orderBy: [{ fecha: 'asc' }, { numero: 'asc' }]
    })

    return { asientos, desde, hasta }
  },

  async auxiliarCuenta(cuentaId: number, desde: string, hasta: string) {
    return this.libroMayor(cuentaId, desde, hasta)
  },

  // ═══════════════════════════════════════
  // HELPERS INTERNOS
  // ═══════════════════════════════════════

  async _calcularSaldosPeriodo(periodoId: number) {
    const periodo = await prisma.periodoContable.findUnique({ where: { id: periodoId } })
    if (!periodo) return

    const detalles = await prisma.detalleAsiento.findMany({
      where: {
        asiento: {
          periodoId,
          estado: 'APROBADO'
        }
      },
      select: { cuentaId: true, debe: true, haber: true }
    })

    // Agrupar por cuenta
    const mapa: Record<number, { debitos: number; creditos: number }> = {}
    for (const d of detalles) {
      if (!mapa[d.cuentaId]) mapa[d.cuentaId] = { debitos: 0, creditos: 0 }
      mapa[d.cuentaId].debitos += Number(d.debe)
      mapa[d.cuentaId].creditos += Number(d.haber)
    }

    for (const [cuentaIdStr, totals] of Object.entries(mapa)) {
      const cuentaId = Number(cuentaIdStr)

      // Obtener saldo anterior del período previo
      const cuenta = await prisma.catalogoCuenta.findUnique({ where: { id: cuentaId } })
      const periodoAnteriorMes = periodo.mes === 1 ? 12 : periodo.mes - 1
      const periodoAnteriorAnio = periodo.mes === 1 ? periodo.anio - 1 : periodo.anio

      const saldoAnteriorReg = await prisma.saldoCuenta.findFirst({
        where: {
          cuentaId,
          periodo: { anio: periodoAnteriorAnio, mes: periodoAnteriorMes }
        }
      })
      const saldoAnterior = saldoAnteriorReg ? Number(saldoAnteriorReg.saldoFinal) : 0

      const saldoFinal = cuenta?.naturaleza === 'DEUDORA'
        ? saldoAnterior + totals.debitos - totals.creditos
        : saldoAnterior + totals.creditos - totals.debitos

      await prisma.saldoCuenta.upsert({
        where: { cuentaId_periodoId: { cuentaId, periodoId } },
        update: {
          saldoAnterior,
          debitos: totals.debitos,
          creditos: totals.creditos,
          saldoFinal: Number(saldoFinal.toFixed(2))
        },
        create: {
          cuentaId,
          periodoId,
          saldoAnterior,
          debitos: totals.debitos,
          creditos: totals.creditos,
          saldoFinal: Number(saldoFinal.toFixed(2))
        }
      })
    }
  }
}
