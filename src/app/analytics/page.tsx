'use client';
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { BarChart, Bar, AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,  } from 'recharts';
import { Code2, Target, Clock, Flame, Award, Activity, BarChart2 } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


const participationData = [
  { month: 'Nov', contests: 4 }, { month: 'Dec', contests: 6 },
  { month: 'Jan', contests: 5 }, { month: 'Feb', contests: 8 },
  { month: 'Mar', contests: 7 }, { month: 'Apr', contests: 10 },
  { month: 'May', contests: 9 },
];

const accuracyData = [
  { week: 'W1', accuracy: 62 }, { week: 'W2', accuracy: 68 },
  { week: 'W3', accuracy: 65 }, { week: 'W4', accuracy: 72 },
  { week: 'W5', accuracy: 70 }, { week: 'W6', accuracy: 75 },
  { week: 'W7', accuracy: 78 }, { week: 'W8', accuracy: 68 },
];

const languageData = [
  { name: 'C++', value: 58, color: '#0EA5E9' },
  { name: 'Python', value: 24, color: '#06B6D4' },
  { name: 'Java', value: 12, color: '#38BDF8' },
  { name: 'JS', value: 6, color: '#7DD3FC' },
];

const difficultyData = [
  { difficulty: 'Easy', solved: 246, total: 300 },
  { difficulty: 'Medium', solved: 489, total: 700 },
  { difficulty: 'Hard', solved: 312, total: 600 },
];

const rankData = [
  { contest: 'C#8', rank: 420 }, { contest: 'C#9', rank: 380 },
  { contest: 'C#10', rank: 310 }, { contest: 'C#11', rank: 290 },
  { contest: 'C#12', rank: 342 }, { contest: 'C#13', rank: 280 },
  { contest: 'C#14', rank: 342 },
];

const topicData = [
  { topic: 'Graphs', solved: 142, accuracy: 82 },
  { topic: 'DP', solved: 198, accuracy: 71 },
  { topic: 'Trees', solved: 167, accuracy: 88 },
  { topic: 'Strings', solved: 134, accuracy: 65 },
  { topic: 'Math', solved: 112, accuracy: 79 },
  { topic: 'Greedy', solved: 98, accuracy: 84 },
];

const avgSolveData = [
  { difficulty: 'Easy', avgMin: 8 }, { difficulty: 'Medium', avgMin: 22 },
  { difficulty: 'Hard', avgMin: 45 },
];

const skillRadar = [
  { subject: 'Graphs', A: 88 }, { subject: 'DP', A: 75 },
  { subject: 'Trees', A: 92 }, { subject: 'Strings', A: 68 },
  { subject: 'Math', A: 80 }, { subject: 'Greedy', A: 85 },
];

const heatmapData = Array.from({ length: 52 }, (_, week) =>
  Array.from({ length: 7 }, (_, day) => ({
    week, day,
    count: Math.random() > 0.4 ? Math.floor(Math.random() * 5) : 0,
  }))
).flat();

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name?: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="tooltip-dark">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-sm font-bold text-sky-300">{p.value}{p.name?.includes('accuracy') ? '%' : ''}</p>
        ))}
      </div>
    );
  }
  return null;
};

const kpis = [
  { label: 'Total Submissions', value: '1,531', icon: Code2, color: 'sky', sub: '+47 this week' },
  { label: 'Acceptance Rate', value: '68.4%', icon: Target, color: 'emerald', sub: '+2.1% vs last month' },
  { label: 'Avg Solve Time', value: '18 min', icon: Clock, color: 'amber', sub: 'Medium difficulty' },
  { label: 'Current Streak', value: '2 days', icon: Flame, color: 'orange', sub: 'Best: 31 days' },
  { label: 'Interview Score', value: '84/100', icon: Award, color: 'cyan', sub: 'Ready for FAANG' },
  { label: 'Active Days', value: '142', icon: Activity, color: 'violet', sub: 'This year' },
];

  const iconMap: Record<string, any> = {
    'Total Submissions': Code2,
    'Acceptance Rate': Target,
    'Avg Solve Time': Clock,
    'Current Streak': Flame,
    'Interview Score': Award,
    'Active Days': Activity
  };

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetch('/api/users/me/analytics')
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setAnalytics(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch analytics:', err);
        setLoading(false);
      });
  }, []);

  const activeKpis = (analytics?.kpis || kpis).map((k: any) => ({
    ...k,
    icon: iconMap[k.label] || Code2
  }));

  const userParticipationData = analytics?.participationData || participationData;
  const userAccuracyData = analytics?.accuracyData || accuracyData;
  const userLanguageData = analytics?.languageData || languageData;
  const userDifficultyData = analytics?.difficultyData || difficultyData;
  const userRankData = analytics?.rankData || rankData;
  const userTopicData = analytics?.topicData || topicData;
  const userSkillRadar = analytics?.skillRadar || skillRadar;
  const userHeatmapData = analytics?.heatmapData || heatmapData;

  return (
    <AppLayout currentPath="/analytics" role="student">
      <div className="px-6 lg:px-8 xl:px-10 py-6 max-w-screen-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BarChart2 size={22} className="text-sky-400" />
              Analytics
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Deep insights into your competitive programming journey</p>
          </div>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {activeKpis.map((kpi: any) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="bg-card-elevated border border-border rounded-xl p-4">
                <Icon size={14} className={`text-${kpi.color || 'sky'}-400 mb-2`} />
                <p className="text-xl font-bold text-foreground metric-value">{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{kpi.label}</p>
                <p className="text-[10px] text-muted-foreground/70 mt-1">{kpi.sub}</p>
              </div>
            );
          })}
        </div>

        {/* Row 1: Participation + Accuracy */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-card-elevated border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Contest Participation</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={userParticipationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: '#6B7A8A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6B7A8A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="contests" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card-elevated border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Accuracy Trend</h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={userAccuracyData}>
                <defs>
                  <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="week" tick={{ fill: '#6B7A8A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6B7A8A', fontSize: 11 }} axisLine={false} tickLine={false} domain={[50, 90]} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="accuracy" stroke="#10B981" strokeWidth={2} fill="url(#accGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 2: Language pie + Difficulty bars + Rank trend */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-card-elevated border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Language Usage</h2>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={userLanguageData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                  {userLanguageData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Usage']} contentStyle={{ background: 'rgba(13,13,20,0.95)', border: '1px solid #1E2232', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-2">
              {userLanguageData.map((l: any) => (
                <div key={l.name} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                  <span className="text-xs text-muted-foreground">{l.name} {l.value}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card-elevated border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Problems by Difficulty</h2>
            <div className="space-y-4 mt-2">
              {userDifficultyData.map((d: any) => (
                <div key={d.difficulty}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className={`font-medium ${d.difficulty === 'Easy' ? 'text-emerald-400' : d.difficulty === 'Medium' ? 'text-amber-400' : 'text-red-400'}`}>
                      {d.difficulty}
                    </span>
                    <span className="text-muted-foreground">{d.solved}/{d.total}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${d.difficulty === 'Easy' ? 'bg-emerald-500' : d.difficulty === 'Medium' ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${(d.solved / d.total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card-elevated border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Rank Progression</h2>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={userRankData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="contest" tick={{ fill: '#6B7A8A', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6B7A8A', fontSize: 10 }} axisLine={false} tickLine={false} reversed />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="rank" stroke="#06B6D4" strokeWidth={2} dot={{ fill: '#06B6D4', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 3: Topic performance + Skill radar + Avg solve time */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-card-elevated border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Performance by Topic</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={userTopicData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#6B7A8A', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="topic" type="category" tick={{ fill: '#6B7A8A', fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="solved" fill="#0EA5E9" radius={[0, 4, 4, 0]} name="Solved" />
                <Bar dataKey="accuracy" fill="#06B6D4" radius={[0, 4, 4, 0]} name="accuracy" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card-elevated border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Skill Radar</h2>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={userSkillRadar}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#6B7A8A', fontSize: 10 }} />
                <Radar name="Skills" dataKey="A" stroke="#0EA5E9" fill="#0EA5E9" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity heatmap */}
        <div className="bg-card-elevated border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Activity Heatmap — Last 12 Months</h2>
          <div className="overflow-x-auto">
            <div className="flex gap-1 min-w-max">
              {Array.from({ length: 52 }, (_, week) => (
                <div key={week} className="flex flex-col gap-1">
                  {Array.from({ length: 7 }, (_, day) => {
                    const cell = userHeatmapData.find((h: any) => h.week === week && h.day === day);
                    const count = cell?.count ?? 0;
                    return (
                      <div
                        key={day}
                        className="w-3 h-3 rounded-sm"
                        style={{
                          background: count === 0
                            ? 'rgba(30,34,50,0.8)'
                            : count === 1
                            ? 'rgba(14,165,233,0.3)'
                            : count === 2
                            ? 'rgba(14,165,233,0.5)'
                            : count === 3
                            ? 'rgba(14,165,233,0.7)'
                            : 'rgba(14,165,233,0.95)',
                        }}
                        title={`${count} submissions`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-muted-foreground">Less</span>
            {[0, 1, 2, 3, 4].map((n) => (
              <div key={n} className="w-3 h-3 rounded-sm" style={{
                background: n === 0 ? 'rgba(30,34,50,0.8)' : `rgba(14,165,233,${n * 0.25})`,
              }} />
            ))}
            <span className="text-xs text-muted-foreground">More</span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
