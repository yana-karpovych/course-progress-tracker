# Course Progress Tracker

A simple full-stack application for tracking course completion progress. Create courses, add lessons, and mark them complete.

## How to run

### Docker (recommended)

From the project root:

```bash
docker compose up --build
```

Open the app at http://localhost:3000

Stop containers:

```bash
docker compose down
```

URLs after startup:

- Frontend — http://localhost:3000
- Backend API — http://localhost:4000
- PostgreSQL — localhost:5432

Check that the backend is up:

```bash
curl http://localhost:4000/health
```

Expected response: JSON with `status: "ok"`.

Data is stored in the Docker volume `postgres_data`. If you run `docker compose down` and then `docker compose up` again, your courses and lessons should still be there. Do not use `docker compose down -v` if you want to keep the data.

### Local development

Start PostgreSQL only (not the full stack):

```bash
docker compose -f docker-compose.dev.yml up -d
```

Backend (`backend/`):

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev
```

On Windows CMD: `copy .env.example .env`  
On Windows PowerShell: `Copy-Item .env.example .env`

The API runs at http://localhost:4000. Health check: `GET /health`.

Frontend (`frontend/`):

```bash
cd frontend
npm install
npm run dev
```

The UI runs at http://localhost:5173. In dev, the frontend calls `/api/...` and Vite proxies those requests to http://localhost:4000.

## Technologies used

- **Node.js + Express (JavaScript)** — REST API on port 4000
- **React + TypeScript + Vite** — single-page UI
- **react-router-dom** — course list and course details pages
- **PostgreSQL 16** — persistent storage
- **Prisma** — schema, migrations, and database access from the backend
- **Plain CSS** — styling in `frontend/src/index.css` (no UI library)
- **Docker + Docker Compose** — postgres, backend, and frontend services
- **nginx** — serves the built frontend in the production Docker image

## API endpoints

Base URL: `http://localhost:4000`  
All bodies and responses are JSON unless noted.

**Health**

- `GET /health` — returns `{ "status": "ok" }` when the server is running

**Courses**

- `GET /courses` — list courses; each item includes `totalLessons`, `completedLessons`, and `progress`
- `GET /courses/:id` — one course with its `lessons` array and progress fields
- `POST /courses` — create; body `{ "title": "...", "description": "..." }` (description optional)
- `PATCH /courses/:id` — update title or description
- `DELETE /courses/:id` — delete course and all its lessons (cascade)

**Lessons**

- `GET /courses/:courseId/lessons` — list lessons for a course
- `POST /courses/:courseId/lessons` — create; body `{ "title": "...", "description": "..." }`
- `PATCH /lessons/:id` — update; body may include `isCompleted` (boolean), `title`, or `description`
- `DELETE /lessons/:id` — delete one lesson

**Validation**

- Empty or whitespace-only `title` → `400` with `{ "error": "..." }`
- `isCompleted` must be a real boolean (not the string `"true"`) → `400`
- Invalid id in the URL → `400`
- Course or lesson not found → `404`

**Progress**

Returned on course list and course detail responses. Formula: completed lessons divided by total lessons, rounded to a whole percent. If there are no lessons, progress is `0` (not an error).

## Database

Two related tables in PostgreSQL, defined in `backend/prisma/schema.prisma`:

**Course** — `id`, `title`, `description`, `createdAt`

**Lesson** — `id`, `courseId`, `title`, `isCompleted`, `description` (optional), `createdAt`

One course has many lessons. Deleting a course deletes its lessons (`onDelete: Cascade`).

Schema changes are applied with Prisma migrations in `backend/prisma/migrations/`. When the backend Docker container starts, it runs `prisma migrate deploy` before starting Node.

Local development uses `backend/.env` (copy from `.env.example`):

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/courses_db
```

Inside `docker-compose.yml`, the backend service uses host name `postgres` (the Compose service name), not `localhost`, because the API runs inside the Docker network.

## Docker

**`docker-compose.yml`** — full stack for submission and demo:

- `postgres` — PostgreSQL 16, port 5432, data in volume `postgres_data`
- `backend` — built from `backend/Dockerfile`; port 4000; runs migrations then `node src/index.js`
- `frontend` — built from `frontend/Dockerfile`; nginx on port 3000 serves the React build

`depends_on` sets startup order: database, then backend, then frontend.

**`docker-compose.dev.yml`** — Postgres only, for local `npm run dev` on the backend and frontend without building the full stack.

**`backend/Dockerfile`** — Node 20 Alpine; installs dependencies, runs `prisma generate`, exposes 4000, starts with migrate deploy + Node.

**`frontend/Dockerfile`** — multi-stage build: `npm run build` then nginx serves `dist/` on port 3000.

**`frontend/nginx.conf`** — serves static files and proxies `/api/` to the backend service; `try_files` supports React Router URLs on refresh.

The browser runs on your machine, so the built frontend uses `http://localhost:4000` for API calls (set at build time via `VITE_API_URL`).

## What is completed

- List, create, edit, and delete courses (title and description in the UI)
- Add and delete lessons
- Mark lessons complete or not complete via checkbox
- Edit lesson title in the UI (inline edit on the course details page)
- Progress percentage shown on the course list and course details pages
- All required REST endpoints implemented, plus optional `GET /courses/:id` and `PATCH` for courses and lessons
- Request validation (empty titles, boolean `isCompleted`, invalid ids)
- Loading, error, and empty states in the UI
- Two pages: course list at `/` and course details at `/courses/:id`
- PostgreSQL persistence through Prisma
- `docker compose up --build` runs frontend, backend, and database together
- Data survives container restart via the Postgres volume

## What is not completed

- **Edit lesson description in the UI** — the API accepts `description` on `PATCH /lessons/:id`, and you can set a description when creating a lesson; inline edit only saves the title because the edit form hides the description field and does not send it on save. I kept this after the recorded demo: optional “edit lesson” is covered by title edit, the gap is frontend-only (no API change), and fixing it would require a frontend Docker rebuild plus re-checking the loading and error states already verified in testing — I documented it here instead of patching after submission.
- Automated tests (unit, integration, or end-to-end)
- User authentication and accounts
- Pagination, search, or filters on the course list
- CI/CD pipeline or cloud deployment

## AI Usage Report

**AI tool used:** Cursor IDE — Agent mode (Composer), model `composer-2.5`

**What I used AI for:** Planning the step order, scaffolding the backend and frontend, implementing API routes and Prisma schema, React pages and components, Docker files, and the first draft of this README. I worked one BUILD-STEPS phase at a time and checked each step myself in the terminal and browser before moving on. Internal specs live in `.cursor/docs/` (not part of the app runtime).

**2–3 example prompts:**

Backend (course routes and progress):

```text
executing-plans: Step B4 ONLY — course endpoints.

Create src/utils/progress.js with calculateProgress per REQUIREMENTS section 4
(0 lessons = 0, not NaN).

Create src/routes/courses.js with parseId — invalid id -> 400, missing -> 404.
Implement GET /courses, GET /courses/:id, POST, PATCH, DELETE.

Wire routes in index.js. NO lesson routes in this step.

verification-before-completion: PowerShell Invoke-RestMethod commands (not bash curl).
```

Frontend (loading and error states):

```text
executing-plans: Step C7 ONLY — UI states per REQUIREMENTS section 6.

CoursesPage: hasLoaded flag; showForm only when hasLoaded && !loadError && not editing.
loadError blocks the create form; actionError keeps the list visible if already loaded.
Retry on actionError must clear actionError before reload.

CourseDetailsPage: loadError shows "Course unavailable" + Retry + Back — not a blank page.
Empty lessons: "No lessons yet".

Do not change API or backend.
```

Docker (full Compose file):

```text
executing-plans: Step D3 ONLY — docker-compose.yml.

Three services: postgres, backend, frontend. Ports 3000, 4000, 5432.
Backend DATABASE_URL host must be postgres (service name), not localhost.
postgres_data volume for persistence. depends_on startup order.
```

I also pasted a Superpowers session block once per Agent chat so the Agent would not run `npm` or Docker and would stop after each step.

**What I changed manually:** I did not edit the application source code by hand after generation. My manual work was running all commands (`npm install`, `npm run dev`, `npx prisma migrate dev`, `docker compose up --build`, etc.), testing the API with curl and PowerShell `Invoke-RestMethod`, clicking through the UI (create, checkbox, errors, persistence), reviewing Agent diffs between steps, and writing the internal requirements and build plan in `.cursor/docs/`.

**What was difficult:**

- This was my first project with Express, Prisma, and PostgreSQL together. Understanding the order — schema, then migrate, then routes — took time even with AI help.
- `DATABASE_URL` uses `localhost` when Node runs on my PC, but `postgres` when the backend runs inside Docker. Same database, different host name depending on where the process runs.
- Port conflicts (`EADDRINUSE` on 4000 or 5432) when an old container or dev server was still running; I had to stop the project or kill the process before restarting.
- On Windows, PowerShell `curl` is not the same as bash `curl`; empty JSON arrays print nothing in the terminal unless you use `@($r).Count`.
- UI state rules were easy to get wrong: `loadError` (page blocked) versus `actionError` (list still visible), and clearing errors on Retry.
- Docker networking for the frontend: the browser runs on the host, so API URLs must be reachable from the browser (`localhost:4000`), not the internal Docker service name `backend`.

Most of these issues showed up during step-by-step verification, not in the final demo path on video.
