#!/usr/bin/env python3
import os
import re

# Pattern to find the relative requires
pattern = r"require\('\.\.\/\.\.\/\.\.\/shared-auth/src/"
replacement = "require('@proyecto/shared-auth/src/"

# Also handle require("...") format  
pattern2 = r'require\("\.\.\\/\.\.\\/\.\.\\/shared-auth/src/'
replacement2 = 'require("@proyecto/shared-auth/src/'

fixed_count = 0
for root, dirs, files in os.walk('.'):
    # Skip node_modules and .git
    dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', '.venv']]
    
    for file in files:
        if file.endswith('.js'):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                original = content
                content = re.sub(pattern, replacement, content)
                content = re.sub(pattern2, replacement2, content)
                
                if content != original:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)
                    fixed_count += 1
                    print(f"✅ Fixed: {filepath}")
            except Exception as e:
                print(f"❌ Error processing {filepath}: {e}")

print(f"\n✅ Total files fixed: {fixed_count}")
