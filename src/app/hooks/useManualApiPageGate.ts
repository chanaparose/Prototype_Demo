import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';

// Dev เท่านั้น: ?manualApi=1 บน URL → ยังไม่ยิง API ของหน้านั้นจนกว่าจะกดปุ่ม (ดู Network ง่าย)
export function useManualApiPageGate() {
  const [searchParams] = useSearchParams();
  const manualApi = import.meta.env.DEV && searchParams.get('manualApi') === '1';
  const [pageApisReady, setPageApisReady] = useState(!manualApi);

  const showGate = useMemo(() => manualApi && !pageApisReady, [manualApi, pageApisReady]);

  return { manualApi, pageApisReady, setPageApisReady, showGate };
}
