import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Textarea } from '@/shared/components/ui/textarea';
import { toast } from 'sonner@2.0.3';
import { 
  PlusIcon, 
  EyeIcon, 
  EditIcon, 
  TrashIcon,
  UsersIcon,
  SearchIcon,
  ArrowLeftIcon,
  AlertTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UploadIcon,
  XIcon,
  FileTextIcon,
  BriefcaseIcon,
  CalendarIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  UserCheckIcon,
  UserXIcon
} from 'lucide-react';
import { Switch } from './ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  position: string;
  area: string;
  hireDate: string;
  status: 'Activo' | 'Inactivo';
  documents: string[];
  notes?: string;
  createdBy?: string;
  createdAt?: string;
  modifiedBy?: string;
  modifiedAt?: string;
}

export function EmployeeManagement() {
  // HU_046: Listar empleados - Estado inicial
  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: 1,
      firstName: 'Carlos',
      lastName: 'Mendoza Silva',
      documentType: 'CC',
      documentNumber: '12345678',
      email: 'carlos.mendoza@jrepuestos.com',
      phone: '+57 300 123 4567',
      city: 'Medellín',
      address: 'Calle 45 #23-67',
      position: 'Supervisor de Producción',
      area: 'Producción',
      hireDate: '2023-01-15',
      status: 'Activo',
      documents: ['Contrato.pdf', 'Hoja de vida.pdf'],
      createdBy: 'Admin',
      createdAt: '2023-01-10'
    },
    {
      id: 2,
      firstName: 'Ana',
      lastName: 'Patricia López',
      documentType: 'CC',
      documentNumber: '87654321',
      email: 'ana.lopez@jrepuestos.com',
      phone: '+57 301 987 6543',
      city: 'Medellín',
      address: 'Carrera 70 #45-23',
      position: 'Jefe de Área',
      area: 'Producción',
      hireDate: '2023-03-20',
      status: 'Activo',
      documents: ['Contrato.pdf'],
      createdBy: 'Admin',
      createdAt: '2023-03-15'
    },
    {
      id: 3,
      firstName: 'Roberto',
      lastName: 'Sánchez García',
      documentType: 'CE',
      documentNumber: '98765432',
      email: 'roberto.sanchez@jrepuestos.com',
      phone: '+57 302 456 7890',
      city: 'Medellín',
      address: 'Calle 52 #34-12',
      position: 'Operario',
      area: 'Producción',
      hireDate: '2023-05-10',
      status: 'Activo',
      documents: [],
      createdBy: 'Admin',
      createdAt: '2023-05-05'
    },
    {
      id: 4,
      firstName: 'Laura',
      lastName: 'Fernández Cruz',
      documentType: 'CC',
      documentNumber: '45678912',
      email: 'laura.fernandez@jrepuestos.com',
      phone: '+57 303 567 8901',
      city: 'Bello',
      address: 'Avenida 34 #12-45',
      position: 'Técnico de Calidad',
      area: 'Calidad',
      hireDate: '2023-07-15',
      status: 'Inactivo',
      documents: ['Contrato.pdf'],
      createdBy: 'Admin',
      createdAt: '2023-07-10',
      modifiedBy: 'RH',
      modifiedAt: '2024-10-20'
    }
  ]);

  // Estados de UI
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  // HU_044: Buscar empleados
  const [searchTerm, setSearchTerm] = useState('');
  const [filterArea, setFilterArea] = useState('all');
  const [filterPosition, setFilterPosition] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // HU_040: Registrar empleado - Formulario
  const [employeeForm, setEmployeeForm] = useState({
    firstName: '',
    lastName: '',
    documentType: 'CC',
    documentNumber: '',
    email: '',
    phone: '',
    city: '',
    address: '',
    position: '',
    area: '',
    hireDate: new Date().toISOString().split('T')[0],
    status: 'Activo' as 'Activo' | 'Inactivo',
    documents: [] as string[],
    notes: ''
  });

  // Estado para documentos opcionales
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);

  // Datos para selects
  const areas = ['Producción', 'Calidad', 'Logística', 'Mantenimiento', 'Administración'];
  const positions = ['Supervisor de Producción', 'Jefe de Área', 'Operario', 'Técnico de Calidad', 'Asistente'];

  // HU_044: Buscar empleados - Filtrado
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.documentNumber.includes(searchTerm) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesArea = filterArea === 'all' || emp.area === filterArea;
    const matchesPosition = filterPosition === 'all' || emp.position === filterPosition;
    const matchesStatus = filterStatus === 'all' || emp.status === filterStatus;

    return matchesSearch && matchesArea && matchesPosition && matchesStatus;
  });

  // HU_046: Ordenar empleados
  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    if (sortBy === 'name') {
      return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
    } else if (sortBy === 'status') {
      return a.status.localeCompare(b.status);
    }
    return 0;
  });

  // Paginación
  const totalPages = Math.ceil(sortedEmployees.length / itemsPerPage);
  const paginatedEmployees = sortedEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // HU_040: Registrar empleado
  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar campos obligatorios
    if (!employeeForm.firstName || !employeeForm.lastName || !employeeForm.documentNumber || 
        !employeeForm.email || !employeeForm.phone || !employeeForm.position || 
        !employeeForm.area || !employeeForm.hireDate) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    const newEmployee: Employee = {
      id: Math.max(...employees.map(e => e.id), 0) + 1,
      ...employeeForm,
      documents: uploadedDocs,
      createdBy: 'Admin',
      createdAt: new Date().toISOString().split('T')[0]
    };

    setEmployees([...employees, newEmployee]);
    resetForm();
    setShowCreateModal(false);
    toast.success('Empleado registrado exitosamente');
  };

  // HU_042: Actualizar datos del empleado
  const handleUpdateEmployee = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmployee) return;

    // Validar campos obligatorios
    if (!employeeForm.firstName || !employeeForm.lastName || !employeeForm.documentNumber || 
        !employeeForm.email || !employeeForm.phone || !employeeForm.position || 
        !employeeForm.area || !employeeForm.hireDate) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    const updatedEmployees = employees.map(emp =>
      emp.id === selectedEmployee.id
        ? {
            ...emp,
            ...employeeForm,
            documents: uploadedDocs,
            modifiedBy: 'Admin',
            modifiedAt: new Date().toISOString().split('T')[0]
          }
        : emp
    );

    setEmployees(updatedEmployees);
    setShowEditModal(false);
    setSelectedEmployee(null);
    resetForm();
    toast.success('Empleado actualizado exitosamente');
  };

  // HU_045: Eliminar empleado
  const handleDeleteEmployee = () => {
    if (!employeeToDelete) return;

    // Validar que no esté asociado a procesos activos (simulado)
    if (employeeToDelete.status === 'Activo') {
      toast.error('No se puede eliminar un empleado activo. Cambia su estado primero.');
      setShowDeleteDialog(false);
      setEmployeeToDelete(null);
      return;
    }

    setEmployees(employees.filter(emp => emp.id !== employeeToDelete.id));
    setShowDeleteDialog(false);
    setEmployeeToDelete(null);
    toast.success('Empleado eliminado exitosamente');
    
    // Registrar en historial de auditoría (simulado)
    console.log(`Auditoría: Empleado ${employeeToDelete.firstName} ${employeeToDelete.lastName} eliminado por Admin el ${new Date().toISOString()}`);
  };

  // HU_041: Ver detalle del empleado
  const handleViewDetail = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowDetailModal(true);
  };

  const openEditModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEmployeeForm({
      firstName: employee.firstName,
      lastName: employee.lastName,
      documentType: employee.documentType,
      documentNumber: employee.documentNumber,
      email: employee.email,
      phone: employee.phone,
      city: employee.city,
      address: employee.address,
      position: employee.position,
      area: employee.area,
      hireDate: employee.hireDate,
      status: employee.status,
      documents: employee.documents,
      notes: employee.notes || ''
    });
    setUploadedDocs(employee.documents);
    setShowEditModal(true);
  };

  const openDeleteDialog = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setShowDeleteDialog(true);
  };

  const resetForm = () => {
    setEmployeeForm({
      firstName: '',
      lastName: '',
      documentType: 'CC',
      documentNumber: '',
      email: '',
      phone: '',
      city: '',
      address: '',
      position: '',
      area: '',
      hireDate: new Date().toISOString().split('T')[0],
      status: 'Activo',
      documents: [],
      notes: ''
    });
    setUploadedDocs([]);
    setSelectedEmployee(null);
  };

  const handleAddDocument = () => {
    const docName = prompt('Nombre del documento:');
    if (docName && docName.trim()) {
      setUploadedDocs([...uploadedDocs, docName.trim()]);
      toast.success('Documento agregado');
    }
  };

  const handleRemoveDocument = (index: number) => {
    setUploadedDocs(uploadedDocs.filter((_, i) => i !== index));
  };

  const getStatusBadge = (status: string) => {
    return status === 'Activo' ? (
      <Badge className="bg-green-100 text-green-700 border-green-200">
        <UserCheckIcon className="w-3 h-3 mr-1" />
        Activo
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-700 border-red-200">
        <UserXIcon className="w-3 h-3 mr-1" />
        Inactivo
      </Badge>
    );
  };

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl text-gray-900 flex items-center gap-3">
            <UsersIcon className="w-8 h-8 text-blue-900" />
            Gestión de Empleados
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Módulo de Producción - Administra el personal de la empresa
          </p>
        </div>

        {/* HU_040: Botón para registrar empleado */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700" size="lg">
              <PlusIcon className="w-4 h-4 mr-2" />
              Registrar Empleado
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Empleado</DialogTitle>
              <DialogDescription>
                Completa todos los campos obligatorios (*) para registrar un nuevo empleado.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateEmployee} className="space-y-6">
              {/* Información Personal */}
              <Card className="border-2 border-purple-100">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-white">
                  <CardTitle className="text-lg">Información Personal</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nombre *</Label>
                      <Input
                        placeholder="Nombre del empleado"
                        value={employeeForm.firstName}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Apellidos *</Label>
                      <Input
                        placeholder="Apellidos del empleado"
                        value={employeeForm.lastName}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, lastName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de Documento *</Label>
                      <Select
                        value={employeeForm.documentType}
                        onValueChange={(value) => setEmployeeForm({ ...employeeForm, documentType: value })}
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
                      <Label>Número de Identificación *</Label>
                      <Input
                        placeholder="Número de documento"
                        value={employeeForm.documentNumber}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, documentNumber: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Información de Contacto */}
              <Card className="border-2 border-purple-100">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-white">
                  <CardTitle className="text-lg">Información de Contacto</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Correo Electrónico *</Label>
                      <Input
                        type="email"
                        placeholder="correo@ejemplo.com"
                        value={employeeForm.email}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Teléfono *</Label>
                      <Input
                        placeholder="+57 300 123 4567"
                        value={employeeForm.phone}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ciudad</Label>
                      <Input
                        placeholder="Ciudad"
                        value={employeeForm.city}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Dirección</Label>
                      <Input
                        placeholder="Dirección de residencia"
                        value={employeeForm.address}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, address: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Información Laboral */}
              <Card className="border-2 border-purple-100">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-white">
                  <CardTitle className="text-lg">Información Laboral</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cargo *</Label>
                      <Select
                        value={employeeForm.position}
                        onValueChange={(value) => setEmployeeForm({ ...employeeForm, position: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar cargo" />
                        </SelectTrigger>
                        <SelectContent>
                          {positions.map(pos => (
                            <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Área *</Label>
                      <Select
                        value={employeeForm.area}
                        onValueChange={(value) => setEmployeeForm({ ...employeeForm, area: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar área" />
                        </SelectTrigger>
                        <SelectContent>
                          {areas.map(area => (
                            <SelectItem key={area} value={area}>{area}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha de Ingreso *</Label>
                      <Input
                        type="date"
                        value={employeeForm.hireDate}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, hireDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Estado *</Label>
                      <Select
                        value={employeeForm.status}
                        onValueChange={(value) => setEmployeeForm({ ...employeeForm, status: value as 'Activo' | 'Inactivo' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Activo">Activo</SelectItem>
                          <SelectItem value="Inactivo">Inactivo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Documentos Opcionales */}
              <Card className="border-2 border-purple-100">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-white">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileTextIcon className="w-5 h-5" />
                    Documentos Opcionales
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddDocument}
                      className="w-full"
                    >
                      <UploadIcon className="w-4 h-4 mr-2" />
                      Adjuntar Documento
                    </Button>
                    {uploadedDocs.length > 0 && (
                      <div className="space-y-2">
                        {uploadedDocs.map((doc, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 rounded p-2 border">
                            <span className="text-sm text-gray-700">{doc}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveDocument(index)}
                              className="text-red-600"
                            >
                              <XIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Notas Adicionales</Label>
                    <Textarea
                      placeholder="Información adicional sobre el empleado..."
                      value={employeeForm.notes}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, notes: e.target.value })}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Botones */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setShowCreateModal(false);
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  Registrar Empleado
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* HU_044: Buscar empleados - Filtros */}
      <Card className="shadow-lg border-gray-100">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2 relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre, identificación o cargo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterArea} onValueChange={setFilterArea}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las áreas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las áreas</SelectItem>
                  {areas.map(area => (
                    <SelectItem key={area} value={area}>{area}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterPosition} onValueChange={setFilterPosition}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los cargos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los cargos</SelectItem>
                  {positions.map(pos => (
                    <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="Activo">Activo</SelectItem>
                  <SelectItem value="Inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{sortedEmployees.length} empleado(s) encontrado(s)</span>
              <div className="flex items-center gap-2">
                <Label className="text-xs">Ordenar por:</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nombre</SelectItem>
                    <SelectItem value="status">Estado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* HU_046: Listar empleados - Tabla ACTUALIZADA */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-50 to-purple-100 border-b-2 border-purple-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs text-gray-600 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-4 text-left text-xs text-gray-600 uppercase tracking-wider">Correo</th>
                <th className="px-6 py-4 text-left text-xs text-gray-600 uppercase tracking-wider">Cargo</th>
                <th className="px-6 py-4 text-center text-xs text-gray-600 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <UsersIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No se encontraron empleados</p>
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{employee.firstName} {employee.lastName}</p>
                        <p className="text-xs text-gray-500">{employee.documentType} {employee.documentNumber}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{employee.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{employee.position}</p>
                        <Badge variant="outline" className="mt-1 bg-blue-900 text-blue-700 border-blue-200 text-xs">
                          {employee.area}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetail(employee)}
                          className="text-blue-900 hover:text-blue-900 border-blue-900 hover:bg-blue-50"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(employee)}
                          className="text-blue-900 hover:text-blue-900 border-blue-900 hover:bg-blue-50"
                        >
                          <EditIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(employee)}
                          className="text-blue-900 hover:text-blue-900 border-blue-900 hover:bg-blue-50"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-300 disabled:text-gray-500"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                if (page === currentPage) {
                  return (
                    <Button
                      key={page}
                      variant="outline"
                      size="sm"
                      className="bg-purple-600 text-white hover:bg-purple-700"
                    >
                      {page}
                    </Button>
                  );
                }
                return (
                  <Button
                    key={page}
                    variant="ghost"
                    size="sm"
                    className="w-8"
                  >
                    •
                  </Button>
                );
              })}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-300 disabled:text-gray-500"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* HU_041: Ver detalle del empleado */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle del Empleado</DialogTitle>
            <DialogDescription>
              Información completa del empleado seleccionado
            </DialogDescription>
          </DialogHeader>

          {selectedEmployee && (
            <div className="space-y-6">
              {/* Información Personal */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información Personal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">Nombre Completo</Label>
                      <p className="text-gray-900 mt-1">{selectedEmployee.firstName} {selectedEmployee.lastName}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Identificación</Label>
                      <p className="text-gray-900 mt-1">{selectedEmployee.documentType} {selectedEmployee.documentNumber}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Información de Contacto */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PhoneIcon className="w-5 h-5" />
                    Información de Contacto
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600 flex items-center gap-1">
                        <MailIcon className="w-4 h-4" />
                        Correo Electrónico
                      </Label>
                      <p className="text-gray-900 mt-1">{selectedEmployee.email}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600 flex items-center gap-1">
                        <PhoneIcon className="w-4 h-4" />
                        Teléfono
                      </Label>
                      <p className="text-gray-900 mt-1">{selectedEmployee.phone}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600 flex items-center gap-1">
                        <MapPinIcon className="w-4 h-4" />
                        Ciudad
                      </Label>
                      <p className="text-gray-900 mt-1">{selectedEmployee.city}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Dirección</Label>
                      <p className="text-gray-900 mt-1">{selectedEmployee.address}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Información Laboral */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BriefcaseIcon className="w-5 h-5" />
                    Información Laboral
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">Cargo Actual</Label>
                      <p className="text-gray-900 mt-1">{selectedEmployee.position}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Área</Label>
                      <Badge variant="outline" className="mt-1 bg-purple-50 text-purple-700 border-purple-200">
                        {selectedEmployee.area}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-gray-600 flex items-center gap-1">
                        <CalendarIcon className="w-4 h-4" />
                        Fecha de Ingreso
                      </Label>
                      <p className="text-gray-900 mt-1">{selectedEmployee.hireDate}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Estado</Label>
                      <div className="mt-1">
                        {getStatusBadge(selectedEmployee.status)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Documentos */}
              {selectedEmployee.documents.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileTextIcon className="w-5 h-5" />
                      Documentos Adjuntos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedEmployee.documents.map((doc, index) => (
                        <div key={index} className="flex items-center gap-2 bg-gray-50 rounded p-2 border">
                          <FileTextIcon className="w-4 h-4 text-gray-600" />
                          <span className="text-sm text-gray-700">{doc}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Información de Auditoría */}
              <Card className="bg-gray-50">
                <CardContent className="pt-4 text-xs text-gray-600 space-y-1">
                  <p>Creado por: {selectedEmployee.createdBy} el {selectedEmployee.createdAt}</p>
                  {selectedEmployee.modifiedBy && (
                    <p>Última modificación: {selectedEmployee.modifiedBy} el {selectedEmployee.modifiedAt}</p>
                  )}
                </CardContent>
              </Card>

              {/* Botón Volver */}
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedEmployee(null);
                  }}
                  className="flex-1"
                >
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Volver
                </Button>
                <Button
                  onClick={() => {
                    setShowDetailModal(false);
                    openEditModal(selectedEmployee);
                  }}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  <EditIcon className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* HU_042: Actualizar datos del empleado */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Actualizar Datos del Empleado</DialogTitle>
            <DialogDescription>
              Modifica la información del empleado. Los campos con (*) son obligatorios.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateEmployee} className="space-y-6">
            {/* Información Personal */}
            <Card className="border-2 border-purple-100">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white">
                <CardTitle className="text-lg">Información Personal</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre *</Label>
                    <Input
                      placeholder="Nombre del empleado"
                      value={employeeForm.firstName}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Apellidos *</Label>
                    <Input
                      placeholder="Apellidos del empleado"
                      value={employeeForm.lastName}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, lastName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Documento *</Label>
                    <Select
                      value={employeeForm.documentType}
                      onValueChange={(value) => setEmployeeForm({ ...employeeForm, documentType: value })}
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
                    <Label>Número de Identificación *</Label>
                    <Input
                      placeholder="Número de documento"
                      value={employeeForm.documentNumber}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, documentNumber: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Información de Contacto */}
            <Card className="border-2 border-purple-100">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white">
                <CardTitle className="text-lg">Información de Contacto</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Correo Electrónico *</Label>
                    <Input
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={employeeForm.email}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Teléfono *</Label>
                    <Input
                      placeholder="+57 300 123 4567"
                      value={employeeForm.phone}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ciudad</Label>
                    <Input
                      placeholder="Ciudad"
                      value={employeeForm.city}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dirección</Label>
                    <Input
                      placeholder="Dirección de residencia"
                      value={employeeForm.address}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, address: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Información Laboral */}
            <Card className="border-2 border-purple-100">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white">
                <CardTitle className="text-lg">Información Laboral</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cargo *</Label>
                    <Select
                      value={employeeForm.position}
                      onValueChange={(value) => setEmployeeForm({ ...employeeForm, position: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cargo" />
                      </SelectTrigger>
                      <SelectContent>
                        {positions.map(pos => (
                          <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Área *</Label>
                    <Select
                      value={employeeForm.area}
                      onValueChange={(value) => setEmployeeForm({ ...employeeForm, area: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar área" />
                      </SelectTrigger>
                      <SelectContent>
                        {areas.map(area => (
                          <SelectItem key={area} value={area}>{area}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha de Ingreso *</Label>
                    <Input
                      type="date"
                      value={employeeForm.hireDate}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, hireDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estado *</Label>
                    <Select
                      value={employeeForm.status}
                      onValueChange={(value) => setEmployeeForm({ ...employeeForm, status: value as 'Activo' | 'Inactivo' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Activo">Activo</SelectItem>
                        <SelectItem value="Inactivo">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documentos Opcionales */}
            <Card className="border-2 border-purple-100">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileTextIcon className="w-5 h-5" />
                  Documentos Opcionales
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddDocument}
                    className="w-full"
                  >
                    <UploadIcon className="w-4 h-4 mr-2" />
                    Adjuntar Documento
                  </Button>
                  {uploadedDocs.length > 0 && (
                    <div className="space-y-2">
                      {uploadedDocs.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 rounded p-2 border">
                          <span className="text-sm text-gray-700">{doc}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveDocument(index)}
                            className="text-red-600"
                          >
                            <XIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Notas Adicionales</Label>
                  <Textarea
                    placeholder="Información adicional sobre el empleado..."
                    value={employeeForm.notes}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Botones */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  setShowEditModal(false);
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                Guardar Cambios
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* HU_045: Eliminar empleado */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangleIcon className="w-5 h-5" />
              Eliminar Empleado
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>¿Estás seguro de que deseas eliminar este empleado?</p>
              {employeeToDelete && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">Empleado: </span>
                      <span className="text-sm text-gray-900">
                        {employeeToDelete.firstName} {employeeToDelete.lastName}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Identificación: </span>
                      <span className="text-sm text-gray-900">
                        {employeeToDelete.documentType} {employeeToDelete.documentNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Cargo: </span>
                      <span className="text-sm text-gray-900">{employeeToDelete.position}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Estado: </span>
                      {getStatusBadge(employeeToDelete.status)}
                    </div>
                  </div>
                </div>
              )}
              <p className="text-sm text-red-600">
                Esta acción no se puede deshacer. El registro se eliminará permanentemente del sistema.
              </p>
              {employeeToDelete?.status === 'Activo' && (
                <p className="text-sm text-red-600 font-medium">
                  ⚠️ No se puede eliminar un empleado activo. Cambia su estado a Inactivo primero.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEmployeeToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEmployee}
              className="bg-red-600 hover:bg-red-700"
              disabled={employeeToDelete?.status === 'Activo'}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
