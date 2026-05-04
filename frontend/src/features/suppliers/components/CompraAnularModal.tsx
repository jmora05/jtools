import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/shared/components/ui/dialog';
import { AlertTriangle, BanIcon, Loader2 } from 'lucide-react';
import type { Compra } from '../types/compra.types';

interface CompraAnularModalProps {
    open: boolean;
    onClose: () => void;
    anulatingCompra: Compra | null;
    saving: boolean;
    onConfirm: () => Promise<void>;
}

export function CompraAnularModal({
    open, onClose, anulatingCompra, saving, onConfirm,
}: CompraAnularModalProps) {
    const [anularConfirmed, setAnularConfirmed] = useState(false);

    // Resetear confirmación cuando el modal se cierra o cambia la compra
    useEffect(() => {
        if (!open) setAnularConfirmed(false);
    }, [open]);

    const handleClose = () => {
        setAnularConfirmed(false);
        onClose();
    };

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
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            disabled={saving}
                        >
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
                                onClick={onConfirm}
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
