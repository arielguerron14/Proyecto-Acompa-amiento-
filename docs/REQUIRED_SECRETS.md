# Required GitHub Repository Secrets

This project deploys multiple services to EC2 and relies on several secrets for CI/CD and runtime configuration. Add the following secrets in your repository Settings → Secrets and variables → Actions.

Required secrets

- `DOCKERHUB_USERNAME` — Docker Hub username used by workflows to tag and push images.
- `DOCKERHUB_TOKEN` — Docker Hub access token or password.
- `EC2_USER` — SSH user for your EC2 instances (e.g., `ubuntu`).
- `EC2_KEY` — Private SSH key content (use newline-preserved value). Example: `-----BEGIN OPENSSH PRIVATE KEY-----\n...`.
- `EC2_CORE_HOST` — Host (IP or DNS) for core services deploy target (used by many workflows).
- `EC2_FRONTEND_HOST` — Host for frontend deploy target (EC2 host that runs the frontend container).
- `EC2_NOTIFICACIONES_HOST` — Host for notifications service deploy target.
- `EC2_REPORTES_HOST` — Host for report services deploy target.
- `API_GATEWAY_URL` — Public URL used by frontend to reach API gateway (e.g., `http://api.example.com` or `http://localhost` in testing).
- `MONGO_URI` — Connection string for MongoDB used by all services (e.g., `mongodb://user:pass@172.31.67.47:27017/authdb?authSource=admin`).
- `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` — Redis connection info if used by your services.

Optional but recommended

- `SENTRY_DSN` — If you use Sentry for error tracking.
- `API_KEYS` or other service-specific secrets used at runtime.

Notes & tips

- Ensure `EC2_KEY` is added as a **secret**, and workflows create the `key.pem` file from it.
- `MONGO_URI` should point to the production/QA Mongo instance reachable from EC2.
- For each EC2 host secret variable, ensure the host value matches the correct instance used by that service's workflow (see workflow top-level checks for missing secrets).
- After adding secrets, re-run the workflows (use `workflow_dispatch` or push a commit) to let deploy steps generate the required env files on the EC2 host.
