export async function convertAudioToMp3(
  audioBlob: Blob,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  if (audioBlob.type.toLowerCase().includes('mpeg')) return audioBlob;

  const { Mp3Encoder } = await import('@breezystack/lamejs');
  const AudioContextConstructor = window.AudioContext;
  if (!AudioContextConstructor) {
    throw new Error('Trình duyệt này không hỗ trợ chuyển audio sang MP3.');
  }

  const context = new AudioContextConstructor();
  try {
    const audio = await context.decodeAudioData(await audioBlob.arrayBuffer());
    const channels = Math.min(2, audio.numberOfChannels);
    const encoder = new Mp3Encoder(channels, audio.sampleRate, 128);
    const chunkSize = 1152;
    const output: Uint8Array[] = [];
    const leftChannel = audio.getChannelData(0);
    const rightChannel = channels === 2 ? audio.getChannelData(1) : null;

    for (let offset = 0; offset < audio.length; offset += chunkSize) {
      const end = Math.min(offset + chunkSize, audio.length);
      const left = toInt16(leftChannel.subarray(offset, end));
      const encoded =
        rightChannel
          ? encoder.encodeBuffer(
              left,
              toInt16(rightChannel.subarray(offset, end)),
            )
          : encoder.encodeBuffer(left);
      if (encoded.length) output.push(new Uint8Array(encoded));
      if (offset % (chunkSize * 128) === 0) {
        onProgress?.(Math.min(99, Math.round((end / audio.length) * 100)));
        await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
      }
    }

    const remainder = encoder.flush();
    if (remainder.length) output.push(new Uint8Array(remainder));
    if (!output.length) throw new Error('Không tạo được dữ liệu MP3.');
    onProgress?.(100);
    return new Blob(output, { type: 'audio/mpeg' });
  } finally {
    await context.close();
  }
}

function toInt16(samples: Float32Array): Int16Array {
  const pcm = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    pcm[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  return pcm;
}

export function mp3Filename(title: string): string {
  const safeTitle =
    title
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'recording';
  return `${safeTitle}.mp3`;
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Không thể chuẩn bị file MP3 để lưu.'));
        return;
      }
      const separator = reader.result.indexOf(',');
      if (separator < 0) {
        reject(new Error('Dữ liệu MP3 không hợp lệ.'));
        return;
      }
      resolve(reader.result.slice(separator + 1));
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error('Không thể đọc file MP3.'));
    reader.readAsDataURL(blob);
  });
}
