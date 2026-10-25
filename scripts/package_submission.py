"""Create an explicit review-only handoff; never submit or infer readiness."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import zipfile
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
FILES = (
    "docs/pitch/PathForge_AI_CYBERSTARS_PHASE3_DRAFT.pptx",
    "docs/pitch/PathForge_AI_CYBERSTARS_PHASE3_DRAFT.pdf",
    "docs/pitch/team.json",
    "docs/pitch/README.md",
    "docs/media/pathforge-walkthrough.webm",
    "docs/architecture.svg",
    "docs/phase4-verification.md",
    "docs/pilot-protocol.md",
    "docs/submission/application-draft.md",
    "docs/submission/portal-checklist.md",
    "docs/submission/final-checklist.md",
    "docs/expert-administration.md",
    "docs/phase5-verification.md",
    "docs/phase3-guide.md",
    "docs/phase3-verification.md",
)
ARCHIVE = "PathForge_AI_REVIEW_ONLY.zip"


def artifact(root, name):
    if name not in FILES:
        raise ValueError("Artifact is outside the submission allowlist")
    path = root / name
    if not path.is_file() or path.resolve() != path.absolute():
        raise ValueError(f"Missing or redirected artifact: {name}")
    return path


def validate_pitch(path):
    with zipfile.ZipFile(path) as deck:
        if deck.testzip() is not None:
            raise ValueError("Pitch ZIP integrity failure")
        slides = [n for n in deck.namelist() if re.fullmatch(r"ppt/slides/slide\d+\.xml", n)]
        if len(slides) != 6:
            raise ValueError("Official pitch must contain six slides")
        for slide in slides:
            ET.fromstring(deck.read(slide))


def records(root):
    result = []
    for name in FILES:
        data = artifact(root, name).read_bytes()
        result.append({"path": name, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()})
    validate_pitch(root / FILES[0])
    pdf = (root / FILES[1]).read_bytes()
    if not pdf.startswith(b"%PDF-") or len(pdf) > 10_000_000:
        raise ValueError("PDF must have a PDF header and remain below the template's 10 MB cap")
    return result


def package(root=ROOT):
    entries = records(root)
    report = {
        "status": "REVIEW_ONLY", "submission_status": "NOT_SUBMITTED",
        "acknowledgement_verified": False,
        "applicant": json.loads((root / "docs/pitch/team.json").read_text(encoding="utf-8")),
        "blockers": ["Mandatory real contact, qualification and eligibility still require applicant verification",
                     "Authenticated portal fields, upload rules and exact cutoff unverified",
                     "Final applicant review and actual portal acknowledgement absent"],
        "unfinished": ["Phase 4 public deployment", "Live AI-provider verification and native-speaker Marathi review"],
        "warnings": ["Public links unverified; add only if supported by the portal",
                     "ZIP is a review handoff, not the official pitch upload",
                     "Integrity checks do not verify eligibility, PDF rendering or submission"],
        "files": entries,
    }
    output = root / "docs/submission/dist"
    output.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output / ARCHIVE, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for entry in entries:
            archive.write(artifact(root, entry["path"]), entry["path"])
        archive.writestr("readiness.json", json.dumps(report, indent=2) + "\n")
    report["archive_sha256"] = hashlib.sha256((output / ARCHIVE).read_bytes()).hexdigest()
    (output / "readiness.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return report


def check(root=ROOT):
    output = root / "docs/submission/dist"
    report = json.loads((output / "readiness.json").read_text(encoding="utf-8"))
    if report["status"] != "REVIEW_ONLY" or report["submission_status"] != "NOT_SUBMITTED" or report["acknowledgement_verified"] is not False:
        raise ValueError("Review bundle must not claim submission")
    if records(root) != report["files"]:
        raise ValueError("Artifacts changed: regenerate the review bundle")
    data = (output / ARCHIVE).read_bytes()
    if hashlib.sha256(data).hexdigest() != report["archive_sha256"]:
        raise ValueError("Archive checksum mismatch")
    with zipfile.ZipFile(output / ARCHIVE) as archive:
        if archive.testzip() is not None or sorted(archive.namelist()) != sorted((*FILES, "readiness.json")):
            raise ValueError("Unexpected archive contents")
        for entry in report["files"]:
            if hashlib.sha256(archive.read(entry["path"])).hexdigest() != entry["sha256"]:
                raise ValueError("Bundled artifact checksum mismatch")
        bundled = json.loads(archive.read("readiness.json"))
        if bundled != {key: value for key, value in report.items() if key != "archive_sha256"}:
            raise ValueError("Bundled readiness report mismatch")
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Verify integrity only; does not assert submission readiness")
    args = parser.parse_args()
    report = check() if args.check else package()
    print(f"Integrity verified: {len(report['files'])} artifacts. REVIEW ONLY; NOT SUBMITTED.")
