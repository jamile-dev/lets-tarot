import subprocess
import json
import os

env = {**os.environ, "PATH": "/Users/jamilebastos/.local/bin:" + os.environ.get("PATH", "")}

# Update the service to use the correct Dockerfile path
service_id = "srv-dafiq99t0dsc73earkk0"

result = subprocess.run(
    ["render", "services", "update", service_id,
     "--output", "json",
     "--dockerfile-path", "./api/Dockerfile"],
    capture_output=True, text=True, timeout=60,
    env=env
)
print(f"stdout: {result.stdout[:500]}")
if result.stderr:
    print(f"stderr: {result.stderr[:500]}")
