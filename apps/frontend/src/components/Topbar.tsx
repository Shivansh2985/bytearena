'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, Bell, Search, Zap, ChevronDown } from 'lucide-react';
import { signOut } from 'next-auth/react';

interface TopbarProps {
  onMenuClick: () => void;
  sidebarCollapsed: boolean;
  role?: 'student' | 'admin';
  user?: any;
}

const notifications = [
  { id: 'notif-1', type: 'contest', message: 'ByteBlitz Weekly #18 starts in 2 hours', time: '2h ago', unread: true },
  { id: 'notif-2', type: 'rank', message: 'Your rank improved to #342 globally', time: '5h ago', unread: true },
  { id: 'notif-3', type: 'badge', message: 'Achievement unlocked: "Speed Demon"', time: '1d ago', unread: true },
  { id: 'notif-4', type: 'contest', message: 'Results published: CodeStorm #12', time: '2d ago', unread: false },
];

export default function Topbar({ onMenuClick, role = 'student', user }: TopbarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const unreadCount = notifications.filter((n) => n.unread).length;
  
  const displayName = user?.name || (user?.firstName ? `${user.firstName} ${user.lastName || ''}` : '') || 'User';
  const displayRating = user?.rating ?? 1200;
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'US';

  const profileLinks = role === 'admin'
    ? [
        { label: 'Admin Dashboard', href: '/admin/dashboard' },
        { label: 'Settings', href: '/admin/settings' },
      ]
    : [
        { label: 'Profile', href: '/profile' },
        { label: 'Settings', href: '/settings' },
        { label: 'Battleground', href: '/battleground' },
      ];

  return (
    <header className="h-16 glass border-b border-border flex items-center justify-between px-4 lg:px-6 flex-shrink-0 z-20">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        {/* Search */}
        <div className="hidden sm:flex items-center gap-2 bg-input border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground hover:border-primary/40 transition-colors cursor-pointer group w-56 xl:w-72">
          <Search size={14} className="group-hover:text-primary transition-colors" />
          <span className="text-xs">Search contests, problems...</span>
          <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded border border-border font-mono">⌘K</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Rating chip */}
        {role === 'student' && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <Zap size={12} className="text-sky-300" />
            <span className="text-xs font-semibold text-sky-300 metric-value">{displayRating.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">Rating</span>
          </div>
        )}
        {role === 'admin' && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <span className="text-xs font-semibold text-amber-300">Admin Mode</span>
          </div>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
            className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
            aria-label={`Notifications — ${unreadCount} unread`}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-12 w-80 glass border border-border rounded-xl shadow-2xl z-50 fade-in overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Notifications</span>
                <button className="text-xs text-primary hover:text-sky-300 transition-colors">Mark all read</button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer ${n.unread ? 'bg-primary/5' : ''}`}
                  >
                    <p className="text-sm text-foreground leading-snug">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 text-center">
                <button className="text-xs text-primary hover:text-sky-300 transition-colors">View all notifications</button>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-muted/30 transition-colors"
          >
            {user?.imageUrl || user?.image ? (
              <img src={user.imageUrl || user.image} alt={displayName} className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                role === 'admin' ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-sky-500 to-cyan-600'
              }`}>
                {role === 'admin' ? 'AD' : initials}
              </div>
            )}
            <span className="hidden md:block text-sm font-medium text-foreground">
              {role === 'admin' ? 'Admin' : displayName}
            </span>
            <ChevronDown size={14} className="text-muted-foreground" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-12 w-48 glass border border-border rounded-xl shadow-2xl z-50 fade-in overflow-hidden">
              {profileLinks.map((item) => (
                <Link
                  key={`profile-${item.label}`}
                  href={item.href}
                  className="block px-4 py-2.5 text-sm text-foreground hover:bg-muted/30 transition-colors"
                  onClick={() => setProfileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-border">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    signOut({ callbackUrl: '/sign-up-login' });
                  }}
                  className="w-full text-left block px-4 py-2.5 text-sm text-danger hover:bg-danger/10 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}