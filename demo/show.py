"""Run the scheduler on an input file and open the result in the demo.

Usage:
    python3 demo/show.py path/to/input.txt              runs main.py
    python3 demo/show.py path/to/input.txt other.py     runs a different program

The program's output is printed to the console as normal, and the demo opens
with this run loaded (the top bar shows "Run: <file name>").
"""

import json
import subprocess
import sys
import webbrowser
from pathlib import Path

DEMO = Path(__file__).resolve().parent
ROOT = DEMO.parent


def main():
    if len(sys.argv) not in (2, 3):
        print(__doc__.strip(), file=sys.stderr)
        sys.exit(1)

    input_path = Path(sys.argv[1])
    program = Path(sys.argv[2]) if len(sys.argv) == 3 else ROOT / "main.py"
    text = input_path.read_text()

    result = subprocess.run([sys.executable, str(program)], input=text, capture_output=True, text=True)
    sys.stdout.write(result.stdout)
    sys.stderr.write(result.stderr)
    if result.returncode != 0:
        print(f"{program.name} exited with code {result.returncode}", file=sys.stderr)

    # The page loads latest.js and opens on this run
    name = f"Run: {input_path.name}"
    (DEMO / "latest.js").write_text(
        "// Written by show.py: the last input it ran and what the program printed.\n"
        "window.SAMPLES = window.SAMPLES || {};\n"
        f"window.SAMPLES[{json.dumps(name)}] = {{ input: {json.dumps(text)}, output: {json.dumps(result.stdout)} }};\n"
    )
    webbrowser.open((DEMO / "index.html").as_uri())


if __name__ == "__main__":
    main()
