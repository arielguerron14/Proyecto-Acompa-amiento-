# 📍 IP Management - Single Source of Truth

## 概要

All IP addresses in this project are **consumed from `config/instance_ips.json`**, which is the single source of truth.

Instead of hardcoding IPs in multiple files, use these automated processes:

## 🔄 Automatic IP Synchronization

### Option 1: Automated Sync (Recommended)
```bash
python3 sync-ips-to-config.py
```

This script:
- Reads all IPs from `config/instance_ips.json`
- Updates all configuration files automatically
- Commits changes to git
- Pushes to remote

### Option 2: Manual Regeneration
```bash
python3 generate-configs-from-ips.py
```

This only generates files (no git commit).

## 📂 Files that Consume from `config/instance_ips.json`

### Configuration Files (Auto-generated)
- `.env.generated` - Environment variables for all services
- `.env.prod.frontend` - Frontend production configuration
- `docker-compose.frontend.yml` - Frontend Docker composition

### Scripts that Read from Config
- `create-env-files.py` - Creates .env files on EC2-CORE instance
- `sync-ips-to-config.py` - Synchronizes all configs from instance_ips.json

### JavaScript Modules
- `infrastructure.config.from-json.js` - Node.js config that reads from instance_ips.json

## 🔧 Workflow

### When EC2 IPs Change

1. **AWS auto-allocates new IPs** (instance restart/rebalance)

2. **Update `config/instance_ips.json`** with new IPs:
   ```json
   {
       "EC2-API-Gateway": {
           "PublicIpAddress": "NEW_IP_HERE",
           "PrivateIpAddress": "NEW_PRIVATE_IP_HERE"
       }
   }
   ```

3. **Run synchronization**:
   ```bash
   python3 sync-ips-to-config.py
   ```

4. **All configs automatically updated** ✨

## 📊 Current Instance IPs

To view current IPs from the source of truth:

```bash
cat config/instance_ips.json | jq
```

Or from Node.js:
```javascript
const config = require('./infrastructure.config.from-json.js');
console.log(config.getSummary());
```

## 🚫 What NOT to Do

❌ Don't edit these files manually:
- `.env.generated`
- `.env.prod.frontend`
- `docker-compose.frontend.yml`

❌ Don't hardcode IPs in code

✅ **Always update `config/instance_ips.json` first, then run sync!**

## 📝 Example: Updating API Gateway IP

1. Update JSON:
   ```bash
   # Edit config/instance_ips.json
   "EC2-API-Gateway": {
       "PublicIpAddress": "35.168.216.132"  # ← new IP
   }
   ```

2. Sync:
   ```bash
   python3 sync-ips-to-config.py
   ```

3. Result:
   - `.env.generated` → Updated
   - `.env.prod.frontend` → Updated
   - `docker-compose.frontend.yml` → Updated
   - All changes committed to git

## 🔗 Related Files

- `config/instance_ips.json` - **Single source of truth**
- `generate-configs-from-ips.py` - One-time generator
- `sync-ips-to-config.py` - Sync + git commit
- `infrastructure.config.from-json.js` - Node.js runtime loader

---

**Remember**: All IPs flow from `config/instance_ips.json` → No more hardcoded IPs!
