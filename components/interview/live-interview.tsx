'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCcw,
  Clock,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Radio,
  Video,
  AlertTriangle,
  Lock,
  Headphones
} from 'lucide-react';
import { Interview, CandidateAttempt, FraudFlag } from '@/lib/types';
import { ProctoringMonitor } from './proctoring-monitor';

interface LiveInterviewProps {
  interview: Interview;
  attempt: CandidateAttempt;
  mediaStream: MediaStream | null;
  onFinish: (disqualified?: boolean, flags?: FraudFlag[]) => void;
}

type VoiceState = 'idle' | 'ai_speaking' | 'listening' | 'processing';

export function LiveInterview({
  interview,
  attempt,
  mediaStream,
  onFinish
}: LiveInterviewProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(1);
  const [questionText, setQuestionText] = useState('');
  const [contextHint, setContextHint] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(interview.difficulty === 'hard' ? 120 : 180);
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [qaHistory, setQaHistory] = useState<{ question: string; answer: string }[]>([]);
  const [fraudFlags, setFraudFlags] = useState<FraudFlag[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const voiceStateRef = useRef<VoiceState>('idle');

  // Sync ref with state for speech callbacks
  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);

  // Attach webcam stream to video element
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  // Initialize Web Audio Analyser for Real-Time Mic Level Canvas Orb
  useEffect(() => {
    if (!mediaStream) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        const source = ctx.createMediaStreamSource(mediaStream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        source.connect(analyser);
        analyserRef.current = analyser;
      }
    } catch (err) {
      console.error('AudioContext setup error:', err);
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [mediaStream]);

  // Canvas Audio Orb Visualizer Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let step = 0;
    const dataArray = new Uint8Array(64);

    const renderOrb = () => {
      step += 0.05;
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = 55;

      ctx.clearRect(0, 0, width, height);

      let amplitude = 0;
      if (analyserRef.current && voiceStateRef.current === 'listening') {
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        amplitude = sum / dataArray.length / 255;
      }

      // Draw concentric ambient aura rings
      const currentState = voiceStateRef.current;
      const pulseFactor = currentState === 'ai_speaking'
        ? Math.sin(step * 3) * 8
        : currentState === 'listening'
        ? amplitude * 25
        : Math.sin(step) * 3;

      const primaryColor = currentState === 'ai_speaking'
        ? 'rgba(37, 99, 235, ' // Cool blue
        : currentState === 'listening'
        ? 'rgba(16, 185, 129, ' // Emerald green input
        : currentState === 'processing'
        ? 'rgba(245, 158, 11, ' // Amber processing
        : 'rgba(99, 102, 241, '; // Soft indigo idle

      // Outer ripple rings
      for (let r = 3; r >= 1; r--) {
        ctx.beginPath();
        const rRadius = baseRadius + r * 14 + pulseFactor * (r * 0.5);
        ctx.arc(centerX, centerY, rRadius, 0, Math.PI * 2);
        ctx.fillStyle = `${primaryColor}${0.08 / r})`;
        ctx.fill();
      }

      // Main Orb Circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius + pulseFactor, 0, Math.PI * 2);
      const gradient = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, baseRadius + pulseFactor);
      if (currentState === 'ai_speaking') {
        gradient.addColorStop(0, '#3b82f6');
        gradient.addColorStop(1, '#1d4ed8');
      } else if (currentState === 'listening') {
        gradient.addColorStop(0, '#10b981');
        gradient.addColorStop(1, '#047857');
      } else if (currentState === 'processing') {
        gradient.addColorStop(0, '#f59e0b');
        gradient.addColorStop(1, '#d97706');
      } else {
        gradient.addColorStop(0, '#6366f1');
        gradient.addColorStop(1, '#4338ca');
      }
      ctx.fillStyle = gradient;
      ctx.shadowColor = currentState === 'ai_speaking' ? '#2563eb' : '#10b981';
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw real-time reactive soundwave dots inside orb
      if (currentState === 'listening' || currentState === 'ai_speaking') {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 2;
        const wavePoints = 12;
        for (let i = 0; i < wavePoints; i++) {
          const angle = (i / wavePoints) * Math.PI * 2 + step;
          const dist = (baseRadius - 15) + (currentState === 'listening' ? amplitude * 18 * Math.sin(i + step * 2) : Math.sin(step * 4 + i) * 6);
          const x = centerX + Math.cos(angle) * dist;
          const y = centerY + Math.sin(angle) * dist;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      }

      animFrameRef.current = requestAnimationFrame(renderOrb);
    };

    renderOrb();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Initialize Question turn
  useEffect(() => {
    fetchNextQuestion(1, []);
  }, []);

  // Timer countdown per question
  useEffect(() => {
    if (loadingQuestion || submittingAnswer) return;

    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmitTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loadingQuestion, submittingAnswer, currentQuestionIndex]);

  // Web Speech API Voice Recognition setup (continuous = false per turn)
  const startListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false; // Turn-by-turn fresh recognition prevents buffer bleed
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setVoiceState('listening');
      };

      recognition.onresult = (event: any) => {
        // DISCARD any transcript if AI is currently speaking! (Acoustic loop protection)
        if (voiceStateRef.current === 'ai_speaking') return;

        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + ' ';
        }
        setAnswerText((prev) => {
          const trimmed = prev.trim();
          return trimmed ? `${trimmed} ${transcript.trim()}` : transcript.trim();
        });
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (voiceStateRef.current === 'listening') {
          setVoiceState('idle');
        }
      };

      recognition.onend = () => {
        if (voiceStateRef.current === 'listening') {
          setVoiceState('idle');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setVoiceState('idle');
  };

  // Text-To-Speech (TTS) Voice Synthesis with state machine lock
  const speakQuestion = (text: string) => {
    if (typeof window === 'undefined' || isAudioMuted) return;

    if ('speechSynthesis' in window) {
      // 1. STOP microphone recognition before TTS starts speaking!
      stopListening();
      window.speechSynthesis.cancel();

      setVoiceState('ai_speaking');

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setVoiceState('ai_speaking');
      };

      utterance.onend = () => {
        setVoiceState('idle');
        // 2. Add 400ms acoustic tail clearing delay before enabling mic recognizer!
        setTimeout(() => {
          if (voiceStateRef.current === 'idle') {
            startListening();
          }
        }, 400);
      };

      utterance.onerror = () => {
        setVoiceState('idle');
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleRecording = () => {
    if (voiceState === 'ai_speaking') {
      window.speechSynthesis.cancel();
      setVoiceState('idle');
    }

    if (voiceState === 'listening') {
      stopListening();
    } else {
      startListening();
    }
  };

  const fetchNextQuestion = async (
    qIndex: number,
    history: { question: string; answer: string }[]
  ) => {
    setLoadingQuestion(true);
    setVoiceState('processing');
    setTimerSeconds(interview.difficulty === 'hard' ? 120 : 180);

    try {
      const res = await fetch('/api/interview/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: interview.category,
          difficulty: interview.difficulty,
          questionIndex: qIndex,
          totalQuestions: interview.num_questions,
          previousQA: history
        })
      });

      const data = await res.json();
      const textToUse = data.question_text || `Please detail a core engineering or leadership challenge you faced in ${interview.category}.`;
      setQuestionText(textToUse);
      setContextHint(data.context_hint || '');

      speakQuestion(textToUse);
    } catch (err) {
      console.error('Failed to fetch question:', err);
      const fallbackText = `Could you describe a technical or strategic decision you made in ${interview.category} and its quantifiable outcome?`;
      setQuestionText(fallbackText);
      speakQuestion(fallbackText);
    } finally {
      setLoadingQuestion(false);
    }
  };

  const handleAutoSubmitTimeUp = () => {
    submitAnswerCurrent(true);
  };

  const submitAnswerCurrent = async (isTimeUp = false) => {
    if (submittingAnswer) return;

    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel();
    }
    stopListening();
    setVoiceState('processing');
    setSubmittingAnswer(true);

    const currentAns = answerText.trim() || (isTimeUp ? '(Time expired - No spoken or typed response recorded)' : '(No response typed)');

    try {
      await fetch('/api/interview/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attempt_id: attempt.id,
          questionIndex: currentQuestionIndex,
          question_text: questionText,
          candidate_answer: currentAns,
          category: interview.category,
          difficulty: interview.difficulty
        })
      });

      const updatedHistory = [...qaHistory, { question: questionText, answer: currentAns }];
      setQaHistory(updatedHistory);
      setAnswerText('');

      if (currentQuestionIndex < interview.num_questions) {
        const nextIdx = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIdx);
        await fetchNextQuestion(nextIdx, updatedHistory);
      } else {
        await fetch('/api/interview/finish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attempt_id: attempt.id,
            fraud_flags: fraudFlags
          })
        });

        onFinish(false, fraudFlags);
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleDisqualify = async (reason: string, flags: FraudFlag[]) => {
    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel();
    }
    stopListening();
    setFraudFlags(flags);
    await fetch('/api/interview/finish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attempt_id: attempt.id,
        disqualified: true,
        fraud_flags: flags
      })
    });
    onFinish(true, flags);
  };

  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  const timerFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Active Proctoring Engine */}
      <ProctoringMonitor
        mediaStream={mediaStream}
        onDisqualify={handleDisqualify}
        onFraudWarning={(flag) => setFraudFlags((prev) => [...prev, flag])}
      />

      {/* Top Status & Session Control Bar */}
      <div className="eightfold-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold shadow-sm shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                AI Interviewer Session
              </span>
              {interview.difficulty === 'hard' && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  Hard Mode Rigor
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-500">
              Candidate: <strong className="text-slate-900 font-semibold">{attempt.candidate_name}</strong> ({interview.category})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const newMute = !isAudioMuted;
              setIsAudioMuted(newMute);
              if (newMute && typeof window !== 'undefined') {
                window.speechSynthesis.cancel();
                setVoiceState('idle');
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all"
          >
            {isAudioMuted ? (
              <>
                <VolumeX className="h-4 w-4 text-rose-600" />
                <span>Audio Muted</span>
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4 text-blue-600" />
                <span>Audio Output On</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs text-slate-700">
            <Clock className={`h-4 w-4 ${timerSeconds < 30 ? 'text-rose-600 animate-pulse' : 'text-blue-600'}`} />
            <strong className={`font-mono text-sm ${timerSeconds < 30 ? 'text-rose-600' : 'text-slate-900'}`}>
              {timerFormatted}
            </strong>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-800">
            Question <span className="text-blue-600">{currentQuestionIndex}</span> / {interview.num_questions}
          </div>
        </div>
      </div>

      {/* Main Split-Screen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Interactive Voice Box & Canvas Orb */}
        <div className="lg:col-span-7 space-y-6">
          <div className="eightfold-card p-6 sm:p-8 space-y-6 text-center relative overflow-hidden">
            {/* Live State Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-bold text-slate-700">
              <Radio className={`h-4 w-4 ${voiceState === 'ai_speaking' ? 'text-blue-600 animate-pulse' : voiceState === 'listening' ? 'text-emerald-600 animate-pulse' : 'text-slate-400'}`} />
              {voiceState === 'ai_speaking'
                ? 'AI INTERVIEWER SPEAKING...'
                : voiceState === 'listening'
                ? 'LISTENING TO CANDIDATE...'
                : voiceState === 'processing'
                ? 'EVALUATING COMPETENCY...'
                : 'READY FOR ANSWER'}
            </div>

            {/* Real-time HTML5 Canvas Audio Orb Visualizer */}
            <div className="relative my-4 flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={220}
                height={220}
                className="mx-auto rounded-full"
              />
            </div>

            {/* Question Display */}
            {loadingQuestion ? (
              <div className="py-6 text-slate-400 text-sm animate-pulse">
                Generating domain-adaptive question...
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-relaxed">
                  "{questionText}"
                </p>

                {contextHint && (
                  <p className="text-xs text-blue-800 bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl inline-block">
                    💡 <strong className="font-semibold">Evaluator Guidance:</strong> {contextHint}
                  </p>
                )}

                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    onClick={() => speakQuestion(questionText)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-blue-600" />
                    Replay Question Audio
                  </button>

                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Headphones className="h-3.5 w-3.5 text-slate-400" />
                    Headphones recommended
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Candidate Speech Transcript & Response Area */}
          <div className="eightfold-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Candidate Speech Transcript
              </label>

              <button
                type="button"
                onClick={toggleRecording}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                  voiceState === 'listening'
                    ? 'bg-rose-600 text-white shadow-md animate-pulse'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                }`}
              >
                {voiceState === 'listening' ? (
                  <>
                    <MicOff className="h-4 w-4" /> Pause Speech Recording
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" /> Click to Speak Response
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <textarea
                rows={4}
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Click 'Click to Speak Response' to capture microphone input, or type your response directly..."
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-4 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none transition-colors"
              />
              <div className="absolute bottom-3 right-3 text-[11px] text-slate-400">
                {answerText.trim().split(/\s+/).filter(Boolean).length} words
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Evaluation follows standardized STAR rubric
              </span>

              <button
                type="button"
                disabled={submittingAnswer || loadingQuestion}
                onClick={() => submitAnswerCurrent(false)}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-xs font-semibold text-white shadow-sm active:scale-95 disabled:opacity-40 transition-all"
              >
                {submittingAnswer ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                    Evaluating Answer...
                  </span>
                ) : (
                  <>
                    Submit & Next Question
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: In-Browser Candidate Video Feed */}
        <div className="lg:col-span-5 space-y-4">
          <div className="eightfold-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <Video className="h-4 w-4 text-blue-600" />
                Live Candidate Camera Feed
              </div>

              <div className="flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-[11px] font-bold text-rose-700">
                <span className="h-2 w-2 rounded-full bg-rose-600 animate-rec-dot"></span>
                <span>PROCTORING ACTIVE</span>
              </div>
            </div>

            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-950 shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover scale-x-[-1]"
              />
            </div>

            <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between">
                <span>Tab Focus Integrity:</span>
                <span className="text-emerald-700 font-semibold">Active Monitoring</span>
              </div>
              <div className="flex justify-between">
                <span>Proctoring Flag Count:</span>
                <span className={fraudFlags.length > 0 ? 'text-rose-700 font-bold' : 'text-slate-700'}>
                  {fraudFlags.length} flags logged
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 text-[11px] text-slate-500">
                <span>Privacy Status:</span>
                <span className="font-medium text-slate-700">In-Browser Analysis (Zero Storage)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
