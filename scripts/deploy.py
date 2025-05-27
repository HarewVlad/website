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

    # Collect all files matching the patterns
    for pattern in GLOBS:
        files = root.glob(pattern)
        for file in files:
            NEEDED_FILES.add(str(file))

    # Read all files and prepare payload
    files_payload = []
    for rel_path in NEEDED_FILES:
        try:
            with open(rel_path, "r", encoding="utf-8") as f:
                content = f.read()

            files_payload.append({"file_path": rel_path, "content": content})
            print(f"📁 Prepared '{rel_path}' for upload")

        except Exception as e:
            print(f"Failed to read '{rel_path}': {e}", file=sys.stderr)
            failures += 1
            continue

    # If no files were successfully read, exit early
    if not files_payload:
        print("No files to upload.", file=sys.stderr)
        sys.exit(1)

    # Prepare multi-file payload
    payload = {"files": files_payload}

    print(f"\n🚀 Uploading {len(files_payload)} file(s) to server...")

    # Send all files in a single request
    try:
        status, resp = post_update(UPDATE_HOST, "/update", payload)
    except Exception as e:
        print(f"Network error during upload: {e}", file=sys.stderr)
        sys.exit(1)

    # Evaluate response
    if status in (200, 202, 207):  # Include 207 Multi-Status
        print(f"✅ Upload completed (HTTP {status})")

        # Parse response details if available
        if isinstance(resp, dict):
            updated_files = resp.get("updated_files", [])
            failed_files = resp.get("failed_files", [])
            rebuilding = resp.get("rebuilding", False)

            print(f"📊 Successfully updated: {len(updated_files)} file(s)")

            # Show successful files
            for file_path in updated_files:
                print(f"  ✅ {file_path}")

            # Show failed files
            if failed_files:
                print(f"📊 Failed to update: {len(failed_files)} file(s)")
                for failed_file in failed_files:
                    file_path = failed_file.get("file_path", "unknown")
                    error_msg = failed_file.get("error", "unknown error")
                    print(f"  ❌ {file_path}: {error_msg}")
                failures += len(failed_files)

            # Show rebuild status
            if rebuilding:
                print("🔄 Server rebuild started...")
            elif resp.get("dev_mode"):
                print("🔧 Running in development mode (no rebuild needed)")

        # Determine final success based on whether any files failed
        if failures == 0:
            print("\n🎉 Deployment completed successfully.")
            sys.exit(0)
        else:
            print(f"\n⚠️  Deployment completed with {failures} error(s).")
            sys.exit(1)
    else:
        print(f"❌ Upload failed (HTTP {status}): {resp}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
