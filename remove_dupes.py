#!/usr/bin/env python3
"""Remove duplicate cards from cards.go — keeps first occurrence of each ID."""
import re, sys

path = "/Users/jamilebastos/lets-tarot/api/internal/models/cards.go"
with open(path) as f:
    content = f.read()

lines = content.split('\n')

# Identify card blocks by brace depth
cards = []  # list of (start_line_idx, end_line_idx)
depth = 0
in_card = False
start = None

for i, line in enumerate(lines):
    s = line.strip()
    
    # Count braces
    depth += line.count('{') - line.count('}')
    
    if not in_card and s == '{' and line.startswith('\t\t\t'):
        in_card = True
        start = i
    elif in_card and depth <= 0:
        cards.append((start, i))
        in_card = False
        start = None
        depth = 0

print(f"Encontrados {len(cards)} blocos de card")

# Extract IDs and find duplicates
def extract_id(lines_slice):
    for line in lines_slice:
        m = re.search(r'ID:\s+"([^"]+)"', line)
        if m:
            return m.group(1)
    return None

seen = set()
to_remove = set()  # line indices to remove

for start, end in cards:
    card_lines = lines[start:end+1]
    cid = extract_id(card_lines)
    if cid in seen:
        to_remove.add(start)
        to_remove.add(end)
        print(f"  Removendo duplicata: {cid} (linhas {start}-{end})")
    elif cid:
        seen.add(cid)

print(f"\nTotal a remover: {len(to_remove)} linhas")
print(f"Blocos restantes: {len(cards) - len(to_remove)//2}")

# Build new content
new_lines = []
for i, line in enumerate(lines):
    if i in to_remove:
        continue
    new_lines.append(line)

new_content = '\n'.join(new_lines)

with open(path, 'w') as f:
    f.write(new_content)

print(f"\nArquivo escrito. Linhas: {len(new_lines)} (era {len(lines)})")

# Verify
with open(path) as f:
    verify = f.read()
ids_after = re.findall(r'ID:\s+"([^"]+)"', verify)
from collections import Counter
counts = Counter(ids_after)
dupes_after = {k: v for k, v in counts.items() if v > 1}
print(f"IDs após: {len(ids_after)}, únicos: {len(set(ids_after))}")
print(f"Duplicatas restantes: {dupes_after if dupes_after else 'NENHUMA'}")
