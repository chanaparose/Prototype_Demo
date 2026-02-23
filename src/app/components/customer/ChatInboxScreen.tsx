import React, { useState } from 'react';
import { mockChatConversations, mockFactories } from '../../data/mockData';
import { ChatInboxListScreen } from './ChatInboxListScreen';
import { ChatRoomScreen } from './ChatRoomScreen';

interface ChatInboxScreenProps {
  onBack: () => void;
  /** เปิดห้องแชทนี้ทันที (จาก OrderScreen กด "แชทกับโรงงาน") */
  initialConversationId?: string | null;
}

function getFactory(factoryId: string) {
  return mockFactories.find((f) => f.id === factoryId);
}

export function ChatInboxScreen({ onBack, initialConversationId = null }: ChatInboxScreenProps) {
  const [selectedId, setSelectedId] = useState<string | null>(initialConversationId ?? null);

  const selected = selectedId ? mockChatConversations.find((c) => c.id === selectedId) : null;
  const factory = selected ? getFactory(selected.factoryId) : null;

  if (selected && factory) {
    const cameFromOrder = selectedId === initialConversationId;
    return (
      <ChatRoomScreen
        onBack={cameFromOrder ? onBack : () => setSelectedId(null)}
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
