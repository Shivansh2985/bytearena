'use client';
import { apiFetch } from '@/lib/api';
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { MapPin, Link2, Edit3, Code2, Star, Briefcase, Award, ExternalLink,  } from 'lucide-react';

function GithubIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function TwitterIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}



export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'experience'>('overview');
  const { data: user } = useCurrentUser();

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

  const dynamicStats = [
    { label: 'Problems Solved', value: submissionsCount.toLocaleString() },
    { label: 'Contest Rating', value: displayRating.toLocaleString() },
    { label: 'Global Rank', value: globalRank },
    { label: 'Contests', value: contestsCount.toLocaleString() },
  ];

  return (
    <AppLayout currentPath="/profile" role="student">
      <div className="px-6 lg:px-8 xl:px-10 py-6 max-w-screen-xl mx-auto space-y-6">
        {/* Profile header */}
        <div className="bg-card-elevated border border-border rounded-xl p-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {user?.imageUrl || user?.image ? (
                <img src={user.imageUrl || user.image} alt={displayName} className="w-20 h-20 rounded-2xl object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center text-white text-2xl font-bold">
                  {initials}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-background" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-foreground">{displayName}</h1>
                  <p className="text-sm text-muted-foreground">
                    @{user?.username || user?.email?.split('@')[0] || 'user'} · {tier} · {user?.bio ? 'Active User' : 'New Member'}
                  </p>
                </div>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
                  <Edit3 size={12} />
                  Edit Profile
                </button>
              </div>

              <p className="text-sm text-foreground/80 mt-3 leading-relaxed max-w-2xl">
                {user?.bio || 'Competitive programmer & full-stack developer. Ready to battle on ByteArena.'}
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin size={12} />
                  {user?.location || 'India'}
                </div>
                {user?.website && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Link2 size={12} />
                    <span className="text-sky-400 hover:underline cursor-pointer">{user.website}</span>
                  </div>
                )}
                {user?.github && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <GithubIcon size={12} />
                    <span className="hover:text-foreground cursor-pointer">{user.github}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-border">
            {dynamicStats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-xl font-bold text-foreground metric-value">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/30 border border-border rounded-xl p-1 w-fit">
          {(['overview', 'projects', 'experience'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-primary text-white' :'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Skills */}
            <div className="bg-card-elevated border border-border rounded-xl p-5">
              <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                <Code2 size={15} className="text-sky-400" />
                Skills & Proficiency
              </h2>
              <div className="space-y-3">
                {user?.skills?.length > 0 ? (
                  user.skills.map((skill: any) => {
                    // Handle both string format and object format if available in DB
                    const name = typeof skill === 'string' ? skill : skill.name;
                    const level = typeof skill === 'object' && skill.level ? skill.level : 100;
                    return (
                      <div key={name}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-foreground font-medium">{name}</span>
                          <span className="text-muted-foreground">{level}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-sky-500 to-cyan-500 rounded-full transition-all duration-700"
                            style={{ width: `${level}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">No skills added yet.</p>
                )}
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-card-elevated border border-border rounded-xl p-5">
              <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                <Award size={15} className="text-amber-400" />
                Achievements
              </h2>
              <div className="space-y-3">
                {user?.badges?.length > 0 ? (
                  user.badges.map((a: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors">
                      <span className="text-xl">{a.icon || a.imageUrl || '🏆'}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{a.title || a.name}</p>
                        <p className="text-xs text-muted-foreground">{a.sub || a.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No achievements yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {user?.projects?.length > 0 ? (
              user.projects.map((p: any) => (
                <div key={p.id || p.title} className="bg-card-elevated border border-border rounded-xl p-5 hover:border-sky-500/30 transition-colors group">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-sky-300 transition-colors">{p.title}</h3>
                    {p.link && (
                      <a href={p.link} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">{p.description || p.desc}</p>
                  {p.tags && p.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {p.tags.map((tag: string) => (
                        <span key={tag} className="problem-tag">{tag}</span>
                      ))}
                    </div>
                  )}
                  {p.stars !== undefined && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Star size={11} className="text-amber-400" />
                      <span>{p.stars} stars</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full py-8 text-center border border-dashed border-border rounded-xl">
                <p className="text-sm text-muted-foreground">No projects added yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'experience' && (
          <div className="space-y-4">
            {user?.experience?.length > 0 ? (
              user.experience.map((e: any) => (
                <div key={e.id || e.role} className="bg-card-elevated border border-border rounded-xl p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center flex-shrink-0">
                    <Briefcase size={16} className="text-sky-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{e.role}</h3>
                    <p className="text-xs text-sky-400 font-medium">{e.company} {e.period ? `· ${e.period}` : ''}</p>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{e.desc || e.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center border border-dashed border-border rounded-xl">
                <p className="text-sm text-muted-foreground">No experience details added yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
