import { useState, useCallback } from 'react';

/**
 * Simple toggle hook for boolean state
 * Perfect for open/close, show/hide patterns
 */
export function useToggle(initialState = false) {
  const [state, setState] = useState(initialState);

  const toggle = useCallback(() => setState((prev) => !prev), []);
  const open = useCallback(() => setState(true), []);
  const close = useCallback(() => setState(false), []);
  const set = useCallback((value: boolean) => setState(value), []);

  return { state, toggle, open, close, set };
}
