#!/usr/bin/env python3
import os
import sys
import json
import ssl
from http.client import HTTPSConnection
from pathlib import Path

# === Configuration ===
# Environment variable that holds the host (and optional port) of the update server,
# e.g. "updates.example.com" or "updates.example.com:443"
UPDATE_HOST = os.getenv("UPDATE_HOST")
if not UPDATE_HOST:
    print("Error: UPDATE_HOST environment variable is not set", file=sys.stderr)
    sys.exit(1)

# === Helpers ===
GLOBS = [
    "**/*.js*",
    "**/*.ts*",
    "**/*.css*",
    "**/*.html*",
    "**/*.json*",
    "**/*.md*",
    "**/*.txt*",
    "**/*.yaml*",
    "**/*.yml*",
    "**/*.xml*",
    "**/*.svg*",
]


def post_update(host, path, payload):
    """
    Send a POST request with JSON payload to `https://<host>/update`.
    Returns (status_code, response_body).
    """
    conn = HTTPSConnection(host, context=ssl.create_default_context())
    body = json.dumps(payload)
    headers = {
        "Content-Type": "application/json",
        "Content-Length": str(len(body)),
    }
    conn.request("POST", path, body=body, headers=headers)
    response = conn.getresponse()
    data = response.read().decode("utf-8")
    conn.close()
    return response.status, data


# === Main ===


def main():
    failures = 0
    root = Path(".")

    NEEDED_FILES = set()
    for pattern in GLOBS:
        files = root.glob(pattern)
        for file in files:
            NEEDED_FILES.add(file)

    for rel_path in NEEDED_FILES:
        # Read file content
        try:
            with open(rel_path, "r", encoding="utf-8") as f:
                content = f.read()
        except Exception as e:
            print(f"Failed to read '{rel_path}': {e}", file=sys.stderr)
            failures += 1
            continue

        # Prepare payload
        payload = {"file_path": rel_path, "content": content}

        # Send to update endpoint
        try:
            status, resp = post_update(UPDATE_HOST, "/update", payload)
        except Exception as e:
            print(f"Network error pushing '{rel_path}': {e}", file=sys.stderr)
            failures += 1
            continue

        # Evaluate response
        if status in (200, 202):
            print(f"✅ {rel_path} -> succeeded (HTTP {status})")
        else:
            print(f"❌ {rel_path} -> failed (HTTP {status}): {resp}", file=sys.stderr)
            failures += 1

    if failures:
        print(f"\nDeployment finished with {failures} error(s).", file=sys.stderr)
        sys.exit(1)
    else:
        print("\nDeployment completed successfully.")
        sys.exit(0)


if __name__ == "__main__":
    main()
