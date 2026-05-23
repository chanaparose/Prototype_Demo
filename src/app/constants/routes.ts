export const APP_ROUTES = {
  login: '/login',
  orders: '/orders',
  profile: '/profile',
  walletTopup: '/wallet/topup',
  factoryShowcasesNew: '/factory/showcases/new',
} as const;

export function factoryShowcaseEditRoute(id: string | number) {
  return `/factory/showcases/${id}/edit`;
}

export function factoryShowcaseNewRoute(type?: string) {
  return type ? `${APP_ROUTES.factoryShowcasesNew}?type=${type}` : APP_ROUTES.factoryShowcasesNew;
}
