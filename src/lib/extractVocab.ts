import { TranscriptLine } from '../types';
import { lookupFreeDictionary } from './freeDictionary';
import { translateEnToVi } from './translate';

export type ExtractedKeyword = {
  word: string;
  phonetic: string;
  definition: string;
  example: string;
  category: string;
};

const STOPWORDS = new Set(
  `
a about above after again against all am an and any are aren't as at be because been
before being below between both but by can can't cannot could couldn't did didn't do
does doesn't doing don't down during each few for from further get got had hadn't has
hasn't have haven't having he he'd he'll he's her here here's hers herself him himself
his how how's i i'd i'll i'm i've if in into is isn't it it's its itself let's me more
most mustn't my myself no nor not of off on once only or other ought our ours ourselves
out over own same shan't she she'd she'll she's should shouldn't so some such than that
that's the their theirs them themselves then there there's these they they'd they'll
they're they've this those through to too under until up very was wasn't we we'd we'll
we're we've were weren't what what's when when's where where's which while who who's
whom why why's will with won't would wouldn't you you'd you'll you're you've your yours
yourself yourselves okay yeah yes just also really like well still already already
hello hi um uh okay ok
`
    .trim()
    .split(/\s+/),
);

function normalizeToken(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/^[^a-z]+|[^a-z]+$/gi, '')
    .replace(/'s$/, '')
    .replace(/n't$/, '')
    .replace(/'re$|'ve$|'ll$|'d$/, '');
}

/** Pick English vocabulary candidates from transcript text (no API, no storage). */
export function extractVocabCandidates(
  transcript: TranscriptLine[],
  limit = 16,
): string[] {
  const counts = new Map<string, number>();
  const sentenceByWord = new Map<string, string>();

  for (const line of transcript) {
    const text = (line.text || '').trim();
    if (!text) continue;
    // Skip lines that look mostly Vietnamese (few Latin letters)
    const latin = (text.match(/[A-Za-z]/g) || []).length;
    if (latin < 4) continue;

    const tokens = text.split(/\s+/);
    for (const token of tokens) {
      const word = normalizeToken(token);
      if (word.length < 4 || word.length > 24) continue;
      if (STOPWORDS.has(word)) continue;
      if (!/^[a-z]+(?:-[a-z]+)?$/.test(word)) continue;

      counts.set(word, (counts.get(word) || 0) + 1);
      if (!sentenceByWord.has(word)) {
        sentenceByWord.set(word, text);
      }
    }
  }

  // Prefer longer / less ultra-frequent words in this transcript
  const ranked = Array.from(counts.entries())
    .map(([word, count]) => ({
      word,
      count,
      score: word.length * 3 + (count === 1 ? 2 : 0) - Math.min(count, 5),
      example: sentenceByWord.get(word) || '',
    }))
    .sort((a, b) => b.score - a.score || a.word.localeCompare(b.word));

  return ranked.slice(0, limit).map((r) => r.word);
}

export function exampleSentenceForWord(
  transcript: TranscriptLine[],
  word: string,
): string {
  const lower = word.toLowerCase();
  for (const line of transcript) {
    const text = line.text || '';
    if (text.toLowerCase().includes(lower)) {
      return text.trim();
    }
  }
  return '';
}

/** Live-enrich candidates via Free Dictionary; results are not persisted. */
export async function buildKeywordsFromTranscript(
  transcript: TranscriptLine[],
  category: string,
  options?: { maxWords?: number; concurrency?: number },
): Promise<ExtractedKeyword[]> {
  const maxWords = options?.maxWords ?? 8;
  const concurrency = options?.concurrency ?? 3;
  const candidates = extractVocabCandidates(transcript, maxWords * 3);
  const results: ExtractedKeyword[] = [];

  for (let i = 0; i < candidates.length && results.length < maxWords; i += concurrency) {
    const batch = candidates.slice(i, i + concurrency);
    const settled = await Promise.allSettled(
      batch.map(async (word) => {
        const entry = await lookupFreeDictionary(word, 'en');
        const meaning = entry.meanings[0];
        if (!meaning?.definition) {
          throw new Error('no definition');
        }
        const fromTranscript = exampleSentenceForWord(transcript, entry.word);
        const definitionVi = await translateEnToVi(meaning.definition);
        return {
          word: entry.word,
          phonetic: entry.phonetic ? `/${entry.phonetic.replace(/^\/|\/$/g, '')}/` : '',
          definition: definitionVi,
          example: meaning.example || fromTranscript || entry.word,
          category: category || 'Học Tiếng Anh',
        } satisfies ExtractedKeyword;
      }),
    );

    for (const item of settled) {
      if (item.status === 'fulfilled') {
        results.push(item.value);
      }
    }
  }

  return results;
}
