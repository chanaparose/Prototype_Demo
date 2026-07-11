import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  /** Optional custom fallback. Receives the error and a reset callback. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
};

type State = {
  error: Error | null;
};

/**
 * Top-level error boundary. A render-time throw anywhere below this component
 * is caught here and shown as a recoverable fallback instead of white-screening
 * the whole app. Note: React error boundaries do NOT catch errors in event
 * handlers, async code, or SSR — those still need their own try/catch.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep a console trail for local debugging; wire to a real reporter later.
    console.error('[ErrorBoundary] uncaught render error', error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) return this.props.fallback(error, this.reset);

    return (
      <div className='flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-gray-50 px-6 text-center'>
        <h1 className='text-xl font-semibold text-gray-900'>เกิดข้อผิดพลาดบางอย่าง</h1>
        <p className='max-w-md text-sm text-gray-500'>
          ระบบทำงานผิดพลาดชั่วคราว กรุณาลองใหม่อีกครั้ง หากยังพบปัญหาให้รีเฟรชหน้าเว็บ
        </p>
        <div className='flex gap-3'>
          <button
            type='button'
            onClick={this.reset}
            className='rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800'
          >
            ลองอีกครั้ง
          </button>
          <button
            type='button'
            onClick={() => window.location.reload()}
            className='rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100'
          >
            รีเฟรชหน้า
          </button>
        </div>
        {import.meta.env.DEV && (
          <pre className='mt-2 max-w-lg overflow-x-auto rounded-lg bg-gray-100 p-3 text-left text-xs text-red-600'>
            {error.message}
          </pre>
        )}
      </div>
    );
  }
}
