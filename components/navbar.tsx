'use client';

import Link from 'next/link';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export function Navbar({ isAdmin = false }: { isAdmin?: boolean }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-950/80 backdrop-blur-xl transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-800 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                InternAdda
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  AI Interview
                </span>
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Powered by InternAdda for <span className="text-blue-600 dark:text-blue-400 font-semibold">upforge.org</span>
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex items-center gap-3 sm:gap-4">
          <ThemeToggle />

          {isAdmin ? (
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Admin Active
              </span>
              <button
                onClick={async () => {
                  await fetch('/api/admin/logout', { method: 'POST' });
                  window.location.href = '/admin/login';
                }}
                className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:border-blue-500 px-3.5 py-1.5 rounded-xl transition-all shadow-sm"
            >
              <ShieldCheck className="h-4 w-4 text-blue-500" />
              Admin Portal
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
