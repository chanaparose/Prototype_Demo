import React from 'react';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { MessagesMobile } from '@/pages/messages/Messages.mobile';
import { MessagesDesktop } from '@/pages/messages/Messages.desktop';
import { useConversations } from '@/pages/messages/useConversations';
import { sortConversations } from '@/pages/messages/selectors';
import { setConversationReadInCache } from '@/domain/chat/chatCache';
import type { UiConversation } from '@/pages/messages/types';

export function Messages() {
  const isDesktop = useIsDesktop();
  const { items, loading, error, reload } = useConversations();
  const [searchText, setSearchText] = React.useState('');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  // Optimistically zero unread badge as soon as user opens a conversation.
  const handleSelectId = React.useCallback((id: string) => {
    setConversationReadInCache(id);
    setSelectedId(id);
  }, []);

  // Desktop split view: pre-select first thread (marks read in cache). Mobile list only — no auto-select.
  React.useEffect(() => {
    if (!isDesktop) return;
    if (!selectedId && items.length > 0) handleSelectId(items[0].id);
  }, [isDesktop, items, selectedId, handleSelectId]);

  React.useEffect(() => {
    if (selectedId && items.length > 0 && !items.some((c) => c.id === selectedId)) {
      handleSelectId(items[0]?.id ?? '');
    }
  }, [items, selectedId, handleSelectId]);

  const filtered = React.useMemo(() => {
    const q = searchText.toLowerCase().trim();
    const list = !q
      ? items
      : items.filter(
          (c) => c.view.title.toLowerCase().includes(q) || c.rfqName.toLowerCase().includes(q),
        );
    return sortConversations(list);
  }, [searchText, items]);

  const totalUnread = React.useMemo(() => items.reduce((s, c) => s + c.unread, 0), [items]);

  const selectedConversation = React.useMemo((): UiConversation | null => {
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

  if (isDesktop) {
    return (
      <div className='min-h-0 flex-1 bg-white'>
        <MessagesDesktop
          {...commonProps}
          selectedId={selectedId}
          setSelectedId={handleSelectId}
          selectedConversation={selectedConversation}
        />
      </div>
    );
  }

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <MessagesMobile {...commonProps} />
    </div>
  );
}
