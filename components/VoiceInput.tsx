"use client";

/**
 * Voice input toggle using the browser's SpeechRecognition API where
 * available. Degrades gracefully (disabled with a tooltip) in browsers
 * that don't support it -- there is no server-side speech-to-text in
 * this demo.
 */

import { useEffect, useRef, useState } from "react";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
}

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: any) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export default function VoiceInput({ onTranscript }: VoiceInputProps) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(Boolean(SpeechRecognitionCtor));
  }, []);

  function toggleListening() {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition: SpeechRecognitionLike = new SpeechRecognitionCtor();
    recognition.lang = "en-AU";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) onTranscript(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  return (
    <button
      type="button"
      className={`mic-button${listening ? " listening" : ""}`}
      onClick={toggleListening}
      disabled={!supported}
      title={supported ? "Speak your answer" : "Voice input isn't supported in this browser"}
      aria-label="Toggle voice input"
    >
      {listening ? "●" : "🎤"}
    </button>
  );
}
