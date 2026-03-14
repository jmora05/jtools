//Novedades empleados - Gestión de incidencias, mejoras y novedades del equipo
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Badge } from '@/shared/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/shared/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { PlusIcon, SearchIcon, EditIcon, TrashIcon, XIcon, CalendarIcon, BellIcon, AlertCircleIcon, ChevronLeftIcon, ChevronRightIcon, EyeIcon, UserIcon } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface Issue { 
  title: string;
  description: string;
  status: 'Registrada' | 'Aprobada' | 'Rechazada';
  responsibleEmployee: string;
  reportedBy: string;
  reportDate: string;
}

export function NewsModule() {
  const [issues, setIssues] = useState<Issue[]>([
    {
      title: 'Falla en sistema de facturación',
      description: 'El sistema de facturación no permite generar facturas electrónicas desde esta mañana. Los clientes están reportando demoras.',
      status: 'Aprobada',
      responsibleEmployee: 'Carlos Ramírez',
      reportedBy: 'María González',
      reportDate: '2024-11-05'
    },
    {
      title: 'Equipo de aire acondicionado requiere mantenimiento',
      description: 'El aire acondicionado de la sala de ventas no está enfriando adecuadamente. Se requiere revisión técnica.',
      status: 'Aprobada',
      responsibleEmployee: 'Luis Torres',
      reportedBy: 'Ana Rodríguez',
      reportDate: '2024-11-04'
    },
    {
      title: 'Falta de inventario en productos de alta rotación',
      description: 'Se han agotado varias referencias de filtros de aceite que son de alta demanda. Clientes están solicitando.',
      status: 'Aprobada',
      responsibleEmployee: 'Pedro Sánchez',
      reportedBy: 'Carlos Medina',
      reportDate: '2024-11-03'
    },
    {
      title: 'Actualización de precios en catálogo',
      description: 'Algunos productos tienen precios desactualizados en el sistema. Se requiere actualización urgente.',
      status: 'Aprobada',
      responsibleEmployee: 'Andrea López',
      reportedBy: 'Roberto Díaz',
      reportDate: '2024-11-01'
    },
    {
      title: 'Mejora en proceso de recepción de mercancía',
      description: 'Propuesta para optimizar el proceso de recepción y registro de mercancía en bodega.',
      status: 'Aprobada ',
      responsibleEmployee: 'Javier Morales',
      reportedBy: 'Laura Gómez',
      reportDate: '2024-10-30'
    },
    {
      title: 'Capacitación en nuevo sistema de ventas',
      description: 'Se requiere programar capacitación para el equipo de ventas sobre las nuevas funcionalidades del sistema.',
      status: 'Aprobada',
      responsibleEmployee: 'Diana Martínez',
      reportedBy: 'Andrés Castro',
      reportDate: '2024-10-28'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const [issueForm, setIssueForm] = useState({
    title: '',
    description: '',
    status: 'Registrada' as 'Registrada' | 'Aprobada' | 'Rechazada',
    responsibleEmployee: '',
    reportedBy: 'Usuario Actual'
  });

  const itemsPerPage = 5;

  // Filtrado de novedades
  const filteredIssues = issues.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.responsibleEmployee.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.reportedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    return matchesSearch && matchesStatus
  });

  const totalPages = Math.ceil(filteredIssues.length / itemsPerPage);
  const paginatedIssues = filteredIssues.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const resetForm = () => {
    setIssueForm({
      title: '',
      description: '',
      status: 'Registrada',
      responsibleEmployee: '',
      reportedBy: 'Usuario Actual'
    });
  };

  const handleCreateIssue = (e: React.FormEvent) => {
    e.preventDefault();

    const newIssue: Issue = {
      id: Math.max(...issues.map(n => n.id), 0) + 1,
      ...issueForm,
      reportDate: new Date().toISOString().split('T')[0]
    };

    setIssues([...issues, newIssue]);
    resetForm();
    setIsNewDialogOpen(false);
    toast.success('Novedad registrada exitosamente');
  };

  const handleUpdateIssue = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedIssue) return;

    const updatedIssues = issues.map(item =>
      item.id === selectedIssue.id
        ? {
            ...item,
            ...issueForm
          }
        : item
    );

    setIssues(updatedIssues);
    setIsEditDialogOpen(false);
    setSelectedIssue(null);
    resetForm();
    toast.success('Novedad actualizada exitosamente');
  };

  const handleDeleteIssue = () => {
    if (!selectedIssue) return;

    setIssues(issues.filter(item => item.id !== selectedIssue.id));
    setIsDeleteDialogOpen(false);
    setSelectedIssue(null);
    toast.success('Novedad eliminada exitosamente');
  };

  const openEditDialog = (issue: Issue) => {
    setSelectedIssue(issue);
    setIssueForm({
      title: issue.title,
      description: issue.description,
      status: issue.status,
      responsibleEmployee: issue.responsibleEmployee,
      reportedBy: issue.reportedBy
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (issue: Issue) => {
    setSelectedIssue(issue);
    setIsViewDialogOpen(true);
  };

  const openDeleteDialog = (issue: Issue) => {
    setSelectedIssue(issue);
    setIsDeleteDialogOpen(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Registrada':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Aprobada':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Rechazada':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <TooltipProvider>
      <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl text-gray-900 flex items-center gap-3">
              <AlertCircleIcon className="w-8 h-8 text-blue-600" />
              Gestión de Novedades
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Registra y gestiona novedades, incidencias y mejoras del equipo
            </p>
          </div>

          <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" size="lg">
                <PlusIcon className="w-4 h-4 mr-2" />
                Nueva Novedad
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Nueva Novedad</DialogTitle>
                <DialogDescription>
                  Completa el formulario para registrar una nueva novedad o incidencia.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateIssue} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    placeholder="Breve descripción del problema o novedad..."
                    value={issueForm.title}
                    onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción Detallada *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe con detalle la situación, el problema o la mejora propuesta..."
                    value={issueForm.description}
                    onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}
                    rows={5}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div className="space-y-2">
                    <Label htmlFor="status">Estado *</Label>
                    <Select
                      value={issueForm.status}
                      onValueChange={(value) => setIssueForm({ ...issueForm, status: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Registrada">Registrada</SelectItem>
                        <SelectItem value="Aprobada">Aprobada</SelectItem>
                        <SelectItem value="Rechazada">Rechazada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="responsibleEmployee">Empleado Responsable *</Label>
                    <Input
                      id="responsibleEmployee"
                      placeholder="Nombre del responsable..."
                      value={issueForm.responsibleEmployee}
                      onChange={(e) => setIssueForm({ ...issueForm, responsibleEmployee: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reportedBy">Reportado por</Label>
                    <Input
                      id="reportedBy"
                      placeholder="Nombre de quien reporta..."
                      value={issueForm.reportedBy}
                      onChange={(e) => setIssueForm({ ...issueForm, reportedBy: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetForm();
                      setIsNewDialogOpen(false);
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                    Registrar Novedad
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <Card className="shadow-lg border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Buscar novedades por título, responsable o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="Registrada">Registrada</SelectItem>
                  <SelectItem value="Aprobada">Aprobada</SelectItem>
                  <SelectItem value="Rechazada">Rechazada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span className="text-sm text-gray-600 text-center sm:text-left">
              {filteredIssues.length} novedad(es)
            </span>
          </div>
        </Card>
{/*LISTA DE NOVEDADES*/}
        {/* Tabla de Novedades */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Título</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Responsable</th>
                  <th className="px-6 py-3 text-center text-xs text-gray-600 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedIssues.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <AlertCircleIcon className="w-12 h-12 mb-3 text-gray-300" />
                        <p className="text-gray-900">No se encontraron novedades</p>
                        <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedIssues.map((issue) => (
                    <tr key={issue.id} className="hover:bg-gray-50 transition-colors">

                      <td className="px-10 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">{issue.title}</div>
                        <div className="text-sm text-gray-500">{issue.reportedBy}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{issue.reportDate}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{issue.responsibleEmployee}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openViewDialog(issue)}
                                className="text-blue-900 hover:text-blue-900 border-blue-900 hover:border-blue-900 hover:bg-blue-50"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Ver detalles</p></TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(issue)}
                                className="text-blue-900 hover:text-blue-900 border-blue-900 hover:border-blue-900 hover:bg-blue-50"
                              >
                                <EditIcon className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Editar novedad</p></TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openDeleteDialog(issue)}
                                className="text-blue-900 hover:text-blue-900 border-blue-900 hover:border-blue-900 hover:bg-blue-50"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Eliminar novedad</p></TooltipContent>
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
          {filteredIssues.length > 0 && (
            <div className="border-t border-gray-200 px-6 py-4">
              <div className="flex items-center justify-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:text-gray-500"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </Button>
                
                <div className="flex items-center space-x-1">
                  {getPageNumbers().map((page, index) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "ghost"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className={currentPage === page ? "bg-blue-600 hover:bg-blue-700 text-white min-w-[32px]" : "min-w-[32px]"}
                    >
                      {currentPage === page ? page : '•'}
                    </Button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:text-gray-500"
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalles de la Novedad</DialogTitle>
              <DialogDescription>
                Información completa de la novedad registrada
              </DialogDescription>
            </DialogHeader>
            {selectedIssue && (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h2 className="text-2xl text-gray-900">{selectedIssue.title}</h2>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(selectedIssue.status)}>
                        {selectedIssue.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Información General</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Empleado Responsable:</p>
                      <p className="text-gray-900 flex items-center gap-2 mt-1">
                        <UserIcon className="w-4 h-4" />
                        {selectedIssue.responsibleEmployee}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Reportado por:</p>
                      <p className="text-gray-900 mt-1">{selectedIssue.reportedBy}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Fecha de Reporte:</p>
                      <p className="text-gray-900 flex items-center gap-2 mt-1">
                        <CalendarIcon className="w-4 h-4" />
                        {selectedIssue.reportDate}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Descripción Detallada</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 whitespace-pre-line">{selectedIssue.description}</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Novedad</DialogTitle>
              <DialogDescription>
                Modifica la información de la novedad.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateIssue} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Título *</Label>
                <Input
                  id="edit-title"
                  placeholder="Breve descripción del problema o novedad..."
                  value={issueForm.title}
                  onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Descripción Detallada *</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Describe con detalle la situación, el problema o la mejora propuesta..."
                  value={issueForm.description}
                  onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}
                  rows={5}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="space-y-2">
                  <Label htmlFor="edit-status">Estado *</Label>
                  <Select
                    value={issueForm.status}
                    onValueChange={(value) => setIssueForm({ ...issueForm, status: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Registrada">Registrada</SelectItem>
                      <SelectItem value="Aprobada">Aprobada</SelectItem>
                      <SelectItem value="Rechazada">Rechazada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-responsibleEmployee">Empleado Responsable *</Label>
                  <Input
                    id="edit-responsibleEmployee"
                    placeholder="Nombre del responsable..."
                    value={issueForm.responsibleEmployee}
                    onChange={(e) => setIssueForm({ ...issueForm, responsibleEmployee: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-reportedBy">Reportado por</Label>
                  <Input
                    id="edit-reportedBy"
                    placeholder="Nombre de quien reporta..."
                    value={issueForm.reportedBy}
                    onChange={(e) => setIssueForm({ ...issueForm, reportedBy: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setIsEditDialogOpen(false);
                    setSelectedIssue(null);
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Actualizar Novedad
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar esta novedad?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. La novedad será eliminada permanentemente.
                {selectedIssue && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-900">
                      <strong>Título:</strong> {selectedIssue.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>Responsable:</strong> {selectedIssue.responsibleEmployee}
                    </p>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSelectedIssue(null)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteIssue}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
