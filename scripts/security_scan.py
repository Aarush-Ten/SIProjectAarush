"""Offline secret checks over tracked/unignored text and all reachable Git commits.

Only locations and detector fingerprints are reported. No candidate is sent to a
provider for verification. Binary artifacts and gitignored local files are excluded.
"""
import json
from pathlib import Path
import re
import subprocess
import sys

from detect_secrets.core.scan import scan_file, scan_diff
from detect_secrets.settings import default_settings

ROOT = Path(__file__).resolve().parents[1]


def record(secret, path=None, revision=None):
    return {"path": (path or secret.filename).replace("\\", "/"), "line": secret.line_number,
            "detector": secret.type, "fingerprint": secret.secret_hash, "revision": revision}


def find_file(path):
    with default_settings() as settings:
        settings.disable_filters("detect_secrets.filters.common.is_ignored_due_to_verification_policies")
        settings.disable_filters("detect_secrets.filters.allowlist.is_line_allowlisted")
        return [record(secret) for secret in scan_file(str(path))]


def find_diff(diff, revision):
    with default_settings() as settings:
        settings.disable_filters("detect_secrets.filters.common.is_ignored_due_to_verification_policies")
        settings.disable_filters("detect_secrets.filters.common.is_invalid_file", "detect_secrets.filters.allowlist.is_line_allowlisted")
        return [record(secret, revision=revision) for secret in scan_diff(diff)]


def git(*args):
    return subprocess.run(["git", *args], cwd=ROOT, check=True, capture_output=True).stdout


def reviewed(item, lines, allowlist):
    if (item["path"], item["detector"], item["fingerprint"]) in allowlist:
        return True
    # These generated manifest values are public artifact checksums, not credentials.
    if item["path"] == "docs/submission/dist/readiness.json" and item["detector"] == "Hex High Entropy String":
        line = lines[item["line"] - 1] if 0 < item["line"] <= len(lines) else ""
        return bool(re.fullmatch(r'\s*"(?:sha256|archive_sha256)": "[a-f0-9]{64}",?\s*', line))
    return False


def run():
    allowed = json.loads((ROOT / "scripts/security-secret-allowlist.json").read_text(encoding="utf-8"))
    allowlist = {(item["path"], item["detector"], item["fingerprint"]) for item in allowed}
    paths = set(git("ls-files", "-z", "--cached", "--others", "--exclude-standard").decode().split("\0")) - {""}
    findings = []
    reviewed_count = 0
    for name in sorted(paths):
        path = ROOT / name
        if not path.is_file() or name == "scripts/security-secret-allowlist.json":
            continue
        if path.suffix.lower() in {".png", ".jpg", ".pdf", ".pptx", ".webm", ".zip", ".ico"}:
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        if "\0" in text:
            continue
        for item in find_file(path):
            item["path"] = name
            if reviewed(item, text.splitlines(), allowlist): reviewed_count += 1
            else: findings.append(item)
    revisions = git("rev-list", "--all").decode().splitlines()
    for revision in revisions:
        diff = git("show", "--format=", "--no-ext-diff", "--no-renames", revision).decode("utf-8", errors="replace")
        for item in find_diff(diff, revision):
            # Line numbers refer to the target revision, never diff offsets.
            if item["path"] == "scripts/security-secret-allowlist.json": continue
            content = git("show", f"{revision}:{item['path']}").decode("utf-8", errors="replace")
            if reviewed(item, content.splitlines(), allowlist): reviewed_count += 1
            else: findings.append(item)
    result = {"working_files": len(paths), "reachable_commits": len(revisions), "reviewed_false_positives": reviewed_count, "findings": findings}
    print(json.dumps(result, indent=2))
    return 1 if findings else 0


if __name__ == "__main__":
    sys.exit(run())
