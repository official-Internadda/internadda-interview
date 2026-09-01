import React from 'react';

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950 py-6 text-slate-500 dark:text-slate-400">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800 dark:text-slate-300">InternAdda</span>
          <span className="text-slate-400 dark:text-slate-600">•</span>
          <span>Enterprise Mock Interview Suite</span>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-center sm:text-right">
          This interview is conducted by <strong className="text-slate-800 dark:text-slate-200 font-semibold">InternAdda</strong> for{' '}
          <strong className="text-blue-600 dark:text-blue-400 font-semibold">Upforge.org</strong>. Privacy protected & automated.
        </p>
      </div>
    </footer>
  );
}
