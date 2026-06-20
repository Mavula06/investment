import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Crown, Mail, Lock, User, AlertCircle, Loader2 } from 'lucide-react';

interface AuthProps {
  onSuccess: () => void;
}

export default function Auth({ onSuccess }: AuthProps) {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, fullName);
      }
      onSuccess();
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.');
      } else if (err.message?.includes('already registered')) {
        setError('An account with this email already exists.');
      } else if (err.message?.includes('Password')) {
        setError('Password must be at least 6 characters long.');
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* Left panel - Decorative */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-gradient-to-br from-dark-800 via-dark-900 to-dark-800">
        <div className="absolute inset-0">
          <div className="glow bg-gold-500 top-1/4 -left-48"></div>
          <div className="glow bg-accent-blue bottom-1/4 -right-48"></div>
          <div className="glow bg-accent-emerald top-3/4 left-1/3"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center mb-8 shadow-lg shadow-gold-500/30">
            <Crown className="w-12 h-12 text-dark-900" />
          </div>
          <h1 className="font-display text-4xl font-bold text-white mb-2">Prestige</h1>
          <p className="text-gold-500 text-xl">Wealth Investments</p>

          <div className="mt-12 max-w-md text-center space-y-6">
            <div className="p-6 rounded-2xl bg-dark-800/50 border border-dark-600 backdrop-blur-sm">
              <p className="text-gray-400 mb-4">Start your investment journey today</p>
              <div className="flex justify-center gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gold-500">25%</p>
                  <p className="text-xs text-gray-500">Max Returns</p>
                </div>
                <div className="w-px bg-dark-600"></div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-accent-emerald">5+</p>
                  <p className="text-xs text-gray-500">Plans</p>
                </div>
                <div className="w-px bg-dark-600"></div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-accent-blue">$100</p>
                  <p className="text-xs text-gray-500">Min Deposit</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - Auth form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center mb-4">
              <Crown className="w-8 h-8 text-dark-900" />
            </div>
            <h1 className="font-display text-2xl font-bold text-gradient-gold">Prestige</h1>
          </div>

          <div className="card">
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl font-bold text-white mb-2">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-gray-500">
                {isLogin ? 'Sign in to manage your investments' : 'Start your investment journey today'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input-field"
                    placeholder="John Doe"
                    required={!isLogin}
                  />
                </div>
              )}

              <div>
                <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                  <Lock className="w-4 h-4" />
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/20 border border-red-500/30">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isLogin ? 'Signing In...' : 'Creating Account...'}
                  </>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-500">
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                  }}
                  className="text-gold-500 font-medium hover:text-gold-400 transition-colors"
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </div>

            {isLogin && (
              <p className="mt-4 text-center text-xs text-gray-600">
                Forgot password?{' '}
                <button className="text-gray-500 hover:text-gold-500 transition-colors">
                  Reset here
                </button>
              </p>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-gray-600">
            By continuing, you agree to our{' '}
            <span className="text-gray-500 hover:text-gold-500 cursor-pointer">
              Terms of Service
            </span>{' '}
            and{' '}
            <span className="text-gray-500 hover:text-gold-500 cursor-pointer">
              Privacy Policy
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
