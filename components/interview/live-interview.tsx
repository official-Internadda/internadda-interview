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
  AlertTriangle
} from 'lucide-react';
import { Interview, CandidateAttempt, FraudFlag } from '@/lib/types';
import { ProctoringMonitor } from './proctoring-monitor';

interface LiveInterviewProps {
  interview: Interview;
  attempt: CandidateAttempt;
  mediaStream: MediaStream | null;
  onFinish: (disqualified?: boolean, flags?: FraudFlag[]) => void;
}

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
  const [isRecording, setIsRecording] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(180); // 3 mins per question
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [qaHistory, setQaHistory] = useState<{ question: string; answer: string }[]>([]);
  const [fraudFlags, setFraudFlags] = useState<FraudFlag[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Attach media stream to video preview box
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  // Load initial question
  useEffect(() => {
    fetchNextQuestion(1, []);
  }, []);

  // Timer countdown
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

  // Web Speech API Voice Recognition Initialization
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript + ' ';
          }
          setAnswerText(transcript);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  // Text-To-Speech (TTS) Voice Synthesis
  const speakQuestion = (text: string) => {
    if (typeof window === 'undefined' || isAudioMuted) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsAiSpeaking(true);
      utterance.onend = () => setIsAiSpeaking(false);
      utterance.onerror = () => setIsAiSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Web Speech API is not supported in this browser. Please type your response using the text area.');
      return;
    }

    if (isAiSpeaking && typeof window !== 'undefined') {
      window.speechSynthesis.cancel();
      setIsAiSpeaking(false);
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const fetchNextQuestion = async (
    qIndex: number,
    history: { question: string; answer: string }[]
  ) => {
    setLoadingQuestion(true);
    setTimerSeconds(180);

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
      const textToUse = data.question_text || `Please describe a key project or scenario in ${interview.category}.`;
      setQuestionText(textToUse);
      setContextHint(data.context_hint || '');

      speakQuestion(textToUse);
    } catch (err) {
      console.error('Failed to fetch question:', err);
      const fallbackText = `Could you share a practical scenario from your work in ${interview.category}?`;
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
      setIsAiSpeaking(false);
    }

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    setSubmittingAnswer(true);
    const currentAns = answerText.trim() || (isTimeUp ? '(Time expired - No answer recorded)' : '(No answer typed)');

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

      {/* Eightfold Top Status Control Bar */}
      <div className="eightfold-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold shadow-md">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
              Eightfold AI Interviewer Engine
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Candidate: <strong className="text-slate-900 dark:text-slate-200 font-semibold">{attempt.candidate_name}</strong> ({interview.category})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsAudioMuted(!isAudioMuted);
              if (!isAudioMuted && typeof window !== 'undefined') {
                window.speechSynthesis.cancel();
                setIsAiSpeaking(false);
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            {isAudioMuted ? (
              <>
                <VolumeX className="h-4 w-4 text-rose-500" />
                <span>Audio Muted</span>
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Audio Output On</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-1.5 text-xs text-slate-700 dark:text-slate-300">
            <Clock className={`h-4 w-4 ${timerSeconds < 30 ? 'text-rose-500 animate-pulse' : 'text-blue-600 dark:text-blue-400'}`} />
            <strong className={`font-mono text-sm ${timerSeconds < 30 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
              {timerFormatted}
            </strong>
          </div>

          <div className="rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
            Question <span className="text-blue-600 dark:text-blue-400">{currentQuestionIndex}</span> / {interview.num_questions}
          </div>
        </div>
      </div>

      {/* Eightfold Split Screen Layout (Desktop: Side-by-Side | Mobile: Stacked) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: AI Interviewer Voice Box */}
        <div className="lg:col-span-7 space-y-6">
          <div className="eightfold-card p-6 sm:p-8 space-y-6 text-center shadow-xl relative overflow-hidden">
            {/* Live State Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
              <Radio className="h-4 w-4 animate-pulse text-blue-500" />
              {submittingAnswer
                ? 'EVALUATING RESPONSE...'
                : isAiSpeaking
                ? 'AI DIGITAL RECRUITER SPEAKING...'
                : isRecording
                ? 'LISTENING TO CANDIDATE...'
                : 'READY FOR ANSWER'}
            </div>

            {/* Glowing AI Voice Orb & Waveform */}
            <div className="relative my-6 flex items-center justify-center">
              <div
                className={`h-28 w-28 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 flex items-center justify-center shadow-xl transition-all duration-300 ${
                  isAiSpeaking || isRecording ? 'animate-orb-glow scale-105' : 'opacity-90'
                }`}
              >
                <div className="h-20 w-20 rounded-full bg-white dark:bg-slate-950 flex items-center justify-center">
                  <Sparkles className={`h-8 w-8 ${isAiSpeaking ? 'text-blue-600 animate-spin' : isRecording ? 'text-rose-500 animate-pulse' : 'text-indigo-500'}`} />
                </div>
              </div>

              {(isAiSpeaking || isRecording) && (
                <div className="absolute -bottom-3 flex items-center gap-1">
                  {[1, 2, 3, 4, 5, 6, 7].map((bar) => (
                    <div
                      key={bar}
                      className="w-1.5 rounded-full bg-blue-600 animate-voice-bar"
                      style={{ animationDelay: `${bar * 0.15}s` }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Question Display */}
            {loadingQuestion ? (
              <div className="py-6 text-slate-400 text-sm animate-pulse">
                Composing next question for {interview.category}...
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-relaxed">
                  "{questionText}"
                </p>

                {contextHint && (
                  <p className="text-xs text-blue-600 dark:text-blue-300 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-xl inline-block">
                    💡 <strong className="font-semibold">Evaluator Guidance:</strong> {contextHint}
                  </p>
                )}

                <div className="pt-2">
                  <button
                    onClick={() => speakQuestion(questionText)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-blue-500" />
                    Replay Voice Question
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Speech Transcript & Response Editor */}
          <div className="eightfold-card p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider">
                Candidate Speech Transcript
              </label>

              <button
                type="button"
                onClick={toggleRecording}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                  isRecording
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 animate-pulse'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20'
                }`}
              >
                {isRecording ? (
                  <>
                    <MicOff className="h-4 w-4" /> Stop Voice Recording
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
                placeholder="Click 'Click to Speak Response' to record your speech, or type your answer directly..."
                className="w-full rounded-2xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-600 focus:outline-none transition-colors"
              />
              <div className="absolute bottom-3 right-3 text-[11px] text-slate-400">
                {answerText.trim().split(/\s+/).filter(Boolean).length} words
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                Evaluation follows Eightfold domain rubrics.
              </span>

              <button
                type="button"
                disabled={submittingAnswer || loadingQuestion}
                onClick={() => submitAnswerCurrent(false)}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/25 active:scale-95 disabled:opacity-40 transition-all"
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

        {/* Right Side: Candidate Video Recording Container */}
        <div className="lg:col-span-5 space-y-4">
          <div className="eightfold-card p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                <Video className="h-4 w-4 text-blue-600" />
                Candidate Recording Feed
              </div>

              {/* Red REC dot indicator */}
              <div className="flex items-center gap-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 px-3 py-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                <span className="h-2 w-2 rounded-full bg-rose-600 animate-rec-dot"></span>
                <span>REC</span>
              </div>
            </div>

            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-800 bg-slate-950 shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover scale-x-[-1]"
              />
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between">
                <span>Tab Focus Monitor:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Active & Compliance Verified</span>
              </div>
              <div className="flex justify-between">
                <span>Proctoring Flags:</span>
                <span className={fraudFlags.length > 0 ? 'text-rose-600 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                  {fraudFlags.length} recorded
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
