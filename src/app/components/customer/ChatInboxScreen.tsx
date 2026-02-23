import React, { useState } from 'react';
import { mockChatConversations, mockFactories } from '../../data/mockData';
import { ChatInboxListScreen } from './ChatInboxListScreen';
import { ChatRoomScreen } from './ChatRoomScreen';

interface ChatInboxScreenProps {
  onBack: () => void;
}

function getFactory(factoryId: string) {
  return mockFactories.find((f) => f.id === factoryId);
}

export function ChatInboxScreen({ onBack }: ChatInboxScreenProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = selectedId ? mockChatConversations.find((c) => c.id === selectedId) : null;
  const factory = selected ? getFactory(selected.factoryId) : null;

  if (selected && factory) {
    return (
      <ChatRoomScreen
        onBack={() => setSelectedId(null)}
        conversation={selected}
        factory={factory}
      />
    );
  }

  return (
    <ChatInboxListScreen
      onBack={onBack}
      onSelectConversation={(id) => setSelectedId(id)}
    />
  );
}
