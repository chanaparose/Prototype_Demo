import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP = path.join(__dirname, '../src/app');

const API_SYMBOL_TO_MODULE = {
  httpClient: '@/services/api/httpClient',
  ApiHttpError: '@/services/api/httpClient',
  getToken: '@/services/api/tokenManager',
  setToken: '@/services/api/tokenManager',
  removeToken: '@/services/api/tokenManager',
  ApiError: '@/services/api/apiErrorHandler',
  extractErrorMessage: '@/services/api/apiErrorHandler',
  formatApiError: '@/services/api/apiErrorHandler',
  getApiErrorStatus: '@/services/api/apiErrorHandler',
  authApi: '@/services/api/authApi',
  rfqsApi: '@/services/api/rfqApi',
  factoryRfqsApi: '@/services/api/rfqApi',
  quotationsApi: '@/services/api/rfqApi',
  quotationApi: '@/services/api/rfqApi',
  ordersApi: '@/services/api/ordersApi',
  productionUpdatesApi: '@/services/api/ordersApi',
  productionApi: '@/services/api/ordersApi',
  factoriesApi: '@/services/api/factoryApi',
  showcasesApi: '@/services/api/factoryApi',
  mediaApi: '@/services/api/factoryApi',
  frontendApi: '@/services/api/exploreApi',
  promoSlidesApi: '@/services/api/exploreApi',
  FrontendBootstrapResponse: '@/services/api/exploreApi',
  conversationsApi: '@/services/api/chatApi',
  messagesApi: '@/services/api/chatApi',
  notificationsApi: '@/services/api/chatApi',
  categoriesApi: '@/services/api/masterApi',
  masterApi: '@/services/api/masterApi',
  addressesApi: '@/services/api/masterApi',
  profileApi: '@/services/api/userApi',
  walletApi: '@/services/api/userApi',
  favoritesApi: '@/services/api/userApi',
  reviewsApi: '@/services/api/userApi',
  certificatesApi: '@/services/api/userApi',
  transactionsApi: '@/services/api/userApi',
  platformConfigApi: '@/services/api/adminApi',
  adminConfigApi: '@/services/api/adminApi',
  adminFactoryConfigApi: '@/services/api/adminApi',
  adminApi: '@/services/api/adminApi',
  adminCustomerApi: '@/services/api/adminApi',
  adminSettlementApi: '@/services/api/adminApi',
  PlatformConfig: '@/services/api/adminApi',
  AdminDashboardSummary: '@/services/api/adminApi',
  AdminFactoryRow: '@/services/api/adminApi',
  AdminRfqRow: '@/services/api/adminApi',
  AdminOrderRow: '@/services/api/adminApi',
  api: '@/services/api/httpClient',
};

const BARREL_REPLACEMENTS = {
  '@/stores': {
    useAuthStore: '@/stores/useAuthStore',
    useAuth: '@/stores/useAuthStore',
    useDataStore: '@/stores/useDataStore',
    useData: '@/stores/useDataStore',
    AuthState: '@/stores/useAuthStore',
    AuthActions: '@/stores/useAuthStore',
    DataState: '@/stores/useDataStore',
    DataActions: '@/stores/useDataStore',
    __fallback: '@/stores/types',
  },
  '@/shared/ui': {
    FormField: '@/shared/ui/forms/FormField',
    CollapsibleCard: '@/shared/ui/cards/CollapsibleCard',
    SectionCard: '@/shared/ui/cards/SectionCard',
    InfoBox: '@/shared/ui/cards/InfoBox',
    StatusBadge: '@/shared/ui/badges/StatusBadge',
    BaseModal: '@/shared/ui/modals/BaseModal',
    ModalFooter: '@/shared/ui/modals/ModalFooter',
    ModalFooterAccent: '@/shared/ui/modals/ModalFooter',
    ModalFooterLayout: '@/shared/ui/modals/ModalFooter',
    ModalFooterProps: '@/shared/ui/modals/ModalFooter',
    TabNavigation: '@/shared/ui/sections/TabNavigation',
  },
  '@/shared/ui/badges': { StatusBadge: '@/shared/ui/badges/StatusBadge' },
  '@/shared/ui/cards': {
    CollapsibleCard: '@/shared/ui/cards/CollapsibleCard',
    SectionCard: '@/shared/ui/cards/SectionCard',
    InfoBox: '@/shared/ui/cards/InfoBox',
  },
  '@/shared/ui/forms': { FormField: '@/shared/ui/forms/FormField' },
  '@/shared/ui/modals': {
    BaseModal: '@/shared/ui/modals/BaseModal',
    ModalFooter: '@/shared/ui/modals/ModalFooter',
    ModalFooterAccent: '@/shared/ui/modals/ModalFooter',
    ModalFooterLayout: '@/shared/ui/modals/ModalFooter',
    ModalFooterProps: '@/shared/ui/modals/ModalFooter',
  },
  '@/shared/ui/sections': { TabNavigation: '@/shared/ui/sections/TabNavigation' },
  '@/components/shared': { ImageWithFallback: '@/components/shared/ImageWithFallback' },
  '@/components/layout': {
    Layout: '@/components/layout/Layout',
    DesktopSidebar: '@/components/layout/DesktopSidebar',
  },
  '@/components/chat': {
    ChatEntryButton: '@/components/chat/ChatEntryButton',
    MessageBubble: '@/components/chat/MessageBubble',
    rowToRoomMessage: '@/components/chat/MessageBubble',
    RoomMessage: '@/components/chat/MessageBubble',
    ReferenceChip: '@/components/chat/ReferenceChip',
  },
  '@/hooks/ui': {
    useToggle: '@/hooks/ui/useToggle',
    useDisclosure: '@/hooks/ui/useDisclosure',
    useTabs: '@/hooks/ui/useTabs',
    useAccordion: '@/hooks/ui/useAccordion',
    useModal: '@/hooks/ui/useModal',
  },
  '@/hooks/data': {
    useApiCall: '@/hooks/data/useApiCall',
    useFetchData: '@/hooks/data/useFetchData',
    usePaginatedData: '@/hooks/data/usePaginatedData',
    useDebounceSearch: '@/hooks/data/useDebounceSearch',
    useInfiniteScroll: '@/hooks/data/useInfiniteScroll',
  },
  '@/hooks/form': {
    useFormError: '@/hooks/form/useFormError',
    useAsyncFormSubmit: '@/hooks/form/useAsyncFormSubmit',
    useFieldArray: '@/hooks/form/useFieldArray',
  },
  '@/hooks': {
    useToggle: '@/hooks/ui/useToggle',
    useDisclosure: '@/hooks/ui/useDisclosure',
    useTabs: '@/hooks/ui/useTabs',
    useAccordion: '@/hooks/ui/useAccordion',
    useModal: '@/hooks/ui/useModal',
    useApiCall: '@/hooks/data/useApiCall',
    useFetchData: '@/hooks/data/useFetchData',
    usePaginatedData: '@/hooks/data/usePaginatedData',
    useDebounceSearch: '@/hooks/data/useDebounceSearch',
    useInfiniteScroll: '@/hooks/data/useInfiniteScroll',
    useFormError: '@/hooks/form/useFormError',
    useAsyncFormSubmit: '@/hooks/form/useAsyncFormSubmit',
    useFieldArray: '@/hooks/form/useFieldArray',
    useFormModal: '@/hooks/forms/useFormModal',
    useLocalStorage: '@/hooks/useLocalStorage',
    useSessionStorage: '@/hooks/useSessionStorage',
    useAsync: '@/hooks/useAsync',
  },
  '@/types/model': {
    IUser: '@/types/model/index',
    IAuthToken: '@/types/model/index',
    IAuthResponse: '@/types/model/index',
    IPaginatedList: '@/types/model/index',
    IFactory: '@/types/model/index',
    IRFQ: '@/types/model/index',
    IQuotation: '@/types/model/index',
    IOrder: '@/types/model/index',
    ILoadingState: '@/types/model/index',
    IPageState: '@/types/model/index',
  },
  '@/types/api/response': {
    ApiResponse: '@/types/api/response/index',
    PaginatedApiResponse: '@/types/api/response/index',
    ErrorResponse: '@/types/api/response/index',
  },
  '@/services/mapper/response': {
    Mapper: '@/services/mapper/response/index',
    createMapper: '@/services/mapper/response/index',
    createListMapper: '@/services/mapper/response/index',
    createNullableMapper: '@/services/mapper/response/index',
  },
  '@/services/mapper/response/index': {
    Mapper: '@/services/mapper/response/mapperUtils',
    createMapper: '@/services/mapper/response/mapperUtils',
    createListMapper: '@/services/mapper/response/mapperUtils',
    createNullableMapper: '@/services/mapper/response/mapperUtils',
  },
};

// Will rename mapper index content to mapperUtils before delete
function buildTypeSymbolMap() {
  const typesDir = path.join(APP, 'services/api/types');
  const map = {};
  for (const file of fs.readdirSync(typesDir)) {
    if (!file.endsWith('.types.ts')) continue;
    const mod = `@/services/api/types/${file.replace(/\.ts$/, '')}`;
    const content = fs.readFileSync(path.join(typesDir, file), 'utf8');
    const re = /export\s+(?:type|interface|enum|const)\s+(\w+)/g;
    let m;
    while ((m = re.exec(content))) map[m[1]] = mod;
  }
  return map;
}

const TYPE_SYMBOL_MAP = buildTypeSymbolMap();

function collectExportsFromBarrel(barrelPath, acc = {}) {
  const full = path.join(APP, barrelPath.replace(/^@\//, ''));
  const indexFile = path.join(full, 'index.ts');
  if (!fs.existsSync(indexFile)) return acc;
  const content = fs.readFileSync(indexFile, 'utf8');
  const exportFromRe = /export\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
  const exportStarRe = /export\s+\*\s+from\s+['"]([^'"]+)['"]/g;
  let m;
  while ((m = exportFromRe.exec(content))) {
    const from = m[2].replace(/^@\//, '');
    const names = m[1].split(',').map((s) => s.trim());
    for (const part of names) {
      const alias = part.match(/(\w+)\s+as\s+(\w+)/);
      if (alias) {
        acc[alias[2]] = `@/${from}`;
        acc[alias[1]] = `@/${from}`;
      } else if (part.startsWith('type ')) {
        const n = part.replace(/^type\s+/, '').trim();
        acc[n] = `@/${from}`;
      } else if (part) {
          const n = part.split(/\s+/).pop();
          acc[n] = `@/${from}`;
        }
    }
  }
  while ((m = exportStarRe.exec(content))) {
    const from = m[1];
    if (from.includes('/index')) {
      collectExportsFromBarrel(from.replace(/\/index$/, ''), acc);
    } else if (from.startsWith('@/domain/')) {
      const sub = from.replace('@/domain/', '');
      const dir = path.join(APP, 'domain', sub.split('/')[0]);
      for (const f of ['constants.ts', 'status.ts', 'categoryIcons.ts']) {
        const fp = path.join(dir, f);
        if (fs.existsSync(fp)) {
          const c = fs.readFileSync(fp, 'utf8');
          const re = /export\s+(?:const|function|type)\s+(\w+)/g;
          let mm;
          while ((mm = re.exec(c))) acc[mm[1]] = `@/domain/${sub.split('/')[0]}/${f.replace('.ts', '')}`;
        }
      }
    }
  }
  return acc;
}

const FEATURE_BARRELS = [
  'components/features/explore',
  'components/features/factory-profile',
  'components/features/order-detail',
  'components/features/rfq-detail',
  'components/features/rfq-and-orders',
  'components/features/showcase-detail',
  'components/features/create-rfq',
  'components/features/factory-ideas',
  'pages/factory-portal',
  'pages/auth',
  'domain/rfq',
  'domain/order',
  'domain/shared',
  'utils/formatting',
  'utils/constants',
  'utils/validation',
];

for (const rel of FEATURE_BARRELS) {
  const key = `@/${rel}`;
  const built = collectExportsFromBarrel(key, {});
  if (Object.keys(built).length) BARREL_REPLACEMENTS[key] = { ...built, ...BARREL_REPLACEMENTS[key] };
}

// formatting star exports
BARREL_REPLACEMENTS['@/utils/formatting'] = {
  ...Object.fromEntries(
    ['formatCurrency', 'formatTHB', 'formatMoney'].flatMap((n) => [[n, '@/utils/formatting/formatCurrency']])
  ),
};
const fc = fs.readFileSync(path.join(APP, 'utils/formatting/formatCurrency.ts'), 'utf8');
const fd = fs.readFileSync(path.join(APP, 'utils/formatting/formatDate.ts'), 'utf8');
for (const m of fc.matchAll(/export\s+(?:function|const)\s+(\w+)/g)) {
  BARREL_REPLACEMENTS['@/utils/formatting'][m[1]] = '@/utils/formatting/formatCurrency';
}
for (const m of fd.matchAll(/export\s+(?:function|const)\s+(\w+)/g)) {
  BARREL_REPLACEMENTS['@/utils/formatting'][m[1]] = '@/utils/formatting/formatDate';
}

const vc = fs.readFileSync(path.join(APP, 'utils/constants/contentTypes.ts'), 'utf8');
BARREL_REPLACEMENTS['@/utils/constants'] = {};
for (const m of vc.matchAll(/export\s+(?:const|type|function)\s+(\w+)/g)) {
  BARREL_REPLACEMENTS['@/utils/constants'][m[1]] = '@/utils/constants/contentTypes';
}
for (const f of ['schemas.ts', 'validators.ts']) {
  const c = fs.readFileSync(path.join(APP, 'utils/validation', f), 'utf8');
  BARREL_REPLACEMENTS['@/utils/validation'] = BARREL_REPLACEMENTS['@/utils/validation'] || {};
  for (const m of c.matchAll(/export\s+(?:const|function|type)\s+(\w+)/g)) {
    BARREL_REPLACEMENTS['@/utils/validation'][m[1]] = `@/utils/validation/${f.replace('.ts', '')}`;
  }
}

function parseImportSpecifiers(spec) {
  const items = [];
  const parts = spec.split(',').map((s) => s.trim()).filter(Boolean);
  for (const part of parts) {
    const typePrefix = part.startsWith('type ');
    const p = typePrefix ? part.slice(5).trim() : part;
    const def = p.match(/^(\w+)\s+as\s+(\w+)$/);
    if (def) items.push({ imported: def[1], local: def[2], typeOnly: typePrefix });
    else items.push({ imported: p, local: p, typeOnly: typePrefix });
  }
  return items;
}

function resolveSymbol(barrel, symbol) {
  if (barrel === '@/services/api') return API_SYMBOL_TO_MODULE[symbol];
  if (barrel === '@/services/api/types' || barrel === '@/services/api/index') return TYPE_SYMBOL_MAP[symbol];
  const map = BARREL_REPLACEMENTS[barrel];
  if (!map) return undefined;
  if (map[symbol]) return map[symbol];
  if (map.__fallback) return map.__fallback;
  return undefined;
}

function rewriteFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  const importRe =
    /import\s+(type\s+)?\{([^}]+)\}\s+from\s+['"](@\/[^'"]+)['"]\s*;?/g;

  content = content.replace(importRe, (full, typeKw, spec, barrel) => {
    const barrels = [
      '@/services/api',
      '@/services/api/types',
      '@/services/api/index',
      ...Object.keys(BARREL_REPLACEMENTS),
    ];
    if (!barrels.includes(barrel)) return full;
    const typeOnly = Boolean(typeKw);
    const items = parseImportSpecifiers(spec);
    const byModule = new Map();
    for (const item of items) {
      const mod = resolveSymbol(barrel, item.imported);
      if (!mod) {
        console.warn(`UNRESOLVED ${barrel} :: ${item.imported} in ${filePath}`);
        return full;
      }
      const key = mod;
      if (!byModule.has(key)) byModule.set(key, []);
      byModule.get(key).push(item);
    }
    const lines = [];
    for (const [mod, specs] of byModule) {
      const parts = specs.map((s) => {
        const pref = s.typeOnly || typeOnly ? 'type ' : '';
        if (s.imported === s.local) return `${pref}${s.imported}`;
        return `${pref}${s.imported} as ${s.local}`;
      });
      lines.push(`import { ${parts.join(', ')} } from '${mod}';`);
    }
    changed = true;
    return lines.join('\n');
  });

  // export * from barrels in non-index files we skip; handle api.ts separately
  if (changed) fs.writeFileSync(filePath, content);
  return changed;
}

function walk(dir) {
  let updated = 0;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) updated += walk(p);
    else if (/\.(ts|tsx)$/.test(ent.name) && !ent.name.endsWith('.d.ts')) {
      if (rewriteFile(p)) updated++;
    }
  }
  return updated;
}

const updated = walk(APP);
console.log('Files updated:', updated);
