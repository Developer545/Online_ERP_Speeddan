import { useEffect } from 'react'
import { Modal, Form, Select, InputNumber, Input, Alert, Typography } from 'antd'

interface Props {
  open: boolean
  producto?: ProductoRow | null
  onOk: (data: { tipoMovimiento: string; cantidad: number; costoUnitario: number; referencia: string; notas?: string }) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

const { Text } = Typography

export default function AjusteStockModal({ open, producto, onOk, onCancel, loading }: Props) {
  const [form] = Form.useForm()
  const tipo = Form.useWatch('tipoMovimiento', form) as string | undefined
  const stockActual = Number(producto?.stockActual ?? 0)

  useEffect(() => {
    if (open) {
      form.resetFields()
      form.setFieldsValue({
        tipoMovimiento: 'ENTRADA',
        costoUnitario: Number(producto?.costoPromedio ?? 0)
      })
    }
  }, [open, producto, form])

  const handleOk = async () => {
    const values = await form.validateFields()
    await onOk(values)
  }

  const cantidad = Form.useWatch('cantidad', form) as number | undefined

  const stockResultante = () => {
    const c = cantidad ?? 0
    if (tipo === 'SALIDA') return stockActual - c
    if (tipo === 'AJUSTE') return c
    return stockActual + c
  }

  const resultante = stockResultante()

  return (
    <Modal
      title={producto ? `Ajuste de Stock — ${producto.nombre}` : 'Ajuste de Stock'}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText="Registrar movimiento"
      cancelText="Cancelar"
      confirmLoading={loading}
      width={480}
      destroyOnClose
    >
      {producto && (
        <Alert
          type="info"
          showIcon={false}
          style={{ marginBottom: 16 }}
          message={
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span><Text type="secondary">Stock actual:</Text></span>
              <Text strong style={{ fontSize: 16 }}>
                {stockActual.toFixed(2)}
              </Text>
            </div>
          }
        />
      )}

      <Form form={form} layout="vertical">
        <Form.Item label="Tipo de Movimiento" name="tipoMovimiento" rules={[{ required: true }]}>
          <Select
            options={[
              { value: 'ENTRADA', label: 'Entrada (incrementa stock)' },
              { value: 'SALIDA', label: 'Salida (reduce stock)' },
              { value: 'AJUSTE', label: 'Ajuste (stock absoluto)' }
            ]}
          />
        </Form.Item>

        <Form.Item
          label={tipo === 'AJUSTE' ? 'Cantidad Final de Stock' : 'Cantidad'}
          name="cantidad"
          rules={[
            { required: true, type: 'number', min: 0.01, message: 'Ingrese una cantidad válida' },
            () => ({
              validator(_, val) {
                if (tipo === 'SALIDA' && val > stockActual)
                  return Promise.reject(`Stock insuficiente. Máximo: ${stockActual}`)
                return Promise.resolve()
              }
            })
          ]}
        >
          <InputNumber style={{ width: '100%' }} min={0.01} precision={2} step={1} />
        </Form.Item>

        <Form.Item
          label="Costo Unitario"
          name="costoUnitario"
          rules={[{ required: true, type: 'number', min: 0 }]}
        >
          <InputNumber style={{ width: '100%' }} prefix="$" precision={2} min={0} step={0.01} />
        </Form.Item>

        <Form.Item
          label="Referencia"
          name="referencia"
          rules={[{ required: true, message: 'Ingrese una referencia (ej: Compra #001)' }]}
        >
          <Input placeholder="Compra #001, Ajuste físico, etc." />
        </Form.Item>

        <Form.Item label="Notas (opcional)" name="notas">
          <Input.TextArea rows={2} placeholder="Observaciones adicionales" />
        </Form.Item>

        {cantidad && (
          <Alert
            type={resultante < 0 ? 'error' : resultante <= Number(producto?.stockMinimo ?? 0) ? 'warning' : 'success'}
            showIcon
            message={
              <span>
                Stock resultante: <Text strong>{resultante.toFixed(2)}</Text>
                {resultante < 0 && ' — NEGATIVO, no permitido'}
                {resultante >= 0 && resultante <= Number(producto?.stockMinimo ?? 0) && ' — Por debajo del stock mínimo'}
              </span>
            }
          />
        )}
      </Form>
    </Modal>
  )
}
