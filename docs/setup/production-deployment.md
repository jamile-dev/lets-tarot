# Deploy Produção

## Visão geral

| Componente | Serviço | Free Tier |
|---|---|---|
| API (Go/Gin) | Render | ✅ Web Service + PostgreSQL |
| Banco | Render PostgreSQL | ✅ 256MB, 0.5 CPU |
| PWA | GitHub Pages + Vercel | ✅ Sem limites de bandwidth |
| Imagens CDN | jsDelivr | ✅ Via GitHub Releases |

## Deploy da API no Render

### 1. Conectar repo ao Render

1. Acesse https://dashboard.render.com
2. Clique em **New** → **Web Service**
3. Conecte sua conta GitHub e selecione `jamile-dev/lets-tarot`
4. O Render detecta o `Dockerfile` na raiz automaticamente
5. Em **Environment Variables**, configure:
   - `DATABASE_URL` — conexão interna do PostgreSQL do Render
   - `JWT_SECRET` — gere com `openssl rand -base64 48`
   - `CLIENT_URL` — URL da PWA (`https://lets-tarot-bo30kyzsm-jamile-devs-projects.vercel.app`)
   - `CDN_BASE_URL` — `https://cdn.jsdelivr.net/gh/jamile-dev/lets-tarot@v0.1.0/cards`
   - `PORT` — `8080`

```bash
# Criar serviço via CLI
render services create \
  --name lets-tarot-api \
  --type web \
  --runtime docker \
  --dockerfile-path Dockerfile \
  --auto-deploy \
  --branch main \
  --repo https://github.com/jamile-dev/lets-tarot \
  --plan free

# Criar banco de dados PostgreSQL
render postgres create --name lets-tarot-db --plan free

# Obter connection string
render pg get dpg-dafipqvqj5pc73fh11r0-a --include-sensitive-connection-info --output json

# Atualizar DATABASE_URL (usar internalConnectionString)
# Ver: https://api.render.com/v1/services/<service-id>/env-vars
```

### 2. Verificar deploy

```bash
# API: https://lets-tarot-api.onrender.com
curl https://lets-tarot-api.onrender.com/health
# {"status":"ok","service":"lets-tarot-api","timestamp":"..."}

curl https://lets-tarot-api.onrender.com/api/v1/cards/ar01 | jq '.name_pt'
# "O Mago"

curl https://lets-tarot-api.onrender.com/api/v1/cards | jq '.cards | length'
# 74
```

### 3. Env vars críticas no Render

| Variável | Valor | Observação |
|---|---|---|
| `DATABASE_URL` | `postgres://...@internal-host/db?sslmode=disable` | Use internalConnectionString do Render PostgreSQL |
| `JWT_SECRET` | `openssl rand -base64 48` | Mínimo 32 chars |
| `CLIENT_URL` | `https://lets-tarot-bo30kyzsm-jamile-devs-projects.vercel.app` | PWA Vercel URL |
| `CDN_BASE_URL` | `https://cdn.jsdelivr.net/gh/jamile-dev/lets-tarot@v0.1.0/cards` | Imagens das cartas |
| `PORT` | `8080` | Porta do container |

### 4. Notas sobre conexão DB

O `lib/pq` driver tenta `sslmode=require` primeiro, e faill-back automático para `sslmode=disable` se a conexão interna do Render não suportar SSL. A conexão interna (`dpg-...`) funciona sem porta explicitamente (porta 5432 default) e sem SSL (rede interna do Render).

## Deploy do PWA no GitHub Pages

O PWA já está deployado via GitHub Actions (`.github/workflows/pages.yml`).
Para apontar o PWA para a API no Render, configure a variável de ambiente:

1. No repositório GitHub → Settings → Variables → Actions
2. Crie: `VITE_API_URL` = `https://lets-tarot-api.onrender.com`

O workflow `pages.yml` já usa `VITE_API_URL` se definida, senão usa o fallback `https://lets-tarot-api.onrender.com`.

## Deploy do PWA no Vercel

O PWA também está deployado no Vercel para hot reload e preview branches:
- **URL**: `https://lets-tarot-bo30kyzsm-jamile-devs-projects.vercel.app`
- **Build**: `cd web && npm ci --legacy-peer-deps && npm run build`
- **Output**: `web/dist`
- **Env**: `VITE_API_URL=https://lets-tarot-api.onrender.com` (via `web/.env.local`)

## Arquitetura final (produção)

```
┌──────────────────┐ HTTP/HTTPS   ┌────────────────────┐   PostgreSQL   ┌──────────────┐
│  PWA (GitHub     │◄────────────►│  API Go/Gin        │◄──────────────►│  Render      │
│  Pages)          │              │  (Render free)     │                │  PostgreSQL  │
│  lets-tarot.app  │              │  lets-tarot-api.app│                │  lets-tarot-db│
└──────────────────┘              └────────────────────┘                └──────────────┘
       │                              ▲
       │ PWA Manifest, SW             │ CDN (jsDelivr)
       ▼                              ▼
  Offline-first                    Card images
  (Workbox cache)                  (GitHub Releases @v0.1.0)
```

## Variáveis de ambiente (Render)

| Variável | Obrigatório | Descrição |
|---|---|---|
| `DATABASE_URL` | ✅ | Injetado pelo Render (do banco PostgreSQL) |
| `JWT_SECRET` | ✅ | Gere com `openssl rand -base64 48` (mín 32 chars) |
| `CLIENT_URL` | ✅ | `https://jamile-dev.github.io` |
| `PORT` | Não | Default: `8080` |
| `CDN_BASE_URL` | Não | Default: jsDelivr `@v0.1.0` |

## Health check e monitoramento

O Render faz health check automático no path `/health`:
```json
{"status":"ok","service":"lets-tarot-api","timestamp":"2026-09-07T..."}
```

Verifique logs no dashboard do Render → seu serviço → Logs.
