export function isDebugFactoryIdeasCategory(): boolean {
  try {
    return (
      typeof localStorage !== 'undefined' &&
      localStorage.getItem('debugFactoryIdeasCategory') === '1'
    );
  } catch {
    return false;
  }
}

export function logFactoryIdeasCategory(tag: string, payload: unknown): void {
  if (!isDebugFactoryIdeasCategory()) return;
  const log = globalThis.console?.log;
  if (typeof log === 'function') {
    log(`%c[FactoryIdeas][${tag}]`, 'color:#7c3aed;font-weight:bold', payload);
  }
}
