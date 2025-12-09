# TikTok Shop Seller Clone

React + TypeScript + Vite front end with a small Express API. The first page replicates the TikTok Shop seller landing (hero + signup card with phone/email input) and posts signups to the local backend.

## Quick start

```bash
npm install
npm run server   # start Express API on http://localhost:4000
npm run dev      # start Vite UI on http://localhost:5173 (proxied /api)
```

## Available scripts

- `npm run dev` – start the Vite dev server
- `npm run server` – start the Express API
- `npm run dev:full` – run API and UI in parallel (requires npm-run-all)
- `npm run build` – type-check and build for production
- `npm run preview` – preview the production build
- `npm run lint` – run ESLint

## API

- `POST /api/signup` body: `{ mode: 'phone' | 'email', phoneCode?, phoneNumber?, email? }` → `{ ok: true, submissionId }`
- `POST /api/login` body: `{ email, password }` → `{ ok: true, token, profile }`
- `GET /api/health` → `{ status: 'ok' }`

## Notes

- Styling uses a dark palette with TikTok-inspired accents to mirror the provided screenshot.
- Demo login credentials (for the dashboard preview): `demo@tiktokshop.com` / `Demo123!`
- Login transitions to a dashboard-style landing page resembling TikTok Shop Seller Center.
