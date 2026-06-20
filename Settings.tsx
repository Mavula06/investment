import { useState } from 'react';
import { Profile } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import {
  User,
  Mail,
  Phone,
  Shield,
  Bell,
  Lock,
  Palette,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface SettingsProps {
  profile: Profile;
}

export default function Settings({ profile }: SettingsProps) {
  const { updateProfile } = useAuth();
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await updateProfile({
        full_name: fullName,
        phone: phone || null,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to update profile. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const settingsSections = [
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        { label: 'Email notifications', enabled: true },
        { label: 'Push notifications', enabled: true },
        { label: 'Investment updates', enabled: true },
        { label: 'Marketing emails', enabled: false },
      ],
    },
    {
      title: 'Security',
      icon: Shield,
      items: [
        { label: 'Two-factor authentication', enabled: false },
        { label: 'Login alerts', enabled: true },
        { label: 'Device tracking', enabled: true },
      ],
    },
    {
      title: 'Preferences',
      icon: Palette,
      items: [
        { label: 'Dark mode', enabled: true },
        { label: 'Compact view', enabled: false },
        { label: 'Sound effects', enabled: true },
      ],
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Profile Section */}
      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-xl bg-gold-500/20">
            <User className="w-6 h-6 text-gold-500" />
          </div>
          <div>
            <h2 className="font-display font-bold text-xl text-white">Profile Information</h2>
            <p className="text-sm text-gray-500">Update your personal details</p>
          </div>
        </div>

        <div className="space-y-4">
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
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <Mail className="w-4 h-4" />
              Email Address
            </label>
            <input
              type="email"
              value={profile.email || ''}
              disabled
              className="input-field opacity-60 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <Phone className="w-4 h-4" />
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-field"
              placeholder="Enter your phone number"
            />
          </div>
        </div>

        {success && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-accent-emerald/20 border border-accent-emerald/30 mt-4">
            <CheckCircle className="w-5 h-5 text-accent-emerald" />
            <p className="text-sm text-accent-emerald">Profile updated successfully!</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/20 border border-red-500/30 mt-4">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            disabled={loading}
            className="btn-primary flex-1"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Settings Sections */}
      {settingsSections.map((section, idx) => {
        const Icon = section.icon;
        return (
          <div
            key={section.title}
            className="card animate-fade-in"
            style={{ animationDelay: `${(idx + 1) * 100}ms` }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-xl bg-dark-700">
                <Icon className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <h2 className="font-display font-bold text-xl text-white">{section.title}</h2>
                <p className="text-sm text-gray-500">Manage your preferences</p>
              </div>
            </div>

            <div className="space-y-3">
              {section.items.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between p-4 rounded-xl bg-dark-700/50 border border-dark-600"
                >
                  <span className="text-gray-300">{item.label}</span>
                  <button
                    className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                      item.enabled ? 'bg-gold-500' : 'bg-dark-600'
                    }`}
                    title={item.enabled ? 'Disable' : 'Enable'}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${
                        item.enabled ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Account Security */}
      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-xl bg-dark-700">
            <Lock className="w-6 h-6 text-gray-400" />
          </div>
          <div>
            <h2 className="font-display font-bold text-xl text-white">Account</h2>
            <p className="text-sm text-gray-500">Manage your account settings</p>
          </div>
        </div>

        <div className="space-y-3">
          <button className="w-full flex items-center justify-between p-4 rounded-xl bg-dark-700/50 border border-dark-600 hover:border-dark-500 transition-colors">
            <span className="text-gray-300">Change Password</span>
            <span className="text-gray-500">{'>'}</span>
          </button>
          <button className="w-full flex items-center justify-between p-4 rounded-xl bg-dark-700/50 border border-dark-600 hover:border-dark-500 transition-colors">
            <span className="text-gray-300">Connected Accounts</span>
            <span className="text-gray-500">{'>'}</span>
          </button>
          <button className="w-full flex items-center justify-between p-4 rounded-xl bg-dark-700/50 border border-dark-600 hover:border-dark-500 transition-colors">
            <span className="text-gray-300">Download My Data</span>
            <span className="text-gray-500">{'>'}</span>
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-dark-600">
          <button
            onClick={handleSignOut}
            className="w-full p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
