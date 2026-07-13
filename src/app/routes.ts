import { createBrowserRouter, redirect } from 'react-router';
import { Layout } from '@/components/layout/Layout';
import { Explore } from '@/pages/explore';
import { FactoryIdeas } from '@/pages/factory-ideas';
import { FactoryIdeasHubPage } from '@/pages/factory-ideas-hub/FactoryIdeasHubPage';
import { FactoryDetail } from '@/pages/factories/FactoryDetail';
import { ProductDetail } from '@/pages/product-detail';
import { PromotionDetail } from '@/pages/promotion-detail';
import { IdeaDetail } from '@/pages/idea-detail';
import { RfqAndOrders } from '@/pages/rfq-and-orders';
import { Messages } from '@/pages/messages';
import { Profile } from '@/pages/profile';
import { EditProfilePage } from '@/pages/profile/EditProfilePage';
import { ChangePasswordPage } from '@/pages/profile/ChangePasswordPage';
import { TransactionHistoryPage } from '@/pages/profile/TransactionHistoryPage';
import { MyReviewsPage } from '@/pages/profile/MyReviewsPage';
import { FavoriteShowcasesPage } from '@/pages/profile/FavoriteShowcasesPage';
import { CreateRfq } from '@/pages/create-rfq';
import { RFQDetail } from '@/pages/rfq-detail';
import { OrderDetail } from '@/pages/order-detail';
import { ChatRoom } from '@/pages/chat-room';
import { Notifications } from '@/pages/notifications';
import { FactoriesList } from '@/pages/factories/FactoriesList';
import { Login } from '@/pages/login';
import { RegisterFactoryPage } from '@/pages/auth/RegisterFactoryPage';
import { RegisterPage } from '@/pages/register/RegisterPage';
import { QuoteBuilder, QuoteDetailCustomer } from '@/pages/quote';
import {
  CommissionConfig,
  AdminLayout,
  AdminDashboardPage,
  AdminFactoriesPage,
  AdminFactoryDetailPage,
  AdminRFQsPage,
  AdminOrdersPage,
  AdminOrderDetailPage,
  AdminConfigPage,
  AdminCustomersPage,
  AdminCustomerDetailPage,
  AdminCommissionPage,
  AdminWithdrawalsPage,
  AdminCategoryImagesPage,
} from '@/pages/admin';
import { AuthGuard } from '@/components/AuthGuard';
import { RoleRedirectIndex } from '@/components/RoleRedirectIndex';
import { PublicDataOutlet } from '@/components/PublicDataOutlet';
import { FactoryRoleGuard } from '@/components/factory/FactoryRoleGuard';
import { FactoryVerifiedGuard } from '@/components/factory/FactoryVerifiedGuard';
import { FactoryPortalLayout } from '@/pages/factory-portal/FactoryPortalLayout';
import { FactoryDashboardPage } from '@/pages/factory-portal/FactoryDashboardPage';

import { FactoryInfoPage } from '@/pages/factory-portal/FactoryInfoPage';
import { FactoryShowcasesPage } from '@/pages/factory-portal/FactoryShowcasesPage';
import { FactoryShowcaseNewPage } from '@/pages/factory-portal/FactoryShowcaseNewPage';
import { FactoryRfqBoardPage } from '@/pages/factory-portal/FactoryRfqBoardPage';
import { FactoryRfqDetailPage } from '@/pages/factory-portal/FactoryRfqDetailPage';
import { FactoryOrdersPage } from '@/pages/factory-portal/FactoryOrdersPage';
import { FactoryOrderDetailPage } from '@/pages/factory-portal/FactoryOrderDetailPage';
import { FactoryWalletPage } from '@/pages/factory-portal/FactoryWalletPage';
import { FactoryBankSettingsPage } from '@/pages/factory-portal/FactoryBankSettingsPage';
import { FactoryInvoicePage } from '@/pages/factory-portal/FactoryInvoicePage';
import { FactoryEditQuotationPage } from '@/pages/factory-portal/FactoryEditQuotationPage';
import { FactoryQuotationsPage } from '@/pages/factory-portal/FactoryQuotationsPage';
import { FactoryShowcaseEditPage } from '@/pages/factory-portal/FactoryShowcaseEditPage';
import { FactoryReviewPage } from '@/pages/factory-portal/FactoryReviewPage';
import { ReviewsBrowsePage } from '@/pages/reviews-browse/ReviewsBrowsePage';

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: Login,
  },
  {
    path: '/register',
    Component: RegisterPage,
  },
  {
    // Legacy factory registration route — redirect to new unified register page
    path: '/register/factory',
    Component: RegisterFactoryPage,
  },
  {
    path: '/',
    Component: PublicDataOutlet,
    children: [
      {
        Component: Layout,
        children: [
          { index: true, Component: RoleRedirectIndex },
          { path: 'explore', loader: () => redirect('/') },
          { path: 'product-detail', Component: ProductDetail },
          { path: 'product-detail/reviews', Component: ReviewsBrowsePage },
          { path: 'promotion-detail', Component: PromotionDetail },
          { path: 'idea-detail', Component: IdeaDetail },
          { path: 'factory-ideas-hub', Component: FactoryIdeasHubPage },
          { path: 'factory-ideas', Component: FactoryIdeas },
          { path: 'factories/:id', Component: FactoryDetail },
          { path: 'factories/:id/reviews', Component: ReviewsBrowsePage },
          { path: 'factories', Component: FactoriesList },
          { path: 'factory-ideas/products/:id', Component: ProductDetail },
          { path: 'factory-ideas/products/:id/reviews', Component: ReviewsBrowsePage },
          { path: 'factory-ideas/promotions/:id', Component: PromotionDetail },
          { path: 'factory-ideas/ideas/:id', Component: IdeaDetail },
          { path: 'orders', Component: RfqAndOrders },
          { path: 'messages', Component: Messages },
          // Pages below handle guest state internally (show empty state after modal dismissal)
          { path: 'notifications', Component: Notifications },
          { path: 'profile/favorites', Component: FavoriteShowcasesPage },
          // create-rfq is intentionally outside AuthGuard — guests can browse the
          // form freely; the submit button handles the auth gate inline.
          { path: 'create-rfq', Component: CreateRfq },
          {
            Component: AuthGuard,
            children: [
              { path: 'rfqs', loader: () => redirect('/rfqs/rfq1'), Component: () => null },
              { path: 'profile', Component: Profile },
              { path: 'profile/edit', Component: EditProfilePage },
              { path: 'profile/change-password', Component: ChangePasswordPage },
              { path: 'profile/transactions', Component: TransactionHistoryPage },
              { path: 'profile/reviews', Component: MyReviewsPage },
              { path: 'quotations/:id', Component: QuoteDetailCustomer },
              { path: 'rfqs/:id', Component: RFQDetail },
              { path: 'orders/:id', Component: OrderDetail },
              {
                path: 'orders/:id/payment',
                loader: ({ params }) => redirect(`/orders/${params.id}`),
              },
              { path: 'messages/:id', Component: ChatRoom },
              { path: 'chat-room', Component: ChatRoom },
              { path: 'chat-room/:id', Component: ChatRoom },
              {
                path: 'factory',
                Component: FactoryRoleGuard,
                children: [
                  {
                    Component: FactoryPortalLayout,
                    children: [
                      { index: true, Component: FactoryDashboardPage },

                      { path: 'info', Component: FactoryInfoPage },
                      { path: 'bank-settings', Component: FactoryBankSettingsPage },
                      { path: 'invoices', Component: FactoryInvoicePage },
                      { path: 'reviews', Component: FactoryReviewPage },
                      { path: 'wallet', Component: FactoryWalletPage },
                      { path: 'profile', Component: Profile },
                      {
                        Component: FactoryVerifiedGuard,
                        children: [
                          { path: 'showcases', Component: FactoryShowcasesPage },
                          { path: 'showcases/new', Component: FactoryShowcaseNewPage },
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
      {
        Component: AuthGuard,
        children: [
          {
            path: 'admin',
            Component: AdminLayout,
            children: [
              { index: true, loader: () => redirect('/admin/dashboard'), Component: () => null },
              { path: 'dashboard', Component: AdminDashboardPage },
              { path: 'factories', Component: AdminFactoriesPage },
              { path: 'factories/:id', Component: AdminFactoryDetailPage },
              { path: 'customers', Component: AdminCustomersPage },
              { path: 'customers/:id', Component: AdminCustomerDetailPage },
              { path: 'rfqs', Component: AdminRFQsPage },
              { path: 'orders', Component: AdminOrdersPage },
              { path: 'orders/:id', Component: AdminOrderDetailPage },
              { path: 'config', Component: AdminConfigPage },
              { path: 'commission', Component: AdminCommissionPage },
              { path: 'withdrawals', Component: AdminWithdrawalsPage },
              { path: 'commission-config', Component: CommissionConfig },
              { path: 'category-images', Component: AdminCategoryImagesPage },
            ],
          },
        ],
      },
    ],
  },
]);
