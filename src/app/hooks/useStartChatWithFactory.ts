import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { runAsyncAction } from '@/utils/asyncAction';
import { useAuth } from '@/stores/useAuthStore';
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

      inFlightRef.current = true;
      const result = await runAsyncAction(
        async () => {
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
          return 'ok' as const;
        },
        {
          onStart: () => setStarting(true),
          onSettled: () => {
            inFlightRef.current = false;
            setStarting(false);
          },
          onError: () => toast.error('เริ่มแชทไม่สำเร็จ กรุณาลองใหม่'),
        },
      );
      return result ?? null;
    },
    [isAuthenticated, user, navigate, starting],
  );

  return { startChat, starting };
}
