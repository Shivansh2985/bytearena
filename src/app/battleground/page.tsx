'use client';
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Zap, Trophy, Star, Award, Flame, ArrowUp, ArrowDown, Users, BarChart2, Calendar,  } from 'lucide-react';
import { AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,  } from 'recharts';
import Icon from '@/components/ui/AppIcon';


const ratingHistory = [
  { contest: 'C#1', rating: 1200 }, { contest: 'C#2', rating: 1350 },
  { contest: 'C#3', rating: 1280 }, { contest: 'C#4', rating: 1520 },
  { contest: 'C#5', rating: 1480 }, { contest: 'C#6', rating: 1700 },
  { contest: 'C#7', rating: 1650 }, { contest: 'C#8', rating: 1890 },
  { contest: 'C#9', rating: 1820 }, { contest: 'C#10', rating: 2050 },
  { contest: 'C#11', rating: 2100 }, { contest: 'C#12', rating: 2200 },
  { contest: 'C#13', rating: 2180 }, { contest: 'C#14', rating: 2341 },
];

const skillData = [
  { subject: 'Graphs', A: 88 }, { subject: 'DP', A: 75 },
  { subject: 'Trees', A: 92 }, { subject: 'Strings', A: 68 },
  { subject: 'Math', A: 80 }, { subject: 'Greedy', A: 85 },
];

const badges = [
  { id: 'b1', icon: '⚡', label: 'Speed Demon', desc: 'Solved in under 5 min', earned: true },
  { id: 'b2', icon: '🏆', label: 'Contest King', desc: 'Won 5 contests', earned: true },
  { id: 'b3', icon: '🔥', label: 'On Fire', desc: '30-day streak', earned: true },
  { id: 'b4', icon: '🎯', label: 'Sharpshooter', desc: '90%+ accuracy', earned: false },
  { id: 'b5', icon: '🌟', label: 'Expert', desc: 'Reach 2500 rating', earned: false },
  { id: 'b6', icon: '💎', label: 'Diamond', desc: 'Top 100 globally', earned: false },
];

const recentContests = [
  { id: 'rc1', name: 'ByteBlitz #17', rank: 42, total: 3200, change: +87, date: 'May 12' },
  { id: 'rc2', name: 'AlgoArena #5', rank: 128, total: 1800, change: +34, date: 'May 5' },
  { id: 'rc3', name: 'CodeStorm #11', rank: 89, total: 2400, change: -12, date: 'Apr 28' },
  { id: 'rc4', name: 'ByteBlitz #16', rank: 201, total: 3100, change: +56, date: 'Apr 21' },
];

const topUsers = [
  { rank: 1, name: 'Arjun Mehta', rating: 3210, avatar: 'AM' },
  { rank: 2, name: 'Priya Sharma', rating: 3180, avatar: 'PS' },
  { rank: 3, name: 'Karan Patel', rating: 3050, avatar: 'KP' },
  { rank: 4, name: 'Sneha Rao', rating: 2980, avatar: 'SR' },
  { rank: 5, name: 'Rahul Kumar', rating: 2341, avatar: 'RK', isMe: true },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="tooltip-dark">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-sm font-bold text-sky-300">{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export default function BattlegroundPage() {
  const [activeTab, setActiveTab] = useState<'rating' | 'skills'>('rating');
  const [user, setUser] = useState<any>(null);
  const [topUsersList, setTopUsersList] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  React.useEffect(() => {
    fetch('/api/users/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setUser(data);
        }
      })
      .catch((err) => console.error('Failed to fetch battleground user:', err));

    fetch('/api/users/leaderboard?take=5')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTopUsersList(data);
        }
      })
      .catch((err) => console.error('Failed to fetch global leaderboard for battleground:', err));

    fetch('/api/users/me/analytics')
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setAnalytics(data);
        }
      })
      .catch((err) => console.error('Failed to fetch analytics for battleground:', err));
  }, []);

  const displayName = user?.name || (user?.firstName ? `${user.firstName} ${user.lastName || ''}` : '') || 'User';
  const displayRating = user?.rating ?? 1200;
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'US';

  let tier = 'Beginner';
  if (displayRating >= 2400) tier = 'Master';
  else if (displayRating >= 2100) tier = 'Candidate Master';
  else if (displayRating >= 1900) tier = 'Expert';
  else if (displayRating >= 1600) tier = 'Specialist';
  else if (displayRating >= 1400) tier = 'Pupil';

  const submissionsCount = user?._count?.submissions ?? 0;
  const contestsCount = user?._count?.contests ?? 0;

  const globalRank = contestsCount === 0 
    ? 'Unranked' 
    : `#${Math.max(1, 5000 - Math.round((displayRating - 1200) * 2.5))}`;

  const rankPercent = contestsCount === 0
    ? 'Participate to rank'
    : `Top ${Math.max(0.1, 100 - ((displayRating - 800) / 2200) * 100).toFixed(1)}%`;

  const userRatingHistory = user?.ratingHistory
    ? [...user.ratingHistory].reverse().map((rh: any, idx: number) => ({
        contest: `C#${idx + 1}`,
        rating: rh.ratingAfter || rh.rating
      }))
    : ratingHistory;

  const userSkillData = analytics?.skillRadar || skillData;

  const userBadges = badges.map((b) => {
    const hasEarned = user?.badges?.some((ub: any) => ub.name.toLowerCase() === b.label.toLowerCase()) || 
                      (b.id === 'b1' && submissionsCount > 0) || 
                      (b.id === 'b3' && contestsCount > 0);
    return { ...b, earned: hasEarned };
  });

  const userRecentContests = user?.contests?.map((c: any) => {
    const rh = user?.ratingHistory?.find((h: any) => h.contestId === c.contestId);
    const change = rh ? rh.ratingChange : (c.rank ? Math.max(-50, 100 - c.rank * 3) : 0);
    return {
      id: c.id,
      name: c.contest.title,
      rank: c.rank || 1,
      total: c.contest._count?.participants || 10,
      change: change,
      date: new Date(c.contest.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
  }) || recentContests;

  const mergedLeaderboard = topUsersList.length > 0
    ? topUsersList.map((u: any, idx: number) => ({
        rank: idx + 1,
        name: u.name,
        rating: u.rating,
        avatar: u.avatar,
        isMe: u.id === user?.id
      }))
    : [
        { rank: 1, name: 'Arjun Mehta', rating: 3210, avatar: 'AM', isMe: false },
        { rank: 2, name: 'Priya Sharma', rating: 3180, avatar: 'PS', isMe: false },
        { rank: 3, name: 'Karan Patel', rating: 3050, avatar: 'KP', isMe: false },
        { rank: 4, name: 'Sneha Rao', rating: 2980, avatar: 'SR', isMe: false },
        { rank: 5, name: displayName, rating: displayRating, avatar: initials, isMe: true },
      ].sort((a, b) => b.rating - a.rating).map((u, i) => ({ ...u, rank: i + 1 }));

  const dynamicStats = [
    { label: 'Current Rating', value: displayRating.toLocaleString(), icon: Zap, color: 'sky', change: contestsCount > 0 ? `${user?.ratingHistory?.[0]?.ratingChange >= 0 ? '+' : ''}${user?.ratingHistory?.[0]?.ratingChange || 0} this month` : 'No rating change' },
    { label: 'Global Rank', value: globalRank, icon: Trophy, color: 'amber', change: rankPercent },
    { label: 'Contests Entered', value: contestsCount.toString(), icon: Award, color: 'emerald', change: `${submissionsCount} submissions total` },
    { label: 'Coding Streak', value: `${analytics?.kpis?.find((k: any) => k.label === 'Current Streak')?.value || '0 days'}`, icon: Flame, color: 'orange', change: `Active days: ${analytics?.kpis?.find((k: any) => k.label === 'Active Days')?.value || '0'}` },
  ];

  return (
    <AppLayout currentPath="/battleground" role="student">
      <div className="px-6 lg:px-8 xl:px-10 py-6 max-w-screen-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Zap size={22} className="text-sky-400" />
              Battleground
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Your competitive arena — track rating, rank, and dominance</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-sky-500/10 border border-sky-500/20">
            <Trophy size={14} className="text-amber-400" />
            <span className="text-sm font-bold text-foreground">{tier}</span>
            <span className="text-xs text-muted-foreground">Tier</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {dynamicStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-card-elevated border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={14} className={`text-${stat.color}-400`} />
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <p className="text-2xl font-bold text-foreground metric-value">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </div>
            );
          })}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Rating chart */}
          <div className="xl:col-span-2 bg-card-elevated border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground">Rating Progression</h2>
              <div className="flex gap-1">
                {(['rating', 'skills'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === tab
                        ? 'bg-primary text-white' :'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                    }`}
                  >
                    {tab === 'rating' ? 'Rating' : 'Skills'}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === 'rating' ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={userRatingHistory}>
                  <defs>
                    <linearGradient id="ratingGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="contest" tick={{ fill: '#6B7A8A', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6B7A8A', fontSize: 10 }} axisLine={false} tickLine={false} domain={[1000, 2600]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="rating" stroke="#0EA5E9" strokeWidth={2} fill="url(#ratingGrad)" dot={{ fill: '#0EA5E9', r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={userSkillData}>
                  <PolarGrid stroke="rgba(255,255,255,0.06)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#6B7A8A', fontSize: 11 }} />
                  <Radar name="Skills" dataKey="A" stroke="#0EA5E9" fill="#0EA5E9" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top users */}
          <div className="bg-card-elevated border border-border rounded-xl p-5">
            <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users size={15} className="text-sky-400" />
              Global Leaderboard
            </h2>
            <div className="space-y-2">
              {mergedLeaderboard.map((userObj) => (
                <div
                  key={userObj.rank}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    userObj.isMe
                      ? 'bg-sky-500/10 border border-sky-500/20' : 'hover:bg-muted/30'
                  }`}
                >
                  <span className={`text-sm font-bold w-5 text-center ${
                    userObj.rank === 1 ? 'text-amber-400' : userObj.rank === 2 ? 'text-slate-300' : userObj.rank === 3 ? 'text-amber-600' : 'text-muted-foreground'
                  }`}>
                    {userObj.rank}
                  </span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    userObj.isMe ? 'bg-gradient-to-br from-sky-500 to-cyan-600' : 'bg-gradient-to-br from-slate-600 to-slate-700'
                  }`}>
                    {userObj.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${userObj.isMe ? 'text-sky-300' : 'text-foreground'}`}>
                      {userObj.name} {userObj.isMe && '(You)'}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-foreground metric-value">{userObj.rating.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent contests + badges */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Recent contests */}
          <div className="bg-card-elevated border border-border rounded-xl p-5">
            <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <BarChart2 size={15} className="text-sky-400" />
              Recent Contests
            </h2>
            <div className="space-y-2">
              {userRecentContests.map((c: any) => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors cursor-pointer">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Calendar size={10} className="text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{c.date}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground metric-value">#{c.rank}</p>
                    <p className="text-xs text-muted-foreground">of {c.total.toLocaleString()}</p>
                  </div>
                  <div className={`flex items-center gap-0.5 text-xs font-semibold ${c.change > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {c.change > 0 ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                    {Math.abs(c.change)}
                  </div>
                </div>
              ))}
            </div>
          </div>
 
          {/* Badges */}
          <div className="bg-card-elevated border border-border rounded-xl p-5">
            <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <Star size={15} className="text-amber-400" />
              Achievement Badges
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {userBadges.map((badge) => (
                <div
                  key={badge.id}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all ${
                    badge.earned
                      ? 'border-sky-500/20 bg-sky-500/5 hover:bg-sky-500/10' :'border-border bg-muted/20 opacity-40 grayscale'
                  }`}
                >
                  <span className="text-2xl">{badge.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{badge.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{badge.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
