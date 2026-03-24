import { prisma } from '../database/prisma.client'

export const pagosCxpController = {
    async registrarPago(data: {
        compraId: number
        monto: number
        metodoPago: string
        referencia?: string
        notas?: string
    }) {
        // 1. Validar compra y calcular saldo actual
        const compra = await prisma.compra.findUnique({
            where: { id: data.compraId },
            include: { pagos: true } as any
        }) as any

        if (!compra) throw new Error('Compra no encontrada')
        if (compra.condicionPago === 'CONTADO') throw new Error('Esta compra es de contado, no requiere abonos')

        const totalAbonado = compra.pagos.reduce((acc: number, p: any) => acc + Number(p.monto), 0)
        const saldoPendiente = Number(compra.total) - totalAbonado

        if (data.monto <= 0) throw new Error('El monto del abono debe ser mayor a cero')
        if (data.monto > saldoPendiente) {
            throw new Error(`El abono ($${data.monto}) supera el saldo pendiente ($${saldoPendiente.toFixed(2)})`)
        }

        // 2. Registrar el pago
        const pago = await (prisma as any).pagoCxP.create({
            data: {
                compraId: data.compraId,
                monto: data.monto,
                metodoPago: data.metodoPago,
                referencia: data.referencia,
                notas: data.notas
            }
        })

        // 3. Si queda saldo cero, marcar compra como pagada
        const nuevoAbonado = totalAbonado + data.monto
        if (nuevoAbonado >= Number(compra.total)) {
            await prisma.compra.update({
                where: { id: data.compraId },
                data: { estado: 'PAGADA' } as any
            })
        }

        return pago
    },

    async historial(compraId: number) {
        return (prisma as any).pagoCxP.findMany({
            where: { compraId },
            orderBy: { createdAt: 'desc' }
        })
    },

    async anularPago(pagoId: number) {
        const pago = await (prisma as any).pagoCxP.findUnique({ where: { id: pagoId } })
        if (!pago) throw new Error('Pago no encontrado')

        await (prisma as any).pagoCxP.delete({ where: { id: pagoId } })

        // Reactivar compra como REGISTRADA si tenía estado PAGADA
        const compra = await prisma.compra.findUnique({
            where: { id: pago.compraId }
        }) as any
        if (compra?.estado === 'PAGADA') {
            await prisma.compra.update({
                where: { id: pago.compraId },
                data: { estado: 'REGISTRADA' } as any
            })
        }

        return true
    }
}
