import { useState, useCallback } from 'react';

interface UseSessionStorageReturn<T> {
  value: T | null;
  setValue: (value: T | null) => void;
  clear: () => void;
}

/**
 * Sync state with sessionStorage (cleared when tab closes)
 * @param key - sessionStorage key
 * @param initialValue - Default value if key doesn't exist
 */
export function useSessionStorage<T = any>(
  key: string,
  initialValue?: T,
): UseSessionStorageReturn<T> {
  const [value, setValue] = useState<T | null>(() => {
    try {
      const item = typeof window !== 'undefined' ? window.sessionStorage.getItem(key) : null;
      return item ? (JSON.parse(item) as T) : (initialValue ?? null);
    } catch {
      return initialValue ?? null;
    }
  });

  const setStorageValue = useCallback(
    (newValue: T | null) => {
      try {
        setValue(newValue);
        if (typeof window !== 'undefined') {
          if (newValue === null) {
            window.sessionStorage.removeItem(key);
          } else {
            window.sessionStorage.setItem(key, JSON.stringify(newValue));
          }
        }
      } catch {
        console.error(`Failed to set sessionStorage key "${key}"`);
      }
    },
    [key],
  );

  const clear = useCallback(() => {
    setStorageValue(null);
  }, [setStorageValue]);

  return { value, setValue: setStorageValue, clear };
}
