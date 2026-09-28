# Staging Deployment Blockers — Resolved

## Initial Blocked Attempt

The first deployment attempt on 2026-09-28 could not proceed because this workstation had no network path to `192.168.120.11`. The blocker is now resolved: the `以太網 2` adapter is connected, and the staging server is reachable.

- Checked on: 2026-09-28 (Asia/Shanghai)
- Source commit: `6e00048` (`Add Codex project guidance`)
- Local `main` is 6 commits ahead of `origin/main`; the build was made from local `main`.
- Local Vite production build: passed
- TCP checks to `192.168.120.11`: ports 80, 443, 445, 4177, 8088, and 8443 all failed
- Port 4177 is intentionally blocked from direct LAN access in the existing staging design; the staging web ports 8088/8443 and deployment share 445 are also unreachable.
- The route for `192.168.120.0/24` points to the disconnected `以太网 2` adapter
- Tailscale is running, but no peer advertises a route to this subnet and no server peer matched `TRACERES1`
- No files, services, ports, or data on the server were changed during this first attempt

## Resolution

- Staging HTTP/HTTPS and deployment share became reachable later on 2026-09-28.
- `/api/ready` returned 200 over both staging URLs; admin login and authenticated bootstrap passed.
- Served asset names and SHA-256 hashes for the application source files matched the local build. No copy or service restart was needed.
- Current verification is recorded in `DEPLOYMENT_REPORT.md`.

At the time of the first blocked attempt, the deployment report only provided historical server health from 2026-06-23. The later verification on 2026-09-28 is recorded in `DEPLOYMENT_REPORT.md`.
