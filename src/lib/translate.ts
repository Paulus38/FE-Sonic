/** Free EN→VI translators (no key). Used for live vocab meanings — not persisted. */

async function viaGoogle(text: string): Promise<string | null> {
  try {
    const url =
      'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=' +
      encodeURIComponent(text.slice(0, 1500));
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as unknown;
    if (!Array.isArray(data) || !Array.isArray(data[0])) return null;
    const out = data[0]
      .map((chunk: unknown) =>
        Array.isArray(chunk) && typeof chunk[0] === 'string' ? chunk[0] : '',
      )
      .join('')
      .trim();
    return out || null;
  } catch {
    return null;
  }
}

async function viaMyMemory(text: string): Promise<string | null> {
  try {
    const url =
      'https://api.mymemory.translated.net/get?q=' +
      encodeURIComponent(text.slice(0, 500)) +
      '&langpair=en|vi';
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      responseData?: { translatedText?: string };
      responseStatus?: number;
    };
    const out = data.responseData?.translatedText?.trim();
    if (!out || data.responseStatus !== 200) return null;
    if (out.toLowerCase() === text.toLowerCase()) return null;
    return out;
  } catch {
    return null;
  }
}

function looksVietnamese(text: string): boolean {
  return /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(
    text,
  );
}

export async function translateEnToVi(text: string): Promise<string> {
  const cleaned = text.trim();
  if (!cleaned) return '';
  if (looksVietnamese(cleaned)) return cleaned;

  const translated =
    (await viaGoogle(cleaned)) || (await viaMyMemory(cleaned)) || '';
  if (!translated) return cleaned;
  if (translated.toLowerCase() === cleaned.toLowerCase()) return cleaned;
  return translated;
}
