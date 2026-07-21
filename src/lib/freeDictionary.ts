/** Live lookup against Free Dictionary API — nothing is persisted. */
const BASE = 'https://api.dictionaryapi.dev/api/v2/entries';

export type FreeDictMeaning = {
  partOfSpeech: string;
  definition: string;
  example?: string;
  synonyms: string[];
};

export type FreeDictEntry = {
  word: string;
  phonetic?: string;
  audioUrl?: string;
  meanings: FreeDictMeaning[];
  sourceUrl: string;
};

type ApiPhonetic = { text?: string; audio?: string };
type ApiDefinition = {
  definition: string;
  example?: string;
  synonyms?: string[];
};
type ApiMeaning = {
  partOfSpeech?: string;
  definitions?: ApiDefinition[];
  synonyms?: string[];
};
type ApiEntry = {
  word: string;
  phonetic?: string;
  phonetics?: ApiPhonetic[];
  meanings?: ApiMeaning[];
};

function absoluteAudio(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('//')) return `https:${url}`;
  return url;
}

export async function lookupFreeDictionary(
  word: string,
  lang = 'en',
): Promise<FreeDictEntry> {
  const q = word.trim().toLowerCase();
  if (!q) {
    throw new Error('Nhập từ cần tra.');
  }

  const sourceUrl = `${BASE}/${encodeURIComponent(lang)}/${encodeURIComponent(q)}`;
  const res = await fetch(sourceUrl);

  if (res.status === 404) {
    throw new Error(`Không tìm thấy từ "${q}" trên Free Dictionary.`);
  }
  if (!res.ok) {
    throw new Error(`Free Dictionary lỗi (${res.status}). Thử lại sau.`);
  }

  const data = (await res.json()) as ApiEntry[] | { title?: string; message?: string };
  if (!Array.isArray(data) || !data.length) {
    const msg =
      !Array.isArray(data) && data.message
        ? data.message
        : `Không tìm thấy từ "${q}".`;
    throw new Error(msg);
  }

  const entry = data[0];
  const phoneticText =
    entry.phonetic ||
    entry.phonetics?.find((p) => p.text)?.text ||
    undefined;
  const audioUrl = absoluteAudio(
    entry.phonetics?.find((p) => p.audio)?.audio,
  );

  const meanings: FreeDictMeaning[] = [];
  for (const m of entry.meanings ?? []) {
    const pos = m.partOfSpeech || 'unknown';
    for (const d of m.definitions ?? []) {
      meanings.push({
        partOfSpeech: pos,
        definition: d.definition,
        example: d.example,
        synonyms: [
          ...(d.synonyms ?? []),
          ...(m.synonyms ?? []),
        ].slice(0, 8),
      });
    }
  }

  return {
    word: entry.word,
    phonetic: phoneticText,
    audioUrl,
    meanings: meanings.slice(0, 12),
    sourceUrl,
  };
}
