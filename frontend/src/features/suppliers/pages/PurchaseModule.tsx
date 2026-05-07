import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent } from '@/shared/components/ui/card';
import { toast } from 'sonner';
import {
    Search, Plus, Edit, Eye, ShoppingCart, ChevronLeft, ChevronRight,
    Loader2, Lock, X, BanIcon,
    TruckIcon, CheckCircleIcon, ClockIcon,
} from 'lucide-react';

import {
    getCompras, getCompraById, createCompra, updateCompra,
    deleteCompra, getProveedores, getInsumos,
} from '../../suppliers/services/comprasService';
import { updateInsumo } from '../../suppliers/services/insumosService';

import { CompraFormModal }   from '../components/CompraFormModal';
import { CompraDetailModal } from '../components/CompraDetailModal';
import { CompraAnularModal } from '../components/CompraAnularModal';

import type {
    Proveedor, Insumo, Compra,
    ItemCarrito, CompraFormData,
} from '../types/compra.types';

// ─── Constantes ───────────────────────────────────────────────────────────────
const EDIT_LIMIT_DAYS = 5;
const IVA_DEFAULT     = 19;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isEditableByDate = (fecha: string): boolean => {
    const purchaseDate = new Date(fecha.split('T')[0] + 'T12:00:00');
    const diffDays = (Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= EDIT_LIMIT_DAYS;
};

// ─── Componentes UI locales ───────────────────────────────────────────────────
const BlockedAlert = ({ message, onClose }: { message: string; onClose: () => void }) => (
    <div className="flex items-center justify-between bg-gray-100 border border-gray-300 text-gray-600 rounded-lg px-4 py-2 text-sm">
        <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0 text-gray-500" />
            <span>{message}</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-4 shrink-0">
            <X className="w-4 h-4" />
        </button>
    </div>
);

const EstadoBadge = ({ estado }: { estado: string }) => {
    const config: Record<string, { icon: React.ReactNode; clase: string }> = {
        pendiente:     { icon: <ClockIcon className="w-3 h-3 mr-1" />,       clase: 'bg-amber-50 text-amber-700 border border-amber-200' },
        'en transito': { icon: <TruckIcon className="w-3 h-3 mr-1" />,       clase: 'bg-blue-100 text-blue-800 border border-blue-300' },
        completada:    { icon: <CheckCircleIcon className="w-3 h-3 mr-1" />, clase: 'bg-green-50 text-green-700 border border-green-200' },
        anulada:       { icon: <BanIcon className="w-3 h-3 mr-1" />,         clase: 'bg-red-50 text-red-600 border border-red-200' },
    };
    const { icon, clase } = config[estado] ?? { icon: null, clase: 'bg-gray-100 text-gray-600' };
    return (
        <Badge className={`flex items-center w-fit ${clase}`}>
            {icon}{estado.charAt(0).toUpperCase() + estado.slice(1)}
        </Badge>
    );
};

// ─── Componente principal ─────────────────────────────────────────────────────
export function PurchaseModule() {
    const [compras, setCompras]         = useState<Compra[]>([]);
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [insumos, setInsumos]         = useState<Insumo[]>([]);
    const [loading, setLoading]         = useState(true);
    const [saving, setSaving]           = useState(false);

    const [searchTerm, setSearchTerm]   = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const [showModal, setShowModal]             = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showAnularModal, setShowAnularModal] = useState(false);

    const [editingCompra, setEditingCompra]     = useState<Compra | null>(null);
    const [viewingCompra, setViewingCompra]     = useState<Compra | null>(null);
    const [anulatingCompra, setAnulatingCompra] = useState<Compra | null>(null);
    const [loadingDetail, setLoadingDetail]     = useState(false);

    const [blockedAlertId, setBlockedAlertId]   = useState<number | null>(null);
    const [blockedAlertMsg, setBlockedAlertMsg] = useState('');

    const [ivaRate, setIvaRate] = useState<number>(IVA_DEFAULT);

    // ── Carga de datos ─────────────────────────────────────────────────────
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [comprasData, proveedoresData, insumosData] = await Promise.all([
                getCompras(), getProveedores(), getInsumos(),
            ]);
            setCompras(comprasData);
            setProveedores(proveedoresData.filter((p: Proveedor) => p.estado !== 'inactivo'));
            setInsumos(insumosData);
        } catch (error: any) {
            toast.error(`Error al cargar datos: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { setCurrentPage(1); }, [searchTerm]);

    // ── Filtrado y paginación ──────────────────────────────────────────────
    const filteredCompras = compras.filter((c) => {
        const term = searchTerm.toLowerCase();
        return (
            (c.proveedor?.nombreEmpresa ?? '').toLowerCase().includes(term) ||
            c.id.toString().includes(term)
        );
    });

    const totalPages   = Math.ceil(filteredCompras.length / itemsPerPage);
    const currentItems = filteredCompras.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // ── Guardar (crear / editar) ───────────────────────────────────────────
    const handleSaveCompra = async (formData: CompraFormData, carrito: ItemCarrito[]) => {
        const detalles = carrito.map((i) => ({
            insumosId:      i.insumoId,
            cantidad:       i.cantidad,
            precioUnitario: i.precio,
        }));

        try {
            setSaving(true);

            if (editingCompra) {
                await updateCompra(editingCompra.id, {
                    proveedoresId: parseInt(formData.proveedoresId),
                    fecha:         formData.fecha,
                    metodoPago:    formData.metodoPago,
                });

                const proveedorActual = proveedores.find(
                    (p) => p.id === parseInt(formData.proveedoresId)
                );
                setCompras((prev) => prev.map((c) => {
                    if (c.id !== editingCompra.id) return c;
                    return {
                        ...c,
                        proveedoresId: parseInt(formData.proveedoresId),
                        fecha:         formData.fecha + 'T00:00:00.000Z',
                        metodoPago:    formData.metodoPago,
                        proveedor:     proveedorActual ?? c.proveedor,
                        detalles:      detalles.map((d) => ({
                            insumosId:      d.insumosId,
                            cantidad:       d.cantidad,
                            precioUnitario: d.precioUnitario,
                            insumo:         insumos.find((i) => i.id === d.insumosId),
                        })),
                    };
                }));

                toast.success('Compra actualizada exitosamente.');
            } else {
                await createCompra({
                    ...(formData.numeroFactura.trim() ? { id: parseInt(formData.numeroFactura) } : {}),
                    proveedoresId: parseInt(formData.proveedoresId),
                    fecha:         formData.fecha,
                    metodoPago:    formData.metodoPago as 'efectivo' | 'transferencia',
                    estado:        'pendiente',
                    detalles,
                });

                const proveedorId = parseInt(formData.proveedoresId);
                const updateStockPromises = carrito.map(async (item) => {
                    const insumoActual   = insumos.find((i) => i.id === item.insumoId);
                    const cantidadActual = Number(insumoActual?.cantidad ?? 0);
                    return updateInsumo(item.insumoId, {
                        cantidad:       cantidadActual + item.cantidad,
                        estado:         'disponible',
                        proveedoresIds: [proveedorId],
                    });
                });

                await Promise.all(updateStockPromises);
                toast.success('Compra registrada y stock de insumos actualizado.');
            }

            setShowModal(false);
            setEditingCompra(null);
            fetchData();
        } catch (error: any) {
            const errores: any[] = Array.isArray(error.errores) ? error.errores : [];
            const facturaErr = errores.find((e) =>
                (typeof e === 'string' ? e : (e?.mensaje ?? '')).toLowerCase().includes('factura')
            );
            if (facturaErr) {
                toast.error(typeof facturaErr === 'string' ? facturaErr : facturaErr.mensaje);
                return;
            }
            const msg: string = typeof error.message === 'string' ? error.message : 'Error desconocido';
            if (msg.toLowerCase().includes('factura'))        toast.error(msg);
            else if (msg.toLowerCase().includes('proveedor')) toast.error(`Proveedor: ${msg}`);
            else                                               toast.error(`Error al guardar: ${msg}`);
        } finally {
            setSaving(false);
        }
    };

    // ── Ver detalle ────────────────────────────────────────────────────────
    const openViewDialog = async (compra: Compra) => {
        setShowDetailModal(true);
        setViewingCompra(null);
        setLoadingDetail(true);
        try {
            const detail = await getCompraById(compra.id);
            setViewingCompra(detail);
        } catch (error: any) {
            toast.error(`Error al cargar detalle: ${error.message}`);
        } finally {
            setLoadingDetail(false);
        }
    };

    // ── Abrir edición ──────────────────────────────────────────────────────
    const openEditDialog = async (compra: Compra) => {
        if (!isEditableByDate(compra.fecha)) {
            setBlockedAlertId(compra.id);
            setBlockedAlertMsg(
                `Esta compra no puede editarse: han pasado más de ${EDIT_LIMIT_DAYS} días desde su fecha de registro.`
            );
            return;
        }

        setLoadingDetail(true);
        try {
            const detail = await getCompraById(compra.id);
            setEditingCompra(detail);
            setShowModal(true);
        } catch (error: any) {
            toast.error(`Error al cargar la compra: ${error.message}`);
        } finally {
            setLoadingDetail(false);
        }
    };

    // ── Anular compra ──────────────────────────────────────────────────────
    const openAnularDialog = (compra: Compra) => {
        setAnulatingCompra(compra);
        setShowAnularModal(true);
    };

    const confirmAnular = async () => {
        if (!anulatingCompra) return;
        try {
            setSaving(true);
            await deleteCompra(anulatingCompra.id);
            toast.success('Compra anulada exitosamente.');
            setShowAnularModal(false);
            setAnulatingCompra(null);
            fetchData();
        } catch (error: any) {
            const errores: any[] = Array.isArray(error.errores) ? error.errores : [];
            if (errores.length > 0) { toast.error(errores[0].mensaje); return; }
            toast.error(typeof error.message === 'string' ? error.message : 'Error al anular');
        } finally {
            setSaving(false);
        }
    };

    const handleBlockedClick = (compraId: number, msg: string) => {
        setBlockedAlertId((prev) => prev === compraId ? null : compraId);
        setBlockedAlertMsg(msg);
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="p-6 space-y-6">

            {/* ── Encabezado ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl text-blue-900 font-bold mb-1">Compras de insumos</h1>
                    <p className="text-blue-800">Gestión y control de adquisiciones del taller</p>
                </div>
                <Button
                    onClick={() => {
                        setEditingCompra(null);
                        setShowModal(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <Plus className="w-4 h-4 mr-2" />Nueva compra
                </Button>
            </div>

            {/* ── Filtro de búsqueda ── */}
            <Card>
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Buscar por proveedor o N° compra..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="pl-10"
                            maxLength={100}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* ── Tabla ── */}
            {loading ? (
                <div className="flex justify-center items-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-500">Cargando compras...</span>
                </div>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-blue-900">
                                    <tr>
                                        <th className="text-left py-4 px-6 text-black font-semibold">N° Factura</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Proveedor</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Fecha</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Insumos</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">
                                            Total (c/IVA {ivaRate}%)
                                        </th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.map((compra) => {
                                        const isPending = compra.estado === 'pendiente';
                                        const isAnulada = compra.estado === 'anulada';
                                        const canEdit   = isPending && isEditableByDate(compra.fecha);

                                        const subtotal = compra.detalles?.reduce(
                                            (sum, d) => sum + d.cantidad * Number(d.precioUnitario), 0
                                        ) ?? 0;
                                        const totalConIva = subtotal * (1 + ivaRate / 100);

                                        return (
                                            <React.Fragment key={compra.id}>
                                                <tr className={`border-b border-blue-100 transition-colors ${
                                                    isAnulada ? 'bg-gray-50 opacity-60' : 'hover:bg-blue-50'
                                                }`}>
                                                    <td className="py-4 px-6">
                                                        <span className={`font-mono text-sm ${isAnulada ? 'line-through text-gray-400' : 'text-gray-500'}`}>
                                                            #{compra.id}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-blue-900">
                                                                {compra.proveedor?.nombreEmpresa ?? `Proveedor #${compra.proveedoresId}`}
                                                            </span>
                                                            <span className="text-xs text-gray-400 capitalize">{compra.metodoPago}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className="text-gray-600 text-sm">
                                                            {new Date(compra.fecha.split('T')[0] + 'T12:00:00').toLocaleDateString('es-CO')}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        {(compra.detalles?.length ?? 0) > 0 ? (
                                                            <div className="space-y-2 max-h-24 overflow-y-auto pr-1">
                                                                {compra.detalles!.map((d, i) => (
                                                                    <div key={i} className="flex flex-col">
                                                                        <span className="text-xs text-gray-700 font-medium truncate max-w-[150px]" title={d.insumo?.nombreInsumo ?? `Insumo #${d.insumosId}`}>
                                                                            {d.insumo?.nombreInsumo ?? `Insumo #${d.insumosId}`}
                                                                        </span>
                                                                        <span className="text-xs text-blue-600 font-semibold">
                                                                            ×{Math.round(d.cantidad)}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <em className="text-gray-400 text-sm">Sin detalles</em>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className="font-semibold text-blue-900 text-sm">
                                                            {totalConIva > 0
                                                                ? `$${totalConIva.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`
                                                                : '—'}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center space-x-2">
                                                            <Button
                                                                size="sm"
                                                                onClick={() => openViewDialog(compra)}
                                                                className="bg-white text-blue-900 border border-blue-900 hover:bg-blue-50"
                                                                title="Ver detalle"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => {
                                                                    if (canEdit) {
                                                                        openEditDialog(compra);
                                                                    } else {
                                                                        const msg = !isPending
                                                                            ? `Solo se pueden editar compras en estado "pendiente".`
                                                                            : `Solo se pueden editar compras con menos de ${EDIT_LIMIT_DAYS} días desde su fecha.`;
                                                                        handleBlockedClick(compra.id, msg);
                                                                    }
                                                                }}
                                                                className={`border ${canEdit
                                                                    ? 'bg-white text-blue-900 border-blue-900 hover:bg-blue-50'
                                                                    : 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                                                                }`}
                                                                title="Editar"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => {
                                                                    if (isPending) {
                                                                        openAnularDialog(compra);
                                                                    } else {
                                                                        handleBlockedClick(
                                                                            compra.id,
                                                                            isAnulada
                                                                                ? 'Esta compra ya fue anulada.'
                                                                                : `Solo se pueden anular compras en estado "pendiente". Esta compra está en estado "${compra.estado}".`
                                                                        );
                                                                    }
                                                                }}
                                                                className={`border ${isPending
                                                                    ? 'bg-white text-blue-900 border-blue-900 hover:bg-blue-50'
                                                                    : 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                                                                }`}
                                                                title="Anular"
                                                            >
                                                                <BanIcon className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {blockedAlertId === compra.id && (
                                                    <tr>
                                                        <td colSpan={6} className="px-6 pb-3 pt-0">
                                                            <BlockedAlert
                                                                message={blockedAlertMsg}
                                                                onClose={() => setBlockedAlertId(null)}
                                                            />
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {filteredCompras.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p>No se encontraron compras</p>
                                </div>
                            )}
                        </div>

                        {totalPages > 1 && (
                            <div className="border-t px-6 py-4 flex justify-center items-center gap-2">
                                <Button
                                    variant="outline" size="sm"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <Button
                                        key={page} size="sm"
                                        onClick={() => setCurrentPage(page)}
                                        className={currentPage === page ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
                                    >
                                        {page}
                                    </Button>
                                ))}
                                <Button
                                    variant="outline" size="sm"
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ════ MODALES ════ */}
            <CompraFormModal
                open={showModal}
                editingCompra={editingCompra}
                proveedores={proveedores}
                insumos={insumos}
                ivaRate={ivaRate}
                onIvaChange={setIvaRate}
                saving={saving}
                onSave={handleSaveCompra}
                onClose={() => { setShowModal(false); setEditingCompra(null); }}
            />

            <CompraDetailModal
                open={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                viewingCompra={viewingCompra}
                loadingDetail={loadingDetail}
                ivaRate={ivaRate}
            />

            <CompraAnularModal
                open={showAnularModal}
                onClose={() => { setShowAnularModal(false); setAnulatingCompra(null); }}
                anulatingCompra={anulatingCompra}
                saving={saving}
                onConfirm={confirmAnular}
            />
        </div>
    );
}
