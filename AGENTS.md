# ELV Project Acceptance Codex Guide

Scope: this file applies to the whole repository.

## Project Snapshot

- Product: offline-first ELV/BMS project acceptance and field inspection web app.
- Frontend: Vite app in `src/`, static output in `dist/`.
- Backend: Express API in `server/index.js`.
- Database paths: JSON development data in `data/`; PostgreSQL/Prisma support in `prisma/` and deployment docs.
- Local web port: `5188`.
- Local API port: `4177`.

## Safety Rules

- Do not read, print, summarize, or commit secrets. Treat `.env*`, `SERVER PASS.txt`, staging credential files, database URLs, tokens, cookies, and private keys as sensitive.
- Do not remove IIS or reverse-proxy config such as `dist/web.config` during deploy.
- Do not overwrite BMS PM WEB ports or service state on shared servers.
- Do not change production/staging data, uploads, backups, or services unless the user explicitly asks for deployment or maintenance work.
- The working tree may be dirty. Do not revert unrelated changes.

## Common Commands

```powershell
npm.cmd run dev
npm.cmd run build
npm.cmd run smoke:postgres
npm.cmd run smoke:permissions
```

Database commands:

```powershell
npm.cmd run db:generate
npm.cmd run db:migrate
npm.cmd run db:seed:json
```

Production helpers:

```powershell
npm.cmd run backup:production
npm.cmd run restore:production
npm.cmd run load:production
```

If system `node` or `npm` is unavailable in Codex Desktop, use the bundled Node runtime from `codex_app.load_workspace_dependencies` and avoid reinstalling dependencies when `node_modules/` is already present.

## Deployment Checklist

- Confirm target URL, server, ports, and whether the task is staging or production.
- Confirm current API health before changes.
- Build locally.
- Copy only intended frontend/backend files.
- Preserve reverse-proxy config.
- Smoke test `/api/ready`, login, bootstrap/data loading, and the changed workflow.
- If credentials are needed, use existing local secure files or clipboard patterns. Do not paste passwords into chat.

## UI Verification

- Use browser verification for layout changes when available.
- Test both desktop and mobile/field views for Field workflow changes.
- Do not treat unauthenticated `401` as API offline. Check `/api/ready` separately.

## Handoff

When finishing a change, report:

- Files changed.
- Build/smoke tests run.
- URL verified.
- Remaining risk.
- Whether a commit was created.
