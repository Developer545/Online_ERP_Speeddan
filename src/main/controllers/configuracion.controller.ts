import { prisma } from '../database/prisma.client'

export const configuracionController = {

  // ── EMISOR ────────────────────────────────────────────────
  async getEmisor() {
    return prisma.emisor.findFirst({
      include: {
        sucursales: { where: { activa: true }, orderBy: { nombre: 'asc' } }
      }
    })
  },

  async guardarEmisor(data: {
    nombre: string
    nombreComercial?: string
    nit: string
    nrc: string
    codActividad: string
    descActividad: string
    tipoEstablecimiento: string
    departamentoCod: string
    municipioCod: string
    complementoDireccion: string
    telefono?: string
    correo: string
  }) {
    const existe = await prisma.emisor.findFirst()
    if (existe) {
      return prisma.emisor.update({ where: { id: existe.id }, data })
    }
    return prisma.emisor.create({ data })
  },

  async guardarCredencialesMH(data: {
    mhAmbiente: string
    mhApiUser: string
    mhApiPassword: string
    certPath?: string
    certPassword?: string
  }) {
    const existe = await prisma.emisor.findFirst()
    if (!existe) throw new Error('Configure primero los datos del emisor')
    return prisma.emisor.update({ where: { id: existe.id }, data })
  },

  async toggleSimulacion(activar: boolean) {
    const existe = await prisma.emisor.findFirst()
    if (!existe) throw new Error('Configure primero los datos del emisor')
    return prisma.emisor.update({
      where: { id: existe.id },
      // @ts-ignore — modoSimulacion will be in Prisma types after next prisma generate (restart app)
      data: { modoSimulacion: activar }
    })
  },

  async activarModoSimulacion() {
    const existe = await prisma.emisor.findFirst()
    if (!existe) throw new Error('Configure primero los datos del emisor')
    // Rellena credenciales de prueba y activa el modo simulación
    return prisma.emisor.update({
      where: { id: existe.id },
      data: {
        mhAmbiente: '00',
        mhApiUser: 'SIM_NIT_' + existe.nit,
        mhApiPassword: 'SIMULACION_PASSWORD_2024',
        certPath: 'simulacion.crt',
        certPassword: 'simulacion',
        // @ts-ignore — modoSimulacion will be in Prisma types after next prisma generate (restart app)
        modoSimulacion: true
      }
    })
  },

  // ── SUCURSALES ────────────────────────────────────────────
  async listarSucursales() {
    return prisma.sucursal.findMany({
      where: { activa: true },
      include: { emisor: { select: { nombre: true, nit: true } } },
      orderBy: { nombre: 'asc' }
    })
  },

  async guardarSucursal(data: {
    id?: number
    nombre: string
    codMH: string
    puntoVenta: string
    tipoEstab: string
    departamentoCod: string
    municipioCod: string
    complemento: string
    telefono?: string
  }) {
    const emisor = await prisma.emisor.findFirst()
    if (!emisor) throw new Error('Configure primero los datos del emisor')

    if (data.id) {
      const { id, ...rest } = data
      return prisma.sucursal.update({ where: { id }, data: rest })
    }
    return prisma.sucursal.create({
      data: { ...data, emisorId: emisor.id, activa: true }
    })
  },

  async desactivarSucursal(id: number) {
    return prisma.sucursal.update({ where: { id }, data: { activa: false } })
  }
}
