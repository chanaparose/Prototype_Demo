import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { openChatSession } from '../../utils/openChatSession';
import { getCurrentUserId, initialMessageForReference, type ChatReference } from '../../utils/chatContract';

type Props = {
  factoryId: number;
  reference: ChatReference | null;
  label?: string;
  variant?: 'primary' | 'ghost';
  className?: string;
  disabled?: boolean;
};

export function ChatEntryButton({
  factoryId,
  reference,
  label = 'แชทกับโรงงาน',
  variant = 'primary',
  className = '',
  disabled = false,
}: Props) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    if (!isAuthenticated || !user) {
      const redirect = `${window.location.pathname}${window.location.search}`;
      navigate(`/login?redirect=${encodeURIComponent(redirect)}`);
      return;
    }
    const customerUserId = getCurrentUserId(user);
    if (customerUserId == null || !Number.isFinite(factoryId) || factoryId <= 0) return;
    setLoading(true);
    try {
      if (reference) {
        await openChatSession(navigate, user, {
          customerUserId,
          factoryEntityId: factoryId,
          firstMessage: {
            content: initialMessageForReference(reference),
            reference,
          },
        });
      } else {
        await openChatSession(navigate, user, {
          customerUserId,
          factoryEntityId: factoryId,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const base =
    variant === 'primary'
      ? 'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold shadow-md disabled:opacity-60'
      : 'inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 bg-white disabled:opacity-60';

  return (
    <button
      type="button"
      onClick={() => void onClick()}
      disabled={disabled || loading}
      className={`${base} ${className}`}
      style={variant === 'primary' ? { background: '#7A4B94' } : undefined}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <MessageCircle className="w-4 h-4" />
      )}
      {label}
    </button>
  );
}
