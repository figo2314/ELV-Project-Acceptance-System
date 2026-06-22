# Load Testing

Use the production load test against staging or a maintenance window. It exercises the main concurrent paths: login, bootstrap/dashboard data, offline sync, import preview, and media upload.

## Run

```bash
LOAD_API_BASE=https://your-domain.example/api \
LOAD_CONCURRENCY=100 \
LOAD_DURATION_SECONDS=60 \
LOAD_USERNAME=field \
LOAD_PASSWORD='...' \
LOAD_ADMIN_USERNAME=admin \
LOAD_ADMIN_PASSWORD='...' \
npm run load:production
```

The script exits non-zero when any request fails or when p95 latency exceeds `LOAD_MAX_P95_MS` defaulting to `2500`.

## Guidance

- Run against `DATA_STORE=postgres`.
- Use a staging project first, because sync and upload paths intentionally write test data.
- Watch `/api/metrics`, database CPU, memory, disk I/O, and upload storage.
- Increase `LOAD_DURATION_SECONDS` to 300 for a stronger soak test.

## Pass Criteria

Suggested MVP production threshold:

- 0 request errors.
- p95 latency under 2.5 seconds.
- API remains healthy at `/api/ready`.
- Database connections remain below the production pool limit.
- Upload storage does not exceed quota.
