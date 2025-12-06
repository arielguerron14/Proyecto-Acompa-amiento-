Run the integration test for auth (login -> verify -> logout -> verify)

Prerequisites:
- Node.js installed
- `micro-auth` and `api-gateway` services available locally

Start services (PowerShell):

```powershell
# Start micro-auth (background)
cd 'c:\Users\caguerronp\Documents\GitHub\Proyecto-Acompa-amiento-\micro-auth'
Start-Process -FilePath node -ArgumentList 'src/app.js' -WorkingDirectory (Get-Location) -WindowStyle Hidden

# Start api-gateway (background)
cd 'c:\Users\caguerronp\Documents\GitHub\Proyecto-Acompa-amiento-\api-gateway'
Start-Process -FilePath node -ArgumentList 'server.js' -WorkingDirectory (Get-Location) -WindowStyle Hidden
```

Run test (PowerShell):

```powershell
cd 'c:\Users\caguerronp\Documents\GitHub\Proyecto-Acompa-amiento-\micro-auth'
node scripts/logout_verify_test.js
```

Notes:
- The gateway middleware delegates session validation to `micro-auth` by calling `/auth/verify-token`.
- For production, set `JWT_SECRET` and `REFRESH_SECRET` via environment variables and use a shared session store (Redis) instead of the in-memory cache.
