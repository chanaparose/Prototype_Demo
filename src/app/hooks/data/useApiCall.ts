import { useCallback, useEffect, useRef, useState } from 'react';

type ApiCallState<TData> = {
  data: TData | null;
  loading: boolean;
  error: string;
};

type UseApiCallOptions<TData> = {
  enabled?: boolean;
  initialData?: TData | null;
  keepPreviousData?: boolean;
  onSuccess?: (data: TData) => void;
  onError?: (error: unknown) => void;
};

function errorMessage(error: unknown, fallback = 'โหลดข้อมูลไม่สำเร็จ') {
  return error instanceof Error ? error.message : fallback;
}

export function useApiCall<TData>(
  apiCall: () => Promise<TData>,
  deps: readonly unknown[] = [],
  {
    enabled = true,
    initialData = null,
    keepPreviousData = false,
    onSuccess,
    onError,
  }: UseApiCallOptions<TData> = {},
) {
  const apiCallRef = useRef(apiCall);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const requestIdRef = useRef(0);

  const [state, setState] = useState<ApiCallState<TData>>({
    data: initialData,
    loading: enabled,
    error: '',
  });

  useEffect(() => {
    apiCallRef.current = apiCall;
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [apiCall, onError, onSuccess]);

  const execute = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setState((prev) => ({
      data: keepPreviousData ? prev.data : initialData,
      loading: true,
      error: '',
    }));
    try {
      const data = await apiCallRef.current();
      if (requestIdRef.current !== requestId) return data;
      setState({ data, loading: false, error: '' });
      onSuccessRef.current?.(data);
      return data;
    } catch (error) {
      if (requestIdRef.current !== requestId) return undefined;
      setState((prev) => ({
        data: keepPreviousData ? prev.data : initialData,
        loading: false,
        error: errorMessage(error),
      }));
      onErrorRef.current?.(error);
      return undefined;
    }
  }, [initialData, keepPreviousData]);

  useEffect(() => {
    if (!enabled) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }
    void execute();
    return () => {
      requestIdRef.current += 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, execute, ...deps]);

  return {
    ...state,
    setData: (data: TData | null) => setState((prev) => ({ ...prev, data })),
    setError: (error: string) => setState((prev) => ({ ...prev, error })),
    refetch: execute,
  };
}
