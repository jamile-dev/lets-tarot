import subprocess
import json
import os
import time

env = {**os.environ, "PATH": "/Users/jamilebastos/.local/bin:" + os.environ.get("PATH", "")}
service_id = "srv-dafiq99t0dsc73earkk0"

print("Checking service status...")
for i in range(20):
    result = subprocess.run(
        ["render", "services", "list", "--output", "json"],
        capture_output=True, text=True, timeout=30,
        env=env
    )
    try:
        data = json.loads(result.stdout.strip())
        services = data.get("data", []) if isinstance(data, dict) else data
        for s in services:
            if s.get("id") == service_id or s.get("name") == "lets-tarot-api":
                status = s.get("serviceDetails", {}).get("status", s.get("status", "unknown"))
                state = s.get("state", "unknown")
                url = s.get("serviceDetails", {}).get("url") or s.get("url", "")
                print(f"  Attempt {i+1}: status={status}, state={state}, url={url}")
                if status in ("available", "running", "live") or url:
                    print(f"\nService URL: {url}")
                    with open("/tmp/render_service_info.json", "w") as f:
                        json.dump(s, f)
                    break
    except Exception as e:
        print(f"  Attempt {i+1}: error - {e}")
    
    if i == 19:
        print("\nLast attempt, dumping full output:")
        print(json.dumps(data, indent=2)[:2000])
    
    time.sleep(15)