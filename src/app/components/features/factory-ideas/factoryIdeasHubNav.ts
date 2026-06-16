export function getFactoryIdeasHubPath(hubScope?: 'PD' | 'MT') {
  if (hubScope === 'PD' || hubScope === 'MT') {
    return `/factory-ideas-hub?scope=${hubScope}`;
  }
  return '/factory-ideas-hub';
}

export function isFromFactoryIdeasHub(searchParams: URLSearchParams) {
  return searchParams.has('hub_id') || searchParams.has('hub_scope');
}
