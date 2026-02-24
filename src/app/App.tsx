import { RouterProvider } from 'react-router';
import { router } from './routes';

export default function App() {
  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: 'linear-gradient(135deg, #EDE9FE 0%, #E8E6F0 50%, #DDD6FE 100%)',
      }}
    >
      <RouterProvider router={router} />
    </div>
  );
}
