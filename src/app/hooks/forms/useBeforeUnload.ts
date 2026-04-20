import { useEffect } from 'react';

/** Blocks tab close/reload when predicate is true. */
export function useBeforeUnload(when: boolean, message = 'มีการเปลี่ยนแปลงที่ยังไม่บันทึก') {
  useEffect(() => {
    if (!when) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [when, message]);
}
