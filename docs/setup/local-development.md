# docs/setup/local-development.md

# Desenvolvimento Local

## Pré-requisitos

- Go 1.22+
- Node.js 18+ (para PWA)
- PostgreSQL rodando localmente (ou Docker)

## Configuração rápida

### 1. Clone o repositório

```bash
git clone https://github.com/jamile-dev/lets-tarot.git
cd lets-tarot
```

### 2. API

```bash
cd api

# Copie e edite o .env
cp .env.example .env
# Edite DATABASE_URL, JWT_SECRET, CLIENT_URL

# Baixe dependências e rode
go mod download
go run cmd/server/main.go
```

A API inicia em `http://localhost:8080`.

### 3. PWA

```bash
cd web

npm install
npm run dev
```

O frontend desenvolve em `http://localhost:5173`.

### 4. Variáveis de ambiente

| Variável | Valor de desenvolvimento |
|----------|--------------------------|
| `DATABASE_URL` | `postgres://postgres:***@localhost:5432/lets_tarot` |
| `JWT_SECRET` | `dev-secret-change-in-production-min-32-chars!!` |
| `CLIENT_URL` | `http://localhost:5173` |

### 5. Dados de teste

Os cards são seedados automaticamente na primeira execução (tabela `cards` vazia). Para re-seedar:

```sql
TRUNCATE cards RESTART IDENTITY CASCADE;
```

E reinicie a API.

## Docker (alternativa)

```bash
# Suba PostgreSQL
docker run --name lets-tarot-db -e POSTGRES_PASSWORD=*** -p 5432:5432 -d postgres:16

# Rode a API
cd api
go run cmd/server/main.go
```

Ou use docker-compose (ver `docker-compose.yml` na raiz).

## Testes manuais

### Health check
```bash
curl http://localhost:8080/health
```

### Cards
```bash
curl http://localhost:8080/api/v1/cards | jq '.count'
curl http://localhost:8080/api/v1/cards/ar01 | jq '.name_pt'
```

### Busca
```bash
curl "http://localhost:8080/api/v1/cards/search?q=amor" | jq
```

### Auth
```bash
# Registro
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@email.com","password": "senha123"}'

# Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@email.com","password": "senha123"}'
```

Salve o token retornado e use em chamadas protegidas:
```bash
TOKEN="eyJhbGci..."

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/v1/users/me/decks
```

## PWA em desenvolvimento

```bash
cd web
npm run dev
# Abra http://localhost:5173
```

Para testar o Service Worker com cache offline:
1. Abra a PWA no navegador
2. Faça login
3. Vá para a biblioteca e carregue as cartas
4. Desconecte a internet (ou use o modo offline do DevTools)
5. As cartas devem continuar carregadas (cache do Workbox)

## Debug

### Logs da API
A API usa `log.Printf` para logs.

### PostgreSQL
```bash
psql $DATABASE_URL

# Ver cards
SELECT id, name_pt, type FROM cards ORDER BY id LIMIT 5;

# Ver users
SELECT id, email, created_at FROM users;

# Ver reviews
SELECT card_id, rating, next_review_at FROM reviews ORDER BY reviewed_at DESC LIMIT 10;
```

### PWA DevTools
- Application tab → Service Workers → verificar status
- Application tab → Cache Storage → ver cache de imagens e API
- Network tab → ver requests
- Console → mensagens de error ou info
