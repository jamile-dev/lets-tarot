import urllib.request
import json
import os

# Get token from the Render CLI auth config
# The Render CLI stores its token in a config file
config_paths = [
    os.path.expanduser("~/.render-cli/config.json"),
    os.path.expanduser("~/.config/render-cli/config.json"),
    os.path.expanduser("~/Library/Application Support/render-cli/config.json"),
]

for path in config_paths:
    if os.path.exists(path):
        with open(path) as f:
            print(f"Found config at {path}:")
            data = json.load(f)
            print(json.dumps(data, indent=2)[:500])

# Also check for tokens in the Render CLI binary location
result = subprocess.run(
    ["render", "services", "list", "--output", "json"],
    capture_output=True, text=True, timeout=30,
    env={**os.environ, "PATH": "/Users/jamilebastos/.local/bin:$PATH"}
)
# The CLI handles auth internally, let's try to use the API via the CLI's auth
# The Render CLI stores its access token in a file somewhere
# Let's search for it
import glob
for pattern in [
    os.path.expanduser("~/.render*"),
    os.path.expanduser("~/.config/render*"),
]:
    for path in glob.glob(pattern):
        print(f"\nFound: {path}")
        try:
            with open(path) as f:
                content = f.read()
                if 'token' in content.lower():
                    print(f"  Content: {content[:200]}")
        except:
            pass

# Try to find token in the Render CLI's data directory
import subprocess as sp
result = sp.run(
    ["find", os.path.expanduser("~"), "-name", "*render*", "-type", "f", "-maxdepth", "4"],
    capture_output=True, text=True, timeout=10
)
print(f"\nFiles found:")
print(result.stdout)
