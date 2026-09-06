# ADR-002: Autenticação JWT com PostgreSQL

**Data:** 2026-09-05  
**Decisão:** Usar JWT HTTP Bearer com assinatura HS256, armazenando hash de senha em PostgreSQL via bcrypt, sem usar o Supabase Auth nativo.

## Contexto

Precisamos de autenticação para que os usuários possam salvar baralhos e histórico de revisões. O Supabase oferece Auth pronto, mas impõe lock-in e requer SDK específico.

## Alternativas

1. **Supabase Auth nativo**: mais rápido para começar, mas lock-in e complexidade de SDK
2. **JWT próprio com PostgreSQL + bcrypt** (escolhida): controle total, sem dependência externa de auth, código pequeno (~50 linhas)
3. **OAuth social apenas**: simplifica registro mas exclui usuários sem conta Google/GitHub

## Decisão

JWT próprio porque:
- Controle total sobre ciclo de vida do token
- Sem dependência de terceiro para auth (apenas PostgreSQL)
- Código de auth < 100 linhas total
- Fácil de adicionar OAuth depois se quiser
- JWT é padrão da indústria, fácil de validar em qualquer cliente

## Consequências

- Endpoint `POST /api/v1/auth/register` cria user com `bcrypt(password)`
- Endpoint `POST /api/v1/auth/login` retorna JWT com 24h de validade
- Middleware `AuthRequired` verifica JWT em todas as rotas protegidas
- Token armazenado no `localStorage` da PWA (escopo limitado, XSS-safe para nosso caso)
- Refresh token não implementado inicialmente — usuário faz login novamente após expiração
- JWT secret deve ser mantido secreto e ter pelo menos 32 caracteres

## Status

Aprovado. Implementado em `api/internal/middleware/auth.go` e `api/internal/handlers/handlers.go`.
