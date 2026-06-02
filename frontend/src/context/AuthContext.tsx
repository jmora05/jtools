/**
 * AuthContext.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Contexto global de autenticación.
 * Provee el usuario autenticado a cualquier componente del árbol sin necesidad
 * de prop-drilling.
 *
 * Uso:
 *   1. Envuelve <App> con <AuthProvider> en main.tsx (o en App.tsx).
 *   2. En cualquier componente: const { currentUser } = useAuth();
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

// ─── Tipo del usuario autenticado ─────────────────────────────────────────────
export interface AuthUser {
  id: number;
  email: string;
  displayName: string;
  rolNombre: string;   // nombre exacto del rol: "Administrador" | "Cliente" | ...
  rolesId: number;
  userType: 'admin' | 'client';
  telefono?: string | null;
  ciudad?: string | null;
  documento?: string | null;
}

// ─── Forma del contexto ───────────────────────────────────────────────────────
interface AuthContextValue {
  currentUser: AuthUser | null;
  setCurrentUser: (user: AuthUser | null) => void;
  clearCurrentUser: () => void;
}

// ─── Creación del contexto ────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<AuthUser | null>(null);

  const setCurrentUser = useCallback((user: AuthUser | null) => {
    setCurrentUserState(user);
  }, []);

  const clearCurrentUser = useCallback(() => {
    setCurrentUserState(null);
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, clearCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook de consumo ──────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return ctx;
}
