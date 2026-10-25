import importlib.util
import json
from pathlib import Path
import shutil
import tempfile
import unittest
import zipfile

SPEC = importlib.util.spec_from_file_location("package_submission", Path(__file__).resolve().parents[1] / "package_submission.py")
module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)


class SubmissionTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for name in module.FILES:
            target = self.root / name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(module.ROOT / name, target)

    def test_bundle_remains_review_only(self):
        report = module.package(self.root)
        self.assertFalse(report["acknowledgement_verified"])
        self.assertEqual(report["submission_status"], "NOT_SUBMITTED")
        self.assertEqual(len(report["blockers"]), 3)
        self.assertEqual(module.check(self.root), report)
        with zipfile.ZipFile(self.root / "docs/submission/dist" / module.ARCHIVE) as bundle:
            self.assertEqual(set(bundle.namelist()), set(module.FILES) | {"readiness.json"})

    def test_artifact_changes_require_regeneration(self):
        module.package(self.root)
        (self.root / module.FILES[-1]).write_text("changed", encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "Artifacts changed"):
            module.check(self.root)

    def test_archive_corruption_detected(self):
        module.package(self.root)
        with (self.root / "docs/submission/dist" / module.ARCHIVE).open("ab") as output:
            output.write(b"tamper")
        with self.assertRaisesRegex(ValueError, "checksum mismatch"):
            module.check(self.root)

    def test_secrets_and_traversal_rejected(self):
        for name in (".env", "../secret", ".submission-private/receipt.json"):
            with self.subTest(name=name), self.assertRaises(ValueError):
                module.artifact(self.root, name)

    def test_wrong_slide_count_rejected(self):
        with zipfile.ZipFile(self.root / module.FILES[0], "w") as deck:
            deck.writestr("ppt/slides/slide1.xml", "<slide/>")
        with self.assertRaisesRegex(ValueError, "six slides"):
            module.package(self.root)

    def test_invalid_pdf_rejected(self):
        (self.root / module.FILES[1]).write_bytes(b"not a PDF")
        with self.assertRaisesRegex(ValueError, "PDF header"):
            module.package(self.root)

    def test_false_submission_claim_rejected(self):
        module.package(self.root)
        path = self.root / "docs/submission/dist/readiness.json"
        report = json.loads(path.read_text(encoding="utf-8"))
        report["submission_status"] = "SUBMITTED"
        path.write_text(json.dumps(report), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "must not claim submission"):
            module.check(self.root)

    def test_confirmed_identity_and_separate_team(self):
        team = json.loads((self.root / "docs/pitch/team.json").read_text(encoding="utf-8"))
        self.assertEqual(team["applicant"]["name"], "Aarush Tendulkar")
        self.assertEqual(team["applicant"]["role"], "Team Lead")
        self.assertIsNone(team["applicant"]["contact"])
        self.assertEqual(team["team_size"], 1)
        self.assertEqual(team["members"], [{"name": "Aarush Tendulkar", "role": "Team Lead"}])
        self.assertNotIn("experts", team)
        with zipfile.ZipFile(self.root / module.FILES[0]) as deck:
            xml = "\n".join(deck.read(name).decode("utf-8") for name in deck.namelist() if name.endswith(".xml"))
        self.assertIn("Aarush Tendulkar", xml)
        self.assertNotIn("Aarush Tendulkar (demo)", xml)
