import { useState, useEffect } from 'react';
import { Profile, Withdrawal } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import {
  Shield,
  Users,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Crown,
  Calendar,
  DollarSign,
  TrendingUp,
  Loader2,
  ArrowDownRight,
  Clock,
  Building2,
} from 'lucide-react';

interface AdminProps {
  profile: Profile;
}

interface UserProfile extends Profile {
  email?: string;
}

interface WithdrawalWithUser extends Withdrawal {
  profiles?: { full_name: string; id: string };
}

export default function Admin({ profile }: AdminProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'withdrawals'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalWithUser | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (profile.is_admin) {
      fetchUsers();
      fetchWithdrawals();
    }
  }, [profile.is_admin]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select(`
          *,
          profiles:user_id (full_name, id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWithdrawals(data || []);
    } catch (err) {
      console.error('Error fetching withdrawals:', err);
    }
  };

  const handleToggleAdmin = async (user: UserProfile, makeAdmin: boolean) => {
    if (!profile.is_admin) {
      setError('Only admins can modify admin status');
      return;
    }

    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_admin: makeAdmin })
        .eq('id', user.id);

      if (updateError) {
        if (updateError.message.includes('Only admins can create new admins')) {
          throw new Error('Permission denied: Only existing admins can create new admins');
        }
        throw updateError;
      }

      setSuccess(`${user.full_name} is now ${makeAdmin ? 'an admin' : 'no longer an admin'}`);
      await fetchUsers();
      setSelectedUser(null);

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update admin status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcessWithdrawal = async (withdrawal: WithdrawalWithUser, action: 'approve' | 'reject', notes?: string) => {
    setActionLoading(true);
    setError('');

    try {
      if (action === 'approve') {
        const { error: updateError } = await supabase
          .from('withdrawals')
          .update({
            status: 'completed',
            processed_by: profile.id,
            processed_at: new Date().toISOString(),
            notes: notes || 'Withdrawal processed and sent to bank account',
          })
          .eq('id', withdrawal.id);

        if (updateError) throw updateError;
        setSuccess(`Withdrawal of $${withdrawal.amount} approved`);
      } else {
        const { error: refundError } = await supabase
          .from('withdrawals')
          .update({
            status: 'cancelled',
            failure_reason: notes || 'Rejected by admin',
            processed_by: profile.id,
            processed_at: new Date().toISOString(),
          })
          .eq('id', withdrawal.id);

        if (refundError) throw refundError;

        const { data: userProfile } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', withdrawal.user_id)
          .single();

        if (userProfile) {
          await supabase
            .from('profiles')
            .update({
              balance: userProfile.balance + withdrawal.amount,
              updated_at: new Date().toISOString()
            })
            .eq('id', withdrawal.user_id);
        }

        setSuccess(`Withdrawal rejected and $${withdrawal.amount} refunded`);
      }

      await fetchWithdrawals();
      setSelectedWithdrawal(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to process withdrawal');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalUsers: users.length,
    totalAdmins: users.filter((u) => u.is_admin).length,
    totalInvested: users.reduce((sum, u) => sum + (u.total_invested || 0), 0),
    totalBalance: users.reduce((sum, u) => sum + (u.balance || 0), 0),
    pendingWithdrawals: withdrawals.filter((w) => w.status === 'pending').length,
    pendingWithdrawalAmount: withdrawals
      .filter((w) => w.status === 'pending')
      .reduce((sum, w) => sum + w.amount, 0),
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!profile.is_admin) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
          <Shield className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="font-display text-2xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-gray-400">You do not have admin privileges to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gold-500/20">
            <Shield className="w-8 h-8 text-gold-500" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Admin Panel</h1>
            <p className="text-gray-500">Manage users, admins, and withdrawals</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-500/20 border border-gold-500/30">
          <Crown className="w-5 h-5 text-gold-500" />
          <span className="text-gold-500 font-medium">Admin Mode</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'blue' },
          { label: 'Total Admins', value: stats.totalAdmins, icon: Crown, color: 'gold' },
          { label: 'Total Invested', value: formatCurrency(stats.totalInvested), icon: TrendingUp, color: 'emerald' },
          { label: 'Pending Withdrawals', value: stats.pendingWithdrawals, icon: Clock, color: 'orange' },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          const colorClass = {
            blue: 'bg-accent-blue/20 text-accent-blue',
            gold: 'bg-gold-500/20 text-gold-500',
            emerald: 'bg-accent-emerald/20 text-accent-emerald',
            orange: 'bg-orange-500/20 text-orange-500',
          }[stat.color] || 'bg-gold-500/20 text-gold-500';

          return (
            <div key={stat.label} className="stat-card animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
              <div className={`p-2.5 rounded-lg w-fit mb-3 ${colorClass}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-gray-500 text-sm">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Withdrawals Alert */}
      {stats.pendingWithdrawals > 0 && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-orange-500/20 border border-orange-500/30">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-white font-medium">{stats.pendingWithdrawals} pending withdrawal{stats.pendingWithdrawals > 1 ? 's' : ''}</p>
              <p className="text-sm text-orange-400">Total: {formatCurrency(stats.pendingWithdrawalAmount)}</p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className="px-4 py-2 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors"
          >
            Review Now
          </button>
        </div>
      )}

      {/* Success/Error Messages */}
      {success && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-accent-emerald/20 border border-accent-emerald/30">
          <CheckCircle className="w-5 h-5 text-accent-emerald" />
          <p className="text-accent-emerald">{success}</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/20 border border-red-500/30">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-gold-500/20 text-gold-500 border border-gold-500/30'
              : 'bg-dark-700 text-gray-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          User Management
        </button>
        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'withdrawals'
              ? 'bg-gold-500/20 text-gold-500 border border-gold-500/30'
              : 'bg-dark-700 text-gray-400 hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Withdrawals
          {stats.pendingWithdrawals > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-orange-500 text-white">
              {stats.pendingWithdrawals}
            </span>
          )}
        </button>
      </div>

      {/* Withdrawals Tab */}
      {activeTab === 'withdrawals' && (
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-5 h-5 text-gray-500" />
            <h2 className="font-display font-bold text-xl text-white">Withdrawal Requests</h2>
          </div>

          {withdrawals.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">No withdrawal requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((w, idx) => (
                <div
                  key={w.id}
                  className={`p-4 rounded-xl border ${
                    w.status === 'pending'
                      ? 'bg-orange-500/10 border-orange-500/30'
                      : 'bg-dark-700/50 border-dark-600'
                  } animate-fade-in`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${
                        w.status === 'pending' ? 'bg-orange-500/20' :
                        w.status === 'completed' ? 'bg-accent-emerald/20' :
                        'bg-gray-500/20'
                      }`}>
                        <ArrowDownRight className={`w-5 h-5 ${
                          w.status === 'pending' ? 'text-orange-500' :
                          w.status === 'completed' ? 'text-accent-emerald' :
                          'text-gray-500'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">{w.profiles?.full_name || 'Unknown User'}</p>
                          <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${
                            w.status === 'pending' ? 'bg-orange-500/20 text-orange-500' :
                            w.status === 'completed' ? 'bg-accent-emerald/20 text-accent-emerald' :
                            'bg-gray-500/20 text-gray-500'
                          }`}>
                            {w.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          <span>{w.bank_name} • {w.account_number}</span>
                          <span className="mx-2">•</span>
                          <span>{w.account_name}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-bold text-white">{formatCurrency(w.amount)}</p>
                      {w.status === 'pending' && (
                        <button
                          onClick={() => setSelectedWithdrawal(w)}
                          className="mt-2 px-4 py-1.5 rounded-lg text-sm bg-gold-500/20 text-gold-500 hover:bg-gold-500/30 transition-colors"
                        >
                          Process
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name..."
              className="input-field pl-12"
            />
          </div>

          {/* Users Table */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-5 h-5 text-gray-500" />
              <h2 className="font-display font-bold text-xl text-white">Users</h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400">No users found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((user, idx) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-dark-700/50 border border-dark-600 hover:border-dark-500 transition-colors animate-fade-in"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                          user.is_admin
                            ? 'bg-gradient-to-br from-gold-400 to-gold-600 text-dark-900'
                            : 'bg-dark-600 text-white'
                        }`}
                      >
                        {user.full_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">{user.full_name || 'Unknown'}</p>
                          {user.is_admin && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gold-500/20 text-gold-500 border border-gold-500/30">
                              <Crown className="w-3 h-3" />
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(user.created_at).toLocaleDateString()}
                          </span>
                          <span>·</span>
                          <span>Balance: {formatCurrency(user.balance)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm text-gray-500">Invested</p>
                        <p className="text-white font-medium">{formatCurrency(user.total_invested)}</p>
                      </div>

                      {user.id !== profile.id && (
                        <button
                          onClick={() => setSelectedUser(user)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            user.is_admin
                              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                              : 'bg-gold-500/20 text-gold-500 hover:bg-gold-500/30 border border-gold-500/30'
                          }`}
                        >
                          {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* User Admin Confirmation Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !actionLoading && setSelectedUser(null)}
          />
          <div className="relative w-full max-w-md bg-dark-800 rounded-2xl border border-dark-600 p-6 animate-fade-in">
            <div className="text-center mb-6">
              <div
                className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  selectedUser.is_admin
                    ? 'bg-red-500/20'
                    : 'bg-gold-500/20'
                }`}
              >
                {selectedUser.is_admin ? (
                  <XCircle className="w-8 h-8 text-red-400" />
                ) : (
                  <Crown className="w-8 h-8 text-gold-500" />
                )}
              </div>
              <h3 className="font-display font-bold text-xl text-white mb-2">
                {selectedUser.is_admin ? 'Remove Admin Status' : 'Grant Admin Status'}
              </h3>
              <p className="text-gray-400">
                {selectedUser.is_admin
                  ? `${selectedUser.full_name} will no longer have admin privileges.`
                  : `${selectedUser.full_name} will gain full admin privileges.`}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedUser(null)}
                disabled={actionLoading}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleToggleAdmin(selectedUser, !selectedUser.is_admin)}
                disabled={actionLoading}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 ${
                  selectedUser.is_admin
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-gold-500 text-dark-900 hover:bg-gold-400'
                }`}
              >
                {actionLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : selectedUser.is_admin ? (
                  'Remove Admin'
                ) : (
                  'Make Admin'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Processing Modal */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !actionLoading && setSelectedWithdrawal(null)}
          />
          <div className="relative w-full max-w-lg bg-dark-800 rounded-2xl border border-dark-600 p-6 animate-fade-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-orange-500/20">
                <Building2 className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="font-display font-bold text-xl text-white mb-2">Process Withdrawal</h3>
              <p className="text-gray-400">Review and process this withdrawal request</p>
            </div>

            <div className="space-y-4 mb-6 p-4 rounded-xl bg-dark-700/50">
              <div className="flex justify-between">
                <span className="text-gray-500">User</span>
                <span className="text-white font-medium">{selectedWithdrawal.profiles?.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Amount</span>
                <span className="text-white font-bold text-xl">{formatCurrency(selectedWithdrawal.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Bank</span>
                <span className="text-white">{selectedWithdrawal.bank_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Account Number</span>
                <span className="text-white font-mono">{selectedWithdrawal.account_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Account Name</span>
                <span className="text-white">{selectedWithdrawal.account_name}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedWithdrawal(null)}
                disabled={actionLoading}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleProcessWithdrawal(selectedWithdrawal, 'reject')}
                disabled={actionLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                Reject & Refund
              </button>
              <button
                onClick={() => handleProcessWithdrawal(selectedWithdrawal, 'approve')}
                disabled={actionLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold bg-accent-emerald text-white hover:bg-emerald-600 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
