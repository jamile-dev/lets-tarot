# Arquitetura do Lets-Tarot 🎴

## Visão geral

**Lets-Tarot** é um sistema de aprendizado de tarot estilo Anki (Spaced Repetition), composto por:

```
┌─────────────────────────────────────────────────────────────┐
│  PWA (Frontend) — React + TS + Vite + Workbox              │
│  GitHub Pages (free forever) · Instalável · Offline-first   │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS + JWT Bearer
┌─────────────────────────▼───────────────────────────────────┐
│  API Go (Gin) — Render/Fly.io free tier                    │
│  JWT Auth · PostgreSQL · SM-2 Spaced Repetition             │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│  PostgreSQL — Supabase (500MB free)                        │
│  Auth incluído (opcional) · Cards seedados (78 cartas)      │
└─────────────────────────────────────────────────────────────┘
```

### Por que Go + Gin?

- **Gin** é o framework Go mais usado (89k+ estrelas no GitHub) — ecossistema maduro, performance alta
- Go binário único, pequeno footprint de memória → ideal para free tiers
- Tipagem forte, compilation checking, excelente para API REST

### Por que Supabase?

- Free tier: 500MB PostgreSQL + Auth + Storage
- Auth incluso (email+password) — pode usar nosso JWT ou o nativo
- Escolhemos usar **nosso próprio JWT** (bcrypt no PostgreSQL) para controle total e simplicidade
- Caso queira, pode trocar para Supabase Auth nativo com pequena adaptação

### Por que PWA + GitHub Pages?

- **PWA**: instalável em qualquer dispositivo (mobile, desktop), trabalha offline via Service Worker, persistent memory via IndexedDB/localStorage
- **GitHub Pages**: free forever, sem limite de bandwidth, deploy automático via GitHub Actions
- **Workbox**: cache estratégico — imagens do CDN em cache_first, API responses em network_first com fallback

---

## Diagrama de contexto

```
┌────────────┐     HTTPS/JWT      ┌─────────────┐     SQL      ┌────────────┐
│   Usuário  │ ◄─────────────────►│     PWA     │◄────────────►│  PostgreSQL│
│  (navegador)│                    │ (React PWA) │              │ (Supabase) │
└────────────┘                     └──────┬──────┘              └────────────┘
                                           │
                                   CDN (jsDelivr)
                                   imagens cards
```

---

## Decisões de design

1. **Spaced Repetition SM-2 completo** ( igual Anki): rating 1-5, ease factor ajustável, intervalo máximo 3650 dias
2. **JWT próprio** (não Supabase Auth): controle total, sem lock-in, código pequeno
3. **CDN para imagens**: jsDelivr via GitHub Releases — a API nunca serve imagens, menor superfície de ataque
4. **PWA como único frontend**: um codebase, qualquer dispositivo, offline-first
5. **Tudo em português (pt-BR)**: cards, significados, descrições, UI

---

## Segurança

- JWT com expiração de 24h, assinado com HS256
- Senhas com bcrypt (cost factor default)
- CORS restrito ao CLIENT_URL
- SQL parameterization (pgx/Go stdlib) contra injeção
- Imagens servidas via CDN — a API nunca toca nos bytes das imagens
