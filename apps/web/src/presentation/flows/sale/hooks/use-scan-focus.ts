import { useCallback, useRef } from 'react';

/**
 * Retorno de foco ao scanner após qualquer mutação (11 pontos de chamada em
 * pos.tsx antes desta extração). Sem cobertura E2E — risco aceito, ver ADR 0003.
 */
export function useScanFocus() {
  const scanRef = useRef<HTMLInputElement>(null);

  const focusScan = useCallback(() => {
    requestAnimationFrame(() => scanRef.current?.focus());
  }, []);

  return { scanRef, focusScan };
}
