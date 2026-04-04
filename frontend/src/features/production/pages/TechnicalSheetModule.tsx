import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/shared/components/ui/alert-dialog';
import { Textarea } from '@/shared/components/ui/textarea';
import { toast } from 'sonner';
import {
  PlusIcon, SearchIcon, EyeIcon, EditIcon, TrashIcon, AlertTriangleIcon,
  ChevronLeftIcon, ChevronRightIcon, FileTextIcon, ArrowLeftIcon,
  CheckCircleIcon, XCircleIcon, PackageIcon, ListIcon, RulerIcon,
  ClipboardListIcon, CalendarIcon, UserIcon, RefreshCwIcon
} from 'lucide-react';
import {
  getFichasTecnicas, createFichaTecnica, updateFichaTecnica, deleteFichaTecnica,
  type FichaTecnica, type Material, type Proceso, type Medida, type InsumoFT,
  type CreateFichaPayload, type UpdateFichaPayload
} from '../services/fichaTecnicaService';
import { getApiBaseUrl, buildAuthHeaders, handleResponse } from '../../../services/http';

// ─── Tipos locales ────────────────────────────────────────────────────────────

type Producto = {
  id: number;
  nombreProducto: string;
  referencia: string;
  estado: string;
  categoria?: { id: number; nombreCategoria: string };
};

type FormInfo = {
  productoId: string;
  notas: string;
  estado: 'Activa' | 'Inactiva';
};

const EMPTY_FORM: FormInfo = { productoId: '', notas: '', estado: 'Activa' };

// ─── Clase nativa select (sin Radix — evita bug de portales) ─────────────────
const sel = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white';

// ─── Badges ───────────────────────────────────────────────────────────────────
function StatusBadge({ estado }: { estado: string }) {
  return estado === 'Activa'
    ? <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircleIcon className="w-3 h-3 mr-1" />Activa</Badge>
    : <Badge className="bg-red-100 text-red-700 border-red-200"><XCircleIcon className="w-3 h-3 mr-1" />Inactiva</Badge>;
}

// ─── Sub-formularios reutilizables para items de la ficha ─────────────────────
function ItemsForm({
  materiales, setMateriales,
  procesos, setProcesos,
  medidas, setMedidas,
  insumos, setInsumos,
}: {
  materiales: Material[];    setMateriales: (v: Material[]) => void;
  procesos: Proceso[];       setProcesos: (v: Proceso[]) => void;
  medidas: Medida[];         setMedidas: (v: Medida[]) => void;
  insumos: InsumoFT[];       setInsumos: (v: InsumoFT[]) => void;
}) {
  const [newMat, setNewMat]   = useState<Material>({ name: '', quantity: 0, unit: '' });
  const [newProc, setNewProc] = useState<{ description: string; duration: string }>({ description: '', duration: '' });
  const [newMed, setNewMed]   = useState<Medida>({ parameter: '', value: '', tolerance: '' });
  const [newIns, setNewIns]   = useState<InsumoFT>({ name: '', quantity: 0, unit: '' });

  const addMat = () => {
    if (!newMat.name || newMat.quantity <= 0 || !newMat.unit) { toast.error('Completa todos los campos del material'); return; }
    setMateriales([...materiales, newMat]);
    setNewMat({ name: '', quantity: 0, unit: '' });
  };
  const addProc = () => {
    if (!newProc.description || !newProc.duration) { toast.error('Completa todos los campos del proceso'); return; }
    setProcesos([...procesos, { step: procesos.length + 1, ...newProc }]);
    setNewProc({ description: '', duration: '' });
  };
  const addMed = () => {
    if (!newMed.parameter || !newMed.value) { toast.error('Completa parámetro y valor'); return; }
    setMedidas([...medidas, newMed]);
    setNewMed({ parameter: '', value: '', tolerance: '' });
  };
  const addIns = () => {
    if (!newIns.name || newIns.quantity <= 0 || !newIns.unit) { toast.error('Completa todos los campos del insumo'); return; }
    setInsumos([...insumos, newIns]);
    setNewIns({ name: '', quantity: 0, unit: '' });
  };

  return (
    <>
      {/* Materiales */}
      <Card className="border-2 border-indigo-100">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-white py-3">
          <CardTitle className="text-base">Materiales * (mínimo 1)</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2 space-y-1"><Label className="text-xs">Nombre</Label>
              <Input placeholder="Ej: Papel filtro" value={newMat.name} onChange={e => setNewMat({ ...newMat, name: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-xs">Cantidad</Label>
              <Input type="number" min="0" placeholder="0" value={newMat.quantity || ''} onChange={e => setNewMat({ ...newMat, quantity: parseFloat(e.target.value) || 0 })} /></div>
            <div className="space-y-1"><Label className="text-xs">Unidad</Label>
              <Input placeholder="kg, unidades…" value={newMat.unit} onChange={e => setNewMat({ ...newMat, unit: e.target.value })} /></div>
          </div>
          <Button type="button" variant="outline" onClick={addMat} className="w-full text-indigo-700 border-indigo-300 hover:bg-indigo-50">
            <PlusIcon className="w-4 h-4 mr-2" />Agregar Material
          </Button>
          {materiales.map((m, i) => (
            <div key={i} className="flex items-center justify-between bg-gray-50 rounded p-3 border text-sm">
              <span>{m.name} — {m.quantity} {m.unit}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => setMateriales(materiales.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-700">
                <TrashIcon className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Procesos */}
      <Card className="border-2 border-indigo-100">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-white py-3">
          <CardTitle className="text-base">Procesos de Fabricación * (mínimo 1)</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-1"><Label className="text-xs">Descripción</Label>
              <Input placeholder="Ej: Preparación de materiales" value={newProc.description} onChange={e => setNewProc({ ...newProc, description: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-xs">Duración</Label>
              <Input placeholder="15 min, 2 horas…" value={newProc.duration} onChange={e => setNewProc({ ...newProc, duration: e.target.value })} /></div>
          </div>
          <Button type="button" variant="outline" onClick={addProc} className="w-full text-indigo-700 border-indigo-300 hover:bg-indigo-50">
            <PlusIcon className="w-4 h-4 mr-2" />Agregar Proceso
          </Button>
          {procesos.map((p, i) => (
            <div key={i} className="flex items-center justify-between bg-gray-50 rounded p-3 border text-sm">
              <span>Paso {i + 1}: {p.description} ({p.duration})</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => setProcesos(procesos.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-700">
                <TrashIcon className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Medidas */}
      <Card className="border-2 border-indigo-100">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-white py-3">
          <CardTitle className="text-base">Medidas y Especificaciones (Opcional)</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1"><Label className="text-xs">Parámetro</Label>
              <Input placeholder="Diámetro exterior" value={newMed.parameter} onChange={e => setNewMed({ ...newMed, parameter: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-xs">Valor</Label>
              <Input placeholder="95 mm" value={newMed.value} onChange={e => setNewMed({ ...newMed, value: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-xs">Tolerancia</Label>
              <Input placeholder="±0.5 mm" value={newMed.tolerance ?? ''} onChange={e => setNewMed({ ...newMed, tolerance: e.target.value })} /></div>
          </div>
          <Button type="button" variant="outline" onClick={addMed} className="w-full text-indigo-700 border-indigo-300 hover:bg-indigo-50">
            <PlusIcon className="w-4 h-4 mr-2" />Agregar Medida
          </Button>
          {medidas.map((m, i) => (
            <div key={i} className="flex items-center justify-between bg-gray-50 rounded p-3 border text-sm">
              <span>{m.parameter}: {m.value}{m.tolerance ? ` (${m.tolerance})` : ''}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => setMedidas(medidas.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-700">
                <TrashIcon className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Insumos */}
      <Card className="border-2 border-indigo-100">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-white py-3">
          <CardTitle className="text-base">Insumos Requeridos (Opcional)</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2 space-y-1"><Label className="text-xs">Nombre</Label>
              <Input placeholder="Adhesivo industrial" value={newIns.name} onChange={e => setNewIns({ ...newIns, name: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-xs">Cantidad</Label>
              <Input type="number" min="0" placeholder="0" value={newIns.quantity || ''} onChange={e => setNewIns({ ...newIns, quantity: parseFloat(e.target.value) || 0 })} /></div>
            <div className="space-y-1"><Label className="text-xs">Unidad</Label>
              <Input placeholder="litros, kg…" value={newIns.unit} onChange={e => setNewIns({ ...newIns, unit: e.target.value })} /></div>
          </div>
          <Button type="button" variant="outline" onClick={addIns} className="w-full text-indigo-700 border-indigo-300 hover:bg-indigo-50">
            <PlusIcon className="w-4 h-4 mr-2" />Agregar Insumo
          </Button>
          {insumos.map((ins, i) => (
            <div key={i} className="flex items-center justify-between bg-gray-50 rounded p-3 border text-sm">
              <span>{ins.name} — {ins.quantity} {ins.unit}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => setInsumos(insumos.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-700">
                <TrashIcon className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function TechnicalSheetModule() {
  const [fichas, setFichas]       = useState<FichaTecnica[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading]     = useState(false);
  const [saving, setSaving]       = useState(false);

  // Modales
  const [showCreateModal, setShowCreateModal]   = useState(false);
  const [showEditModal, setShowEditModal]       = useState(false);
  const [showDetailModal, setShowDetailModal]   = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [selectedFicha, setSelectedFicha]     = useState<FichaTecnica | null>(null);
  const [fichaToDelete, setFichaToDelete]     = useState<FichaTecnica | null>(null);

  // Formularios
  const [createForm, setCreateForm]   = useState<FormInfo>(EMPTY_FORM);
  const [editForm, setEditForm]       = useState<FormInfo>(EMPTY_FORM);

  // Items del formulario crear
  const [cMateriales, setCMateriales] = useState<Material[]>([]);
  const [cProcesos, setCProcesos]     = useState<Proceso[]>([]);
  const [cMedidas, setCMedidas]       = useState<Medida[]>([]);
  const [cInsumos, setCInsumos]       = useState<InsumoFT[]>([]);

  // Items del formulario editar
  const [eMateriales, setEMateriales] = useState<Material[]>([]);
  const [eProcesos, setEProcesos]     = useState<Proceso[]>([]);
  const [eMedidas, setEMedidas]       = useState<Medida[]>([]);
  const [eInsumos, setEInsumos]       = useState<InsumoFT[]>([]);

  // Filtros
  const [searchTerm, setSearchTerm]         = useState('');
  const [filterEstado, setFilterEstado]     = useState('all');
  const [filterCategoria, setFilterCategoria] = useState('all');
  const [sortBy, setSortBy]                 = useState('fecha');
  const [currentPage, setCurrentPage]       = useState(1);
  const itemsPerPage = 5;

  // ─── Carga de datos ────────────────────────────────────────────────────────

  const fetchFichas = useCallback(async () => {
    setLoading(true);
    try {
      setFichas(await getFichasTecnicas());
    } catch (err: any) {
      toast.error('Error al cargar fichas: ' + (err?.message ?? 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProductos = useCallback(async () => {
    try {
      const BASE = getApiBaseUrl();
      const res = await fetch(`${BASE}/productos`, { headers: buildAuthHeaders() });
      const data = await handleResponse<Producto[]>(res);
      setProductos(data.filter(p => p.estado === 'activo'));
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => { fetchFichas(); fetchProductos(); }, [fetchFichas, fetchProductos]);

  // ─── Categorías únicas para filtro ─────────────────────────────────────────
  const categorias = Array.from(new Set(
    fichas
      .map(f => f.producto?.categoria?.nombreCategoria)
      .filter(Boolean) as string[]
  ));

  // ─── Filtrado y paginación ──────────────────────────────────────────────────

  const filtered = fichas.filter(f => {
    const codigo   = (f.codigoFicha ?? '').toLowerCase();
    const producto = (f.producto?.nombreProducto ?? '').toLowerCase();
    const ref      = (f.producto?.referencia ?? '').toLowerCase();
    const search   = searchTerm.toLowerCase();
    const matchSearch = codigo.includes(search) || producto.includes(search) || ref.includes(search);
    const matchEstado = filterEstado === 'all' || f.estado === filterEstado;
    const matchCat    = filterCategoria === 'all' || f.producto?.categoria?.nombreCategoria === filterCategoria;
    return matchSearch && matchEstado && matchCat;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'fecha')   return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    if (sortBy === 'codigo')  return (a.codigoFicha ?? '').localeCompare(b.codigoFicha ?? '');
    if (sortBy === 'nombre')  return (a.producto?.nombreProducto ?? '').localeCompare(b.producto?.nombreProducto ?? '');
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const paginated  = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // ─── Acciones CRUD ──────────────────────────────────────────────────────────

  const resetCreate = () => { setCreateForm(EMPTY_FORM); setCMateriales([]); setCProcesos([]); setCMedidas([]); setCInsumos([]); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.productoId) { toast.error('Selecciona un producto'); return; }
    if (cMateriales.length === 0) { toast.error('Agrega al menos un material'); return; }
    if (cProcesos.length === 0) { toast.error('Agrega al menos un proceso'); return; }
    setSaving(true);
    try {
      const res = await createFichaTecnica({
        productoId: parseInt(createForm.productoId),
        materiales: cMateriales,
        procesos:   cProcesos,
        medidas:    cMedidas,
        insumos:    cInsumos,
        notas:      createForm.notas || undefined,
      });
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

  const openEdit = (f: FichaTecnica) => {
    setSelectedFicha(f);
    setEditForm({ productoId: String(f.productoId), notas: f.notas ?? '', estado: f.estado ?? 'Activa' });
    setEMateriales(f.materiales ?? []);
    setEProcesos(f.procesos ?? []);
    setEMedidas(f.medidas ?? []);
    setEInsumos(f.insumos ?? []);
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFicha?.id) return;
    if (eMateriales.length === 0) { toast.error('Agrega al menos un material'); return; }
    if (eProcesos.length === 0)   { toast.error('Agrega al menos un proceso'); return; }
    setSaving(true);
    try {
      await updateFichaTecnica(selectedFicha.id, {
        materiales: eMateriales,
        procesos:   eProcesos,
        medidas:    eMedidas,
        insumos:    eInsumos,
        notas:      editForm.notas || undefined,
        estado:     editForm.estado,
      });
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

  const handleDelete = async () => {
    if (!fichaToDelete?.id) return;
    setSaving(true);
    try {
      await deleteFichaTecnica(fichaToDelete.id);
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

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl text-gray-900 flex items-center gap-3">
            <FileTextIcon className="w-8 h-8 text-indigo-600" />
            Fichas Técnicas
          </h1>
          <p className="text-sm text-gray-600 mt-1">Módulo de Producción — Especificaciones de productos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchFichas} disabled={loading}>
            <RefreshCwIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>

          {/* Modal crear */}
          <Dialog open={showCreateModal} onOpenChange={open => { setShowCreateModal(open); if (!open) resetCreate(); }}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700" size="lg">
                <PlusIcon className="w-4 h-4 mr-2" />Registrar Ficha Técnica
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Nueva Ficha Técnica</DialogTitle>
                <DialogDescription>Completa los campos obligatorios (*) para crear la ficha.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-6 mt-2">
                <Card className="border-2 border-indigo-100">
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-white py-3">
                    <CardTitle className="text-base">Información General</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1 md:col-span-2">
                        <Label className="text-xs">Producto *</Label>
                        {/* select nativo — sin Radix dentro de Dialog */}
                        <select className={sel} value={createForm.productoId}
                          onChange={e => setCreateForm({ ...createForm, productoId: e.target.value })} required>
                          <option value="">Seleccionar producto</option>
                          {productos.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.nombreProducto} — {p.referencia}{p.categoria ? ` (${p.categoria.nombreCategoria})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <Label className="text-xs">Notas</Label>
                        <Textarea placeholder="Notas adicionales..." value={createForm.notas} rows={2}
                          onChange={e => setCreateForm({ ...createForm, notas: e.target.value })} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <ItemsForm
                  materiales={cMateriales} setMateriales={setCMateriales}
                  procesos={cProcesos}     setProcesos={setCProcesos}
                  medidas={cMedidas}       setMedidas={setCMedidas}
                  insumos={cInsumos}       setInsumos={setCInsumos}
                />

                <div className="flex gap-4">
                  <Button type="button" variant="outline" className="flex-1"
                    onClick={() => { setShowCreateModal(false); resetCreate(); }}>Cancelar</Button>
                  <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700" disabled={saving}>
                    {saving ? 'Guardando...' : 'Registrar Ficha Técnica'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtros */}
      <Card className="shadow-lg border-gray-100">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input placeholder="Buscar por código, producto, referencia..."
                  value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="pl-10" />
              </div>
              <select className={sel} value={filterEstado}
                onChange={e => { setFilterEstado(e.target.value); setCurrentPage(1); }}>
                <option value="all">Todos los estados</option>
                <option value="Activa">Activa</option>
                <option value="Inactiva">Inactiva</option>
              </select>
              <select className={sel} value={filterCategoria}
                onChange={e => { setFilterCategoria(e.target.value); setCurrentPage(1); }}>
                <option value="all">Todas las categorías</option>
                {categorias.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{sorted.length} ficha(s) técnica(s) encontrada(s)</span>
              <div className="flex items-center gap-2">
                <span className="text-xs">Ordenar por:</span>
                <select className="border border-gray-300 rounded-md px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="fecha">Fecha (reciente)</option>
                  <option value="codigo">Código</option>
                  <option value="nombre">Nombre del producto</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b-2 border-indigo-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs text-gray-600 uppercase tracking-wider">Código</th>
                <th className="px-6 py-4 text-left text-xs text-gray-600 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-4 text-center text-xs text-gray-600 uppercase tracking-wider">Categoría</th>
                <th className="px-6 py-4 text-center text-xs text-gray-600 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-center text-xs text-gray-600 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-4 text-center text-xs text-gray-600 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  <RefreshCwIcon className="w-8 h-8 mx-auto mb-2 animate-spin text-indigo-400" />
                  <p>Cargando fichas técnicas...</p>
                </td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  <FileTextIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No se encontraron fichas técnicas</p>
                </td></tr>
              ) : paginated.map(ficha => (
                <tr key={ficha.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FileTextIcon className="w-4 h-4 text-indigo-600" />
                      <span className="text-sm font-medium text-gray-900">{ficha.codigoFicha}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{ficha.producto?.nombreProducto ?? '—'}</p>
                    <p className="text-xs text-gray-500">{ficha.producto?.referencia}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {ficha.producto?.categoria
                      ? <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">{ficha.producto.categoria.nombreCategoria}</Badge>
                      : <span className="text-gray-400 text-xs">—</span>}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {ESTADOS.length <= 2 ? (
                      // 🔥 SWITCH (solo 2 estados)
                      <button
                        onClick={() =>
                          handleQuickEstadoChange(
                            ficha,
                            ficha.estado === 'Activa' ? 'Inactiva' : 'Activa'
                          )
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                          ficha.estado === 'Activa' ? 'bg-green-500' : 'bg-gray-800'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                            ficha.estado === 'Activa' ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    ) : (
                      // 🔥 SELECT PROFESIONAL (más de 2 estados)
                      <select
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={ficha.estado}
                        onChange={(e) => handleQuickEstadoChange(ficha, e.target.value)}
                      >
                        {ESTADOS.map((estado) => (
                          <option key={estado} value={estado}>
                            {estado}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <p className="text-sm text-gray-900">{(ficha.createdAt ?? '').slice(0, 10)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="outline" size="sm" title="Ver detalle"
                        onClick={() => { setSelectedFicha(ficha); setShowDetailModal(true); }}
                        className="text-blue-700 border-blue-200 hover:bg-blue-50">
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" title="Editar"
                        onClick={() => openEdit(ficha)}
                        className="text-amber-700 border-amber-200 hover:bg-amber-50">
                        <EditIcon className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" title="Eliminar"
                        onClick={() => { setFichaToDelete(ficha); setShowDeleteDialog(true); }}
                        className="text-red-600 border-red-200 hover:bg-red-50">
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-center space-x-2">
              <Button variant="outline" size="sm" disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-gray-300">
                <ChevronLeftIcon className="w-4 h-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button key={page} size="sm" onClick={() => setCurrentPage(page)}
                  className={page === currentPage
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}>
                  {page}
                </Button>
              ))}
              <Button variant="outline" size="sm" disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-gray-300">
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Ver Detalle */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Ficha Técnica</DialogTitle>
            <DialogDescription>Información completa — {selectedFicha?.codigoFicha}</DialogDescription>
          </DialogHeader>
          {selectedFicha && (
            <div className="space-y-5 mt-2">
              <Card>
                <CardHeader className="py-3"><CardTitle className="text-base flex items-center gap-2"><PackageIcon className="w-4 h-4" />Información General</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label className="text-xs text-gray-500">Código</Label><p className="mt-1 text-sm font-medium">{selectedFicha.codigoFicha}</p></div>
                    <div><Label className="text-xs text-gray-500">Estado</Label><div className="mt-1"><StatusBadge estado={selectedFicha.estado ?? 'Activa'} /></div></div>
                    <div><Label className="text-xs text-gray-500">Producto</Label><p className="mt-1 text-sm">{selectedFicha.producto?.nombreProducto ?? '—'}</p></div>
                    <div><Label className="text-xs text-gray-500">Referencia</Label><p className="mt-1 text-sm">{selectedFicha.producto?.referencia ?? '—'}</p></div>
                    {selectedFicha.producto?.categoria && (
                      <div><Label className="text-xs text-gray-500">Categoría</Label>
                        <Badge variant="outline" className="mt-1 bg-indigo-50 text-indigo-700 border-indigo-200">{selectedFicha.producto.categoria.nombreCategoria}</Badge>
                      </div>
                    )}
                    <div><Label className="text-xs text-gray-500 flex items-center gap-1"><CalendarIcon className="w-3 h-3" />Creado</Label>
                      <p className="mt-1 text-sm">{(selectedFicha.createdAt ?? '').slice(0, 10)}</p>
                    </div>
                  </div>
                  {selectedFicha.notas && (
                    <div className="mt-4 pt-3 border-t">
                      <Label className="text-xs text-gray-500">Notas</Label>
                      <p className="mt-1 text-sm text-gray-700">{selectedFicha.notas}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Materiales */}
              <Card>
                <CardHeader className="py-3"><CardTitle className="text-base flex items-center gap-2"><PackageIcon className="w-4 h-4" />Materiales</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(selectedFicha.materiales ?? []).map((m, i) => (
                      <div key={i} className="flex justify-between bg-gray-50 rounded p-3 border text-sm">
                        <span>{m.name}</span><Badge variant="outline">{m.quantity} {m.unit}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Procesos */}
              <Card>
                <CardHeader className="py-3"><CardTitle className="text-base flex items-center gap-2"><ClipboardListIcon className="w-4 h-4" />Procesos de Fabricación</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(selectedFicha.procesos ?? []).map((p, i) => (
                      <div key={i} className="flex justify-between bg-gray-50 rounded p-3 border text-sm">
                        <span>Paso {i + 1}: {p.description}</span><Badge variant="outline">{p.duration}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Medidas */}
              {(selectedFicha.medidas ?? []).length > 0 && (
                <Card>
                  <CardHeader className="py-3"><CardTitle className="text-base flex items-center gap-2"><RulerIcon className="w-4 h-4" />Medidas y Especificaciones</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(selectedFicha.medidas ?? []).map((m, i) => (
                        <div key={i} className="flex justify-between bg-gray-50 rounded p-3 border text-sm">
                          <span>{m.parameter}</span>
                          <div className="flex items-center gap-2">
                            <span>{m.value}</span>
                            {m.tolerance && <Badge variant="outline" className="text-xs">{m.tolerance}</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Insumos */}
              {(selectedFicha.insumos ?? []).length > 0 && (
                <Card>
                  <CardHeader className="py-3"><CardTitle className="text-base flex items-center gap-2"><ListIcon className="w-4 h-4" />Insumos Requeridos</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(selectedFicha.insumos ?? []).map((ins, i) => (
                        <div key={i} className="flex justify-between bg-gray-50 rounded p-3 border text-sm">
                          <span>{ins.name}</span><Badge variant="outline">{ins.quantity} {ins.unit}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowDetailModal(false)}>
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />Volver
                </Button>
                <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => { setShowDetailModal(false); openEdit(selectedFicha); }}>
                  <EditIcon className="w-4 h-4 mr-2" />Editar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Editar */}
      <Dialog open={showEditModal} onOpenChange={open => { setShowEditModal(open); if (!open) setSelectedFicha(null); }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Ficha Técnica</DialogTitle>
            <DialogDescription>Ficha: {selectedFicha?.codigoFicha}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-6 mt-2">
            <Card className="border-2 border-indigo-100">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-white py-3">
                <CardTitle className="text-base">Información General</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Producto (no editable)</Label>
                    <Input value={selectedFicha?.producto?.nombreProducto ?? ''} disabled className="bg-gray-50" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Estado *</Label>
                    <select className={sel} value={editForm.estado}
                      onChange={e => setEditForm({ ...editForm, estado: e.target.value as 'Activa' | 'Inactiva' })}>
                      <option value="Activa">Activa</option>
                      <option value="Inactiva">Inactiva</option>
                    </select>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs">Notas</Label>
                    <Textarea value={editForm.notas} rows={2}
                      onChange={e => setEditForm({ ...editForm, notas: e.target.value })}
                      placeholder="Notas adicionales..." />
                  </div>
                </div>
              </CardContent>
            </Card>

            <ItemsForm
              materiales={eMateriales} setMateriales={setEMateriales}
              procesos={eProcesos}     setProcesos={setEProcesos}
              medidas={eMedidas}       setMedidas={setEMedidas}
              insumos={eInsumos}       setInsumos={setEInsumos}
            />

            <div className="flex gap-4">
              <Button type="button" variant="outline" className="flex-1"
                onClick={() => { setShowEditModal(false); setSelectedFicha(null); }}>Cancelar</Button>
              <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo: Eliminar */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangleIcon className="w-5 h-5" />Eliminar Ficha Técnica
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>¿Estás seguro de que deseas eliminar esta ficha técnica?</p>
                {fichaToDelete && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-1 text-sm">
                    <p><span className="text-gray-500">Código: </span><span className="font-medium">{fichaToDelete.codigoFicha}</span></p>
                    <p><span className="text-gray-500">Producto: </span>{fichaToDelete.producto?.nombreProducto}</p>
                    <p><span className="text-gray-500">Estado: </span><StatusBadge estado={fichaToDelete.estado ?? 'Activa'} /></p>
                  </div>
                )}
                {fichaToDelete?.estado === 'Activa' && (
                  <p className="text-sm text-amber-600 font-medium">
                    ⚠️ No se puede eliminar una ficha Activa. Cámbiala a Inactiva primero.
                  </p>
                )}
                {fichaToDelete?.estado !== 'Activa' && (
                  <p className="text-sm text-red-600">Esta acción no se puede deshacer.</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFichaToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={saving || fichaToDelete?.estado === 'Activa'}>
              {saving ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}