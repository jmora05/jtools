import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent } from '@/shared/components/ui/dialog';
import {
    X, Package, XCircleIcon, AlertTriangle,
    Tag, Boxes, Loader2, ShoppingCart,
} from 'lucide-react';

export interface Producto {
    id: number;
    nombreProducto: string;
    referencia: string;
    precio: number | string;
    stock: number;
    descripcion?: string | null;
    estado: 'activo' | 'inactivo';
    imagenUrl?: string | null;
    categoriaProductoId?: number;
    categoria?: { id: number; nombreCategoria: string } | null;
}

interface ProductoDetailModalProps {
    open: boolean;
    onClose: () => void;
    producto: Producto | null;
    loadingDetail?: boolean;
    onAddToCart?: (producto: Producto) => void;
    isInCart?: (id: number) => boolean;
}

function ImagePanel({ src, alt, id }: { src?: string | null; alt: string; id: number }) {
    const [error, setError] = useState(false);
    const showFallback = !src || error;
    return (
        <div className="relative h-full min-h-[460px] overflow-hidden rounded-l-[20px]">
            {showFallback ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-100 to-slate-200">
                    <div className="w-24 h-24 rounded-3xl bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-inner">
                        <Package className="w-10 h-10 text-slate-400" />
                    </div>
                    <span className="text-sm text-slate-400 font-medium">Sin imagen</span>
                </div>
            ) : (
                <img
                    src={src!}
                    alt={alt}
                    onError={() => setError(true)}
                    className="absolute inset-0 w-full h-full object-cover"
                />
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 pointer-events-none" />
            {/* ID badge */}
            <div className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-black/40 backdrop-blur-md text-white/90 text-xs font-mono rounded-full px-3 py-1.5 border border-white/10">
                <Package className="w-3 h-3" />
                #{id}
            </div>
        </div>
    );
}

export function ProductoDetailModal({ open, onClose, producto, loadingDetail, onAddToCart, isInCart }: ProductoDetailModalProps) {
    const sinStock  = (producto?.stock ?? 0) === 0;
    const isActivo  = (producto?.estado ?? 'activo') === 'activo';
    const enCarrito = producto && isInCart ? isInCart(producto.id) : false;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                hideCloseButton
                className="p-0 overflow-hidden"
                style={{
                    maxWidth: 880,
                    width: '94vw',
                    maxHeight: '90vh',
                    borderRadius: 20,
                    display: 'grid',
                    gridTemplateColumns: '360px 1fr',
                    boxShadow: '0 30px 70px rgba(0,0,0,0.20), 0 0 0 1px rgba(0,0,0,0.06)',
                }}
            >
                {/* ── Spinner (full grid) ── */}
                {loadingDetail && (
                    <div className="col-span-2 flex items-center justify-center" style={{ height: 460 }}>
                        <Loader2 className="w-9 h-9 animate-spin text-slate-400" />
                    </div>
                )}

                {!loadingDetail && producto && (
                    <>
                        {/* ── LEFT: imagen a sangre ── */}
                        <ImagePanel
                            key={producto.id}
                            src={producto.imagenUrl}
                            alt={producto.nombreProducto}
                            id={producto.id}
                        />

                        {/* ── RIGHT: info ── */}
                        <div className="flex flex-col bg-white rounded-r-[20px] overflow-hidden" style={{ maxHeight: '90vh' }}>

                            {/* Header row: badges + close */}
                            <div className="flex items-center justify-between px-8 pt-7 pb-0 flex-shrink-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ring-1 ${
                                        isActivo
                                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                                            : 'bg-slate-100 text-slate-500 ring-slate-200'
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActivo ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                        {isActivo ? 'Activo' : 'Inactivo'}
                                    </span>
                                    {sinStock && (
                                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 ring-1 ring-red-200">
                                            <AlertTriangle className="w-3 h-3" />
                                            Sin stock
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Body scrollable */}
                            <div className="flex-1 overflow-y-auto px-8 pt-5 pb-6">

                                {/* Nombre */}
                                <h2 className="text-[1.55rem] font-black text-slate-900 leading-snug mb-1" style={{ letterSpacing: '-0.03em' }}>
                                    {producto.nombreProducto}
                                </h2>
                                <p className="text-xs text-slate-400 font-mono tracking-wide mb-7">
                                    REF: {producto.referencia}
                                </p>

                                {/* Precio */}
                                <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-1.5">
                                    Precio unitario
                                </p>
                                <div className="flex items-baseline gap-2 mb-7">
                                    <span
                                        className="text-[2.6rem] font-black text-slate-900 leading-none"
                                        style={{ letterSpacing: '-0.045em' }}
                                    >
                                        ${Number(producto.precio).toLocaleString('es-CO')}
                                    </span>
                                    <span className="text-sm font-semibold text-slate-400">COP</span>
                                </div>

                                {/* Divider */}
                                <div className="border-t border-slate-100 mb-5" />

                                {/* Chips: stock + categoría */}
                                <div className="flex flex-wrap gap-2 mb-6">
                                    <span className={`inline-flex items-center gap-2 text-sm font-semibold px-3.5 py-2 rounded-xl ${
                                        sinStock
                                            ? 'bg-red-50 text-red-600'
                                            : 'bg-blue-50 text-blue-700'
                                    }`}>
                                        <Boxes className="w-4 h-4" />
                                        {sinStock ? 'Sin stock' : `${Number(producto.stock).toLocaleString()} en stock`}
                                    </span>
                                    {producto.categoria && (
                                        <span className="inline-flex items-center gap-2 text-sm font-semibold px-3.5 py-2 rounded-xl bg-slate-100 text-slate-600">
                                            <Tag className="w-4 h-4" />
                                            {producto.categoria.nombreCategoria}
                                        </span>
                                    )}
                                </div>

                                {/* Descripción */}
                                {producto.descripcion && (
                                    <div>
                                        <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-2">
                                            Descripción
                                        </p>
                                        <p className="text-sm text-slate-600 leading-[1.8] whitespace-pre-line">
                                            {producto.descripcion}
                                        </p>
                                    </div>
                                )}

                                {/* Aviso inactivo */}
                                {!isActivo && (
                                    <div className="mt-5 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
                                        <XCircleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        <span>Este producto no es visible en el catálogo de clientes.</span>
                                    </div>
                                )}
                            </div>

                            {/* Acciones */}
                            <div className="px-8 pb-7 pt-4 flex gap-3 flex-shrink-0 border-t border-slate-100">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onClose}
                                    className="flex-1 h-10 text-sm font-semibold"
                                >
                                    Cerrar
                                </Button>
                                {onAddToCart && (
                                    <Button
                                        size="sm"
                                        disabled={sinStock}
                                        onClick={() => { onAddToCart(producto); if (!sinStock) onClose(); }}
                                        className="flex-1 h-10 text-sm font-semibold"
                                        style={{
                                            background: sinStock ? '#f1f5f9' : '#0f172a',
                                            color: sinStock ? '#94a3b8' : '#fff',
                                            border: 'none',
                                            cursor: sinStock ? 'not-allowed' : 'pointer',
                                        }}
                                    >
                                        <ShoppingCart className="w-4 h-4 mr-2" />
                                        {sinStock ? 'Sin stock' : enCarrito ? 'Añadir otra' : 'Agregar al carrito'}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
