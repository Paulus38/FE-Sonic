# Sonic Scribe Frontend

## Run

```bash
cp .env.example .env
npm install
npm run dev
```

Opens http://localhost:5173 — talks to backend at `VITE_API_URL` (default `http://localhost:3001`).

## Auth

Register / login against `POST /api/v1/auth/*`. JWT stored in `localStorage` (`sonic_token`).

## Live recording

Uses Socket.IO namespace `/live` with JWT in `auth.token`, streams mic chunks, receives bilingual transcript events.
