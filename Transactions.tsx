import { useState, useEffect } from 'react';
import { Transaction, Profile, NigerianBank } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Clock,
  Filter,
  AlertCircle,
  CheckCircle,
  XCircle,
  DollarSign,
  Building2,
  CreditCard,
  ExternalLink,
  Loader2,
} from 'lucide-react';

interface TransactionsProps {
  transactions: Transaction[];
  profile: Profile;
  onSuccess: () => void;
}

export default function Transactions({ transactions, profile, onSuccess }: TransactionsProps) {
  const [depositModal, setDepositModal] = useState(false);
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [banks, setBanks] = useState<NigerianBank[]>([]);
  const [selectedBank, setSelectedBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      const { data, error } = await supabase
        .from('nigerian_banks')
        .select('*')
        .order('name', { ascending: true });
      if (data && !error) {
        setBanks(data);
        // Set default bank if available
        if (data.length > 0) {
          setSelectedBank(data[0].code);
        }
      }
    } catch (err) {
      console.error('Error fetching banks:', err);
    }
  };

  const handleDeposit = async () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 10) {
      setError('Minimum deposit is $10 (NGN 15,000)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Please sign in to continue');
        return;
      }

      // Call Paystack edge function to initialize payment
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/paystack`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'initialize_deposit',
          data: { amount: amountNum, currency: 'NGN' },
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Failed to initialize payment');
      }

      if (result.success && result.data?.authorization_url) {
        // Store key info for verification later
        localStorage.setItem('pending_deposit_reference', result.data.reference);
        localStorage.setItem('pending_deposit_amount', amountNum.toString());

        // Open Paystack payment in new tab
        window.open(result.data.authorization_url, '_blank');

        setPaymentUrl(result.data.authorization_url);
        setSuccess(true);
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize deposit');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amountNum > profile.balance) {
      setError('Insufficient balance');
      return;
    }

    if (!selectedBank) {
      setError('Please select a bank');
      return;
    }

    if (!accountNumber || accountNumber.length !== 10) {
      setError('Please enter a valid 10-digit account number');
      return;
    }

    if (!accountName.trim()) {
      setError('Please enter the account name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Please sign in to continue');
        return;
      }

      const bank = banks.find((b) => b.code === selectedBank);

      // Call Paystack edge function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/paystack`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'initialize_withdrawal',
          data: {
            amount: amountNum,
            bank_code: selectedBank,
            account_number: accountNumber,
            account_name: accountName,
            bank_name: bank?.name || '',
          },
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Failed to submit withdrawal');
      }

      setSuccess(true);
      setTimeout(() => {
        setWithdrawModal(false);
        setAmount('');
        setAccountNumber('');
        setAccountName('');
        setSuccess(false);
        onSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to process withdrawal');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const closeModals = () => {
    setDepositModal(false);
    setWithdrawModal(false);
    setAmount('');
    setError('');
    setSuccess(false);
    setPaymentUrl(null);
  };

  const filteredTransactions =
    filter === 'all' ? transactions : transactions.filter((t) => t.type === filter);

  const totalDeposits = transactions
    .filter((t) => t.type === 'deposit' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalWithdrawals = transactions
    .filter((t) => t.type === 'withdrawal' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const stats = [
    {
      label: 'Current Balance',
      value: formatCurrency(profile.balance),
      icon: Wallet,
      color: 'gold',
    },
    {
      label: 'Total Deposits',
      value: formatCurrency(totalDeposits),
      icon: ArrowDownRight,
      color: 'emerald',
    },
    {
      label: 'Total Withdrawals',
      value: formatCurrency(totalWithdrawals),
      icon: ArrowUpRight,
      color: 'blue',
    },
  ];

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { icon: React.FC<{ className?: string }>; color: string }> = {
      pending: { icon: Clock, color: 'bg-gold-500/20 text-gold-500' },
      completed: { icon: CheckCircle, color: 'bg-accent-emerald/20 text-accent-emerald' },
      failed: { icon: XCircle, color: 'bg-red-500/20 text-red-400' },
      cancelled: { icon: XCircle, color: 'bg-gray-500/20 text-gray-500' },
    };
    return configs[status] || configs.pending;
  };

  const getTypeConfig = (type: string) => {
    const isCredit = ['deposit', 'profit', 'referral'].includes(type);
    return {
      icon: isCredit ? ArrowDownRight : ArrowUpRight,
      color: isCredit ? 'bg-accent-emerald/20 text-accent-emerald' : 'bg-red-500/20 text-red-400',
      isCredit,
    };
  };

  // Payment gateway indicator
  const paymentGatewayInfo = {
    name: 'Paystack',
    logo: '/paystack.svg',
    countries: ['Nigeria', 'Ghana', 'Kenya', 'South Africa'],
    methods: ['Card', 'Bank Transfer', 'USSD', 'Mobile Money'],
  };

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          const colorClass = {
            gold: 'bg-gold-500/20 text-gold-500',
            emerald: 'bg-accent-emerald/20 text-accent-emerald',
            blue: 'bg-accent-blue/20 text-accent-blue',
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

      {/* Payment Gateway Info */}
      <div className="card bg-gradient-to-br from-dark-700/50 to-dark-800/50">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-accent-cyan/30 to-accent-blue/30">
                <CreditCard className="w-5 h-5 text-accent-cyan" />
              </div>
              <div>
                <h3 className="font-medium text-white">Paystack</h3>
                <p className="text-xs text-gray-500">African Payment Gateway</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {paymentGatewayInfo.methods.map((method) => (
                <span
                  key={method}
                  className="px-2 py-1 rounded-full text-xs bg-dark-600 text-gray-400"
                >
                  {method}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">Available in</p>
            <div className="flex flex-wrap gap-1 justify-end">
              {paymentGatewayInfo.countries.map((country) => (
                <span key={country} className="text-xs text-accent-cyan">
                  {country}
                </span>
              )).reduce((acc: any, curr, i, arr) => {
                if (i === arr.length - 1) return [...acc, curr];
                return [...acc, curr, <span key={`sep-${i}`} className="text-gray-600">/</span>];
              }, [])}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setDepositModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <DollarSign className="w-5 h-5" />
          Deposit Funds
        </button>
        <button
          onClick={() => setWithdrawModal(true)}
          className="btn-secondary flex items-center gap-2"
        >
          <Wallet className="w-5 h-5" />
          Withdraw
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        <Filter className="w-5 h-5 text-gray-500" />
        {['all', 'deposit', 'withdrawal', 'investment', 'profit'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all duration-300 whitespace-nowrap ${
              filter === type
                ? 'bg-gold-500/20 text-gold-500 border border-gold-500/30'
                : 'bg-dark-700 text-gray-400 hover:text-white hover:bg-dark-600'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-700 flex items-center justify-center">
              <Clock className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-gray-400">No transactions found</p>
          </div>
        ) : (
          filteredTransactions.map((tx, idx) => {
            const status = getStatusConfig(tx.status);
            const type = getTypeConfig(tx.type);
            const StatusIcon = status.icon;
            const TypeIcon = type.icon;

            return (
              <div
                key={tx.id}
                className="card card-hover animate-fade-in"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${type.color}`}>
                    <TypeIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white capitalize">{tx.type}</h3>
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        <span className="capitalize">{tx.status}</span>
                      </div>
                      {tx.provider === 'paystack' && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-accent-cyan/20 text-accent-cyan">
                          Paystack
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                      <span>{new Date(tx.created_at).toLocaleDateString()}</span>
                      {tx.reference_code && (
                        <>
                          <span>/</span>
                          <span className="font-mono">{tx.reference_code}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-lg font-bold ${
                        type.isCredit ? 'text-accent-emerald' : 'text-red-400'
                      }`}
                    >
                      {type.isCredit ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Deposit Modal */}
      {depositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !loading && !success && closeModals()}
          />
          <div className="relative w-full max-w-md bg-dark-800 rounded-2xl border border-dark-600 p-6">
            {success && paymentUrl ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-cyan/20 flex items-center justify-center">
                  <ExternalLink className="w-8 h-8 text-accent-cyan" />
                </div>
                <h3 className="font-display font-bold text-2xl text-white mb-2">Complete Payment</h3>
                <p className="text-gray-400 mb-4">Payment page opened in a new tab.</p>
                <p className="text-sm text-gray-500 mb-4">
                  If the page didn't open, click below to complete your deposit.
                </p>
                <a
                  href={paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  Open Payment Page
                </a>
                <button
                  onClick={closeModals}
                  className="block w-full mt-3 text-sm text-gray-500 hover:text-gray-400"
                >
                  Close
                </button>
              </div>
            ) : success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-emerald/20 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-accent-emerald" />
                </div>
                <h3 className="font-display font-bold text-2xl text-white mb-2">Success!</h3>
                <p className="text-gray-400">Your deposit has been processed.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <CreditCard className="w-6 h-6 text-accent-cyan" />
                  <div>
                    <h3 className="font-display font-bold text-xl text-white">Deposit Funds</h3>
                    <p className="text-xs text-gray-500">Powered by Paystack</p>
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-sm text-gray-400 mb-2">Amount (USD)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="input-field pl-8"
                      min={10}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Minimum deposit: $10 | Supports: Card, Bank Transfer, USSD, Mobile Money</p>

                  {/* Quick amounts */}
                  <div className="flex gap-2 mt-3">
                    {[50, 100, 250, 500, 1000].map((val) => (
                      <button
                        key={val}
                        onClick={() => setAmount(val.toString())}
                        className="flex-1 py-2 rounded-lg text-sm bg-dark-600 text-gray-400 hover:bg-dark-500 hover:text-white transition-colors"
                      >
                        ${val}
                      </button>
                    ))}
                  </div>
                </div>
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/20 border border-red-500/30 mb-6">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={closeModals} disabled={loading} className="flex-1 btn-secondary">
                    Cancel
                  </button>
                  <button
                    onClick={handleDeposit}
                    disabled={loading || !amount}
                    className="flex-1 btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        Pay with Paystack
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {withdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !loading && !success && closeModals()}
          />
          <div className="relative w-full max-w-md bg-dark-800 rounded-2xl border border-dark-600 p-6 max-h-[90vh] overflow-y-auto">
            {success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-emerald/20 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-accent-emerald" />
                </div>
                <h3 className="font-display font-bold text-2xl text-white mb-2">Request Submitted!</h3>
                <p className="text-gray-400">An admin will process your withdrawal shortly.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <Building2 className="w-6 h-6 text-accent-cyan" />
                  <div>
                    <h3 className="font-display font-bold text-xl text-white">Withdraw Funds</h3>
                    <p className="text-xs text-gray-500">Bank Transfer via Paystack</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                  Available: {formatCurrency(profile.balance)}
                </p>

                <div className="space-y-4">
                  {/* Amount */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Amount (USD)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="input-field pl-8"
                        min={1}
                        max={profile.balance}
                      />
                    </div>
                  </div>

                  {/* Bank Selection */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Bank</label>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="input-field"
                    >
                      <option value="">Select bank...</option>
                      {banks.map((bank) => (
                        <option key={bank.id} value={bank.code}>
                          {bank.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Account Number */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Account Number</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit account number"
                      className="input-field"
                      maxLength={10}
                    />
                  </div>

                  {/* Account Name */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Account Name</label>
                    <input
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="Name on the account"
                      className="input-field"
                    />
                  </div>

                  {/* Info note */}
                  <div className="p-3 rounded-xl bg-dark-700/50 border border-dark-600">
                    <p className="text-xs text-gray-500">
                      Withdrawal requests are processed by admins within 24-48 hours.
                      Funds will be sent to your Nigerian bank account.
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/20 border border-red-500/30 mt-4">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button onClick={closeModals} disabled={loading} className="flex-1 btn-secondary">
                    Cancel
                  </button>
                  <button
                    onClick={handleWithdraw}
                    disabled={loading || !amount || !selectedBank || accountNumber.length !== 10 || !accountName}
                    className="flex-1 btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Submit Request'
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
