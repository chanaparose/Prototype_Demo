import { useState } from 'react';
import { motion } from 'motion/react';
import { BottomNav } from './components/BottomNav';

// Customer Screens
import { HomeScreen } from './components/customer/HomeScreen';
import { ChatInboxScreen } from './components/customer/ChatInboxScreen';
import { OrderScreen } from './components/customer/OrderScreen';
import { ReqHisScreen } from './components/customer/ReqHisScreen';
import { TransactionScreen } from './components/customer/TransactionScreen';
import { ProfileScreen as CustomerProfile } from './components/customer/ProfileScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [showChatInbox, setShowChatInbox] = useState(false);
  const [initialChatId, setInitialChatId] = useState<string | null>(null);

  const handleLogout = () => {
    setActiveTab('home');
  };

  const renderScreen = () => {
    if (showChatInbox) {
      return (
        <ChatInboxScreen
          key={initialChatId ?? 'inbox'}
          initialConversationId={initialChatId}
          onBack={() => {
            setShowChatInbox(false);
            setInitialChatId(null);
          }}
        />
      );
    }
    switch (activeTab) {
      case 'home':
        return <HomeScreen onOpenChat={() => { setInitialChatId(null); setShowChatInbox(true); }} />;
      case 'order':
        return (
          <OrderScreen
            onOpenChat={(conversationId) => {
              setInitialChatId(conversationId ?? null);
              setShowChatInbox(true);
            }}
          />
        );
      case 'req-his':
        return <ReqHisScreen />;
      case 'transaction':
        return <TransactionScreen />;
      case 'profile':
        return <CustomerProfile onLogout={handleLogout} />;
      default:
        return <HomeScreen />;
    }
  };

  const screenKey = showChatInbox ? 'chat-inbox' : activeTab;

  return (
    <div className="min-h-screen bg-gray-50">
      <motion.div key={screenKey} className="relative min-h-screen">
        <div className="absolute inset-0 bg-gray-50" />
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative z-10 min-h-screen origin-top"
        >
          {renderScreen()}
        </motion.div>
      </motion.div>
      {!showChatInbox && (
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      )}
    </div>
  );
}
