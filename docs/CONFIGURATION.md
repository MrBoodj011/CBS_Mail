# Configuration Reference

CBS Mail is configured through Roundcube's normal configuration file plus a few
Docker environment values used by the local development setup.

## Local Files

Create local files from the safe templates:

```bash
cp .env.example .env
cp config/config.inc.example.php config/config.inc.php
```

PowerShell:

```powershell
Copy-Item .env.example .env
Copy-Item config\config.inc.example.php config\config.inc.php
```

Never commit:

```text
.env
config/config.inc.php
config/config.docker.inc.php
db/
scratch/
```

## Docker Environment

`.env.example` contains:

```env
ROUNDCUBEMAIL_DEFAULT_HOST=ssl://imap.example.com
ROUNDCUBEMAIL_DEFAULT_PORT=993
ROUNDCUBEMAIL_SMTP_SERVER=ssl://smtp.example.com
ROUNDCUBEMAIL_SMTP_PORT=465
ROUNDCUBEMAIL_TRUSTED_HOST=mail.example.com
CBS_MAIL_HTTP_PORT=8090
CBS_MAIL_CONTAINER_NAME=roundcube
CYBRENSE_ENABLE_MANAGESIEVE=false
CYBRENSE_MANAGESIEVE_HOST=mail.example.com
CYBRENSE_MANAGESIEVE_PORT=4190
```

These values are used by `docker-compose.yml`.

`CBS_MAIL_HTTP_PORT` changes only the localhost port exposed to a reverse
proxy. `CBS_MAIL_CONTAINER_NAME` lets an existing deployment retain a stable
operational name during upgrades.

## Roundcube Config

`config/config.inc.example.php` is the public template. Copy it to
`config/config.inc.php` and change:

```php
$config['imap_host'] = 'ssl://imap.example.com:993';
$config['smtp_host'] = 'ssl://smtp.example.com:465';
$config['des_key'] = 'CHANGE_ME_24_CHAR_SECRET';
```

`des_key` must be unique per deployment and 24 characters long.

The public config accepts the official Docker variables
(`ROUNDCUBEMAIL_DEFAULT_HOST`, `ROUNDCUBEMAIL_DEFAULT_PORT`,
`ROUNDCUBEMAIL_SMTP_SERVER`, and `ROUNDCUBEMAIL_SMTP_PORT`). Optional direct
`ROUNDCUBEMAIL_IMAP_HOST` / `ROUNDCUBEMAIL_SMTP_HOST` values are useful only
outside the official Docker entrypoint. SQLite is stored under
`/var/roundcube/db`, which is the official image path and the persisted `./db`
mount.

Keep HTTPS enabled and use `Lax` session cookies for defense-in-depth against
cross-site request contexts:

```php
$config['force_https'] = true;
$config['use_https'] = true;
$config['session_samesite'] = 'Lax';
```

## Plugins

CBS Mail expects the custom plugin to be enabled:

```php
$config['plugins'] = ['archive', 'zipdownload', 'password', 'filesystem_attachments', 'newmail_notifier', 'cybrense_skin'];
```

Adjust the plugin list for your own Roundcube installation if some default
plugins are unavailable.

## Browser Notifications

CBS Mail uses Roundcube's maintained `newmail_notifier` plugin. Basic new-mail
indication is enabled by default. Desktop and sound notifications are opt-in per
account under `Settings > Preferences > Mailbox`; the browser must also grant
notification permission to the site. Production notification permission
requires HTTPS.

## ManageSieve

Set `CYBRENSE_ENABLE_MANAGESIEVE=true` only when the mail server exposes a
working ManageSieve endpoint. This adds server-side filters and vacation
responses to Roundcube. It does not implement those features inside CBS Mail.
See [Mail Server And Administration](MAIL_SERVER_ADMIN.md).

## Remote Content

Remote resources should stay blocked by default unless a sender is trusted.

Configurable defaults:

```php
$config['show_images'] = 3;

$config['cybrense_remote_content_trusted_domains'] = [
    'mattermost.com',
    'slack.com',
    'github.com',
];

$config['cybrense_remote_content_trusted_senders'] = [
    // 'noreply@example.com',
];
```

Users can also trust senders from the UI. Those preferences are stored through
Roundcube user preferences.

## Labels / Etiquettes

The custom label system is stored per signed-in account in Roundcube user
preferences. A browser cache keeps interactions immediate and supports automatic
migration from the original browser-only implementation.

Storage format:

```text
cybrense.labels.v1.<account-email>
```

Clearing browser storage no longer removes synchronized labels. Labels are CBS
Mail metadata, not IMAP keywords, so they are available to CBS Mail on another
browser but not to unrelated IMAP clients.

## PWA

PWA files are baked into the CBS Mail image and served at:

```text
/cybrense-manifest.json
/cybrense-sw.js
/offline.html
```

The service worker is network-first. It caches only the offline page, manifest,
logo, and app icons. Authenticated Roundcube pages, API responses, attachments,
and message bodies are never written to Cache Storage.
