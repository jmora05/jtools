import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/shared/components/ui/dialog';
import { toast } from 'sonner';
import { AlertTriangle, Loader2, Trash2, PackageX, CheckCircle2 } from 'lucide-react';
import type { Compra } from '../types/compra.types';
import { registrarMerma } from '../services/comprasService';

interface MermaItem {
    insumosId: number;
    nombreInsumo: string;
    unidadMedida: string;
    cantidadComprada: number;
    cantidadDefectuosa: number | '';
}

interface CompraMermaModalProps {
    open: boolean;
    onClose: () => void;
    compra: Compra | null;
    onSuccess: () => void;
}

export function CompraMermaModal({ open, onClose, compra, onSuccess }: CompraMermaModalProps) {
    const [items, setItems]         = useState<MermaItem[]>([]);
    const [motivo, setMotivo]       = useState('');
    const [saving, setSaving]       = useState(false);
    const [resultado, setResultado] = useState<any>(null);

    useEffect(() => {
        if (open && compra?.detalles) {
            setItems(
                compra.detalles.map((d) => ({
                    insumosId:          d.insumosId,
                    nombreInsumo:       d.insumo?.nombreInsumo ?? `Insumo #${d.insumosId}`,
                    unidadMedida:       d.insumo?.unidadMedida ?? '',
                    cantidadComprada:   Math.round(Number(d.cantidad)),
                    cantidadDefectuosa: '',
                }))
            );
            setMotivo('');
            setResultado(null);
        }
    }, [open, compra]);

    const handleClose = () => {
        setItems([]);
        setMotivo('');
        setResultado(null);
        onClose();
    };

    const updateCantidad = (insumosId: number, valor: string) => {
        const num = valor === '' ? '' : Math.max(0, parseInt(valor) || 0);
        setItems((prev) =>
            prev.map((it) =>
                it.insumosId === insumosId ? { ...it, cantidadDefectuosa: num } : it
            )
        );
    };

    const itemsConDefecto = items.filter(
        (it) => it.cantidadDefectuosa !== '' && (it.cantidadDefectuosa as number) > 0
    );

    const handleSubmit = async () => {
        if (!compra) return;

        for (const it of itemsConDefecto) {
            if ((it.cantidadDefectuosa as number) > it.cantidadComprada) {
                toast.error(
                    `"${it.nombreInsumo}": la cantidad defectuosa (${it.cantidadDefectuosa}) no puede superar la cantidad comprada (${it.cantidadComprada}).`
                );
                return;
            }
        }

        if (itemsConDefecto.length === 0) {
            toast.error('Debes ingresar al menos un insumo con cantidad defectuosa mayor a 0.');
            return;
        }

        try {
            setSaving(true);
            const res = await registrarMerma(
                compra.id,
                itemsConDefecto.map((it) => ({
                    insumosId: it.insumosId,
                    cantidad:  it.cantidadDefectuosa as number,
                })),
                motivo.trim() || undefined
            );
            setResultado(res);
            onSuccess();
        } catch (error: any) {
            const msg = error?.message ?? error?.errores?.[0]?.mensaje ?? 'Error al registrar el descuento';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    // ── Pantalla de resultado ─────────────────────────────────────────────────
    if (resultado) {
        return (
            <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
                <DialogContent className="max-w-md p-0">
                    <div className="p-6 space-y-4">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-blue-900">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                Insumos descontados
                            </DialogTitle>
                            <DialogDescription>
                                Los insumos defectuosos fueron descontados del inventario.
                            </DialogDescription>
                        </DialogHeader>

                        {resultado.motivo && resultado.motivo !== 'Sin motivo especificado' && (
                            <p className="text-sm text-gray-500 italic">Motivo: {resultado.motivo}</p>
                        )}

                        <div className="divide-y rounded-lg border overflow-hidden">
                            {resultado.mermaRegistrada?.map((ins: any) => (
                                <div key={ins.id} className="flex items-center justify-between px-4 py-3 bg-white">
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{ins.nombreInsumo}</p>
                                        <p className="text-xs text-red-500">−{ins.cantidadDefectuosa} defectuosos descontados</p>
                                    </div>
                                    <div className="text-right text-xs text-gray-500">
                                        <span className="line-through text-gray-400">{ins.cantidadAnterior}</span>
                                        {' → '}
                                        <span className="font-semibold text-blue-800">{ins.cantidadNueva}</span>
                                        <span className="text-gray-400 ml-1">en inv.</span>
                                    </div>
                                </div>
                            ))}
                        </div>

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

    // ── Formulario principal ──────────────────────────────────────────────────
    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
            <DialogContent className="max-w-lg p-0 flex flex-col max-h-[88vh]">
                <div className="overflow-y-auto flex-1 p-6">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-blue-900">
                            <PackageX className="w-5 h-5" />
                            Descontar insumos defectuosos
                        </DialogTitle>
                        <DialogDescription>
                            Compra #{compra?.id} · Ingresa la cantidad defectuosa por insumo. Se descontará del inventario.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4 space-y-4">
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-4 py-3 text-sm">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            Esta acción descuenta insumos del inventario de forma permanente.
                        </div>

                        {/* Lista de insumos */}
                        <div className="divide-y rounded-lg border overflow-hidden">
                            {items.map((it) => {
                                const defectuoso = it.cantidadDefectuosa;
                                const superaMax  = typeof defectuoso === 'number' && defectuoso > it.cantidadComprada;
                                return (
                                    <div key={it.insumosId} className="px-4 py-3 bg-white flex items-center gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{it.nombreInsumo}</p>
                                            <p className="text-xs text-gray-500">
                                                Comprado: {it.cantidadComprada} {it.unidadMedida}
                                            </p>
                                        </div>
                                        <div className="shrink-0 w-28">
                                            <Input
                                                type="number"
                                                min={0}
                                                max={it.cantidadComprada}
                                                placeholder="0"
                                                value={defectuoso}
                                                onChange={(e) => updateCantidad(it.insumosId, e.target.value)}
                                                className={`text-center h-8 text-sm ${superaMax ? 'border-red-400 focus:ring-red-300' : ''}`}
                                            />
                                            {superaMax && (
                                                <p className="text-xs text-red-500 mt-0.5 text-center">Máx: {it.cantidadComprada}</p>
                                            )}
                                        </div>
                                        <button
                                            className="text-gray-300 hover:text-gray-500 shrink-0"
                                            title="Limpiar cantidad"
                                            onClick={() => updateCantidad(it.insumosId, '')}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Resumen de selección */}
                        {itemsConDefecto.length > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800 space-y-1">
                                <p className="font-semibold">Se descontarán del inventario:</p>
                                {itemsConDefecto.map((it) => (
                                    <p key={it.insumosId} className="text-xs">
                                        · {it.nombreInsumo}: <strong>{it.cantidadDefectuosa}</strong> {it.unidadMedida}
                                    </p>
                                ))}
                            </div>
                        )}

                        {/* Motivo */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">
                                Motivo <span className="text-gray-400 font-normal">(opcional)</span>
                            </label>
                            <textarea
                                rows={2}
                                maxLength={500}
                                placeholder="Ej: Insumos llegaron golpeados, material oxidado..."
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                className="w-full text-sm border rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer fijo */}
                <div className="border-t px-6 py-4 flex justify-end gap-2 bg-white">
                    <Button variant="outline" onClick={handleClose} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={saving || itemsConDefecto.length === 0}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        <PackageX className="w-4 h-4 mr-2" />
                        Descontar insumos
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}