import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from './contexts/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen w-full bg-gray-50">
        <RouterProvider router={router} />
      </div>
    </AuthProvider>
  );
}
