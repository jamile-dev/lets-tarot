import subprocess
import json
import os

env = {**os.environ, "PATH": "/Users/jamilebastos/.local/bin:" + os.environ.get("PATH", "")}

# Get the DB connection string
result = subprocess.run(
    ["render", "pg", "get", "dpg-dafipqvqj5pc73fh11r0-a", "--include-sensitive-connection-info", "--output", "json"],
    capture_output=True, text=True, timeout=30,
    env=env
)
db_data = json.loads(result.stdout.strip())
conn_str = db_data["data"]["connectionInfo"]["externalConnectionString"]
print(f"Database URL: {conn_str}")

# Generate JWT secret
import secrets
jwt_secret = secrets.token_urlsafe(32)
print(f"JWT Secret: {jwt_secret[:20]}...")

# Create the web service
print("\n=== Creating web service ===")
result = subprocess.run(
    ["render", "services", "create",
     "--name", "lets-tarot-api",
     "--type", "web_service",
     "--repo", "https://github.com/jamile-dev/lets-tarot",
     "--runtime", "docker",
     "--plan", "free",
     "--region", "oregon",
     "--health-check-path", "/health",
     "--env-var", "PORT=8080",
     "--env-var", "CLIENT_URL=https://jamile-dev.github.io",
     "--env-var", "CDN_BASE_URL=https://cdn.jsdelivr.net/gh/jamile-dev/lets-tarot@v0.1.0/cards",
     "--env-var", "DATABASE_URL=" + conn_str,
     "--env-var", "JWT_SECRET=" + jwt_secret,
     "--auto-deploy",
     "--confirm",
     "--output", "json"],
    capture_output=True, text=True, timeout=120,
    env=env
)
print(f"stdout: {result.stdout[:500]}")
if result.stderr:
    print(f"stderr: {result.stderr[:500]}")
