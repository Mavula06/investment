import { useState, useEffect } from 'react';
import { useAuth, AuthProvider } from './hooks/useAuth';
import { supabase } from './lib/supabase';
import { Profile, InvestmentPlan, Investment, Transaction, Notification } from './lib/supabase';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import InvestmentPlans from './pages/InvestmentPlans';
import MyInvestments from './pages/MyInvestments';
import Transactions from './pages/Transactions';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import Auth from './pages/Auth';

type View = 'dashboard' | 'plans' | 'investments' | 'transactions' | 'settings' | 'admin';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [investmentPlans, setInvestmentPlans] = useState<InvestmentPlan[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;
    setDataLoading(true);

    try {
      const [plansRes, investmentsRes, transactionsRes] = await Promise.all([
        supabase.from('investment_plans').select('*').eq('is_active', true).order('min_amount', { ascending: true }),
        supabase.from('investments').select('*, plan:investment_plans(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      ]);

      if (plansRes.data) setInvestmentPlans(plansRes.data);
      if (investmentsRes.data) setInvestments(investmentsRes.data);
      if (transactionsRes.data) setTransactions(transactionsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const refreshData = () => {
    fetchUserData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Auth onSuccess={refreshData} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            profile={profile}
            investments={investments}
            transactions={transactions}
            investmentPlans={investmentPlans}
            onViewPlans={() => setCurrentView('plans')}
            onViewInvestments={() => setCurrentView('investments')}
            onViewTransactions={() => setCurrentView('transactions')}
          />
        );
      case 'plans':
        return <InvestmentPlans plans={investmentPlans} profile={profile} onSuccess={refreshData} />;
      case 'investments':
        return <MyInvestments investments={investments} />;
      case 'transactions':
        return <Transactions transactions={transactions} profile={profile} onSuccess={refreshData} />;
      case 'settings':
        return <Settings profile={profile} />;
      case 'admin':
        return <Admin profile={profile} />;
      default:
        return null;
    }
  };

  return (
    <Layout
      currentView={currentView}
      onViewChange={setCurrentView}
      profile={profile}
      notifications={notifications}
    >
      {renderView()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
