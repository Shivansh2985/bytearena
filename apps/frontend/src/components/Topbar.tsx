'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, Bell, Search, Zap, ChevronDown } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useSocket } from '@/providers/SocketProvider';
import { apiFetch } from '@/lib/api';

interface TopbarProps {
  onMenuClick: () => void;
  sidebarCollapsed: boolean;
  role?: 'student' | 'admin';
  user?: any;
}

export default function Topbar({ onMenuClick, role = 'student', user }: TopbarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const { socket } = useSocket();

  useEffect(() => {
    if (user?.id) {
      apiFetch('/api/notifications')
        .then(res => res.json())
        .then(data => {
          if (data.notifications) {
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount || 0);
          }
        })
        .catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    if (socket && user?.id) {
      const handleNotif = (notif: any) => {
        setNotifications(prev => [notif, ...prev]);
        setUnreadCount(prev => prev + 1);
      };
      trackedOn(socket, 'notification', handleNotif);
      return () => {
        trackedOff(socket, 'notification', handleNotif);
      };
    }
  }, [socket, user]);

  const requestPushPermission = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Push notifications are not supported in your browser.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('Permission not granted for push notifications.');
        return;
      }

      const registration = await navigator.serviceWorker.register('/service-worker.js');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      });

      await apiFetch('/api/notifications/push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });
      alert('Push notifications enabled!');
    } catch (e) {
      console.error('Error setting up push notifications:', e);
    }
  };

  const markAllRead = async () => {
    try {
      await apiFetch('/api/notifications/read-all', { method: 'POST' });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error('Error marking all as read', e);
    }
  };
  
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
                <button onClick={markAllRead} className="text-xs text-primary hover:text-sky-300 transition-colors">Mark all read</button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 && (
                  <div className="p-4 text-center text-sm text-muted-foreground">No notifications.</div>
                )}
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer ${!n.isRead ? 'bg-primary/5' : ''}`}
                  >
                    <p className="text-xs font-semibold text-foreground mb-0.5">{n.title}</p>
                    <p className="text-sm text-foreground leading-snug">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 text-center flex flex-col gap-2">
                <button onClick={requestPushPermission} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Enable Browser Push Alerts</button>
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