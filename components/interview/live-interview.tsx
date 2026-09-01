'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCcw,
  Send,
  Clock,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Radio,
  CheckCircle2
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

  // Attach webcam stream to preview box
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  // Load initial question
  useEffect(() => {
    fetchNextQuestion(1, []);
  }, []);

  // Question Timer Countdown
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

  // Text-To-Speech (TTS) Voice Synthesis for InternAdda AI
  const speakQuestion = (text: string) => {
    if (typeof window === 'undefined' || isAudioMuted) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop ongoing speech

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
      alert('Web Speech API is not supported in this browser. Please type your response using the fallback editor.');
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
      const textToUse = data.question_text || `Please describe a key project or experience in ${interview.category}.`;
      setQuestionText(textToUse);
      setContextHint(data.context_hint || '');

      // Trigger AI Speech Output
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
    <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Active Proctoring Engine */}
      <ProctoringMonitor
        mediaStream={mediaStream}
        onDisqualify={handleDisqualify}
        onFraudWarning={(flag) => setFraudFlags((prev) => [...prev, flag])}
      />

      {/* Top Header Control Bar */}
      <div className="silver-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-800 text-white shadow-md">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
              InternAdda AI Voice Mode
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Candidate: <strong className="text-slate-900 dark:text-slate-200 font-semibold">{attempt.candidate_name}</strong> ({interview.category})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Mute Audio Output Toggle */}
          <button
            onClick={() => {
              setIsAudioMuted(!isAudioMuted);
              if (!isAudioMuted && typeof window !== 'undefined') {
                window.speechSynthesis.cancel();
                setIsAiSpeaking(false);
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-white/80 dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            title={isAudioMuted ? 'Unmute AI Voice Output' : 'Mute AI Voice Output'}
          >
            {isAudioMuted ? (
              <>
                <VolumeX className="h-4 w-4 text-rose-500" />
                <span>Audio Muted</span>
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Audio On</span>
              </>
            )}
          </button>

          {/* Timer */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-1.5 text-xs text-slate-700 dark:text-slate-300">
            <Clock className={`h-4 w-4 ${timerSeconds < 30 ? 'text-rose-500 animate-pulse' : 'text-blue-600 dark:text-blue-400'}`} />
            <strong className={`font-mono text-sm ${timerSeconds < 30 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
              {timerFormatted}
            </strong>
          </div>

          <div className="rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
            Q <span className="text-blue-600 dark:text-blue-400">{currentQuestionIndex}</span> / {interview.num_questions}
          </div>
        </div>
      </div>

      {/* Perplexity Voice Mode Main Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Perplexity-Style Voice Orb & Question Box */}
        <div className="lg:col-span-8 space-y-6">
          <div className="silver-card rounded-3xl p-8 text-center space-y-6 relative overflow-hidden shadow-2xl">
            {/* Live Voice Mode Status Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
              <Radio className="h-4 w-4 animate-pulse text-blue-500" />
              {submittingAnswer
                ? 'EVALUATING CANDIDATE RESPONSE...'
                : isAiSpeaking
                ? 'INTERNADDA AI SPEAKING...'
                : isRecording
                ? 'LISTENING TO CANDIDATE...'
                : 'READY FOR CANDIDATE ANSWER'}
            </div>

            {/* Glowing Perplexity Voice Orb */}
            <div className="relative my-6 flex items-center justify-center">
              <div
                className={`h-32 w-32 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-500 to-emerald-400 flex items-center justify-center shadow-2xl transition-all duration-500 ${
                  isAiSpeaking || isRecording ? 'animate-orb-pulse scale-105' : 'opacity-90'
                }`}
              >
                <div className="h-24 w-24 rounded-full bg-white dark:bg-slate-950 flex items-center justify-center backdrop-blur-md">
                  <Sparkles className={`h-10 w-10 ${isAiSpeaking ? 'text-blue-600 animate-spin' : isRecording ? 'text-rose-500 animate-pulse' : 'text-indigo-500'}`} />
                </div>
              </div>

              {/* Animated Equalizer Waveform */}
              {(isAiSpeaking || isRecording) && (
                <div className="absolute -bottom-4 flex items-center gap-1">
                  {[1, 2, 3, 4, 5, 6, 7].map((bar) => (
                    <div
                      key={bar}
                      className="w-1.5 rounded-full bg-gradient-to-t from-blue-500 to-indigo-500 animate-equalizer-bar"
                      style={{ animationDelay: `${bar * 0.15}s` }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Question Text */}
            {loadingQuestion ? (
              <div className="py-6 text-slate-500 dark:text-slate-400 text-sm animate-pulse">
                Composing next question for {interview.category}...
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-relaxed max-w-2xl mx-auto">
                  "{questionText}"
                </p>

                {contextHint && (
                  <p className="text-xs text-blue-600 dark:text-blue-300 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-xl inline-block">
                    💡 <strong className="font-semibold">Evaluator Guidance:</strong> {contextHint}
                  </p>
                )}

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => speakQuestion(questionText)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-white/80 dark:bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-blue-500" />
                    Replay Voice Question
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Voice Input & Speech Transcript Card */}
          <div className="silver-card rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider">
                Candidate Speech Transcript
              </label>

              <button
                type="button"
                onClick={toggleRecording}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                  isRecording
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/30 animate-pulse'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 hover:brightness-110'
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

            {/* Answer Text Area */}
            <div className="relative">
              <textarea
                rows={4}
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Click 'Click to Speak Response' to answer via microphone, or type your response directly..."
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950 p-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none transition-colors"
              />
              <div className="absolute bottom-3 right-3 text-[11px] text-slate-400">
                {answerText.trim().split(/\s+/).filter(Boolean).length} words
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Speech evaluation uses executive domain rubrics.
              </span>

              <button
                type="button"
                disabled={submittingAnswer || loadingQuestion}
                onClick={() => submitAnswerCurrent(false)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/25 hover:brightness-110 active:scale-95 disabled:opacity-40 transition-all"
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

        {/* Right: Live Proctoring Video Feed */}
        <div className="lg:col-span-4 space-y-4">
          <div className="silver-card rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Live Proctoring Feed
              </span>
              <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                Active
              </span>
            </div>

            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover scale-x-[-1]"
              />
            </div>

            <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-slate-950/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between">
                <span>Tab Focus:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Verified</span>
              </div>
              <div className="flex justify-between">
                <span>Integrity Flags:</span>
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
