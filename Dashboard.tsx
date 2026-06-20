import { Profile, Investment, Transaction, InvestmentPlan } from '../lib/supabase';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Target,
  BarChart3,
  Sparkles,
} from 'lucide-react';

interface DashboardProps {
  profile: Profile;
  investments: Investment[];
  transactions: Transaction[];
  investmentPlans: InvestmentPlan[];
  onViewPlans: () => void;
  onViewInvestments: () => void;
  onViewTransactions: () => void;
}

export default function Dashboard({
  profile,
  investments,
  transactions,
  investmentPlans,
  onViewPlans,
  onViewInvestments,
}: DashboardProps) {
  const activeInvestments = investments.filter(inv => inv.status === 'active');
  const totalInvested = activeInvestments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalExpectedProfit = activeInvestments.reduce((sum, inv) => sum + inv.expected_profit, 0);
  const pendingTransactions = transactions.filter(t => t.status === 'pending').length;
  const profitChange = profile.total_invested > 0
    ? ((profile.total_profit / profile.total_invested) * 100).toFixed(1)
    : '0.0';

  const quickStats = [
    {
      label: 'Total Balance',
      value: profile.balance,
      icon: Wallet,
      change: null,
      color: 'gold',
    },
    {
      label: 'Total Invested',
      value: totalInvested,
      icon: Target,
      change: activeInvestments.length > 0 ? `${activeInvestments.length} active` : null,
      color: 'blue',
    },
    {
      label: 'Expected Profit',
      value: totalExpectedProfit,
      icon: TrendingUp,
      change: 'pending',
      color: 'emerald',
    },
    {
      label: 'Total Profit',
      value: profile.total_profit,
      icon: DollarSign,
      change: `+${profitChange}%`,
      color: 'emerald',
    },
  ];

  const recentTransactions = transactions.slice(0, 5);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold-500/10 via-transparent to-transparent rounded-3xl"></div>
        <div className="relative p-6 lg:p-8 rounded-3xl bg-dark-800 border border-dark-600">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <p className="text-gray-400 mb-1">{getGreeting()},</p>
              <h1 className="font-display text-3xl lg:text-4xl font-bold text-white mb-2">
                {profile.full_name?.split(' ')[0] || 'Investor'}
              </h1>
              <p className="text-gray-500">Your portfolio is performing well. Keep growing!</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onViewPlans}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Start Investing
              </button>
              <button className="btn-secondary flex items-center justify-center gap-2">
                <BarChart3 className="w-5 h-5" />
                View Reports
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          const isPositive = stat.change?.startsWith('+');
          const colorClasses = {
            gold: 'from-gold-500/20 to-gold-500/5 border-gold-500/30 text-gold-500',
            blue: 'from-accent-blue/20 to-accent-blue/5 border-accent-blue/30 text-accent-blue',
            emerald: 'from-accent-emerald/20 to-accent-emerald/5 border-accent-emerald/30 text-accent-emerald',
            purple: 'from-accent-purple/20 to-accent-purple/5 border-accent-purple/30 text-accent-purple',
          }[stat.color] || 'from-gold-500/20 to-gold-500/5 border-gold-500/30 text-gold-500';

          return (
            <div
              key={stat.label}
              className={`stat-card bg-gradient-to-br ${colorClasses} animate-fade-in`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses}`}>
                  <Icon className="w-5 h-5" />
                </div>
                {stat.change && (
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      isPositive || stat.change === 'pending' || !stat.change.startsWith('-')
                        ? 'bg-accent-emerald/20 text-accent-emerald'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {stat.change}
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-sm mb-1">{stat.label}</p>
              <p className="text-2xl lg:text-3xl font-bold text-white">
                {formatCurrency(stat.value)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Active Investments */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-xl text-white">Active Investments</h2>
              <button
                onClick={onViewInvestments}
                className="text-gold-500 text-sm font-medium hover:text-gold-400 transition-colors"
              >
                View All
              </button>
            </div>

            {activeInvestments.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-700 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-gray-400 mb-4">No active investments yet</p>
                <button onClick={onViewPlans} className="btn-primary">
                  Start Your First Investment
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {activeInvestments.slice(0, 3).map((investment, idx) => {
                  const plan = investmentPlans.find(p => p.id === investment.plan_id);
                  const progress = Math.min(
                    100,
                    ((Date.now() - new Date(investment.start_date).getTime()) /
                      (plan!.duration_days * 24 * 60 * 60 * 1000)) *
                      100
                  );

                  return (
                    <div
                      key={investment.id}
                      className="p-4 rounded-xl bg-dark-700/50 border border-dark-600 animate-fade-in"
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium text-white">{plan?.name}</p>
                          <p className="text-sm text-gray-500">
                            {formatCurrency(investment.amount)} invested
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-accent-emerald font-semibold">
                            +{formatCurrency(investment.expected_profit)}
                          </p>
                          <p className="text-xs text-gray-500">Expected profit</p>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="h-2 rounded-full bg-dark-600 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-400 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {Math.round(progress)}% complete
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-bold text-xl text-white">Recent Activity</h2>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((tx, idx) => {
                const isCredit = ['deposit', 'profit', 'referral'].includes(tx.type);
                const isPending = tx.status === 'pending';

                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-dark-700/50 border border-dark-600 animate-fade-in"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          isCredit
                            ? 'bg-accent-emerald/20 text-accent-emerald'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {isCredit ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white capitalize">{tx.type}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          isCredit ? 'text-accent-emerald' : 'text-red-400'
                        }`}
                      >
                        {isCredit ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </p>
                      {isPending && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-500">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Featured Plans */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-xl text-white">Featured Investment Plans</h2>
          <button
            onClick={onViewPlans}
            className="text-gold-500 text-sm font-medium hover:text-gold-400 transition-colors"
          >
            View All Plans
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {investmentPlans.slice(0, 3).map((plan, idx) => (
            <div
              key={plan.id}
              className="plan-card cursor-pointer animate-fade-in"
              style={{ animationDelay: `${idx * 100}ms` }}
              onClick={onViewPlans}
            >
              <div className="flex items-center gap-4 mb-4">
                <div
                  className={`p-3 rounded-xl ${
                    plan.color_scheme === 'gold'
                      ? 'bg-gold-500/20 text-gold-500'
                      : plan.color_scheme === 'emerald'
                      ? 'bg-accent-emerald/20 text-accent-emerald'
                      : plan.color_scheme === 'blue'
                      ? 'bg-accent-blue/20 text-accent-blue'
                      : plan.color_scheme === 'purple'
                      ? 'bg-accent-purple/20 text-accent-purple'
                      : 'bg-accent-cyan/20 text-accent-cyan'
                  }`}
                >
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{plan.name}</h3>
                  <p className="text-xs text-gray-500">{plan.duration_days} days</p>
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-gray-500">Returns</p>
                  <p className="text-xl font-bold text-gold-500">+{plan.interest_rate}%</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Min. amount</p>
                  <p className="text-sm text-white">{formatCurrency(plan.min_amount)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
