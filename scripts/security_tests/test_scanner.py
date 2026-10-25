import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("scanner", Path(__file__).resolve().parents[1] / "security_scan.py")
scanner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(scanner)


class ScannerTests(unittest.TestCase):
    def test_new_secret_is_detected_without_printing_value(self):
        fake = "AKIA" + "Z9Q7R2T8U4V6W3X5"
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "config.py"
            path.write_text('aws_access_key_id = "' + fake + '"\n', encoding="utf-8")
            findings = scanner.find_file(path)
        self.assertTrue(any(item["detector"] == "AWS Access Key" for item in findings))
        self.assertNotIn(fake, str(findings))

    def test_secret_in_git_patch_detected(self):
        fake = "AKIA" + "Z9Q7R2T8U4V6W3X5"
        patch = 'diff --git a/config.py b/config.py\nnew file mode 100644\n--- /dev/null\n+++ b/config.py\n@@ -0,0 +1 @@\n+aws_access_key_id = "' + fake + '"\n'
        self.assertTrue(scanner.find_diff(patch, "test-revision"))

    def test_inline_comment_cannot_bypass_explicit_review(self):
        fake = "AKIA" + "Z9Q7R2T8U4V6W3X5"
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "config.py"
            path.write_text('aws_access_key_id = "' + fake + '" # pragma: allowlist secret\n', encoding="utf-8")
            self.assertTrue(scanner.find_file(path))

    def test_checksum_filter_does_not_allow_credentials_or_other_paths(self):
        value = {"path": "docs/submission/dist/readiness.json", "detector": "Hex High Entropy String", "fingerprint": "not-allowlisted", "line": 1}
        self.assertTrue(scanner.reviewed(value, ['"sha256": "' + "a" * 64 + '"'], set()))
        self.assertFalse(scanner.reviewed(value, ['"api_key": "' + "a" * 64 + '"'], set()))
        self.assertFalse(scanner.reviewed({**value, "path": "config.py"}, ['"sha256": "' + "a" * 64 + '"'], set()))
