'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ShieldCheck, GraduationCap, ChevronRight, Activity, Mail, Lock, AlertCircle, RefreshCw } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '@/lib/db';

export default function EntryPortal() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Check persistent session on load
  useEffect(() => {
    async function checkPersistedSession() {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            router.push('/dashboard');
            return;
          }
        } else {
          const isLoggedIn = localStorage.getItem('shiksharthi_logged_in') === 'true';
          if (isLoggedIn) {
            router.push('/dashboard');
            return;
          }
        }
      } catch (err) {
        console.error('Persistence check failed:', err);
      } finally {
        setLoading(false);
      }
    }
    checkPersistedSession();
  }, [router]);

  const handleDemoBypass = () => {
    localStorage.setItem('shiksharthi_logged_in', 'true');
    router.push('/dashboard');
  };

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setActionLoading(true);

    if (!email || !password) {
      setErrorMessage('Please fill in all fields.');
      setActionLoading(false);
      return;
    }

    try {
      if (isSupabaseConfigured && supabase) {
        // Login
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/dashboard');
      } else {
        // Fallback demo auth
        localStorage.setItem('shiksharthi_logged_in', 'true');
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Authentication failed. Please check details.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg text-foreground flex flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-zinc-500">Checking active session...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-foreground flex flex-col justify-between items-center p-6 relative overflow-hidden">
      {/* Decorative Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-purple/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-neon-blue/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-6xl flex justify-between items-center py-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-brand-purple to-brand-violet flex items-center justify-center font-bold text-xl text-white shadow-[0_0_20px_rgba(139,92,246,0.6)]">
            S
          </div>
          <div>
            <span className="font-semibold text-lg tracking-wide bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              SHIKSHARTHI
            </span>
            <span className="text-[11px] ml-2 px-2 py-0.5 rounded bg-zinc-900 text-brand-purple font-semibold border border-brand-purple/20">
              OS
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
          <Activity className="h-3 w-3 text-neon-emerald animate-pulse" />
          <span>v1.0.0 Production Ready</span>
        </div>
      </header>

      {/* Main Login / Entry Box */}
      <main className="w-full max-w-md my-auto flex flex-col items-center">
        <div className="w-full glass-card rounded-2xl p-6 md:p-8 border border-dark-border relative z-10 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Shiksharthi Foundation
            </h1>
            <p className="text-xs text-zinc-400">
              Academic Operations & Curriculum Intelligence Console
            </p>
          </div>

          {/* Connection State Info */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/80 border border-dark-border text-[11px]">
            <span className="text-zinc-500 font-medium">Database State:</span>
            {isSupabaseConfigured ? (
              <span className="text-neon-emerald font-semibold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-neon-emerald" /> Supabase Live
              </span>
            ) : (
              <span className="text-neon-amber font-semibold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-neon-amber animate-pulse" /> Local Sandbox Mode
              </span>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-neon-rose/10 border border-neon-rose/20 text-xs text-neon-rose flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isSupabaseConfigured ? (
            <form onSubmit={handleAuthAction} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="email"
                    placeholder="name@shiksharthi.in"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-lg bg-zinc-900 border border-dark-border focus:border-brand-purple focus:outline-none text-white transition-all-200"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-lg bg-zinc-900 border border-dark-border focus:border-brand-purple focus:outline-none text-white transition-all-200"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-brand-purple to-brand-violet hover:from-brand-violet hover:to-brand-purple text-xs font-semibold text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all-200 flex items-center justify-center gap-1.5"
              >
                {actionLoading ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    Sign In to Dashboard
                    <ChevronRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-brand-purple/5 border border-brand-purple/20 text-xs space-y-1.5 text-zinc-300">
                <span className="font-semibold text-brand-purple flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> Demo Sandbox Sandbox
                </span>
                <p>
                  No database keys found in `.env.local`. Running on high-fidelity offline cache representing the Class 9 Junior JEE/NEET Foundation.
                </p>
              </div>

              <button
                onClick={handleDemoBypass}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-purple to-brand-violet hover:from-brand-violet hover:to-brand-purple text-sm font-semibold text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-all-200 flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                Launch OS Command Center <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Feature Grid Mini */}
        <div className="grid grid-cols-3 gap-2 w-full mt-6 text-center text-zinc-500">
          <div className="p-2.5 rounded bg-zinc-950 border border-dark-border/40 text-[10px]">
            <ShieldCheck className="h-4 w-4 mx-auto mb-1 text-brand-purple" />
            <span>Admin Console</span>
          </div>
          <div className="p-2.5 rounded bg-zinc-950 border border-dark-border/40 text-[10px]">
            <GraduationCap className="h-4 w-4 mx-auto mb-1 text-neon-emerald" />
            <span>AI Syllabus</span>
          </div>
          <div className="p-2.5 rounded bg-zinc-950 border border-dark-border/40 text-[10px]">
            <Activity className="h-4 w-4 mx-auto mb-1 text-neon-blue" />
            <span>Planned vs Actual</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-4 text-xs text-zinc-600 border-t border-dark-border/20">
        © 2026 Shiksharthi Education Group. All rights reserved.
      </footer>
    </div>
  );
}
