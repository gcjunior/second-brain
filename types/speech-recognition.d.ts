interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
<<<<<<< HEAD
  onerror: ((event: Event) => void) | null;
=======
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onspeechstart: (() => void) | null;
>>>>>>> origin/main
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent extends Event {
<<<<<<< HEAD
  results: SpeechRecognitionResultList;
}

=======
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

>>>>>>> origin/main
interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
<<<<<<< HEAD
=======
  isFinal: boolean;
>>>>>>> origin/main
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}
