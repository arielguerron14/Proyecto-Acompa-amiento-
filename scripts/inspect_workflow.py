from pathlib import Path
p = Path(r'c:/Users/ariel/Escritorio/distri/Proyecto-Acompa-amiento-/.github/workflows/repair-on-push.yml')
s = p.read_text()
lines = s.splitlines()
for i in range(max(0,30-5), min(len(lines),30+5)):
    line = lines[i]
    print(f"{i+1:3}: len={len(line):2} leading_spaces={len(line)-len(line.lstrip(' '))} repr={line!r}")
