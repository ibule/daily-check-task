# Deploy To Vercel

## Prerequisites

- Install Vercel CLI
  - `npm i -g vercel`
- Log in
  - `vercel login`
- Link this repo to a Vercel project
  - `vercel link`

## Environment Variables

Set these in the Vercel dashboard or with `vercel env add`:

```bash
DEEPSEEK_API_KEY=
CORS_ALLOW_ORIGIN=*
RATE_LIMIT_MODE=off
RATE_LIMIT_PER_IP_DAY=5
RATE_LIMIT_GLOBAL_DAY=50
RATE_LIMIT_PREFIX=rate
REDIS_URL=
REDIS_HOST=
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TLS=false
```

Notes:

- On Vercel, `VITE_API_BASE_URL` should usually be left empty.
- The frontend will call the same deployment origin at `/api/generate-encouragement`.
- If you want Redis rate limiting, configure either `REDIS_URL` or `REDIS_HOST`-style variables.

## Preview Deployment

```bash
npm run vercel:preview
```

## Production Deployment

```bash
npm run vercel:prod
```

## Git-Based Deployment

If the GitHub repository is connected to Vercel, every push to this `vercel` branch can create a preview deployment automatically. Promoting to production can then be handled in the Vercel dashboard, or by deploying with:

```bash
vercel --prod
```
