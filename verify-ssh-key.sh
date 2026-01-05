#!/bin/bash

# Script to verify SSH key format and validity
# Run this locally to debug SSH key issues

echo "=== SSH Key Verification Script ==="
echo ""

# Check if key file exists
if [ -z "$1" ]; then
    echo "Usage: $0 <path-to-pem-file>"
    echo "Example: $0 ~/Downloads/key-acompanamiento.pem"
    exit 1
fi

KEY_FILE="$1"

if [ ! -f "$KEY_FILE" ]; then
    echo "❌ Error: Key file not found at $KEY_FILE"
    exit 1
fi

echo "✓ Key file found: $KEY_FILE"
echo ""

# Check file permissions
PERMS=$(stat -c "%a" "$KEY_FILE" 2>/dev/null || stat -f "%A" "$KEY_FILE" 2>/dev/null)
echo "File permissions: $PERMS"
if [ "$PERMS" != "600" ] && [ "$PERMS" != "400" ]; then
    echo "⚠ Warning: Permissions should be 600 or 400"
    chmod 600 "$KEY_FILE"
    echo "✓ Fixed permissions to 600"
fi
echo ""

# Check file format
echo "=== Key Format Validation ==="
FIRST_LINE=$(head -n 1 "$KEY_FILE")
LAST_LINE=$(tail -n 1 "$KEY_FILE")

if [[ "$FIRST_LINE" == "-----BEGIN"* ]]; then
    echo "✓ First line valid: $FIRST_LINE"
else
    echo "❌ First line invalid: $FIRST_LINE"
fi

if [[ "$LAST_LINE" == "-----END"* ]]; then
    echo "✓ Last line valid: $LAST_LINE"
else
    echo "❌ Last line invalid: $LAST_LINE"
fi
echo ""

# Check key size
KEY_SIZE=$(wc -c < "$KEY_FILE")
echo "Key file size: $KEY_SIZE bytes"
if [ $KEY_SIZE -lt 1000 ]; then
    echo "⚠ Warning: Key seems too small (should be > 1000 bytes)"
fi
echo ""

# Validate key format with ssh-keygen
echo "=== SSH Key Type Validation ==="
if ssh-keygen -l -f "$KEY_FILE" 2>/dev/null; then
    echo "✓ Key format is valid"
else
    echo "❌ Key format is invalid - ssh-keygen failed"
    echo "This likely means the key is corrupted or in wrong format"
    exit 1
fi
echo ""

# Count lines
LINE_COUNT=$(wc -l < "$KEY_FILE")
echo "Total lines in key file: $LINE_COUNT"
echo ""

echo "=== How to add this key to GitHub Secrets ==="
echo "1. Copy the ENTIRE key content:"
echo "   cat \"$KEY_FILE\" | pbcopy   (Mac)"
echo "   cat \"$KEY_FILE\" | xclip    (Linux)"
echo "   type \"$KEY_FILE\" | clip   (Windows PowerShell)"
echo ""
echo "2. Go to GitHub → Repository Settings → Secrets and variables → Actions"
echo "3. Click 'New repository secret'"
echo "4. Name: AWS_EC2_DB_SSH_PRIVATE_KEY"
echo "5. Value: Paste the entire key content (Ctrl+V)"
echo "6. Click 'Add secret'"
echo ""
echo "=== Key Content (first and last 2 lines) ==="
head -n 2 "$KEY_FILE"
echo "..."
tail -n 2 "$KEY_FILE"
