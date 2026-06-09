'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardNavigation from '@/components/dashboard-navigation';
import { isSupabaseConfigured, supabase } from '@/lib/db';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setAuthorized(true);
          } else {
            router.push('/');
          }
        } else {
          // Local fallback verification
          const isLoggedIn = localStorage.getItem('shiksharthi_logged_in') === 'true';
          if (isLoggedIn) {
            setAuthorized(true);
          } else {
            router.push('/');
          }
        }
      } catch (err) {
        console.error('Auth check error:', err);
        router.push('/');
      } finally {
        setChecking(false);
      }
    }
    checkAuth();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-dark-bg text-foreground flex flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-zinc-500 font-medium">Authenticating console access...</span>
      </div>
    );
  }

  if (!authorized) {
    return null; // Prevent layout shift / flash of content
  }

  return (
    <div className="min-h-screen bg-dark-bg text-foreground flex flex-col selection:bg-brand-purple/30 selection:text-white">
      {/* Navigation Layer (Renders responsive bottom-nav/sidebar) */}
      <DashboardNavigation />

      {/* Main Page Area */}
      <main className="flex-1 md:pl-64 pb-16 md:pb-6 min-w-0 transition-all-200">
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}
