import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { conversationsApi } from '../services/api';

export type ChatReference = {
  type: 'PD' | 'PM' | 'ID' | 'FT';
  id: string;
  title?: string;
};

export function useStartChatWithFactory() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);
  const inFlightRef = useRef(false);

  const startChat = useCallback(
    async (factoryUserId: number | string, reference?: ChatReference) => {
      if (!isAuthenticated || !user) {
        const redirect = `${window.location.pathname}${window.location.search}`;
        navigate(`/login?redirect=${encodeURIComponent(redirect)}`);
        return null;
      }
      if (starting || inFlightRef.current) return null;

      const myUserId = Number(user.id);
      const factoryIdNum = Number(factoryUserId);
      if (!Number.isFinite(myUserId) || myUserId <= 0 || !Number.isFinite(factoryIdNum) || factoryIdNum <= 0) {
        return null;
      }

      setStarting(true);
      inFlightRef.current = true;
      try {
        const convsRaw = await conversationsApi.list();
        const convs = (Array.isArray(convsRaw) ? convsRaw : []) as Record<string, unknown>[];

        const existing = convs.find((c) => {
          const cFactoryId = String(c.factory_id ?? c.factoryId ?? '').trim();
          const cCustomerId = String(c.customer_id ?? c.customerId ?? '').trim();
          return cFactoryId === String(factoryIdNum) && cCustomerId === String(myUserId);
        });

        let convId = '';
        if (existing) {
          convId = String(existing.conversation_id ?? existing.conv_id ?? existing.id ?? '').trim();
        } else {
          const res = (await conversationsApi.create({
            customer_id: myUserId,
            factory_id: factoryIdNum,
          })) as Record<string, unknown>;
          convId = String(res.conversation_id ?? res.conv_id ?? res.id ?? '').trim();
        }

        if (!convId) throw new Error('ไม่พบรหัสการสนทนา');

        navigate(`/messages/${convId}`, { state: { reference } });
        return convId;
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
