# Sonic Scribe Frontend

## Run

```bash
cp .env.example .env
npm install
npm run dev
```

Opens http://localhost:5173 — talks to backend at `VITE_API_URL` (default `http://localhost:3001`).

## Auth

Register / login against `POST /api/v1/auth/*`. Access and refresh tokens are stored in `localStorage`; API requests automatically refresh the access token after a 401. Refresh tokens expire after 15 hours.

## Live recording

Uses Socket.IO namespace `/live` with JWT in `auth.token`, streams mic chunks, receives bilingual transcript events.

## Downloading recordings

The recording detail screen can download audio as MP3. Non-MP3 audio is decoded and encoded locally; the stored source recording is unchanged. Web browsers download the MP3 directly, while the mobile app opens the system share sheet so the user can choose where to save it.
