"use client";

<<<<<<< HEAD
import { Mic } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type SpeechRecognitionConstructor = new () => SpeechRecognition;
=======
import { Mic, Sparkles, Square } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SpeechRecognitionConstructor = new () => SpeechRecognition;
type VoiceState = "idle" | "listening" | "processing" | "unsupported" | "error";

const SILENCE_TIMEOUT_MS = 4500;
const MAX_SESSION_MS = 120000;
>>>>>>> origin/main

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;

  const win = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

  return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null;
}

<<<<<<< HEAD
=======
function subscribeToSpeechSupport() {
  return () => {};
}

>>>>>>> origin/main
type VoiceInputProps = {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
};

<<<<<<< HEAD
type StatusVariant = "ready" | "listening" | "unsupported" | "error";

function StatusBadge({
  label,
  variant,
}: {
  label: string;
  variant: StatusVariant;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        variant === "ready" && "bg-primary/10 text-primary",
        variant === "listening" &&
          "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
        variant === "unsupported" && "bg-muted text-muted-foreground",
        variant === "error" && "bg-destructive/10 text-destructive"
=======
function ListeningWave({ active }: { active: boolean }) {
  return (
    <div className="flex h-8 items-center gap-1" aria-hidden>
      {Array.from({ length: 18 }).map((_, index) => (
        <span
          key={index}
          className={cn(
            "h-5 w-1 rounded-full bg-primary/35",
            active && "animate-wave bg-primary",
          )}
          style={{
            height: `${12 + ((index * 7) % 18)}px`,
            animationDelay: `${index * 55}ms`,
          }}
        />
      ))}
    </div>
  );
}

function StatePill({ state }: { state: VoiceState }) {
  const label =
    state === "unsupported"
      ? "Unsupported"
      : state === "error"
        ? "Needs attention"
        : state === "processing"
          ? "Processing"
          : state === "listening"
            ? "Listening"
            : "Idle";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        state === "listening" && "bg-red-50 text-red-700 dark:bg-orange-400/15 dark:text-orange-200",
        state === "processing" && "bg-primary/10 text-primary",
        state === "idle" && "bg-muted text-muted-foreground",
        state === "unsupported" && "bg-muted text-muted-foreground",
        state === "error" && "bg-destructive/10 text-destructive",
>>>>>>> origin/main
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
<<<<<<< HEAD
          variant === "ready" && "bg-primary",
          variant === "listening" && "animate-pulse bg-red-500",
          variant === "unsupported" && "bg-muted-foreground",
          variant === "error" && "bg-destructive"
=======
          state === "listening" && "animate-pulse bg-red-500 dark:bg-orange-300",
          state === "processing" && "animate-pulse bg-primary",
          state === "idle" && "bg-muted-foreground",
          state === "unsupported" && "bg-muted-foreground",
          state === "error" && "bg-destructive",
>>>>>>> origin/main
        )}
        aria-hidden
      />
      {label}
    </span>
  );
}

export function VoiceInput({
  onTranscript,
  disabled = false,
  className,
}: VoiceInputProps) {
<<<<<<< HEAD
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    setSupported(Boolean(getSpeechRecognition()));
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognitionClass = getSpeechRecognition();
    if (!SpeechRecognitionClass) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    setError(null);
    const recognition = new SpeechRecognitionClass();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();

      if (transcript) {
        onTranscript(transcript);
      }
    };

    recognition.onerror = () => {
      setError("Could not capture speech. Please try again.");
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [onTranscript]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  function handleToggle() {
    if (disabled || !supported) return;
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  }

  const statusVariant: StatusVariant = !supported
    ? "unsupported"
    : error
      ? "error"
      : listening
        ? "listening"
        : "ready";

  const statusLabel =
    statusVariant === "unsupported"
      ? "Unsupported"
      : statusVariant === "error"
        ? "Error"
        : statusVariant === "listening"
          ? "Listening…"
          : "Ready";

  const primaryLabel = listening
    ? "Tap to stop voice input"
    : "Tap to start voice input";

  const helperText = !supported
    ? "Voice input is not supported in this browser. Use Chrome or Edge."
    : "We'll convert your speech to text";

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled || !supported}
        aria-pressed={listening}
        aria-label={listening ? "Stop voice input" : "Start voice input"}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-3 text-left transition-colors",
          "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-60"
        )}
      >
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full bg-icon-tint text-icon-tint-foreground",
            listening &&
              "animate-pulse bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400"
          )}
          aria-hidden
        >
          <Mic className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{primaryLabel}</p>
          <p className="text-xs text-muted-foreground">{helperText}</p>
        </div>

        <StatusBadge label={statusLabel} variant={statusVariant} />
      </button>

      {error ? (
        <p className="text-xs text-destructive" role="alert">
=======
  const supported = useSyncExternalStore(
    subscribeToSpeechSupport,
    () => Boolean(getSpeechRecognition()),
    () => true,
  );
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef("");
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const manuallyStoppingRef = useRef(false);
  const shouldKeepListeningRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
  }, []);

  const commitTranscript = useCallback(() => {
    const transcript = finalTranscriptRef.current.trim();
    finalTranscriptRef.current = "";
    setInterimText("");

    if (transcript) {
      onTranscript(transcript);
    }
  }, [onTranscript]);

  const finishListening = useCallback(
    (recognition: SpeechRecognition | null, state: VoiceState = "processing") => {
      shouldKeepListeningRef.current = false;
      manuallyStoppingRef.current = true;
      clearTimers();
      setVoiceState(state);

      try {
        recognition?.stop();
      } catch {
        commitTranscript();
        setVoiceState("idle");
      }
    },
    [clearTimers, commitTranscript],
  );

  const scheduleSilenceStop = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }

    silenceTimerRef.current = setTimeout(() => {
      finishListening(recognitionRef.current);
    }, SILENCE_TIMEOUT_MS);
  }, [finishListening]);

  const buildRecognition = useCallback(() => {
    const SpeechRecognitionClass = getSpeechRecognition();
    if (!SpeechRecognitionClass) {
      return null;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript ?? "";

        if (result.isFinal) {
          finalTranscriptRef.current = `${finalTranscriptRef.current} ${transcript}`.trim();
        } else {
          interim = `${interim} ${transcript}`.trim();
        }
      }

      setInterimText(interim);
      scheduleSilenceStop();
    };

    recognition.onspeechstart = () => {
      setVoiceState("listening");
      scheduleSilenceStop();
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech") {
        return;
      }

      shouldKeepListeningRef.current = false;
      clearTimers();
      setError("Could not capture speech. Check microphone access and try again.");
      setVoiceState("error");
    };

    recognition.onend = () => {
      if (shouldKeepListeningRef.current && !manuallyStoppingRef.current) {
        try {
          recognition.start();
          return;
        } catch {
          shouldKeepListeningRef.current = false;
        }
      }

      commitTranscript();
      setVoiceState((current) => (current === "error" ? "error" : "idle"));
      manuallyStoppingRef.current = false;
    };

    return recognition;
  }, [clearTimers, commitTranscript, scheduleSilenceStop]);

  const startListening = useCallback(() => {
    const recognition = buildRecognition();
    if (!recognition) {
      setError("Speech recognition is not supported in this browser.");
      setVoiceState("unsupported");
      return;
    }

    clearTimers();
    setError(null);
    setInterimText("");
    finalTranscriptRef.current = "";
    manuallyStoppingRef.current = false;
    shouldKeepListeningRef.current = true;
    recognitionRef.current = recognition;

    maxTimerRef.current = setTimeout(() => {
      finishListening(recognitionRef.current);
    }, MAX_SESSION_MS);

    try {
      recognition.start();
      setVoiceState("listening");
      scheduleSilenceStop();
    } catch {
      setError("Could not start voice input. Please try again.");
      setVoiceState("error");
    }
  }, [buildRecognition, clearTimers, finishListening, scheduleSilenceStop]);

  const stopListening = useCallback(() => {
    finishListening(recognitionRef.current);
  }, [finishListening]);

  useEffect(() => {
    return () => {
      clearTimers();
      shouldKeepListeningRef.current = false;
      recognitionRef.current?.abort();
    };
  }, [clearTimers]);

  const state = !supported ? "unsupported" : voiceState;
  const isListening = state === "listening";
  const isProcessing = state === "processing";
  const helperText =
    state === "unsupported"
      ? "Voice input works best in Chrome or Edge."
      : isListening
        ? "Speak naturally. We wait for a longer pause before finalizing."
        : isProcessing
          ? "Finalizing your transcript..."
          : "Use voice for quick capture, then edit the text before sending.";

  return (
    <div className={cn("rounded-2xl border border-border/70 bg-background/75 p-3 shadow-sm", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={isListening ? stopListening : startListening}
          disabled={disabled || !supported || isProcessing}
          aria-pressed={isListening}
          aria-label={isListening ? "Stop voice input" : "Start voice input"}
          className={cn(
            "group flex flex-1 items-center gap-3 rounded-xl border border-border/70 bg-card p-3 text-left transition-all",
            "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            isListening && "border-red-200 bg-red-50/70 shadow-red-100 dark:border-orange-300/30 dark:bg-orange-400/10 dark:shadow-none",
            "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none",
          )}
        >
          <span
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl bg-icon-tint text-icon-tint-foreground transition-transform group-hover:scale-105",
              isListening && "bg-red-100 text-red-600 dark:bg-orange-400/15 dark:text-orange-200",
              isProcessing && "bg-primary/10 text-primary",
            )}
            aria-hidden
          >
            {isListening ? <Square className="size-5" /> : <Mic className="size-5" />}
          </span>

          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-foreground">
              {isListening ? "Listening. Tap to stop." : "Start voice input"}
            </span>
            <span className="block text-xs leading-5 text-muted-foreground">{helperText}</span>
          </span>

          <StatePill state={state} />
        </button>

        <div className="flex min-h-16 flex-1 items-center justify-between gap-3 rounded-xl bg-muted/60 px-4">
          <ListeningWave active={isListening} />
          <Button
            type="button"
            variant={isListening ? "destructive" : "outline"}
            size="sm"
            onClick={isListening ? stopListening : startListening}
            disabled={disabled || !supported || isProcessing}
          >
            {isListening ? <Square className="size-3.5" /> : <Sparkles className="size-3.5" />}
            {isListening ? "Stop" : "Listen"}
          </Button>
        </div>
      </div>

      {interimText ? (
        <p className="mt-3 rounded-xl bg-primary/5 px-3 py-2 text-sm text-muted-foreground" aria-live="polite">
          {interimText}
        </p>
      ) : null}

      {error ? (
        <p className="mt-2 text-xs text-destructive" role="alert">
>>>>>>> origin/main
          {error}
        </p>
      ) : null}
    </div>
  );
}
