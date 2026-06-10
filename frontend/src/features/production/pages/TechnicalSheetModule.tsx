import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/shared/components/ui/button';
import { SmartPagination } from '@/shared/components/SmartPagination';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Switch } from '@/shared/components/ui/switch';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/shared/components/ui/dialog';
import { Textarea } from '@/shared/components/ui/textarea';
import { toast } from 'sonner';
import {
    Plus, Search, Eye, Edit, Trash2, AlertTriangle,
    ChevronLeft, ChevronRight, FileText,
    CheckCircle, XCircle, List,
    Calendar, Loader2, CheckCircle2,
    Lock, X, User,
} from 'lucide-react';
import {
    getFichasTecnicas, createFichaTecnica, updateFichaTecnica, deleteFichaTecnica, puedeEliminarFichaTecnica,
    type FichaTecnica, type InsumoFT,
} from '../services/fichaTecnicaService';
import { getApiBaseUrl, buildAuthHeaders, handleResponse } from '../../../services/http';
import { getInsumosDisponibles, type InsumoDisponible } from '../services/insumosService';
import {
    validarInsumoCampos,
    validarFormCrear, validarFormEditar, validarNotasCampo,
    filtrarNotas, filtrarCantidad, filtrarUnidad, contadorTexto,
    type ItemErrors,
} from '../utils/fichaTecnicaValidations';

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Producto = {
    id: number; nombreProducto: string; referencia: string;
    estado: string; categoria?: { id: number; nombreCategoria: string };
};
type FormInfo = { productoId: string; notas: string; estado: 'Activa' | 'Inactiva' };
const EMPTY_FORM: FormInfo = { productoId: '', notas: '', estado: 'Activa' };

// ─── Machine params ───────────────────────────────────────────────────────────
type MR  = { velocidad: string; presion: string };
type MRX = { velocidad: string; presion: string; extra: string };
const EMPTY_MAQUINA = {
    tolva:            { velocidad: '', presion: '' }  as MR,
    inyeccion:        { velocidad: '', presion: '' }  as MR,
    segundaInyeccion: { velocidad: '', presion: '' }  as MR,
    carga:            { velocidad: '', presion: '', extra: '' } as MRX,
    decompresion:     { velocidad: '', presion: '' }  as MR,
    abrir:            { velocidad: '', presion: '' }  as MR,
    cerrar:           { velocidad: '', presion: '' }  as MR,
    seguroMolde:      { velocidad: '', presion: '' }  as MR,
    botador:          { velocidad: '', presion: '', extra: '' } as MRX,
    temperaturas:     { boquilla: '', z1: '', z2: '', z3: '' },
    tiempos:          { enfriamiento: '', pausa: '', retardoInyeccion: '', inyeccion: '', segundaInyeccion: '', descompresion: '' },
};
type MaquinaFormState = typeof EMPTY_MAQUINA;

function toMaquinaPayload(m: MaquinaFormState) {
    const f = (s: string) => (s ? parseFloat(s) || 0 : 0);
    return {
        unidadInyeccion: {
            tolva:            { velocidad: f(m.tolva.velocidad),            presion: f(m.tolva.presion) },
            inyeccion:        { velocidad: f(m.inyeccion.velocidad),        presion: f(m.inyeccion.presion) },
            segundaInyeccion: { velocidad: f(m.segundaInyeccion.velocidad), presion: f(m.segundaInyeccion.presion) },
            carga:            { velocidad: f(m.carga.velocidad),            presion: f(m.carga.presion), contrapresion: f(m.carga.extra) },
            decompresion:     { velocidad: f(m.decompresion.velocidad),     presion: f(m.decompresion.presion) },
        },
        prensa: {
            abrir:       { velocidad: f(m.abrir.velocidad),       presion: f(m.abrir.presion) },
            cerrar:      { velocidad: f(m.cerrar.velocidad),      presion: f(m.cerrar.presion) },
            seguroMolde: { velocidad: f(m.seguroMolde.velocidad), presion: f(m.seguroMolde.presion) },
            botador:     { velocidad: f(m.botador.velocidad),     presion: f(m.botador.presion), numSalidas: f(m.botador.extra) },
        },
        temperaturas: {
            boquilla: f(m.temperaturas.boquilla),
            z1:       f(m.temperaturas.z1),
            z2:       f(m.temperaturas.z2),
            z3:       f(m.temperaturas.z3),
        },
        tiempos: {
            enfriamiento:     f(m.tiempos.enfriamiento),
            pausa:            f(m.tiempos.pausa),
            retardoInyeccion: f(m.tiempos.retardoInyeccion),
            inyeccion:        f(m.tiempos.inyeccion),
            segundaInyeccion: f(m.tiempos.segundaInyeccion),
            descompresion:    f(m.tiempos.descompresion),
        },
    };
}

// ─── Validación de parámetros de máquina (no negativos, no ceros) ────────────
function validarParametrosMaquina(m: MaquinaFormState): string | null {
    const check = (val: string, label: string): string | null => {
        if (!val || val.trim() === '') return null; // vacío = no ingresado, OK
        const num = parseFloat(val);
        if (isNaN(num) || num <= 0) return `${label}: el valor debe ser mayor a 0`;
        return null;
    };
    const errores: string[] = [];
    const p = (e: string | null) => { if (e) errores.push(e); };
    // Unidad de Inyección
    p(check(m.tolva.velocidad,            'Tolva — Velocidad'));
    p(check(m.tolva.presion,              'Tolva — Presión'));
    p(check(m.inyeccion.velocidad,        'Inyección — Velocidad'));
    p(check(m.inyeccion.presion,          'Inyección — Presión'));
    p(check(m.segundaInyeccion.velocidad, '2a Inyección — Velocidad'));
    p(check(m.segundaInyeccion.presion,   '2a Inyección — Presión'));
    p(check(m.carga.velocidad,            'Carga — Velocidad'));
    p(check(m.carga.presion,              'Carga — Presión'));
    p(check(m.carga.extra,               'Carga — Contrapresión'));
    p(check(m.decompresion.velocidad,     'Descompresión — Velocidad'));
    p(check(m.decompresion.presion,       'Descompresión — Presión'));
    // Prensa
    p(check(m.abrir.velocidad,            'Prensa Abrir — Velocidad'));
    p(check(m.abrir.presion,              'Prensa Abrir — Presión'));
    p(check(m.cerrar.velocidad,           'Prensa Cerrar — Velocidad'));
    p(check(m.cerrar.presion,             'Prensa Cerrar — Presión'));
    p(check(m.seguroMolde.velocidad,      'Seguro de Molde — Velocidad'));
    p(check(m.seguroMolde.presion,        'Seguro de Molde — Presión'));
    p(check(m.botador.velocidad,          'Botador — Velocidad'));
    p(check(m.botador.presion,            'Botador — Presión'));
    p(check(m.botador.extra,             'Botador — Nro. Salidas'));
    // Temperaturas
    p(check(m.temperaturas.boquilla,      'Temperatura Boquilla'));
    p(check(m.temperaturas.z1,            'Temperatura Z1'));
    p(check(m.temperaturas.z2,            'Temperatura Z2'));
    p(check(m.temperaturas.z3,            'Temperatura Z3'));
    // Tiempos
    p(check(m.tiempos.enfriamiento,       'Tiempo Enfriamiento'));
    p(check(m.tiempos.pausa,              'Tiempo Pausa'));
    p(check(m.tiempos.retardoInyeccion,   'Tiempo Retardo de inyección'));
    p(check(m.tiempos.inyeccion,          'Tiempo Inyección'));
    p(check(m.tiempos.segundaInyeccion,   'Tiempo 2a Inyección'));
    p(check(m.tiempos.descompresion,      'Tiempo Descompresión'));
    return errores.length > 0 ? errores[0] : null;
}

function fromMaquinaPayload(pm: any): MaquinaFormState {
    if (!pm) return { ...EMPTY_MAQUINA, carga: { ...EMPTY_MAQUINA.carga }, botador: { ...EMPTY_MAQUINA.botador }, temperaturas: { ...EMPTY_MAQUINA.temperaturas }, tiempos: { ...EMPTY_MAQUINA.tiempos } };
    const s = (v: any) => (v != null ? String(v) : '');
    const ui = pm.unidadInyeccion ?? {};
    const pr = pm.prensa ?? {};
    const tm = pm.temperaturas ?? {};
    const ti = pm.tiempos ?? {};
    return {
        tolva:            { velocidad: s(ui.tolva?.velocidad),            presion: s(ui.tolva?.presion) },
        inyeccion:        { velocidad: s(ui.inyeccion?.velocidad),        presion: s(ui.inyeccion?.presion) },
        segundaInyeccion: { velocidad: s(ui.segundaInyeccion?.velocidad), presion: s(ui.segundaInyeccion?.presion) },
        carga:            { velocidad: s(ui.carga?.velocidad),            presion: s(ui.carga?.presion), extra: s(ui.carga?.contrapresion) },
        decompresion:     { velocidad: s(ui.decompresion?.velocidad),     presion: s(ui.decompresion?.presion) },
        abrir:            { velocidad: s(pr.abrir?.velocidad),            presion: s(pr.abrir?.presion) },
        cerrar:           { velocidad: s(pr.cerrar?.velocidad),           presion: s(pr.cerrar?.presion) },
        seguroMolde:      { velocidad: s(pr.seguroMolde?.velocidad),      presion: s(pr.seguroMolde?.presion) },
        botador:          { velocidad: s(pr.botador?.velocidad),          presion: s(pr.botador?.presion), extra: s(pr.botador?.numSalidas) },
        temperaturas:     { boquilla: s(tm.boquilla), z1: s(tm.z1), z2: s(tm.z2), z3: s(tm.z3) },
        tiempos:          { enfriamiento: s(ti.enfriamiento), pausa: s(ti.pausa), retardoInyeccion: s(ti.retardoInyeccion), inyeccion: s(ti.inyeccion), segundaInyeccion: s(ti.segundaInyeccion), descompresion: s(ti.descompresion) },
    };
}

// ─── UI helpers ───────────────────────────────────────────────────────────────
const selectCls = (hasError?: boolean) =>
    `w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-[#f3f3f5] h-9 ${
        hasError ? 'border-red-400' : 'border-gray-200 hover:border-gray-300'
    }`;

function StatusBadge({ estado }: { estado: string }) {
    return estado === 'Activa'
        ? <Badge className="bg-blue-100 text-blue-900 border-blue-200"><CheckCircle className="w-3 h-3 mr-1" />Activa</Badge>
        : <Badge className="bg-gray-100 text-gray-500 border-gray-200"><XCircle className="w-3 h-3 mr-1" />Inactiva</Badge>;
}

function FieldError({ mensaje }: { mensaje?: string }) {
    if (!mensaje) return null;
    return (
        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
            {mensaje}
        </p>
    );
}

function CharCounter({ valor, limite }: { valor: string; limite: number }) {
    const c = contadorTexto(valor, limite);
    if (c.actual === 0) return null;
    return (
        <span className={`text-xs ${c.excedido ? 'text-red-500 font-medium' : c.enPeligro ? 'text-amber-500' : 'text-gray-400'}`}>
            {c.texto}
        </span>
    );
}

function InactiveAlert({ mensaje, onClose }: { mensaje: string; onClose: () => void }) {
    return (
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-lg px-4 py-3">
            <Lock className="w-4 h-4 shrink-0 text-gray-500" />
            <span className="flex-1">{mensaje}</span>
            <button onClick={onClose} className="ml-2 text-gray-400 hover:text-gray-600 shrink-0">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

// ─── InsumosSection ──────────────────────────────────────────────────────────
function InsumosSection({ insumos, setInsumos, catalogoInsumos, loadingInsumos, insumosListError }: {
    insumos: InsumoFT[];
    setInsumos: (v: InsumoFT[]) => void;
    catalogoInsumos: InsumoDisponible[];
    loadingInsumos: boolean;
    insumosListError: string | null;
}) {
    const [selectedInsumoId, setSelectedInsumoId] = useState<string>('');
    const [newInsQuantity, setNewInsQuantity] = useState<number>(0);
    const [newInsUnit, setNewInsUnit] = useState<string>('');
    const [insErrors, setInsErrors] = useState<ItemErrors>({});
    const [insSubmitted, setInsSubmitted] = useState(false);

    function updateInsField(campo: 'quantity' | 'unit', valor: string | number) {
        let valorFiltrado: string | number = valor;
        if (campo === 'unit') valorFiltrado = filtrarUnidad(String(valor));
        if (campo === 'quantity') valorFiltrado = filtrarCantidad(String(valor));

        const nuevoIns = {
            quantity: campo === 'quantity' ? parseFloat(String(valorFiltrado)) || 0 : newInsQuantity,
            unit: campo === 'unit' ? String(valorFiltrado) : newInsUnit,
        };
        if (campo === 'quantity') setNewInsQuantity(nuevoIns.quantity);
        if (campo === 'unit') setNewInsUnit(nuevoIns.unit);
        if (insSubmitted) setInsErrors(validarInsumoCampos(nuevoIns, selectedInsumoId));
    }

    const addIns = () => {
        setInsSubmitted(true);
        const camposErr = validarInsumoCampos({ quantity: newInsQuantity, unit: newInsUnit }, selectedInsumoId);
        setInsErrors(camposErr);
        if (Object.keys(camposErr).length > 0) {
            toast.error(camposErr.insumoId ?? camposErr.quantity ?? camposErr.unit ?? '');
            return;
        }
        const name = catalogoInsumos.find(i => String(i.id) === selectedInsumoId)?.nombreInsumo ?? '';
        setInsumos([...insumos, { name, quantity: newInsQuantity, unit: newInsUnit.trim() }]);
        setSelectedInsumoId('');
        setNewInsQuantity(0);
        setNewInsUnit('');
        setInsErrors({});
        setInsSubmitted(false);
    };

    const inputErr = (hasErr: boolean) => hasErr ? 'border-red-400 focus-visible:ring-red-300' : '';

    const inpStyle: React.CSSProperties = {
        width: '100%', height: 34, padding: '0 8px',
        border: '1px solid #d1d5db', borderRadius: 6,
        fontSize: 14, background: '#fff',
        boxSizing: 'border-box', outline: 'none', display: 'block',
    };
    const inpErrStyle: React.CSSProperties = { ...inpStyle, borderColor: '#f87171' };
    const selStyle = (hasErr: boolean): React.CSSProperties => ({
        ...inpStyle, height: 36, borderColor: hasErr ? '#f87171' : '#d1d5db',
    });
    const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4, display: 'block' };

    return (
        <div style={blockWrap}>
            <div style={blockHdr}>
                <p style={{ fontWeight: 700, fontSize: 13, color: '#1e3a8a', margin: 0 }}>
                    Insumos Requeridos <span style={{ color: '#ef4444' }}>*</span>
                    <span style={{ color: '#9ca3af', fontSize: 11, fontWeight: 400, marginLeft: 4 }}>(mínimo 1, máx. 50)</span>
                </p>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Fila de campos */}
                <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 2, minWidth: 0 }}>
                        <label style={lbl}>Insumo *</label>
                        <select
                            style={selStyle(!!insErrors.insumoId)}
                            value={selectedInsumoId}
                            disabled={loadingInsumos}
                            onChange={e => {
                                const id = e.target.value;
                                setSelectedInsumoId(id);
                                const insumo = catalogoInsumos.find(i => String(i.id) === id);
                                setNewInsUnit(insumo ? insumo.unidadMedida : '');
                                if (insSubmitted) setInsErrors(validarInsumoCampos({ quantity: newInsQuantity, unit: insumo ? insumo.unidadMedida : newInsUnit }, id));
                            }}
                        >
                            <option value="">{loadingInsumos ? 'Cargando...' : 'Seleccionar insumo'}</option>
                            {catalogoInsumos.map(insumo => (
                                <option key={insumo.id} value={String(insumo.id)}>{insumo.nombreInsumo}</option>
                            ))}
                        </select>
                        <FieldError mensaje={insErrors.insumoId} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <label style={lbl}>Cantidad *</label>
                        <input type="text" inputMode="decimal" placeholder="Ej: 0.5"
                            value={newInsQuantity || ''}
                            onChange={e => updateInsField('quantity', e.target.value)}
                            style={insErrors.quantity ? inpErrStyle : inpStyle}
                        />
                        <FieldError mensaje={insErrors.quantity} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <label style={{ ...lbl, marginBottom: 4 }}>Unidad</label>
                        <input
                            type="text"
                            readOnly
                            disabled
                            value={newInsUnit ?? ''}
                            style={{ ...inpStyle, background: '#f3f4f6', cursor: 'not-allowed', opacity: 0.7 }}
                        />
                    </div>
                </div>
                <Button type="button" variant="outline" onClick={addIns} className="w-full text-blue-700 border-blue-300 hover:bg-blue-50">
                    <Plus className="w-4 h-4 mr-2" />Agregar Insumo
                </Button>
                {insumosListError && <p className="text-xs text-red-500 text-center">{insumosListError}</p>}
                {insumos.map((ins, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded p-3 border text-sm">
                        <span className="font-medium text-gray-700">{ins.name}</span>
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-xs">{ins.quantity} {ins.unit}</Badge>
                            <Button type="button" variant="ghost" size="sm"
                                onClick={() => setInsumos(insumos.filter((_, j) => j !== i))}
                                className="text-blue-500 hover:text-blue-700 h-7 w-7 p-0">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Machine param block ──────────────────────────────────────────────────────
const inputBase: React.CSSProperties = {
    width: '100%', height: 34, textAlign: 'center',
    padding: '0 8px', border: '1px solid #d1d5db',
    borderRadius: 6, fontSize: 14, background: '#fff',
    boxSizing: 'border-box', outline: 'none', display: 'block',
};
const blockHdr: React.CSSProperties = { background: '#eff6ff', padding: '10px 16px', borderBottom: '1px solid #dbeafe', borderRadius: '8px 8px 0 0' };
const blockWrap: React.CSSProperties = { border: '1px solid #dbeafe', borderRadius: 8 };
const colH: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#6b7280', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1, paddingBottom: 4 };
const rowLabel: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: '#374151' };

function NI({ val, set }: { val: string; set: (v: string) => void }) {
    return (
        <input type="text" inputMode="decimal" placeholder="0.0" value={val}
            onChange={e => set(e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
            style={inputBase}
        />
    );
}

function ND({ val, set }: { val: string; set: (v: string) => void }) {
    return (
        <input type="text" inputMode="decimal" placeholder="0.0" value={val}
            onChange={e => set(e.target.value.replace(/[^0-9.]/g, ''))}
            style={inputBase}
        />
    );
}

function MachineBlock({ titulo, maquina, setter, uiRows }: {
    titulo: string;
    maquina: MaquinaFormState;
    setter: (key: keyof MaquinaFormState, campo: string, val: string) => void;
    uiRows: { key: keyof MaquinaFormState; label: string; hasExtra?: boolean }[];
}) {
    const extraColLabel = titulo === 'Unidad de Inyección' ? 'Contrapresión' : 'Nro. Salidas';
    const hasAnyExtra = uiRows.some(r => r.hasExtra);
    return (
        <div style={blockWrap}>
            <div style={blockHdr}><p style={{ fontWeight: 700, fontSize: 13, color: '#1e3a8a', margin: 0 }}>{titulo}</p></div>
            <div style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 130, flexShrink: 0 }} />
                    <div style={{ flex: 1, ...colH }}>Velocidad</div>
                    <div style={{ flex: 1, ...colH }}>Presión</div>
                    <div style={{ width: 82, flexShrink: 0, ...colH }}>{hasAnyExtra ? extraColLabel : ''}</div>
                </div>
                {uiRows.map(row => {
                    const d = maquina[row.key] as any;
                    return (
                        <div key={String(row.key)} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <div style={{ width: 130, flexShrink: 0, ...rowLabel }}>{row.label}</div>
                            <div style={{ flex: 1 }}><NI val={d.velocidad} set={v => setter(row.key, 'velocidad', v)} /></div>
                            <div style={{ flex: 1 }}><NI val={d.presion}   set={v => setter(row.key, 'presion',   v)} /></div>
                            <div style={{ width: 82, flexShrink: 0 }}>
                                {row.hasExtra && <NI val={d.extra ?? ''} set={v => setter(row.key, 'extra', v)} />}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function TemperaturasBlock({ temps, onSet }: {
    temps: MaquinaFormState['temperaturas'];
    onSet: (campo: string, val: string) => void;
}) {
    const zonas = [
        { key: 'boquilla', label: 'Boquilla' },
        { key: 'z1',       label: 'Z1' },
        { key: 'z2',       label: 'Z2' },
        { key: 'z3',       label: 'Z3' },
    ] as const;
    return (
        <div style={blockWrap}>
            <div style={blockHdr}><p style={{ fontWeight: 700, fontSize: 13, color: '#1e3a8a', margin: 0 }}>Temperaturas</p></div>
            <div style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 90, flexShrink: 0 }} />
                    {zonas.map(z => <div key={z.key} style={{ flex: 1, ...colH }}>{z.label}</div>)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 90, flexShrink: 0, ...rowLabel }}>Set point</div>
                    {zonas.map(z => (
                        <div key={z.key} style={{ flex: 1 }}>
                            <ND val={temps[z.key]} set={v => onSet(z.key, v)} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function TiemposBlock({ tiempos, onSet }: {
    tiempos: MaquinaFormState['tiempos'];
    onSet: (campo: string, val: string) => void;
}) {
    const filas = [
        { key: 'enfriamiento',     label: 'Enfriamiento' },
        { key: 'pausa',            label: 'Pausa' },
        { key: 'retardoInyeccion', label: 'Retardo de inyección' },
        { key: 'inyeccion',        label: 'Inyección' },
        { key: 'segundaInyeccion', label: '2a Inyección' },
        { key: 'descompresion',    label: 'Descompresión' },
    ] as const;
    return (
        <div style={blockWrap}>
            <div style={blockHdr}><p style={{ fontWeight: 700, fontSize: 13, color: '#1e3a8a', margin: 0 }}>Tiempos</p></div>
            <div style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                    <div style={{ flex: 1 }} />
                    <div style={{ width: 120, flexShrink: 0, ...colH }}>Consigna (s)</div>
                </div>
                {filas.map(fila => (
                    <div key={fila.key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <div style={{ flex: 1, ...rowLabel }}>{fila.label}</div>
                        <div style={{ width: 120, flexShrink: 0 }}>
                            <ND val={tiempos[fila.key]} set={v => onSet(fila.key, v)} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
export function TechnicalSheetModule() {
    const [fichas, setFichas]       = useState<FichaTecnica[]>([]);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [empleados, setEmpleados] = useState<any[]>([]);
    const [loading, setLoading]     = useState(false);
    const [saving, setSaving]       = useState(false);

    const [showCreateModal, setShowCreateModal]   = useState(false);
    const [showEditModal, setShowEditModal]       = useState(false);
    const [showDetailModal, setShowDetailModal]   = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const [selectedFicha, setSelectedFicha] = useState<FichaTecnica | null>(null);
    const [deleteError, setDeleteError]     = useState<string | null>(null);
    const [fichaToDelete, setFichaToDelete] = useState<FichaTecnica | null>(null);

    const [createForm, setCreateForm] = useState<FormInfo>(EMPTY_FORM);
    const [editForm, setEditForm]     = useState<FormInfo>(EMPTY_FORM);

    const [createInfoErrors, setCreateInfoErrors] = useState<{ productoId?: string; notas?: string }>({});
    const [editInfoErrors, setEditInfoErrors]     = useState<{ notas?: string }>({});

    // Insumos
    const [cInsumos, setCInsumos] = useState<InsumoFT[]>([]);
    const [eInsumos, setEInsumos] = useState<InsumoFT[]>([]);

    // Nuevos campos
    const [cNumeroMolde, setCNumeroMolde]       = useState('');
    const [cResponsableId, setCResponsableId]   = useState('');
    const [cMaquina, setCMaquina]               = useState<MaquinaFormState>({ ...EMPTY_MAQUINA, carga: { ...EMPTY_MAQUINA.carga }, botador: { ...EMPTY_MAQUINA.botador } });
    const [eNumeroMolde, setENumeroMolde]       = useState('');
    const [eResponsableId, setEResponsableId]   = useState('');
    const [eMaquina, setEMaquina]               = useState<MaquinaFormState>({ ...EMPTY_MAQUINA, carga: { ...EMPTY_MAQUINA.carga }, botador: { ...EMPTY_MAQUINA.botador } });

    // Catálogo de insumos
    const [catalogoInsumos, setCatalogoInsumos] = useState<InsumoDisponible[]>([]);
    const [loadingInsumos, setLoadingInsumos]   = useState(false);
    const [errorInsumos, setErrorInsumos]       = useState<string | null>(null);

    const productosConFichaActiva = new Set(
        fichas.filter(f => f.estado === 'Activa').map(f => f.productoId)
    );

    const [searchTerm, setSearchTerm]     = useState('');
    const [filterEstado, setFilterEstado] = useState('all');
    const [currentPage, setCurrentPage]   = useState(1);
    const itemsPerPage = 5;

    const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
    const showFeedback = (msg: string) => {
        setFeedbackMsg(msg);
        setTimeout(() => setFeedbackMsg(null), 4000);
    };

    const [inactiveAlert, setInactiveAlert] = useState<string | null>(null);
    const showInactiveAlert = (msg: string) => {
        setInactiveAlert(msg);
        setTimeout(() => setInactiveAlert(null), 5000);
    };

    // ── Fetch ───────────────────────────────────────────────────────────────
    const fetchFichas = useCallback(async () => {
        setLoading(true);
        try { setFichas(await getFichasTecnicas()); }
        catch (err: any) { toast.error('Error al cargar fichas: ' + (err?.message ?? 'Error desconocido')); }
        finally { setLoading(false); }
    }, []);

    const fetchProductos = useCallback(async () => {
        try {
            const BASE = getApiBaseUrl();
            const res = await fetch(`${BASE}/productos`, { headers: buildAuthHeaders() });
            const data = await handleResponse<Producto[]>(res);
            setProductos(data.filter(p => p.estado === 'activo'));
        } catch { /* silencioso */ }
    }, []);

    const fetchInsumosDisponibles = useCallback(async () => {
        setLoadingInsumos(true);
        setErrorInsumos(null);
        try { setCatalogoInsumos(await getInsumosDisponibles()); }
        catch { setErrorInsumos('No se pudo cargar el catálogo de insumos.'); setCatalogoInsumos([]); }
        finally { setLoadingInsumos(false); }
    }, []);

    const fetchEmpleados = useCallback(async () => {
        try {
            const BASE = getApiBaseUrl();
            const res = await fetch(`${BASE}/empleados`, { headers: buildAuthHeaders() });
            const data = await handleResponse<any[]>(res);
            setEmpleados(data.filter(e => e.estado === 'activo'));
        } catch { /* silencioso */ }
    }, []);

    useEffect(() => { fetchFichas(); fetchProductos(); fetchEmpleados(); }, [fetchFichas, fetchProductos, fetchEmpleados]);

    // ── Filtrado y paginación ───────────────────────────────────────────────
    const filtered = fichas.filter(f => {
        const search = searchTerm.toLowerCase();
        const matchSearch =
            (f.codigoFicha ?? '').toLowerCase().includes(search) ||
            (f.producto?.nombreProducto ?? '').toLowerCase().includes(search) ||
            (f.producto?.referencia ?? '').toLowerCase().includes(search);
        const matchEstado = filterEstado === 'all' || f.estado === filterEstado;
        return matchSearch && matchEstado;
    });

    const sorted = [...filtered].sort((a, b) =>
        new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
    );

    const totalPages = Math.ceil(sorted.length / itemsPerPage);
    const paginated  = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // ── Estado rápido ───────────────────────────────────────────────────────
    const handleQuickEstadoChange = async (ficha: FichaTecnica, nuevoEstado: string) => {
        setInactiveAlert(null);
        try {
            await updateFichaTecnica(ficha.id!, { estado: nuevoEstado as 'Activa' | 'Inactiva' });
            toast.success(`Estado cambiado a ${nuevoEstado}`);
            fetchFichas();
        } catch (err: any) {
            toast.error('Error al cambiar estado: ' + (err?.message ?? 'Error desconocido'));
        }
    };

    // ── Reset ───────────────────────────────────────────────────────────────
    const resetCreate = () => {
        setCreateForm(EMPTY_FORM);
        setCInsumos([]);
        setCNumeroMolde(''); setCResponsableId('');
        setCMaquina({ ...EMPTY_MAQUINA, carga: { ...EMPTY_MAQUINA.carga }, botador: { ...EMPTY_MAQUINA.botador } });
        setCreateInfoErrors({});
        fetchInsumosDisponibles();
    };

    function updateCreateNotas(valor: string) {
        const filtrado = filtrarNotas(valor);
        setCreateForm(prev => ({ ...prev, notas: filtrado }));
        const err = validarNotasCampo(filtrado);
        setCreateInfoErrors(prev => ({ ...prev, notas: err }));
    }

    function updateEditNotas(valor: string) {
        const filtrado = filtrarNotas(valor);
        setEditForm(prev => ({ ...prev, notas: filtrado }));
        const err = validarNotasCampo(filtrado);
        setEditInfoErrors(prev => ({ ...prev, notas: err }));
    }

    // ── Crear ───────────────────────────────────────────────────────────────
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createForm.productoId) {
            setCreateInfoErrors(prev => ({ ...prev, productoId: 'Debes seleccionar un producto' }));
            return;
        }
        if (createForm.productoId && productosConFichaActiva.has(parseInt(createForm.productoId))) {
            const fichaExistente = fichas.find(f => f.productoId === parseInt(createForm.productoId) && f.estado === 'Activa');
            const codigo = fichaExistente?.codigoFicha ?? '';
            setCreateInfoErrors(prev => ({
                ...prev,
                productoId: `Este producto ya tiene la ficha activa ${codigo}. Inactívala antes de crear una nueva.`,
            }));
            toast.error(`Este producto ya tiene la ficha activa ${codigo}. Inactívala primero.`);
            return;
        }
        const { valid, errors } = validarFormCrear(createForm, [], cInsumos);
        if (!valid) { toast.error(errors[0]); return; }

        const maquinaErr = validarParametrosMaquina(cMaquina);
        if (maquinaErr) { toast.error(maquinaErr); return; }

        setSaving(true);
        try {
            const res = await createFichaTecnica({
                productoId:        parseInt(createForm.productoId),
                procesos:          [],
                insumos:           cInsumos,
                notas:             createForm.notas || undefined,
                numeroMolde:       cNumeroMolde ? cNumeroMolde : undefined,
                parametrosMaquina: toMaquinaPayload(cMaquina),
                responsableId:     cResponsableId ? parseInt(cResponsableId) : undefined,
            });
            showFeedback(`✓ Ficha ${res.ficha.codigoFicha} creada exitosamente`);
            toast.success(`Ficha ${res.ficha.codigoFicha} creada exitosamente`);
            setShowCreateModal(false);
            resetCreate();
            fetchFichas();
        } catch (err: any) {
            toast.error('Error al crear: ' + (err?.message ?? 'Error desconocido'));
        } finally {
            setSaving(false);
        }
    };

    // ── Abrir edición ───────────────────────────────────────────────────────
    const openEdit = (f: FichaTecnica) => {
        setSelectedFicha(f);
        setEditForm({ productoId: String(f.productoId), notas: f.notas ?? '', estado: f.estado ?? 'Activa' });
        setEInsumos(f.insumos ?? []);
        setENumeroMolde(f.numeroMolde ?? '');
        setEResponsableId(f.responsableId != null ? String(f.responsableId) : '');
        setEMaquina(fromMaquinaPayload(f.parametrosMaquina));
        setEditInfoErrors({});
        fetchInsumosDisponibles();
        setShowEditModal(true);
    };

    // ── Actualizar ──────────────────────────────────────────────────────────
    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFicha?.id) return;
        const { valid, errors } = validarFormEditar([], eInsumos, editForm.notas);
        if (!valid) { toast.error(errors[0]); return; }

        const maquinaErr = validarParametrosMaquina(eMaquina);
        if (maquinaErr) { toast.error(maquinaErr); return; }

        setSaving(true);
        try {
            await updateFichaTecnica(selectedFicha.id, {
                insumos:           eInsumos,
                notas:             editForm.notas || undefined,
                estado:            editForm.estado,
                numeroMolde:       eNumeroMolde ? eNumeroMolde : null,
                parametrosMaquina: toMaquinaPayload(eMaquina),
                responsableId:     eResponsableId ? parseInt(eResponsableId) : null,
            });
            showFeedback('✓ Ficha técnica actualizada correctamente');
            toast.success('Ficha técnica actualizada correctamente');
            setShowEditModal(false);
            setSelectedFicha(null);
            fetchFichas();
        } catch (err: any) {
            toast.error('Error al actualizar: ' + (err?.message ?? 'Error desconocido'));
        } finally {
            setSaving(false);
        }
    };

    // ── Eliminar ────────────────────────────────────────────────────────────
    const handleDelete = async () => {
        if (!fichaToDelete?.id) return;
        setSaving(true);
        try {
            await deleteFichaTecnica(fichaToDelete.id);
            showFeedback('✓ Ficha técnica eliminada correctamente');
            toast.success('Ficha técnica eliminada correctamente');
            setShowDeleteDialog(false);
            setFichaToDelete(null);
            fetchFichas();
        } catch (err: any) {
            toast.error('Error al eliminar: ' + (err?.message ?? 'Error desconocido'));
        } finally {
            setSaving(false);
        }
    };

    // ── Helper: setter de maquina state ────────────────────────────────────
    const setC = (key: keyof MaquinaFormState, campo: string, val: string) =>
        setCMaquina(prev => ({ ...prev, [key]: { ...prev[key], [campo]: val } }));
    const setE = (key: keyof MaquinaFormState, campo: string, val: string) =>
        setEMaquina(prev => ({ ...prev, [key]: { ...prev[key], [campo]: val } }));


    // ══════════════════════════════════════════════════════════════════
    //  RENDER
    // ══════════════════════════════════════════════════════════════════
    return (
        <div className="p-6 space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl text-blue-900 font-bold mb-2">Fichas Técnicas</h1>
                    <p className="text-blue-800">Especificaciones técnicas de productos</p>
                </div>
                <Button onClick={() => { resetCreate(); setShowCreateModal(true); }} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />Registrar Ficha Técnica
                </Button>
            </div>

            {/* Filtros */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input placeholder="Buscar por código, producto, referencia..."
                                value={searchTerm}
                                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="pl-10 w-full" />
                        </div>
                        <select value={filterEstado}
                            onChange={e => { setFilterEstado(e.target.value); setCurrentPage(1); }}
                            className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 w-40">
                            <option value="all">Todos</option>
                            <option value="Activa">Activa</option>
                            <option value="Inactiva">Inactiva</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Tabla */}
            {loading ? (
                <div className="flex justify-center items-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-500">Cargando fichas técnicas...</span>
                </div>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-blue-900">
                                    <tr>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Código</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Producto</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Estado</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="text-center py-12 text-gray-500">
                                                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                                <p>No se encontraron fichas técnicas</p>
                                            </td>
                                        </tr>
                                    ) : paginated.map(ficha => {
                                        const isInactiva = ficha.estado === 'Inactiva';
                                        return (
                                            <tr key={ficha.id} className="border-b border-blue-100 hover:bg-blue-50 transition-colors">
                                                <td className="py-4 px-6">
                                                    <span className={`text-sm font-semibold ${isInactiva ? 'text-gray-400' : 'text-gray-900'}`}>{ficha.codigoFicha}</span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <p className={`font-semibold ${isInactiva ? 'text-gray-400' : 'text-gray-900'}`}>{ficha.producto?.nombreProducto ?? '—'}</p>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <Switch
                                                        checked={ficha.estado === 'Activa'}
                                                        onCheckedChange={() => handleQuickEstadoChange(ficha, ficha.estado === 'Activa' ? 'Inactiva' : 'Activa')}
                                                    />
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center space-x-2">
                                                        <Button size="sm"
                                                            onClick={() => { setSelectedFicha(ficha); setShowDetailModal(true); }}
                                                            className="bg-white text-blue-900 border border-blue-900 hover:bg-blue-50">
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                        <Button size="sm"
                                                            onClick={() => {
                                                                if (isInactiva) { showInactiveAlert('Ficha inactiva: Actívala primero para editar.'); return; }
                                                                openEdit(ficha);
                                                            }}
                                                            className={`border transition-colors ${isInactiva ? 'bg-white text-gray-300 border-gray-200 cursor-not-allowed hover:bg-white' : 'bg-white text-blue-900 border-blue-900 hover:bg-blue-50'}`}>
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button size="sm"
                                                            onClick={async () => {
                                                                if (isInactiva) { showInactiveAlert('Ficha inactiva: Actívala primero para eliminar.'); return; }
                                                                try {
                                                                    const resultado = await puedeEliminarFichaTecnica(ficha.id!);
                                                                    setFichaToDelete(ficha);
                                                                    setDeleteError(resultado.puedeEliminar ? null : resultado.razon);
                                                                    setShowDeleteDialog(true);
                                                                } catch (err: any) {
                                                                    toast.error('Error al verificar: ' + (err?.message ?? 'Error'));
                                                                }
                                                            }}
                                                            className={`border transition-colors ${isInactiva ? 'bg-white text-gray-300 border-gray-200 cursor-not-allowed hover:bg-white' : 'bg-white text-blue-900 border-blue-900 hover:bg-blue-50'}`}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <SmartPagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={sorted.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    </CardContent>
                </Card>
            )}

            {inactiveAlert && <InactiveAlert mensaje={inactiveAlert} onClose={() => setInactiveAlert(null)} />}
            {feedbackMsg && (
                <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl px-5 py-3 shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                    <span className="text-sm font-medium">{feedbackMsg}</span>
                </div>
            )}

            {/* ═══ MODAL — CREAR ═══ */}
            <Dialog open={showCreateModal} onOpenChange={(open) => { if (!open) { resetCreate(); setShowCreateModal(false); } }}>
                <DialogContent
                    className="p-0 gap-0 overflow-hidden"
                    style={{ width: '96vw', maxWidth: 1400, height: '92vh', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
                >
                    {/* Header */}
                    <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 24px', borderBottom: '1px solid #e5e7eb', flexShrink: 0, background: '#fff' }}>
                        <div style={{ width: 40, height: 40, background: '#1d4ed8', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <FileText style={{ width: 20, height: 20, color: '#fff' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0, paddingRight: 32 }}>
                            <DialogTitle style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>
                                Registrar Nueva Ficha Técnica
                            </DialogTitle>
                            <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                                Completa los campos obligatorios (*) para crear la ficha.
                            </p>
                        </div>
                    </header>

                    {/* Body 2 columnas */}
                    <form id="create-ficha-form" onSubmit={handleCreate} style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

                        {/* Sidebar */}
                        <aside style={{ width: 320, flexShrink: 0, borderRight: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>

                                {/* Empleado responsable — primer campo */}
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                                        Empleado responsable
                                    </label>
                                    <select
                                        className={selectCls()}
                                        value={cResponsableId}
                                        onChange={e => setCResponsableId(e.target.value)}
                                        style={{ background: '#fff' }}
                                    >
                                        <option value="">Seleccionar empleado</option>
                                        {empleados.map(emp => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.nombres} {emp.apellidos} — {emp.cargo}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Producto */}
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                                        Producto <span style={{ color: '#f87171' }}>*</span>
                                    </label>
                                    <select
                                        className={selectCls(!!createInfoErrors.productoId)}
                                        value={createForm.productoId}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setCreateForm({ ...createForm, productoId: val });
                                            if (!val) {
                                                setCreateInfoErrors(prev => ({ ...prev, productoId: 'Debes seleccionar un producto' }));
                                            } else if (productosConFichaActiva.has(parseInt(val))) {
                                                const fichaEx = fichas.find(f => f.productoId === parseInt(val) && f.estado === 'Activa');
                                                setCreateInfoErrors(prev => ({ ...prev, productoId: `Ya tiene la ficha activa ${fichaEx?.codigoFicha ?? ''}. Inactívala primero.` }));
                                            } else {
                                                setCreateInfoErrors(prev => ({ ...prev, productoId: undefined }));
                                            }
                                        }}
                                        style={{ background: '#fff' }}
                                    >
                                        <option value="">Seleccionar producto</option>
                                        {productos.map(p => {
                                            const tieneActiva = productosConFichaActiva.has(p.id);
                                            return (
                                                <option key={p.id} value={p.id} disabled={tieneActiva}>
                                                    {tieneActiva ? '⚠ ' : ''}{p.nombreProducto} — {p.referencia}{tieneActiva ? ' [ya tiene ficha activa]' : ''}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <FieldError mensaje={createInfoErrors.productoId} />
                                </div>

                                {/* Molde */}
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                                        Molde
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="Ej: MOL-001"
                                        value={cNumeroMolde}
                                        onChange={e => setCNumeroMolde(e.target.value.replace(/[^a-zA-Z0-9\-]/g, ''))}
                                    />
                                </div>

                                {/* Notas */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
                                            Notas <span style={{ color: '#9ca3af', fontWeight: 400 }}>(opcional)</span>
                                        </label>
                                        <CharCounter valor={createForm.notas} limite={1000} />
                                    </div>
                                    <Textarea
                                        placeholder="Notas adicionales..."
                                        value={createForm.notas}
                                        rows={5}
                                        onChange={e => updateCreateNotas(e.target.value)}
                                        style={{ fontSize: 14, background: '#fff', resize: 'none', borderColor: createInfoErrors.notas ? '#f87171' : undefined }}
                                    />
                                    <FieldError mensaje={createInfoErrors.notas} />
                                </div>

                                {errorInsumos && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', fontSize: 13, color: '#dc2626' }}>
                                        <AlertTriangle style={{ width: 14, height: 14, flexShrink: 0 }} />
                                        {errorInsumos}
                                    </div>
                                )}
                            </div>
                        </aside>

                        {/* Panel derecho */}
                        <section style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fff' }}>
                            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

                                {/* 1. Insumos — primero */}
                                <InsumosSection
                                    insumos={cInsumos}
                                    setInsumos={setCInsumos}
                                    catalogoInsumos={catalogoInsumos}
                                    loadingInsumos={loadingInsumos}
                                    insumosListError={cInsumos.length === 0 ? 'Debes agregar al menos un insumo' : null}
                                />

                                {/* 2. Unidad de Inyección */}
                                <MachineBlock titulo="Unidad de Inyección" maquina={cMaquina} setter={setC} uiRows={[
                                    { key: 'tolva',            label: 'Tolva' },
                                    { key: 'inyeccion',        label: 'Inyección' },
                                    { key: 'segundaInyeccion', label: '2a Inyección' },
                                    { key: 'carga',            label: 'Carga',        hasExtra: true },
                                    { key: 'decompresion',     label: 'Descompresión' },
                                ]} />

                                {/* 3. Prensa */}
                                <MachineBlock titulo="Prensa" maquina={cMaquina} setter={setC} uiRows={[
                                    { key: 'abrir',       label: 'Abrir' },
                                    { key: 'cerrar',      label: 'Cerrar' },
                                    { key: 'seguroMolde', label: 'Seguro de Molde' },
                                    { key: 'botador',     label: 'Botador',          hasExtra: true },
                                ]} />

                                {/* 4. Temperaturas */}
                                <TemperaturasBlock
                                    temps={cMaquina.temperaturas}
                                    onSet={(campo, val) => setC('temperaturas', campo, val)}
                                />

                                {/* 5. Tiempos */}
                                <TiemposBlock
                                    tiempos={cMaquina.tiempos}
                                    onSet={(campo, val) => setC('tiempos', campo, val)}
                                />


                            </div>
                        </section>
                    </form>

                    {/* Footer */}
                    <footer style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: '12px 24px', borderTop: '1px solid #e5e7eb', background: '#fff', flexShrink: 0 }}>
                        <Button type="button" variant="outline" onClick={() => { resetCreate(); setShowCreateModal(false); }} disabled={saving} style={{ height: 36 }}>
                            Cancelar
                        </Button>
                        <Button type="submit" form="create-ficha-form" disabled={saving || !!errorInsumos} style={{ background: '#1d4ed8', color: '#fff', height: 36 }}>
                            {saving && <Loader2 style={{ width: 16, height: 16, marginRight: 8 }} className="animate-spin" />}
                            {saving ? 'Guardando...' : 'Registrar Ficha Técnica'}
                        </Button>
                    </footer>
                </DialogContent>
            </Dialog>

            {/* ═══ MODAL — VER DETALLE ═══ */}
            <Dialog open={showDetailModal} onOpenChange={(open) => { if (!open) setShowDetailModal(false); }}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-visible p-0">
                    <div className="overflow-y-auto max-h-[90vh] p-6">
                        <DialogHeader>
                            <DialogTitle>Detalle de Ficha Técnica</DialogTitle>
                            <p className="text-sm text-gray-500 mt-1">Información completa — {selectedFicha?.codigoFicha}</p>
                        </DialogHeader>
                        {selectedFicha && (
                            <div className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Código</p>
                                        <p className="font-semibold text-blue-900 mt-1">{selectedFicha.codigoFicha}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Estado</p>
                                        <div className="mt-1"><StatusBadge estado={selectedFicha.estado ?? 'Activa'} /></div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Producto</p>
                                        <p className="font-semibold text-sm mt-1">{selectedFicha.producto?.nombreProducto ?? '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Referencia</p>
                                        <p className="font-semibold text-sm mt-1">{selectedFicha.producto?.referencia ?? '—'}</p>
                                    </div>
                                    {selectedFicha.numeroMolde != null && (
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Molde</p>
                                            <p className="font-semibold text-sm mt-1">{selectedFicha.numeroMolde}</p>
                                        </div>
                                    )}
                                    {selectedFicha.responsableId != null && (
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Empleado responsable</p>
                                            <p className="font-semibold text-sm mt-1">
                                                {(() => { const e = empleados.find(x => x.id === selectedFicha.responsableId); return e ? `${e.nombres} ${e.apellidos} — ${e.cargo}` : `ID ${selectedFicha.responsableId}`; })()}
                                            </p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase flex items-center gap-1"><Calendar className="w-3 h-3" />Creado</p>
                                        <p className="font-semibold text-sm mt-1">{(selectedFicha.createdAt ?? '').slice(0, 10)}</p>
                                    </div>
                                    {selectedFicha.notas && (
                                        <div className="col-span-2">
                                            <p className="text-xs text-gray-500 uppercase">Notas</p>
                                            <p className="text-sm text-gray-700 mt-1">{selectedFicha.notas}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Parámetros de máquina */}
                                {selectedFicha.parametrosMaquina && (() => {
                                    const pm = selectedFicha.parametrosMaquina as any;
                                    const ui = pm.unidadInyeccion ?? {};
                                    const pr = pm.prensa ?? {};
                                    const tm = pm.temperaturas ?? {};
                                    const ti = pm.tiempos ?? {};
                                    const vBadge = (v: any) => (
                                        <span style={{ display: 'inline-block', border: '1px solid #d1d5db', borderRadius: 4, padding: '2px 10px', fontSize: 13, textAlign: 'center', minWidth: 40 }}>{v ?? 0}</span>
                                    );
                                    const secHdr: React.CSSProperties = { fontWeight: 700, fontSize: 13, color: '#1e3a8a', margin: 0 };
                                    const secRow = (label: string, cols: React.ReactNode[]) => (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                            <div style={{ width: 140, flexShrink: 0, fontSize: 13, fontWeight: 500, color: '#374151' }}>{label}</div>
                                            {cols.map((c, i) => <div key={i} style={{ flex: 1 }}>{c}</div>)}
                                        </div>
                                    );
                                    return (
                                        <>
                                            {/* Unidad de Inyección */}
                                            <div style={blockWrap}>
                                                <div style={blockHdr}><p style={secHdr}>Unidad de Inyección</p></div>
                                                <div style={{ padding: '12px 16px' }}>
                                                    <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                                                        <div style={{ width: 140, flexShrink: 0 }} />
                                                        <div style={{ flex: 1, ...colH }}>Velocidad</div>
                                                        <div style={{ flex: 1, ...colH }}>Presión</div>
                                                        <div style={{ flex: 1, ...colH }}>Contrapresión</div>
                                                    </div>
                                                    {secRow('Tolva',           [vBadge(ui.tolva?.velocidad),            vBadge(ui.tolva?.presion),            <div />])}
                                                    {secRow('Inyección',       [vBadge(ui.inyeccion?.velocidad),        vBadge(ui.inyeccion?.presion),        <div />])}
                                                    {secRow('2a Inyección',    [vBadge(ui.segundaInyeccion?.velocidad), vBadge(ui.segundaInyeccion?.presion), <div />])}
                                                    {secRow('Carga',           [vBadge(ui.carga?.velocidad),            vBadge(ui.carga?.presion),            vBadge(ui.carga?.contrapresion)])}
                                                    {secRow('Descompresión',   [vBadge(ui.decompresion?.velocidad),     vBadge(ui.decompresion?.presion),     <div />])}
                                                </div>
                                            </div>
                                            {/* Prensa */}
                                            <div style={blockWrap}>
                                                <div style={blockHdr}><p style={secHdr}>Prensa</p></div>
                                                <div style={{ padding: '12px 16px' }}>
                                                    <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                                                        <div style={{ width: 140, flexShrink: 0 }} />
                                                        <div style={{ flex: 1, ...colH }}>Velocidad</div>
                                                        <div style={{ flex: 1, ...colH }}>Presión</div>
                                                        <div style={{ flex: 1, ...colH }}>Nro. Salidas</div>
                                                    </div>
                                                    {secRow('Abrir',          [vBadge(pr.abrir?.velocidad),       vBadge(pr.abrir?.presion),       <div />])}
                                                    {secRow('Cerrar',         [vBadge(pr.cerrar?.velocidad),      vBadge(pr.cerrar?.presion),      <div />])}
                                                    {secRow('Seguro de Molde',[vBadge(pr.seguroMolde?.velocidad), vBadge(pr.seguroMolde?.presion), <div />])}
                                                    {secRow('Botador',        [vBadge(pr.botador?.velocidad),     vBadge(pr.botador?.presion),     vBadge(pr.botador?.numSalidas)])}
                                                </div>
                                            </div>
                                            {/* Temperaturas */}
                                            {(tm.boquilla || tm.z1 || tm.z2 || tm.z3) && (
                                                <div style={blockWrap}>
                                                    <div style={blockHdr}><p style={secHdr}>Temperaturas</p></div>
                                                    <div style={{ padding: '12px 16px' }}>
                                                        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                                                            <div style={{ width: 90, flexShrink: 0 }} />
                                                            {['Boquilla', 'Z1', 'Z2', 'Z3'].map(z => <div key={z} style={{ flex: 1, ...colH }}>{z}</div>)}
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <div style={{ width: 90, flexShrink: 0, fontSize: 13, fontWeight: 500, color: '#374151' }}>Set point</div>
                                                            {[tm.boquilla, tm.z1, tm.z2, tm.z3].map((v, i) => <div key={i} style={{ flex: 1 }}>{vBadge(v)}</div>)}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {/* Tiempos */}
                                            {(ti.enfriamiento || ti.pausa || ti.retardoInyeccion || ti.inyeccion || ti.segundaInyeccion || ti.descompresion) && (
                                                <div style={blockWrap}>
                                                    <div style={blockHdr}><p style={secHdr}>Tiempos</p></div>
                                                    <div style={{ padding: '12px 16px' }}>
                                                        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                                                            <div style={{ flex: 1 }} />
                                                            <div style={{ width: 120, flexShrink: 0, ...colH }}>Consigna (s)</div>
                                                        </div>
                                                        {[
                                                            { label: 'Enfriamiento',          val: ti.enfriamiento },
                                                            { label: 'Pausa',                 val: ti.pausa },
                                                            { label: 'Retardo de inyección',  val: ti.retardoInyeccion },
                                                            { label: 'Inyección',             val: ti.inyeccion },
                                                            { label: '2a Inyección',          val: ti.segundaInyeccion },
                                                            { label: 'Descompresión',         val: ti.descompresion },
                                                        ].map(f => (
                                                            <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                                                <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#374151' }}>{f.label}</div>
                                                                <div style={{ width: 120, flexShrink: 0 }}>{vBadge(f.val)}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}

                                {(selectedFicha.insumos ?? []).length > 0 && (
                                    <div className="border border-blue-100 rounded-lg overflow-hidden">
                                        <div className="bg-blue-50 py-3 px-4">
                                            <p className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                                                <List className="w-4 h-4" />Insumos Requeridos
                                            </p>
                                        </div>
                                        <div className="p-4 space-y-2">
                                            {(selectedFicha.insumos ?? []).map((ins, i) => (
                                                <div key={i} className="flex justify-between bg-gray-50 rounded p-3 border text-sm">
                                                    <span>{ins.name}</span>
                                                    <Badge variant="outline">{ins.quantity} {ins.unit}</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setShowDetailModal(false)}>Cerrar</Button>
                                    {selectedFicha.estado === 'Activa' && (
                                        <Button onClick={() => { setShowDetailModal(false); openEdit(selectedFicha); }} className="bg-blue-600 hover:bg-blue-700 text-white">
                                            <Edit className="w-4 h-4 mr-2" />Editar Ficha
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* ═══ MODAL — EDITAR ═══ */}
            <Dialog open={showEditModal} onOpenChange={(open) => { if (!open) { setShowEditModal(false); setSelectedFicha(null); } }}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-visible p-0">
                    <div className="overflow-y-auto max-h-[90vh] p-6">
                        <DialogHeader>
                            <DialogTitle>Editar Ficha Técnica</DialogTitle>
                            <p className="text-sm text-gray-500 mt-1">Ficha: {selectedFicha?.codigoFicha}</p>
                        </DialogHeader>
                        <form onSubmit={handleUpdate} className="mt-4 space-y-4">

                            {/* Info general */}
                            <div className="border border-blue-100 rounded-lg overflow-hidden">
                                <div className="bg-blue-50 py-3 px-4">
                                    <p className="text-sm font-semibold text-blue-900">Información General</p>
                                </div>
                                <div className="p-4 space-y-4">
                                    {/* Empleado responsable — primer campo */}
                                    <div>
                                        <label className="block text-sm text-gray-700 mb-2">Empleado responsable</label>
                                        <select className={selectCls()} value={eResponsableId}
                                            onChange={e => setEResponsableId(e.target.value)}>
                                            <option value="">Seleccionar empleado</option>
                                            {empleados.map(emp => (
                                                <option key={emp.id} value={emp.id}>{emp.nombres} {emp.apellidos} — {emp.cargo}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm text-gray-700 mb-2">Producto (no editable)</label>
                                            <Input value={selectedFicha?.producto?.nombreProducto ?? ''} disabled className="bg-gray-50" />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-700 mb-2">Estado</label>
                                            <select className={selectCls()} value={editForm.estado}
                                                onChange={e => setEditForm({ ...editForm, estado: e.target.value as 'Activa' | 'Inactiva' })}>
                                                <option value="Activa">Activa</option>
                                                <option value="Inactiva">Inactiva</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-700 mb-2">Molde</label>
                                            <Input
                                                type="text" placeholder="Ej: MOL-001"
                                                value={eNumeroMolde}
                                                onChange={e => setENumeroMolde(e.target.value.replace(/[^a-zA-Z0-9\-]/g, ''))}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-sm text-gray-700">Notas <span className="text-gray-400">(opcional)</span></label>
                                            <CharCounter valor={editForm.notas} limite={1000} />
                                        </div>
                                        <Textarea value={editForm.notas} rows={2}
                                            onChange={e => updateEditNotas(e.target.value)}
                                            placeholder="Notas adicionales..."
                                            className={editInfoErrors.notas ? 'border-red-400 focus-visible:ring-red-300' : ''} />
                                        <FieldError mensaje={editInfoErrors.notas} />
                                    </div>
                                </div>
                            </div>
                            {/* Insumos */}
                            <InsumosSection
                                insumos={eInsumos}
                                setInsumos={setEInsumos}
                                catalogoInsumos={catalogoInsumos}
                                loadingInsumos={loadingInsumos}
                                insumosListError={eInsumos.length === 0 ? 'Debes mantener al menos un insumo' : null}
                            />

                            {/* Unidad de Inyección */}
                            <MachineBlock titulo="Unidad de Inyección" maquina={eMaquina} setter={setE} uiRows={[
                                { key: 'tolva',            label: 'Tolva' },
                                { key: 'inyeccion',        label: 'Inyección' },
                                { key: 'segundaInyeccion', label: '2a Inyección' },
                                { key: 'carga',            label: 'Carga',        hasExtra: true },
                                { key: 'decompresion',     label: 'Descompresión' },
                            ]} />

                            {/* Prensa */}
                            <MachineBlock titulo="Prensa" maquina={eMaquina} setter={setE} uiRows={[
                                { key: 'abrir',       label: 'Abrir' },
                                { key: 'cerrar',      label: 'Cerrar' },
                                { key: 'seguroMolde', label: 'Seguro de Molde' },
                                { key: 'botador',     label: 'Botador',          hasExtra: true },
                            ]} />

                            {/* Temperaturas */}
                            <TemperaturasBlock
                                temps={eMaquina.temperaturas}
                                onSet={(campo, val) => setE('temperaturas', campo, val)}
                            />

                            {/* Tiempos */}
                            <TiemposBlock
                                tiempos={eMaquina.tiempos}
                                onSet={(campo, val) => setE('tiempos', campo, val)}
                            />

                            {errorInsumos && (
                                <p className="text-red-500 text-sm flex items-center gap-1">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />{errorInsumos}
                                </p>
                            )}

                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button type="button" variant="outline"
                                    onClick={() => { setShowEditModal(false); setSelectedFicha(null); }}>
                                    Cancelar
                                </Button>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={saving || !!errorInsumos}>
                                    {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ═══ MODAL — ELIMINAR ═══ */}
            <Dialog open={showDeleteDialog} onOpenChange={(open) => { if (!open) { setShowDeleteDialog(false); setFichaToDelete(null); setDeleteError(null); } }}>
                <DialogContent className="max-w-md p-6">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-blue-900">
                            <Trash2 className="w-5 h-5" />Eliminar Ficha Técnica
                        </DialogTitle>
                        <DialogDescription>Esta acción no se puede deshacer.</DialogDescription>
                    </DialogHeader>
                    {fichaToDelete && (
                        <div className="mt-4 space-y-3">
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="font-semibold text-blue-900">{fichaToDelete.codigoFicha}</p>
                                <p className="text-sm text-blue-700 mt-1">{fichaToDelete.producto?.nombreProducto}</p>
                            </div>
                            {deleteError ? (
                                <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-3">
                                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                                    <div className="text-sm"><p className="font-semibold">No se puede eliminar</p><p className="text-red-700 mt-0.5">{deleteError}</p></div>
                                </div>
                            ) : (
                                <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg px-4 py-3">
                                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-blue-500" />
                                    <div className="text-sm"><p className="font-semibold">Ficha sin referencias</p><p className="text-blue-700 mt-0.5">Puede ser eliminada permanentemente.</p></div>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                        <Button variant="outline" onClick={() => { setShowDeleteDialog(false); setFichaToDelete(null); setDeleteError(null); }} disabled={saving}>
                            Cancelar
                        </Button>
                        <Button onClick={handleDelete} disabled={saving || !!deleteError} className="bg-white hover:bg-blue-50 text-blue-600">
                            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            {saving ? 'Eliminando...' : 'Eliminar'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
