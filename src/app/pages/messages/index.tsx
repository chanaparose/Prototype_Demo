import React from 'react';
import { conversations } from '../../data/mockData';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { MessagesMobile } from './Messages.mobile';
import { MessagesDesktop } from './Messages.desktop';

export function Messages() {
  const isDesktop = useIsDesktop();
  const [searchText, setSearchText] = React.useState('');
  const [selectedId, setSelectedId] = React.useState<string | null>(
    conversations[0]?.id ?? null,
  );

  const filtered = React.useMemo(() => {
    const q = searchText.toLowerCase();
    return conversations.filter(
      (c) =>
        c.factoryName.toLowerCase().includes(q) ||
        c.rfqName.toLowerCase().includes(q),
    );
  }, [searchText]);

  const totalUnread = React.useMemo(
    () => conversations.reduce((s, c) => s + c.unread, 0),
    [],
  );

  if (isDesktop) {
    return (
      <MessagesDesktop
        searchText={searchText}
        setSearchText={setSearchText}
        filtered={filtered}
        totalUnread={totalUnread}
        selectedId={selectedId}
        setSelectedId={(id) => setSelectedId(id)}
      />
    );
  }

  return (
    <MessagesMobile
      searchText={searchText}
      setSearchText={setSearchText}
      filtered={filtered}
      totalUnread={totalUnread}
    />
  );
}

