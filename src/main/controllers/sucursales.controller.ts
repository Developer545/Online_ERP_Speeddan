import { getPrismaClient } from '@main/database/prisma.client'

const db = getPrismaClient()

export class SucursalesController {

  static async listar() {
    return db.sucursal.findMany({
      where: { activa: true },
      include: { emisor: { select: { nombre: true, nit: true, nrc: true } } },
      orderBy: { nombre: 'asc' }
    })
  }

  static async getEmisorActivo() {
    return db.emisor.findFirst({
      include: { sucursales: { where: { activa: true } } }
    })
  }
}
