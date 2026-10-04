"""Compatibility entry point; Lingrove now builds Vue modules instead of Flutter."""
from pathlib import Path
import subprocess
subprocess.run(['npm', 'run', 'build'], cwd=Path(__file__).resolve().parent.parent, check=True)
