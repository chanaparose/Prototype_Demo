import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { router } from './routes';
import { DataStoreInitializer } from './components/DataStoreInitializer';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DataStoreInitializer />
      <div className="min-h-screen w-full bg-gray-50">
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
      </div>
    </QueryClientProvider>
  );
}
