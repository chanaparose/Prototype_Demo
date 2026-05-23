import {
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
} from '@tanstack/react-query';
import { getErrorMessage } from '@/lib/apiError';

type AppMutationOptions<TData, TVariables, TContext> = UseMutationOptions<
  TData,
  unknown,
  TVariables,
  TContext
> & {
  fallbackMessage?: string;
  onErrorMessage?: (message: string) => void;
};

export function useAppMutation<TData = void, TVariables = void, TContext = unknown>(
  options: AppMutationOptions<TData, TVariables, TContext>,
): UseMutationResult<TData, unknown, TVariables, TContext> {
  const { fallbackMessage, onErrorMessage, onError, ...rest } = options;
  return useMutation({
    ...rest,
    onError: (error, variables, context, mutation) => {
      onErrorMessage?.(getErrorMessage(error, fallbackMessage));
      onError?.(error, variables, context, mutation);
    },
  });
}
