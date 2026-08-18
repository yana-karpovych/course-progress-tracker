# BUILD-STEPS — Course Progress Tracker

> Cursor Agent reads this file + `.cursor/docs/REQUIREMENTS.md`.
>
> **For Cursor Agent:** After each step, **repeat the Verification section** from this file
> (commands + expected results). The user verifies from your chat response, not by scrolling here.
>
> **CRITICAL — read "Agent rules — do not run servers" below.** Never start `npm run dev`,
> Docker, or background processes. The user runs all verification manually.

**Project root:** `D:\ykarpovych\employment\Stellartech\course-progress-tracker`

---

## Agent rules — do not run servers

**The user verifies every step manually** in their own terminal or browser.

| Agent MUST NOT | Agent MUST |
|---|---|
| Run `npm install`, `npm run dev`, `npm start` | Create/edit files only |
| Run `docker compose up` or any Docker command | Print verification commands for the user |
| Run `npx prisma migrate` or `prisma validate` | Say "Run these commands yourself and paste output if error" |
| Leave a dev server running in a background terminal | Stop after file changes — **no server left on port 4000/5173** |
| Claim "I tested it" or "health check passed" | Say "After you run the commands below, tell me the result" |

**Why:** If the agent starts the server, port 4000 stays busy. When the user runs
`npm run dev` → `EADDRINUSE`.

**Where to set this rule (once, not in every prompt):**

1. **Superpowers session block** — paste **once** at the start of each Agent chat.
2. `REQUIREMENTS.md` → section **Verification workflow**.
3. This file → section **Agent rules** (Agent reads from project; user does not re-paste).

**Do NOT** repeat the full "do not run npm" block in every step prompt.
Step prompts stay short: `executing-plans: Step B4 ONLY. Stop.`

---

## Goal

Reach: `docker compose up --build` → create course → lessons → checkbox → progress → delete.

**Order:** Backend + DB (local) → Frontend → Docker Compose → green path (REQUIREMENTS §11).

Do **not** add features from REQUIREMENTS §10 “Do NOT implement”.

---

## Documents in the project

| File | Purpose |
|---|---|
| `REQUIREMENTS.md` | Stack, API, validation, progress, UI states, risks |
| `BUILD-STEPS.md` | This file — step order, prompts, verification |
| `.gitignore` | `node_modules/`, `.env`, `dist/` |
| `backend/.env` | Local only — **not in git** |
| `backend/.env.example` | Template committed |

---

## Superpowers — when to use

| Skill | When | When NOT |
|---|---|---|
| `executing-plans` | Every code prompt | — |
| `verification-before-completion` | End of every step | — |
| `systematic-debugging` | User pastes terminal errors | — |
| `receiving-code-review` | End-of-phase review prompt | — |
| `finishing-a-development-branch` | End of backend, frontend, docker phases | — |
| `brainstorming` | — | Plan already exists |
| `writing-plans` | — | Plan already exists |
| `test-driven-development` | — | Not in task |
| `dispatching-parallel-agents` | — | Small task |
| `subagent-driven-development` | — | Too heavy |

**Invoke in step prompts (short — rules already in session block):**

```text
executing-plans: Step [ID] ONLY. Stop.
```

---

## One-time setup

### Cursor

- Open Folder → `D:\ykarpovych\employment\Stellartech\course-progress-tracker`
- **New Agent chat**, model **composer-2.5-fast**
- `/add-plugin superpowers` → new chat after install

### Superpowers session block (paste first message in Agent chat)

```text
Superpowers mode for this session:

- executing-plans: one step at a time, stop after each step
- verification-before-completion: I run ALL checks myself in terminal/browser.
  You NEVER run npm, docker, or npx commands. You ONLY print the Verification
  section from BUILD-STEPS.md for the current step. Never claim success until I confirm.
- systematic-debugging: only when I paste errors
- finishing-a-development-branch: end of each major phase
- Do NOT use: brainstorming, writing-plans, TDD, parallel agents, subagent-driven-development

Read REQUIREMENTS.md section "Verification workflow" and BUILD-STEPS.md "Agent rules".
Follow BUILD-STEPS step order exactly. Do not start dev servers.

This session rule applies to ALL steps — do not ask me to repeat it in every prompt.
```

**Not a code bug.** On Windows, `curl` is an alias for `Invoke-WebRequest`. Bash-style
`curl -d "{\"title\":\"...\"}"` fails with errors like `Port number was not a decimal number`.

### Two terminals during backend dev

| Terminal 1 | Terminal 2 |
|---|---|
| `cd backend` → `npm run dev` | API tests only |
| Keep running. Wait: `Server started on port 4000` | Do not run second `npm run dev` |

### EADDRINUSE (port 4000 in use)

This often means Cursor Agent already started the server — avoid that
(see Agent rules). If it still happens:

**Option A — server already running (ok for API tests):**
Skip `npm run dev`. In terminal 2 run `Invoke-RestMethod http://localhost:4000/health`.

**Option B — need clean restart:**
1. `Ctrl+C` in the terminal where `npm run dev` runs, **or**
2. Kill whatever holds 4000 (only if you know it is Node, not Docker):

```powershell
$p = (Get-NetTCPConnection -LocalPort 4000 -State Listen -ErrorAction SilentlyContinue).OwningProcess | Select-Object -Unique
$p | ForEach-Object { Get-Process -Id $_ -ErrorAction SilentlyContinue | Select-Object Id, ProcessName }
# If ProcessName is node — then:
$p | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
```

Then `npm run dev` again.

**Before every `npm run dev` (optional 5 sec check):**

```powershell
Get-NetTCPConnection -LocalPort 4000 -State Listen -ErrorAction SilentlyContinue
```

Nothing printed → safe to `npm run dev`. Something listed → use Option A or B.

### Failed to connect

Server **not running**. Start `npm run dev` in terminal 1 (after port check above).

### Recommended — `Invoke-RestMethod`

Copy blocks below in **terminal 2** while server runs.

**Health (A2 / B1):**
```powershell
Invoke-RestMethod http://localhost:4000/health
```

**Courses (B4):**
```powershell
Invoke-RestMethod -Method POST -Uri http://localhost:4000/courses -ContentType "application/json" -Body '{"title":"JS Basics","description":"test"}'
Invoke-RestMethod http://localhost:4000/courses
Invoke-RestMethod http://localhost:4000/courses/1
Invoke-RestMethod -Method POST -Uri http://localhost:4000/courses -ContentType "application/json" -Body '{"title":""}'
Invoke-RestMethod -Method DELETE -Uri http://localhost:4000/courses/1
```

**Lessons (B5):**
```powershell
Invoke-RestMethod -Method POST -Uri http://localhost:4000/courses -ContentType "application/json" -Body '{"title":"Test"}'
Invoke-RestMethod -Method POST -Uri http://localhost:4000/courses/1/lessons -ContentType "application/json" -Body '{"title":"Lesson 1"}'
Invoke-RestMethod -Method PATCH -Uri http://localhost:4000/lessons/1 -ContentType "application/json" -Body '{"isCompleted":true}'
Invoke-RestMethod -Method PATCH -Uri http://localhost:4000/lessons/1 -ContentType "application/json" -Body '{"isCompleted":"true"}'
```

**Empty array — Count may look “empty”:**
```powershell
$r = Invoke-RestMethod http://localhost:4000/courses
@($r).Count
$r | ConvertTo-Json
```

**Alternative — `curl.exe` (not `curl`):**
```powershell
curl.exe --% -X POST http://localhost:4000/courses -H "Content-Type: application/json" -d "{\"title\":\"JS Basics\"}"
```

**For Cursor:** always ask for PowerShell `Invoke-RestMethod`, not bash `curl`.

---

## Phase A — Project setup + AI usage

### A0. Review REQUIREMENTS (no Agent)

Briefly open `REQUIREMENTS.md` — stack (§2), progress (§4), API (§5).

### A1. Scope confirmation (no code)

**Superpowers:** `executing-plans` (light)

**Prompt:**
```text
Read REQUIREMENTS.md sections 2, 3, 4, and 5.

List all 9 API endpoints with HTTP method and path.
Confirm: Express JS backend, Prisma, PostgreSQL, progress on backend, port 4000.
List required vs optional features we will implement.
Do not write code yet.

executing-plans: Step A1 ONLY. Stop.
```

**Verification:**
- [ ] Agent lists 9 endpoints correctly
- [ ] No code files created
- [ ] Optional endpoints included (GET/PATCH course, edit lesson)

---

### A2. Backend scaffold

**Files created:**
```text
backend/
  package.json
  src/index.js
  .env.example
```

**Superpowers:** `executing-plans` | `verification-before-completion`

**Prompt:**
```text
executing-plans: Step A2 ONLY — backend scaffold.

Create:
- backend/package.json: express, cors; scripts "start" and "dev" (node --watch)
- backend/src/index.js: Express port 4000, express.json(), cors(), GET /health -> { status: "ok" }
- backend/.env.example: DATABASE_URL=postgresql://postgres:postgres@localhost:5432/courses_db

NO Prisma. NO course/lesson routes. NO frontend. NO docker-compose.yml yet.

executing-plans: Step A2 ONLY. Stop.

verification-before-completion: list files created. Print Verification commands for me — do not run them.
```

**Verification (USER runs — not Agent):**

1. If port 4000 already in use, see EADDRINUSE section above before `npm run dev`.

```powershell
cd D:\ykarpovych\employment\Stellartech\course-progress-tracker\backend
npm install
npm run dev
```

2. Second terminal (or same after server is up):

```powershell
Invoke-RestMethod http://localhost:4000/health
```

- [ ] Returns `status: ok` (or JSON with ok)
- [ ] `.env` not committed yet (`git status` clean for .env)
- [ ] Agent did **not** leave a hidden server running (port check if EADDRINUSE)

---

## Phase B — Backend + database (local)

**Phase goal:** API on `localhost:4000`, Postgres in Docker, migrations applied, all endpoints green.

**Not in this phase:** frontend, full `docker-compose.yml` for backend.

---

### B1. Prisma schema + `.env` (before postgres)

**Files created:**
```text
backend/prisma/schema.prisma
backend/src/prisma.js
backend/.env          (local — NOT in git)
```

**Critical:** Prisma reads `DATABASE_URL` from `backend/.env` for
`prisma validate` and `prisma generate`. Create `.env` **now**, not at migrate step.
Postgres container is **not** required for `validate` — only the file must exist.

**Superpowers:** `executing-plans` | `verification-before-completion`

**Prompt:**
```text
executing-plans: Step B1 ONLY — Prisma schema + local .env.

Add prisma + @prisma/client to backend/package.json.
Create prisma/schema.prisma — Course and Lesson exactly as REQUIREMENTS.md section 3 (onDelete Cascade).
Create src/prisma.js — single PrismaClient export.

Ensure backend/.env.example exists with localhost DATABASE_URL.
Tell me to copy .env.example to .env (or create .env from example — .env must NOT be committed).

NO migrations yet. NO API routes.

executing-plans: Step B1 ONLY. Stop.
```

**Verification (USER runs):**
```powershell
cd D:\ykarpovych\employment\Stellartech\course-progress-tracker\backend
copy .env.example .env
npx prisma validate
```
- [ ] `schema.prisma` — 2 models, Cascade, correct fields
- [ ] `The schema at prisma\schema.prisma is valid`
- [ ] `git status` does **not** show `.env`

---

### B2. Dev Postgres container

**Files created:**
```text
docker-compose.dev.yml   (postgres only)
```

**Superpowers:** `executing-plans`

**Prompt:**
```text
executing-plans: Step B2 ONLY — dev Postgres.

Create docker-compose.dev.yml at project root:
- single service postgres:16
- user/password/db: postgres/postgres/courses_db
- port 5432:5432
- volume for data persistence

NO backend or frontend in this file.

executing-plans: Step B2 ONLY. Stop.
```

**Verification (USER runs):**
```powershell
cd D:\ykarpovych\employment\Stellartech\course-progress-tracker
docker compose -f docker-compose.dev.yml up -d
docker ps
```
- [ ] Postgres container running

---

### B3. Prisma migrate

**Superpowers:** `executing-plans` | `verification-before-completion`

**Prompt:**
```text
executing-plans: Step B3 ONLY — Prisma migrate.

Add script to package.json: "prisma:migrate": "prisma migrate dev"
Ensure .env.example uses localhost:5432 (backend runs locally, not in Docker yet).

Tell me exact commands to run migration name "init".
Do NOT implement API routes.
Do NOT tell me to copy .env again — it was created in B1.

verification-before-completion: migrate commands + expected success output.
```

**Verification:**
```powershell
cd D:\ykarpovych\employment\Stellartech\course-progress-tracker\backend
npx prisma migrate dev --name init
```
- [ ] Migration completes without errors
- [ ] `backend/prisma/migrations/` contains init migration
- [ ] Optional: `npx prisma studio` — Course and Lesson tables

**Typical errors:**
- `Can't reach database` → run B2 first or wrong DATABASE_URL
- `Environment variable not found: DATABASE_URL` → missing `.env` from B1
- Host must be **localhost** here (backend local, not Docker)

---

### B4. Course endpoints + progress helper

**Files created:**
```text
backend/src/routes/courses.js
backend/src/utils/progress.js
```

**Superpowers:** `executing-plans` | `verification-before-completion`

**Prompt:**
```text
executing-plans: Step B4 ONLY — course endpoints.

Create src/utils/progress.js with calculateProgress per REQUIREMENTS.md section 4 (0 lessons = 0, not NaN).

Create src/routes/courses.js with shared parseId helper (REQUIREMENTS.md section 5):
- invalid id -> 400, missing -> 404

Implement:
- GET /courses — each course includes totalLessons, completedLessons, progress
- GET /courses/:id — course + lessons + progress (404 if missing)
- POST /courses — title required non-empty after trim (400 otherwise)
- PATCH /courses/:id — update title/description with validation
- DELETE /courses/:id — 204 or 404

Wire routes in index.js. NO lesson routes in this step.

verification-before-completion: PowerShell Invoke-RestMethod commands (not bash curl).
```

**Verification:** (terminal 1: `npm run dev`; terminal 2:)
```powershell
Invoke-RestMethod -Method POST -Uri http://localhost:4000/courses -ContentType "application/json" -Body '{"title":"JS Basics","description":"test"}'
Invoke-RestMethod http://localhost:4000/courses
Invoke-RestMethod http://localhost:4000/courses/1
Invoke-RestMethod -Method POST -Uri http://localhost:4000/courses -ContentType "application/json" -Body '{"title":""}'
Invoke-RestMethod -Method DELETE -Uri http://localhost:4000/courses/1
```
- [ ] POST → 201
- [ ] List shows `progress: 0` for course with no lessons
- [ ] Empty title → 400
- [ ] DELETE → 204

---

### B5. Lesson endpoints

**Superpowers:** `executing-plans` | `verification-before-completion`

**Prompt:**
```text
executing-plans: Step B5 ONLY — lesson endpoints.

Create src/routes/lessons.js with parseId helper:
- GET /courses/:courseId/lessons — 404 if course missing
- POST /courses/:courseId/lessons — title required, course must exist
- PATCH /lessons/:id — if isCompleted sent, must be boolean (reject string "true" with 400);
  optional title/description update
- DELETE /lessons/:id — 204 or 404

Use return before every error response (REQUIREMENTS.md section 5).
Wire in index.js. Do not change course route logic.

verification-before-completion: Invoke-RestMethod including boolean vs string "true" test.
```

**Verification:**
```powershell
Invoke-RestMethod -Method POST -Uri http://localhost:4000/courses -ContentType "application/json" -Body '{"title":"Test"}'
Invoke-RestMethod -Method POST -Uri http://localhost:4000/courses/1/lessons -ContentType "application/json" -Body '{"title":"Lesson 1"}'
Invoke-RestMethod -Method PATCH -Uri http://localhost:4000/lessons/1 -ContentType "application/json" -Body '{"isCompleted":true}'
Invoke-RestMethod -Method PATCH -Uri http://localhost:4000/lessons/1 -ContentType "application/json" -Body '{"isCompleted":"true"}'
```
- [ ] Lesson created 201
- [ ] Boolean patch works
- [ ] String `"true"` → 400

---

### B6. Progress + cascade proof

**Superpowers:** `executing-plans` | `verification-before-completion`

**Prompt:**
```text
executing-plans: Step B6 ONLY — verify progress and cascade.

Walk me through Invoke-RestMethod sequence:
1) Create course, add 4 lessons, complete 1 -> GET course shows 25%
2) New course with 0 lessons -> progress 0 (not NaN)
3) DELETE course -> lessons gone (cascade)

Fix minimal bugs only if my tests fail.

verification-before-completion: numbered PowerShell test sequence with expected progress values.
```

**Verification:** manual sequence from REQUIREMENTS §11 steps 6–9, 15
- [ ] 1/4 → 25%
- [ ] 0 lessons → 0%
- [ ] Delete course removes lessons

---

### B7. Close backend phase

**Superpowers:** `finishing-a-development-branch` | `receiving-code-review`

**Prompt:**
```text
finishing-a-development-branch: backend phase done.

Compare implemented API vs REQUIREMENTS.md section 5.
List gaps if any. Suggest git commit message.
Do NOT start frontend.
```

**Verification:**
- [ ] Gap list empty or fixed
- [ ] Optional commit: `Add backend API with Prisma and all endpoints`

---

## Phase C — Frontend

**Goal:** React UI on `http://localhost:5173`, API `http://localhost:4000`.

**Two terminals:**

| Terminal 1 | Terminal 2 |
|---|---|
| `cd backend` → `npm run dev` | `cd frontend` → `npm run dev` |
| port 4000 | port 5173 |

**Verify in browser** except DB cleanup.

**Order:** pages + CRUD first, then **C7** UI state machine (REQUIREMENTS §6 UI states).

### C0. Superpowers block (new chat or same chat)

Re-paste Superpowers session block from top of this file.
Model: **composer-2.5-fast**.

---

### C1. Vite scaffold + proxy

**Files created:**
```text
frontend/  (Vite React+TS)
frontend/vite.config.ts  (proxy /api -> localhost:4000 OR document VITE_API_URL)
frontend/src/index.css
```

**Superpowers:** `executing-plans`

**Prompt:**
```text
executing-plans: Step C1 ONLY — Vite frontend scaffold.

Create frontend/ with Vite React + TypeScript.
Add react-router-dom. Plain CSS in src/index.css only — NO Tailwind.

Configure API access ONE way (pick and document):
- Vite dev proxy: /api -> http://localhost:4000 with path rewrite, OR
- VITE_API_URL=http://localhost:4000 in .env.development

NO Docker. NO page logic yet.

verification-before-completion: npm install + npm run dev commands and URL.
```

**Verification:**
```powershell
cd D:\ykarpovych\employment\Stellartech\course-progress-tracker\frontend
npm install
npm run dev
```
- [ ] Dev server starts
- [ ] `http://localhost:5173` loads

---

### C2. types.ts + api.ts

**Superpowers:** `executing-plans`

**Prompt:**
```text
executing-plans: Step C2 ONLY — types and API client.

Create src/types.ts — Course and Lesson per REQUIREMENTS.md section 3.
Create src/api.ts:
- ApiError class with status and message
- fetch wrapper reading JSON errors from { error: string }
- Functions: getCourses, getCourse, createCourse, updateCourse, deleteCourse,
  getLessons, createLesson, updateLesson, deleteLesson

Use API_BASE from VITE_API_URL or /api proxy (match C1).
NO page components yet.

verification-before-completion: list functions and base URL approach.
```

**Verification:**
- [ ] Files exist, no red import errors in editor

---

### C3. Routing + layout shells

**Superpowers:** `executing-plans`

**Prompt:**
```text
executing-plans: Step C3 ONLY — routing.

Wire react-router-dom in App.tsx:
- / -> CoursesPage (shell with page title)
- /courses/:id -> CourseDetailsPage (shell)

Add basic layout styles in index.css.
NO full CRUD yet.

verification-before-completion: URLs to test in browser.
```

**Verification:**
- [ ] `/` and `/courses/1` show different shells, no router 404

---

### C4. CoursesPage — list, create, delete, progress

**Superpowers:** `executing-plans` | `verification-before-completion`

**Prompt:**
```text
executing-plans: Step C4 ONLY — CoursesPage core.

Implement CoursesPage:
- Load courses on mount
- CourseForm: create course (title, description)
- List: title, description, ProgressBar, Open link, Delete with confirm
- Optional: Edit course (PATCH) inline — per REQUIREMENTS optional

ProgressBar: gray outer, green inner width = progress %.

Basic loading text OK — full error state machine comes in C7.
Read REQUIREMENTS.md section 6.

verification-before-completion: browser checklist create, list, delete, progress 0%.
```

**Verification (backend + frontend running):**
1. `http://localhost:5173/` — create course
2. Course in list, progress 0%
3. Delete — course disappears

---

### C5. CourseDetailsPage — lessons, checkbox, progress

**Superpowers:** `executing-plans` | `verification-before-completion`

**Prompt:**
```text
executing-plans: Step C5 ONLY — CourseDetailsPage core.

Implement:
- Load course by id (GET /courses/:id with lessons)
- ProgressBar + X% and completed/total text
- LessonForm add lesson
- LessonList: checkbox toggles isCompleted via PATCH /lessons/:id
- Delete lesson; optional edit lesson title
- Link back to /

Reuse ProgressBar. Basic loading only — full error UI in C7.

verification-before-completion: browser checklist — 2 lessons, checkbox changes progress.
```

**Verification:**
1. Open course → add 2 lessons
2. Checkbox → progress changes
3. Delete lesson → progress updates

---

### C6. Optional edit (if not done in C4/C5)

**Superpowers:** `executing-plans`

**Prompt:**
```text
executing-plans: Step C6 ONLY — edit course and lesson title if not implemented.

Minimal UI: Edit button toggles inline form. PATCH endpoints.
Stop if already done.

verification-before-completion: what to click in browser.
```

**Verification:**
- [ ] Edit course name on list page
- [ ] Edit lesson title on details page

---

### C7. Loading, error, empty states (CRITICAL)

**Why separate step:** Without explicit rules AI shows create form when backend is down,
hides empty state, shows blank 404 page (REQUIREMENTS §6 UI states).

**Superpowers:** `executing-plans` | `verification-before-completion`

**Prompt:**
```text
executing-plans: Step C7 ONLY — UI states per REQUIREMENTS.md section 6 "UI states — exact rules".

Implement EXACTLY:

CoursesPage:
- hasLoaded flag
- showForm ONLY when hasLoaded && !loadError && not editing
- loadError: ErrorMessage + Retry, NO create form
- empty: visible card "No courses yet" when hasLoaded && !loadError && courses.length===0
- actionError: separate from loadError; keep list visible if already loaded
- Retry on actionError MUST clear actionError (setActionError(null)) before reload

CourseDetailsPage:
- loadError: "Course unavailable" heading + ErrorMessage + Retry + Back — NOT blank page
- empty lessons: "No lessons yet" in lesson list
- Retry on actionError clears actionError before retry action

Reuse ErrorMessage, LoadingMessage components.
Do not change API or backend.

verification-before-completion: numbered browser test checklist from BUILD-STEPS C7 table.
```

**Verification:**

| # | Action | Expected |
|---|---|---|
| 1 | Backend up → `Invoke-RestMethod http://localhost:4000/health` | ok |
| 2 | Stop backend → refresh `http://localhost:5173/` | Loading → **red error + Retry**, **NO** create form |
| 3 | Start backend → Retry | list loads again |
| 4 | `@((Invoke-RestMethod http://localhost:4000/courses)).Count` → `0` | empty DB |
| 4b | Refresh `/` | form + card **No courses yet** |
| 5 | List loaded → stop backend → submit create | action error, **list still visible** |
| 6 | Open `/courses/99999` | Back + **Course unavailable** + Retry |
| 7 | Real course, 0 lessons | **No lessons yet** |

**If step 4 shows Count > 0:** delete courses via UI or:
```powershell
$courses = @(Invoke-RestMethod http://localhost:4000/courses)
foreach ($c in $courses) {
  Invoke-RestMethod -Method DELETE -Uri "http://localhost:4000/courses/$($c.id)"
}
@((Invoke-RestMethod http://localhost:4000/courses)).Count
```

**After changes:** hard refresh **Ctrl+F5** (HMR may not update everything).

---

### C8. Production build

**Superpowers:** `verification-before-completion`

**Prompt:**
```text
verification-before-completion: confirm frontend builds.

Tell me to run npm run build in frontend/. Fix only build errors, no new features.
```

**Verification:**
```powershell
cd D:\ykarpovych\employment\Stellartech\course-progress-tracker\frontend
npm run build
```
- [ ] Build completes without errors

---

### C9. Close frontend phase

**Superpowers:** `finishing-a-development-branch`

**Prompt:**
```text
finishing-a-development-branch: frontend phase done.

Compare UI vs REQUIREMENTS.md section 6. List gaps.
Suggest git commit message. Do NOT start Docker yet.
```

**Verification:**
- [ ] Gaps empty or fixed
- [ ] Optional commit for frontend

---

## Phase D — Docker Compose

**Goal:** `docker compose up --build` → frontend :3000, backend :4000, postgres :5432.

**Before D:** phases B and C green locally.

**In compose:** `DATABASE_URL` host = **`postgres`**, not `localhost`.

**Stop** local `npm run dev` before compose (port conflicts on 3000/4000/5432).

### D0. Superpowers block

```text
Superpowers mode + executing-plans:

Read REQUIREMENTS.md sections 7-8 and BUILD-STEPS.md phase D.

Implement Docker only. Do not change API logic unless required for container startup.
Backend JS (not TS). Prisma migrate deploy on backend container start.
3 services: frontend, backend, postgres. Ports 3000, 4000, 5432.
One step at a time.
```

---

### D1. backend/Dockerfile + migrate on start

**Superpowers:** `executing-plans`

**Prompt:**
```text
executing-plans: Step D1 ONLY — backend Dockerfile.

- Node 20 alpine
- Copy package.json, prisma, src
- npm install
- prisma generate
- CMD: sh -c "npx prisma migrate deploy && node src/index.js" (or equivalent)
- EXPOSE 4000
- backend/.dockerignore: node_modules

NO frontend Dockerfile yet. NO docker-compose.yml yet.

verification-before-completion: list files and startup command explanation.
```

**Verification:**
- [ ] Dockerfile and .dockerignore exist
- [ ] Startup runs migrate deploy before node

---

### D2. frontend/Dockerfile

**Superpowers:** `executing-plans`

**Prompt:**
```text
executing-plans: Step D2 ONLY — frontend Dockerfile.

- Build stage: npm ci, npm run build with VITE_API_URL=http://localhost:4000
  (browser on host must reach backend — NOT http://backend:4000)
- Serve stage: nginx alpine serving dist on port 3000
- Optional: nginx location /api proxy to backend:4000 (alternative to VITE_API_URL)
- frontend/.dockerignore

NO docker-compose.yml yet.

verification-before-completion: explain how browser reaches API from host.
```

**Verification:**
- [ ] Dockerfile + .dockerignore created
- [ ] API URL strategy documented (VITE_API_URL or nginx /api)

---

### D3. docker-compose.yml (3 services)

**Superpowers:** `executing-plans` | `verification-before-completion`

**Prompt:**
```text
executing-plans: Step D3 ONLY — docker-compose.yml at project root.

Services:
- postgres:16, volume postgres_data, port 5432
- backend: build ./backend, port 4000,
  environment DATABASE_URL=postgresql://postgres:postgres@postgres:5432/courses_db
- frontend: build ./frontend, port 3000
- depends_on: backend after postgres, frontend after backend
- CORS on backend must allow http://localhost:3000

Keep docker-compose.dev.yml for local dev if present — add comment.

Stop. Do not run compose yet — give me the up command.

verification-before-completion: checklist items to read in compose file.
```

**Verification:** open `docker-compose.yml`
- [ ] 3 services, volume, DATABASE_URL host `postgres`
- [ ] Ports 3000, 4000, 5432 mapped

---

### D4. Run compose

**Superpowers:** `verification-before-completion`

**Prompt:**
```text
verification-before-completion: Step D4 — run full stack.

Give me exact commands: docker compose down, docker compose up --build.
Then browser checks on http://localhost:3000.
```

**Verification:**
```powershell
cd D:\ykarpovych\employment\Stellartech\course-progress-tracker
docker compose down
docker compose up --build
```
- [ ] All 3 containers up
- [ ] `http://localhost:3000` loads UI
- [ ] Create course in UI works

---

### D5. Persistence + close Docker phase

**Superpowers:** `finishing-a-development-branch` | `verification-before-completion`

**Prompt:**
```text
executing-plans: Step D5 ONLY — persistence test.

Guide me through REQUIREMENTS.md acceptance step 14:
create data -> docker compose down -> docker compose up -> data still there.

finishing-a-development-branch: Docker checklist vs REQUIREMENTS.md section 8.

verification-before-completion: numbered steps.
```

**Verification:**
- [ ] Data survives down/up
- [ ] `docker compose up --build` is sufficient to run everything

---

## Phase E — Green path

Walk **REQUIREMENTS.md §11** all 15 steps in browser at `http://localhost:3000`.

**Superpowers:** `verification-before-completion` on full checklist.

---

## Error template (paste to Agent)

```text
systematic-debugging: Step [B4] failed.

Terminal output:
[paste]

Files involved:
[list]

Minimal fix only. No refactor.
```

---

## If the agent runs terminals anyway (recovery)

Paste **once** in chat — not in every step prompt:

```text
Stop. Do not run terminal commands. Session rules already say I verify manually.
Print BUILD-STEPS Verification for this step only. Wait for my output.
```

**Default end of normal step prompts (short):**

```text
executing-plans: Step [ID] ONLY. Stop.
```
