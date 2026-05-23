import { useEffect, useMemo } from 'react';
import { useForm, type DefaultValues, type FieldValues, type UseFormReturn } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';

interface UseEditFormOptions<T extends FieldValues, Raw> {
  queryKey: readonly unknown[];
  queryFn: () => Promise<Raw>;
  /** Map server data → form values. Return `undefined` while not ready. */
  mapper: (raw: Raw) => T;
  defaults: DefaultValues<T>;
  /** Optional: called after values are applied to form (e.g., reset dirty state tracking). */
  onReady?: (values: T) => void;
  enabled?: boolean;
}

export interface UseEditFormResult<T extends FieldValues> {
  form: UseFormReturn<T>;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useEditForm<T extends FieldValues, Raw = unknown>(
  options: UseEditFormOptions<T, Raw>,
): UseEditFormResult<T> {
  const { queryKey, queryFn, enabled, mapper, defaults, onReady } = options;
  const query = useQuery({
    queryKey,
    queryFn,
    enabled: enabled ?? true,
    refetchOnWindowFocus: false,
  });

  const values = useMemo(
    () => (query.data !== undefined ? mapper(query.data) : undefined),
    [query.data, mapper],
  );

  const form = useForm<T>({
    defaultValues: defaults,
    values,
    mode: 'onBlur',
  });

  useEffect(() => {
    if (values !== undefined && onReady) onReady(values);
  }, [values, onReady]);

  return {
    form,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => void query.refetch(),
  };
}
