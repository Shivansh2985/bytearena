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
} from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  currentPath: string;
  role?: 'student' | 'admin';
}

const userNavGroups = [
  {
    label: 'Main',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/user-dashboard', badge: null },
      { icon: Swords, label: 'Contests', href: '/contests', badge: '2 Live' },
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
      { icon: Bell, label: 'Notifications', href: '/user-dashboard', badge: '3' },
      { icon: Settings, label: 'Settings', href: '/settings', badge: null },
    ],
  },
];

const adminNavGroups = [
  {
    label: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard', badge: null },
      { icon: BarChart3, label: 'Analytics', href: '/admin/analytics', badge: null },
    ],
  },
  {
    label: 'Contests',
    items: [
      { icon: Swords, label: 'Contest Manager', href: '/admin/contests', badge: null },
      { icon: PlusCircle, label: 'Create Contest', href: '/admin/contests/create', badge: null },
      { icon: ClipboardList, label: 'Question Builder', href: '/admin/questions', badge: null },
    ],
  },
  {
    label: 'Users',
    items: [
      { icon: Users, label: 'User Management', href: '/admin/users', badge: null },
      { icon: Eye, label: 'Proctoring', href: '/admin/proctoring', badge: '2 Live' },
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
}: SidebarProps) {
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
                    {!collapsed && item.badge && (
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

      {/* Role switch link */}
      <div className="px-2 pb-3 border-t border-border pt-3">
        {role === 'student' ? (
          <Link
            href="/admin/dashboard"
            className={`sidebar-item ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? 'Admin Panel' : undefined}
            onClick={onClose}
          >
            <Shield size={18} className="flex-shrink-0 text-amber-400" />
            {!collapsed && <span className="text-sm font-medium text-amber-300">Admin Panel</span>}
          </Link>
        ) : (
          <Link
            href="/user-dashboard"
            className={`sidebar-item ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? 'Student View' : undefined}
            onClick={onClose}
          >
            <User size={18} className="flex-shrink-0 text-sky-400" />
            {!collapsed && <span className="text-sm font-medium text-sky-300">Student View</span>}
          </Link>
        )}
      </div>

      {/* User avatar */}
      <div className={`flex items-center px-3 py-3 border-t border-border gap-3 ${collapsed ? 'justify-center' : ''}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
          role === 'admin' ?'bg-gradient-to-br from-amber-500 to-orange-600' :'bg-gradient-to-br from-sky-500 to-cyan-600'
        }`}>
          {role === 'admin' ? 'AD' : 'RK'}
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {role === 'admin' ? 'Admin User' : 'Rahul Kumar'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {role === 'admin' ? 'Administrator' : 'Rating: 2,341'}
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
        {/* Logo */}
        <div className={`flex items-center h-16 px-4 border-b border-border flex-shrink-0 ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="flex items-center gap-2">
            <AppLogo size={32} />
            {!collapsed && (
              <span className="font-bold text-base text-foreground tracking-tight">ByteArena</span>
            )}
          </div>
          {!collapsed && role === 'admin' && (
            <span className="ml-auto text-xs px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/25 font-medium">
              Admin
            </span>
          )}
        </div>

        <NavContent />

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          className="flex items-center justify-center h-10 border-t border-border text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
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