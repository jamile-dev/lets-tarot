#!/usr/bin/env python3
"""
Download Rider-Waite-Smith tarot card images from Wikimedia Commons (TaionWC scans).
Public domain. Saves to web/public/cards/ and api/cards/.
"""
import os, urllib.request, urllib.parse, json, time, re

DEST_DIRS = [
    "/Users/jamilebastos/lets-tarot/web/public/cards",
    "/Users/jamilebastos/lets-tarot/api/cards",
]

for d in DEST_DIRS:
    os.makedirs(d, exist_ok=True)

# Mapping: our card_id → Wikimedia Commons filename (TaionWC scans)
CARD_MAP = {
    # Major Arcana
    "ar00": "RWS_Tarot_00_Fool.jpg",
    "ar01": "RWS_Tarot_01_Magician.jpg",
    "ar02": "RWS_Tarot_02_High_Priestess.jpg",
    "ar03": "RWS_Tarot_03_Empress.jpg",
    "ar04": "RWS_Tarot_04_Emperor.jpg",
    "ar05": "RWS_Tarot_05_Hierophant.jpg",
    "ar06": "RWS_Tarot_06_Lovers.jpg",
    "ar07": "RWS_Tarot_07_Chariot.jpg",
    "ar08": "RWS_Tarot_08_Strength.jpg",
    "ar09": "RWS_Tarot_09_Hermit.jpg",
    "ar10": "RWS_Tarot_10_Wheel_of_Fortune.jpg",
    "ar11": "RWS_Tarot_11_Justice.jpg",
    "ar12": "RWS_Tarot_12_Hanged_Man.jpg",
    "ar13": "RWS_Tarot_13_Death.jpg",
    "ar14": "RWS_Tarot_14_Temperance.jpg",
    "ar15": "RWS_Tarot_15_Devil.jpg",
    "ar16": "RWS_Tarot_16_Tower.jpg",
    "ar17": "RWS_Tarot_17_Star.jpg",
    "ar18": "RWS_Tarot_18_Moon.jpg",
    "ar19": "RWS_Tarot_19_Sun.jpg",
    "ar20": "RWS_Tarot_20_Judgement.jpg",
    "ar21": "RWS_Tarot_21_World.jpg",
    # Cups (minor arcana)
    "cp01": "Cups01.jpg",  # Ás
    "cp02": "Cups02.jpg",
    "cp03": "Cups03.jpg",
    "cp04": "Cups04.jpg",
    "cp05": "Cups05.jpg",
    "cp06": "Cups06.jpg",
    "cp07": "Cups07.jpg",
    "cp08": "Cups08.jpg",
    "cp09": "Cups09.jpg",
    "cp10": "Cups10.jpg",  # 10
    "cpkn": "Cups11.jpg",  # Valete (Jack)
    "cprg": "Cups12.jpg",  # Dama (Queen)
    "cprq": "Cups13.jpg",  # Rei (King)
    # Swords
    "sp01": "Swords01.jpg",
    "sp02": "Swords02.jpg",
    "sp03": "Swords03.jpg",
    "sp04": "Swords04.jpg",
    "sp05": "Swords05.jpg",
    "sp06": "Swords06.jpg",
    "sp07": "Swords07.jpg",
    "sp08": "Swords08.jpg",
    "sp09": "Swords09.jpg",
    "sp10": "Swords10.jpg",
    "spkn": "Swords11.jpg",
    "sprg": "Swords12.jpg",
    "sprq": "Swords13.jpg",
    # Pentacles (Coins)
    "ou01": "Pents01.jpg",
    "ou02": "Pents02.jpg",
    "ou03": "Pents03.jpg",
    "ou04": "Pents04.jpg",
    "ou05": "Pents05.jpg",
    "ou06": "Pents06.jpg",
    "ou07": "Pents07.jpg",
    "ou08": "Pents08.jpg",
    "ou09": "Pents09.jpg",
    "ou10": "Pents10.jpg",
    "oukn": "Pents11.jpg",
    "ourg": "Pents12.jpg",
    "ourq": "Pents13.jpg",
    # Wands
    "pk01": "Wands01.jpg",
    "pk02": "Wands02.jpg",
    "pk03": "Wands03.jpg",
    "pk04": "Wands04.jpg",
    "pk05": "Wands05.jpg",
    "pk06": "Wands06.jpg",
    "pk07": "Wands07.jpg",
    "pk08": "Wands08.jpg",
    "pk09": "Wands09.jpg",
    "pk10": "Wands10.jpg",
    "pknk": "Wands11.jpg",
    "pkrk": "Wands12.jpg",
    "pkrq": "Wands13.jpg",
}

API_URL = "https://commons.wikimedia.org/w/api.php"

def api_query(params):
    """Query Wikimedia API with retry on 429."""
    params = dict(params)
    params["format"] = "json"
    url = API_URL + "?" + urllib.parse.urlencode(params)
    for attempt in range(4):
        try:
            req = urllib.request.Request(
                url,
                headers={
                    "User-Agent": "LetsTarotBot/1.0 (https://github.com/jamile-dev/lets-tarot; contact: jamile.bastos.dev@gmail.com)",
                    "Accept": "application/json",
                }
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read())
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = 2 ** attempt
                print(f"    Rate limited, waiting {wait}s...")
                time.sleep(wait)
            else:
                raise
    raise RuntimeError("Max retries exceeded")

def get_file_url(filename):
    """Get direct download URL for a Wikimedia file."""
    data = api_query({
        "action": "query",
        "titles": f"File:{filename}",
        "prop": "imageinfo",
        "iiprop": "url",
        "iiurlwidth": "1200",
    })
    pages = data.get("query", {}).get("pages", {})
    for page_id, page in pages.items():
        if "imageinfo" in page:
            return page["imageinfo"][0]["url"]
    return None

def download_file(url, dest_path, retries=3):
    """Download a file with retry on failure"""
    last_err = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(
                url,
                headers={
                    "User-Agent": "LetsTarotBot/1.0 (https://github.com/jamile-dev/lets-tarot; contact: jamile.bastos.dev@gmail.com)",
                    "Accept": "image/*,*/*",
                }
            )
            with urllib.request.urlopen(req, timeout=120) as resp:
                data = resp.read()
            with open(dest_path, "wb") as f:
                f.write(data)
            return len(data)
        except Exception as e:
            last_err = e
            wait = 2 ** attempt
            print(f"    Tentativa {attempt+1}/{retries} falhou: {e}, aguardando {wait}s...")
            time.sleep(wait + 1)
    print(f"    ERRO final: {last_err}")
    return None

print("=" * 60)
print("Baixando 78 cartas do baralho Rider-Waite-Smith")
print("(Wikimedia Commons - TaionWC scans, domínio público)")
print("=" * 60)

total = len(CARD_MAP)
ok = 0
fail = 0

for card_id, filename in CARD_MAP.items():
    print(f"\n[{ok+fail+1}/{total}] {card_id} → {filename}")
    
    # Check if already exists in first dest dir
    first_dest = os.path.join(DEST_DIRS[0], f"{card_id}.jpg")
    if os.path.exists(first_dest):
        print(f"  Já existe, pulando...")
        ok += 1
        continue
    
    # Get download URL from API
    try:
        dl_url = get_file_url(filename)
        if not dl_url:
            print(f"  ERRO: não encontrou URL para {filename}")
            fail += 1
            continue
        print(f"  URL: {dl_url[:80]}...")
    except Exception as e:
        print(f"  ERRO API: {e}")
        fail += 1
        continue
    
    # Download to all dest dirs
    size = 0
    for dest_dir in DEST_DIRS:
        path = os.path.join(dest_dir, f"{card_id}.jpg")
        s = download_file(dl_url, path)
        if s is not None:
            size = s
            print(f"  ✓ {path} ({s / 1024:.1f} KB)")
        else:
            print(f"  ✗ falha em {path}")
    
    if size > 0:
        ok += 1
    else:
        fail += 1
    
    time.sleep(0.5)  # polite

print(f"\n{'='*60}")
print(f"Pronto! {ok}/{total} baixadas, {fail} falharam.")
if fail > 0:
    print(f"Arquivos em: {DEST_DIRS[0]}")
