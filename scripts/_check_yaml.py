import sys
from pathlib import Path
try:
    import yaml
except Exception as e:
    print('Missing PyYAML:', e); sys.exit(2)
path = Path(r'c:/Users/ariel/Escritorio/distri/Proyecto-Acompa-amiento-/.github/workflows/repair-on-push.yml')
try:
    data = yaml.safe_load(path.read_text())
    print('YAML parsed OK')
except Exception as e:
    print('YAML parse error:', e)
    sys.exit(1)
