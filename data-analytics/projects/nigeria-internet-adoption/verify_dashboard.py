"""Check the standalone dashboard's embedded JavaScript syntax with Node.js."""
from html.parser import HTMLParser
from pathlib import Path
import subprocess
import tempfile

DASHBOARD = Path(__file__).with_name("dashboard.html")


class ScriptExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_script = False
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag == "script":
            self.in_script = True

    def handle_endtag(self, tag):
        if tag == "script":
            self.in_script = False

    def handle_data(self, data):
        if self.in_script:
            self.parts.append(data)


def main():
    parser = ScriptExtractor()
    parser.feed(DASHBOARD.read_text(encoding="utf-8"))
    script = "\n".join(parser.parts)
    assert script.strip(), "No embedded JavaScript found"
    with tempfile.NamedTemporaryFile("w", suffix=".js", encoding="utf-8") as handle:
        handle.write(script)
        handle.flush()
        subprocess.run(["node", "--check", handle.name], check=True)
    html = DASHBOARD.read_text(encoding="utf-8")
    for required in ("id=\"start\"", "id=\"end\"", "id=\"trend\"", "id=\"growth\"", "id=\"rows\""):
        assert required in html, f"Missing dashboard element: {required}"
    print("PASS: dashboard HTML contains required controls, chart containers and data table.")
    print("PASS: embedded JavaScript syntax is valid (node --check).")


if __name__ == "__main__":
    main()
