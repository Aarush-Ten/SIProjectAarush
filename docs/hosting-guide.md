# Run locally and publish a free public demo

**Security configuration update:** follow [the security audit deployment checklist](security-audit.md#deployment-requirements-and-residual-risks) before these publishing steps. The Render blueprint now sets production mode: supply exact `ALLOWED_HOSTS` (JSON array of API hostnames without schemes) and HTTPS `CORS_ORIGINS`. The API docs are disabled in production by default. Use durable database storage before retaining expert contacts or enabling paid AI. Next.js now requires dynamic rendering for fresh CSP nonces; do not use static export or shared-cached HTML.

Checked against provider documentation on **25 October 2026**. This guide prepares a public demo; it does not claim that an account, domain, GitHub repository, or deployment has already been created.

## Run the existing checkout on Windows

Open two PowerShell terminals. Dependencies are already installed in this workspace. For a fresh copy, follow the installation steps in the README first.

Backend terminal:

```powershell
cd C:\Users\aarus\Desktop\SICproject\pathforge-ai\backend
.venv/Scripts/python.exe -m alembic upgrade head
.venv/Scripts/python.exe -m app.seed
.venv/Scripts/python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 --no-access-log
```

Frontend terminal:

```powershell
cd C:\Users\aarus\Desktop\SICproject\pathforge-ai\frontend
npm.cmd run dev
```

Open **http://localhost:3000**. API health is **http://localhost:8000/api/v1/health** and interactive API docs are **http://localhost:8000/docs**. Keep both terminals running; Ctrl+C stops each server. Use `npm.cmd` if PowerShell blocks `npm.ps1`. Backend `.env` and frontend `.env.local` instructions are in the README.

## Recommended free public setup

Use **Vercel Hobby for the Next.js frontend** and **Render Free for the FastAPI backend**. You get a public HTTPS website on a provider subdomain; buying a custom domain is optional. Vercel Hobby is for personal/non-commercial projects. See [Vercel Hobby](https://vercel.com/docs/plans/hobby) and [Render Free](https://render.com/docs/free).

This repository currently expects two services. Hosting only the frontend does not start FastAPI. There is no need for Docker, an AI key, a paid database, or persistent student-data storage for this demo.

### 1. Put this repository on GitHub

Create an empty GitHub repository, for example `pathforge-ai`, without initializing another README. From `pathforge-ai/`:

```powershell
git status
git add .
git commit -m "Implement PathForge phases 1 and 2"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/pathforge-ai.git
git push -u origin main
```

Replace the placeholder username. If `origin` already exists, inspect it with `git remote -v` and use the intended repository rather than adding it twice. GitHub may request sign-in. Review `git status` before committing: `.env`, databases, `.venv`, `node_modules`, `.next`, and test artifacts are ignored.

If Git reports **dubious ownership** after switching out of the old sandbox account, this is an ownership check, not evidence of damaged source. Trust only this known project path, then retry:

```powershell
git config --global --add safe.directory C:/Users/aarus/Desktop/SICproject/pathforge-ai
```

These commands assume the repository root contains `frontend/` and `backend/`. If you push the parent `SICproject` folder instead, prefix all hosting root-directory values below with `pathforge-ai/`.

### 2. Deploy the backend on Render

Create a **Web Service**, connect the GitHub repository, and set:

| Setting | Value |
| --- | --- |
| Runtime | Python |
| Branch | `main` |
| Root Directory | `backend` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `bash start.sh` |
| Instance Type | Free |
| Health Check Path | `/api/v1/health` |

Add these environment variables in Render:

```text
PYTHON_VERSION=3.13.2
DATABASE_URL=sqlite:///./pathforge.db
CORS_ORIGINS=["https://YOUR-FRONTEND.vercel.app"]
LOG_LEVEL=INFO
```

`PYTHON_VERSION` pins the interpreter tested locally; Render otherwise uses a newer default. `start.sh` runs migrations and seeds the public catalog before binding to Render's `PORT`. The shell script is only for the Linux host; keep using the Python command for local PowerShell.

Deploy, note the actual backend URL (for example `https://YOUR-BACKEND.onrender.com`), and open `/api/v1/health`. These names are placeholders, not reserved or deployed addresses. See [Render FastAPI setup](https://render.com/docs/deploy-fastapi) and [Python version settings](https://render.com/docs/python-version).

### 3. Deploy the frontend on Vercel

Create a Hobby account, choose **Add New → Project**, import the same repository, and configure:

| Setting | Value |
| --- | --- |
| Framework Preset | Next.js |
| Root Directory | `frontend` |
| Node.js Version | 22.x |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | Keep the Next.js default |

Before deploying, set this public environment variable for Production:

```text
NEXT_PUBLIC_API_URL=https://YOUR-BACKEND.onrender.com
```

Use the actual Render origin with no `/api/v1` suffix; the client adds it. Do not set it to `localhost`. Deploy, copy the stable Production domain from Vercel, and replace the Render `CORS_ORIGINS` value with that **exact origin**, for example `["https://pathforge-ai-example.vercel.app"]`. No trailing slash, paths, or wildcards. Save/redeploy Render as requested by its dashboard.

If you change `NEXT_PUBLIC_API_URL` later, redeploy Vercel: it is compiled into the client bundle. Preview deployment domains differ from Production; either explicitly authorize the preview origin or test on Production. See [Vercel monorepos](https://vercel.com/docs/monorepos) and [environment variables](https://vercel.com/docs/environment-variables).

### 4. Verify the public journey

Open backend health, wait for it to respond, then visit the Vercel URL. Complete onboarding, open SOC Analyst, generate a roadmap, complete one task, refresh, and verify the saved progress. Check at mobile width too. Browser developer tools should show requests to the HTTPS Render URL, not localhost, with no CORS errors.

The Vercel Production URL is a standalone public website you can share in a demo. A custom address such as `your-name.com` is optional and normally involves domain-registration/renewal fees. If you already own one, add it through Vercel's Domains settings and follow the displayed DNS records; also update the backend CORS allowlist. See [Vercel domains](https://vercel.com/docs/domains/working-with-domains).

## Free-tier limitations relevant to this app

Render Free sleeps after 15 minutes without traffic; waking can take about a minute. The app's requests time out after 12 seconds, so the first visit after inactivity can show a retry message. For a scheduled demo, open the backend health URL in advance and wait for it to finish waking, then retry the frontend.

Render's free filesystem is ephemeral, and free services cannot attach persistent disks. This is acceptable here because the only server database is a reproducible public catalog: `start.sh` rebuilds/seeds it after restarts. Student progress is in browser localStorage, not that database. A new browser, cleared storage, changed site origin, or private browsing can lose it. Free Render Postgres expires after 30 days, so this guide does not depend on it. [Render free-service limits](https://render.com/docs/free)

Both providers impose usage limits. This is a free prototype setup, not an always-on production guarantee. Koyeb is another backend option: its official documentation currently lists one free 512 MB web instance per organization, in Frankfurt or Washington, with scale-to-zero after one hour and no persistent volume. It requires its own deployment setup and was not tested here. [Koyeb instance limits](https://www.koyeb.com/docs/reference/instances)

Phase 3 AI, quizzes, and translations remain out of scope. No cloud accounts, credentials, DNS records, or public deployments were changed by this implementation.

## Expert directory storage and administration

The new guidance-expert console requires backend-only `ADMIN_TOKEN` (random, at least 32 characters); see [expert administration](expert-administration.md). Never publish it in frontend environment variables. Expert edits require durable database storage and private backups. The existing free Render ephemeral SQLite setup loses unseeded expert records on filesystem replacement; do not use it as a durable expert directory. Public deployment remains pending.

## Optional learning features

See [Phase 3 configuration and limits](phase3-guide.md). AI is disabled by default and the core needs no key. If enabled, put AI_PROVIDER, AI_MODEL and AI_API_KEY only in backend secrets; keep the request budget low and configure provider quotas. Do not add keys to Vercel frontend public settings. The provider uses durable database quota counters shared across workers; general HTTP/auth-failure limits remain process-local and need shared edge controls before scaling.
