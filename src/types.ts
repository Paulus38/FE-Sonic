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
  category: 'Học Tiếng Anh' | 'Phỏng vấn' | 'Cuộc họp' | string;
}

export interface Recording {
  id: string;
  title: string;
  category: 'Cuộc họp' | 'Phỏng vấn' | 'Học Tiếng Anh' | string;
  date: string;
  /** ISO timestamp for reliable newest-first sorting */
  createdAt?: string;
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
  role?: 'user' | 'admin';
  id?: string;
}

export type AiUsageSummary = {
  userId: string;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  requestCount: number;
  byFeature: Record<string, number>;
  byModel?: Record<string, number>;
  updatedAt: string | null;
  email?: string | null;
  name?: string | null;
  quotaTokens?: number;
};

export type AiUsageEvent = {
  id: string;
  feature: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  createdAt: string;
};
