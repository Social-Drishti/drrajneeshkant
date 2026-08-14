# Dr. Rajneesh Kant Clinic — Unified Project

Single project with `frontend/` and `backend/` folders.

## Structure

```
clinic-project/
├── backend/           # Express API + SQLite + AI
│   ├── server.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
├── frontend/          # Static site + React CMS
│   ├── index.html     # Patient-facing site
│   ├── booking.html
│   ├── about.html
│   ├── ...
│   ├── css/
│   ├── js/
│   ├── assets/
│   └── cms/           # React CMS Dashboard
│       ├── src/
│       ├── package.json
│       ├── vite.config.ts
│       └── tsconfig.json
├── package.json       # Root workspace
└── .gitignore
```

## Quick Start

```bash
# From project root
npm run install:all     # Install all dependencies (root + backend + frontend/cms)
npm run build:cms       # Build the CMS React app
npm run dev             # Start backend (serves frontend + CMS on port 3000)
```

## URLs

- Patient site:  http://localhost:3000/
- CMS Dashboard: http://localhost:3000/cms/
- API Health:    http://localhost:3000/api/health

## Environment

Create `backend/.env` with:
```
GEMINI_API_KEY=your_google_gemini_api_key
PORT=2308
JWT_SECRET=change-me-to-a-long-random-string
```

> `JWT_SECRET` signs CMS session tokens and **must be changed** in production.
> The default CMS login password for all seeded users is `chiro123`
> (change passwords in the database before going live).

## Development

- Backend runs on `tsx server.ts` (hot reload via tsx)
- CMS builds with Vite to `frontend/cms/dist/`
- Backend serves both static frontend and built CMS

## API Endpoints

> All `/api/*` routes (except `/api/health` and `/api/auth/login`) require a
> Bearer token obtained from `POST /api/auth/login`. Mutating routes also
> enforce role-based permissions.

- `POST /api/auth/login` (email + password -> `{ token, user }`)
- `GET  /api/health`
- `GET  /api/doctors`
- `PUT  /api/doctors/:id`
- `GET  /api/doctors/:id/slots?date=YYYY-MM-DD`
- `POST /api/slots/manage`
- `POST /api/slots/bulk-block`
- `POST /api/appointments/book`
- `POST /api/appointments/status`
- `POST /api/appointments/delete`
- `GET  /api/appointments`
- `GET  /api/roles`
- `POST /api/roles/update`
- `POST /api/roles/delete`
- `POST /api/crm/send-confirmation-email`
- `POST /api/crm/whatsapp-patient`
- `GET  /api/realtime/stream?token=...` (SSE)
- `POST /api/ai/symptom-check`
- `POST /api/ai/doctor-summary`