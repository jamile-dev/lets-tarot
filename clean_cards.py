#!/usr/bin/env python3
"""Remove duplicate tarot card entries from cards.go — keeps first occurrence of each ID."""
import re, sys

path = "/Users/jamilebastos/lets-tarot/api/internal/models/cards.go"
with open(path, encoding="utf-8") as f:
    content = f.read()

lines = content.split("\n")

# Identify card blocks: start with a line ending in '{' at the card indentation,
# end with the matching '}' at same indentation.
# Simpler: find all lines with ID: and track brace depth from there.

entries = []          # (start_idx, end_idx, card_id)
i = 0
while i < len(lines):
    line = lines[i]
    # Look for card start: line that is just '{'
    if line.strip() == "{" and line.startswith("\t\t\t"):
        # Find ID in the next few lines
        card_id = None
        j = i + 1
        while j < len(lines) and j < i + 30:
            m = re.search(r'ID:\s+"([^"]+)"', lines[j])
            if m:
                card_id = m.group(1)
                break
            j += 1
        if card_id:
            # Find the closing brace by tracking brace depth
            depth = 1
            k = i + 1
            while k < len(lines) and depth > 0:
                depth += lines[k].count("{") - lines[k].count("}")
                if depth == 0:
                    entries.append((i, k, card_id))
                    i = k + 1
                    break
                k += 1
            continue
    i += 1

print(f"Cartas identificadas: {len(entries)}", file=sys.stderr)

# Determinar quais remover (segunda ocorrência de cada ID)
seen = set()
to_remove = []   # linhas a remover
for start, end, cid in entries:
    if cid in seen:
        to_remove.append((start, end))
    else:
        seen.add(cid)

print(f"IDs únicos: {len(seen)}", file=sys.stderr)
print(f"Duplicatas: {len(to_remove)}", file=sys.stderr)
for s, e in to_remove:
    cid = re.search(r'ID:\s+"([^"]+)"', "\n".join(lines[s:e+1])).group(1)
    print(f"  Removendo: {cid} (linhas {s+1}-{e+1})", file=sys.stderr)

# Construir novo conteúdo
remove_set = set()
for s, e in to_remove:
    for idx in range(s, e + 1):
        remove_set.add(idx)

new_lines = [ln for idx, ln in enumerate(lines) if idx not in remove_set]

# Ajustar comentários e check para 74
new_content = "\n".join(new_lines)
new_content = new_content.replace(
    "// Ensure exactly 78 cards",
    "// Ensure exactly 74 cards (RWS TaionWC deck)",
)
new_content = new_content.replace(
    'panic(fmt.Sprintf("Expected 78 cards, got %d", len(cards)))',
    'panic(fmt.Sprintf("Expected 74 cards (RWS TaionWC deck), got %d", len(cards)))',
)
new_content = new_content.replace(
    "// DefaultCards returns all 78 Rider-Waite-Smith tarot cards with pt-BR meanings",
    "// DefaultCards returns all 74 Rider-Waite-Smith tarot cards (TaionWC deck) with pt-BR meanings",
)

with open(path, "w", encoding="utf-8") as f:
    f.write(new_content)

# Verificar
with open(path, encoding="utf-8") as f:
    verify = f.read()
ids_after = re.findall(r'ID:\s+"([^"]+)"', verify)
print(f"\nIDs no arquivo: {len(ids_after)}", file=sys.stderr)
print(f"IDs únicos: {len(set(ids_after))}", file=sys.stderr)
from collections import Counter
dupes_after = {k: v for k, v in Counter(ids_after).items() if v > 1}
if dupes_after:
    print(f"ERRO: Ainda tem duplicatas: {dupes_after}", file=sys.stderr)
    sys.exit(1)
print("Sem duplicatas ✅", file=sys.stderr)
