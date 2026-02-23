import { useState } from 'react';
import { motion } from 'motion/react';
import { LoginScreen } from './components/LoginScreen';
import { BottomNav } from './components/BottomNav';

// Customer Screens
import { HomeScreen } from './components/customer/HomeScreen';
import { ChatInboxScreen } from './components/customer/ChatInboxScreen';
import { OrderScreen } from './components/customer/OrderScreen';
import { ReqHisScreen } from './components/customer/ReqHisScreen';
import { TransactionScreen } from './components/customer/TransactionScreen';
import { ProfileScreen as CustomerProfile } from './components/customer/ProfileScreen';

// Factory Screens
import { DashboardScreen } from './components/factory/DashboardScreen';
import { MyJobsScreen } from './components/factory/MyJobsScreen';
import { QuotesScreen } from './components/factory/QuotesScreen';
import { WalletScreen } from './components/factory/WalletScreen';
import { ProfileScreen as FactoryProfile } from './components/factory/ProfileScreen';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState<'customer' | 'factory'>('customer');
  const [activeTab, setActiveTab] = useState<string>('home');
  const [showChatInbox, setShowChatInbox] = useState(false);
  const [initialChatId, setInitialChatId] = useState<string | null>(null);

  const handleLogin = (type: 'customer' | 'factory') => {
    setUserType(type);
    setIsLoggedIn(true);
    setActiveTab(type === 'customer' ? 'home' : 'dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserType('customer');
    setActiveTab('home');
  };

  const handleSwitchMode = () => {
    const newUserType = userType === 'customer' ? 'factory' : 'customer';
    setUserType(newUserType);
    setActiveTab(newUserType === 'customer' ? 'home' : 'dashboard');
  };

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const renderCustomerScreen = () => {
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
        return <CustomerProfile onSwitchMode={handleSwitchMode} onLogout={handleLogout} />;
      default:
        return <HomeScreen />;
    }
  };

  const renderFactoryScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'my-jobs':
        return <MyJobsScreen />;
      case 'quotes':
        return <QuotesScreen />;
      case 'wallet':
        return <WalletScreen />;
      case 'profile':
        return <FactoryProfile onSwitchMode={handleSwitchMode} onLogout={handleLogout} />;
      default:
        return <DashboardScreen />;
    }
  };

  const screenKey = userType === 'customer' && showChatInbox ? 'chat-inbox' : activeTab;

  return (
    <div className="min-h-screen bg-gray-50">
      <motion.div key={screenKey} className="relative min-h-screen">
        {/* ชั้นสีเต็มขอบก่อน (แบบ Line Man) - แสดงทันทีตอนเปลี่ยนหน้า */}
        <div className="absolute inset-0 bg-gray-50" />
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative z-10 min-h-screen origin-top"
        >
          {userType === 'customer' ? renderCustomerScreen() : renderFactoryScreen()}
        </motion.div>
      </motion.div>
      {userType === 'customer' && !showChatInbox && (
        <BottomNav
          userType={userType}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}
    </div>
  );
}
