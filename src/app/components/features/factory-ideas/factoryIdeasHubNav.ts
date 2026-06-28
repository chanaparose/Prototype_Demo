export function getFactoryIdeasHubPath(hubScope?: 'PD' | 'MT') {
  if (hubScope === 'PD' || hubScope === 'MT') {
    return `/factory-ideas-hub?scope=${hubScope}`;
  }
  return '/factory-ideas-hub';
}

type HubNavRow = { hub_id: number; scope?: string | null };

/** อัปเดต hub_scope และสลับ hub ให้ตรง scope (ล้าง category ที่เลือกไว้) */
export function applyFactoryIdeasScopeChange(
  params: URLSearchParams,
  scope: 'PD' | 'MT',
  allHubs: HubNavRow[],
) {
  params.set('hub_scope', scope);
  const currentHubId = Number(params.get('hub_id')) || undefined;
  const currentHub = allHubs.find((h) => h.hub_id === currentHubId);
  if (!currentHub || currentHub.scope !== scope) {
    const nextHub = allHubs.find((h) => h.scope === scope);
    if (nextHub) params.set('hub_id', String(nextHub.hub_id));
    else params.delete('hub_id');
  }
  params.delete('category_id');
  params.delete('sub_category_id');
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
