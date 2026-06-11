import React, { createContext, useContext, useState, useCallback } from 'react';
import { getModulesByRole, MODULE_KEY_MAP } from '@/shared/services/modulesService';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface PermissionContextValue {
  allowedModuleKeys: string[];
  isLoaded:          boolean;
  hasApiError:       boolean;
  /** Verifica si el moduleId (ID de UI) está permitido para el usuario actual. */
  hasPermission:     (moduleId: string) => boolean;
  /** Carga (o recarga) los permisos del rol dado. */
  loadPermissions:   (rolesId: number) => Promise<void>;
  /** Limpia el estado de permisos (al hacer logout). */
  clearPermissions:  () => void;
}

// ─── Contexto ─────────────────────────────────────────────────────────────────
const PermissionContext = createContext<PermissionContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const [allowedModuleKeys, setAllowedModuleKeys] = useState<string[]>([]);
  const [isLoaded,          setIsLoaded]          = useState(false);
  const [hasApiError,       setHasApiError]       = useState(false);

  const loadPermissions = useCallback(async (rolesId: number) => {
    setIsLoaded(false);
    setHasApiError(false);

    const modules = await getModulesByRole(rolesId);

    if (modules === null) {
      setHasApiError(true);
      setIsLoaded(true);
      return;
    }

    const keys = modules
      .map(m => m.moduleKey || m.name.toLowerCase())
      .filter(Boolean) as string[];

    setAllowedModuleKeys(keys);
    setIsLoaded(true);
  }, []);

  const clearPermissions = useCallback(() => {
    setAllowedModuleKeys([]);
    setIsLoaded(false);
    setHasApiError(false);
  }, []);

  // Verifica si el moduleId de la UI está en la lista de claves permitidas.
  // Usa MODULE_KEY_MAP para resolver de clave DB → ID de UI.
  const hasPermission = useCallback((moduleId: string): boolean => {
    if (allowedModuleKeys.length === 0) return false;
    return allowedModuleKeys.some(
      key => MODULE_KEY_MAP[key] === moduleId || key === moduleId
    );
  }, [allowedModuleKeys]);

  return (
    <PermissionContext.Provider value={{
      allowedModuleKeys,
      isLoaded,
      hasApiError,
      hasPermission,
      loadPermissions,
      clearPermissions,
    }}>
      {children}
    </PermissionContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function usePermissions(): PermissionContextValue {
  const ctx = useContext(PermissionContext);
  if (!ctx) throw new Error('usePermissions debe usarse dentro de <PermissionProvider>');
  return ctx;
}
