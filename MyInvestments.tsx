import { Investment } from '../lib/supabase';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Target,
  DollarSign,
} from 'lucide-react';

interface MyInvestmentsProps {
  investments: Investment[];
}

export default function MyInvestments({ investments }: MyInvestmentsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusConfig = (status: string, endDate?: string) => {
    if (status === 'active') {
      if (endDate && new Date(endDate) < new Date()) {
        return {
          icon: AlertCircle,
          label: 'Matured',
          color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
        };
      }
      return {
        icon: TrendingUp,
        label: 'Active',
        color: 'bg-accent-emerald/20 text-accent-emerald border-accent-emerald/30',
      };
    }
    const configs: Record<string, { icon: React.FC<{ className?: string }>; label: string; color: string }> = {
      pending: { icon: Clock, label: 'Pending', color: 'bg-gold-500/20 text-gold-500 border-gold-500/30' },
      completed: { icon: CheckCircle, label: 'Completed', color: 'bg-accent-blue/20 text-accent-blue border-accent-blue/30' },
      cancelled: { icon: XCircle, label: 'Cancelled', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    };
    return configs[status] || configs.pending;
  };

  const activeInvestments = investments.filter(inv => inv.status === 'active');
  const completedInvestments = investments.filter(inv => inv.status === 'completed');
  const totalInvested = activeInvestments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalExpectedProfit = activeInvestments.reduce((sum, inv) => sum + inv.expected_profit, 0);
  const totalCompletedProfit = completedInvestments.reduce((sum, inv) => sum + inv.expected_profit, 0);

  const stats = [
    {
      label: 'Active Investments',
      value: activeInvestments.length,
      icon: TrendingUp,
      color: 'emerald',
    },
    {
      label: 'Total Invested',
      value: formatCurrency(totalInvested),
      icon: Target,
      color: 'blue',
    },
    {
      label: 'Expected Profit',
      value: formatCurrency(totalExpectedProfit),
      icon: DollarSign,
      color: 'gold',
    },
    {
      label: 'Realized Profit',
      value: formatCurrency(totalCompletedProfit),
      icon: CheckCircle,
      color: 'cyan',
    },
  ];

  if (investments.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-dark-700 flex items-center justify-center">
          <TrendingUp className="w-10 h-10 text-gray-600" />
        </div>
        <h2 className="font-display text-2xl font-bold text-white mb-2">No Investments Yet</h2>
        <p className="text-gray-400 mb-6">Start your investment journey by choosing a plan.</p>
        <button className="btn-primary">Browse Plans</button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          const colorClass = {
            emerald: 'bg-accent-emerald/20 text-accent-emerald',
            blue: 'bg-accent-blue/20 text-accent-blue',
            gold: 'bg-gold-500/20 text-gold-500',
            cyan: 'bg-accent-cyan/20 text-accent-cyan',
          }[stat.color] || 'bg-gold-500/20 text-gold-500';

          return (
            <div
              key={stat.label}
              className="stat-card animate-fade-in"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className={`p-2.5 rounded-lg w-fit mb-3 ${colorClass}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-gray-500 text-sm">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Active Investments */}
      {activeInvestments.length > 0 && (
        <div>
          <h2 className="font-display font-bold text-xl text-white mb-4">Active Investments</h2>
          <div className="space-y-4">
            {activeInvestments.map((inv, idx) => {
              const status = getStatusConfig(inv.status, inv.end_date);
              const StatusIcon = status.icon;
              const plan = inv.plan;
              const progress = inv.end_date
                ? Math.min(
                    100,
                    ((Date.now() - new Date(inv.start_date).getTime()) /
                      (new Date(inv.end_date).getTime() - new Date(inv.start_date).getTime())) *
                      100
                  )
                : 0;
              const daysLeft = inv.end_date
                ? Math.max(
                    0,
                    Math.ceil(
                      (new Date(inv.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                    )
                  )
                : 0;

              return (
                <div
                  key={inv.id}
                  className="card card-hover animate-fade-in"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-white">{plan?.name || 'Investment'}</h3>
                        <span
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${status.color}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          {status.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-4">
                        Started {new Date(inv.start_date).toLocaleDateString()}
                        {inv.end_date && ` • Ends ${new Date(inv.end_date).toLocaleDateString()}`}
                      </p>

                      <div className="relative">
                        <div className="h-2 rounded-full bg-dark-600 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-400 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-2">
                          <span className="text-xs text-gray-500">{Math.round(progress)}% complete</span>
                          {daysLeft > 0 && (
                            <span className="text-xs text-gray-500">{daysLeft} days left</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex lg:flex-col items-center lg:items-end gap-4 lg:gap-2">
                      <div className="text-center lg:text-right">
                        <p className="text-xs text-gray-500">Invested</p>
                        <p className="text-lg font-bold text-white">{formatCurrency(inv.amount)}</p>
                      </div>
                      <div className="text-center lg:text-right">
                        <p className="text-xs text-gray-500">Expected Profit</p>
                        <p className="text-lg font-bold text-accent-emerald">
                          +{formatCurrency(inv.expected_profit)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Investments */}
      {completedInvestments.length > 0 && (
        <div>
          <h2 className="font-display font-bold text-xl text-white mb-4">Completed Investments</h2>
          <div className="space-y-4">
            {completedInvestments.map((inv, idx) => {
              const plan = inv.plan;

              return (
                <div
                  key={inv.id}
                  className="card bg-dark-700/50 animate-fade-in"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-accent-blue/20 text-accent-blue">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{plan?.name || 'Investment'}</h3>
                        <p className="text-sm text-gray-500">
                          {inv.end_date
                            ? `Completed ${new Date(inv.end_date).toLocaleDateString()}`
                            : `Started ${new Date(inv.start_date).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">{formatCurrency(inv.amount)}</p>
                      <p className="text-sm text-accent-emerald">+{formatCurrency(inv.expected_profit)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
