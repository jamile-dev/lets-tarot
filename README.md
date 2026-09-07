# Lets-Tarot 🎴

|> Anki-style tarot learning system — Go API + PWA, neobrutalism design, full SM-2 spaced repetition, pt-BR. Offline-first PWA deployed on GitHub Pages.</p>
|
[![Deploy on Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/jamile-dev/lets-tarot)


## Overview

**Lets-Tarot** helps you learn tarot cards through spaced repetition, like Anki but for tarot. The API serves 74 Rider-Waite-Smith cards (22 Major + 52 Minor Arcana, TaionWC deck) with meanings in Portuguese, and the PWA lets you study decks, track your progress, and review cards due for revision — all offline-capable.

## Architecture

```
┌─────────────┐     HTTPS     ┌─────────────────┐     SQL     ┌────────────┐
│  PWA (React)│ ◄────────────► │  Go API (Gin)   │ ◄──────────► │ PostgreSQL │
│  GitHub Pages│               │  Render/Fly.io   │              │ Supabase   │
│  (free)     │               │  (free tier)     │              │ (free 500MB)│
└─────────────┘               └─────────────────┘              └────────────┘
     ↑                               ↑
     │ PWA manifest + SW              │ CDN (jsDelivr)
     │ Workbox offline                │ card images
     └───────────────────────────────┘
```

## Quick Start

### Prerequisites

- Go 1.26+
- Node 18+ (for PWA)
- A Supabase project (free tier) with PostgreSQL

### API Setup

```bash
cd api

# Copy env template
cp .env.example .env

# Edit .env with your values
# DATABASE_URL=postgresql://...
# JWT_SECRET=your-secret-min-32-chars
# CLIENT_URL=http://localhost:5173

# Install dependencies
go mod download

# Run migrations + seed cards + start server
go run cmd/server/main.go
```

API starts on `http://localhost:8080`. Health check:

```bash
curl http://localhost:8080/health
# {"status":"ok","service":"lets-tarot-api","timestamp":"..."}
```

### PWA Setup

```bash
cd web

npm install
npm run dev        # dev server on localhost:5173
npm run build      # production build to dist/
```

## API Reference

### Public endpoints (no auth)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check |
|| GET | `/api/v1/cards` | All 74 cards (pt-BR) |
|| GET | `/api/v1/cards/:id` | Single card by ID (ex: `ar01`, `cp02`, `sp10`) |
|| GET | `/api/v1/cards/random?n=5` | N random cards (max 74) |
|| GET | `/api/v1/cards/search?q=amor` | Search by name/meaning/description |
|| GET | `/api/v1/cards/major` | Only 22 Major Arcana |
|| GET | `/api/v1/cards/minor` | Only 52 Minor Arcana |
| GET | `/api/v1/suits` | List suits (Paus, Copas, Espadas, Ouros) |

### Auth endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Register with email+password |
| POST | `/api/v1/auth/login` | Login, returns JWT |
| GET | `/api/v1/auth/me` | Current user (auth required) |

### Protected endpoints (JWT required)

Header: `Authorization: Bearer <token>`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/users/me/decks` | User's decks |
| POST | `/api/v1/users/me/decks` | Create deck |
| GET | `/api/v1/users/me/decks/:id` | Deck with cards |
| PUT | `/api/v1/users/me/decks/:id` | Update deck |
| DELETE | `/api/v1/users/me/decks/:id` | Delete deck |
| POST | `/api/v1/users/me/decks/:id/cards` | Add card to deck |
| DELETE | `/api/v1/users/me/decks/:id/cards/:cardId` | Remove card |
| GET | `/api/v1/users/me/decks/:id/cards` | Deck's cards |
| GET | `/api/v1/users/me/reviews` | Review history |
| POST | `/api/v1/users/me/reviews` | Log a review (SM-2) |
| GET | `/api/v1/users/me/reviews/due` | Cards due for review |
| GET | `/api/v1/users/me/reviews/history` | Paginated review history |
| GET | `/api/v1/users/me/stats` | Stats (streak, due, total) |

### Card object

```json
{
  "id": "ar01",
  "name_pt": "O Mago",
  "name_short": "ar01",
  "type": "major",
  "suit": null,
  "value_int": 1,
  "meaning_up_pt": "Habilidade, diplomacia, iniciativa...",
  "meaning_rev_pt": "Falsidade, manipulação...",
  "desc_pt": "Um jovem mago com olhos brilhantes...",
  "image_url": "https://cdn.jsdelivr.net/gh/jamile-dev/lets-tarot@v0.1.0/cards/ar01.jpg"
}
```

### Review object

```json
{
  "card": { /* Card object */ },
  "rating": 4,
  "notes": "Lembra o significado de iniciativa",
  "reviewed_at": "2026-09-05T12:00:00Z",
  "next_review_at": "2026-09-08T12:00:00Z",
  "interval_days": 3,
  "ease_factor": 2.55,
  "deck_id": "uuid"
}
```

## Spaced Repetition (SM-2)

Fully implemented Anki-style SM-2 algorithm:

- **Rating 1-2**: Reset interval to 1 day (failed)
- **Rating 3**: `interval × ease` (correct with difficulty)
- **Rating 4**: `interval × ease × 1.2` (correct with hesitation)
- **Rating 5**: `interval × ease × 1.5` (perfect response)
- **Ease adjustment**: `ease += 0.1 - (5 - rating) × (0.08 + (5 - rating) × 0.02)` — minimum 1.3
- Maximum interval: 3650 days (10 years)

For new cards (no previous review), first interval is: 1d (rating ≤3), 3d (rating 4), 7d (rating 5).

## Tech Stack

- **Backend**: Go 1.26 + Gin + PostgreSQL + JWT auth
- **Frontend**: React 18 + Vite + TypeScript + Workbox (PWA)
- **Design**: Neobrutalism (bold borders, high contrast, playful)
- **CDN**: jsDelivr via GitHub Releases for card images
- **Database**: Supabase (PostgreSQL 500MB free tier + Auth)
- **Hosting**: Render/Fly.io (API) + GitHub Pages (PWA)
- **CI/CD**: GitHub Actions

## Project Structure

```
lets-tarot/
├── api/                    # Go backend
│   ├── cmd/server/main.go  # Entry point
│   ├── internal/
│   │   ├── config/         # Environment config
│   │   ├── database/       # PostgreSQL + migrations + queries
│   │   ├── handlers/       # HTTP handlers (cards, auth, decks, reviews)
│   │   ├── middleware/     # Logger, CORS, JWT auth
│   │   ├── models/         # Domain structs + 74 card data (pt-BR)
│   │   └── services/       # SM-2 spaced repetition logic
│   ├── migrations/         # SQL migrations
│   └── go.mod
│
├── web/                    # PWA frontend
│   ├── public/             # manifest.json, icons, static assets
│   └── src/
│       ├── components/     # Card flip, DeckSelector, StudySession...
│       ├── hooks/          # useAuth, useCards, useReviews...
│       ├── pages/          # Study, Library, Login, Stats...
│       ├── services/       # API client
│       └── styles/         # Neobrutalism CSS
│
├── docs/                   # Documentation as code
│   ├── architecture/       # ADRs, sequence diagrams, system overview
│   ├── api/                # OpenAPI spec, endpoint documentation
│   └── setup/              # Deployment guides, local dev
│
├── .github/workflows/      # CI/CD pipelines
└── README.md
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (Supabase) |
| `JWT_SECRET` | Yes | Secret key for JWT signing (min 32 chars) |
| `CLIENT_URL` | No | Frontend URL for CORS (default: `http://localhost:5173`) |
| `PORT` | No | Server port (default: `8080`) |

## Deployment

### Deploy the API (one-click)
Click the **Deploy to Render** button at the top of this README. Render reads `render.yaml`, creates a free PostgreSQL database, builds the Docker image, and deploys the API automatically. Set `JWT_SECRET` in the Render dashboard (generate with `openssl rand -base64 48`).

### Deploy the PWA
PWA is auto-deployed to GitHub Pages on every push to `main` via `.github/workflows/pages.yml`. To point it at your deployed API, set `VITE_API_URL` as a GitHub repo variable:
- Settings → Variables → Actions → New repository variable
- Name: `VITE_API_URL` → Value: `https://lets-tarot-api.onrender.com` (your Render URL)

### Free Hosting Options

| Component | Recommended | Alternative |
|---|---|---|
| Go API | Render (free web service via `render.yaml`) | Fly.io (free allowance) |
| Database | Render PostgreSQL (free tier) | Neon (500MB) |
| PWA | GitHub Pages | Netlify |
| Card Images | jsDelivr (GitHub Releases) | Cloudflare R2 (free 10GB) |

## License

MIT — see [LICENSE](LICENSE).

## Contributing

Issues and PRs welcome. See [docs/architecture/adr/](docs/architecture/adr/) for architecture decisions.

---

**Made with 🎴 by jamile-dev**
