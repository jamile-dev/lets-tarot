#!/usr/bin/env python3
"""
Download public-domain Rider-Waite-Smith tarot card images.
Source: sacred-texts.com tarot cross-reference (public domain).
Saves to web/public/cards/ and api/cards/ for local fallback + CDN upload.
"""
import os, urllib.request, time

DEST_DIRS = [
    "/Users/jamilebastos/lets-tarot/web/public/cards",
    "/Users/jamilebastos/lets-tarot/api/cards",
]

BASE_URL = "https://www.sacred-texts.com/tarot/xr/img/{}.jpg"

# All 78 card IDs (match models/cards.go)
CARD_IDS = [
    # Major Arcana (ar00–ar21)
    "ar00", "ar01", "ar02", "ar03", "ar04", "ar05", "ar06", "ar07", "ar08",
    "ar09", "ar10", "ar11", "ar12", "ar13", "ar14", "ar15", "ar16", "ar17",
    "ar18", "ar19", "ar20", "ar21",
    # Minor Arcana - Cups (cp01–cp10)
    "cp01", "cp02", "cp03", "cp04", "cp05", "cp06", "cp07", "cp08", "cp09", "cp10",
    # Minor Arcana - Swords (sp01–sp10)
    "sp01", "sp02", "sp03", "sp04", "sp05", "sp06", "sp07", "sp08", "sp09", "sp10",
    # Minor Arcana - Pentacles/Coins (ou01–ou10)
    "ou01", "ou02", "ou03", "ou04", "ou05", "ou06", "ou07", "ou08", "ou09", "ou10",
    # Minor Arcana - Wands (pk01–pk10)
    "pk01", "pk02", "pk03", "pk04", "pk05", "pk06", "pk07", "pk08", "pk09", "pk10",
    # Court cards - Cups
    "cpkn", "cprg", "cprq",
    # Court cards - Swords
    "spkn", "sprg", "sprq",
    # Court cards - Pentacles
    "oukn", "ourg", "ourq",
    # Court cards - Wands
    "pknk", "pkrk", "pkrq",
]

FAILED = []

for dest_dir in DEST_DIRS:
    os.makedirs(dest_dir, exist_ok=True)

for card_id in CARD_IDS:
    url = BASE_URL.format(card_id)
    for dest_dir in DEST_DIRS:
        path = os.path.join(dest_dir, f"{card_id}.jpg")
        if os.path.exists(path):
            continue
        try:
            print(f"Downloading {card_id}...")
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = resp.read()
            with open(path, "wb") as f:
                f.write(data)
            print(f"  Saved {card_id}.jpg ({len(data)} bytes)")
            time.sleep(0.3)  # be polite
        except Exception as e:
            FAILED.append((card_id, str(e)))
            print(f"  FAILED {card_id}: {e}")
            break  # don't retry same card in second dir

print(f"\nDone. {78 - len(FAILED)}/78 downloaded, {len(FAILED)} failed.")
if FAILED:
    print("\nFailed cards:")
    for cid, err in FAILED:
        print(f"  {cid}: {err}")
