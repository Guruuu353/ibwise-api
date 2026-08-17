# IBWISE Backend

Node.js + Express + Prisma (PostgreSQL) API for the IBWISE Learning Platform.

## Folder structure

```
backend/
├── prisma/
│   ├── schema.prisma      # every entity from the proposal (§12)
│   └── seed.js            # demo data — one admin, one teacher, one student
├── src/
│   ├── config/             env.js (validated env vars), db.js (Prisma client)
│   ├── middleware/         auth, role guard, validation, upload, error handler
│   ├── modules/             one folder per domain — this is the part you'll touch most
│   │   └── <name>/
│   │       ├── <name>.routes.js       Express router — wires URL + middleware to controller
│   │       ├── <name>.controller.js   thin — parses req, calls service, shapes response
│   │       ├── <name>.service.js      the actual logic + Prisma queries
│   │       └── <name>.validation.js   express-validator rules (where needed)
│   ├── utils/               jwt, password hashing, standard API response shape, audit log
│   └── app.js               mounts every module's router
├── uploads/                 local file storage in dev (swap for Cloudinary/S3 in prod)
├── server.js                 entry point
└── .env.example
```

**Why modules instead of routes/controllers/services as top-level folders:** everything
about "assignments" lives in one place. Adding a feature to assignments never means
touching four different top-level folders — you open `modules/assignments/` and you're
done. Adding a whole new domain (e.g. "attendance" later) means copying this folder
shape once, not restructuring anything existing.

## Getting started

```bash
cp .env.example .env        # fill in DATABASE_URL and JWT_SECRET
npm install
npx prisma migrate dev --name init
npm run seed                # optional demo data
npm run dev
```

API runs on `http://localhost:4000`, matching `CLIENT_URL` for CORS.

## Auth model

- JWT bearer tokens (`Authorization: Bearer <token>`), 7-day expiry by default.
- `authenticate` middleware loads the user **and** their role profile
  (`teacher` / `student` / `parent`) onto `req.user`, so handlers never need
  a second lookup — `req.user.teacher.id` is always ready when the role is TEACHER.
- `requireRole("ADMIN", "TEACHER")` gates a route to specific roles. Ownership
  (a teacher only touching *their own* courses/assignments) is checked inside
  each service function, not just hidden behind the role gate.

## What's deliberately stubbed for later

- **Cloudinary/S3 upload** — `middleware/upload.middleware.js` currently writes to
  local disk. Swap the multer storage engine; every module already stores files as
  `{ url, filename, mimeType, size }` so nothing else changes.
- **Email delivery** for `forgot-password` — the endpoint and audit logging exist,
  wire in a provider (Resend/SES) when needed.
- **Parent role** — schema and auth support it fully; no parent-facing routes yet
  since Phase 1 scope keeps parents as future expansion (proposal §11).
- Anything in proposal §22 (payments, live classes, messaging, exams, attendance,
  SMS, analytics) — not represented in the schema on purpose, to avoid scope creep
  into Phase 1. Adding any of these later is a new `modules/<name>/` folder plus a
  schema addition, not a rewrite.

## API surface

See `src/app.js` for the full mount list. Routes broadly follow proposal §17:
`/api/auth`, `/api/users`, `/api/classes`, `/api/subjects` (+ `/subjects/courses`),
`/api/assignments` (+ `/mine`, `/:id/attachments`), `/api/submissions`,
`/api/grades` (+ `/mine`), `/api/blog` (+ `/moderation`, `/:id/approve`),
`/api/events`, `/api/announcements`, `/api/dashboard/stats`, plus two modules
added beyond the original Phase 1 scope:

- **`/api/fees`** — fee structures per class/term, generated invoices, and
  M-Pesa payment via Daraja STK Push. **Payments run in simulate mode until
  `MPESA_*` env vars are set** (see `.env.example`) — `mpesa.client.js` checks
  for real credentials and only calls Safaricom's API if they're present;
  otherwise it marks the payment completed locally so the whole invoice →
  pay → balance-clears flow is testable without a Daraja account. Going live
  is a config change, not a code change.
- **`/api/chat`** — plain REST messaging (conversations + messages), polled
  from the frontend every few seconds. Good enough for a school portal's
  message volume; if it ever needs true real-time delivery, add a Socket.io
  layer that emits on the same `Message` rows — the schema doesn't change.

## Curriculum tracks

`Class.curriculum` is one of `CBC | CAMBRIDGE | DIPLOMA`, with a free-text
`levelName` (e.g. "Junior Secondary", "Cambridge IGCSE", "Diploma"). This
keeps the assignment/grading/fees pipeline identical across all three tracks —
adding a fourth track later is a new enum value, not a schema rewrite. The
actual level catalog shown on the public Academics page (CBC's Grade 1–9,
Cambridge's Primary→A-Level, available Diploma programs) is marketing content
that lives in the frontend (`frontend/src/lib/curriculum.js`) rather than the
database, since it changes far less often than actual class rosters do.

## Content, attendance, and account approval

- **`/api/lessons`** — teacher-published class content (notes, video/file/link),
  separate from `Assignment` (which is graded work). Powers "My Classes" on
  both teacher and student dashboards.
- **`/api/attendance`** — one row per student per course per day, marked by
  the teacher in a single batch call (`POST /mark` takes the whole class's
  records at once). Students read their own history + a computed rate.
- **`/api/notifications`**, **`/api/media`**, **`/api/settings`** — a personal
  notification feed, a shared file library, and an admin key-value settings
  store respectively. All three existed as Prisma models from the start but
  had no routes until this pass.
- **Teacher approval** — self-registered teacher accounts (`POST /auth/register`
  with `role: TEACHER`) start with `Teacher.isApproved: false` and can't log
  in until an admin approves them (`GET /users/teachers/pending`,
  `PATCH /users/teachers/:teacherId/approve`). Teachers created directly by
  an admin (`POST /users`) are approved immediately — the gate only exists
  for the self-service path.
- **`PUT /auth/me`** — deliberately narrow self-service profile update
  (name/phone/bio only) so a logged-in user can edit their own profile
  without touching the admin-only `/users/:id` route, and without a path to
  self-escalate role or reactivate a deactivated account.
