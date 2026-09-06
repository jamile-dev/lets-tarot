# ADR-001: Algoritmo de Repetição Espaçada SM-2

**Data:** 2026-09-05  
**Decisão:** Usar SM-2 (o algoritmo original do Anki/SuperMemo) para cálculo de intervalos de revisão de cartas de tarot.

## Contexto

O sistema precisa decidir quando mostrar cada carta novamente para otimizar a retenção. O usuário avalia cada carta de 1 a 5 (Anki-style) após tentar lembrar do significado.

## Alternativas consideradas

1. **SM-2 completo** (escolhida): implementação fiel do algoritmo original, com ease factor, intervalos exponenciais
2. **Escalas fixas simples**: rating 1-5 mapeia para intervalos fixos (1d, 3d, 7d, 14d, 30d) sem ajuste de ease — mais simples mas menos eficaz
3. **FSRS** (Free Spaced Repetition Scheduler): algoritmo moderno, mais complexo, requer mais dados iniciais

## Decisão

SM-2 completo porque:
- É o algoritmo que a maioria dos usuários já conhece (Anki)
- Implementação relativamente simples (~30 linhas)
- Não requer dados históricos complexos para funcionar bem
- Fácil de ajustar e depurar

## Consequências

- Cada review resulta em: novo intervalo (dias), novo ease factor (≥1.3), próxima data de review
- Ratings 1-2 resetam para 1 dia
- Rating 3: intervalo × ease
- Rating 4: intervalo × ease × 1.2
- Rating 5: intervalo × ease × 1.5
- Ease factor: `ease += 0.1 - (5 - rating) × (0.08 + (5 - rating) × 0.02)`, mínimo 1.3
- Intervalo máximo: 3650 dias (10 anos)

## Status

Aprovado. Implementado em `api/internal/services/spaced_repetition.go` e utilizado em `CreateReview` handler.
