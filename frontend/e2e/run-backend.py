"""Run the normal ASGI application and record its actual Windows Python PID."""

import json
import os
from pathlib import Path
import sys

import uvicorn

sys.path.insert(0, str(Path.cwd()))
state_directory = Path(os.environ["PATHFORGE_E2E_STATE_DIR"])
state_directory.mkdir(parents=True, exist_ok=True)
(state_directory / "backend.json").write_text(
    json.dumps({"pid": os.getpid(), "run_id": state_directory.name})
)
uvicorn.run("app.main:app", host="127.0.0.1", port=8000, access_log=False)
