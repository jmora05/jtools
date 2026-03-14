import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { XIcon } from 'lucide-react';

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  onSave?: () => void;
  onCancel?: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  isSaving?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
  showActions?: boolean;
}

export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSave,
  onCancel,
  saveLabel = 'Guardar',
  cancelLabel = 'Cancelar',
  isSaving = false,
  maxWidth = 'lg',
  showActions = true
}: ResponsiveDialogProps) {
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onOpenChange(false);
    }
  };

  const getMaxWidthClass = () => {
    const widthMap = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      '2xl': 'max-w-2xl',
      '3xl': 'max-w-3xl',
      '4xl': 'max-w-4xl',
      '5xl': 'max-w-5xl',
      '6xl': 'max-w-6xl',
      '7xl': 'max-w-7xl'
    };
    return widthMap[maxWidth];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`
          ${getMaxWidthClass()} 
          w-[95vw] 
          max-h-[90vh] 
          sm:max-h-[85vh] 
          p-0 
          gap-0 
          overflow-hidden
          m-4
          sm:m-0
        `}
      >
        {/* Header */}
        <DialogHeader className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex-1 pr-4">
              <DialogTitle className="text-lg sm:text-xl text-gray-900 truncate">
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="text-sm text-gray-500 mt-1">
                  {description}
                </DialogDescription>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg"
            >
              <XIcon className="w-4 h-4" />
              <span className="sr-only">Cerrar</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
          {children}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50 sticky bottom-0 z-10">
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="w-full sm:w-auto order-2 sm:order-1"
                disabled={isSaving}
              >
                {cancelLabel}
              </Button>
              {onSave && (
                <Button
                  type="button"
                  onClick={onSave}
                  className="w-full sm:w-auto order-1 sm:order-2 bg-blue-600 hover:bg-blue-700"
                  disabled={isSaving}
                >
                  {isSaving ? 'Guardando...' : saveLabel}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Form Grid Component for consistent form layouts
interface FormGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function FormGrid({ children, columns = 2, className = '' }: FormGridProps) {
  const getGridClass = () => {
    const gridMap = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
    };
    return gridMap[columns];
  };

  return (
    <div className={`grid ${getGridClass()} gap-4 sm:gap-6 ${className}`}>
      {children}
    </div>
  );
}

// Form Field Component for consistent styling
interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
  description?: string;
  fullWidth?: boolean;
}

export function FormField({ 
  label, 
  children, 
  required = false, 
  error, 
  description,
  fullWidth = false 
}: FormFieldProps) {
  return (
    <div className={fullWidth ? 'col-span-full' : ''}>
      <label className="block text-sm text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {description && (
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      )}
      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}

// Action Buttons Component for table rows
interface ActionButtonsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  editLabel?: string;
  deleteLabel?: string;
  viewLabel?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ActionButtons({
  onEdit,
  onDelete,
  onView,
  editLabel = 'Editar',
  deleteLabel = 'Eliminar',
  viewLabel = 'Ver',
  size = 'sm'
}: ActionButtonsProps) {
  return (
    <div className="flex items-center gap-2 justify-end">
      {onView && (
        <Button
          variant="ghost"
          size={size}
          onClick={onView}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          {viewLabel}
        </Button>
      )}
      {onEdit && (
        <Button
          variant="ghost"
          size={size}
          onClick={onEdit}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          {editLabel}
        </Button>
      )}
      {onDelete && (
        <Button
          variant="ghost"
          size={size}
          onClick={onDelete}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          {deleteLabel}
        </Button>
      )}
    </div>
  );
}

// Responsive Table Wrapper
interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveTable({ children, className = '' }: ResponsiveTableProps) {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="inline-block min-w-full align-middle">
        <div className={`overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 sm:rounded-lg ${className}`}>
          {children}
        </div>
      </div>
    </div>
  );
}

// Stats Card for dashboards
interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({ title, value, icon, trend, className = '' }: StatsCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 truncate">{title}</p>
          <p className="text-2xl sm:text-3xl text-gray-900 mt-1">{value}</p>
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              <span>{trend.isPositive ? '↗' : '↘'}</span>
              <span className="ml-1">{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 p-3 bg-blue-50 rounded-lg">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}