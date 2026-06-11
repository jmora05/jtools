import { ShieldX } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

interface AccessDeniedProps {
  onGoBack?: () => void;
}

export function AccessDenied({ onGoBack }: AccessDeniedProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 p-8">
      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
        <ShieldX className="w-10 h-10 text-red-400" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Acceso restringido</h2>
        <p className="text-gray-500 max-w-md">
          No tienes permisos para acceder a este módulo.
          Contacta a tu administrador si crees que deberías tener acceso.
        </p>
      </div>
      {onGoBack && (
        <Button onClick={onGoBack} className="bg-blue-600 hover:bg-blue-700 text-white">
          Volver al inicio
        </Button>
      )}
    </div>
  );
}
