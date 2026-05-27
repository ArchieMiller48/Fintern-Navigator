"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { saveInterviewRecord } from "@/lib/storage";

/* ── Types ─────────────────────────────────────────────────────────────────── */
type Stage = "loading" | "camera" | "ready" | "interviewing" | "evaluating" | "results";
type Message = { role: "user" | "assistant"; content: string };

interface Config {
  role: "spring_week" | "summer_internship" | "graduate";
  duration: number;
  firm: string;
  jd: string;
}

interface Evaluation {
  overallScore: number;
  communicationScore: number;
  commercialScore: number;
  motivationScore: number;
  competencyScore: number;
  technicalScore: number;
  scoreRationale: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  questionFeedback: { question: string; summary: string; feedback: string; score: number }[];
}

const ROLE_LABELS: Record<string, string> = {
  spring_week: "Spring Week",
  summer_internship: "Summer Internship",
  graduate: "Graduate Role",
};

/* ── Score helpers ─────────────────────────────────────────────────────────── */
function scoreColor(s: number) {
  return s >= 75 ? "#4ade80" : s >= 55 ? "#f59e0b" : "#f87171";
}
function scoreLabel(s: number) {
  return s >= 75 ? "Strong" : s >= 55 ? "Good" : "Needs Work";
}

/* ── Main component ─────────────────────────────────────────────────────────── */
export default function InterviewSessionPage() {
  const router = useRouter();

  /* Config */
  const [config, setConfig] = useState<Config | null>(null);
  const [cvText, setCvText] = useState("");

  /* Stage */
  const [stage, setStage] = useState<Stage>("loading");

  /* Camera */
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState(false);

  /* Timer */
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timedOutRef = useRef(false);

  /* Conversation */
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [interviewerSpeaking, setInterviewerSpeaking] = useState(false);
  const [waitingForResponse, setWaitingForResponse] = useState(false);

  /* Response input */
  const [response, setResponse] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  /* Evaluation */
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [evalTab, setEvalTab] = useState<"overview" | "questions">("overview");
  const [scoreDisplay, setScoreDisplay] = useState(0);
  const [barsLoaded, setBarsLoaded] = useState(false);

  /* Load config from sessionStorage */
  useEffect(() => {
    const raw = sessionStorage.getItem("interview_config");
    if (!raw) { router.push("/interview-prep"); return; }

    const cfg: Config = JSON.parse(raw);
    setConfig(cfg);
    setSecondsLeft(cfg.duration * 60);

    // Extract CV text from base64 data URL if present
    const cvData = sessionStorage.getItem("interview_cv_data");
    if (cvData && cvData.startsWith("data:")) {
      // We only need the name + raw for context — send the base64 to a quick extraction
      // For now, store as placeholder; we'll pull text via inline approach
      const name = sessionStorage.getItem("interview_cv_name") ?? "";
      setCvText(`[CV: ${name} — candidate has attached their CV for context]`);
    }

    setSpeechSupported(
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    );
    setStage("camera");
  }, [router]);

  /* Camera setup — only runs once on mount */
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setStage("ready");
      })
      .catch(() => {
        setCameraError(true);
        setStage("ready");
      });

    // Only stop tracks when the component fully unmounts
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Re-attach stream whenever the video element re-mounts (stage changes) */
  useEffect(() => {
    if (!streamRef.current || !videoRef.current) return;
    if (videoRef.current.srcObject !== streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  });

  /* TTS — speak interviewer text */
  const speakText = useCallback((text: string, onDone?: () => void) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      onDone?.();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-GB";
    utterance.rate = 0.92;
    utterance.pitch = 1.0;

    // Prefer a natural English voice
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const preferred =
        voices.find((v) => v.name.toLowerCase().includes("google uk")) ||
        voices.find((v) => v.lang === "en-GB") ||
        voices.find((v) => v.lang.startsWith("en"));
      if (preferred) utterance.voice = preferred;
    };
    loadVoices();
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    utterance.onstart = () => setInterviewerSpeaking(true);
    utterance.onend = () => {
      setInterviewerSpeaking(false);
      onDone?.();
    };
    utterance.onerror = () => {
      setInterviewerSpeaking(false);
      onDone?.();
    };
    window.speechSynthesis.speak(utterance);
  }, []);

  /* Stream interviewer message from API */
  const fetchInterviewerMessage = useCallback(
    async (history: Message[], isTimeUp = false) => {
      if (!config) return;
      setWaitingForResponse(true);
      setStreamingText("");

      // Anthropic requires at least one message — seed with an opening prompt if empty
      const baseHistory: Message[] =
        history.length === 0
          ? [{ role: "user", content: "Please begin the interview now." }]
          : history;

      const messagesForApi = isTimeUp
        ? [
            ...baseHistory,
            {
              role: "user" as const,
              content: "[The interview time has ended. Please wrap up the interview naturally.]",
            },
          ]
        : baseHistory;

      try {
        const res = await fetch("/api/interview/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: messagesForApi,
            config: { ...config, cvText },
          }),
        });

        if (!res.ok) throw new Error("API error");

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let full = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          full += chunk;
          setStreamingText(full);
        }

        setStreamingText("");
        setCurrentQuestion(full);
        const newHistory: Message[] = [...messagesForApi, { role: "assistant", content: full }];
        setMessages(newHistory);
        setWaitingForResponse(false);

        // Speak the interviewer's message
        speakText(full, () => {
          // After speaking, check if interview is over
          const lowerFull = full.toLowerCase();
          const isGoodbye =
            lowerFull.includes("hear from") ||
            lowerFull.includes("best of luck") ||
            lowerFull.includes("good luck") ||
            lowerFull.includes("thank you for your time") ||
            lowerFull.includes("we'll be in touch");

          if (isGoodbye) {
            endInterview(newHistory);
          }
        });
      } catch (err) {
        console.error(err);
        setWaitingForResponse(false);
        setCurrentQuestion("I'm sorry, I had a technical issue. Could you repeat that?");
      }
    },
    [config, cvText, speakText]
  );

  /* Start interview */
  function startInterview() {
    setStage("interviewing");
    setMessages([]);
    fetchInterviewerMessage([]);
  }

  /* Timer countdown */
  useEffect(() => {
    if (stage !== "interviewing") return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          if (!timedOutRef.current) {
            timedOutRef.current = true;
            // Let the current fetch finish, then send time-up
            setMessages((prev) => {
              fetchInterviewerMessage(prev, true);
              return prev;
            });
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [stage, fetchInterviewerMessage]);

  /* Format timer */
  function formatTime(secs: number) {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  /* Speech recognition */
  function toggleListening() {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-GB";
    recognition.onresult = (e: any) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + " ";
        else interim += e.results[i][0].transcript;
      }
      setResponse((r) => (r + final).trimStart() + interim);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
    window.speechSynthesis?.cancel();
  }

  /* Submit user response */
  async function submitResponse() {
    if (!response.trim() || waitingForResponse || interviewerSpeaking) return;
    window.speechSynthesis?.cancel();
    recognitionRef.current?.stop();
    setIsListening(false);

    const userMsg: Message = { role: "user", content: response.trim() };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setResponse("");
    await fetchInterviewerMessage(newHistory);
  }

  /* End interview + evaluate */
  async function endInterview(history?: Message[]) {
    const finalHistory = history ?? messages;
    clearInterval(timerRef.current!);
    window.speechSynthesis?.cancel();
    setStage("evaluating");

    // Build readable transcript
    const transcript = finalHistory
      .map((m) => `${m.role === "assistant" ? "Interviewer" : "Candidate"}: ${m.content}`)
      .join("\n\n");

    try {
      const res = await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, config }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEvaluation(data.evaluation);
      saveInterviewRecord({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        role: config?.role ?? "",
        firm: config?.firm ?? "",
        overallScore: data.evaluation.overallScore,
        communicationScore: data.evaluation.communicationScore,
        commercialScore: data.evaluation.commercialScore,
        motivationScore: data.evaluation.motivationScore,
        competencyScore: data.evaluation.competencyScore,
        technicalScore: data.evaluation.technicalScore,
      });
      setStage("results");
    } catch (err) {
      console.error(err);
      setStage("results"); // Show partial results if evaluation fails
    }
  }

  /* Animate score ring on results */
  useEffect(() => {
    if (stage !== "results" || !evaluation) return;
    let n = 0;
    const interval = setInterval(() => {
      n = Math.min(n + 2, evaluation.overallScore);
      setScoreDisplay(n);
      if (n >= evaluation.overallScore) clearInterval(interval);
    }, 22);
    const t = setTimeout(() => setBarsLoaded(true), 300);
    return () => { clearInterval(interval); clearTimeout(t); };
  }, [stage, evaluation]);

  /* ── RENDER ──────────────────────────────────────────────────────────────── */

  if (stage === "loading" || stage === "camera") {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="size-12 rounded-2xl flex items-center justify-center animate-pulse"
          style={{ background: "rgba(99,102,241,.15)", border: "1px solid rgba(99,102,241,.3)" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-400)" strokeWidth="1.8">
            <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/>
          </svg>
        </div>
        <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
          {stage === "camera" ? "Requesting camera access…" : "Loading…"}
        </p>
      </div>
    );
  }

  /* ── READY (pre-interview brief) ── */
  if (stage === "ready" && config) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6 animate-fade-up" style={{ maxWidth: 520, margin: "0 auto" }}>
        <div className="size-16 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(99,102,241,.15)", border: "1px solid rgba(99,102,241,.3)" }}>
          <span className="text-3xl">🎙️</span>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--color-foreground)" }}>
            Ready to begin
          </h2>
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>
            {ROLE_LABELS[config.role]} · {config.duration} minutes
            {config.firm ? ` · ${config.firm}` : ""}
          </p>
        </div>

        {/* Camera preview */}
        <div className="w-full rounded-xl overflow-hidden border" style={{ borderColor: "var(--color-border)", aspectRatio: "16/9", background: "var(--color-surface-1)" }}>
          {cameraError ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <span className="text-3xl">📷</span>
              <p className="text-xs" style={{ color: "var(--color-muted)" }}>Camera unavailable — interview will continue without video</p>
            </div>
          ) : (
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
          )}
        </div>

        <div className="w-full rounded-xl border p-4 space-y-2" style={{ background: "var(--color-surface-1)", borderColor: "var(--color-border)" }}>
          <p className="text-xs font-semibold" style={{ color: "var(--color-foreground)" }}>Before you start</p>
          <ul className="text-xs space-y-1.5" style={{ color: "var(--color-muted)" }}>
            <li>• Find a quiet spot — the interviewer will speak aloud to you</li>
            <li>• Use the microphone button or type your responses</li>
            <li>• Answer as you would in a real interview — think before you speak</li>
          </ul>
        </div>

        <button
          onClick={startInterview}
          className="w-full py-3.5 rounded-xl font-semibold text-white text-sm"
          style={{ background: "var(--color-brand-600)" }}
        >
          Begin Interview
        </button>
      </div>
    );
  }

  /* ── INTERVIEWING ── */
  if (stage === "interviewing" && config) {
    const isUrgent = secondsLeft <= 60;
    const displayText = streamingText || currentQuestion;

    return (
      <div className="space-y-4 animate-fade-up">
        {/* Top bar */}
        <div className="flex items-center justify-between px-1">
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>
              {config.firm || ROLE_LABELS[config.role] + " Interview"}
            </p>
            <p className="text-xs" style={{ color: "var(--color-muted)" }}>
              Alex Carter · Senior Recruiter
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="px-3 py-1.5 rounded-lg text-sm font-mono font-semibold"
              style={{
                background: isUrgent ? "rgba(239,68,68,.1)" : "var(--color-surface-1)",
                border: `1px solid ${isUrgent ? "rgba(239,68,68,.3)" : "var(--color-border)"}`,
                color: isUrgent ? "#f87171" : "var(--color-foreground)",
              }}
            >
              {formatTime(secondsLeft)}
            </div>
            <button
              onClick={() => endInterview()}
              className="px-3 py-1.5 rounded-lg text-xs border"
              style={{ background: "var(--color-surface-1)", borderColor: "var(--color-border)", color: "var(--color-muted)" }}
            >
              End Interview
            </button>
          </div>
        </div>

        {/* Video panels */}
        <div className="grid grid-cols-2 gap-3">
          {/* Interviewer panel */}
          <div
            className="rounded-xl border overflow-hidden relative"
            style={{ background: "var(--color-surface-1)", borderColor: "var(--color-border)", aspectRatio: "4/3" }}
          >
            {/* Avatar */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="relative">
                <div
                  className="size-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                >
                  AC
                </div>
                {/* Speaking indicator */}
                {(interviewerSpeaking || waitingForResponse) && (
                  <div className="absolute -bottom-1 -right-1 flex gap-0.5 items-end px-1.5 py-1 rounded-full"
                    style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-1 rounded-full"
                        style={{
                          background: interviewerSpeaking ? "#4ade80" : "var(--color-brand-400)",
                          height: interviewerSpeaking ? (i === 1 ? 14 : 8) : 4,
                          animation: interviewerSpeaking ? `speakBar ${0.6 + i * 0.15}s ease-in-out infinite alternate` : "none",
                          transition: "height .1s",
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>Alex Carter</p>
                <p className="text-xs" style={{ color: "var(--color-muted)" }}>Senior Recruiter</p>
              </div>
              <div
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: interviewerSpeaking ? "rgba(74,222,128,.15)" : waitingForResponse ? "rgba(99,102,241,.15)" : "rgba(99,102,241,.1)",
                  color: interviewerSpeaking ? "#4ade80" : "var(--color-brand-300)",
                  border: `1px solid ${interviewerSpeaking ? "rgba(74,222,128,.3)" : "rgba(99,102,241,.2)"}`,
                }}
              >
                {interviewerSpeaking ? "Speaking…" : waitingForResponse ? "Thinking…" : "Listening"}
              </div>
            </div>
          </div>

          {/* Candidate panel */}
          <div
            className="rounded-xl border overflow-hidden relative"
            style={{ borderColor: "var(--color-border)", aspectRatio: "4/3", background: "#000" }}
          >
            {cameraError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
                style={{ background: "var(--color-surface-1)" }}>
                <span className="text-3xl">👤</span>
                <p className="text-xs" style={{ color: "var(--color-muted)" }}>No camera</p>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
            )}
            <div className="absolute bottom-2 left-2 text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: "rgba(0,0,0,.6)", color: "#fff" }}>
              You
            </div>
          </div>
        </div>

        {/* Current question */}
        <div
          className="rounded-xl border p-4 min-h-16"
          style={{ background: "var(--color-surface-1)", borderColor: "var(--color-border)" }}
        >
          {displayText ? (
            <p className="text-sm leading-relaxed" style={{ color: "var(--color-foreground)" }}>
              {displayText}
              {streamingText && (
                <span className="inline-block w-0.5 h-4 ml-0.5 align-middle animate-pulse"
                  style={{ background: "var(--color-brand-400)" }} />
              )}
            </p>
          ) : (
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full animate-pulse" style={{ background: "var(--color-brand-500)" }} />
              <span className="text-sm" style={{ color: "var(--color-muted)" }}>Waiting for interviewer…</span>
            </div>
          )}
        </div>

        {/* Response area */}
        <div
          className="rounded-xl border p-4 space-y-3"
          style={{ background: "var(--color-surface-1)", borderColor: "var(--color-border)" }}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold" style={{ color: "var(--color-muted)" }}>
              Your response
            </p>
            {isListening && (
              <div className="flex items-center gap-1.5">
                <div className="size-2 rounded-full animate-pulse" style={{ background: "#f87171" }} />
                <span className="text-xs" style={{ color: "#f87171" }}>Recording…</span>
              </div>
            )}
          </div>
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitResponse();
            }}
            placeholder="Type your response, or use the microphone…"
            rows={4}
            disabled={waitingForResponse || interviewerSpeaking}
            className="w-full rounded-lg p-3 text-sm resize-none outline-none"
            style={{
              background: "var(--color-surface-2)",
              border: `1px solid ${isListening ? "#f87171" : "var(--color-border)"}`,
              color: "var(--color-foreground)",
              lineHeight: "1.6",
              opacity: waitingForResponse || interviewerSpeaking ? 0.5 : 1,
            }}
          />
          <div className="flex items-center gap-2">
            {speechSupported && (
              <button
                onClick={toggleListening}
                disabled={waitingForResponse || interviewerSpeaking}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border font-medium"
                style={{
                  background: isListening ? "rgba(239,68,68,.1)" : "var(--color-surface-2)",
                  borderColor: isListening ? "rgba(239,68,68,.3)" : "var(--color-border)",
                  color: isListening ? "#f87171" : "var(--color-muted)",
                  opacity: waitingForResponse || interviewerSpeaking ? 0.5 : 1,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
                {isListening ? "Stop" : "Speak"}
              </button>
            )}
            <button
              onClick={submitResponse}
              disabled={!response.trim() || waitingForResponse || interviewerSpeaking}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold text-white"
              style={{
                background: !response.trim() || waitingForResponse || interviewerSpeaking
                  ? "var(--color-surface-3)"
                  : "var(--color-brand-600)",
              }}
            >
              Submit Response
              <span className="text-xs opacity-60">⌘↵</span>
            </button>
          </div>
        </div>

        {/* CSS for speaking animation */}
        <style>{`
          @keyframes speakBar {
            from { transform: scaleY(0.4); }
            to { transform: scaleY(1.2); }
          }
        `}</style>
      </div>
    );
  }

  /* ── EVALUATING ── */
  if (stage === "evaluating") {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-5 animate-fade-up">
        <div className="size-16 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(99,102,241,.15)", border: "1px solid rgba(99,102,241,.3)" }}>
          <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-400)" strokeWidth="1.8">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
        </div>
        <div className="text-center space-y-1">
          <p className="text-base font-semibold" style={{ color: "var(--color-foreground)" }}>
            Evaluating your performance…
          </p>
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>
            Claude is scoring your responses against finance recruiting criteria
          </p>
        </div>
      </div>
    );
  }

  /* ── RESULTS ── */
  if (stage === "results" && evaluation) {
    const circumference = 2 * Math.PI * 64;
    const offset = circumference * (1 - scoreDisplay / 100);
    const sColor = scoreColor(evaluation.overallScore);

    const SCORES = [
      { label: "Communication", val: evaluation.communicationScore },
      { label: "Commercial Awareness", val: evaluation.commercialScore },
      { label: "Motivation & Fit", val: evaluation.motivationScore },
      { label: "Competency", val: evaluation.competencyScore },
      { label: "Technical Knowledge", val: evaluation.technicalScore },
    ];

    return (
      <div className="space-y-5 animate-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold" style={{ color: "var(--color-foreground)" }}>
              Interview Results
            </h2>
            <p className="text-sm mt-0.5" style={{ color: "var(--color-muted)" }}>
              {config && ROLE_LABELS[config.role]} · {config?.firm || "Finance Interview"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: `${sColor}22`, border: `1px solid ${sColor}44`, color: sColor }}
            >
              {scoreLabel(evaluation.overallScore)}
            </div>
            <button
              onClick={() => router.push("/interview-prep")}
              className="px-3 py-1.5 rounded-lg text-xs border"
              style={{ background: "var(--color-surface-1)", borderColor: "var(--color-border)", color: "var(--color-muted)" }}
            >
              New Interview
            </button>
          </div>
        </div>

        {/* Score ring + breakdown */}
        <div className="grid lg:grid-cols-[240px_1fr] gap-4">
          <div className="rounded-xl border p-6 text-center"
            style={{ background: "var(--color-surface-1)", borderColor: "var(--color-border)" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: "var(--color-muted)" }}>Overall Score</p>
            <div className="relative inline-block mb-4">
              <svg width="150" height="150" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="64" fill="none" stroke="var(--color-surface-3)" strokeWidth="8"/>
                <circle cx="80" cy="80" r="64" fill="none" strokeWidth="8" strokeLinecap="round"
                  stroke={`url(#grad-iv)`}
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  transform="rotate(-90 80 80)"
                  style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1)" }}
                />
                <defs>
                  <linearGradient id="grad-iv" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={sColor} stopOpacity="0.6"/>
                    <stop offset="100%" stopColor={sColor}/>
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold" style={{ color: sColor }}>{scoreDisplay}</span>
                <span className="text-xs" style={{ color: "var(--color-muted)" }}>/100</span>
              </div>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--color-muted)" }}>
              {evaluation.scoreRationale}
            </p>
          </div>

          <div className="rounded-xl border p-5"
            style={{ background: "var(--color-surface-1)", borderColor: "var(--color-border)" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-5"
              style={{ color: "var(--color-muted)" }}>Score Breakdown</p>
            <div className="space-y-4">
              {SCORES.map(({ label, val }) => {
                const c = scoreColor(val);
                return (
                  <div key={label}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm" style={{ color: "var(--color-foreground)" }}>{label}</span>
                      <span className="text-sm font-semibold" style={{ color: c }}>{val}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "var(--color-surface-3)" }}>
                      <div className="h-full rounded-full"
                        style={{ width: barsLoaded ? `${val}%` : "0%", background: c, transition: "width 1.1s cubic-bezier(.4,0,.2,1)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="rounded-xl border overflow-hidden"
          style={{ background: "var(--color-surface-1)", borderColor: "var(--color-border)" }}>
          <div className="flex border-b" style={{ borderColor: "var(--color-border)" }}>
            {[{ id: "overview", label: "Overview" }, { id: "questions", label: "Question Breakdown" }].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setEvalTab(id as any)}
                className="px-5 py-3.5 text-sm font-medium"
                style={{
                  color: evalTab === id ? "var(--color-brand-300)" : "var(--color-muted)",
                  borderBottom: evalTab === id ? "2px solid var(--color-brand-500)" : "2px solid transparent",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {evalTab === "overview" && (
              <div className="space-y-5">
                <div className="grid lg:grid-cols-2 gap-5">
                  {/* Strengths */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="size-5 rounded-md flex items-center justify-center" style={{ background: "rgba(74,222,128,.15)" }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <span className="text-sm font-semibold" style={{ color: "#4ade80" }}>Strengths</span>
                    </div>
                    <div className="space-y-2">
                      {evaluation.strengths.map((s, i) => (
                        <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg border"
                          style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border)" }}>
                          <div className="size-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#4ade80" }} />
                          <p className="text-xs leading-relaxed" style={{ color: "var(--color-foreground)" }}>{s}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Weaknesses */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="size-5 rounded-md flex items-center justify-center" style={{ background: "rgba(248,113,113,.15)" }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </div>
                      <span className="text-sm font-semibold" style={{ color: "#f87171" }}>Areas to Improve</span>
                    </div>
                    <div className="space-y-2">
                      {evaluation.weaknesses.map((w, i) => (
                        <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg border"
                          style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border)" }}>
                          <div className="size-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#f87171" }} />
                          <p className="text-xs leading-relaxed" style={{ color: "var(--color-foreground)" }}>{w}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <p className="text-sm font-semibold mb-3" style={{ color: "var(--color-brand-300)" }}>
                    Recommendations
                  </p>
                  <div className="space-y-2">
                    {evaluation.recommendations.map((r, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg border"
                        style={{ background: "rgba(99,102,241,.05)", borderColor: "rgba(99,102,241,.2)" }}>
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                          style={{ background: "rgba(99,102,241,.2)", color: "var(--color-brand-300)" }}>
                          {i + 1}
                        </span>
                        <p className="text-xs leading-relaxed" style={{ color: "var(--color-foreground)" }}>{r}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {evalTab === "questions" && (
              <div className="space-y-3">
                {evaluation.questionFeedback.map((qf, i) => {
                  const c = scoreColor(qf.score);
                  return (
                    <div key={i} className="rounded-xl border p-4"
                      style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border)" }}>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className="text-sm font-medium leading-snug" style={{ color: "var(--color-foreground)" }}>
                          Q{i + 1}: {qf.question}
                        </p>
                        <span className="text-sm font-bold flex-shrink-0" style={{ color: c }}>{qf.score}</span>
                      </div>
                      {qf.summary && (
                        <p className="text-xs mb-2 italic" style={{ color: "var(--color-muted)" }}>
                          "{qf.summary}"
                        </p>
                      )}
                      <p className="text-xs leading-relaxed" style={{ color: "var(--color-muted)" }}>
                        {qf.feedback}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
