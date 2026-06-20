import { useState } from 'react';
import { Profile, InvestmentPlan } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import {
  TrendingUp,
  Sprout,
  Crown,
  Gem,
  Sparkles,
  Check,
  Clock,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

interface InvestmentPlansProps {
  plans: InvestmentPlan[];
  profile: Profile;
  onSuccess: () => void;
}

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  seedling: Sprout,
  'trending-up': TrendingUp,
  crown: Crown,
  gem: Gem,
  sparkles: Sparkles,
};

export default function InvestmentPlans({ plans, profile, onSuccess }: InvestmentPlansProps) {
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleInvest = async () => {
    if (!selectedPlan || !amount) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) {
      setError('Please enter a valid amount');
      return;
    }

    if (amountNum < selectedPlan.min_amount) {
      setError(`Minimum investment is ${formatCurrency(selectedPlan.min_amount)}`);
      return;
    }

    if (selectedPlan.max_amount && amountNum > selectedPlan.max_amount) {
      setError(`Maximum investment is ${formatCurrency(selectedPlan.max_amount)}`);
      return;
    }

    if (amountNum > profile.balance) {
      setError('Insufficient balance. Please deposit funds first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const expectedProfit = amountNum * (selectedPlan.interest_rate / 100);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + selectedPlan.duration_days);

      // Create investment
      const { error: investError } = await supabase.from('investments').insert({
        user_id: profile.id,
        plan_id: selectedPlan.id,
        amount: amountNum,
        expected_profit: expectedProfit,
        end_date: endDate.toISOString(),
        status: 'active',
      });

      if (investError) throw investError;

      // Create transaction
      await supabase.from('transactions').insert({
        user_id: profile.id,
        type: 'investment',
        amount: amountNum,
        status: 'completed',
        description: `Investment in ${selectedPlan.name}`,
      });

      // Update balance
      const newBalance = profile.balance - amountNum;
      const newTotalInvested = profile.total_invested + amountNum;
      await supabase
        .from('profiles')
        .update({ balance: newBalance, total_invested: newTotalInvested })
        .eq('id', profile.id);

      setSuccess(true);
      setTimeout(() => {
        setSelectedPlan(null);
        setAmount('');
        setSuccess(false);
        onSuccess();
      }, 2000);
    } catch (err) {
      setError('Failed to process investment. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="font-display text-3xl lg:text-4xl font-bold text-white mb-3">
          Investment Plans
        </h1>
        <p className="text-gray-400">
          Choose the perfect plan to grow your wealth. Higher tiers offer better returns with longer commitment periods.
        </p>
      </div>

      {/* Balance Alert */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-dark-800 border border-dark-600">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gold-500/20">
            <TrendingUp className="w-5 h-5 text-gold-500" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Available Balance</p>
            <p className="font-semibold text-white">{formatCurrency(profile.balance)}</p>
          </div>
        </div>
        <p className={`text-sm ${profile.balance > 0 ? 'text-accent-emerald' : 'text-gold-500'}`}>
          {profile.balance > 0 ? 'Ready to invest' : 'Deposit funds to invest'}
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan, idx) => {
          const Icon = iconMap[plan.icon_name] || TrendingUp;
          const colorStyles = {
            emerald: 'border-accent-emerald/30 hover:border-accent-emerald/50 from-accent-emerald/20',
            blue: 'border-accent-blue/30 hover:border-accent-blue/50 from-accent-blue/20',
            gold: 'border-gold-500/30 hover:border-gold-500/50 from-gold-500/20',
            purple: 'border-accent-purple/30 hover:border-accent-purple/50 from-accent-purple/20',
            cyan: 'border-accent-cyan/30 hover:border-accent-cyan/50 from-accent-cyan/20',
          }[plan.color_scheme] || 'border-gold-500/30 hover:border-gold-500/50 from-gold-500/20';

          return (
            <div
              key={plan.id}
              className={`plan-card cursor-pointer animate-fade-in ${colorStyles}`}
              style={{ animationDelay: `${idx * 100}ms` }}
              onClick={() => {
                setSelectedPlan(plan);
                setAmount('');
                setError('');
              }}
            >
              <div className="relative">
                <div
                  className={`absolute -top-2 -right-2 px-3 py-1 rounded-full text-xs font-semibold ${
                    plan.color_scheme === 'gold' || plan.color_scheme === 'emerald'
                      ? 'bg-gold-500 text-dark-900'
                      : 'bg-accent-blue text-white'
                  }`}
                >
                  +{plan.interest_rate}%
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div
                    className={`p-4 rounded-xl bg-gradient-to-br ${
                      plan.color_scheme === 'gold'
                        ? 'from-gold-500/30 to-gold-600/10 text-gold-500'
                        : plan.color_scheme === 'emerald'
                        ? 'from-accent-emerald/30 to-accent-emerald/10 text-accent-emerald'
                        : plan.color_scheme === 'blue'
                        ? 'from-accent-blue/30 to-accent-blue/10 text-accent-blue'
                        : plan.color_scheme === 'purple'
                        ? 'from-accent-purple/30 to-accent-purple/10 text-accent-purple'
                        : 'from-accent-cyan/30 to-accent-cyan/10 text-accent-cyan'
                    }`}
                  >
                    <Icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xl text-white">{plan.name}</h3>
                    <p className="text-sm text-gray-500">{plan.duration_days} days duration</p>
                  </div>
                </div>

                <p className="text-gray-400 text-sm mb-6 line-clamp-2">{plan.description}</p>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Min. Investment</span>
                    <span className="text-white font-medium">{formatCurrency(plan.min_amount)}</span>
                  </div>
                  {plan.max_amount && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Max. Investment</span>
                      <span className="text-white font-medium">{formatCurrency(plan.max_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Expected Returns</span>
                    <span className="text-gold-500 font-semibold">+{plan.interest_rate}%</span>
                  </div>
                </div>

                <button className="w-full btn-secondary flex items-center justify-center gap-2 group">
                  Invest Now
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Investment Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !loading && !success && setSelectedPlan(null)}
          />
          <div className="relative w-full max-w-md bg-dark-800 rounded-2xl border border-dark-600 p-6 animate-fade-in">
            {success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-emerald/20 flex items-center justify-center">
                  <Check className="w-8 h-8 text-accent-emerald" />
                </div>
                <h3 className="font-display font-bold text-2xl text-white mb-2">Success!</h3>
                <p className="text-gray-400">Your investment has been activated.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-xl bg-gold-500/20 text-gold-500">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xl text-white">
                      {selectedPlan.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedPlan.interest_rate}% returns in {selectedPlan.duration_days} days
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm text-gray-400 mb-2">Investment Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={`${selectedPlan.min_amount}`}
                      className="input-field pl-8"
                      min={selectedPlan.min_amount}
                      max={selectedPlan.max_amount || undefined}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Min: {formatCurrency(selectedPlan.min_amount)}
                    {selectedPlan.max_amount && ` • Max: ${formatCurrency(selectedPlan.max_amount)}`}
                  </p>
                </div>

                {amount && !isNaN(parseFloat(amount)) && (
                  <div className="p-4 rounded-xl bg-dark-700/50 border border-dark-600 mb-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-500">Investment</span>
                      <span className="text-white">{formatCurrency(parseFloat(amount))}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-500">Returns ({selectedPlan.interest_rate}%)</span>
                      <span className="text-gold-500">
                        +{formatCurrency(parseFloat(amount) * (selectedPlan.interest_rate / 100))}
                      </span>
                    </div>
                    <div className="border-t border-dark-600 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400 font-medium">Total Return</span>
                        <span className="text-white font-bold">
                          {formatCurrency(
                            parseFloat(amount) + parseFloat(amount) * (selectedPlan.interest_rate / 100)
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/20 border border-red-500/30 mb-6">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedPlan(null)}
                    disabled={loading}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleInvest}
                    disabled={loading || !amount}
                    className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <TrendingUp className="w-5 h-5" />
                        Invest
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
