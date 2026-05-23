"use client";

import { Mic } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type SpeechRecognitionConstructor = new () => SpeechRecognition;

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;

  const win = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

  return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null;
}

type VoiceInputProps = {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
};

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
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          variant === "ready" && "bg-primary",
          variant === "listening" && "animate-pulse bg-red-500",
          variant === "unsupported" && "bg-muted-foreground",
          variant === "error" && "bg-destructive"
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
          {error}
        </p>
      ) : null}
    </div>
  );
}
