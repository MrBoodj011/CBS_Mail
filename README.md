# CBS Mail

CBS Mail is an open-source Roundcube-based webmail experience with a custom
Cybrense/CBS UI skin, plugin layer, mobile-first layout, PWA support, and
browser-side label management.

It is a Roundcube reskin and enhancement layer. It is not a new mail server and
it is not a replacement for Roundcube's IMAP/SMTP engine.

## Built On Roundcube

CBS Mail runs on top of [Roundcube Webmail](https://roundcube.net/), a
browser-based open-source IMAP client. Roundcube remains a separate upstream
project with its own license and copyright notices. Roundcube's license page
states that modern Roundcube releases are GPL-3.0-or-later with exceptions for
skins and plugins: <https://roundcube.net/license/>.

This repository contains the custom overlay files that are mounted into the
official Roundcube Docker image:

- Custom plugin: `plugins/cybrense_skin/`
- Custom Elastic templates: `templates/`
- Branding and PWA assets: `branding/`, `pwa/`
- Docker/local setup examples: `docker-compose.yml`, `config/`

## Features

- Professional Cybrense/CBS branded Roundcube UI.
- Custom desktop app shell with dark sidebar.
- Responsive mobile layout designed for web-app usage.
- PWA manifest, app icons, and service worker.
- Branded login, mail, message view, compose, contacts, and settings screens.
- Clean toolbar and notification styling.
- Browser-side labels, called "Etiquettes" in the UI.
- One-click label add/remove per email.
- Multiple labels per email.
- Account-specific label storage in browser `localStorage`.
- Custom remote-content trust UX for known senders.
- Docker-based local development setup.

## What This Project Is Not

- It is not a mail server.
- It does not store your email messages.
- It does not replace IMAP, SMTP, or Roundcube core.
- It does not provide server-side IMAP labels. The custom labels are frontend
  metadata stored in the browser.

## Repository Structure

```text
.
├── branding/                 # Logos, favicons, PWA icons, watermark
├── config/                   # Public config examples
├── plugins/cybrense_skin/    # Main plugin, CSS, JS, PWA loader
├── pwa/                      # Manifest and service worker
├── templates/                # Customized Roundcube Elastic templates
├── docker-compose.yml        # Local Roundcube container
├── .env.example              # Safe local environment template
├── CONTRIBUTING.md
├── SECURITY.md
├── NOTICE
└── LICENSE
```

## Quick Start

Requirements:

- Docker Desktop or Docker Engine
- Docker Compose

Clone the repository:

```bash
git clone https://github.com/MrBoodj011/CBS_Mail.git
cd CBS_Mail
```

Create local config files:

```bash
cp .env.example .env
cp config/config.inc.example.php config/config.inc.php
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
Copy-Item config\config.inc.example.php config\config.inc.php
```

Edit `.env` and `config/config.inc.php` for your IMAP/SMTP server.

Generate a unique 24-character Roundcube DES key and set it in
`config/config.inc.php`:

```php
$config['des_key'] = 'CHANGE_ME_24_CHAR_SECRET';
```

Start the app:

```bash
docker compose up -d
```

Open:

```text
http://127.0.0.1:8090/
```

## Configuration

The real local config is intentionally ignored by Git:

- `config/config.inc.php`
- `config/config.docker.inc.php`
- `.env`
- `db/`
- `scratch/`

The public examples are safe to commit:

- `.env.example`
- `config/config.inc.example.php`

Default Docker environment variables:

```env
ROUNDCUBEMAIL_DEFAULT_HOST=ssl://imap.example.com
ROUNDCUBEMAIL_DEFAULT_PORT=993
ROUNDCUBEMAIL_SMTP_SERVER=ssl://smtp.example.com
ROUNDCUBEMAIL_SMTP_PORT=465
```

## Docker Mounts

The Compose setup mounts this repository into the Roundcube container:

```yaml
- ./db:/var/www/html/db
- ./config/config.inc.php:/var/www/html/config/config.inc.php
- ./branding:/var/www/html/skins/elastic/branding
- ./branding/watermark.html:/var/www/html/skins/elastic/watermark.html
- ./config/elastic-meta.json:/var/www/html/skins/elastic/meta.json
- ./pwa/cybrense-manifest.json:/var/www/html/skins/elastic/cybrense-manifest.json
- ./pwa/cybrense-manifest.json:/var/www/html/public_html/cybrense-manifest.json
- ./pwa/cybrense-sw.js:/var/www/html/public_html/cybrense-sw.js
- ./templates:/var/www/html/skins/elastic/templates
- ./plugins/cybrense_skin:/var/www/html/plugins/cybrense_skin
```

## Custom Plugin

Main file:

```text
plugins/cybrense_skin/cybrense_skin.php
```

The plugin:

- Loads the custom CSS and JS files.
- Adds PWA metadata and service worker environment values.
- Adds branded favicon and app icon metadata.
- Handles trusted remote-content senders.
- Hooks into Roundcube `message_check_safe`.
- Registers `plugin.cybrense_trust_sender`.

Loaded CSS:

- `cybrense_ui.css`
- `cybrense_mobile.css`
- `cybrense_compact.css`
- `cybrense_labels.css`
- `cybrense_login.css`

Loaded JS:

- `cybrense_ui.js`
- `cybrense_pwa.js`

Roundcube serves these assets through `static.php`, for example:

```text
/static.php/plugins/cybrense_skin/cybrense_ui.js
```

## Labels / Etiquettes

CBS Mail adds a frontend label system:

- Default labels:
  - Cybrense Team
  - Securite
  - Projets
  - Facturation
  - Archive
- Add labels.
- Delete labels.
- Assign or remove labels with one click.
- Assign multiple labels to one email.
- Filter the message list by label.
- Show label counts in the sidebar.

Storage note:

```text
cybrense.labels.v1.<account-email>
```

Labels are stored per account in the browser. Clearing browser storage can
remove these custom labels.

## Remote Content Trust

Roundcube blocks remote resources by default for privacy. CBS Mail keeps that
privacy model and adds a branded trust flow for known senders.

Trusted sender data is account-specific. Trusted domains and default trusted
senders can be configured in `config/config.inc.php`.

## PWA

Files:

- `pwa/cybrense-manifest.json`
- `pwa/cybrense-sw.js`
- `plugins/cybrense_skin/cybrense_pwa.js`

The service worker is intentionally lightweight:

- Network-first.
- No aggressive UI caching.
- Simple offline response if the network fails.

If you change JS/CSS and the browser still shows the old UI, hard-refresh the
page. For an installed PWA, close and reopen the app or clear the service
worker from browser devtools.

## Development Checks

JavaScript syntax:

```bash
node --check plugins/cybrense_skin/cybrense_ui.js
node --check plugins/cybrense_skin/cybrense_pwa.js
```

Docker Compose config:

```bash
docker compose config --quiet
```

PHP syntax, after the container is running:

```bash
docker exec roundcube php -l /var/www/html/plugins/cybrense_skin/cybrense_skin.php
```

CSS brace check:

```bash
node - <<'NODE'
const fs = require('fs');
const files = [
  'plugins/cybrense_skin/cybrense_ui.css',
  'plugins/cybrense_skin/cybrense_mobile.css',
  'plugins/cybrense_skin/cybrense_compact.css',
  'plugins/cybrense_skin/cybrense_labels.css',
  'plugins/cybrense_skin/cybrense_login.css'
];
for (const file of files) {
  const css = fs.readFileSync(file, 'utf8');
  let depth = 0;
  let min = 0;
  for (const ch of css) {
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    if (depth < min) min = depth;
  }
  console.log(`${file}: depth=${depth}, min=${min}`);
  if (depth !== 0 || min < 0) process.exitCode = 1;
}
NODE
```

PowerShell version:

```powershell
@'
const fs = require('fs');
const files = [
  'plugins/cybrense_skin/cybrense_ui.css',
  'plugins/cybrense_skin/cybrense_mobile.css',
  'plugins/cybrense_skin/cybrense_compact.css',
  'plugins/cybrense_skin/cybrense_labels.css',
  'plugins/cybrense_skin/cybrense_login.css'
];
for (const file of files) {
  const css = fs.readFileSync(file, 'utf8');
  let depth = 0;
  let min = 0;
  for (const ch of css) {
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    if (depth < min) min = depth;
  }
  console.log(`${file}: depth=${depth}, min=${min}`);
  if (depth !== 0 || min < 0) process.exitCode = 1;
}
'@ | node -
```

## Open-Source Notes

- This project is transparent about being a Roundcube-based reskin and plugin
  layer.
- Roundcube and adapted Roundcube/Elastic assets remain under their original
  notices.
- The custom code is released under GPL-3.0-or-later. See `LICENSE`.
- Cybrense/CBS logos and trademarks are not a grant of trademark rights. See
  `NOTICE`.
- Forks for other organizations should replace the branding, product name, PWA
  metadata, and default trusted sender/domain settings.

## Contributing

See `CONTRIBUTING.md`.

## Security

See `SECURITY.md`.
