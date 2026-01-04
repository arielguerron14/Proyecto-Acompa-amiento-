from pathlib import Path

root = Path(__file__).resolve().parents[1] / '.github' / 'workflows'
all_matches = [p for p in root.glob('*.yml') if ('repair' in p.name or 'smoke' in p.name)]

# Filter out files that we explicitly marked as removed (archived)
def is_archived(path: Path) -> bool:
    try:
        text = path.read_text(encoding='utf-8')
        return 'Removed from active workflows per request' in text
    except Exception:
        return False

active = [p for p in all_matches if not is_archived(p)]

if not all_matches:
    print('No repair/smoke workflows found.')
else:
    if active:
        print('Found these active repair/smoke workflows:')
        for p in active:
            print('-', p.name)
    else:
        print('No active repair/smoke workflows found; all matches are archived/stubbed:')
        for p in all_matches:
            print('-', p.name)
