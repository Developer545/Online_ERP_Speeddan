import { prisma } from '../database/prisma.client'

export const pagosCxcController = {
    async registrarPago(data: {
        facturaId: number
        monto: number
        metodoPago: string
        referencia?: string
        notas?: string
    }) {
        // 1. Validar factura y calcular saldo actual
        const factura = await prisma.factura.findUnique({
            where: { id: data.facturaId },
            include: { pagos: true } as any
        }) as any

        if (!factura) throw new Error('Factura no encontrada')
        if (factura.estado === 'ANULADO') throw new Error('No se puede abonar a una factura anulada')

        const totalAbonado = factura.pagos.reduce((acc, p) => acc + Number(p.monto), 0)
        const saldoPendiente = Number(factura.totalPagar) - totalAbonado

        if (data.monto <= 0) throw new Error('El monto del abono debe ser mayor a cero')
        if (data.monto > saldoPendiente) {
            throw new Error(`El abono ($${data.monto}) supera el saldo pendiente ($${saldoPendiente.toFixed(2)})`)
        }

        // 2. Registrar el pago
        const pago = await (prisma as any).pagoCxC.create({
            data: {
                facturaId: data.facturaId,
                monto: data.monto,
                metodoPago: data.metodoPago, // 01=Efectivo, 02=Cheque, 03=Transferencia, 04=Tarjeta
                referencia: data.referencia,
                notas: data.notas
            }
        })

        return pago
    },

    async historial(facturaId: number) {
        return (prisma as any).pagoCxC.findMany({
            where: { facturaId },
            orderBy: { createdAt: 'desc' }
        })
    },

    async anularPago(pagoId: number) {
        const pago = await (prisma as any).pagoCxC.findUnique({ where: { id: pagoId } })
        if (!pago) throw new Error('Pago no encontrado')

        await (prisma as any).pagoCxC.delete({
            where: { id: pagoId }
        })

        return true
    }
}
