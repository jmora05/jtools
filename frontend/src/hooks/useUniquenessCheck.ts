import { useState, useRef, useCallback } from 'react';
import { getApiBaseUrl, buildAuthHeaders } from '../services/http';

interface CheckResult {
  checking: boolean;
  error: string | null;
}

/**
 * Hook reutilizable para validar la unicidad de un campo en tiempo real
 * contra el endpoint GET /<modulo>/verificar del backend.
 *
 * @param modulo   'proveedores' | 'empleados' | 'clientes' | 'usuarios'
 * @param campo    nombre exacto de la columna en el backend
 * @param excluirId id a excluir (en edición), para no marcar el registro propio
 * @param minLength longitud mínima antes de disparar la verificación
 */
export function useUniquenessCheck(
  modulo: string,
  campo: string,
  excluirId?: number | string,
  minLength = 3,
) {
  const [state, setState] = useState<CheckResult>({ checking: false, error: null });
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const check = useCallback(
    (valor: string) => {
      setState(s => ({ ...s, error: null }));
      clearTimeout(timerRef.current);

      if (!valor || valor.trim().length < minLength) return;

      timerRef.current = setTimeout(async () => {
        setState(s => ({ ...s, checking: true }));
        try {
          const params = new URLSearchParams({ campo, valor: valor.trim() });
          if (excluirId != null) params.set('excluirId', String(excluirId));
          const res = await fetch(
            `${getApiBaseUrl()}/${modulo}/verificar?${params.toString()}`,
            { headers: buildAuthHeaders() },
          );
          const data = await res.json().catch(() => ({}));
          if (data?.existe) {
            setState({ checking: false, error: data.mensaje ?? 'Ya está registrado' });
          } else {
            setState({ checking: false, error: null });
          }
        } catch {
          setState({ checking: false, error: null }); // degrada en silencio
        }
      }, 450);
    },
    [modulo, campo, excluirId, minLength],
  );

  const reset = useCallback(() => {
    clearTimeout(timerRef.current);
    setState({ checking: false, error: null });
  }, []);

  return { ...state, check, reset };
}
