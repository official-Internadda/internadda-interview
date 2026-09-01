'use client';

import { useState, useEffect, useRef } from 'react';
import { Camera, Mic, CheckCircle2, AlertCircle, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

interface PreCheckProps {
  interviewTitle: string;
  category: string;
  difficulty: string;
  durationMinutes: number;
  numQuestions: number;
  onStart: (candidateInfo: { name: string; email: string; stream: MediaStream }) => void;
}

export function PreCheck({
  interviewTitle,
  category,
  difficulty,
  durationMinutes,
  numQuestions,
  onStart
}: PreCheckProps) {
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [hasMic, setHasMic] = useState<boolean | null>(null);
  const [micLevel, setMicLevel] = useState<number>(0);
  const [permissionError, setPermissionError] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;

    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: true
        });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        mediaStreamRef.current = stream;
        setHasCamera(true);
        setHasMic(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateVolume = () => {
            if (!analyserRef.current || !active) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            setMicLevel(Math.min(100, Math.round((average / 128) * 100)));
            animFrameRef.current = requestAnimationFrame(updateVolume);
          };
          updateVolume();
        }
      } catch (err: any) {
        console.error('Media permission error:', err);
        setHasCamera(false);
        setHasMic(false);
        setPermissionError(
          'Camera and Microphone access are required to begin the interview. Please check browser permissions.'
        );
      }
    }

    initMedia();

    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const handleStartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim() || !candidateEmail.trim()) return;
    if (!mediaStreamRef.current || !hasCamera || !hasMic) return;

    onStart({
      name: candidateName,
      email: candidateEmail,
      stream: mediaStreamRef.current
    });
  };

  const isReady = Boolean(hasCamera && hasMic && candidateName.trim() && candidateEmail.trim());

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
          <Sparkles className="h-3.5 w-3.5" />
          InternAdda AI Voice Evaluation Suite
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{interviewTitle}</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Conducted by InternAdda for <span className="text-blue-600 dark:text-blue-400 font-semibold">upforge.org</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Video Preview & Mic Level */}
        <div className="lg:col-span-7 space-y-4">
          <div className="silver-card rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 flex items-center gap-2">
                <Camera className="h-4 w-4 text-blue-500" />
                Live Camera Preview
              </span>
              {hasCamera ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-3 w-3" /> Camera Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  <AlertCircle className="h-3 w-3" /> Camera Required
                </span>
              )}
            </div>

            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 flex items-center justify-center shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover scale-x-[-1]"
              />
              {!hasCamera && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-950/90 text-slate-400">
                  <Camera className="h-10 w-10 text-rose-400 mb-2 animate-bounce" />
                  <p className="text-xs font-semibold text-white">Camera Access Needed</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                    Please grant browser camera & mic permissions to launch your interview.
                  </p>
                </div>
              )}
            </div>

            {/* Mic Meter */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Mic className="h-4 w-4 text-indigo-500" />
                  Microphone Audio Input Level
                </span>
                <span className="text-slate-500 text-[11px]">{micLevel}%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 transition-all duration-75"
                  style={{ width: `${Math.max(5, micLevel)}%` }}
                />
              </div>
            </div>
          </div>

          {permissionError && (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block text-slate-900 dark:text-white">Permission Required</strong>
                <p>{permissionError}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Interview Setup Details & Form */}
        <div className="lg:col-span-5 space-y-4">
          <div className="silver-card rounded-3xl p-6 space-y-5 shadow-xl">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider mb-2">Interview Summary</h3>
              <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500">Category:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{category}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500">Difficulty:</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400 capitalize">{difficulty}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500">Questions:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{numQuestions} Questions</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Qualifying Bar:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">50% Score Required</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleStartSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-900 dark:text-slate-200 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 py-2.5 px-4 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-900 dark:text-slate-200 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={candidateEmail}
                  onChange={(e) => setCandidateEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 py-2.5 px-4 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!isReady}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-800 py-3.5 text-xs font-semibold text-white shadow-xl shadow-blue-500/25 hover:brightness-110 active:scale-[0.99] disabled:opacity-40 transition-all"
                >
                  <ShieldCheck className="h-4 w-4" />
                  {isReady ? 'Start Voice Interview' : 'Verify Hardware to Continue'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
