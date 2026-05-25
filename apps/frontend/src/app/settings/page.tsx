'use client';
import { apiFetch } from '@/lib/api';
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Settings, Bell, Shield, Palette, User, Eye, EyeOff, Save, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState({
    contestStart: true, contestEnd: true, rankChange: false, newBadge: true, weeklyDigest: true,
  });
  const [privacy, setPrivacy] = useState({ showProfile: true, showRating: true, showSubmissions: false });
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    bio: '',
  });
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  React.useEffect(() => {
    apiFetch('/api/users/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setUser(data);
          const nameParts = (data.name || '').split(' ');
          setFormData({
            firstName: data.firstName || nameParts[0] || '',
            lastName: data.lastName || nameParts.slice(1).join(' ') || '',
            username: data.username || data.email?.split('@')[0] || '',
            bio: data.bio || '',
          });
        }
      })
      .catch((err) => console.error('Failed to fetch settings user data:', err));
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setSaveStatus('idle');
    try {
      const res = await apiFetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!data.error) {
        setUser(data);
        setSaveStatus('success');
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-muted'}`}
      role="switch"
      aria-checked={checked}
    >
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );

  return (
    <AppLayout currentPath="/settings" role="student">
      <div className="px-6 lg:px-8 xl:px-10 py-6 max-w-screen-lg mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings size={22} className="text-sky-400" />
            Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your account preferences and security</p>
        </div>

        {/* Profile settings */}
        <div className="bg-card-elevated border border-border rounded-xl p-5">
          <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <User size={15} className="text-sky-400" />
            Profile Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="input-field w-full px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="input-field w-full px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="input-field w-full px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="input-field w-full px-3 py-2.5 text-sm opacity-60 cursor-not-allowed"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
                className="input-field w-full px-3 py-2.5 text-sm resize-none"
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={loading}
              className="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={14} />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            {saveStatus === 'success' && (
              <span className="text-xs text-emerald-400 font-medium">Changes saved successfully!</span>
            )}
            {saveStatus === 'error' && (
              <span className="text-xs text-red-400 font-medium">Failed to save changes.</span>
            )}
          </div>
        </div>

        {/* Password */}
        <div className="bg-card-elevated border border-border rounded-xl p-5">
          <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield size={15} className="text-sky-400" />
            Change Password
          </h2>
          <div className="space-y-3 max-w-sm">
            {[
              { label: 'Current Password', show: showCurrentPwd, toggle: () => setShowCurrentPwd(!showCurrentPwd) },
              { label: 'New Password', show: false, toggle: () => {} },
              { label: 'Confirm New Password', show: false, toggle: () => {} },
            ].map((field) => (
              <div key={field.label}>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">{field.label}</label>
                <div className="relative">
                  <input
                    type={field.show ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="input-field w-full px-3 py-2.5 text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={field.toggle}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {field.show ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-4 btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
            <Shield size={14} />
            Update Password
          </button>
        </div>

        {/* Notifications */}
        <div className="bg-card-elevated border border-border rounded-xl p-5">
          <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <Bell size={15} className="text-sky-400" />
            Notifications
          </h2>
          <div className="space-y-4">
            {[
              { key: 'contestStart', label: 'Contest starting soon', desc: 'Get notified 30 min before a contest begins' },
              { key: 'contestEnd', label: 'Contest ending soon', desc: 'Reminder when a contest has 15 min left' },
              { key: 'rankChange', label: 'Rank changes', desc: 'Notify when your global rank changes' },
              { key: 'newBadge', label: 'New achievements', desc: 'When you earn a new badge or milestone' },
              { key: 'weeklyDigest', label: 'Weekly digest', desc: 'Summary of your weekly performance' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Toggle
                  checked={notifications[item.key as keyof typeof notifications]}
                  onChange={() => setNotifications((prev) => ({ ...prev, [item.key]: !prev[item.key as keyof typeof notifications] }))}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Privacy */}
        <div className="bg-card-elevated border border-border rounded-xl p-5">
          <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <Eye size={15} className="text-sky-400" />
            Privacy
          </h2>
          <div className="space-y-4">
            {[
              { key: 'showProfile', label: 'Public profile', desc: 'Allow others to view your profile page' },
              { key: 'showRating', label: 'Show rating', desc: 'Display your rating on the leaderboard' },
              { key: 'showSubmissions', label: 'Public submissions', desc: 'Allow others to view your code submissions' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Toggle
                  checked={privacy[item.key as keyof typeof privacy]}
                  onChange={() => setPrivacy((prev) => ({ ...prev, [item.key]: !prev[item.key as keyof typeof privacy] }))}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-card-elevated border border-border rounded-xl p-5">
          <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <Palette size={15} className="text-sky-400" />
            Appearance
          </h2>
          <div className="flex gap-3">
            {(['dark', 'light'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                  (mounted ? theme : 'dark') === t
                    ? 'border-primary bg-primary/10 text-sky-300' :'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {t === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                <span className="capitalize">{t} Mode</span>
              </button>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-danger/5 border border-danger/20 rounded-xl p-5">
          <h2 className="text-base font-semibold text-danger mb-2">Danger Zone</h2>
          <p className="text-xs text-muted-foreground mb-4">These actions are irreversible. Please be certain.</p>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 rounded-lg border border-danger/30 text-danger text-sm font-medium hover:bg-danger/10 transition-colors">
              Delete Account
            </button>
            <button className="px-4 py-2 rounded-lg border border-border text-muted-foreground text-sm font-medium hover:text-foreground transition-colors">
              Export Data
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
