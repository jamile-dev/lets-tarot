import subprocess
import os

env = {**os.environ, "PATH": "/Users/jamilebastos/.local/bin:" + os.environ.get("PATH", "")}

# Get deploy logs
result = subprocess.run(
    ["render", "logs", "srv-dafj059t0dsc73ebk02g", "--output", "text"],
    capture_output=True, text=True, timeout=30,
    env=env
)
print("STDOUT:")
print(result.stdout[:3000])
print("\nSTDERR:")
print(result.stderr[:1000])
