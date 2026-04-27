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
  const query = useQuery({
    queryKey: options.queryKey,
    queryFn: options.queryFn,
    enabled: options.enabled ?? true,
    refetchOnWindowFocus: false,
  });

  const values = useMemo(
    () => (query.data !== undefined ? options.mapper(query.data) : undefined),
    [query.data, options.mapper],
  );

  const form = useForm<T>({
    defaultValues: options.defaults,
    values,
    mode: 'onBlur',
  });

  useEffect(() => {
    if (values !== undefined && options.onReady) options.onReady(values);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  return {
    form,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => void query.refetch(),
  };
}
