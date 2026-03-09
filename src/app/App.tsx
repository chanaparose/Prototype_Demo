import { RouterProvider } from 'react-router';
import { router } from './routes';

export default function App() {
  return (
    <div className="min-h-screen w-full bg-gray-50">
      <RouterProvider router={router} />
    </div>
  );
}
