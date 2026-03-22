import React from 'react';
import { useData } from '../../contexts/DataContext';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { MessagesMobile } from './Messages.mobile';
import { MessagesDesktop } from './Messages.desktop';

export function Messages() {
  const data = useData();
  const isDesktop = useIsDesktop();
  const [searchText, setSearchText] = React.useState('');
  const [selectedId, setSelectedId] = React.useState<string | null>(
    data.conversations[0]?.id ?? null,
  );

  const filtered = React.useMemo(() => {
    const q = searchText.toLowerCase();
    return data.conversations.filter(
      (c) =>
        c.factoryName.toLowerCase().includes(q) ||
        c.rfqName.toLowerCase().includes(q),
    );
  }, [searchText, data.conversations]);

  const totalUnread = React.useMemo(
    () => data.conversations.reduce((s, c) => s + c.unread, 0),
    [data.conversations],
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

