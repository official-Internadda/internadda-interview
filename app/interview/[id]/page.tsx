'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { PreCheck } from '@/components/interview/pre-check';
import { LiveInterview } from '@/components/interview/live-interview';
import { Interview, CandidateAttempt, FraudFlag } from '@/lib/types';
import { ShieldAlert, AlertCircle } from 'lucide-react';

export default function StudentInterviewPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;

  const [interview, setInterview] = useState<Interview | null>(null);
  const [attempt, setAttempt] = useState<CandidateAttempt | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [step, setStep] = useState<'precheck' | 'live' | 'disqualified'>('precheck');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [disqualificationReason, setDisqualificationReason] = useState('');

  useEffect(() => {
    async function loadInterview() {
      try {
        setLoading(true);
        const res = await fetch(`/api/interview/${interviewId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Interview not found');
        setInterview(data.interview);
      } catch (err: any) {
        setError(err.message || 'Failed to load interview');
      } finally {
        setLoading(false);
      }
    }
    if (interviewId) loadInterview();
  }, [interviewId]);

  const handleStartInterview = async (candidateInfo: { name: string; email: string; stream: MediaStream }) => {
    try {
      setLoading(true);
      const res = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interview_id: interviewId,
          candidate_name: candidateInfo.name,
          candidate_email: candidateInfo.email
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register candidate session');

      setAttempt(data.attempt);
      setMediaStream(candidateInfo.stream);
      setStep('live');
    } catch (err: any) {
      setError(err.message || 'Failed to initialize session');
    } finally {
      setLoading(false);
    }
  };

  const handleFinishInterview = (disqualified = false, flags: FraudFlag[] = []) => {
    if (disqualified) {
      setDisqualificationReason('Disqualified — Integrity Violation during interview.');
      setStep('disqualified');
    } else if (attempt) {
      router.push(`/interview/${interviewId}/report/${attempt.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <div className="h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
            <p className="text-xs">Loading InternAdda AI Session...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
        <Navbar />
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="max-w-md w-full rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-center space-y-4">
            <AlertCircle className="h-10 w-10 text-rose-400 mx-auto" />
            <h2 className="text-lg font-bold text-white">Interview Session Error</h2>
            <p className="text-xs text-rose-300">{error || 'This interview link is invalid or has been archived.'}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1">
        {step === 'precheck' && (
          <PreCheck
            interviewTitle={interview.title}
            category={interview.category}
            difficulty={interview.difficulty}
            durationMinutes={interview.duration_minutes}
            numQuestions={interview.num_questions}
            onStart={handleStartInterview}
          />
        )}

        {step === 'live' && attempt && (
          <LiveInterview
            interview={interview}
            attempt={attempt}
            mediaStream={mediaStream}
            onFinish={handleFinishInterview}
          />
        )}

        {step === 'disqualified' && (
          <div className="mx-auto max-w-xl px-4 py-16 text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white">Interview Terminated</h1>
              <p className="text-sm font-semibold text-rose-400 uppercase tracking-wider">
                Disqualified — Integrity Violation
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {disqualificationReason ||
                  'The interview was automatically cancelled because one or more proctoring integrity rules were violated.'}
              </p>
            </div>
            <div className="pt-4">
              {attempt && (
                <a
                  href={`/interview/${interviewId}/report/${attempt.id}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-700"
                >
                  View Integrity Audit Report
                </a>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
