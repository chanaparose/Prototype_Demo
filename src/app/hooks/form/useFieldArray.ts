import { useState, useCallback } from 'react';

interface UseFieldArrayReturn<T> {
  fields: T[];
  append: (item: T) => void;
  remove: (index: number) => void;
  insert: (index: number, item: T) => void;
  update: (index: number, item: T) => void;
  move: (from: number, to: number) => void;
  clear: () => void;
  reset: (items: T[]) => void;
}

export function useFieldArray<T = any>(initialFields: T[] = []): UseFieldArrayReturn<T> {
  const [fields, setFields] = useState<T[]>(initialFields);

  const append = useCallback((item: T) => {
    setFields((prev) => [...prev, item]);
  }, []);

  const remove = useCallback((index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const insert = useCallback((index: number, item: T) => {
    setFields((prev) => {
      const next = [...prev];
      next.splice(index, 0, item);
      return next;
    });
  }, []);

  const update = useCallback((index: number, item: T) => {
    setFields((prev) => {
      const next = [...prev];
      next[index] = item;
      return next;
    });
  }, []);

  const move = useCallback((from: number, to: number) => {
    setFields((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setFields([]);
  }, []);

  const reset = useCallback((items: T[]) => {
    setFields(items);
  }, []);

  return {
    fields,
    append,
    remove,
    insert,
    update,
    move,
    clear,
    reset,
  };
}
