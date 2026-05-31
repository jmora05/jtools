import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/shared/components/ui/dialog';
import { AlertTriangle, BanIcon, Loader2, PackageCheck } from 'lucide-react';
import type { Compra } from '../types/compra.types';

interface InsumoDev {
    id: number;
    nombreInsumo: string;
    cantidadDevuelta: number;
    cantidadAnterior: number;
    cantidadNueva: number;
}

interface AnularResult {
    stockDevuelto: boolean;
    insumosDevueltos: InsumoDev[];
}

interface CompraAnularModalProps {
    open: boolean;
    onClose: () => void;
    anulatingCompra: Compra | null;
    saving: boolean;
    onConfirm: () => Promise<AnularResult | void>;
}

export function CompraAnularModal({
    open, onClose, anulatingCompra, saving, onConfirm,
}: CompraAnularModalProps) {
    const [anularConfirmed, setAnularConfirmed]   = useState(false);
    const [resultado, setResultado]               = useState<AnularResult | null>(null);

    useEffect(() => {
        if (!open) {
            setAnularConfirmed(false);
            setResultado(null);
        }
    }, [open]);

    const handleClose = () => {
        setAnularConfirmed(false);
        setResultado(null);
        onClose();
    };

    const handleConfirm = async () => {
        const res = await onConfirm();
        if (res) setResultado(res as AnularResult);
    };

    // Mostrar resumen de insumos devueltos tras anular
    if (resultado) {
        return (
            <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
                <DialogContent className="max-w-md p-0">
                    <div className="p-6 space-y-4">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-blue-900">
                                <BanIcon className="w-5 h-5" />Compra anulada
                            </DialogTitle>
                            <DialogDescription>
                                La compra #{anulatingCompra?.id} fue anulada exitosamente.
                            </DialogDescription>
                        </DialogHeader>

                        {resultado.stockDevuelto && resultado.insumosDevueltos.length > 0 ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 rounded-lg px-4 py-3 text-sm">
                                    <PackageCheck className="w-4 h-4 shrink-0" />
                                    <span className="font-medium">Stock devuelto al inventario de insumos</span>
                                </div>
                                <div className="divide-y rounded-lg border overflow-hidden">
                                    {resultado.insumosDevueltos.map((ins) => (
                                        <div key={ins.id} className="flex items-center justify-between px-4 py-3 bg-white">
                                            <span className="text-sm font-medium text-gray-800">{ins.nombreInsumo}</span>
                                            <div className="text-right text-xs text-gray-500 space-y-0.5">
                                                <p>
                                                    <span className="text-red-500 line-through">{ins.cantidadAnterior}</span>
                                                    {' → '}
                                                    <span className="text-green-700 font-semibold">{ins.cantidadNueva}</span>
                                                    <span className="ml-1 text-gray-400">(+{ins.cantidadDevuelta} devueltos)</span>
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">
                                La compra estaba en estado <strong>pendiente</strong>, no se habían sumado insumos al inventario.
                            </p>
                        )}

                        <div className="flex justify-end pt-2 border-t">
                            <Button onClick={handleClose} className="bg-blue-600 hover:bg-blue-700 text-white">
                                Cerrar
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
            <DialogContent className="max-w-md p-0">
                <div className="p-6">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-blue-900">
                            <BanIcon className="w-5 h-5" />Anular compra
                        </DialogTitle>
                        <DialogDescription>
                            La compra pasará a estado "anulada". Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>

                    {anulatingCompra && (
                        <div className="mt-4 space-y-3">
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="font-mono font-semibold text-blue-900">#{anulatingCompra.id}</p>
                                <p className="text-sm text-blue-700 mt-1">
                                    {anulatingCompra.proveedor?.nombreEmpresa ?? `Proveedor #${anulatingCompra.proveedoresId}`}
                                </p>
                                <p className="text-sm text-blue-700">
                                    {new Date(anulatingCompra.fecha.split('T')[0] + 'T12:00:00').toLocaleDateString('es-CO')}
                                    {' · '}
                                    <span className="capitalize">{anulatingCompra.metodoPago}</span>
                                </p>
                                {anulatingCompra.estado === 'completada' && (
                                    <p className="text-xs text-amber-700 mt-2 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                                        ⚠️ Esta compra está completada. Al anularla, los insumos se devolverán al inventario.
                                    </p>
                                )}
                            </div>

                            {!anularConfirmed ? (
                                <p className="text-sm text-gray-600">
                                    ¿Estás seguro de que deseas anular esta compra permanentemente?
                                </p>
                            ) : (
                                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg px-4 py-3 text-sm">
                                    <AlertTriangle className="w-4 h-4 shrink-0 text-blue-600" />
                                    Confirma que entiendes que esta acción es irreversible.
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                        <Button variant="outline" onClick={handleClose} disabled={saving}>
                            Volver
                        </Button>
                        {!anularConfirmed ? (
                            <Button
                                onClick={() => setAnularConfirmed(true)}
                                className="bg-white hover:bg-red-50 text-blue-900 border border-blue-900"
                            >
                                Sí, anular
                            </Button>
                        ) : (
                            <Button
                                onClick={handleConfirm}
                                disabled={saving}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                Confirmar anulación
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
