import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useResponsiveRender } from '@/hooks/useResponsiveRender';
import { MessagesMobile } from '@/pages/messages/Messages.mobile';
import { MessagesDesktop } from '@/pages/messages/Messages.desktop';
import { useConversations } from '@/pages/messages/useConversations';
import { sortConversations } from '@/pages/messages/selectors';
import { setConversationReadInCache } from '@/domain/chat/chatCache';
import type { UiConversation } from '@/pages/messages/types';

export function Messages() {
  const { render } = useResponsiveRender();
  const { items, loading, error, reload } = useConversations();
  const [searchText, setSearchText] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Optimistically zero unread badge as soon as user opens a conversation.
  const handleSelectId = useCallback((id: string) => {
    setConversationReadInCache(id);
    setSelectedId(id);
  }, []);

  useEffect(() => {
    if (!selectedId && items.length > 0) handleSelectId(items[0].id);
  }, [items, selectedId, handleSelectId]);

  useEffect(() => {
    if (selectedId && items.length > 0 && !items.some((c) => c.id === selectedId)) {
      handleSelectId(items[0]?.id ?? '');
    }
  }, [items, selectedId, handleSelectId]);

  const filtered = useMemo(() => {
    const q = searchText.toLowerCase().trim();
    const list = !q
      ? items
      : items.filter(
          (c) => c.view.title.toLowerCase().includes(q) || c.rfqName.toLowerCase().includes(q),
        );
    return sortConversations(list);
  }, [searchText, items]);

  const totalUnread = useMemo(() => items.reduce((s, c) => s + c.unread, 0), [items]);

  const selectedConversation = useMemo((): UiConversation | null => {
    if (!selectedId) return null;
    return items.find((c) => c.id === selectedId) ?? null;
  }, [items, selectedId]);

  const commonProps = {
    searchText,
    setSearchText,
    filtered,
    totalUnread,
    loading,
    error,
    onReload: reload,
  };

  return render(
    <MessagesMobile {...commonProps} />,
    <MessagesDesktop
      {...commonProps}
      selectedId={selectedId}
      setSelectedId={handleSelectId}
      selectedConversation={selectedConversation}
    />
  );
}
