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
Roundcube Docker container with CBS Mail mounts
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

The PWA files are mounted at:

```text
/cybrense-manifest.json
/cybrense-sw.js
```

If users see stale UI after an update, ask them to close and reopen the PWA or
clear the service worker in browser devtools.

## Updating

1. Pull the latest repository changes.
2. Restart the Roundcube container.
3. Hard-refresh the browser or reopen the PWA.
4. Check Roundcube logs for PHP errors.
