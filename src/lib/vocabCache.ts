import type { ExtractedKeyword } from './extractVocab';

/** In-memory session cache — survives Detail remount within the SPA session. */
const cache = new Map<string, ExtractedKeyword[]>();

export function vocabCacheKey(
  recordingId: string,
  transcriptSig: string,
): string {
  return `${recordingId}::${transcriptSig}`;
}

export function getCachedVocab(key: string): ExtractedKeyword[] | undefined {
  return cache.get(key);
}

export function setCachedVocab(key: string, words: ExtractedKeyword[]): void {
  cache.set(key, words);
}
