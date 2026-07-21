export interface Participant {
  name: string;
  role: string;
  avatar: string;
}

export interface TranscriptLine {
  time: string;
  speaker: string;
  text: string;
  translation?: string; // Add support for bilingual translation line-by-line
}

export interface DictionaryItem {
  id: string;
  word: string;
  phonetic?: string;
  definition: string;
  example: string;
  category: 'Học Tiếng Anh' | 'Phỏng vấn' | 'Họp Khách hàng' | string;
}

export interface Recording {
  id: string;
  title: string;
  category: 'Cuộc họp' | 'Phỏng vấn' | 'Học Tiếng Anh' | string;
  date: string;
  duration: string;
  durationSec: number;
  summary: string;
  transcript: TranscriptLine[];
  aiSummary: string;
  participants: Participant[];
  tags: string[];
  isTranslated?: boolean;
  status?: string;
  hasAudio?: boolean;
  audioUrl?: string | null;
}

export interface UserSettings {
  name: string;
  email: string;
  avatar: string;
  primaryLang: string;
  secondaryLang: string;
  sampleRate: number;
  aiNoiseCancellation: boolean;
  theme: 'light' | 'dark';
}
