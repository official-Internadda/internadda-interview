'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { CandidateAttempt, QuestionLog, Interview } from '@/lib/types';
import {
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Printer,
  Sparkles,
  TrendingUp,
  Target,
  FileText,
  Clock,
  User,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CandidateReportPage() {
  const params = useParams();
  const attemptId = params.attemptId as string;

  const [attempt, setAttempt] = useState<CandidateAttempt | null>(null);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [questions, setQuestions] = useState<QuestionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadReport() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/interviews`);
        const data = await res.json();
        const foundAttempt = (data.attempts || []).find((a: CandidateAttempt) => a.id === attemptId);

        if (!foundAttempt) throw new Error('Candidate attempt not found');

        setAttempt(foundAttempt);
        setInterview(foundAttempt.interview);

        if (foundAttempt.status === 'passed' && typeof window !== 'undefined') {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load report');
      } finally {
        setLoading(false);
      }
    }

    if (attemptId) loadReport();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <div className="h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
            <p className="text-xs">Generating Evaluation Report...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <Navbar />
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="max-w-md w-full rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6 text-center space-y-4">
            <XCircle className="h-10 w-10 text-rose-500 mx-auto" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Report Not Found</h2>
            <p className="text-xs text-rose-700 dark:text-rose-300">{error || 'The requested evaluation report does not exist.'}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isQualified = attempt.status === 'passed';
  const isDisqualified = attempt.status === 'disqualified';

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />

      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-8 print-only-full">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6 no-print">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-semibold px-3 py-1">
                Official InternAdda Assessment
              </span>
              <span className="text-xs text-slate-500">for Upforge.org</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">Candidate Evaluation Report</h1>
          </div>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:border-blue-500 px-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-white shadow-sm transition-all"
          >
            <Printer className="h-4 w-4 text-blue-500" />
            Download / Print PDF
          </button>
        </div>

        {/* Executive Score Overview Banner */}
        <div className="silver-card rounded-3xl p-6 sm:p-8 shadow-2xl print-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-blue-500" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{attempt.candidate_name}</h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{attempt.candidate_email}</p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700 dark:text-slate-300 pt-1">
                <span className="font-bold text-slate-900 dark:text-white">{interview?.title || 'Mock Interview'}</span>
                <span className="text-slate-400">•</span>
                <span className="bg-slate-200 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg text-[11px] text-slate-800 dark:text-slate-200">
                  {interview?.category}
                </span>
                <span className="text-slate-400">•</span>
                <span className="capitalize text-blue-600 dark:text-blue-400 font-semibold">{interview?.difficulty} Difficulty</span>
              </div>
            </div>

            {/* Score Badge */}
            <div className="flex flex-col items-center justify-center p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 min-w-[180px] shadow-md">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Overall Score</span>
              <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{attempt.score_percentage}%</span>

              <div className="mt-2">
                {isDisqualified ? (
                  <span className="rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 px-3 py-1 text-xs font-bold flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" /> Disqualified
                  </span>
                ) : isQualified ? (
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3 py-1 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Qualified (≥50%)
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1 text-xs font-semibold flex items-center gap-1.5">
                    <XCircle className="h-3.5 w-3.5 text-slate-500" /> Did Not Qualify
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-5 text-xs text-slate-700 dark:text-slate-300 space-y-2">
            <strong className="text-slate-900 dark:text-white block font-bold">Executive Assessment Summary:</strong>
            <p className="leading-relaxed text-slate-600 dark:text-slate-400">
              {isDisqualified
                ? 'Candidate was disqualified due to automated proctoring integrity flags recorded during the session.'
                : isQualified
                ? `Candidate successfully demonstrated solid domain competence for ${interview?.category} at the ${interview?.difficulty} difficulty standard, crossing the 50% qualifying threshold.`
                : `Candidate score fell below the 50% qualifying bar for the ${interview?.difficulty} difficulty rubric. Review feedback items below for improvement.`}
            </p>
          </div>
        </div>

        {/* Strengths & Improvement Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print-card">
          <div className="silver-card rounded-3xl p-6 space-y-3 shadow-xl">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <TrendingUp className="h-4 w-4" /> Demonstrated Key Strengths
            </div>
            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 list-disc list-inside">
              <li>Strong structured responses addressing core category concepts.</li>
              <li>Clear articulation with effective domain terminology.</li>
              <li>Maintained professional tone throughout evaluation.</li>
            </ul>
          </div>

          <div className="silver-card rounded-3xl p-6 space-y-3 shadow-xl">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Target className="h-4 w-4" /> Strategic Areas for Growth
            </div>
            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 list-disc list-inside">
              <li>Elaborate further on quantifiable metrics and implementation results.</li>
              <li>Incorporate deeper technical trade-off analyses where applicable.</li>
              <li>Use the STAR method (Situation, Task, Action, Result) for scenario questions.</li>
            </ul>
          </div>
        </div>

        {/* Proctoring Audit Log */}
        {attempt.fraud_flags && attempt.fraud_flags.length > 0 && (
          <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6 space-y-3 print-card">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4" /> Proctoring Compliance Audit Log
            </div>
            <div className="space-y-2 text-xs">
              {attempt.fraud_flags.map((flag, idx) => (
                <div key={idx} className="flex justify-between border-b border-rose-500/20 py-1.5 text-rose-700 dark:text-rose-200">
                  <span>{flag.message}</span>
                  <span className="font-mono text-rose-600 dark:text-rose-400 text-[11px]">{flag.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="text-center text-xs text-slate-500 pt-4 border-t border-slate-200 dark:border-slate-800">
          This report was generated automatically by <strong className="text-slate-800 dark:text-slate-200">InternAdda AI Evaluation Engine</strong> for{' '}
          <strong className="text-blue-600 dark:text-blue-400">Upforge.org</strong> on {new Date(attempt.created_at).toLocaleDateString()}.
        </div>
      </main>

      <Footer />
    </div>
  );
}
