import { useState } from 'react';
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
      return <ChatInboxScreen onBack={() => setShowChatInbox(false)} />;
    }
    switch (activeTab) {
      case 'home':
        return <HomeScreen onOpenChat={() => setShowChatInbox(true)} />;
      case 'order':
        return <OrderScreen />;
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

  return (
    <div className="min-h-screen bg-gray-50">
      {userType === 'customer' ? renderCustomerScreen() : renderFactoryScreen()}
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
