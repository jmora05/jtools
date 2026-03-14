import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/shared/components/ui/alert-dialog';
import { TechnicalSheetModule } from './TechnicalSheetModule';
import { toast } from 'sonner@2.0.3';
import { 
  SearchIcon, 
  PlusIcon, 
  EyeIcon, 
  EditIcon, 
  TrashIcon,
  UserIcon,
  ClipboardListIcon,
  FilterIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FileTextIcon,
  XCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  UsersIcon,
  CalendarIcon,
  FileIcon
} from 'lucide-react';

// ========================
// INTERFACES
// ========================

interface Employee {
  id: number;
  document: string;
  documentType: string;
  name: string;
  position: string;
  area: string;
  status: 'Activo' | 'Inactivo' | 'Suspendido';
  phone: string;
  email: string;
  hireDate: string;
  address: string;
  city: string;
  statusHistory: StatusChange[];
}

interface StatusChange {
  date: string;
  previousStatus: string;
  newStatus: string;
  reason: string;
  changedBy: string;
}

interface ProductionOrder {
  id: number;
  code: string;
  associatedOrder: string;
  assignedEmployees: number[];
  assignedEmployeeNames: string[];
  status: 'Pendiente' | 'En Proceso' | 'Completada' | 'Anulada';
  startDate: string;
  endDate: string;
  resources: Resource[];
  notes: string;
  createdDate: string;
  phases: Phase[];
}

interface Resource {
  id: number;
  name: string;
  quantity: number;
  unit: string;
}

interface Phase {
  name: string;
  status: 'Completado' | 'En Proceso' | 'Pendiente';
  date: string;
  responsible: string;
}

export function ProductionModule() {
  const [activeTab, setActiveTab] = useState('employees');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 mb-2">Módulo de Producción</h1>
          <p className="text-gray-600">Gestión de empleados y órdenes de producción</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-3xl grid-cols-3 h-12">
          <TabsTrigger value="employees" className="text-base">
            <UsersIcon className="w-4 h-4 mr-2" />
            Empleados
          </TabsTrigger>
          <TabsTrigger value="production-orders" className="text-base">
            <ClipboardListIcon className="w-4 h-4 mr-2" />
            Órdenes de Producción
          </TabsTrigger>
          <TabsTrigger value="technical-sheets" className="text-base">
            <FileTextIcon className="w-4 h-4 mr-2" />
            Ficha Técnica
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="mt-6">
          <EmployeesSubmodule />
        </TabsContent>

        <TabsContent value="production-orders" className="mt-6">
          <ProductionOrdersSubmodule />
        </TabsContent>

        <TabsContent value="technical-sheets" className="mt-6">
          <TechnicalSheetModule />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ========================
// SUBMÓDULO: EMPLEADOS
// ========================

function EmployeesSubmodule() {
  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: 1,
      document: '1234567890',
      documentType: 'CC',
      name: 'Carlos Méndez',
      position: 'Operario',
      area: 'Ensamblaje',
      status: 'Activo',
      phone: '300 123 4567',
      email: 'carlos.mendez@jrepuestos.com',
      hireDate: '2023-01-15',
      address: 'Calle 45 #23-67',
      city: 'Medellín',
      statusHistory: [
        { date: '2023-01-15', previousStatus: '-', newStatus: 'Activo', reason: 'Contratación inicial', changedBy: 'Admin' }
      ]
    },
    {
      id: 2,
      document: '9876543210',
      documentType: 'CC',
      name: 'Ana López',
      position: 'Supervisor',
      area: 'Control de Calidad',
      status: 'Activo',
      phone: '301 234 5678',
      email: 'ana.lopez@jrepuestos.com',
      hireDate: '2022-06-10',
      address: 'Carrera 70 #45-12',
      city: 'Medellín',
      statusHistory: [
        { date: '2022-06-10', previousStatus: '-', newStatus: 'Activo', reason: 'Contratación inicial', changedBy: 'Admin' }
      ]
    },
    {
      id: 3,
      document: '5678901234',
      documentType: 'CC',
      name: 'Miguel Torres',
      position: 'Técnico',
      area: 'Mantenimiento',
      status: 'Suspendido',
      phone: '302 345 6789',
      email: 'miguel.torres@jrepuestos.com',
      hireDate: '2023-03-20',
      address: 'Calle 80 #30-45',
      city: 'Medellín',
      statusHistory: [
        { date: '2023-03-20', previousStatus: '-', newStatus: 'Activo', reason: 'Contratación inicial', changedBy: 'Admin' },
        { date: '2024-10-15', previousStatus: 'Activo', newStatus: 'Suspendido', reason: 'Investigación interna', changedBy: 'RH' }
      ]
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isChangeStatusModalOpen, setIsChangeStatusModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const [employeeForm, setEmployeeForm] = useState({
    document: '',
    documentType: 'CC',
    name: '',
    position: '',
    area: '',
    status: 'Activo',
    phone: '',
    email: '',
    hireDate: '',
    address: '',
    city: 'Medellín'
  });

  const [statusChangeForm, setStatusChangeForm] = useState({
    newStatus: '',
    reason: ''
  });

  // Filtrar empleados
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.document.includes(searchTerm) ||
                         emp.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
    const matchesArea = areaFilter === 'all' || emp.area === areaFilter;
    return matchesSearch && matchesStatus && matchesArea;
  });

  // Paginación
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + itemsPerPage);

  const resetForm = () => {
    setEmployeeForm({
      document: '',
      documentType: 'CC',
      name: '',
      position: '',
      area: '',
      status: 'Activo',
      phone: '',
      email: '',
      hireDate: '',
      address: '',
      city: 'Medellín'
    });
  };

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    const newEmployee: Employee = {
      id: employees.length + 1,
      ...employeeForm,
      status: employeeForm.status as 'Activo' | 'Inactivo' | 'Suspendido',
      statusHistory: [{
        date: new Date().toISOString().split('T')[0],
        previousStatus: '-',
        newStatus: employeeForm.status,
        reason: 'Registro inicial',
        changedBy: 'Admin'
      }]
    };
    setEmployees([...employees, newEmployee]);
    toast.success('Empleado registrado exitosamente');
    setIsCreateModalOpen(false);
    resetForm();
  };

  const handleEditEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    
    setEmployees(employees.map(emp => 
      emp.id === selectedEmployee.id 
        ? { ...emp, ...employeeForm, statusHistory: emp.statusHistory }
        : emp
    ));
    toast.success('Empleado actualizado exitosamente');
    setIsEditModalOpen(false);
    setSelectedEmployee(null);
    resetForm();
  };

  const handleDeleteEmployee = () => {
    if (!selectedEmployee) return;
    setEmployees(employees.filter(emp => emp.id !== selectedEmployee.id));
    toast.success('Empleado eliminado exitosamente');
    setIsDeleteDialogOpen(false);
    setSelectedEmployee(null);
  };

  const handleChangeStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    const statusChange: StatusChange = {
      date: new Date().toISOString().split('T')[0],
      previousStatus: selectedEmployee.status,
      newStatus: statusChangeForm.newStatus,
      reason: statusChangeForm.reason,
      changedBy: 'Admin'
    };

    setEmployees(employees.map(emp => 
      emp.id === selectedEmployee.id 
        ? { 
            ...emp, 
            status: statusChangeForm.newStatus as 'Activo' | 'Inactivo' | 'Suspendido',
            statusHistory: [...emp.statusHistory, statusChange]
          }
        : emp
    ));
    
    toast.success('Estado cambiado exitosamente');
    setIsChangeStatusModalOpen(false);
    setSelectedEmployee(null);
    setStatusChangeForm({ newStatus: '', reason: '' });
  };

  const openEditModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEmployeeForm({
      document: employee.document,
      documentType: employee.documentType,
      name: employee.name,
      position: employee.position,
      area: employee.area,
      status: employee.status,
      phone: employee.phone,
      email: employee.email,
      hireDate: employee.hireDate,
      address: employee.address,
      city: employee.city
    });
    setIsEditModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Activo': return 'bg-green-100 text-green-700 border-green-300';
      case 'Inactivo': return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'Suspendido': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Búsqueda y Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nombre, documento o cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="Activo">Activo</SelectItem>
                <SelectItem value="Inactivo">Inactivo</SelectItem>
                <SelectItem value="Suspendido">Suspendido</SelectItem>
              </SelectContent>
            </Select>

            <Select value={areaFilter} onValueChange={setAreaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Área" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las áreas</SelectItem>
                <SelectItem value="Ensamblaje">Ensamblaje</SelectItem>
                <SelectItem value="Control de Calidad">Control de Calidad</SelectItem>
                <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                <SelectItem value="Logística">Logística</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Botón Registrar */}
      <div className="flex justify-end">
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <PlusIcon className="w-4 h-4 mr-2" />
              Registrar Nuevo Empleado
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Empleado</DialogTitle>
              <DialogDescription>
                Completa los datos del nuevo empleado del módulo de producción
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="documentType">Tipo de Documento</Label>
                  <Select
                    value={employeeForm.documentType}
                    onValueChange={(value) => setEmployeeForm({...employeeForm, documentType: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                      <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                      <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="document">Número de Documento *</Label>
                  <Input
                    id="document"
                    value={employeeForm.document}
                    onChange={(e) => setEmployeeForm({...employeeForm, document: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo *</Label>
                <Input
                  id="name"
                  value={employeeForm.name}
                  onChange={(e) => setEmployeeForm({...employeeForm, name: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Cargo *</Label>
                  <Select
                    value={employeeForm.position}
                    onValueChange={(value) => setEmployeeForm({...employeeForm, position: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Operario">Operario</SelectItem>
                      <SelectItem value="Supervisor">Supervisor</SelectItem>
                      <SelectItem value="Técnico">Técnico</SelectItem>
                      <SelectItem value="Coordinador">Coordinador</SelectItem>
                      <SelectItem value="Jefe de Producción">Jefe de Producción</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="area">Área *</Label>
                  <Select
                    value={employeeForm.area}
                    onValueChange={(value) => setEmployeeForm({...employeeForm, area: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ensamblaje">Ensamblaje</SelectItem>
                      <SelectItem value="Control de Calidad">Control de Calidad</SelectItem>
                      <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                      <SelectItem value="Logística">Logística</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={employeeForm.phone}
                    onChange={(e) => setEmployeeForm({...employeeForm, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={employeeForm.email}
                    onChange={(e) => setEmployeeForm({...employeeForm, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hireDate">Fecha de Contratación</Label>
                  <Input
                    id="hireDate"
                    type="date"
                    value={employeeForm.hireDate}
                    onChange={(e) => setEmployeeForm({...employeeForm, hireDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    value={employeeForm.city}
                    onChange={(e) => setEmployeeForm({...employeeForm, city: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={employeeForm.address}
                  onChange={(e) => setEmployeeForm({...employeeForm, address: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => {
                  setIsCreateModalOpen(false);
                  resetForm();
                }}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Registrar Empleado
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla de Empleados */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Empleados ({filteredEmployees.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Documento</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Nombre</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Cargo</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Área</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Estado</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEmployees.map((employee) => (
                  <tr key={employee.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{employee.document}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{employee.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{employee.position}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{employee.area}</td>
                    <td className="py-3 px-4">
                      <Badge className={getStatusColor(employee.status)}>
                        {employee.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedEmployee(employee);
                            setIsViewModalOpen(true);
                          }}
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(employee)}
                        >
                          <EditIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedEmployee(employee);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <TrashIcon className="w-4 h-4 text-red-600" />
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
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </Button>
              
              {[...Array(totalPages)].map((_, index) => {
                const pageNumber = index + 1;
                if (pageNumber === currentPage) {
                  return (
                    <Button
                      key={pageNumber}
                      variant="outline"
                      size="sm"
                      className="bg-blue-600 text-white hover:bg-blue-700 min-w-[40px]"
                    >
                      {pageNumber}
                    </Button>
                  );
                } else {
                  return (
                    <Button
                      key={pageNumber}
                      variant="ghost"
                      size="sm"
                      className="w-8"
                    >
                      •
                    </Button>
                  );
                }
              })}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Ver Detalle */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle del Empleado</DialogTitle>
            <DialogDescription>
              Información completa del empleado y su historial
            </DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-6">
              {/* Información Personal */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información Personal</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Documento</p>
                    <p className="text-sm">{selectedEmployee.documentType} {selectedEmployee.document}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Nombre</p>
                    <p className="text-sm">{selectedEmployee.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Teléfono</p>
                    <p className="text-sm">{selectedEmployee.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-sm">{selectedEmployee.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ciudad</p>
                    <p className="text-sm">{selectedEmployee.city}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Dirección</p>
                    <p className="text-sm">{selectedEmployee.address}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Información Laboral */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información Laboral</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Cargo</p>
                    <p className="text-sm">{selectedEmployee.position}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Área</p>
                    <p className="text-sm">{selectedEmployee.area}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Estado</p>
                    <Badge className={getStatusColor(selectedEmployee.status)}>
                      {selectedEmployee.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fecha de Contratación</p>
                    <p className="text-sm">{selectedEmployee.hireDate}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Historial de Estados */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Historial de Cambios de Estado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedEmployee.statusHistory.map((change, index) => (
                      <div key={index} className="border-l-2 border-blue-500 pl-4 py-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm">
                              <span className="text-gray-500">{change.previousStatus}</span>
                              {' → '}
                              <span className={`${
                                change.newStatus === 'Activo' ? 'text-green-600' :
                                change.newStatus === 'Suspendido' ? 'text-red-600' :
                                'text-gray-600'
                              }`}>{change.newStatus}</span>
                            </p>
                            <p className="text-sm text-gray-600 mt-1">{change.reason}</p>
                            <p className="text-xs text-gray-400 mt-1">Por: {change.changedBy}</p>
                          </div>
                          <p className="text-xs text-gray-400">{change.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Botones de Acción */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    openEditModal(selectedEmployee);
                  }}
                >
                  <EditIcon className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setStatusChangeForm({ newStatus: selectedEmployee.status, reason: '' });
                    setIsViewModalOpen(false);
                    setIsChangeStatusModalOpen(true);
                  }}
                >
                  <CheckCircleIcon className="w-4 h-4 mr-2" />
                  Cambiar Estado
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  <TrashIcon className="w-4 h-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Editar */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Empleado</DialogTitle>
            <DialogDescription>
              Modifica la información del empleado seleccionado
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditEmployee} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editDocumentType">Tipo de Documento</Label>
                <Select
                  value={employeeForm.documentType}
                  onValueChange={(value) => setEmployeeForm({...employeeForm, documentType: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                    <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                    <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDocument">Número de Documento *</Label>
                <Input
                  id="editDocument"
                  value={employeeForm.document}
                  onChange={(e) => setEmployeeForm({...employeeForm, document: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editName">Nombre Completo *</Label>
              <Input
                id="editName"
                value={employeeForm.name}
                onChange={(e) => setEmployeeForm({...employeeForm, name: e.target.value})}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editPosition">Cargo *</Label>
                <Select
                  value={employeeForm.position}
                  onValueChange={(value) => setEmployeeForm({...employeeForm, position: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Operario">Operario</SelectItem>
                    <SelectItem value="Supervisor">Supervisor</SelectItem>
                    <SelectItem value="Técnico">Técnico</SelectItem>
                    <SelectItem value="Coordinador">Coordinador</SelectItem>
                    <SelectItem value="Jefe de Producción">Jefe de Producción</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editArea">Área *</Label>
                <Select
                  value={employeeForm.area}
                  onValueChange={(value) => setEmployeeForm({...employeeForm, area: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ensamblaje">Ensamblaje</SelectItem>
                    <SelectItem value="Control de Calidad">Control de Calidad</SelectItem>
                    <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                    <SelectItem value="Logística">Logística</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editPhone">Teléfono</Label>
                <Input
                  id="editPhone"
                  value={employeeForm.phone}
                  onChange={(e) => setEmployeeForm({...employeeForm, phone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEmail">Correo Electrónico</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={employeeForm.email}
                  onChange={(e) => setEmployeeForm({...employeeForm, email: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editHireDate">Fecha de Contratación</Label>
                <Input
                  id="editHireDate"
                  type="date"
                  value={employeeForm.hireDate}
                  onChange={(e) => setEmployeeForm({...employeeForm, hireDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCity">Ciudad</Label>
                <Input
                  id="editCity"
                  value={employeeForm.city}
                  onChange={(e) => setEmployeeForm({...employeeForm, city: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editAddress">Dirección</Label>
              <Input
                id="editAddress"
                value={employeeForm.address}
                onChange={(e) => setEmployeeForm({...employeeForm, address: e.target.value})}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => {
                setIsEditModalOpen(false);
                setSelectedEmployee(null);
                resetForm();
              }}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Guardar Cambios
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Cambiar Estado */}
      <Dialog open={isChangeStatusModalOpen} onOpenChange={setIsChangeStatusModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar Estado del Empleado</DialogTitle>
            <DialogDescription>
              Actualiza el estado del empleado y registra el motivo del cambio
            </DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
            <form onSubmit={handleChangeStatus} className="space-y-4">
              <div className="space-y-2">
                <Label>Empleado</Label>
                <p className="text-sm text-gray-700">{selectedEmployee.name}</p>
                <p className="text-xs text-gray-500">Estado actual: {selectedEmployee.status}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newStatus">Nuevo Estado *</Label>
                <Select
                  value={statusChangeForm.newStatus}
                  onValueChange={(value) => setStatusChangeForm({...statusChangeForm, newStatus: value})}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Activo">Activo</SelectItem>
                    <SelectItem value="Inactivo">Inactivo</SelectItem>
                    <SelectItem value="Suspendido">Suspendido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Motivo del Cambio *</Label>
                <Textarea
                  id="reason"
                  value={statusChangeForm.reason}
                  onChange={(e) => setStatusChangeForm({...statusChangeForm, reason: e.target.value})}
                  placeholder="Describe el motivo del cambio de estado..."
                  rows={3}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => {
                  setIsChangeStatusModalOpen(false);
                  setSelectedEmployee(null);
                  setStatusChangeForm({ newStatus: '', reason: '' });
                }}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Confirmar Cambio
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo Eliminar */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar empleado?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el registro de{' '}
              <strong>{selectedEmployee?.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedEmployee(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEmployee}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ========================
// SUBMÓDULO: ÓRDENES DE PRODUCCIÓN
// ========================

function ProductionOrdersSubmodule() {
  const [orders, setOrders] = useState<ProductionOrder[]>([
    {
      id: 1,
      code: 'OP-2024-001',
      associatedOrder: 'PED-2024-001',
      assignedEmployees: [1, 2],
      assignedEmployeeNames: ['Carlos Méndez', 'Ana López'],
      status: 'En Proceso',
      startDate: '2024-10-20',
      endDate: '2024-10-30',
      resources: [
        { id: 1, name: 'Acero inoxidable', quantity: 50, unit: 'kg' },
        { id: 2, name: 'Pintura automotriz', quantity: 10, unit: 'litros' }
      ],
      notes: 'Producción urgente para cliente premium',
      createdDate: '2024-10-15',
      phases: [
        { name: 'Preparación de materiales', status: 'Completado', date: '2024-10-20', responsible: 'Carlos Méndez' },
        { name: 'Ensamblaje', status: 'En Proceso', date: '2024-10-22', responsible: 'Ana López' },
        { name: 'Control de calidad', status: 'Pendiente', date: '', responsible: '' },
        { name: 'Empaque', status: 'Pendiente', date: '', responsible: '' }
      ]
    },
    {
      id: 2,
      code: 'OP-2024-002',
      associatedOrder: 'PED-2024-015',
      assignedEmployees: [3],
      assignedEmployeeNames: ['Miguel Torres'],
      status: 'Completada',
      startDate: '2024-10-10',
      endDate: '2024-10-18',
      resources: [
        { id: 3, name: 'Aluminio', quantity: 30, unit: 'kg' }
      ],
      notes: 'Orden completada sin incidencias',
      createdDate: '2024-10-05',
      phases: [
        { name: 'Preparación de materiales', status: 'Completado', date: '2024-10-10', responsible: 'Miguel Torres' },
        { name: 'Ensamblaje', status: 'Completado', date: '2024-10-12', responsible: 'Miguel Torres' },
        { name: 'Control de calidad', status: 'Completado', date: '2024-10-16', responsible: 'Ana López' },
        { name: 'Empaque', status: 'Completado', date: '2024-10-18', responsible: 'Carlos Méndez' }
      ]
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAnnulDialogOpen, setIsAnnulDialogOpen] = useState(false);
  const [isChangeOrderStatusModalOpen, setIsChangeOrderStatusModalOpen] = useState(false);
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [newOrderStatus, setNewOrderStatus] = useState('');
  const [orderType, setOrderType] = useState<'Pedido' | 'Venta' | ''>('');

  const [orderForm, setOrderForm] = useState({
    associatedOrder: '',
    assignedEmployees: [] as number[],
    startDate: '',
    endDate: '',
    resources: [] as Resource[],
    notes: ''
  });

  const [newResource, setNewResource] = useState({
    name: '',
    quantity: 0,
    unit: 'kg'
  });

  // Mock de empleados disponibles
  const availableEmployees = [
    { id: 1, name: 'Carlos Méndez' },
    { id: 2, name: 'Ana López' },
    { id: 3, name: 'Miguel Torres' }
  ];

  // Filtrar órdenes
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.associatedOrder.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Paginación
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const resetForm = () => {
    setOrderForm({
      associatedOrder: '',
      assignedEmployees: [],
      startDate: '',
      endDate: '',
      resources: [],
      notes: ''
    });
    setNewResource({ name: '', quantity: 0, unit: 'kg' });
    setOrderType('');
  };

  const addResource = () => {
    if (newResource.name && newResource.quantity > 0) {
      setOrderForm({
        ...orderForm,
        resources: [...orderForm.resources, { id: Date.now(), ...newResource }]
      });
      setNewResource({ name: '', quantity: 0, unit: 'kg' });
    }
  };

  const removeResource = (id: number) => {
    setOrderForm({
      ...orderForm,
      resources: orderForm.resources.filter(r => r.id !== id)
    });
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const employeeNames = availableEmployees
      .filter(emp => orderForm.assignedEmployees.includes(emp.id))
      .map(emp => emp.name);

    const newOrder: ProductionOrder = {
      id: orders.length + 1,
      code: `OP-2024-${String(orders.length + 1).padStart(3, '0')}`,
      ...orderForm,
      assignedEmployeeNames: employeeNames,
      status: 'Pendiente',
      createdDate: new Date().toISOString().split('T')[0],
      phases: [
        { name: 'Preparación de materiales', status: 'Pendiente', date: '', responsible: '' },
        { name: 'Ensamblaje', status: 'Pendiente', date: '', responsible: '' },
        { name: 'Control de calidad', status: 'Pendiente', date: '', responsible: '' },
        { name: 'Empaque', status: 'Pendiente', date: '', responsible: '' }
      ]
    };

    setOrders([...orders, newOrder]);
    toast.success('Orden de producción creada exitosamente');
    setIsCreateModalOpen(false);
    resetForm();
  };

  const handleAnnulOrder = () => {
    if (!selectedOrder) return;
    setOrders(orders.map(order => 
      order.id === selectedOrder.id 
        ? { ...order, status: 'Anulada' as const }
        : order
    ));
    toast.success('Orden anulada exitosamente');
    setIsAnnulDialogOpen(false);
    setSelectedOrder(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendiente': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'En Proceso': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'Completada': return 'bg-green-100 text-green-700 border-green-300';
      case 'Anulada': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getPhaseStatusColor = (status: string) => {
    switch (status) {
      case 'Completado': return 'bg-green-100 text-green-700';
      case 'En Proceso': return 'bg-blue-100 text-blue-700';
      case 'Pendiente': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleGeneratePDF = (order: ProductionOrder) => {
    toast.success(`PDF de la orden ${order.code} generado correctamente`, {
      description: 'El documento se abrirá en una nueva pestaña'
    });
    // Simulación de generación y apertura de PDF
    // En producción, aquí iría la lógica para generar y descargar/visualizar el PDF real
    console.log('Generando PDF para la orden:', order);
  };

  return (
    <div className="space-y-6">
      {/* Búsqueda y Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por código o pedido asociado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="Pendiente">Pendiente</SelectItem>
                <SelectItem value="En Proceso">En Proceso</SelectItem>
                <SelectItem value="Completada">Completada</SelectItem>
                <SelectItem value="Anulada">Anulada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Botón Registrar */}
      <div className="flex justify-end">
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <PlusIcon className="w-4 h-4 mr-2" />
              Registrar Nueva Orden
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Nueva Orden de Producción</DialogTitle>
              <DialogDescription>
                Crea una nueva orden de producción con todos sus detalles
              </DialogDescription>
            </DialogHeader>
            
            {/* Pregunta inicial: Tipo de Orden */}
            {!orderType ? (
              <div className="space-y-6 py-8">
                <div className="text-center space-y-3">
                  <h3 className="text-lg">¿De qué tipo es esta orden de producción?</h3>
                  <p className="text-sm text-gray-500">Selecciona el origen de la orden</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-32 flex flex-col items-center justify-center gap-3 border-2 hover:border-blue-500 hover:bg-blue-50"
                    onClick={() => setOrderType('Pedido')}
                  >
                    <ClipboardListIcon className="w-12 h-12 text-blue-600" />
                    <span className="text-lg">Pedido</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-32 flex flex-col items-center justify-center gap-3 border-2 hover:border-green-500 hover:bg-green-50"
                    onClick={() => setOrderType('Venta')}
                  >
                    <FileIcon className="w-12 h-12 text-green-600" />
                    <span className="text-lg">Venta</span>
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateOrder} className="space-y-6">
                {/* Mostrar tipo seleccionado */}
                <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    {orderType === 'Pedido' ? (
                      <ClipboardListIcon className="w-5 h-5 text-blue-600" />
                    ) : (
                      <FileIcon className="w-5 h-5 text-green-600" />
                    )}
                    <span className="text-sm">Tipo de orden: <strong>{orderType}</strong></span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setOrderType('')}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Cambiar
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="associatedOrder">Pedido Asociado *</Label>
                  <Input
                    id="associatedOrder"
                    placeholder="PED-2024-001"
                    value={orderForm.associatedOrder}
                    onChange={(e) => setOrderForm({...orderForm, associatedOrder: e.target.value})}
                    required
                  />
                </div>

              <div className="space-y-2">
                <Label>Empleados Asignados *</Label>
                <div className="space-y-2">
                  {availableEmployees.map(emp => (
                    <div key={emp.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`emp-${emp.id}`}
                        checked={orderForm.assignedEmployees.includes(emp.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setOrderForm({
                              ...orderForm,
                              assignedEmployees: [...orderForm.assignedEmployees, emp.id]
                            });
                          } else {
                            setOrderForm({
                              ...orderForm,
                              assignedEmployees: orderForm.assignedEmployees.filter(id => id !== emp.id)
                            });
                          }
                        }}
                        className="w-4 h-4 text-blue-600"
                      />
                      <label htmlFor={`emp-${emp.id}`} className="text-sm">{emp.name}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Fecha de Inicio *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={orderForm.startDate}
                    onChange={(e) => setOrderForm({...orderForm, startDate: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Fecha de Fin Estimada *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={orderForm.endDate}
                    onChange={(e) => setOrderForm({...orderForm, endDate: e.target.value})}
                    required
                  />
                </div>
              </div>

              {/* Recursos */}
              <div className="space-y-3">
                <Label>Recursos Utilizados</Label>
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-5">
                      <Input
                        placeholder="Nombre del recurso"
                        value={newResource.name}
                        onChange={(e) => setNewResource({...newResource, name: e.target.value})}
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        placeholder="Cantidad"
                        value={newResource.quantity || ''}
                        onChange={(e) => setNewResource({...newResource, quantity: Number(e.target.value)})}
                      />
                    </div>
                    <div className="col-span-2">
                      <Select
                        value={newResource.unit}
                        onValueChange={(value) => setNewResource({...newResource, unit: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="litros">litros</SelectItem>
                          <SelectItem value="unidades">unidades</SelectItem>
                          <SelectItem value="metros">metros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Button type="button" onClick={addResource} className="w-full">
                        <PlusIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {orderForm.resources.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {orderForm.resources.map(resource => (
                        <div key={resource.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                          <span className="text-sm">
                            {resource.name} - {resource.quantity} {resource.unit}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeResource(resource.id)}
                          >
                            <XCircleIcon className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  placeholder="Notas y observaciones adicionales..."
                  value={orderForm.notes}
                  onChange={(e) => setOrderForm({...orderForm, notes: e.target.value})}
                  rows={3}
                />
              </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => {
                    setIsCreateModalOpen(false);
                    resetForm();
                  }}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Crear Orden
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla de Órdenes */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Órdenes de Producción ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Código</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Pedido Asociado</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Empleados</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Estado</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Fecha Inicio</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{order.code}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{order.associatedOrder}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {order.assignedEmployeeNames.join(', ')}
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">{order.startDate}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsViewModalOpen(true);
                          }}
                          title="Ver detalle"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleGeneratePDF(order)}
                          title="Ver PDF"
                        >
                          <FileTextIcon className="w-4 h-4 text-blue-600" />
                        </Button>
                        {order.status !== 'Anulada' && order.status !== 'Completada' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsAnnulDialogOpen(true);
                            }}
                            title="Anular orden"
                          >
                            <XCircleIcon className="w-4 h-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </Button>
              
              {[...Array(totalPages)].map((_, index) => {
                const pageNumber = index + 1;
                if (pageNumber === currentPage) {
                  return (
                    <Button
                      key={pageNumber}
                      variant="outline"
                      size="sm"
                      className="bg-blue-600 text-white hover:bg-blue-700 min-w-[40px]"
                    >
                      {pageNumber}
                    </Button>
                  );
                } else {
                  return (
                    <Button
                      key={pageNumber}
                      variant="ghost"
                      size="sm"
                      className="w-8"
                    >
                      •
                    </Button>
                  );
                }
              })}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Ver Detalle */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Orden de Producción</DialogTitle>
            <DialogDescription>
              Información completa de la orden de producción y su progreso
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Información General */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información General</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Código</p>
                    <p className="text-sm">{selectedOrder.code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pedido Asociado</p>
                    <p className="text-sm">{selectedOrder.associatedOrder}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Estado</p>
                    <Badge className={getStatusColor(selectedOrder.status)}>
                      {selectedOrder.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fecha de Creación</p>
                    <p className="text-sm">{selectedOrder.createdDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fecha de Inicio</p>
                    <p className="text-sm">{selectedOrder.startDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fecha de Fin</p>
                    <p className="text-sm">{selectedOrder.endDate}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Empleados Asignados */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <UsersIcon className="w-5 h-5 mr-2" />
                    Empleados Asignados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {selectedOrder.assignedEmployeeNames.map((name, index) => (
                      <Badge key={index} variant="outline" className="text-blue-600 border-blue-300">
                        {name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recursos Utilizados */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recursos Utilizados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {selectedOrder.resources.map(resource => (
                      <div key={resource.id} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                        <span className="text-sm">{resource.name}</span>
                        <span className="text-sm text-gray-600">
                          {resource.quantity} {resource.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Fases del Proceso */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Timeline de Producción</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedOrder.phases.map((phase, index) => (
                      <div key={index} className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm">{phase.name}</p>
                              {phase.responsible && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Responsable: {phase.responsible}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <Badge className={getPhaseStatusColor(phase.status)}>
                                {phase.status}
                              </Badge>
                              {phase.date && (
                                <p className="text-xs text-gray-500 mt-1">{phase.date}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Notas */}
              {selectedOrder.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Notas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700">{selectedOrder.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Botones de Acción */}
              <div className="flex justify-end gap-3">
                {selectedOrder.status !== 'Anulada' && selectedOrder.status !== 'Completada' && (
                  <>
                    <Button
                      variant="outline"
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      onClick={() => {
                        setIsViewModalOpen(false);
                        setIsChangeOrderStatusModalOpen(true);
                      }}
                    >
                      <CheckCircleIcon className="w-4 h-4 mr-2" />
                      Cambiar Estado
                    </Button>
                    <Button
                      variant="outline"
                      className="text-green-600 border-green-200 hover:bg-green-50"
                      onClick={() => {
                        setIsViewModalOpen(false);
                        setIsAddEmployeeModalOpen(true);
                      }}
                    >
                      <UsersIcon className="w-4 h-4 mr-2" />
                      Agregar Empleado
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Cambiar Estado */}
      <Dialog open={isChangeOrderStatusModalOpen} onOpenChange={setIsChangeOrderStatusModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar Estado de la Orden</DialogTitle>
            <DialogDescription>
              Actualiza el estado de la orden de producción
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Orden</Label>
                <p className="text-sm text-gray-700">{selectedOrder.code}</p>
                <p className="text-xs text-gray-500">Estado actual: {selectedOrder.status}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newStatus">Nuevo Estado *</Label>
                <Select value={newOrderStatus} onValueChange={setNewOrderStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                    <SelectItem value="En Proceso">En Proceso</SelectItem>
                    <SelectItem value="Completada">Completada</SelectItem>
                    <SelectItem value="Anulada">Anulada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsChangeOrderStatusModalOpen(false);
                    setNewOrderStatus('');
                    setIsViewModalOpen(true);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    if (!newOrderStatus) {
                      toast.error('Selecciona un estado');
                      return;
                    }
                    setOrders(orders.map(order =>
                      order.id === selectedOrder.id
                        ? { ...order, status: newOrderStatus as any }
                        : order
                    ));
                    toast.success('Estado actualizado exitosamente');
                    setIsChangeOrderStatusModalOpen(false);
                    setNewOrderStatus('');
                    setSelectedOrder(null);
                  }}
                >
                  Cambiar Estado
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Agregar Empleado */}
      <Dialog open={isAddEmployeeModalOpen} onOpenChange={setIsAddEmployeeModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Empleado a la Orden</DialogTitle>
            <DialogDescription>
              Asigna un empleado adicional a esta orden de producción
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Orden</Label>
                <p className="text-sm text-gray-700">{selectedOrder.code}</p>
              </div>

              <div className="space-y-2">
                <Label>Empleados disponibles</Label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableEmployees
                    .filter(emp => !selectedOrder.assignedEmployees.includes(emp.id))
                    .map(emp => (
                      <div key={emp.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setOrders(orders.map(order =>
                              order.id === selectedOrder.id
                                ? {
                                    ...order,
                                    assignedEmployees: [...order.assignedEmployees, emp.id],
                                    assignedEmployeeNames: [...order.assignedEmployeeNames, emp.name]
                                  }
                                : order
                            ));
                            toast.success(`${emp.name} agregado a la orden`);
                            setIsAddEmployeeModalOpen(false);
                            setSelectedOrder(null);
                          }}
                        >
                          <PlusIcon className="w-4 h-4 mr-2" />
                          Agregar
                        </Button>
                        <span className="text-sm">{emp.name}</span>
                      </div>
                    ))}
                  {availableEmployees.filter(emp => !selectedOrder.assignedEmployees.includes(emp.id)).length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Todos los empleados ya están asignados a esta orden
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddEmployeeModalOpen(false);
                    setIsViewModalOpen(true);
                  }}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo Anular */}
      <AlertDialog open={isAnnulDialogOpen} onOpenChange={setIsAnnulDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Anular orden de producción?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cambiará el estado de la orden <strong>{selectedOrder?.code}</strong> a "Anulada".
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedOrder(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAnnulOrder}
              className="bg-red-600 hover:bg-red-700"
            >
              Anular Orden
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
