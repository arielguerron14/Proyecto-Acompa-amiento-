#!/usr/bin/env python3
import yaml
import glob
import sys

workflows = glob.glob('.github/workflows/*.yml')
errors = []

for wf in sorted(workflows):
    try:
        with open(wf, 'r') as f:
            yaml.safe_load(f)
        print(f"✅ {wf.split('/')[-1]}")
    except Exception as e:
        errors.append((wf, str(e)))
        print(f"❌ {wf.split('/')[-1]}")
        print(f"   Error: {str(e)[:100]}")

print()
if errors:
    print(f"❌ {len(errors)} workflows con errores")
    sys.exit(1)
else:
    print(f"✅ Todos los {len(workflows)} workflows son válidos")
    sys.exit(0)
