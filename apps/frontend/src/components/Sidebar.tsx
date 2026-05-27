'use client';
import React from 'react';
import Link from 'next/link';
import AppLogo from './ui/AppLogo';
import {
  LayoutDashboard,
  Swords,
  Trophy,
  History,
  BarChart3,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  BookOpen,
  Bell,
  Shield,
  Users,
  ClipboardList,
  Eye,
  Star,
  PlusCircle,
  Activity,
} from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  currentPath: string;
  role?: 'student' | 'admin';
  user?: any;
}

import { LucideIcon } from 'lucide-react';

interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
  badge: string | null;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const userNavGroups: NavGroup[] = [
  {
    label: 'Main',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/user-dashboard', badge: null },
      { icon: Swords, label: 'Contests', href: '/contests', badge: null },
      { icon: Trophy, label: 'Leaderboard', href: '/leaderboard', badge: null },
      { icon: Zap, label: 'Battleground', href: '/battleground', badge: null },
    ],
  },
  {
    label: 'Progress',
    items: [
      { icon: History, label: 'Submissions', href: '/submissions', badge: null },
      { icon: BarChart3, label: 'Analytics', href: '/analytics', badge: null },
      { icon: BookOpen, label: 'Practice', href: '/contests', badge: null },
    ],
  },
  {
    label: 'Account',
    items: [
      { icon: User, label: 'Profile', href: '/profile', badge: null },
      { icon: Bell, label: 'Notifications', href: '/user-dashboard', badge: null },
      { icon: Settings, label: 'Settings', href: '/settings', badge: null },
    ],
  },
];

const adminNavGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard', badge: null },
      { icon: BarChart3, label: 'Analytics', href: '/admin/analytics', badge: null },
      { icon: Activity, label: 'Observability', href: '/admin/monitoring', badge: 'Live' },
    ],
  },
  {
    label: 'Contests',
    items: [
      { icon: Swords, label: 'Contest Manager', href: '/admin/contests', badge: null },
      { icon: PlusCircle, label: 'Create Contest', href: '/admin/contests/create', badge: null },
      { icon: ClipboardList, label: 'Question Builder', href: '/admin/questions', badge: null },
      { icon: History, label: 'Global Submissions', href: '/admin/submissions', badge: null },
    ],
  },
  {
    label: 'Users',
    items: [
      { icon: Users, label: 'User Management', href: '/admin/users', badge: null },
      { icon: Eye, label: 'Proctoring', href: '/admin/proctoring', badge: null },
      { icon: Star, label: 'Ratings', href: '/admin/ratings', badge: null },
    ],
  },
  {
    label: 'Account',
    items: [
      { icon: Settings, label: 'Settings', href: '/admin/settings', badge: null },
    ],
  },
];

export default function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
  currentPath,
  role = 'student',
  user,
}: SidebarProps) {
  const displayName = user?.name || (user?.firstName ? `${user.firstName} ${user.lastName || ''}` : '') || 'User';
  const displayRating = user?.rating ?? 1200;
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'US';

  const navGroups = role === 'admin' ? adminNavGroups : userNavGroups;
  const isActive = (href: string) => currentPath === href;

  const NavContent = ({ onClose }: { onClose?: () => void }) => (
    <>
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-5">
        {navGroups.map((group) => (
          <div key={`group-${group.label}`}>
            {!collapsed && (
              <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={`nav-${item.label}`}
                    href={item.href}
                    onClick={onClose}
                    className={`sidebar-item ${active ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={18} className="flex-shrink-0" />
                    {!collapsed && (
                      <span className="text-sm font-medium flex-1">{item.label}</span>
                    )}
                    {!collapsed && item.badge && typeof item.badge === 'string' && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        item.badge.includes('Live')
                          ? 'bg-red-500/15 text-red-400 border border-red-500/25' :'bg-primary/15 text-sky-300 border border-primary/25'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                    {collapsed && item.badge && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-400" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>



      {/* User avatar */}
      <div className={`flex items-center px-3 py-3 border-t border-border gap-3 ${collapsed ? 'justify-center' : ''}`}>
        {user?.imageUrl || user?.image ? (
          <img src={user.imageUrl || user.image} alt={displayName} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
            role === 'admin' ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-sky-500 to-cyan-600'
          }`}>
            {role === 'admin' ? 'AD' : initials}
          </div>
        )}
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {role === 'admin' ? 'Admin User' : displayName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {role === 'admin' ? 'Administrator' : `Rating: ${displayRating.toLocaleString()}`}
            </p>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col h-full glass border-r border-border transition-all duration-300 ease-in-out flex-shrink-0 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Logo and Collapse Toggle */}
        <div className={`relative flex items-center h-16 px-4 border-b border-border flex-shrink-0 justify-between`}>
          <div className={`flex items-center gap-2 ${collapsed ? 'hidden' : ''}`}>
            <AppLogo size={32} />
            <span className="font-bold text-base text-foreground tracking-tight">ByteArena</span>
          </div>
          {collapsed && (
            <div className="mx-auto flex items-center justify-center">
              <AppLogo size={32} />
            </div>
          )}
          
          <button
            onClick={onToggle}
            className={`absolute top-5 -right-3 z-50 flex items-center justify-center h-6 w-6 rounded-full border border-border bg-card shadow-sm text-muted-foreground hover:text-foreground transition-all duration-200`}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        <NavContent />
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 glass border-r border-border flex flex-col lg:hidden transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          <div className="flex items-center gap-2">
            <AppLogo size={28} />
            <span className="font-bold text-base text-foreground">ByteArena</span>
          </div>
          <button onClick={onMobileClose} className="p-2 text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>
        <NavContent onClose={onMobileClose} />
      </aside>
    </>
  );
}