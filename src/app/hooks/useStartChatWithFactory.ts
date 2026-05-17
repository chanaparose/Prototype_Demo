import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '@/stores';
import { openChatSession } from '@/utils/openChatSession';
import { getCurrentUserId, type ChatReference } from '@/utils/chatContract';

export type { ChatReference };

export function useStartChatWithFactory() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);
  const inFlightRef = useRef(false);

  const startChat = useCallback(
    async (factoryEntityId: number | string, reference?: ChatReference | null) => {
      if (!isAuthenticated || !user) {
        const redirect = `${window.location.pathname}${window.location.search}`;
        navigate(`/login?redirect=${encodeURIComponent(redirect)}`);
        return null;
      }
      if (starting || inFlightRef.current) return null;

      const myUserId = getCurrentUserId(user);
      const factoryIdNum = Number(factoryEntityId);
      if (myUserId == null || !Number.isFinite(factoryIdNum) || factoryIdNum <= 0) {
        return null;
      }

      setStarting(true);
      inFlightRef.current = true;
      try {
        const ref = reference ?? null;
        if (ref) {
          await openChatSession(navigate, user, {
            customerUserId: myUserId,
            factoryEntityId: factoryIdNum,
            pendingReference: ref,
          });
        } else {
          await openChatSession(navigate, user, {
            customerUserId: myUserId,
            factoryEntityId: factoryIdNum,
          });
        }
        return 'ok';
      } catch (err) {
        console.error('[startChat]', err);
        toast.error('เริ่มแชทไม่สำเร็จ กรุณาลองใหม่');
        return null;
      } finally {
        inFlightRef.current = false;
        setStarting(false);
      }
    },
    [isAuthenticated, user, navigate, starting],
  );

  return { startChat, starting };
}
