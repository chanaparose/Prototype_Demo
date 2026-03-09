import { createBrowserRouter, redirect } from 'react-router';
import { Layout } from './components/layout';
import { Explore } from './pages/Explore';
import { FactoryIdeas } from './pages/FactoryIdeas';
import { FactoryProfile } from './pages/FactoryProfile';
import { ProductDetail } from './pages/ProductDetail';
import { PromotionDetail } from './pages/PromotionDetail';
import { IdeaDetail } from './pages/IdeaDetail';
import { RfqAndOrders } from './pages/RfqAndOrders';
import { Messages } from './pages/Messages';
import { Profile } from './pages/Profile';
import { CreateRfq } from './pages/CreateRfq';
import { RFQDetail } from './pages/RFQDetail';
import { OrderDetail } from './pages/OrderDetail';
import { ChatRoom } from './pages/ChatRoom';
import { Notifications } from './pages/Notifications';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Explore },
      { path: 'factory-ideas', Component: FactoryIdeas },
      { path: 'factories/:id', Component: FactoryProfile },
      { path: 'factory-ideas/products/:id', Component: ProductDetail },
      { path: 'factory-ideas/promotions/:id', Component: PromotionDetail },
      { path: 'factory-ideas/ideas/:id', Component: IdeaDetail },
      { path: 'rfqs', loader: () => redirect('/orders'), Component: () => null },
      { path: 'orders', Component: RfqAndOrders },
      { path: 'messages', Component: Messages },
      { path: 'profile', Component: Profile },
      { path: 'create-rfq', Component: CreateRfq },
      { path: 'notifications', Component: Notifications },
      { path: 'rfqs/:id', Component: RFQDetail },
      { path: 'orders/:id', Component: OrderDetail },
      { path: 'messages/:id', Component: ChatRoom },
    ],
  },
]);
