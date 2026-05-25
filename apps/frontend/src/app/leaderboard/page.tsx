'use client';
import { apiFetch } from '@/lib/api';
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Trophy, Search, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  rating: number;
  change: number;
  contests: number;
  solved: number;
  country: string;
  tier: string;
  isMe?: boolean;
}

const staticLeaderboardData = [
  { rank: 1, name: 'Arjun Mehta', avatar: 'AM', rating: 3210, change: 45, contests: 142, solved: 2340, country: '🇮🇳', tier: 'Grandmaster' },
  { rank: 2, name: 'Priya Sharma', avatar: 'PS', rating: 3180, change: -12, contests: 138, solved: 2210, country: '🇮🇳', tier: 'Grandmaster' },
  { rank: 3, name: 'Karan Patel', avatar: 'KP', rating: 3050, change: 78, contests: 121, solved: 1980, country: '🇮🇳', tier: 'Master' },
  { rank: 4, name: 'Sneha Rao', avatar: 'SR', rating: 2980, change: 0, contests: 115, solved: 1870, country: '🇮🇳', tier: 'Master' },
  { rank: 5, name: 'Vikram Singh', avatar: 'VS', rating: 2890, change: 34, contests: 108, solved: 1760, country: '🇮🇳', tier: 'Master' },
  { rank: 6, name: 'Ananya Gupta', avatar: 'AG', rating: 2780, change: -23, contests: 99, solved: 1640, country: '🇮🇳', tier: 'Expert' },
  { rank: 7, name: 'Rohan Joshi', avatar: 'RJ', rating: 2650, change: 56, contests: 94, solved: 1520, country: '🇮🇳', tier: 'Expert' },
  { rank: 8, name: 'Meera Nair', avatar: 'MN', rating: 2540, change: 12, contests: 88, solved: 1430, country: '🇮🇳', tier: 'Expert' },
  { rank: 9, name: 'Aditya Kumar', avatar: 'AK', rating: 2420, change: -8, contests: 82, solved: 1310, country: '🇮🇳', tier: 'Expert' },
];

const tierColors: Record<string, string> = {
  Grandmaster: 'text-red-400',
  Master: 'text-amber-400',
  Expert: 'text-sky-400',
  Specialist: 'text-cyan-400',
  Pupil: 'text-emerald-400',
  Beginner: 'text-slate-400',
};

export default function LeaderboardPage() {
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<'all' | 'month' | 'week'>('all');
  const [user, setUser] = useState<any>(null);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    apiFetch('/api/users/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setUser(data);
        }
      })
      .catch((err) => console.error('Failed to fetch leaderboard user data:', err));
  }, []);

  React.useEffect(() => {
    apiFetch('/api/users/leaderboard')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const mapped = data.map((u: any, idx: number) => ({
            rank: idx + 1,
            name: u.name,
            avatar: u.avatar,
            rating: u.rating,
            change: u.change || 0,
            contests: u.contests || 0,
            solved: u.solved || 0,
            country: u.country || '🇮🇳',
            tier: u.tier,
            isMe: u.id === user?.id,
          }));
          setLeaderboardData(mapped);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch leaderboard:', err);
        setLoading(false);
      });
  }, [user]);

  const filtered = leaderboardData.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  // Top 3 for podium
  const top1 = filtered.find(u => u.rank === 1) || { rank: 1, name: 'Arjun Mehta', avatar: 'AM', rating: 3210, tier: 'Master' };
  const top2 = filtered.find(u => u.rank === 2) || { rank: 2, name: 'Priya Sharma', avatar: 'PS', rating: 3180, tier: 'Master' };
  const top3 = filtered.find(u => u.rank === 3) || { rank: 3, name: 'Karan Patel', avatar: 'KP', rating: 3050, tier: 'Master' };
  const podiumList = [top2, top1, top3];

  return (
    <AppLayout currentPath="/leaderboard" role="student">
      <div className="px-6 lg:px-8 xl:px-10 py-6 max-w-screen-xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Trophy size={22} className="text-amber-400" />
              Leaderboard
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Global ranking of ByteArena competitors</p>
          </div>
        </div>

        {/* Top 3 podium */}
        <div className="grid grid-cols-3 gap-4">
          {podiumList.map((user, i) => {
            const podiumRank = i === 0 ? 2 : i === 1 ? 1 : 3;
            const heights = ['h-24', 'h-32', 'h-20'];
            const medals = ['🥈', '🥇', '🥉'];
            return (
              <div key={user.rank} className={`flex flex-col items-center gap-2 bg-card-elevated border border-border rounded-xl p-4 ${i === 1 ? 'border-amber-500/30 bg-amber-500/5' : ''}`}>
                <span className="text-2xl">{medals[i]}</span>
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white text-sm font-bold`}>
                  {user.avatar}
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">{user.name}</p>
                  <p className={`text-xs font-bold metric-value ${tierColors[user.tier]}`}>{user.rating.toLocaleString()}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 bg-input border border-border rounded-xl px-3 py-2 flex-1 max-w-sm">
            <Search size={14} className="text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
            />
          </div>
          <div className="flex gap-1 bg-muted/30 border border-border rounded-xl p-1">
            {(['all', 'month', 'week'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                  period === p ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p === 'all' ? 'All Time' : p === 'month' ? 'This Month' : 'This Week'}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-card-elevated border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <div className="col-span-1">Rank</div>
            <div className="col-span-4">User</div>
            <div className="col-span-2 text-right">Rating</div>
            <div className="col-span-2 text-right">Change</div>
            <div className="col-span-1 text-right hidden lg:block">Contests</div>
            <div className="col-span-2 text-right hidden lg:block">Solved</div>
          </div>

          <div className="divide-y divide-border/50">
            {filtered.map((user) => (
              <div
                key={user.rank}
                className={`grid grid-cols-12 gap-4 px-5 py-3.5 items-center hover:bg-muted/20 transition-colors cursor-pointer ${
                  user.isMe ? 'bg-sky-500/5 border-l-2 border-sky-500' : ''
                }`}
              >
                <div className="col-span-1">
                  <span className={`text-sm font-bold metric-value ${
                    user.rank === 1 ? 'text-amber-400' : user.rank === 2 ? 'text-slate-300' : user.rank === 3 ? 'text-amber-600' : 'text-muted-foreground'
                  }`}>
                    {user.rank <= 3 ? ['🥇', '🥈', '🥉'][user.rank - 1] : `#${user.rank}`}
                  </span>
                </div>
                <div className="col-span-4 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                    user.isMe ? 'bg-gradient-to-br from-sky-500 to-cyan-600' : 'bg-gradient-to-br from-slate-600 to-slate-700'
                  }`}>
                    {user.avatar}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${user.isMe ? 'text-sky-300' : 'text-foreground'}`}>
                      {user.name} {user.isMe && '(You)'}
                    </p>
                    <p className={`text-xs ${tierColors[user.tier]}`}>{user.tier}</p>
                  </div>
                  <span className="text-sm">{user.country}</span>
                </div>
                <div className="col-span-2 text-right">
                  <span className="text-sm font-bold text-foreground metric-value">{user.rating.toLocaleString()}</span>
                </div>
                <div className="col-span-2 text-right">
                  <div className={`flex items-center justify-end gap-1 text-xs font-semibold ${
                    user.change > 0 ? 'text-emerald-400' : user.change < 0 ? 'text-red-400' : 'text-muted-foreground'
                  }`}>
                    {user.change > 0 ? <TrendingUp size={11} /> : user.change < 0 ? <TrendingDown size={11} /> : <Minus size={11} />}
                    {user.change !== 0 ? Math.abs(user.change) : '—'}
                  </div>
                </div>
                <div className="col-span-1 text-right hidden lg:block">
                  <span className="text-sm text-muted-foreground">{user.contests}</span>
                </div>
                <div className="col-span-2 text-right hidden lg:block">
                  <span className="text-sm text-muted-foreground metric-value">{user.solved.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
