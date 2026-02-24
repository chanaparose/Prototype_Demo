import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Explore } from './pages/Explore';
import MyRfqs from './pages/MyRfqs';
import { Orders } from './pages/Orders';
import { Messages } from './pages/Messages';
import { Profile } from './pages/Profile';
import { CreateRfq } from './pages/CreateRfq';
import { RFQDetail } from './pages/RFQDetail';
import { OrderDetail } from './pages/OrderDetail';
import { ChatRoom } from './pages/ChatRoom';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Explore },
      { path: 'rfqs', Component: MyRfqs },
      { path: 'orders', Component: Orders },
      { path: 'messages', Component: Messages },
      { path: 'profile', Component: Profile },
    ],
  },
  { path: '/create-rfq', Component: CreateRfq },
  { path: '/rfqs/:id', Component: RFQDetail },
  { path: '/orders/:id', Component: OrderDetail },
  { path: '/messages/:id', Component: ChatRoom },
]);
