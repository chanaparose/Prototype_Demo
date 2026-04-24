import { createBrowserRouter, redirect } from 'react-router';
import { Layout } from './components/layout';
import { Explore } from './pages/explore';
import { FactoryIdeas } from './pages/factory-ideas';
import { FactoryDetail } from './pages/factories/FactoryDetail';
import { ProductDetail } from './pages/product-detail';
import { PromotionDetail } from './pages/promotion-detail';
import { IdeaDetail } from './pages/idea-detail';
import { RfqAndOrders } from './pages/rfq-and-orders';
import { Messages } from './pages/messages';
import { Profile } from './pages/profile';
import { CreateRfq } from './pages/create-rfq';
import { RFQDetail } from './pages/rfq-detail';
import { OrderDetail } from './pages/order-detail';
import { ChatRoom } from './pages/chat-room';
import { Notifications } from './pages/notifications';
import { FactoriesList } from './pages/factories/FactoriesList';
import { Login } from './pages/login';
import { RegisterFactoryPage } from './pages/auth';
import { QuoteBuilder, QuoteDetailCustomer } from './pages/quote';
import { CommissionConfig } from './pages/admin';
import { AuthGuard } from './components/AuthGuard';
import { FactoryRoleGuard } from './components/factory/FactoryRoleGuard';
import { FactoryVerifiedGuard } from './components/factory/FactoryVerifiedGuard';
import {
  FactoryPortalLayout,
  FactoryDashboardPage,
  FactoryProfilePage,
  FactoryShowcasesPage,
  FactoryRfqBoardPage,
  FactoryRfqDetailPage,
  FactoryOrdersPage,
  FactoryOrderDetailPage,
  FactoryWalletPage,
  FactoryEditQuotationPage,
  FactoryQuotationsPage,
  FactoryShowcaseEditPage,
} from './pages/factory-portal';

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: Login,
  },
  {
    path: '/register/factory',
    Component: RegisterFactoryPage,
  },
  {
    path: '/',
    Component: AuthGuard,
    children: [
      {
        Component: Layout,
        children: [
          { index: true, Component: Explore },
          { path: 'product-detail', Component: ProductDetail },
          { path: 'promotion-detail', Component: PromotionDetail },
          { path: 'idea-detail', Component: IdeaDetail },
          { path: 'factory-ideas', Component: FactoryIdeas },
          { path: 'factories/:id', Component: FactoryDetail },
          { path: 'factories', Component: FactoriesList },
          { path: 'factory-ideas/products/:id', Component: ProductDetail },
          { path: 'factory-ideas/promotions/:id', Component: PromotionDetail },
          { path: 'factory-ideas/ideas/:id', Component: IdeaDetail },
          { path: 'rfqs', loader: () => redirect('/rfqs/rfq1'), Component: () => null },
          { path: 'orders', Component: RfqAndOrders },
          { path: 'messages', Component: Messages },
          { path: 'profile', Component: Profile },
          { path: 'create-rfq', Component: CreateRfq },
          { path: 'notifications', Component: Notifications },
          { path: 'quotations/:id', Component: QuoteDetailCustomer },
          { path: 'admin/commission-config', Component: CommissionConfig },
          { path: 'rfqs/:id', Component: RFQDetail },
          { path: 'orders/:id', Component: OrderDetail },
          { path: 'messages/:id', Component: ChatRoom },
          { path: 'chat-room/:id', Component: ChatRoom },
          {
            path: 'factory',
            Component: FactoryRoleGuard,
            children: [
              {
                Component: FactoryPortalLayout,
                children: [
                  { index: true, Component: FactoryDashboardPage },
                  { path: 'profile', Component: FactoryProfilePage },
                  { path: 'wallet', Component: FactoryWalletPage },
                  {
                    Component: FactoryVerifiedGuard,
                    children: [
                      { path: 'showcases', Component: FactoryShowcasesPage },
                      { path: 'showcases/:id/edit', Component: FactoryShowcaseEditPage },
                      { path: 'rfqs', Component: FactoryRfqBoardPage },
                      { path: 'rfqs/:id', Component: FactoryRfqDetailPage },
                      { path: 'rfqs/:rfqId/quote-builder', Component: QuoteBuilder },
                      { path: 'quotations/:id/edit', Component: FactoryEditQuotationPage },
                      { path: 'quotations/:id', Component: QuoteDetailCustomer },
                      { path: 'quotations', Component: FactoryQuotationsPage },
                      { path: 'orders', Component: FactoryOrdersPage },
                      { path: 'orders/:id', Component: FactoryOrderDetailPage },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]);
