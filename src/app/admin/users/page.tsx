'use client';
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Users, Search, Shield, ShieldOff, Eye, TrendingUp, CheckCircle, XCircle, AlertTriangle, Mail,  } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  rating: number;
  rank: number;
  contests: number;
  status: 'active' | 'blocked' | 'suspended';
  joinDate: string;
  lastActive: string;
  tier: string;
}

const statusConfig = {
  active: { label: 'Active', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle },
  blocked: { label: 'Blocked', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: XCircle },
  suspended: { label: 'Suspended', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: AlertTriangle },
};

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetch('/api/admin?action=users')
      .then(res => res.json())
      .then(data => {
        if (!data.error && Array.isArray(data)) {
          const mapped = data.map((u: any, index: number) => {
            const displayName = u.name || (u.firstName ? `${u.firstName} ${u.lastName || ''}` : '') || 'Unknown';
            const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'US';
            const rating = u.rating ?? 1200;
            let tier = 'Beginner';
            if (rating >= 2400) tier = 'Grandmaster';
            else if (rating >= 2100) tier = 'Master';
            else if (rating >= 1900) tier = 'Expert';
            else if (rating >= 1600) tier = 'Specialist';
            else if (rating >= 1400) tier = 'Pupil';

            return {
              id: u.id,
              name: displayName,
              email: u.email || 'No email',
              avatar: initials,
              rating: rating,
              rank: index + 1,
              contests: 0, // placeholder since we don't fetch counts here yet
              status: 'active' as const,
              joinDate: new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
              lastActive: 'Now',
              tier: tier
            };
          });
          setUsers(mapped);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch admin users', err);
        setLoading(false);
      });
  }, []);

  const filtered = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <AppLayout currentPath="/admin/users" role="admin">
      <div className="px-6 lg:px-8 xl:px-10 py-6 max-w-screen-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users size={22} className="text-sky-400" />
              User Management
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage all registered users, ratings, and access</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: users.length.toString(), color: 'sky' },
            { label: 'Active', value: users.filter((u) => u.status === 'active').length.toString(), color: 'emerald' },
            { label: 'Suspended', value: users.filter((u) => u.status === 'suspended').length.toString(), color: 'amber' },
            { label: 'Blocked', value: users.filter((u) => u.status === 'blocked').length.toString(), color: 'red' },
          ].map((s) => (
            <div key={s.label} className="bg-card-elevated border border-border rounded-xl p-4 text-center">
              <p className={`text-2xl font-bold metric-value text-${s.color}-400`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 bg-input border border-border rounded-xl px-3 py-2 flex-1 max-w-sm">
            <Search size={14} className="text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
            />
          </div>
          <div className="flex gap-1 bg-muted/30 border border-border rounded-xl p-1">
            {['all', 'active', 'suspended', 'blocked'].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                  statusFilter === f ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* User table */}
          <div className={`${selectedUser ? 'xl:col-span-2' : 'xl:col-span-3'} bg-card-elevated border border-border rounded-xl overflow-hidden`}>
            <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="col-span-4">User</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2 hidden md:block text-right">Rating</div>
              <div className="col-span-2 hidden lg:block">Last Active</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            <div className="divide-y divide-border/50">
              {filtered.map((user) => {
                const cfg = statusConfig[user.status];
                const Icon = cfg.icon;
                return (
                  <div
                    key={user.id}
                    className={`grid grid-cols-12 gap-3 px-5 py-3.5 items-center hover:bg-muted/20 transition-colors cursor-pointer ${selectedUser?.id === user.id ? 'bg-sky-500/5' : ''}`}
                    onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
                  >
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {user.avatar}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg border ${cfg.bg} ${cfg.color}`}>
                        <Icon size={10} />
                        {cfg.label}
                      </span>
                    </div>
                    <div className="col-span-2 hidden md:block text-right">
                      <span className="text-sm font-bold text-foreground metric-value">{user.rating.toLocaleString()}</span>
                    </div>
                    <div className="col-span-2 hidden lg:block">
                      <span className="text-xs text-muted-foreground">{user.lastActive}</span>
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-1">
                      {user.status === 'active' ? (
                        <button
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Block user"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ShieldOff size={13} />
                        </button>
                      ) : (
                        <button
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                          title="Unblock user"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Shield size={13} />
                        </button>
                      )}
                      <button className="p-1.5 rounded-lg text-muted-foreground hover:text-sky-400 hover:bg-sky-500/10 transition-colors" title="View details">
                        <Eye size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* User detail panel */}
          {selectedUser && (
            <div className="bg-card-elevated border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center text-white font-bold">
                  {selectedUser.avatar}
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground">{selectedUser.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Rating', value: selectedUser.rating.toLocaleString() },
                  { label: 'Global Rank', value: `#${selectedUser.rank}` },
                  { label: 'Contests', value: selectedUser.contests },
                  { label: 'Tier', value: selectedUser.tier },
                  { label: 'Joined', value: selectedUser.joinDate },
                  { label: 'Last Active', value: selectedUser.lastActive },
                ].map((item) => (
                  <div key={item.label} className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-2 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</p>
                {selectedUser.status === 'active' ? (
                  <>
                    <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-300 text-sm font-medium hover:bg-amber-500/10 transition-colors">
                      <AlertTriangle size={14} />
                      Suspend User
                    </button>
                    <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors">
                      <ShieldOff size={14} />
                      Block User
                    </button>
                  </>
                ) : (
                  <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-sm font-medium hover:bg-emerald-500/10 transition-colors">
                    <Shield size={14} />
                    Unblock User
                  </button>
                )}
                <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border text-muted-foreground text-sm font-medium hover:text-foreground transition-colors">
                  <Mail size={14} />
                  Send Message
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-sky-500/20 bg-sky-500/5 text-sky-300 text-sm font-medium hover:bg-sky-500/10 transition-colors">
                  <TrendingUp size={14} />
                  Adjust Rating
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
