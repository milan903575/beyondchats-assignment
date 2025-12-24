
# BeyondChats Assignment (Phase 1–3)

Full-stack project:

- Laravel (CRUD APIs + MySQL)
- Node.js workers (scrape + Google + LLM rewrite)
- React frontend (display original + rewritten articles)


### Repo Structure

- `backend/` — Laravel API + DB migrations
- `worker/` — Node scripts (Phase 1 scrape, Phase 2 rewrite)
- `frontend/` — React UI (Phase 3)

***

## Prerequisites

- PHP 8.2+
- Composer
- MySQL (XAMPP ok)
- Node.js 18+ (you are using Node 22)
- Serper.dev API Key (Google Search API)
- OpenAI API Key

***

## Phase 1: Scrape + Store + CRUD API (Laravel)

### Setup backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```


### Important: CSRF fix for API (Laravel 11+)

In `backend/bootstrap/app.php`, CSRF is excluded for `api/*` so the worker can POST.

### Run Phase 1 scraper

```bash
cd worker
npm install
node scrape-beyondchats.js
```


### Test API

- GET: http://127.0.0.1:8000/api/articles

***

## Phase 2: Google search + scrape references + LLM rewrite + publish

### Setup worker environment

Create `worker/.env`:

```env
SERPER_API_KEY=YOUR_SERPER_KEY
OPENAI_API_KEY=YOUR_OPENAI_KEY
LARAVEL_API=http://127.0.0.1:8000/api/articles
```


### Run Phase 2

```bash
cd worker
node phase2-rewrite.js
```

This:

1. Fetches latest ORIGINAL article from Laravel
2. Searches Google via Serper.dev
3. Scrapes top 2 reference blogs
4. Calls OpenAI to rewrite (HTML)
5. Publishes rewritten article via Laravel API
6. Appends references at bottom

***

## Phase 3: React Frontend

```bash
cd frontend
npm install
npm start
```

React UI:

- Lists all articles
- Filter: All / Original / Rewritten
- Shows title, date, preview, and reference count for rewritten

***

## Notes

- If Serper returns no results for a title, run Phase 2 again or choose a different original article.
- CRA may show npm audit warnings; not required for this assignment.

***

## Final checklist (do these now)

1. From root, confirm these run:
    - `backend`: `php artisan serve`
    - `worker`: `node scrape-beyondchats.js`
    - `worker`: `node phase2-rewrite.js`
    - `frontend`: `npm start`
2. Open and verify:
    - http://127.0.0.1:8000/api/articles
    - http://localhost:3000

***



