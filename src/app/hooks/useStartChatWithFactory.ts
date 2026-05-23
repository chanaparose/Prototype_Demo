import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useAppMutation } from '@/hooks/useAppMutation';
import { useAuth } from '@/stores/useAuthStore';
import { openChatSession } from '@/utils/openChatSession';
import { getCurrentUserId, type ChatReference } from '@/utils/chatContract';

export type { ChatReference };

type StartChatVariables = {
  factoryEntityId: number;
  reference: ChatReference | null;
};

export function useStartChatWithFactory() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const inFlightRef = useRef(false);

  const startChatMutation = useAppMutation({
    mutationFn: async ({ factoryEntityId, reference }: StartChatVariables) => {
      const myUserId = getCurrentUserId(user);
      if (myUserId == null) throw new Error('ไม่พบข้อมูลผู้ใช้');
      if (reference) {
        await openChatSession(navigate, user!, {
          customerUserId: myUserId,
          factoryEntityId,
          pendingReference: reference,
        });
      } else {
        await openChatSession(navigate, user!, {
          customerUserId: myUserId,
          factoryEntityId,
        });
      }
      return 'ok' as const;
    },
    onMutate: () => {
      inFlightRef.current = true;
    },
    onSettled: () => {
      inFlightRef.current = false;
    },
    onErrorMessage: () => toast.error('เริ่มแชทไม่สำเร็จ กรุณาลองใหม่'),
  });

  const startChat = useCallback(
    async (factoryEntityId: number | string, reference?: ChatReference | null) => {
      if (!isAuthenticated || !user) {
        const redirect = `${window.location.pathname}${window.location.search}`;
        navigate(`/login?redirect=${encodeURIComponent(redirect)}`);
        return null;
      }
      if (startChatMutation.isPending || inFlightRef.current) return null;

      const myUserId = getCurrentUserId(user);
      const factoryIdNum = Number(factoryEntityId);
      if (myUserId == null || !Number.isFinite(factoryIdNum) || factoryIdNum <= 0) {
        return null;
      }

      try {
        return await startChatMutation.mutateAsync({
          factoryEntityId: factoryIdNum,
          reference: reference ?? null,
        });
      } catch {
        return null;
      }
    },
    [isAuthenticated, user, navigate, startChatMutation],
  );

  return { startChat, starting: startChatMutation.isPending };
}
