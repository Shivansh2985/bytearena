'use client';
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Settings, Shield, Save, Eye, EyeOff, AlertTriangle, Users, Swords } from 'lucide-react';

export default function AdminSettingsPage() {
  const [showApiKey, setShowApiKey] = useState(false);

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

  const [settings, setSettings] = useState({
    maintenanceMode: false,
    registrationOpen: true,
    emailNotifications: true,
    autoRatingUpdate: true,
    plagiarismDetection: true,
    proxyDetection: false,
  });

  const toggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <AppLayout currentPath="/admin/settings" role="admin">
      <div className="px-6 lg:px-8 xl:px-10 py-6 max-w-screen-lg mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings size={22} className="text-sky-400" />
            Admin Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Platform configuration and system settings</p>
        </div>

        {/* Platform settings */}
        <div className="bg-card-elevated border border-border rounded-xl p-5">
          <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <Swords size={15} className="text-sky-400" />
            Platform Settings
          </h2>
          <div className="space-y-4">
            {[
              { key: 'maintenanceMode', label: 'Maintenance Mode', desc: 'Take the platform offline for maintenance' },
              { key: 'registrationOpen', label: 'Open Registration', desc: 'Allow new users to register' },
              { key: 'autoRatingUpdate', label: 'Auto Rating Updates', desc: 'Automatically update ratings after contests end' },
              { key: 'plagiarismDetection', label: 'Plagiarism Detection', desc: 'Enable code similarity detection for all contests' },
              { key: 'proxyDetection', label: 'Proxy/VPN Detection', desc: 'Flag submissions from proxy or VPN connections' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Toggle
                  checked={settings[item.key as keyof typeof settings]}
                  onChange={() => toggle(item.key as keyof typeof settings)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Platform info */}
        <div className="bg-card-elevated border border-border rounded-xl p-5">
          <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users size={15} className="text-sky-400" />
            Platform Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Platform Name', value: 'ByteArena' },
              { label: 'Version', value: 'v2.6.0' },
              { label: 'Admin Email', value: 'admin@bytearena.dev' },
              { label: 'Support Email', value: 'support@bytearena.dev' },
            ].map((field) => (
              <div key={field.label}>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">{field.label}</label>
                <input type="text" defaultValue={field.value} className="input-field w-full px-3 py-2.5 text-sm" />
              </div>
            ))}
          </div>
          <button className="mt-4 btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
            <Save size={14} />
            Save Changes
          </button>
        </div>

        {/* API Keys */}
        <div className="bg-card-elevated border border-border rounded-xl p-5">
          <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield size={15} className="text-sky-400" />
            API Configuration
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Judge0 API Key</label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  defaultValue="j0_api_key_placeholder_here"
                  className="input-field w-full px-3 py-2.5 text-sm pr-10 font-mono"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-danger/5 border border-danger/20 rounded-xl p-5">
          <h2 className="text-base font-semibold text-danger mb-2 flex items-center gap-2">
            <AlertTriangle size={15} />
            Danger Zone
          </h2>
          <p className="text-xs text-muted-foreground mb-4">These actions are irreversible and affect the entire platform.</p>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 rounded-lg border border-danger/30 text-danger text-sm font-medium hover:bg-danger/10 transition-colors">
              Reset All Ratings
            </button>
            <button className="px-4 py-2 rounded-lg border border-danger/30 text-danger text-sm font-medium hover:bg-danger/10 transition-colors">
              Clear All Submissions
            </button>
            <button className="px-4 py-2 rounded-lg border border-border text-muted-foreground text-sm font-medium hover:text-foreground transition-colors">
              Export Platform Data
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
