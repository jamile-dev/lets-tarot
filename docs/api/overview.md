# API Reference

Base URL: `https://api.llets-tarot.dev/api/v1` (production)  
Local dev: `http://localhost:8080/api/v1`

All responses are JSON. Authentication via `Authorization: Bearer <jwt>` header.

## Public endpoints (no auth)

### Health
```
GET /health
→ { "status": "ok", "service": "lets-tarot-api", "timestamp": "2026-09-05T..." }
```

### Cards

```
GET /api/v1/cards
→ { "cards": [ {id, name_pt, name_short, type, suit, value_int, meaning_up_pt, meaning_rev_pt, desc_pt, image_url}, ... ], "count": 78 }
```

Returns all 78 tarot cards ordered by major then minor, value, suit.

```
GET /api/v1/cards/:id
→ single card object, or 404 { "error": "card not found" }
```

Examples: `ar01` (O Mago), `cp02` (Dois de Copas), `sp10` (Dez de Espadas).

```
GET /api/v1/cards/random?n=5
→ { "cards": [ ... ], "count": 5 }
```

Optional `n` parameter (1-78, default 1).

```
GET /api/v1/cards/search?q=amor
→ { "cards": [...], "count": N, "query": "amor" }
```

Case-insensitive search on name, meaning_up, meaning_rev, desc.

```
GET /api/v1/cards/major
→ { "cards": [22 major arcana], "count": 22 }

GET /api/v1/cards/minor
→ { "cards": [56 minor arcana], "count": 56 }
```

### Suits
```
GET /api/v1/suits
→ { "suits": [ {name_en: "wands", name_pt: "Paus"}, {name_en: "cups", name_pt: "Copas"}, {name_en: "swords", name_pt: "Espadas"}, {name_en: "pentacles", name_pt: "Ouros"} ] }
```

## Authentication

### Register
```
POST /api/v1/auth/register
Body: { "email": "user@example.com", "password": "min-8-chars" }
→ { "user": { "id": "uuid", "email": "...", "created_at": "..." }, "token": "jwt..." }
```

Password minimum 8 characters. Returns 409 if email already exists.

### Login
```
POST /api/v1/auth/login
Body: { "email": "user@example.com", "password": "..." }
→ { "user": { "id": "uuid", "email": "...", "created_at": "..." }, "token": "jwt..." }
```

Returns 401 on invalid credentials.

### Current user
```
GET /api/v1/auth/me
→ { "id": "uuid", "email": "...", "created_at": "..." }
```

Requires valid JWT.

## Protected endpoints (JWT required)

### Decks

```
GET /api/v1/users/me/decks
→ { "decks": [ {id, user_id, name, description, is_default, created_at, updated_at}, ... ] }
```

```
POST /api/v1/users/me/decks
Body: { "name": "Meu Baralho", "description": "optional" }
→ { "id": "uuid", "user_id": "uuid", "name": "...", "description": "...", "is_default": false, "created_at": "..." }
```

```
GET /api/v1/users/me/decks/:id
→ { "deck": { deck }, "cards": [ {card}, ... ] }
```

Returns 404 if deck not found or not owned by user.

```
PUT /api/v1/users/me/decks/:id
Body: { "name": "New Name", "description": "optional" }
→ updated deck object
```

```
DELETE /api/v1/users/me/decks/:id
→ 204 No Content
```

Returns 403 if trying to delete another user's deck.

```
POST /api/v1/users/me/decks/:id/cards
Body: { "card_id": "ar01" }
→ 201 Created
```

Adds card to deck. Duplicate card IDs are ignored (ON CONFLICT DO NOTHING).

```
DELETE /api/v1/users/me/decks/:id/cards/:cardId
→ 204 No Content
```

```
GET /api/v1/users/me/decks/:id/cards
→ { "cards": [ {card}, ... ] }
```

### Reviews (Spaced Repetition)

```
GET /api/v1/users/me/reviews
→ { "reviews": [ {card: {card}, rating, notes, reviewed_at, next_review_at, interval_days, ease_factor, deck_id}, ... ] }
```

Returns last 100 reviews.

```
POST /api/v1/users/me/reviews
Body: { "card_id": "ar01", "rating": 4, "notes": "optional", "deck_id": "uuid" }
→ { "review": { ... } }
```

Applies SM-2 algorithm to calculate next review interval.

Rating scale:
- 1: complete blackout (didn't remember)
- 2: wrong answer
- 3: correct with difficulty
- 4: correct with hesitation
- 5: perfect response

```
GET /api/v1/users/me/reviews/due?deck_id=uuid&limit=50
→ { "reviews": [ {card: {card}, rating, notes, reviewed_at, next_review_at, interval_days, ease_factor, deck_id}, ... ], "count": N }
```

Returns cards where `next_review_at <= NOW()`.

```
GET /api/v1/users/me/reviews/history?limit=100&offset=0
→ { "reviews": [...], "count": N }
```

Paginated review history.

### Statistics
```
GET /api/v1/users/me/stats
→ {
    "total_reviews": 150,
    "due_today": 12,
    "reviews_today": 8,
    "current_streak": 5,
    "cards_learnt": 45,
    "average_rating": 3.8
  }
```

## Card object

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

## Review object

```json
{
  "card": { "id": "ar01", "name_pt": "O Mago", ... },
  "rating": 4,
  "notes": "Lembrei quase tudo",
  "reviewed_at": "2026-09-05T12:00:00Z",
  "next_review_at": "2026-09-08T12:00:00Z",
  "interval_days": 3,
  "ease_factor": 2.55,
  "deck_id": "uuid"
}
```

## Error responses

```json
{ "error": "descriptive message" }
```

HTTP status codes: 400 (bad request), 401 (auth required/invalid), 403 (forbidden), 404 (not found), 409 (conflict/email exists), 500 (server error).
