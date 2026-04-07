import React from 'react';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { MessagesMobile } from './Messages.mobile';
import { MessagesDesktop } from './Messages.desktop';
import { useConversations } from './useConversations';
import type { UiConversation } from './types';

export function Messages() {
  const isDesktop = useIsDesktop();
  const { items, loading, error, reload } = useConversations();
  const [searchText, setSearchText] = React.useState('');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!selectedId && items.length > 0) setSelectedId(items[0].id);
  }, [items, selectedId]);

  React.useEffect(() => {
    if (selectedId && items.length > 0 && !items.some((c) => c.id === selectedId)) {
      setSelectedId(items[0]?.id ?? null);
    }
  }, [items, selectedId]);

  const filtered = React.useMemo(() => {
    const q = searchText.toLowerCase().trim();
    if (!q) return items;
    return items.filter(
      (c) =>
        c.factoryName.toLowerCase().includes(q) ||
        c.rfqName.toLowerCase().includes(q),
    );
  }, [searchText, items]);

  const totalUnread = React.useMemo(
    () => items.reduce((s, c) => s + c.unread, 0),
    [items],
  );

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
      <MessagesDesktop
        {...commonProps}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        selectedConversation={selectedConversation}
      />
    );
  }

  return <MessagesMobile {...commonProps} />;
}
