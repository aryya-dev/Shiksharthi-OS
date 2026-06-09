'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, CalendarRange, ClipboardList, Sparkles, 
  Users, GraduationCap, HelpCircle, Award, 
  Menu, X, Bell, UserCheck, Search, ShieldAlert, CreditCard
} from 'lucide-react';
import { dbClient, isSupabaseConfigured, supabase } from '@/lib/db';
import { UserRole, UserProfile } from '@/types';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'SPOC', 'FACULTY'] },
  { name: 'Academic Planner', href: '/dashboard/planner', icon: CalendarRange, roles: ['ADMIN', 'SPOC'] },
  { name: 'Class Logs', href: '/dashboard/classes', icon: ClipboardList, roles: ['ADMIN', 'SPOC', 'FACULTY'] },
  { name: 'AI Curriculum', href: '/dashboard/curriculum', icon: Sparkles, roles: ['ADMIN', 'FACULTY'] },
  { name: 'Students & CRM', href: '/dashboard/students', icon: Users, roles: ['ADMIN', 'SPOC'] },
  { name: 'Fees Tracker', href: '/dashboard/fees', icon: CreditCard, roles: ['ADMIN', 'SPOC'] },
  { name: 'Faculty Registry', href: '/dashboard/faculty', icon: GraduationCap, roles: ['ADMIN', 'SPOC'] },
  { name: 'Doubt Tracker', href: '/dashboard/doubts', icon: HelpCircle, roles: ['ADMIN', 'SPOC', 'FACULTY'] },
  { name: 'Exams & Analytics', href: '/dashboard/exams', icon: Award, roles: ['ADMIN', 'SPOC', 'FACULTY'] }
];

export default function DashboardNavigation() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSignOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('shiksharthi_logged_in');
    window.location.href = '/';
  };

  // Fetch current user details & role
  const loadUser = async () => {
    const user = await dbClient.profiles.getCurrentUser();
    setCurrentUser(user);
  };

  useEffect(() => {
    loadUser();
    // Listen to custom event for role change
    const handleRoleChange = () => {
      loadUser();
      setMobileMenuOpen(false);
    };
    window.addEventListener('role-change', handleRoleChange);
    return () => window.removeEventListener('role-change', handleRoleChange);
  }, []);

  if (!currentUser) return null;

  const currentRole = currentUser.role;

  // Filter nav items by role
  const filteredNav = navItems.filter(item => item.roles.includes(currentRole));

  // Core items for Mobile Bottom Nav (max 4)
  const mobileBottomItems = filteredNav.slice(0, 4);
  // Rest of the items for "More" menu
  const mobileMoreItems = filteredNav.slice(4);

  const handleRoleToggle = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const targetRole = e.target.value as UserRole;
    await dbClient.profiles.setCurrentUserRole(targetRole);
  };

  return (
    <>
      {/* 1. TOP HEADER - Visible on both Mobile and Desktop */}
      <header className="sticky top-0 z-40 w-full glass-card border-b border-dark-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-brand-purple to-brand-violet flex items-center justify-center font-bold text-lg text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]">
            S
          </div>
          <div>
            <span className="font-semibold text-sm tracking-wide bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              SHIKSHARTHI
            </span>
            <span className="text-[10px] ml-1.5 px-1.5 py-0.5 rounded bg-zinc-900 text-brand-purple font-semibold border border-brand-purple/20">
              OS
            </span>
          </div>
        </div>

        {/* Global Search & Quick Actions */}
        <div className="flex items-center gap-3">
          {/* Admin Console Badge */}
          <div className="flex items-center gap-1.5 bg-brand-purple/10 border border-brand-purple/30 rounded-lg px-2.5 py-1.5 text-brand-purple font-bold text-[10px] tracking-wider uppercase">
            Admin Console
          </div>

          {/* Search Button */}
          <button 
            onClick={() => setShowSearch(!showSearch)}
            className="p-1.5 rounded-lg bg-zinc-900 border border-dark-border text-zinc-400 hover:text-white transition-all-200"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1.5 rounded-lg bg-zinc-900 border border-dark-border text-zinc-400 hover:text-white transition-all-200"
            >
              <Bell className="h-4 w-4" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-neon-rose shadow-[0_0_8px_rgba(244,63,94,0.7)] animate-ping" />
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl border border-dark-border bg-dark-card p-3 shadow-2xl z-50">
                <div className="flex justify-between items-center mb-2 pb-1 border-b border-dark-border">
                  <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3 text-brand-purple" /> Notifications
                  </span>
                  <button 
                    onClick={() => setNotifications([])}
                    className="text-[10px] text-zinc-500 hover:text-zinc-300"
                  >
                    Clear All
                  </button>
                </div>
                {notifications.length === 0 ? (
                  <div className="text-center py-4 text-xs text-zinc-500">No alerts today</div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {notifications.map((n, i) => (
                      <div key={i} className="text-xs p-2 rounded bg-zinc-900 border border-dark-border/40 text-zinc-300">
                        {n}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Menu button for Mobile Secondary Items */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg bg-zinc-900 border border-dark-border text-zinc-400 hover:text-white transition-all-200"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* SEARCH OVERLAY */}
      {showSearch && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
          <div className="w-full max-w-lg bg-dark-card border border-dark-border rounded-xl p-3 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-dark-border pb-2 mb-3">
              <Search className="h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search students, topics, doubts..."
                className="bg-transparent text-sm w-full focus:outline-none text-white"
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button 
                onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                ESC
              </button>
            </div>
            {searchQuery ? (
              <div className="space-y-1.5">
                <div className="text-[10px] text-zinc-500 font-bold uppercase px-2">Results</div>
                <div className="p-2 rounded bg-zinc-900 hover:bg-dark-hover border border-dark-border/40 cursor-pointer text-xs flex justify-between">
                  <span>Aarav Sharma</span>
                  <span className="text-zinc-500">Student Profile</span>
                </div>
                <div className="p-2 rounded bg-zinc-900 hover:bg-dark-hover border border-dark-border/40 cursor-pointer text-xs flex justify-between">
                  <span>Kinematics & Motion in 1D/2D</span>
                  <span className="text-zinc-500">Physics Chapter</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-zinc-500">
                Type something to search across the Shiksharthi OS...
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. SIDEBAR - Visible ONLY on Desktop */}
      <aside className="fixed left-0 top-[57px] bottom-0 w-64 bg-dark-card border-r border-dark-border p-4 hidden md:flex flex-col justify-between z-30">
        <div className="space-y-6">
          <div className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase px-3">
            Academic Operations
          </div>
          <nav className="space-y-1">
            {filteredNav.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all-200 ${
                    isActive 
                      ? 'bg-brand-purple/10 text-brand-purple border-l-2 border-brand-purple pl-2.5' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-brand-purple' : 'text-zinc-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Footer in Sidebar */}
        <div className="pt-3 border-t border-dark-border flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-brand-purple/20 flex items-center justify-center font-bold text-brand-purple border border-brand-purple/30 text-xs shrink-0">
              {currentUser.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="truncate w-36">
              <div className="text-xs font-semibold text-white truncate">{currentUser.name}</div>
              <div className="text-[10px] text-zinc-500 truncate">{currentUser.email}</div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-dark-border text-center text-[10px] font-bold tracking-wider text-zinc-400 hover:text-white uppercase transition-all-200"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* 3. MOBILE MENU DRAWER - Opens when Hamburger clicked */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/80 md:hidden flex justify-end">
          <div className="w-64 bg-dark-card h-full p-4 flex flex-col justify-between border-l border-dark-border pt-20 animate-slide-in">
            <div className="space-y-6">
              <div className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase px-3">
                All Modules
              </div>
              <nav className="space-y-1">
                {filteredNav.map(item => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all-200 ${
                        isActive 
                          ? 'bg-brand-purple/10 text-brand-purple border-l-2 border-brand-purple pl-2.5' 
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? 'text-brand-purple' : 'text-zinc-400'}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            
            {/* User details at bottom of mobile menu */}
            <div className="pt-4 border-t border-dark-border flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-brand-purple/20 flex items-center justify-center font-bold text-brand-purple border border-brand-purple/30 text-xs shrink-0">
                  {currentUser.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="truncate">
                  <div className="text-xs font-semibold text-white truncate">{currentUser.name}</div>
                  <span className="text-[9px] px-1 bg-zinc-900 text-brand-purple border border-brand-purple/20 rounded font-semibold uppercase">{currentRole}</span>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full py-1.5 rounded bg-zinc-900 border border-dark-border text-center text-[10px] font-bold tracking-wider text-zinc-400 hover:text-white uppercase transition-all-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MOBILE BOTTOM NAVIGATION - Sticky footer under 768px */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-dark-card/90 backdrop-blur-md border-t border-dark-border px-4 py-2 flex items-center justify-around md:hidden">
        {mobileBottomItems.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 text-zinc-400 hover:text-white ${
                isActive ? 'text-brand-purple' : ''
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-brand-purple' : ''}`} />
              <span className="text-[9px] font-medium truncate max-w-[64px]">{item.name.split(' ')[0]}</span>
            </Link>
          );
        })}
        {mobileMoreItems.length > 0 && (
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center gap-0.5 text-zinc-400 hover:text-white"
          >
            <Menu className="h-5 w-5" />
            <span className="text-[9px] font-medium">More</span>
          </button>
        )}
      </nav>
    </>
  );
}
