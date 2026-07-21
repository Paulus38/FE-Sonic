import { io, Socket } from 'socket.io-client';
import { getApiBase, setToken } from './api';

export type TranscriptEvent = {
  type: 'partial' | 'final' | 'translation';
  text: string;
  translation?: string;
  speaker?: string;
  seq: number;
  tStartMs: number;
  tEndMs: number;
};

export function createLiveSocket(token: string): Socket {
  return io(`${getApiBase()}/live`, {
    auth: { token },
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
  });
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export { setToken };
