import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Sparkles, ShieldCheck, Zap, Award, ArrowRight, Layers, Lock, Mic } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />

      {/* Hero Banner */}
      <section className="relative overflow-hidden pt-16 pb-20 border-b border-slate-200/80 dark:border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/10 via-slate-50 to-slate-50 dark:from-blue-900/20 dark:via-slate-950 dark:to-slate-950 pointer-events-none"></div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <Sparkles className="h-3.5 w-3.5" />
            White-labeled for Upforge.org
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight">
            Perplexity-Style Voice AI Mock Interviews Powered by{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-800 bg-clip-text text-transparent">
              InternAdda AI
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Experience ultra-fast, domain-specific AI Voice interviews across 22 corporate categories. Automated proctoring, text-to-speech AI evaluation, and instant grading.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-800 px-7 py-4 text-sm font-semibold text-white shadow-xl shadow-blue-500/25 hover:brightness-110 active:scale-95 transition-all"
            >
              <Lock className="h-4 w-4" />
              Access Admin Portal
            </Link>
            <Link
              href="/interview/demo-interview-1"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-7 py-4 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:border-blue-500 shadow-md transition-all"
            >
              <Mic className="h-4 w-4 text-blue-500" />
              Try Demo Voice Interview
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Built for Executive Excellence & Integrity</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Groq streaming accelerated, Vercel free tier compatible, Perplexity Voice mode inspired.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="silver-card rounded-3xl p-6 shadow-xl space-y-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Groq AI Inference</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Low latency question generation and score rubrics powered by Groq's high-speed LLM engine.
            </p>
          </div>

          <div className="silver-card rounded-3xl p-6 shadow-xl space-y-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Automated Proctoring</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Continuous client-side face tracking and tab focus detection to ensure candidate compliance.
            </p>
          </div>

          <div className="silver-card rounded-3xl p-6 shadow-xl space-y-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Award className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">22 Specialized Rubrics</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Pre-configured rubrics ranging from AI & Machine Learning to Finance, Sales, Product, HR, and QA.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
