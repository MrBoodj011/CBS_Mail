# Deployment Guide

This guide describes a generic production deployment pattern for CBS Mail. Do
not commit production credentials or server-specific secrets.

## Recommended Production Shape

```text
Internet
  |
  v
HTTPS reverse proxy
  |
  v
Digest-pinned Roundcube image with the CBS Mail overlay
  |
  +--> IMAP server
  +--> SMTP server
```

## Production Checklist

- Use HTTPS.
- Generate a unique 24-character Roundcube `des_key`.
- Keep `config/config.inc.php` out of Git.
- Keep `.env` out of Git.
- Set `ROUNDCUBEMAIL_TRUSTED_HOST` to the public webmail hostname.
- Use a real IMAP/SMTP server with TLS.
- Restrict the container port to localhost when using a reverse proxy.
- Back up Roundcube database/storage if using local SQLite.
- Confirm `docker compose ps` reports the container as healthy.
- Review trusted remote-content domains before deployment.
- Replace branding if deploying a fork for another organization.

## Reverse Proxy Notes

Roundcube should receive the correct external scheme and host from the proxy.
Set standard forwarding headers such as:

```text
X-Forwarded-Proto
X-Forwarded-Host
X-Real-IP
```

Use the hardened example in `deploy/nginx-devmail.conf.example` as a starting
point. It adds HSTS, content-type sniffing protection, a strict referrer policy,
permissions restrictions, and a conservative CSP without blocking Roundcube's
message and editor frames.

## PWA Notes

The PWA files are baked into the image and served at:

```text
/cybrense-manifest.json
/cybrense-sw.js
/offline.html
```

If users see stale UI after an update, ask them to close and reopen the PWA or
clear the service worker in browser devtools.

## Updating

1. Create a backup with `./deploy/backup.sh`.
2. Pull the latest repository changes.
3. Rebuild and restart with `docker compose up -d --build`.
4. Run `./deploy/check-health.sh https://mail.example.com`.
5. Check `docker compose logs --tail=200 roundcube` for PHP errors.
6. Hard-refresh the browser or reopen the PWA.

## Backups

The backup script archives `.env`, `config/config.inc.php`, and `db/` with
owner-only permissions:

```bash
./deploy/backup.sh
```

Use `CYBRENSE_BACKUP_RETENTION` to change the default 14-day cleanup window.
Backups contain secrets and user preferences; store them encrypted and outside
the public web root.

## Health Check

Docker checks for the actual Roundcube login form every 30 seconds instead of
accepting any HTTP 200 response. For an
external smoke test, run:

```bash
./deploy/check-health.sh https://mail.example.com
```

The external check also validates the expected manifest and offline-page
content, so branded error pages cannot produce a false healthy result.
