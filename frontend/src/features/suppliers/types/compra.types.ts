export interface Proveedor {
    id: number;
    nombreEmpresa: string;
    personaContacto: string;
    telefono: string;
    email: string;
    estado?: string;
}

export interface Insumo {
    id: number;
    nombreInsumo: string;
    codigoInsumo?: string;
    unidadMedida: string;
    precioUnitario?: number;
    cantidad?: number;
}

export interface DetalleCompra {
    id?: number;
    insumosId: number;
    cantidad: number;
    precioUnitario: number;
    insumo?: Insumo;
}

export interface Compra {
    id: number;
    proveedoresId: number;
    fecha: string;
    metodoPago: string;
    estado?: string;
    proveedor?: Proveedor;
    detalles?: DetalleCompra[];
}

export interface ItemCarrito {
    insumoId: number;
    nombre: string;
    unidad: string;
    precio: number;
    cantidad: number;
}

export interface CompraFormData {
    proveedoresId: string;
    fecha: string;
    metodoPago: string;
    estado: string;
    notas: string;
    numeroFactura: string;
}

export interface CompraFormErrors {
    proveedoresId?: string;
    fecha?: string;
    metodoPago?: string;
    notas?: string;
    numeroFactura?: string;
}

export interface CarritoItemError {
    precio?: string;
    cantidad?: string;
}
