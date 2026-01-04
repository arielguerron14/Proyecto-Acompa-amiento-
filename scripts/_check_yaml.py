import sys
from pathlib import Path

# Validate there are no remaining repair/smoke workflows
root = Path(__file__).resolve().parents[1] / '.github' / 'workflows'
def is_archived(path: Path) -> bool:
    try:
        text = path.read_text(encoding='utf-8')
        return 'Removed from active workflows per request' in text
    except Exception:
        return False

found = [p.name for p in root.glob('*.yml') if ('repair' in p.name or 'smoke' in p.name) and not is_archived(p)]
if found:
    print('ERROR: found active workflows that should be removed:', found)
    sys.exit(1)
else:
    print('OK: no active repair/smoke workflows found in .github/workflows')
