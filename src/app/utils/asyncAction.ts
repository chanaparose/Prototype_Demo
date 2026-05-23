import { getErrorMessage } from '@/lib/apiError';

type AsyncActionOptions = {
  onError?: (message: string, error: unknown) => void;
  onStart?: () => void;
  onSettled?: () => void;
  fallbackMessage?: string;
};

export function runAsyncAction<T>(
  action: () => Promise<T>,
  options: AsyncActionOptions = {},
): Promise<T | undefined> {
  options.onStart?.();
  return action()
    .then((result) => {
      options.onSettled?.();
      return result;
    })
    .catch((error) => {
      options.onError?.(getErrorMessage(error, options.fallbackMessage), error);
      options.onSettled?.();
      return undefined;
    });
}

export function ignoreAsyncError<T>(promise: Promise<T>): Promise<T | undefined> {
  return promise.catch(() => undefined);
}

export function fallbackAsync<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return promise.catch(() => fallback);
}
