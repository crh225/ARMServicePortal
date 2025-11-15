# Cloud Self-Service Backend

Node/Express API that exposes:

- `GET /api/health` – health check
- `GET /api/catalog` – list available blueprints
- `POST /api/provision` – create a GitHub PR that adds a Terraform module file
  under `infra/environments/{env}/requests/*.tf` in the same repo.

## Env Vars

- `GITHUB_APP_ID`
- `GITHUB_INSTALLATION_ID`
- `GITHUB_APP_PRIVATE_KEY` or `GITHUB_APP_PRIVATE_KEY_BASE64`
- `GITHUB_INFRA_OWNER` – GitHub user/org that owns the repo
- `GITHUB_INFRA_REPO` – name of the monorepo (e.g. `cloud-self-service-monorepo`)

## Run locally

```bash
cd portal/backend
npm install
npm run dev
```
