# Course Progress Tracker — Technical Specification

> Implementation spec for Cursor Agent and README authoring.
> Stack decisions are fixed — do not revisit without explicit user request.

---

## 1. Purpose

Create a simple full-stack application for tracking course completion progress.

**What is evaluated:** basic full-stack understanding — simple UI, API, database, Docker,
and **ability to explain the code**.

Recommended scope: ~1 hour of work (guideline, not a hard limit).
This is **not** a production system. Write clean, understandable code within the task scope.

### AI usage rule

- Cursor / ChatGPT / Claude / Copilot are **allowed** for development.
- **Forbidden:** any AI API **inside the application** (no OpenAI/Claude requests from project code).
- Document AI usage in README → **AI Usage Report** section.

---

## 2. Technology stack (fixed decisions)

```txt
Backend:    Node.js + Express       (JavaScript, NO TypeScript)
Frontend:   React + TypeScript      (Vite)
Database:   PostgreSQL 16 + Prisma ORM
Docker:     Docker Compose, 3 services — frontend, backend, postgres
Ports:      frontend 3000 / backend 4000 / postgres 5432
Styling:    plain CSS, one file (no Tailwind, no UI libraries)
Routing:    react-router-dom, 2 pages
Progress:   calculated on BACKEND, returned with course data
README:     English
```

### Why this stack (for verbal explanation)

| Decision | Rationale |
|---|---|
| Node + Express | Simplest REST API; internship track is Node.js + React |
| JS backend, not TS | TS backend adds compile step in Dockerfile — extra risk; little gain on 9 simple endpoints |
| TS on frontend | Vite gives a ready template; `Course`/`Lesson` types catch real errors |
| PostgreSQL, not SQLite | Preferred in task; one line in Docker |
| Prisma | Human-readable schema, auto migrations, autocomplete |
| Progress on backend | Business logic on server; frontend only displays |
| Frontend in Docker | Bonus in task — include as third compose service |

---

## 3. Data model

### Frontend types

```ts
type Course = {
  id: number;
  title: string;
  description: string;   // may be empty string
  createdAt: string;     // NOT optional — DB always sets it
  // additionally from backend:
  totalLessons?: number;
  completedLessons?: number;
  progress?: number;     // 0..100
};

type Lesson = {
  id: number;
  courseId: number;
  title: string;
  isCompleted: boolean;
  description?: string;  // only truly optional field
  createdAt: string;
};
```

Rule: `?` before the colon means the field may be absent. `createdAt` is **not** optional.

### Prisma schema

```prisma
model Course {
  id          Int      @id @default(autoincrement())
  title       String
  description String   @default("")
  createdAt   DateTime @default(now())
  lessons     Lesson[]
}

model Lesson {
  id          Int      @id @default(autoincrement())
  courseId    Int
  title       String
  isCompleted Boolean  @default(false)
  description String?
  createdAt   DateTime @default(now())
  course      Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
}
```

Create tables:

```bash
npx prisma migrate dev --name init
```

Prisma generates SQL and creates tables — do not write SQL by hand.

### One course → many lessons

Three concrete consequences:

1. **In the database** — `lessons` has `course_id` referencing `courses.id` (foreign key).
   DB rejects a lesson pointing to a non-existent course.
2. **In the API** — nested routes: `/courses/5/lessons` = lessons for course #5.
3. **In the UI** — lessons always belong to a specific course.

`onDelete: Cascade` — deleting a course **automatically** deletes its lessons.
Without this, deleting a course with lessons returns an error.

SQL equivalent (what Prisma creates):

```sql
CREATE TABLE lessons (
  id           SERIAL PRIMARY KEY,
  course_id    INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMP NOT NULL DEFAULT now()
);
```

### Field naming: camelCase vs snake_case

Task recommends snake_case in DB (`created_at`, `is_completed`, `course_id`) and camelCase
in API (`createdAt`, `isCompleted`, `courseId`). Prisma defaults to camelCase everywhere —
**acceptable**. Use `@map("created_at")` only if you want exact DB naming — not required.

---

## 4. Progress logic

```txt
progress = completed lessons / total lessons * 100
```

Control examples from the task:

```txt
0 / 0 = 0%     <- special case, otherwise NaN
1 / 4 = 25%
2 / 4 = 50%
4 / 4 = 100%
```

Implementation (on backend):

```js
function calculateProgress(lessons) {
  if (lessons.length === 0) return 0;              // without this line → NaN
  const completed = lessons.filter((lesson) => lesson.isCompleted).length;
  return Math.round((completed / lessons.length) * 100);
}
```

Important:

- This is **division**, not multiplication.
- **One** lessons array. `total` = its length, `completed` = filter result. Not two arrays.
- Zero check is mandatory — task explicitly tests `0/0`.

---

## 5. API — detailed specification

Base URL: `http://localhost:4000`. Format: JSON.

### What “create an endpoint” means

An endpoint runs when a request hits a path with a given HTTP method.

```js
import express from 'express';
const app = express();

app.use(express.json());   // parse JSON request bodies

app.get('/courses', async (request, response) => {
  const courses = await prisma.course.findMany({ orderBy: { createdAt: 'desc' } });
  response.json(courses);
});

app.listen(4000, () => console.log('Server started on port 4000'));
```

- `app.get` / `post` / `patch` / `delete` — HTTP method.
- `'/courses'` — path.
- `request.params` — path params (`:id` → `request.params.id`).
- `request.body` — JSON body.
- `response.json(...)`, `response.status(...)`.

### Route param IDs — use a shared `parseId` helper

`request.params.id` is a **string**. Always parse and validate:

```js
function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}
```

Return **400** for invalid id, **404** for valid id not found — never crash.

### HTTP status codes

| Code | Meaning | Usage |
|---|---|---|
| 200 | OK | successful GET, PATCH |
| 201 | Created | successful POST |
| 204 | No Content | successful DELETE |
| 400 | Bad Request | validation failed |
| 404 | Not Found | course/lesson missing |
| 500 | Server Error | unexpected error |

### Courses

```txt
GET /courses
  Returns: 200 + array; each course includes totalLessons, completedLessons, progress
```

```txt
GET /courses/:id                    [optional in task — implement]
  Returns: 200 + course with lessons array and progress; or 404
```

```txt
POST /courses
  Body: { title, description? }
  Validates: title non-empty string after trim
  Returns: 201 + course; or 400 { error }
```

```txt
PATCH /courses/:id                  [optional in task — implement]
  Body: { title?, description? }
  Validates: course exists; if title sent — non-empty string
  Returns: 200 + updated course; or 400 / 404
```

```txt
DELETE /courses/:id
  Returns: 204 (no body); or 404
  Cascade deletes all lessons
```

### Lessons

```txt
GET /courses/:courseId/lessons
  Validates: course exists
  Returns: 200 + lessons array; or 404
```

```txt
POST /courses/:courseId/lessons
  Body: { title, description? }
  Validates: course exists; title non-empty after trim
  Returns: 201 + lesson; or 400 / 404
```

```txt
PATCH /lessons/:id
  Body: { isCompleted?, title?, description? }
  Validates: lesson exists; if isCompleted sent — must be boolean;
             if title sent — non-empty string
  Returns: 200 + lesson; or 400 / 404
```

```txt
DELETE /lessons/:id
  Returns: 204; or 404
```

### Validation in code

Checks at the **start** of the handler, before DB access. On failure — `return` immediately.

```js
app.post('/courses', async (request, response) => {
  const { title, description } = request.body;

  if (typeof title !== 'string' || title.trim() === '') {
    return response.status(400).json({ error: 'Title is required' });
  }

  const course = await prisma.course.create({
    data: { title: title.trim(), description: description ?? '' },
  });
  response.status(201).json(course);
});
```

Boolean and existence check:

```js
app.patch('/lessons/:id', async (request, response) => {
  const id = parseId(request.params.id);
  if (id === null) return response.status(400).json({ error: 'Invalid lesson id' });

  const { isCompleted } = request.body;

  if (typeof isCompleted !== 'boolean') {
    return response.status(400).json({ error: 'isCompleted must be a boolean' });
  }

  const lesson = await prisma.lesson.findUnique({ where: { id } });
  if (!lesson) {
    return response.status(404).json({ error: 'Lesson not found' });
  }

  const updated = await prisma.lesson.update({ where: { id }, data: { isCompleted } });
  response.json(updated);
});
```

**Most common mistake:** forget `return` before `response.status(400)` — handler continues.

**Why `typeof isCompleted !== 'boolean'`:** frontend may send string `"true"` instead of `true`.

### Validation checklist

- [ ] `course.title` required (non-empty after trim)
- [ ] `lesson.title` required (non-empty after trim)
- [ ] `isCompleted` must be boolean when provided
- [ ] lesson must belong to an existing course
- [ ] missing id → 404, not server crash
- [ ] invalid numeric id in path → 400 or 404, not crash

### Windows API testing

On Windows PowerShell, `curl` is an alias for `Invoke-WebRequest` — bash `curl` syntax fails.
Use **`Invoke-RestMethod`** or **`curl.exe`** (see `BUILD-STEPS.md`).

---

## 6. Frontend

### Two pages

**Page 1 — `/` — course list**

- create course form (title, description)
- list: title, progress, open, edit, delete
- loading and error states

**Page 2 — `/courses/:id` — course details**

- course title and description
- progress bar + text `X%` and `completed / total`
- add lesson form
- lesson list: checkbox, title, edit, delete
- link back to list
- loading and error states

Task formally allows one screen (“course details area or page”), but two pages are clearer.

### Design

One `index.css` — container width, spacing, card borders, readable buttons.
Progress bar: outer gray `div`, inner green `div` with `width: ${progress}%`.
**No Tailwind, no UI libraries.**

### Loading and error — required

Task requires “basic loading or error message”:

- while fetching — `Loading...`
- on failure — error text + retry
- empty list — `No courses yet`

### UI states — exact rules (Cursor must read before frontend error step)

These rules are **not** in the original task PDF, but without them AI often shows the
create form when the backend is down, hides empty state, or shows a blank 404 page.

**Courses page `/`**

| State | What to show |
|---|---|
| `loading` (first load) | `Loading...`, **no** create form |
| `loadError` (backend down / network) | red error + **Retry**, **no** “New course” form |
| `hasLoaded && !loadError && courses.length === 0` | create form + visible card `No courses yet` |
| `hasLoaded && courses.length > 0` | form + course list |
| `actionError` (create/update/delete failed) | error + Retry; **list stays visible** if already loaded; Retry must **clear** `actionError` and reload data |

Technically: `showForm = hasLoaded && !loadError && not editing`.

**Course details `/courses/:id`**

| State | What to show |
|---|---|
| `loading` | `Loading...` |
| `loadError` (404 or network) | `← Back`, heading **Course unavailable**, error text, **Retry** — **not** blank page |
| `course loaded, lessons.length === 0` | `No lessons yet` |
| `actionError` | error; course data stays on screen; Retry clears action error |

**Dev URLs:** frontend `http://localhost:5173` (Vite), API `http://localhost:4000`.
Use Vite proxy `/api` → `4000` **or** `VITE_API_URL=http://localhost:4000` — pick one, document it.

**Frontend verification — in the browser**, not PowerShell (except clearing DB).

**Empty API array in PowerShell:** `Invoke-RestMethod` may print nothing for `[]`.
Use `@($r).Count` — see `BUILD-STEPS.md`.

---

## 7. Database

### “Store permanently”

Data must survive server restart. **Do not** use in-memory arrays:

```js
const courses = [];   // lost on restart
```

Data lives in PostgreSQL. In Docker, add a **volume** so the DB container can be recreated
without losing data:

```yaml
  postgres:
    image: postgres:16
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

**Persistence check:** create course → `docker compose down` → `docker compose up` → course still there.

### Prisma and `.env` timing (lesson from draft)

- `backend/.env` must exist **before** `npx prisma validate` / `prisma generate` (step B2).
- Postgres container must run **before** `npx prisma migrate dev` (step B3 then B4).
- Do **not** copy `.env` again at migrate step if already created in B2.

### DATABASE_URL breakdown

```txt
postgresql://postgres:postgres@postgres:5432/courses_db
```

| Part | Value |
|---|---|
| `postgresql://` | database type |
| first `postgres` | user |
| second `postgres` | password |
| **third `postgres`** | **host** (easy to confuse) |
| `5432` | port |
| `courses_db` | database name |

Why host is `postgres`, not `localhost`: in Docker Compose services reach each other
**by compose service names**. Inside the backend container, `localhost` is the container itself.

Two variants to keep separate:

```txt
Backend in Docker:   postgresql://postgres:postgres@postgres:5432/courses_db
Backend local dev:   postgresql://postgres:postgres@localhost:5432/courses_db
```

This is the **most common** “cannot connect to database” cause.

---

## 8. Docker

Single command:

```bash
docker compose up --build
```

Services:

```txt
frontend  -> 3000   (bonus in task — implement)
backend   -> 4000   (required)
postgres  -> 5432   (required)
```

Checklist:

- [ ] `backend/Dockerfile`
- [ ] `frontend/Dockerfile`
- [ ] `docker-compose.yml` — 3 services
- [ ] Postgres volume for persistence
- [ ] `depends_on` for startup order
- [ ] Prisma migrations on backend start (`prisma migrate deploy`)
- [ ] `.dockerignore` (exclude `node_modules`)
- [ ] `.env.example`; real `.env` in `.gitignore`

**CORS** on backend — frontend on port 3000 calls backend on 4000 (different origins).
Browser blocks requests without CORS.

### Frontend API URL in Docker (lesson from draft)

The browser runs on the **host**, not inside the frontend container.
API calls from the browser must reach `http://localhost:4000` (or nginx proxy `/api` on port 3000).
Do **not** set browser-facing API URL to `http://backend:4000` — that hostname only works inside Docker network.

Options:

- Build frontend with `VITE_API_URL=http://localhost:4000`
- Or nginx in frontend container proxies `/api` → `backend:4000`

### Dev-only postgres

`docker-compose.dev.yml` with postgres only — for local backend development before full compose.

Stop local `npm run dev` before `docker compose up` if ports 3000/4000/5432 conflict.

---

## 9. Project structure

```txt
course-progress-tracker/
  backend/
    src/
      index.js
      routes/
      utils/           # e.g. progress.js
      prisma.js
    prisma/
      schema.prisma
      migrations/
    Dockerfile
    package.json
    .env.example
  frontend/
    src/
      pages/
      components/
      api.ts
      types.ts
      index.css
    Dockerfile
    package.json
  docker-compose.yml
  docker-compose.dev.yml   # optional — dev postgres only
  BUILD-STEPS.md
  README.md
  .gitignore
```

---

## 10. Scope

### Required (from task)

- [ ] List, create, delete courses
- [ ] Add lessons to course
- [ ] Mark lesson completed / not completed
- [ ] **Delete lesson** — see note below
- [ ] Display progress percentage
- [ ] 7 required API endpoints + validation rules
- [ ] Two related tables, persistent storage
- [ ] `docker compose up --build` runs backend + database (+ frontend)
- [ ] Loading / error in UI
- [ ] README with all sections + AI Usage Report

> **Delete lesson note.** Omitted from “required features” list in task text, but present in
> API (`DELETE /lessons/:id`), frontend task (“Delete lesson button”), and demo checklist.
> **Required.**

### Optional from task — implement all (after required works)

- [ ] `GET /courses/:id`
- [ ] `PATCH /courses/:id` + edit course UI
- [ ] Edit lesson title (`PATCH /lessons/:id`)

### Recommended extras

- [ ] Frontend as third Docker service
- [ ] Progress calculated on backend
- [ ] English README
- [ ] Logical git commits

### Do NOT implement

- authentication, users, roles
- pagination, search, filters, sorting
- tests (not required; skip unless spare time)
- CI/CD, GitHub Actions
- Tailwind, UI libraries, dark theme, animations
- optimistic updates, caching, React Query
- microservices, heavy abstractions
- **any AI API inside the app**
- production deployment

---

## 11. Acceptance demo checklist

1. `docker compose up --build` — all services start without errors
2. Open `http://localhost:3000` — empty list message
3. Create course “JavaScript Basics” with description
4. Course in list, progress `0%` (0 lessons case)
5. Open course — details page
6. Add 4 lessons
7. Mark 1st complete → `25%`
8. Mark 2nd complete → `50%`
9. Uncheck 2nd → `25%`
10. Edit course title → visible in UI
11. Delete one lesson → progress recalculated
12. Back to course list → progress visible there too
13. Create course with empty title → validation error shown
14. `docker compose down` → `docker compose up` → data still present
15. Delete course → course and lessons removed

---

## Verification workflow (Cursor Agent)

During development and **video recording**, the **human** runs all checks — not the Agent.

| Who runs | What |
|---|---|
| **Agent** | Create/edit files; print verification commands from `BUILD-STEPS.md` |
| **User** | `npm install`, `npm run dev`, `Invoke-RestMethod`, browser, `docker compose` |

**Agent must NOT:**

- run `npm run dev` / `npm start` (leaves port 4000 busy → `EADDRINUSE` on video)
- run Docker or Prisma CLI commands
- claim "I tested" or "health check passed" without user confirmation

**If port 4000 is already in use:** either test API without starting again, or stop the
existing Node process before `npm run dev` (see `BUILD-STEPS.md` EADDRINUSE).

**Superpowers `verification-before-completion`** here means: agent prints the checklist;
user runs it and reports back.

**Video:** state this once in the Superpowers session block at chat start — do not repeat
the full rule in every step prompt (looks scripted). Step prompts stay short:
`executing-plans: Step X ONLY. Stop.`

---

## 12. Risks

| Risk | Symptom | Fix |
|---|---|---|
| `DATABASE_URL` host | cannot connect to DB | `postgres` in Docker, `localhost` locally |
| Startup order | backend before DB | `depends_on`; optional healthcheck |
| Prisma migrations in container | no tables on first run | `prisma migrate deploy` on backend start |
| CORS | browser blocks API | enable CORS on Express |
| `0/0` progress | `NaN%` in UI | zero-lesson check in `calculateProgress` |
| Cascade delete | error deleting course with lessons | `onDelete: Cascade` in schema |
| Port conflicts (Windows) | container fails to bind | free 3000 / 4000 / 5432 |
| Agent started dev server | `EADDRINUSE` when user runs `npm run dev` | agent must NOT run npm; user checks port first |
| `params.id` type | wrong queries / crashes | `parseId()` + 400 for invalid |
| PowerShell `curl` | garbled API tests | `Invoke-RestMethod` or `curl.exe` |
| Empty array in PowerShell | “nothing printed” | `@($r).Count` |
| Browser API URL in Docker | UI cannot reach API | `localhost:4000` or nginx `/api` proxy |
| Retry leaves stale error | error stuck after fix | clear `actionError` on Retry |
| HMR after UI changes | old UI behavior | hard refresh Ctrl+F5 |

---

## 13. README (write after demo, before push)

English README sections:

- how to run (`docker compose up --build`)
- technologies used
- API endpoints list
- database description
- Docker description
- what is completed / not completed
- **AI Usage Report:** tool, purpose, 2–3 prompt examples, what you fixed manually, what was hard
