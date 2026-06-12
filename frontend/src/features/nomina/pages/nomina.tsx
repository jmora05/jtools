import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { SmartPagination } from '@/shared/components/SmartPagination';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Switch } from '@/shared/components/ui/switch';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { toast } from 'sonner';
import {
  CalculatorIcon,
  FileTextIcon,
  DollarSignIcon,
  ClockIcon,
  UserIcon,
  EditIcon,
  EyeIcon,
  TrendingUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Loader2,
  CalendarIcon,
  AlertCircleIcon,
} from 'lucide-react';
import { getEmpleados, type Empleado } from '@/features/employed/services/empleadosService';
import { getHorasExtra, type HoraExtra } from '@/features/employed/services/horasExtraService';
import { getNovedades, type Novedad } from '@/features/employed/services/novedadesService';
import {
  getNominas, createNomina, updateNominaApi, marcarComoPagada as apiMarcarPagada,
  type NominaBackend,
} from '../services/nominaService';
// @ts-ignore
import { generarPdfNomina } from '../utils/generarPdfNomina';
import { NominaDetailModal } from '../components/NominaDetailModal';

// Constantes para cálculos de nómina en Colombia 2026
const SALARIO_MINIMO_2026 = 1423500;
const AUXILIO_TRANSPORTE_2026 = 200000;
const PCT_REC_NOC      = 0.35;   // Recargo Nocturno
const PCT_REC_DIUR_DOM = 0.75;   // Recargo Diurno Dominical
const PCT_REC_NOC_DOM  = 1.10;   // Recargo Nocturno Dominical
const PCT_HE_DIUR      = 0.25;   // Hora Extra Diurna
const PCT_HE_NOC       = 0.75;   // Hora Extra Nocturna
const PCT_HE_DIUR_DOM  = 1.00;   // Hora Extra Diurna Dominical
const PCT_HE_NOC_DOM   = 1.50;   // Hora Extra Nocturna Dominical
const DIAS_MES = 30;
const HORAS_MENSUALES = 240;

// ─── Helpers de semana ───────────────────────────────────────────────────────

const toYMD = (d: Date) => d.toISOString().split('T')[0];

const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

const getFriday = (ref: Date): Date => {
  const d = new Date(ref);
  d.setHours(0, 0, 0, 0);
  const diff = (5 - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  return d;
};

const fmtShort = (d: Date) => d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
const fmtFull  = (d: Date) => d.toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

// ─── Interface ────────────────────────────────────────────────────────────────

interface PayrollRecord {
  id: number;
  employeeId?: number;
  employeeName: string;
  employeeDocument: string;
  position: string;
  baseSalary: number;
  daysWorked: number;
  weekLabel: string;
  paymentDate: string;
  recargoNocturno: number;
  recargoDiurnoDominical: number;
  recargoNocturnoDominical: number;
  horaExtraDiurna: number;
  horaExtraNocturna: number;
  horaExtraDiurnaDominical: number;
  horaExtraNocturnaDominical: number;
  hasTransportAllowance: boolean;
  calculatedValues: {
    proportionalSalary: number;
    recargoNocturno: number;
    recargoDiurnoDominical: number;
    recargoNocturnoDominical: number;
    horaExtraDiurna: number;
    horaExtraNocturna: number;
    horaExtraDiurnaDominical: number;
    horaExtraNocturnaDominical: number;
    transportAllowance: number;
    totalEarned: number;
    healthDeduction: number;
    pensionDeduction: number;
    totalDeductions: number;
    netPay: number;
  };
  estado: 'pendiente' | 'pagado';
  createdAt: string;
}

export function PayrollModule() {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [saving, setSaving] = useState(false);

  const [employees, setEmployees] = useState<Empleado[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [selectedFriday, setSelectedFriday] = useState<Date>(() => getFriday(new Date()));
  const [allHE, setAllHE] = useState<HoraExtra[]>([]);
  const [allNov, setAllNov] = useState<Novedad[]>([]);
  const [loadingWeek, setLoadingWeek] = useState(false);
  const [weekInfo, setWeekInfo] = useState<{ heCount: number; absenceDays: number } | null>(null);
  const [empWeekHE, setEmpWeekHE] = useState<HoraExtra[]>([]);
  const [empWeekNov, setEmpWeekNov] = useState<Novedad[]>([]);

  const weekStart = addDays(selectedFriday, -6);
  const weekLabel = `${fmtShort(weekStart)} – ${fmtFull(selectedFriday)}`;

  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<PayrollRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<PayrollRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    employeeDocument: '',
    position: '',
    baseSalary: '',
    daysWorked: '7',
    recargoNocturno: '0',
    recargoDiurnoDominical: '0',
    recargoNocturnoDominical: '0',
    horaExtraDiurna: '0',
    horaExtraNocturna: '0',
    horaExtraDiurnaDominical: '0',
    horaExtraNocturnaDominical: '0',
    hasTransportAllowance: true,
  });

  const fetchNominas = async () => {
    try {
      const data = await getNominas();
      setPayrollRecords(data.map(mapNominaToRecord));
    } catch {
      toast.error('Error al cargar control de pagos');
    }
  };

  useEffect(() => {
    setLoadingEmployees(true);
    setLoadingWeek(true);
    Promise.all([getEmpleados(), getHorasExtra(), getNovedades()])
      .then(([emps, he, nov]) => {
        setEmployees(emps);
        setAllHE(he);
        setAllNov(nov);
      })
      .catch(() => toast.error('Error al cargar datos'))
      .finally(() => {
        setLoadingEmployees(false);
        setLoadingWeek(false);
      });
    fetchNominas();
  }, []);

  // Recalcular días trabajados y horas extra cuando cambia la semana seleccionada
  useEffect(() => {
    if (formData.employeeId && employees.length > 0) {
      handleEmployeeChange(formData.employeeId);
    }
  }, [selectedFriday]); // eslint-disable-line react-hooks/exhaustive-deps

  const mapNominaToRecord = (n: NominaBackend): PayrollRecord => {
    const salBase   = parseFloat(String(n.salario_base));
    const auxTrans  = parseFloat(String(n.auxilio_transporte));
    const neto      = parseFloat(String(n.pago_neto));
    const propSal   = salBase / DIAS_MES * n.dias_trabajados;
    return {
      id: n.id,
      employeeId: n.empleado_id,
      employeeName: n.empleado ? `${n.empleado.nombres} ${n.empleado.apellidos}` : '—',
      employeeDocument: n.empleado?.tipoDocumento && n.empleado?.numeroDocumento
        ? `${n.empleado.tipoDocumento} ${n.empleado.numeroDocumento}`
        : '—',
      position: n.empleado?.cargo ?? '—',
      baseSalary: salBase,
      daysWorked: n.dias_trabajados,
      weekLabel: `${n.fecha_inicio_periodo} – ${n.fecha_fin_periodo}`,
      paymentDate: n.fecha_pago,
      estado: n.estado,
      recargoNocturno: 0, recargoDiurnoDominical: 0, recargoNocturnoDominical: 0,
      horaExtraDiurna: 0, horaExtraNocturna: 0, horaExtraDiurnaDominical: 0, horaExtraNocturnaDominical: 0,
      hasTransportAllowance: auxTrans > 0,
      calculatedValues: {
        proportionalSalary: propSal,
        recargoNocturno: 0, recargoDiurnoDominical: 0, recargoNocturnoDominical: 0,
        horaExtraDiurna: 0, horaExtraNocturna: 0, horaExtraDiurnaDominical: 0, horaExtraNocturnaDominical: 0,
        transportAllowance: auxTrans,
        totalEarned: neto,
        healthDeduction: 0,
        pensionDeduction: 0,
        totalDeductions: 0,
        netPay: neto,
      },
      createdAt: n.fecha_pago,
    };
  };

  const handleMarcarPagada = async (record: PayrollRecord) => {
    if (!record.id) return;
    try {
      await apiMarcarPagada(record.id);
      toast.success(`Control de pagos de ${record.employeeName} marcado como pagado`);
      fetchNominas();
    } catch (err: any) {
      toast.error('Error: ' + (err?.message ?? 'No se pudo marcar como pagada'));
    }
  };

  const handleEmployeeChange = (employeeId: string) => {
    const emp = employees.find((e) => String(e.id) === employeeId);
    if (!emp) return;

    const startYMD = toYMD(weekStart);
    const endYMD   = toYMD(selectedFriday);

    // Todas las horas extras aprobadas del empleado (sin restricción de período)
    const empHE = allHE.filter(
      (he) => he.empleadoId === emp.id && he.estado === 'aprobada'
    );
    let recNoc = 0, recDiurDom = 0, recNocDom = 0;
    let heDiur = 0, heNoc = 0, heDiurDom = 0, heNocDom = 0;
    empHE.forEach((he) => {
      switch (he.tipo) {
        case 'Recargo Nocturno':                    recNoc    += he.horas; break;
        case 'Recargo Diurno Dominical':            recDiurDom += he.horas; break;
        case 'Recargo Nocturno Dominical':          recNocDom  += he.horas; break;
        case 'Hora Extra Diurna':                   heDiur     += he.horas; break;
        case 'Hora Extra Nocturna':                 heNoc      += he.horas; break;
        case 'Hora Extra Diurna Dominical/Festiva': heDiurDom  += he.horas; break;
      }
    });

    // Días ausentes por novedades aprobadas sin remuneración o rechazadas que se solapen con la semana
    const empNov = allNov.filter(
      (n) => Number(n.empleado_afectado) === emp.id &&
              (n.estado === 'aprobada_sin_remuneracion' || n.estado === 'rechazada') &&
              n.fecha_inicio.substring(0, 10) <= endYMD &&
              n.fecha_finalizacion.substring(0, 10) >= startYMD
    );
    let absentDays = 0;
    empNov.forEach((n) => {
      if (n.horas_ausencia != null && n.horas_ausencia > 0) {
        absentDays += n.horas_ausencia / 8;
      } else {
        const s = n.fecha_inicio.substring(0, 10)       > startYMD ? n.fecha_inicio.substring(0, 10)       : startYMD;
        const e = n.fecha_finalizacion.substring(0, 10) < endYMD   ? n.fecha_finalizacion.substring(0, 10) : endYMD;
        const ms = new Date(e + 'T00:00:00').getTime() - new Date(s + 'T00:00:00').getTime();
        absentDays += Math.round(ms / 86400000) + 1;
      }
    });
    const daysWorked = Math.max(0, 7 - absentDays);

    setWeekInfo({ heCount: empHE.length, absenceDays: absentDays });
    setEmpWeekHE(empHE);
    setEmpWeekNov(empNov);
    setFormData((prev) => ({
      ...prev,
      employeeId,
      employeeName:     `${emp.nombres} ${emp.apellidos}`,
      employeeDocument: `${emp.tipoDocumento} ${emp.numeroDocumento}`,
      position:         emp.cargo,
      baseSalary:       emp.salario ? String(parseFloat(String(emp.salario))) : prev.baseSalary,
      recargoNocturno:          String(recNoc),
      recargoDiurnoDominical:   String(recDiurDom),
      recargoNocturnoDominical:  String(recNocDom),
      horaExtraDiurna:          String(heDiur),
      horaExtraNocturna:        String(heNoc),
      horaExtraDiurnaDominical:  String(heDiurDom),
      horaExtraNocturnaDominical: String(heNocDom),
      daysWorked:               String(daysWorked),
    }));
  };

  const calculatePayroll = () => {
    const baseSalary   = parseFloat(formData.baseSalary) || 0;
    const daysWorked   = parseFloat(formData.daysWorked) || 0;
    const h_recNoc     = parseFloat(formData.recargoNocturno)           || 0;
    const h_recDiurDom = parseFloat(formData.recargoDiurnoDominical)    || 0;
    const h_recNocDom  = parseFloat(formData.recargoNocturnoDominical)  || 0;
    const h_heDiur     = parseFloat(formData.horaExtraDiurna)           || 0;
    const h_heNoc      = parseFloat(formData.horaExtraNocturna)         || 0;
    const h_heDiurDom  = parseFloat(formData.horaExtraDiurnaDominical)  || 0;
    const h_heNocDom   = parseFloat(formData.horaExtraNocturnaDominical) || 0;

    const proportionalSalary       = (baseSalary / DIAS_MES) * daysWorked;
    const hourValue                 = baseSalary / HORAS_MENSUALES;
    const recargoNocturno           = hourValue * PCT_REC_NOC      * h_recNoc;
    const recargoDiurnoDominical    = hourValue * PCT_REC_DIUR_DOM * h_recDiurDom;
    const recargoNocturnoDominical  = hourValue * PCT_REC_NOC_DOM  * h_recNocDom;
    const horaExtraDiurna           = hourValue * (1 + PCT_HE_DIUR)     * h_heDiur;
    const horaExtraNocturna         = hourValue * (1 + PCT_HE_NOC)      * h_heNoc;
    const horaExtraDiurnaDominical  = hourValue * (1 + PCT_HE_DIUR_DOM) * h_heDiurDom;
    const horaExtraNocturnaDominical = hourValue * (1 + PCT_HE_NOC_DOM) * h_heNocDom;
    const transportAllowance        =
      daysWorked > 0 && formData.hasTransportAllowance && baseSalary <= SALARIO_MINIMO_2026 * 2
        ? (AUXILIO_TRANSPORTE_2026 / DIAS_MES) * daysWorked : 0;
    const totalEarned      = proportionalSalary + recargoNocturno + recargoDiurnoDominical
                           + recargoNocturnoDominical + horaExtraDiurna + horaExtraNocturna
                           + horaExtraDiurnaDominical + horaExtraNocturnaDominical + transportAllowance;
    const healthDeduction  = 0;
    const pensionDeduction = 0;
    const totalDeductions  = 0;
    const netPay           = totalEarned;

    return {
      proportionalSalary, recargoNocturno, recargoDiurnoDominical, recargoNocturnoDominical,
      horaExtraDiurna, horaExtraNocturna, horaExtraDiurnaDominical, horaExtraNocturnaDominical,
      transportAllowance, totalEarned, healthDeduction, pensionDeduction, totalDeductions, netPay,
    };
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.employeeId) {
      toast.error('Debes seleccionar un empleado');
      return;
    }

    // Validar que el viernes seleccionado no supere una semana más allá del viernes actual
    const maxFriday = addDays(getFriday(new Date()), 7);
    if (selectedFriday > maxFriday) {
      toast.error(
        `La fecha de corte ${toYMD(selectedFriday)} supera el límite permitido (máximo hasta ${toYMD(maxFriday)}). No se puede calcular el control de pagos para semanas tan adelantadas.`
      );
      return;
    }

    const fechaCorte = toYMD(selectedFriday);
    const empId = parseInt(formData.employeeId);
    const duplicado = payrollRecords.find(r =>
      r.employeeId === empId &&
      r.paymentDate === fechaCorte &&
      (!editingRecord || r.id !== editingRecord.id)
    );
    if (duplicado) {
      toast.error(`Ya existe un registro de control de pagos para ${formData.employeeName} en la semana que cierra el ${fechaCorte}`);
      return;
    }

    const calculatedValues = calculatePayroll();
    const totalHE =
      calculatedValues.recargoNocturno + calculatedValues.recargoDiurnoDominical +
      calculatedValues.recargoNocturnoDominical + calculatedValues.horaExtraDiurna +
      calculatedValues.horaExtraNocturna + calculatedValues.horaExtraDiurnaDominical +
      calculatedValues.horaExtraNocturnaDominical;

    const payload = {
      empleado_id:          parseInt(formData.employeeId),
      fecha_inicio_periodo: toYMD(weekStart),
      fecha_fin_periodo:    toYMD(selectedFriday),
      fecha_pago:           toYMD(selectedFriday),
      dias_trabajados:      parseFloat(formData.daysWorked),
      salario_base:         parseFloat(formData.baseSalary),
      auxilio_transporte:   calculatedValues.transportAllowance,
      total_horas_extras:   totalHE,
      deducciones:          calculatedValues.totalDeductions,
      pago_neto:            calculatedValues.netPay,
    };

    setSaving(true);
    try {
      if (editingRecord) {
        await updateNominaApi(editingRecord.id, payload);
        toast.success('Control de pagos actualizado exitosamente');
      } else {
        await createNomina(payload);
        toast.success('Control de pagos guardado exitosamente');
      }
      await fetchNominas();
      resetForm();
    } catch (err: any) {
      toast.error('Error al guardar: ' + (err?.message ?? 'Error desconocido'));
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      employeeName: '',
      employeeDocument: '',
      position: '',
      baseSalary: '',
      daysWorked: '7',
      recargoNocturno: '0',
      recargoDiurnoDominical: '0',
      recargoNocturnoDominical: '0',
      horaExtraDiurna: '0',
      horaExtraNocturna: '0',
      horaExtraDiurnaDominical: '0',
      horaExtraNocturnaDominical: '0',
      hasTransportAllowance: true,
    });
    setWeekInfo(null);
    setEmpWeekHE([]);
    setEmpWeekNov([]);
    setEditingRecord(null);
    setShowCalculatorModal(false);
  };

  const handleEdit = (record: PayrollRecord) => {
    setFormData({
      employeeId:           record.employeeId ? String(record.employeeId) : '',
      employeeName:         record.employeeName,
      employeeDocument:     record.employeeDocument,
      position:             record.position,
      baseSalary:           record.baseSalary.toString(),
      daysWorked:                record.daysWorked.toString(),
      recargoNocturno:           record.recargoNocturno.toString(),
      recargoDiurnoDominical:    record.recargoDiurnoDominical.toString(),
      recargoNocturnoDominical:  record.recargoNocturnoDominical.toString(),
      horaExtraDiurna:           record.horaExtraDiurna.toString(),
      horaExtraNocturna:         record.horaExtraNocturna.toString(),
      horaExtraDiurnaDominical:  record.horaExtraDiurnaDominical.toString(),
      horaExtraNocturnaDominical: record.horaExtraNocturnaDominical.toString(),
      hasTransportAllowance: record.hasTransportAllowance,
    });
    setEditingRecord(record);
    setShowCalculatorModal(true);
  };

  const handleViewDetail = (record: PayrollRecord) => {
    const emp = employees.find((e) => String(e.id) === String(record.employeeId));
    setViewingRecord({
      ...record,
      employeeDocument: emp
        ? `${emp.tipoDocumento} ${emp.numeroDocumento}`
        : record.employeeDocument,
    });
    setShowDetailModal(true);
  };

  const generatePDF = (record: PayrollRecord) => {
    generarPdfNomina(record, formatCurrency);
    toast.success(`Desprendible generado para ${record.employeeName}`);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const previewCalculation = formData.baseSalary ? calculatePayroll() : null;

  const totalPages    = Math.ceil(payrollRecords.length / itemsPerPage);
  const startIndex    = (currentPage - 1) * itemsPerPage;
  const currentRecords = payrollRecords.slice(startIndex, startIndex + itemsPerPage);

  const activeEmployees = employees.filter((e) => e.estado === 'activo');

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl text-blue-900 font-bold mb-2 flex items-center gap-3">
              <CalculatorIcon className="w-8 h-8 text-blue-600" />
              Módulo de Control de Pagos
            </h1>
            <p className="text-blue-800">Sistema integral de cálculo y control de pagos empresarial</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Navegación de semana */}
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => setSelectedFriday((prev) => addDays(prev, -7))}
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </Button>
              <div className="text-center min-w-[210px] px-2">
                <p className="text-[11px] text-gray-400 leading-tight flex items-center justify-center gap-1">
                  <CalendarIcon className="w-3 h-3" /> Semana de pago
                </p>
                <p className="font-semibold text-gray-800 text-sm leading-tight mt-0.5">
                  {loadingWeek ? 'Cargando...' : weekLabel}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => setSelectedFriday((prev) => addDays(prev, 7))}
              >
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </div>

          <Dialog open={showCalculatorModal} onOpenChange={setShowCalculatorModal}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" size="lg">
                <CalculatorIcon className="w-4 h-4 mr-2" />
                Calcular Pago
              </Button>
            </DialogTrigger>

            <DialogContent className="p-0 gap-0 overflow-hidden" style={{ width: '96vw', maxWidth: 1400, height: '92vh', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
              <div className="overflow-y-auto flex-1 p-6">
                <DialogHeader>
                  <DialogTitle className="text-2xl flex items-center gap-2">
                    <CalculatorIcon className="w-6 h-6 text-blue-600" />
                    {editingRecord ? 'Editar Control de Pagos' : 'Calculadora de Control de Pagos'}
                  </DialogTitle>
                  <DialogDescription className="flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
                    Período: <span className="font-medium text-gray-700">{weekLabel}</span>
                    &nbsp;·&nbsp;Pago el viernes {toYMD(selectedFriday)}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Formulario */}
                    <div className="space-y-6">

                      {/* Datos del empleado */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <UserIcon className="w-5 h-5 text-blue-600" />
                            Datos del Empleado
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">

                          {/* Selector de empleado */}
                          <div className="space-y-2">
                            <Label>Empleado *</Label>
                            {loadingEmployees ? (
                              <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Cargando empleados...
                              </div>
                            ) : (
                              <Select
                                value={formData.employeeId}
                                onValueChange={handleEmployeeChange}
                                required
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar empleado..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {activeEmployees.length === 0 ? (
                                    <SelectItem value="none" disabled>
                                      No hay empleados activos
                                    </SelectItem>
                                  ) : (
                                    activeEmployees.map((emp) => (
                                      <SelectItem key={emp.id} value={String(emp.id)}>
                                        {emp.nombres} {emp.apellidos} — {emp.cargo}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                            )}
                          </div>

                          {/* Info del empleado seleccionado */}
                          {formData.employeeName && (
                            <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50 rounded-lg text-sm border border-blue-100">
                              <div>
                                <p className="text-xs text-gray-500 mb-0.5">Documento</p>
                                <p className="font-medium text-gray-900">{formData.employeeDocument}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-0.5">Cargo</p>
                                <p className="font-medium text-gray-900">{formData.position}</p>
                              </div>
                            </div>
                          )}

                          <div className="space-y-2">
                            <Label>Salario base mensual</Label>
                            {formData.baseSalary ? (
                              <div className="flex items-center justify-between px-3 py-2 rounded-md bg-green-50 border border-green-200 text-sm">
                                <span className="font-semibold text-gray-900">
                                  {formatCurrency(parseFloat(formData.baseSalary))}
                                </span>
                                <span className="text-xs text-green-600 font-medium">✓ Módulo Empleados</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-gray-50 border border-dashed border-gray-300 text-sm text-gray-400">
                                Selecciona un empleado para cargar el salario
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="daysWorked">Días trabajados en la semana *</Label>
                            <Input
                              id="daysWorked"
                              type="number"
                              min="0"
                              step="any"
                              value={formData.daysWorked}
                              onChange={(e) => setFormData({ ...formData, daysWorked: e.target.value })}
                              required
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Horas extras */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <ClockIcon className="w-5 h-5 text-blue-600" />
                            Recargos y Horas Extras
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                            <ClockIcon className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600" />
                            <span>Estos valores se calculan automáticamente desde el módulo de <strong>Novedades</strong> y <strong>Horas Extras</strong>. No se pueden editar manualmente.</span>
                          </div>
                          {/* Recargos */}
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recargos</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label htmlFor="recargoNocturno" className="text-xs">Recargo Nocturno (+35%)</Label>
                              <Input id="recargoNocturno" type="number" min="0" step="0.5"
                                value={formData.recargoNocturno}
                                readOnly
                                className="bg-gray-50 cursor-not-allowed text-gray-600" />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="recargoDiurnoDominical" className="text-xs">Recargo Diurno Dominical (+75%)</Label>
                              <Input id="recargoDiurnoDominical" type="number" min="0" step="0.5"
                                value={formData.recargoDiurnoDominical}
                                readOnly
                                className="bg-gray-50 cursor-not-allowed text-gray-600" />
                            </div>
                            <div className="space-y-1 col-span-2">
                              <Label htmlFor="recargoNocturnoDominical" className="text-xs">Recargo Nocturno Dominical (+110%)</Label>
                              <Input id="recargoNocturnoDominical" type="number" min="0" step="0.5"
                                value={formData.recargoNocturnoDominical}
                                readOnly
                                className="bg-gray-50 cursor-not-allowed text-gray-600" />
                            </div>
                          </div>
                          {/* Horas extras */}
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-1">Horas Extras</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label htmlFor="horaExtraDiurna" className="text-xs">Hora Extra Diurna (+25%)</Label>
                              <Input id="horaExtraDiurna" type="number" min="0" step="0.5"
                                value={formData.horaExtraDiurna}
                                readOnly
                                className="bg-gray-50 cursor-not-allowed text-gray-600" />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="horaExtraNocturna" className="text-xs">Hora Extra Nocturna (+75%)</Label>
                              <Input id="horaExtraNocturna" type="number" min="0" step="0.5"
                                value={formData.horaExtraNocturna}
                                readOnly
                                className="bg-gray-50 cursor-not-allowed text-gray-600" />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="horaExtraDiurnaDominical" className="text-xs">Hora Extra Diurna Dominical (+100%)</Label>
                              <Input id="horaExtraDiurnaDominical" type="number" min="0" step="0.5"
                                value={formData.horaExtraDiurnaDominical}
                                readOnly
                                className="bg-gray-50 cursor-not-allowed text-gray-600" />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="horaExtraNocturnaDominical" className="text-xs">Hora Extra Nocturna Dominical (+150%)</Label>
                              <Input id="horaExtraNocturnaDominical" type="number" min="0" step="0.5"
                                value={formData.horaExtraNocturnaDominical}
                                readOnly
                                className="bg-gray-50 cursor-not-allowed text-gray-600" />
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                            <Switch
                              checked={formData.hasTransportAllowance}
                              onCheckedChange={(checked: boolean) => setFormData({ ...formData, hasTransportAllowance: checked })}
                            />
                            <div>
                              <Label className="cursor-pointer">Auxilio de transporte</Label>
                              <p className="text-sm text-gray-600">Aplica solo para salarios hasta 2 SMLV</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Panel de resultados */}
                    <div className="space-y-6">
                      <Card className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <DollarSignIcon className="w-5 h-5 text-blue-600" />
                            Cálculo de Control de Pagos
                          </CardTitle>
                          <CardDescription>Vista previa del cálculo automático</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {previewCalculation ? (
                            <>
                              <div className="space-y-3">
                                <h3 className="font-semibold text-sm text-gray-700 uppercase">Devengos</h3>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Salario base (proporcional)</span>
                                    <span className="font-medium">{formatCurrency(previewCalculation.proportionalSalary)}</span>
                                  </div>
                                  {previewCalculation.recargoNocturno > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Recargo Nocturno (+35%)</span>
                                      <span className="font-medium text-blue-600">{formatCurrency(previewCalculation.recargoNocturno)}</span>
                                    </div>
                                  )}
                                  {previewCalculation.recargoDiurnoDominical > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Recargo Diurno Dominical (+75%)</span>
                                      <span className="font-medium text-blue-600">{formatCurrency(previewCalculation.recargoDiurnoDominical)}</span>
                                    </div>
                                  )}
                                  {previewCalculation.recargoNocturnoDominical > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Recargo Nocturno Dominical (+110%)</span>
                                      <span className="font-medium text-blue-600">{formatCurrency(previewCalculation.recargoNocturnoDominical)}</span>
                                    </div>
                                  )}
                                  {previewCalculation.horaExtraDiurna > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Hora Extra Diurna (+25%)</span>
                                      <span className="font-medium text-blue-600">{formatCurrency(previewCalculation.horaExtraDiurna)}</span>
                                    </div>
                                  )}
                                  {previewCalculation.horaExtraNocturna > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Hora Extra Nocturna (+75%)</span>
                                      <span className="font-medium text-blue-600">{formatCurrency(previewCalculation.horaExtraNocturna)}</span>
                                    </div>
                                  )}
                                  {previewCalculation.horaExtraDiurnaDominical > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Hora Extra Diurna Dominical (+100%)</span>
                                      <span className="font-medium text-blue-600">{formatCurrency(previewCalculation.horaExtraDiurnaDominical)}</span>
                                    </div>
                                  )}
                                  {previewCalculation.horaExtraNocturnaDominical > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Hora Extra Nocturna Dominical (+150%)</span>
                                      <span className="font-medium text-blue-600">{formatCurrency(previewCalculation.horaExtraNocturnaDominical)}</span>
                                    </div>
                                  )}
                                  {previewCalculation.transportAllowance > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Auxilio de transporte</span>
                                      <span className="font-medium text-green-600">{formatCurrency(previewCalculation.transportAllowance)}</span>
                                    </div>
                                  )}
                                </div>

                                <Separator />

                                <div className="flex justify-between text-base font-semibold">
                                  <span>Total devengado</span>
                                  <span className="text-blue-600">{formatCurrency(previewCalculation.totalEarned)}</span>
                                </div>
                              </div>

                              <Separator className="my-4" />

                              <div className="bg-blue-600 text-white p-6 rounded-lg">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="text-sm opacity-90 mb-1">Neto a pagar</p>
                                    <p className="text-3xl font-bold">{formatCurrency(previewCalculation.netPay)}</p>
                                  </div>
                                  <DollarSignIcon className="w-12 h-12 opacity-50" />
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="text-center py-12 text-gray-500">
                              <CalculatorIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                              <p>Selecciona un empleado e ingresa el salario para ver el cálculo</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Registros de la semana: Horas Extra y Ausencias */}
                  {formData.employeeId && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                      {/* Tabla Horas Extra */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <ClockIcon className="w-4 h-4 text-blue-600" />
                            Horas Extras Aprobadas
                            {empWeekHE.length > 0 && (
                              <Badge className="ml-auto bg-blue-100 text-blue-700 font-medium">
                                {empWeekHE.length} registro(s)
                              </Badge>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          {empWeekHE.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-6 px-4">
                              Sin horas extras aprobadas
                            </p>
                          ) : (
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50 border-y border-gray-100">
                                <tr>
                                  <th className="px-4 py-2 text-left text-gray-500 font-medium">Fecha</th>
                                  <th className="px-4 py-2 text-left text-gray-500 font-medium">Tipo</th>
                                  <th className="px-4 py-2 text-right text-gray-500 font-medium">Horas</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {empWeekHE.map((he) => (
                                  <tr key={he.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 text-gray-700 whitespace-nowrap">{he.fecha}</td>
                                    <td className="px-4 py-2 text-gray-700">{he.tipo}</td>
                                    <td className="px-4 py-2 text-right font-medium text-blue-700">{he.horas}h</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot className="border-t border-gray-200 bg-blue-50">
                                <tr>
                                  <td colSpan={2} className="px-4 py-2 text-sm font-semibold text-gray-700">Total horas</td>
                                  <td className="px-4 py-2 text-right font-bold text-blue-700">
                                    {empWeekHE.reduce((s, h) => s + h.horas, 0)}h
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          )}
                        </CardContent>
                      </Card>

                      {/* Tabla Ausencias / Novedades */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <AlertCircleIcon className="w-4 h-4 text-amber-500" />
                            Ausencias de la semana
                            {empWeekNov.length > 0 && (
                              <Badge className="ml-auto bg-amber-100 text-amber-700 font-medium">
                                {empWeekNov.length} novedad(es)
                              </Badge>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          {empWeekNov.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-6 px-4">
                              Sin ausencias registradas esta semana
                            </p>
                          ) : (
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50 border-y border-gray-100">
                                <tr>
                                  <th className="px-4 py-2 text-left text-gray-500 font-medium">Novedad</th>
                                  <th className="px-4 py-2 text-center text-gray-500 font-medium">Inicio</th>
                                  <th className="px-4 py-2 text-center text-gray-500 font-medium">Fin</th>
                                  <th className="px-4 py-2 text-right text-gray-500 font-medium">Días</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {empWeekNov.map((n) => {
                                  const startYMD = toYMD(weekStart);
                                  const endYMD   = toYMD(selectedFriday);
                                  const s  = n.fecha_inicio.substring(0, 10)       > startYMD ? n.fecha_inicio.substring(0, 10)       : startYMD;
                                  const e  = n.fecha_finalizacion.substring(0, 10) < endYMD   ? n.fecha_finalizacion.substring(0, 10) : endYMD;
                                  const dias = Math.round((new Date(e + 'T00:00:00').getTime() - new Date(s + 'T00:00:00').getTime()) / 86400000) + 1;
                                  return (
                                    <tr key={n.id} className="hover:bg-gray-50">
                                      <td className="px-4 py-2 text-gray-700">{n.titulo}</td>
                                      <td className="px-4 py-2 text-center text-gray-500 whitespace-nowrap">{n.fecha_inicio}</td>
                                      <td className="px-4 py-2 text-center text-gray-500 whitespace-nowrap">{n.fecha_finalizacion}</td>
                                      <td className="px-4 py-2 text-right font-medium text-amber-700">{dias}d</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                              <tfoot className="border-t border-gray-200 bg-amber-50">
                                <tr>
                                  <td colSpan={3} className="px-4 py-2 text-sm font-semibold text-gray-700">Días ausentes en semana</td>
                                  <td className="px-4 py-2 text-right font-bold text-amber-700">
                                    {weekInfo?.absenceDays ?? 0}d
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          )}
                        </CardContent>
                      </Card>

                    </div>
                  )}

                  <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={saving}>
                      {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      {editingRecord ? 'Actualizar Control de Pagos' : 'Guardar Control de Pagos'}
                    </Button>
                  </div>
                </form>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Tabla de nóminas */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileTextIcon className="w-5 h-5 text-blue-600" />
              Registro de Control de Pagos
            </CardTitle>
            <CardDescription>Historial completo de registros de control de pagos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Empleado</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Cargo</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Período</th>
                    <th className="px-6 py-3 text-right text-xs text-gray-600 uppercase tracking-wider">Salario base</th>
                    <th className="px-6 py-3 text-center text-xs text-gray-600 uppercase tracking-wider">Días de trabajo</th>
                    <th className="px-6 py-3 text-right text-xs text-gray-600 uppercase tracking-wider">Neto a pagar</th>
                    <th className="px-6 py-3 text-center text-xs text-gray-600 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-center text-xs text-gray-600 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                        No hay registros. Usa "Calcular Pago" para registrar el pago semanal.
                      </td>
                    </tr>
                  ) : (
                    currentRecords.map((record) => (
                      <tr key={record.id} className="border-b border-blue-100 hover:bg-blue-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            
                            <span className="font-medium text-gray-900">{record.employeeName}</span>
                            <span className="text-sm text-gray-500">{record.employeeDocument}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="secondary">{record.position}</Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {record.weekLabel ?? '—'}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-900">
                          {formatCurrency(record.baseSalary)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant="outline">{record.daysWorked} días</Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-bold text-blue-600 text-base">
                            {formatCurrency(record.calculatedValues.netPay)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge className={record.estado === 'pagado'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-yellow-100 text-yellow-800 border border-yellow-200'}>
                            {record.estado === 'pagado' ? 'Pagado' : 'Pendiente'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center space-x-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  onClick={() => handleViewDetail(record)}
                                  className="bg-white text-blue-900 border border-blue-900 hover:bg-blue-50"
                                >
                                  <EyeIcon className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Ver detalle</p></TooltipContent>
                            </Tooltip>

                            {record.estado === 'pendiente' && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    onClick={() => handleEdit(record)}
                                    className="bg-white text-blue-900 border border-blue-900 hover:bg-blue-50"
                                  >
                                    <EditIcon className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Editar control de pagos</p></TooltipContent>
                              </Tooltip>
                            )}

                            {record.estado === 'pendiente' && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    onClick={() => handleMarcarPagada(record)}
                                    className="bg-green-600 hover:bg-green-700 text-white border-0"
                                  >
                                    <DollarSignIcon className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Marcar como pagada</p></TooltipContent>
                              </Tooltip>
                            )}

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  onClick={() => generatePDF(record)}
                                  className="bg-white text-blue-900 border border-blue-900 hover:bg-blue-50"
                                >
                                  <FileTextIcon className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Descargar desprendible PDF</p></TooltipContent>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <SmartPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={payrollRecords.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </CardContent>
        </Card>

        {/* Modal de detalle */}
        <NominaDetailModal
          open={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          record={viewingRecord}
        />
      </div>
    </TooltipProvider>
  );
}
