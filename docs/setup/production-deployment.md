# Deploy Produção

## Visão geral

| Componente | Serviço | Free Tier |
|---|---|---|
| API (Go/Gin) | Render | ✅ Web Service + PostgreSQL |
| Banco | Render PostgreSQL | ✅ 256MB, 0.5 CPU |
| PWA | GitHub Pages | ✅ Sem limites de bandwidth |
| Imagens CDN | jsDelivr | ✅ Via GitHub Releases |

## Deploy da API no Render

### 1. Conectar repo ao Render

1. Acesse https://dashboard.render.com
2. Clique em **New** → **Web Service**
3. Conecte sua conta GitHub e selecione `jamile-dev/lets-tarot`
4. O Render detecta o `render.yaml` (Blueprint) automaticamente
5. Em **Environment Variables**, configure o `JWT_SECRET`:
   ```bash
   openssl rand -base64 48
   ```
6. Clique em **Create Web Service**

O Render cria:
- Um banco PostgreSQL gratuito (`lets-tarot-db`)
- Um serviço web (`lets-tarot-api`) com o Dockerfile multi-stage
- O `DATABASE_URL` é injetado automaticamente

### 2. Verificar deploy

```bash
# Substitua pela URL que o Render atribui (ex: https://lets-tarot-api.onrender.com)
API_URL="https://lets-tarot-api.onrender.com"

curl $API_URL/health
# {"status":"ok","service":"lets-tarot-api","timestamp":"..."}

curl $API_URL/api/v1/cards/ar01 | jq '.name_pt'
# "O Mago"
```

### 3. Secrets do GitHub para deploy automático (opcional)

Para deploys automáticos via GitHub Actions, configure estes secrets no repo:
- `RENDER_SERVICE_ID` — ID do serviço Render (ex: `srv-abc123`)
- `RENDER_API_KEY` — API key do Render (https://dashboard.render.com/web/apikeys)

## Deploy do PWA no GitHub Pages

O PWA já está deployado via GitHub Actions (`.github/workflows/pages.yml`).

Para apontar o PWA para a API no Render, configure a variável de ambiente:

1. No repositório GitHub → Settings → Variables → Actions
2. Crie: `VITE_API_URL` = `https://lets-tarot-api.onrender.com`

O workflow `pages.yml` já usa `VITE_API_URL` se definida. Se não definida, o PWA usa o fallback `https://api-lets-tarot.onrender.com`.

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
