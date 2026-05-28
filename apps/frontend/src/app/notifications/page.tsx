"use client";

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/utils/apiFetch';
import { Bell, CheckCircle2, Info, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  const { data: user, isLoading } = useCurrentUser();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await apiFetch('/api/notifications');
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (e) {
      console.error('Error fetching notifications', e);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiFetch('/api/notifications/read-all', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'danger': return <ShieldAlert className="w-5 h-5 text-red-500" />;
      default: return <Info className="w-5 h-5 text-sky-500" />;
    }
  };

  if (isLoading || loading) return <div className="min-h-screen bg-[#020204] flex items-center justify-center text-white">Loading...</div>;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-[#020204] text-slate-300 font-sans p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Bell className="w-6 h-6 text-sky-400" />
              Your Notifications
            </h1>
            <p className="text-muted-foreground mt-1">Stay updated with your latest alerts and contest results.</p>
          </div>
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="px-4 py-2 bg-[#121216] hover:bg-[#1a1a20] border border-border rounded-lg text-sm transition-colors text-white"
            >
              Mark all as read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="bg-[#0a0a0c] border border-border rounded-xl p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-sky-500/10 flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-sky-400 opacity-50" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No notifications yet</h3>
            <p className="text-muted-foreground max-w-sm">When you participate in contests or receive alerts, they will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((n) => (
              <div 
                key={n.id} 
                className={`bg-[#0a0a0c] border p-5 rounded-xl flex gap-4 transition-colors ${n.isRead ? 'border-border' : 'border-sky-500/30 bg-sky-500/5'}`}
              >
                <div className="shrink-0 mt-1">{getIcon(n.type)}</div>
                <div className="flex-1">
                  <h4 className={`text-base font-medium mb-1 ${n.isRead ? 'text-white' : 'text-sky-100'}`}>{n.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{n.message}</p>
                  <div className="text-xs text-muted-foreground mt-3 flex items-center gap-2">
                    {new Date(n.createdAt).toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'
                    })}
                    {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-sky-500 ml-2"></span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
