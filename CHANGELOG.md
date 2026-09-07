# Changelog

Todas as alterações notáveis do Lets-Tarot serão documentadas aqui.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/0.3.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-br/).

## [0.1.0] - 2026-09-06

### Adicionado

- **API Go/Gin** com PostgreSQL, JWT auth (bcrypt), e SM-2 completo
- **Frontend React/TypeScript/Vite PWA** com Workbox offline
- **74 cartas Rider-Waite-Smith** (TaionWC deck, domínio público) com significados em pt-BR
- **74 imagens de cartas** via jsDelivr CDN (Wikimedia Commons scans, CC0/PD)
- Endpoints públicos:
  - `GET /api/v1/cards` — lista todas as cartas
  - `GET /api/v1/cards/:id` — carta por ID
  - `GET /api/v1/cards/random?n=3` — cartas aleatórias
  - `GET /api/v1/cards/search?q=olod` — busca por texto
  - `GET /api/v1/cards/major` — arcanos maiores
  - `GET /api/v1/cards/minor` — arcanos menores
  - `GET /api/v1/suits` — naipes
- Endpoints autenticados:
  - `POST /api/v1/auth/register` — registro com bcrypt
  - `POST /api/v1/auth/login` — login com JWT
  - `GET /api/v1/auth/me` — usuário atual
  - `POST /api/v1/auth/refresh` — refresh de token
  - `GET/POST /api/v1/users/me/decks` — listagem + criação de baralhos
  - `GET/PUT/DELETE /api/v1/users/me/decks/:id` — CRUD de baralho
  - `POST /api/v1/users/me/decks/:id/cards` — adicionar carta ao baralho
  - `DELETE /api/v1/users/me/decks/:id/cards/:cardId` — remover carta do baralho
  - `GET /api/v1/users/me/decks/:id/cards` — cartas do baralho
  - `POST /api/v1/users/me/reviews` — registrar revisão (SM-2)
  - `GET /api/v1/users/me/reviews/due` — cartas atrasadas
  - `GET /api/v1/users/me/reviews/history` — histórico de revisões
  - `GET /api/v1/users/me/stats` — estatísticas (total, due, hoje, streak, cards aprendidos, média)
- **22 arcanos maiores** + **52 arcanos menores** (copas, espadas, ouros, paus) + court cards
- Repetição espaçada **SM-2 completo** (ease factor, intervalos, streak)
- **PWA**: manifest, service worker com CacheFirst (imagens) + NetworkFirst (API), icons SVG 192/512
- **Design neobrutalism**: dark theme (#0D0D2B, #FF006E pink), fontes Archivo + Space Mono
- **CI/CD**: GitHub Actions (ci.yml, release.yml)
- **Docker**: Dockerfile multi-stage + docker-compose.yml
- **Documentação**: README, arquitetura, ADRs, setup guides, Makefile, .env.example
- **Testes**: Go unitários (SM-2, handlers) + testes integrados com PostgreSQL real

### Corrigido

- **Auth middleware**: user_id armazenado como uuid.UUID (era string) — eliminou TypeAssertionError
- **Refresh token**: rota /api/v1/auth/refresh registrada + handler RefreshToken + ValidateToken
- **Deck cards**: AddCardToDeck/RemoveCardFromDeck usam string (card_id não é UUID)
- **Login**: validação email removida — retorna 401 se não encontrar (era 400)
- **Cards**: 74 cartas únicas (TaionWC deck), duplicatas removidas, IDs alinhados às imagens Wikimedia
- **PWA**: manifest corrigido para usar SVG icons (era PNG inexistente)
- **cards.go**: check de seed ajustado para 74 cartas (TaionWC deck tem 22+52=74)

### Infraestrutura

- **Repo público**: github.com/jamile-dev/lets-tarot
- **Release v0.1.0** com imagens para jsDelivr CDN
- **PostgreSQL** via Docker para desenvolvimento
