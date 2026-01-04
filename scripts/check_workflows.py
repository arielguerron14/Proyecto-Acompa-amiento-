import glob, yaml, sys
errors = []
for path in glob.glob('.github/workflows/*.yml') + glob.glob('.github/workflows/*.yaml'):
    try:
        with open(path,'r',encoding='utf-8') as f:
            yaml.safe_load(f)
    except Exception as e:
        errors.append((path,str(e)))
if errors:
    for p,e in errors:
        print('ERROR',p,e)
    sys.exit(1)
print('All workflow YAML parsed OK')