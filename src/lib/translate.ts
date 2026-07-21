/** Lightweight EN→VI helpers used as live fallback when Gemini is unavailable. */

function looksLikeVietnamese(text: string): boolean {
  return /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(
    text,
  );
}

export async function translateEnToVi(text: string): Promise<string | null> {
  const cleaned = text.trim();
  if (!cleaned) return null;

  const fromGoogle = await translateViaGoogle(cleaned);
  if (fromGoogle) return fromGoogle;

  const fromMyMemory = await translateViaMyMemory(cleaned);
  if (fromMyMemory) return fromMyMemory;

  return null;
}

async function translateViaGoogle(text: string): Promise<string | null> {
  try {
    const url =
      'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=' +
      encodeURIComponent(text.slice(0, 1500));
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = (await res.json()) as unknown;
    if (!Array.isArray(data) || !Array.isArray(data[0])) return null;
    const out = data[0]
      .map((chunk: unknown) =>
        Array.isArray(chunk) && typeof chunk[0] === 'string' ? chunk[0] : '',
      )
      .join('')
      .trim();
    if (!out) return null;
    if (out.toLowerCase() === text.toLowerCase() && !looksLikeVietnamese(out)) {
      return null;
    }
    return out;
  } catch {
    return null;
  }
}

async function translateViaMyMemory(text: string): Promise<string | null> {
  try {
    const url =
      'https://api.mymemory.translated.net/get?q=' +
      encodeURIComponent(text.slice(0, 500)) +
      '&langpair=en|vi';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      responseData?: { translatedText?: string };
      responseStatus?: number;
    };
    const out = data.responseData?.translatedText?.trim();
    if (!out || data.responseStatus !== 200) return null;
    if (out.toLowerCase() === text.toLowerCase() && /[a-z]/i.test(text)) {
      return null;
    }
    return out;
  } catch {
    return null;
  }
}
