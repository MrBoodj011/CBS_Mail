# Maintenance Guide

## Local Validation

Run these before pushing changes:

```bash
node --check plugins/cybrense_skin/cybrense_ui.js
node --check plugins/cybrense_skin/cybrense_pwa.js
docker compose config --quiet
```

With the container running:

```bash
docker exec roundcube php -l /var/www/html/plugins/cybrense_skin/cybrense_skin.php
```

## CI

GitHub Actions runs:

- JavaScript syntax checks.
- PHP syntax check.
- CSS brace balance check.
- Docker Compose config validation.

Dependabot checks weekly for GitHub Actions updates.

## Release Checklist

1. Ensure `main` is green in CI.
2. Update `CHANGELOG.md`.
3. Create a tag:

   ```bash
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```

4. Create a GitHub release with:
   - highlights,
   - compatibility notes,
   - known limitations,
   - upgrade notes.

## Versioning

Use practical semantic versioning:

- `MAJOR`: breaking setup or compatibility changes.
- `MINOR`: new features or major UI improvements.
- `PATCH`: fixes, docs, and safe polish.

## Public Repo Hygiene

Before publishing or tagging:

- Verify no credentials are committed.
- Keep screenshots free of personal data.
- Keep branding/trademark notes clear.
- Make sure `config/config.inc.php`, `.env`, and `db/` remain ignored.
