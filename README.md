<p align="center">
  <a href="https://github.com/MrBoodj011/CBS_Mail">
    <img src="docs/assets/readme-header.png" alt="CBS Mail - Roundcube-based webmail UI" width="100%">
  </a>
</p>

<h1 align="center">CBS Mail</h1>

<p align="center">
  A modern, mobile-ready Roundcube webmail experience with a custom Cybrense/CBS
  UI skin, plugin layer, PWA support, and browser-side label management.
</p>

<p align="center">
  <a href="https://github.com/MrBoodj011/CBS_Mail/blob/main/LICENSE"><img alt="License: GPL-3.0" src="https://img.shields.io/badge/license-GPL--3.0--or--later-blue"></a>
  <a href="https://roundcube.net/"><img alt="Built on Roundcube" src="https://img.shields.io/badge/built%20on-Roundcube-0b72ff"></a>
  <a href="https://cybrense.com/"><img alt="Cybrense website" src="https://img.shields.io/badge/website-cybrense.com-061d3a"></a>
  <img alt="Docker" src="https://img.shields.io/badge/docker-ready-2496ed">
  <img alt="PWA" src="https://img.shields.io/badge/PWA-enabled-1b7cff">
  <img alt="Mobile" src="https://img.shields.io/badge/mobile-ready-13b981">
</p>

<p align="center">
  <a href="#why-cbs-mail">Why</a>
  |
  <a href="#features">Features</a>
  |
  <a href="#quick-start">Quick Start</a>
  |
  <a href="#architecture">Architecture</a>
  |
  <a href="#brand">Brand</a>
  |
  <a href="#open-source-and-credits">Credits</a>
</p>

---

## Why CBS Mail

Roundcube is powerful and reliable, but its default interface can feel dated for
teams that want a branded, app-like webmail experience. CBS Mail keeps
Roundcube as the mail engine and adds a polished interface layer on top:

- a clean Cybrense/CBS visual identity,
- a responsive desktop and mobile shell,
- a PWA-friendly app experience,
- a custom labels workflow,
- and a branded remote-content trust flow.

CBS Mail is intentionally transparent: this is a Roundcube-based reskin and
enhancement layer, not a mail server and not a from-scratch email client.

## UI Coverage

The repository includes the full UI overlay used by the app:

| Area | What CBS Mail changes |
| --- | --- |
| Login | Centered branded login with responsive sizing |
| Mail | Three-panel webmail layout, polished cards, dates, labels, flags |
| Message view | Branded sender card, label controls, body card, remote-content warning |
| Compose | Clean form layout, attachment/options panel, branded send action |
| Contacts & Settings | Shared sidebar/app-shell styling |
| Mobile | Drawer navigation, tappable mail cards, PWA-friendly viewport behavior |

## Features

### Interface

- Branded Roundcube Elastic UI overlay.
- Dark Cybrense/CBS sidebar and app shell.
- Professional toolbar and notification styling.
- Consistent Mail, Contacts, Settings, Login, Compose, and message views.
- Clean mobile layout for phone-sized screens.

### Labels / Etiquettes

- Browser-side labels per account.
- One-click assign/remove behavior.
- Multiple labels on one email.
- Sidebar label filtering and counts.
- Label badges in message list and message view.

Default labels:

```text
Cybrense Team
Securite
Projets
Facturation
Archive
```

Storage key format:

```text
cybrense.labels.v1.<account-email>
```

### PWA

- Static web app manifest.
- App icons and Apple touch icon.
- Lightweight service worker.
- Network-first behavior to avoid stale UI cache.

### Privacy And Remote Content

Roundcube blocks remote resources for privacy. CBS Mail keeps that model and
adds a branded trust flow for known senders and trusted domains.

Trusted sender data is account-specific. Default trusted senders/domains can be
configured in `config/config.inc.php`.

## What This Project Is Not

- Not a mail server.
- Not a replacement for IMAP or SMTP.
- Not a fork of Roundcube core.
- Not server-side IMAP labels. Labels are frontend metadata stored in the
  browser.

## Quick Start

Requirements:

- Docker Desktop or Docker Engine
- Docker Compose

Clone:

```bash
git clone https://github.com/MrBoodj011/CBS_Mail.git
cd CBS_Mail
```

Create local config:

```bash
cp .env.example .env
cp config/config.inc.example.php config/config.inc.php
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
Copy-Item config\config.inc.example.php config\config.inc.php
```

Edit `.env` and `config/config.inc.php` for your IMAP/SMTP server.

Set a unique 24-character Roundcube DES key:

```php
$config['des_key'] = 'CHANGE_ME_24_CHAR_SECRET';
```

Start:

```bash
docker compose up -d
```

Open:

```text
http://127.0.0.1:8090/
```

## Configuration

The real local config is ignored by Git:

```text
.env
config/config.inc.php
config/config.docker.inc.php
db/
scratch/
```

Safe templates included in the repository:

```text
.env.example
config/config.inc.example.php
```

Default Docker values:

```env
ROUNDCUBEMAIL_DEFAULT_HOST=ssl://imap.example.com
ROUNDCUBEMAIL_DEFAULT_PORT=993
ROUNDCUBEMAIL_SMTP_SERVER=ssl://smtp.example.com
ROUNDCUBEMAIL_SMTP_PORT=465
```

## Architecture

CBS Mail mounts custom files into the official Roundcube container.

```mermaid
flowchart LR
    User["Browser / PWA"] --> Roundcube["Roundcube Docker Container"]
    Roundcube --> IMAP["IMAP Server"]
    Roundcube --> SMTP["SMTP Server"]

    subgraph Overlay["CBS Mail Overlay"]
        Plugin["cybrense_skin plugin"]
        CSS["Custom CSS"]
        JS["Custom JS"]
        Templates["Elastic templates"]
        Branding["Logos / Icons / PWA assets"]
    end

    Overlay --> Roundcube
```

Main paths:

```text
.
|-- branding/                 # Logos, favicons, PWA icons, watermark
|-- config/                   # Public config examples
|-- plugins/cybrense_skin/    # Plugin, CSS, JS, PWA loader
|-- pwa/                      # Manifest and service worker
|-- templates/                # Customized Roundcube Elastic templates
|-- docker-compose.yml        # Local Roundcube container
|-- .env.example              # Safe local environment template
|-- CONTRIBUTING.md
|-- SECURITY.md
|-- NOTICE
`-- LICENSE
```

Docker mounts:

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

Main plugin:

```text
plugins/cybrense_skin/cybrense_skin.php
```

The plugin:

- loads custom CSS and JavaScript,
- injects PWA metadata,
- registers branded favicon/app icons,
- syncs trusted remote senders to the frontend,
- hooks into Roundcube `message_check_safe`,
- registers `plugin.cybrense_trust_sender`.

Loaded styles:

```text
cybrense_ui.css
cybrense_mobile.css
cybrense_compact.css
cybrense_labels.css
cybrense_login.css
```

Loaded scripts:

```text
cybrense_ui.js
cybrense_pwa.js
```

Roundcube serves plugin assets through `static.php`:

```text
/static.php/plugins/cybrense_skin/cybrense_ui.js
```

## Brand

CBS Mail uses the Cybrense/CBS visual identity across the webmail shell:

- Header and README artwork: `docs/assets/readme-header.png`
- Product logos, favicons, and PWA icons: `branding/`

Official Cybrense website:

```text
https://cybrense.com/
```

## Development Checks

JavaScript:

```bash
node --check plugins/cybrense_skin/cybrense_ui.js
node --check plugins/cybrense_skin/cybrense_pwa.js
```

Docker Compose:

```bash
docker compose config --quiet
```

PHP, after the container is running:

```bash
docker exec roundcube php -l /var/www/html/plugins/cybrense_skin/cybrense_skin.php
```

CSS brace sanity check:

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

## Cache Notes

If the browser keeps showing old UI after CSS/JS changes:

1. Hard refresh the page.
2. For installed PWA mode, close and reopen the app.
3. If needed, unregister the service worker in browser devtools.

The service worker is deliberately network-first, so it should not aggressively
cache old interface files.

## Open Source And Credits

CBS Mail is built on top of [Roundcube Webmail](https://roundcube.net/).
Roundcube remains under its own upstream license. See:

- <https://roundcube.net/>
- <https://roundcube.net/license/>

Unless a file states otherwise, custom source code and documentation in this
repository are released under GPL-3.0-or-later. See `LICENSE`.

Branding note:

- The Cybrense/CBS names, logos, and visual assets are included so the interface
  works as designed.
- They are not a grant of trademark rights.
- Forks for other organizations should replace the branding, product name, PWA
  metadata, and default trusted sender/domain settings.

See `NOTICE` for details.

## Contributing

Contributions are welcome. See `CONTRIBUTING.md`.

## Security

Please do not open public issues for exploitable security problems. See
`SECURITY.md`.
