import { useState, useEffect, useCallback } from 'react';

interface UseLocalStorageReturn<T> {
  value: T | null;
  setValue: (value: T | null) => void;
  clear: () => void;
}

/**
 * Sync state with localStorage
 * @param key - localStorage key
 * @param initialValue - Default value if key doesn't exist
 */
export function useLocalStorage<T = any>(
  key: string,
  initialValue?: T
): UseLocalStorageReturn<T> {
  const [value, setValue] = useState<T | null>(() => {
    try {
      const item = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
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
            window.localStorage.removeItem(key);
          } else {
            window.localStorage.setItem(key, JSON.stringify(newValue));
          }
        }
      } catch {
        console.error(`Failed to set localStorage key "${key}"`);
      }
    },
    [key]
  );

  const clear = useCallback(() => {
    setStorageValue(null);
  }, [setStorageValue]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setValue(JSON.parse(e.newValue) as T);
        } catch {
          setValue(null);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [key]);

  return { value, setValue: setStorageValue, clear };
}
