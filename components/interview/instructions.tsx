'use client'; 

import { Sparkles, ShieldCheck, Clock, CheckCircle2, AlertTriangle, ArrowRight, Mic, Video } from 'lucide-react';

interface InstructionsProps {
  candidateName: string;
  interviewTitle: string;
  category: string;
  difficulty: string;
  numQuestions: number;
  durationMinutes: number;
  onProceed: () => void;
}

export function CandidateInstructions({
  candidateName,
  interviewTitle,
  category,
  difficulty,
  numQuestions,
  durationMinutes,
  onProceed
}: InstructionsProps) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
          <Sparkles className="h-3.5 w-3.5" />
          InternAdda AI Digital Recruiter • Upforge.org
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Candidate Orientation & Instructions
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Welcome, <strong className="text-slate-900 dark:text-white font-bold">{candidateName}</strong>! Please review the candidate guidelines before beginning your AI Voice interview.
        </p>
      </div>

      {/* Main Instructions Card */}
      <div className="eightfold-card p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{interviewTitle}</h2>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span>Category: <strong className="text-slate-800 dark:text-slate-200">{category}</strong></span>
              <span>•</span>
              <span className="capitalize text-blue-600 dark:text-blue-400 font-semibold">{difficulty} Difficulty</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Clock className="h-4 w-4 text-blue-500" />
            {numQuestions} Questions ({durationMinutes} mins total)
          </div>
        </div>

        {/* 4 Ground Rules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950 p-4 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
              <Video className="h-4 w-4 text-blue-500" />
              1. Continuous Camera Feed
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Your webcam feed will be active throughout the interview. Maintain eye contact with your camera.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950 p-4 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
              <Mic className="h-4 w-4 text-indigo-500" />
              2. AI Voice & Speech Interaction
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              InternAdda AI will speak each question aloud. Click "Click to Speak Response" or type your answer clearly.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950 p-4 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              3. Anti-Cheat & Tab Monitoring
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Do not switch browser tabs or minimize the window. Tab focus violations will flag your session for disqualification.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950 p-4 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
              <CheckCircle2 className="h-4 w-4 text-amber-500" />
              4. 50% Score Qualification Bar
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Evaluations are instant. Candidates scoring ≥50% cross the qualification bar for the role.
            </p>
          </div>
        </div>

        {/* Proceed Action Button */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Clicking below will start Question 1 and launch active recording.
          </span>

          <button
            onClick={onProceed}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 px-8 py-3.5 text-xs font-semibold text-white shadow-xl shadow-blue-600/25 active:scale-95 transition-all"
          >
            <Mic className="h-4 w-4" />
            Begin AI Voice Session
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
