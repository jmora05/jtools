export interface VentaFormValues {
  clientId: string;
  clientName: string;
  paymentMethod: string;
  items: { id: string; quantity: number; price: number }[];
}

export interface VentaFormErrors {
  clientId?: string;
  paymentMethod?: string;
  items?: string;
}

export const validateVentaForm = (form: VentaFormValues): VentaFormErrors => {
  const errors: VentaFormErrors = {};

  if (!form.clientId.trim())
    errors.clientId = 'Debes seleccionar un cliente.';

  if (!form.paymentMethod)
    errors.paymentMethod = 'El método de pago es obligatorio.';

  if (!form.items || form.items.length === 0)
    errors.items = 'Agrega al menos un producto a la venta.';
  else if (form.items.some((i) => i.quantity < 1))
    errors.items = 'Todos los productos deben tener cantidad mínima de 1.';
  else if (form.items.some((i) => i.price <= 0))
    errors.items = 'Todos los productos deben tener un precio mayor a 0.';

  return errors;
};

export const isVentaFormValid = (form: VentaFormValues): boolean =>
  Object.keys(validateVentaForm(form)).length === 0;