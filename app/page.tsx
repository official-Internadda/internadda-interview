import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Award,
  ArrowRight,
  Mic,
  Lock,
  Globe,
  Clock,
  TrendingUp,
  CheckCircle2,
  Users
} from 'lucide-react';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />

      {/* Eightfold AI Hero Section */}
      <section className="relative overflow-hidden eightfold-hero-navy py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-300 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                InternAdda AI Digital Recruiter • White-labeled for Upforge.org
              </div>

              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
                Meet <span className="text-blue-400">AI Interviewer</span>.<br />
                Your 24/7 Digital Recruiter.
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
                Conduct bias-conscious, domain-specific AI interviews at scale. Real-time speech evaluation, automated proctoring, and instant candidate qualification rubrics.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <Link
                  href="/interview/demo-interview-1"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 px-8 py-4 text-sm font-semibold text-white shadow-xl shadow-blue-600/30 active:scale-95 transition-all"
                >
                  <Mic className="h-4 w-4" />
                  Try AI Interviewer Now
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/admin"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 px-7 py-4 text-sm font-semibold text-slate-200 transition-all"
                >
                  <Lock className="h-4 w-4 text-blue-400" />
                  Access Admin Portal
                </Link>
              </div>

              {/* Stat Highlights */}
              <div className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-800 text-left">
                <div>
                  <div className="text-2xl font-extrabold text-white">90%</div>
                  <div className="text-[11px] text-slate-400">Faster Time-to-Interview</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-white">22+</div>
                  <div className="text-[11px] text-slate-400">Specialized Categories</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-white">100%</div>
                  <div className="text-[11px] text-slate-400">Anti-Cheat Fraud Audit</div>
                </div>
              </div>
            </div>

            {/* Hero Right Real Stock Image Container */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-700 bg-slate-900 aspect-[4/3]">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80"
                  alt="Candidate conducting AI Voice Interview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>

                {/* Floating Badge Overlay */}
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl border border-slate-700/80 bg-slate-950/80 backdrop-blur-md flex items-center justify-between text-white text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-semibold">AI Voice Session Active</span>
                  </div>
                  <span className="text-blue-400 font-mono text-[11px]">REC ● 00:03:45</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Eightfold AI How It Works: 3 Steps */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
            Agentic Talent Operating System
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            How it Works: From Human Scale to Agent Scale
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            AI Interviewer conducts adaptive voice interviews so your recruiting team can focus on making high-impact hiring decisions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="eightfold-card p-8 space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg">
              01
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Send Shareable Link</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Generate interview links from your admin portal. Candidates enter the process on their schedule, 24/7.
            </p>
          </div>

          <div className="eightfold-card p-8 space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
              02
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Conversational Voice Session</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              AI Interviewer leads candidate through briefing instructions, evaluates speech responses, and monitors proctoring integrity.
            </p>
          </div>

          <div className="eightfold-card p-8 space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg">
              03
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Instant Data Intelligence</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Receive structured evaluation reports with score breakdowns, strengths analysis, and printable PDF audit logs.
            </p>
          </div>
        </div>
      </section>

      {/* Real Stock Photography Section */}
      <section className="py-16 bg-slate-100 dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
              Evaluate Candidates with Consistent Rigor & Zero Fatigue
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Whether it's the first candidate of the day or the thousandth, AI Interviewer applies objective domain standards across 22 categories, eliminating human bias and evaluation fatigue.
            </p>
            <ul className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>STAR method functional evaluations for domain depth</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Anti-cheat flags for tab switching and missing face</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>50% qualifying score threshold for standardized hiring</span>
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-3xl overflow-hidden border border-slate-300 dark:border-slate-800 shadow-xl aspect-square">
              <img
                src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80"
                alt="Corporate recruitment team"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="rounded-3xl overflow-hidden border border-slate-300 dark:border-slate-800 shadow-xl aspect-square">
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80"
                alt="AI talent intelligence assessment"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

