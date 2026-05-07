import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
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
  BarChart3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Loader2,
} from 'lucide-react';
import { getEmpleados, type Empleado } from '@/features/employed/services/empleadosService';
// @ts-ignore
import { generarPdfNomina } from '../utils/generarPdfNomina';

// Constantes para cálculos de nómina en Colombia 2026
const SALARIO_MINIMO_2026 = 1423500;
const AUXILIO_TRANSPORTE_2026 = 200000;
const PORCENTAJE_RECARGO_NOCTURNO = 0.35;
const PORCENTAJE_HORA_EXTRA_DIURNA = 0.25;
const PORCENTAJE_HORA_DOMINICAL = 0.75;
const PORCENTAJE_HORA_FESTIVA = 0.75;
const DIAS_MES = 30;
const HORAS_MENSUALES = 240;
const PORCENTAJE_SALUD = 0.04;
const PORCENTAJE_PENSION = 0.04;

interface PayrollRecord {
  id: number;
  employeeId?: number;
  employeeName: string;
  employeeDocument: string;
  position: string;
  baseSalary: number;
  daysWorked: number;
  nightHours: number;
  extraDayHours: number;
  sundayHours: number;
  holidayHours: number;
  hasTransportAllowance: boolean;
  calculatedValues: {
    proportionalSalary: number;
    nightSurcharge: number;
    extraDayPay: number;
    sundayPay: number;
    holidayPay: number;
    transportAllowance: number;
    totalEarned: number;
    healthDeduction: number;
    pensionDeduction: number;
    totalDeductions: number;
    netPay: number;
  };
  createdAt: string;
}

export function PayrollModule() {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([
    {
      id: 1,
      employeeName: 'Juan Pérez',
      employeeDocument: 'CC 1234567890',
      position: 'Operario',
      baseSalary: 1500000,
      daysWorked: 30,
      nightHours: 20,
      extraDayHours: 8,
      sundayHours: 8,
      holidayHours: 0,
      hasTransportAllowance: true,
      calculatedValues: {
        proportionalSalary: 1500000,
        nightSurcharge: 43750,
        extraDayPay: 78125,
        sundayPay: 109375,
        holidayPay: 0,
        transportAllowance: 200000,
        totalEarned: 1931250,
        healthDeduction: 60000,
        pensionDeduction: 60000,
        totalDeductions: 120000,
        netPay: 1811250,
      },
      createdAt: '2026-05-01',
    },
    {
      id: 2,
      employeeName: 'María González',
      employeeDocument: 'CC 9876543210',
      position: 'Supervisor',
      baseSalary: 2500000,
      daysWorked: 30,
      nightHours: 0,
      extraDayHours: 4,
      sundayHours: 0,
      holidayHours: 8,
      hasTransportAllowance: false,
      calculatedValues: {
        proportionalSalary: 2500000,
        nightSurcharge: 0,
        extraDayPay: 65104,
        sundayPay: 0,
        holidayPay: 182292,
        transportAllowance: 0,
        totalEarned: 2747396,
        healthDeduction: 100000,
        pensionDeduction: 100000,
        totalDeductions: 200000,
        netPay: 2547396,
      },
      createdAt: '2026-05-01',
    },
  ]);

  const [employees, setEmployees] = useState<Empleado[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

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
    daysWorked: '30',
    nightHours: '0',
    extraDayHours: '0',
    sundayHours: '0',
    holidayHours: '0',
    hasTransportAllowance: true,
  });

  useEffect(() => {
    setLoadingEmployees(true);
    getEmpleados()
      .then((data) => setEmployees(data))
      .catch(() => toast.error('Error al cargar empleados'))
      .finally(() => setLoadingEmployees(false));
  }, []);

  const handleEmployeeChange = (employeeId: string) => {
    const emp = employees.find((e) => String(e.id) === employeeId);
    if (emp) {
      setFormData((prev) => ({
        ...prev,
        employeeId,
        employeeName: `${emp.nombres} ${emp.apellidos}`,
        employeeDocument: `${emp.tipoDocumento} ${emp.numeroDocumento}`,
        position: emp.cargo,
      }));
    }
  };

  const calculatePayroll = () => {
    const baseSalary     = parseFloat(formData.baseSalary) || 0;
    const daysWorked     = parseFloat(formData.daysWorked) || 0;
    const nightHours     = parseFloat(formData.nightHours) || 0;
    const extraDayHours  = parseFloat(formData.extraDayHours) || 0;
    const sundayHours    = parseFloat(formData.sundayHours) || 0;
    const holidayHours   = parseFloat(formData.holidayHours) || 0;

    const proportionalSalary  = (baseSalary / DIAS_MES) * daysWorked;
    const hourValue            = baseSalary / HORAS_MENSUALES;
    const nightSurcharge       = hourValue * PORCENTAJE_RECARGO_NOCTURNO * nightHours;
    const extraDayPay          = hourValue * (1 + PORCENTAJE_HORA_EXTRA_DIURNA) * extraDayHours;
    const sundayPay            = hourValue * (1 + PORCENTAJE_HORA_DOMINICAL) * sundayHours;
    const holidayPay           = hourValue * (1 + PORCENTAJE_HORA_FESTIVA) * holidayHours;
    const transportAllowance   =
      formData.hasTransportAllowance && baseSalary <= SALARIO_MINIMO_2026 * 2
        ? AUXILIO_TRANSPORTE_2026
        : 0;
    const totalEarned       = proportionalSalary + nightSurcharge + extraDayPay + sundayPay + holidayPay + transportAllowance;
    const healthDeduction   = baseSalary * PORCENTAJE_SALUD;
    const pensionDeduction  = baseSalary * PORCENTAJE_PENSION;
    const totalDeductions   = healthDeduction + pensionDeduction;
    const netPay            = totalEarned - totalDeductions;

    return { proportionalSalary, nightSurcharge, extraDayPay, sundayPay, holidayPay, transportAllowance, totalEarned, healthDeduction, pensionDeduction, totalDeductions, netPay };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employeeId && !formData.employeeName) {
      toast.error('Debes seleccionar un empleado');
      return;
    }

    const calculatedValues = calculatePayroll();
    const newRecord: PayrollRecord = {
      id:                   editingRecord ? editingRecord.id : Date.now(),
      employeeId:           formData.employeeId ? parseInt(formData.employeeId) : undefined,
      employeeName:         formData.employeeName,
      employeeDocument:     formData.employeeDocument,
      position:             formData.position,
      baseSalary:           parseFloat(formData.baseSalary),
      daysWorked:           parseFloat(formData.daysWorked),
      nightHours:           parseFloat(formData.nightHours),
      extraDayHours:        parseFloat(formData.extraDayHours),
      sundayHours:          parseFloat(formData.sundayHours),
      holidayHours:         parseFloat(formData.holidayHours),
      hasTransportAllowance: formData.hasTransportAllowance,
      calculatedValues,
      createdAt: editingRecord ? editingRecord.createdAt : new Date().toISOString().split('T')[0],
    };

    if (editingRecord) {
      setPayrollRecords(payrollRecords.map((r) => (r.id === editingRecord.id ? newRecord : r)));
      toast.success('Nómina actualizada exitosamente');
    } else {
      setPayrollRecords([...payrollRecords, newRecord]);
      toast.success('Nómina calculada y guardada exitosamente');
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      employeeName: '',
      employeeDocument: '',
      position: '',
      baseSalary: '',
      daysWorked: '30',
      nightHours: '0',
      extraDayHours: '0',
      sundayHours: '0',
      holidayHours: '0',
      hasTransportAllowance: true,
    });
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
      daysWorked:           record.daysWorked.toString(),
      nightHours:           record.nightHours.toString(),
      extraDayHours:        record.extraDayHours.toString(),
      sundayHours:          record.sundayHours.toString(),
      holidayHours:         record.holidayHours.toString(),
      hasTransportAllowance: record.hasTransportAllowance,
    });
    setEditingRecord(record);
    setShowCalculatorModal(true);
  };

  const handleViewDetail = (record: PayrollRecord) => {
    setViewingRecord(record);
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

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage, '...', totalPages);
      }
    }
    return pages;
  };

  const activeEmployees = employees.filter((e) => e.estado === 'activo');

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl text-blue-900 font-bold mb-2 flex items-center gap-3">
              <CalculatorIcon className="w-8 h-8 text-blue-600" />
              Módulo de Nómina
            </h1>
            <p className="text-blue-800">Sistema integral de cálculo y gestión de nómina empresarial</p>
          </div>

          <Dialog open={showCalculatorModal} onOpenChange={setShowCalculatorModal}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" size="lg">
                <CalculatorIcon className="w-4 h-4 mr-2" />
                Calcular Nómina
              </Button>
            </DialogTrigger>

            <DialogContent className="p-0 gap-0 overflow-hidden" style={{ width: '96vw', maxWidth: 1400, height: '92vh', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
              <div className="overflow-y-auto flex-1 p-6">
                <DialogHeader>
                  <DialogTitle className="text-2xl flex items-center gap-2">
                    <CalculatorIcon className="w-6 h-6 text-blue-600" />
                    {editingRecord ? 'Editar Nómina' : 'Calculadora de Nómina'}
                  </DialogTitle>
                  <DialogDescription>
                    Selecciona el empleado y el sistema calculará automáticamente todos los conceptos de nómina
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
                            <Label htmlFor="baseSalary">Salario base mensual *</Label>
                            <Input
                              id="baseSalary"
                              type="number"
                              value={formData.baseSalary}
                              onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                              placeholder="1500000"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="daysWorked">Días trabajados *</Label>
                            <Input
                              id="daysWorked"
                              type="number"
                              min="1"
                              max="30"
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
                            Horas Extras y Recargos
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="nightHours">Horas nocturnas</Label>
                              <Input id="nightHours" type="number" min="0" value={formData.nightHours}
                                onChange={(e) => setFormData({ ...formData, nightHours: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="extraDayHours">Horas extras diurnas</Label>
                              <Input id="extraDayHours" type="number" min="0" value={formData.extraDayHours}
                                onChange={(e) => setFormData({ ...formData, extraDayHours: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="sundayHours">Horas dominicales</Label>
                              <Input id="sundayHours" type="number" min="0" value={formData.sundayHours}
                                onChange={(e) => setFormData({ ...formData, sundayHours: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="holidayHours">Horas festivas</Label>
                              <Input id="holidayHours" type="number" min="0" value={formData.holidayHours}
                                onChange={(e) => setFormData({ ...formData, holidayHours: e.target.value })} />
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
                            Cálculo de Nómina
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
                                  {previewCalculation.nightSurcharge > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Recargo nocturno (+35%)</span>
                                      <span className="font-medium text-blue-600">{formatCurrency(previewCalculation.nightSurcharge)}</span>
                                    </div>
                                  )}
                                  {previewCalculation.extraDayPay > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Hora extra diurna (+25%)</span>
                                      <span className="font-medium text-blue-600">{formatCurrency(previewCalculation.extraDayPay)}</span>
                                    </div>
                                  )}
                                  {previewCalculation.sundayPay > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Hora dominical (+75%)</span>
                                      <span className="font-medium text-blue-600">{formatCurrency(previewCalculation.sundayPay)}</span>
                                    </div>
                                  )}
                                  {previewCalculation.holidayPay > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Hora festiva (+75%)</span>
                                      <span className="font-medium text-blue-600">{formatCurrency(previewCalculation.holidayPay)}</span>
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

                              <div className="space-y-3">
                                <h3 className="font-semibold text-sm text-gray-700 uppercase">Deducciones</h3>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Salud (4%)</span>
                                    <span className="font-medium text-red-600">-{formatCurrency(previewCalculation.healthDeduction)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Pensión (4%)</span>
                                    <span className="font-medium text-red-600">-{formatCurrency(previewCalculation.pensionDeduction)}</span>
                                  </div>
                                </div>

                                <Separator />

                                <div className="flex justify-between text-base font-semibold">
                                  <span>Total deducciones</span>
                                  <span className="text-red-600">-{formatCurrency(previewCalculation.totalDeductions)}</span>
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

                  <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                      {editingRecord ? 'Actualizar Nómina' : 'Guardar Nómina'}
                    </Button>
                  </div>
                </form>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabla de nóminas */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileTextIcon className="w-5 h-5 text-blue-600" />
              Registro de Nóminas
            </CardTitle>
            <CardDescription>Historial completo de cálculos de nómina realizados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-blue-900">
                  <tr>
                    <th className="px-6 py-4 text-left text-black font-semibold">Empleado</th>
                    <th className="px-6 py-4 text-left text-black font-semibold">Cargo</th>
                    <th className="px-6 py-4 text-right text-black font-semibold">Salario base</th>
                    <th className="px-6 py-4 text-center text-black font-semibold">Días</th>
                    <th className="px-6 py-4 text-right text-black font-semibold">Neto a pagar</th>
                    <th className="px-6 py-4 text-center text-black font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        No hay registros de nómina
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
                              <TooltipContent><p>Editar nómina</p></TooltipContent>
                            </Tooltip>

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
            {payrollRecords.length > 0 && (
              <div className="border-t border-gray-200 px-6 py-4 mt-4">
                <div className="flex items-center justify-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                  </Button>

                  <div className="flex items-center space-x-1">
                    {getPageNumbers().map((page, index) =>
                      page === '...' ? (
                        <span key={`ellipsis-${index}`} className="px-2 text-gray-500">•</span>
                      ) : (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => handlePageChange(page as number)}
                          className={currentPage === page ? 'bg-blue-600 hover:bg-blue-700 min-w-[32px]' : 'min-w-[32px]'}
                        >
                          {currentPage === page ? page : '•'}
                        </Button>
                      )
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de detalle */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <FileTextIcon className="w-6 h-6 text-blue-600" />
                Detalle de Nómina
              </DialogTitle>
              <DialogDescription>Desglose completo del cálculo de nómina</DialogDescription>
            </DialogHeader>

            {viewingRecord && (
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Información del Empleado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-gray-600">Nombre</Label>
                        <p className="font-medium text-gray-900">{viewingRecord.employeeName}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Documento</Label>
                        <p className="font-medium text-gray-900">{viewingRecord.employeeDocument}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Cargo</Label>
                        <p className="font-medium text-gray-900">{viewingRecord.position}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Fecha</Label>
                        <p className="font-medium text-gray-900">{viewingRecord.createdAt}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-blue-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
                        <TrendingUpIcon className="w-5 h-5" />
                        Devengos
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Salario proporcional</span>
                        <span className="font-medium">{formatCurrency(viewingRecord.calculatedValues.proportionalSalary)}</span>
                      </div>
                      {viewingRecord.calculatedValues.nightSurcharge > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Recargo nocturno</span>
                          <span className="font-medium">{formatCurrency(viewingRecord.calculatedValues.nightSurcharge)}</span>
                        </div>
                      )}
                      {viewingRecord.calculatedValues.extraDayPay > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Hora extra diurna</span>
                          <span className="font-medium">{formatCurrency(viewingRecord.calculatedValues.extraDayPay)}</span>
                        </div>
                      )}
                      {viewingRecord.calculatedValues.sundayPay > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Hora dominical</span>
                          <span className="font-medium">{formatCurrency(viewingRecord.calculatedValues.sundayPay)}</span>
                        </div>
                      )}
                      {viewingRecord.calculatedValues.holidayPay > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Hora festiva</span>
                          <span className="font-medium">{formatCurrency(viewingRecord.calculatedValues.holidayPay)}</span>
                        </div>
                      )}
                      {viewingRecord.calculatedValues.transportAllowance > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Auxilio transporte</span>
                          <span className="font-medium">{formatCurrency(viewingRecord.calculatedValues.transportAllowance)}</span>
                        </div>
                      )}
                      <Separator className="my-2" />
                      <div className="flex justify-between text-base font-bold text-blue-700">
                        <span>Total devengado</span>
                        <span>{formatCurrency(viewingRecord.calculatedValues.totalEarned)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-red-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2 text-red-700">
                        <BarChart3Icon className="w-5 h-5" />
                        Deducciones
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Salud (4%)</span>
                        <span className="font-medium">-{formatCurrency(viewingRecord.calculatedValues.healthDeduction)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pensión (4%)</span>
                        <span className="font-medium">-{formatCurrency(viewingRecord.calculatedValues.pensionDeduction)}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between text-base font-bold text-red-700">
                        <span>Total deducciones</span>
                        <span>-{formatCurrency(viewingRecord.calculatedValues.totalDeductions)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm opacity-90 mb-2">Neto a pagar</p>
                        <p className="text-4xl font-bold">{formatCurrency(viewingRecord.calculatedValues.netPay)}</p>
                      </div>
                      <DollarSignIcon className="w-16 h-16 opacity-30" />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                    Cerrar
                  </Button>
                  <Button
                    className="bg-white text-blue-900 border border-blue-900 hover:bg-blue-50"
                    onClick={() => generatePDF(viewingRecord)}
                  >
                    <FileTextIcon className="w-4 h-4 mr-2" />
                    Descargar Desprendible PDF
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
