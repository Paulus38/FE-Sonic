# CI/CD — Frontend (FE-Sonic)

## Pipeline

| Workflow | Khi chạy | Việc làm |
|----------|----------|----------|
| [`.github/workflows/ci.yml`](.github/workflows/ci.yml) | Push / PR → `main` | `npm ci` → `tsc` → `vite build` |
| [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) | Manual (`workflow_dispatch`) | Build gate → deploy Vercel |

## Khuyến nghị CD: Vercel Git Integration

1. [Vercel Dashboard](https://vercel.com/dashboard) → **Add New Project**
2. Import repo `Paulus38/FE-Sonic`
3. Framework: Vite (đã có `vercel.json` + SPA rewrite)
4. Environment Variable:
   - `VITE_API_URL` = `https://be-sonic.vercel.app` (hoặc custom BE domain)
5. Deploy

## Option: Deploy từ GitHub Actions

### Secrets

| Secret | Nguồn |
|--------|--------|
| `VERCEL_TOKEN` | Vercel Account → Tokens |
| `VERCEL_ORG_ID` | `npx vercel link` → `.vercel/project.json` |
| `VERCEL_PROJECT_ID` |同上 |

### Variables

| Variable | Ví dụ |
|----------|--------|
| `VITE_API_URL` | `https://be-sonic.vercel.app` |

```bash
cd fe
npx vercel link
cat .vercel/project.json
```

Actions → **Deploy** → Run workflow.

## CORS

Sau khi có URL FE production, cập nhật BE:

```env
CORS_ORIGINS=https://your-fe.vercel.app,http://localhost:5173
```
