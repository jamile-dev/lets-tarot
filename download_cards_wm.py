#!/usr/bin/env python3
"""
Download Rider-Waite-Smith tarot card images from Wikimedia Commons (TaionWC scans).
Public domain. With delays to avoid Cloudflare rate limiting.
"""
import os, urllib.request, urllib.parse, json, time, sys

DEST_DIRS = [
    "/Users/jamilebastos/lets-tarot/web/public/cards",
    "/Users/jamilebastos/lets-tarot/api/cards",
]

for d in DEST_DIRS:
    os.makedirs(d, exist_ok=True)

# TaionWC scan filenames - exact mapping from Wikimedia Commons category
CARD_MAP = [
    # Major Arcana (22)
    ("ar00", "RWS_Tarot_00_Fool.jpg"),
    ("ar01", "RWS_Tarot_01_Magician.jpg"),
    ("ar02", "RWS_Tarot_02_High_Priestess.jpg"),
    ("ar03", "RWS_Tarot_03_Empress.jpg"),
    ("ar04", "RWS_Tarot_04_Emperor.jpg"),
    ("ar05", "RWS_Tarot_05_Hierophant.jpg"),
    ("ar06", "RWS_Tarot_06_Lovers.jpg"),
    ("ar07", "RWS_Tarot_07_Chariot.jpg"),
    ("ar08", "RWS_Tarot_08_Strength.jpg"),
    ("ar09", "RWS_Tarot_09_Hermit.jpg"),
    ("ar10", "RWS_Tarot_10_Wheel_of_Fortune.jpg"),
    ("ar11", "RWS_Tarot_11_Justice.jpg"),
    ("ar12", "RWS_Tarot_12_Hanged_Man.jpg"),
    ("ar13", "RWS_Tarot_13_Death.jpg"),
    ("ar14", "RWS_Tarot_14_Temperance.jpg"),
    ("ar15", "RWS_Tarot_15_Devil.jpg"),
    ("ar16", "RWS_Tarot_16_Tower.jpg"),
    ("ar17", "RWS_Tarot_17_Star.jpg"),
    ("ar18", "RWS_Tarot_18_Moon.jpg"),
    ("ar19", "RWS_Tarot_19_Sun.jpg"),
    ("ar20", "RWS_Tarot_20_Judgement.jpg"),
    ("ar21", "RWS_Tarot_21_World.jpg"),
    # Cups (14) - cp01=Ás, cp02-10=numbered, cpkn=Valete, cprg=Dama, cprq=Rei
    ("cp01", "Cups01.jpg"),
    ("cp02", "Cups02.jpg"),
    ("cp03", "Cups03.jpg"),
    ("cp04", "Cups04.jpg"),
    ("cp05", "Cups05.jpg"),
    ("cp06", "Cups06.jpg"),
    ("cp07", "Cups07.jpg"),
    ("cp08", "Cups08.jpg"),
    ("cp09", "Cups09.jpg"),
    ("cp10", "Cups10.jpg"),
    ("cpkn", "Cups11.jpg"),
    ("cprg", "Cups12.jpg"),
    ("cprq", "Cups13.jpg"),
    # Swords (14)
    ("sp01", "Swords01.jpg"),
    ("sp02", "Swords02.jpg"),
    ("sp03", "Swords03.jpg"),
    ("sp04", "Swords04.jpg"),
    ("sp05", "Swords05.jpg"),
    ("sp06", "Swords06.jpg"),
    ("sp07", "Swords07.jpg"),
    ("sp08", "Swords08.jpg"),
    ("sp09", "Swords09.jpg"),
    ("sp10", "Swords10.jpg"),
    ("spkn", "Swords11.jpg"),
    ("sprg", "Swords12.jpg"),
    ("sprq", "Swords13.jpg"),
    # Pentacles/Coins (14)
    ("ou01", "Pents01.jpg"),
    ("ou02", "Pents02.jpg"),
    ("ou03", "Pents03.jpg"),
    ("ou04", "Pents04.jpg"),
    ("ou05", "Pents05.jpg"),
    ("ou06", "Pents06.jpg"),
    ("ou07", "Pents07.jpg"),
    ("ou08", "Pents08.jpg"),
    ("ou09", "Pents09.jpg"),
    ("ou10", "Pents10.jpg"),
    ("oukn", "Pents11.jpg"),
    ("ourg", "Pents12.jpg"),
    ("ourq", "Pents13.jpg"),
    # Wands (14)
    ("pk01", "Wands01.jpg"),
    ("pk02", "Wands02.jpg"),
    ("pk03", "Wands03.jpg"),
    ("pk04", "Wands04.jpg"),
    ("pk05", "Wands05.jpg"),
    ("pk06", "Wands06.jpg"),
    ("pk07", "Wands07.jpg"),
    ("pk08", "Wands08.jpg"),
    ("pk09", "Wands09.jpg"),
    ("pk10", "Wands10.jpg"),
    ("pknk", "Wands11.jpg"),
    ("pkrk", "Wands12.jpg"),
    ("pkrq", "Wands13.jpg"),
]

API_URL = "https://commons.wikimedia.org/w/api.php"

UA = "LetsTarotBot/1.0 (https://github.com/jamile-dev/lets-tarot; contact: jamile.bastos.dev@gmail.com)"

def api_query(params):
    params = dict(params)
    params["format"] = "json"
    url = API_URL + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())

def get_file_url(filename):
    data = api_query({
        "action": "query",
        "titles": f"File:{filename}",
        "prop": "imageinfo",
        "iiprop": "url",
    })
    pages = data.get("query", {}).get("pages", {})
    for page_id, page in pages.items():
        if "imageinfo" in page:
            return page["imageinfo"][0]["url"]
    return None

def download(url, path, max_retries=5):
    last_err = None
    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(url, headers={
                "User-Agent": UA,
                "Accept": "image/*,*/*",
            })
            with urllib.request.urlopen(req, timeout=120) as resp:
                data = resp.read()
            with open(path, "wb") as f:
                f.write(data)
            return len(data)
        except Exception as e:
            last_err = e
            wait = min(2 ** attempt, 30)
            print(f"    retry {attempt+1}/{max_retries} após {wait}s: {e}")
            time.sleep(wait)
    print(f"    FAILED: {last_err}")
    return 0

total = len(CARD_MAP)
print(f"Total: {total} cartas para baixar")
print("=" * 60)

ok = 0
fail = 0
skipped = 0

for idx, (card_id, filename) in enumerate(CARD_MAP, 1):
    dest = os.path.join(DEST_DIRS[0], f"{card_id}.jpg")
    
    if os.path.exists(dest) and os.path.getsize(dest) > 10000:
        print(f"[{idx}/{total}] {card_id}: já existe ({os.path.getsize(dest)/1024:.0f} KB) - pulando")
        skipped += 1
        continue
    
    print(f"[{idx}/{total}] {card_id} → {filename}...", end=" ", flush=True)
    
    try:
        dl_url = get_file_url(filename)
        if not dl_url:
            print("ERRO: URL não encontrada")
            fail += 1
            time.sleep(2)
            continue
        
        size = download(dl_url, dest)
        if size > 0:
            # Also save to second dest
            for d in DEST_DIRS[1:]:
                dp = os.path.join(d, f"{card_id}.jpg")
                if not os.path.exists(dp):
                    with open(dp, "wb") as f:
                        with open(dest, "rb") as src:
                            f.write(src.read())
            print(f"OK ({size/1024:.0f} KB)")
            ok += 1
        else:
            fail += 1
    except Exception as e:
        print(f"ERRO: {e}")
        fail += 1
    
    # Delay between cards to avoid rate limiting
    time.sleep(3)

print("=" * 60)
print(f"Concluído: {ok} baixadas, {skipped} ignoradas (já existiam), {fail} falharam")
if fail > 0:
    print(f"\nPara retryar as falhadas, rode novamente (o script pula as que já existirem)")
