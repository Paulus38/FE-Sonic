/** Stable colors for speaker labels in live + detail views. */
const SPEAKER_PALETTE = [
  {
    text: 'text-emerald-600 dark:text-emerald-400',
    chip: 'bg-emerald-600 text-white',
    card: 'border-emerald-200/80 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900/40',
  },
  {
    text: 'text-amber-600 dark:text-amber-400',
    chip: 'bg-amber-500 text-white',
    card: 'border-amber-200/80 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/40',
  },
  {
    text: 'text-blue-600 dark:text-blue-400',
    chip: 'bg-blue-600 text-white',
    card: 'border-blue-200/80 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900/40',
  },
  {
    text: 'text-violet-600 dark:text-violet-400',
    chip: 'bg-violet-600 text-white',
    card: 'border-violet-200/80 bg-violet-50/50 dark:bg-violet-950/20 dark:border-violet-900/40',
  },
  {
    text: 'text-rose-600 dark:text-rose-400',
    chip: 'bg-rose-600 text-white',
    card: 'border-rose-200/80 bg-rose-50/50 dark:bg-rose-950/20 dark:border-rose-900/40',
  },
] as const;

export type SpeakerStyle = (typeof SPEAKER_PALETTE)[number];

/** Normalize Deepgram "Speaker 1" → "Người nói 1" for UI. */
export function localizeSpeakerLabel(raw?: string | null): string {
  if (!raw?.trim()) return 'Người nói 1';
  const trimmed = raw.trim();
  const numbered = trimmed.match(/^(?:Speaker|Người nói)\s*(\d+)$/i);
  if (numbered) return `Người nói ${numbered[1]}`;
  if (/^Speaker$/i.test(trimmed)) return 'Người nói 1';
  return trimmed;
}

export function uniqueSpeakers(names: Array<string | undefined | null>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of names) {
    const label = localizeSpeakerLabel(name);
    if (seen.has(label)) continue;
    seen.add(label);
    out.push(label);
  }
  return out;
}

export function speakerStyleFor(
  name: string | undefined | null,
  allNames: Array<string | undefined | null>,
): SpeakerStyle {
  const label = localizeSpeakerLabel(name);
  const list = uniqueSpeakers(allNames);
  const idx = Math.max(0, list.indexOf(label));
  return SPEAKER_PALETTE[idx % SPEAKER_PALETTE.length];
}
