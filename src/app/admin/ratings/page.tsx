'use client';
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { TrendingUp, Search, Edit2, Save, X, AlertTriangle } from 'lucide-react';

interface UserRating {
  id: string;
  name: string;
  avatar: string;
  currentRating: number;
  previousRating: number;
  tier: string;
  contests: number;
  lastContest: string;
}

const tierColors: Record<string, string> = {
  Grandmaster: 'text-red-400',
  Master: 'text-amber-400',
  Expert: 'text-sky-400',
  Specialist: 'text-cyan-400',
  Pupil: 'text-emerald-400',
  Beginner: 'text-slate-400',
};

export default function AdminRatingsPage() {
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [users, setUsers] = useState<UserRating[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetch('/api/admin?action=users')
      .then(res => res.json())
      .then(data => {
        if (!data.error && Array.isArray(data)) {
          const mapped = data.map((u: any) => {
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
              avatar: initials,
              currentRating: rating,
              previousRating: rating, // mock
              tier,
              contests: 0,
              lastContest: 'None'
            };
          });
          setUsers(mapped);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch ratings', err);
        setLoading(false);
      });
  }, []);

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  const startEdit = (user: UserRating) => {
    setEditingId(user.id);
    setEditValue(user.currentRating.toString());
  };

  const handleSave = async (userId: string) => {
    // In a real app, send a POST request to update the user's rating in DB
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, currentRating: parseInt(editValue, 10) || u.currentRating } : u));
    setEditingId(null);
  };

  return (
    <AppLayout currentPath="/admin/ratings" role="admin">
      <div className="px-6 lg:px-8 xl:px-10 py-6 max-w-screen-xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <TrendingUp size={22} className="text-sky-400" />
              Rating Management
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Adjust and manage user ratings manually</p>
          </div>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-300">Manual rating adjustments are logged</p>
            <p className="text-xs text-muted-foreground mt-0.5">All changes are recorded with admin ID, timestamp, and reason for audit purposes.</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-input border border-border rounded-xl px-3 py-2 max-w-sm">
          <Search size={14} className="text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
          />
        </div>

        {/* Ratings table */}
        <div className="bg-card-elevated border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <div className="col-span-3">User</div>
            <div className="col-span-2 text-right">Current Rating</div>
            <div className="col-span-2 text-right hidden md:block">Previous</div>
            <div className="col-span-2 text-right hidden md:block">Change</div>
            <div className="col-span-2 hidden lg:block">Last Contest</div>
            <div className="col-span-1 text-right">Edit</div>
          </div>

          <div className="divide-y divide-border/50">
            {filtered.map((user) => {
              const change = user.currentRating - user.previousRating;
              const isEditing = editingId === user.id;
              return (
                <div key={user.id} className="grid grid-cols-12 gap-3 px-5 py-4 items-center hover:bg-muted/20 transition-colors">
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-xs font-bold text-white">
                      {user.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{user.name}</p>
                      <p className={`text-xs ${tierColors[user.tier]}`}>{user.tier}</p>
                    </div>
                  </div>
                  <div className="col-span-2 text-right">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="input-field w-24 px-2 py-1 text-sm text-right ml-auto"
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm font-bold text-foreground metric-value">{user.currentRating.toLocaleString()}</span>
                    )}
                  </div>
                  <div className="col-span-2 text-right hidden md:block">
                    <span className="text-sm text-muted-foreground metric-value">{user.previousRating.toLocaleString()}</span>
                  </div>
                  <div className="col-span-2 text-right hidden md:block">
                    <span className={`text-sm font-semibold metric-value ${change > 0 ? 'text-emerald-400' : change < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                      {change > 0 ? '+' : ''}{change}
                    </span>
                  </div>
                  <div className="col-span-2 hidden lg:block">
                    <span className="text-xs text-muted-foreground">{user.lastContest}</span>
                  </div>
                  <div className="col-span-1 flex items-center justify-end gap-1">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSave(user.id)}
                          className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                          title="Save"
                        >
                          <Save size={13} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                          title="Cancel"
                        >
                          <X size={13} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startEdit(user)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-sky-400 hover:bg-sky-500/10 transition-colors"
                        title="Edit rating"
                      >
                        <Edit2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
