export function getFactoryIdeasHubPath(hubScope?: 'PD' | 'MT') {
  if (hubScope === 'PD' || hubScope === 'MT') {
    return `/factory-ideas-hub?scope=${hubScope}`;
  }
  return '/factory-ideas-hub';
}

export function isFromFactoryIdeasHub(searchParams: URLSearchParams) {
  return searchParams.has('hub_id') || searchParams.has('hub_scope');
}

/** Active state for customer nav links that include factory-ideas hub + listing routes. */
export function isCustomerNavLinkActive(pathname: string, linkPath: string) {
  if (linkPath === '/') return pathname === '/';
  if (linkPath === '/factory-ideas-hub') {
    return pathname.startsWith('/factory-ideas-hub') || pathname.startsWith('/factory-ideas');
  }
  return pathname === linkPath || pathname.startsWith(`${linkPath}/`);
}
