# Contributing

Thanks for helping improve CBS Mail.

## What This Project Is

CBS Mail is a Roundcube-based UI reskin and plugin layer. It is not a new mail
server and it does not replace Roundcube's IMAP/SMTP engine.

## Local Setup

1. Copy the example environment:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Copy the example Roundcube config:

   ```powershell
   Copy-Item config\config.inc.example.php config\config.inc.php
   ```

3. Edit `.env` and `config/config.inc.php` for your mail server.

4. Start Roundcube:

   ```powershell
   docker compose up -d
   ```

5. Open `http://127.0.0.1:8090/`.

## Verification

Run these before opening a pull request:

```powershell
node --check plugins\cybrense_skin\cybrense_ui.js
node --check plugins\cybrense_skin\cybrense_pwa.js
php tests\label_store_test.php
npm ci
npm run check:security
npm run check:css
docker compose config --quiet
```

If the container is running:

```powershell
docker exec roundcube php -l /var/www/html/plugins/cybrense_skin/cybrense_skin.php
```

For CSS edits, check the main override files for balanced braces:

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

## Pull Request Guidelines

- Keep changes scoped to one problem.
- Do not commit local config, credentials, mailboxes, database files, logs, or
  deployment secrets.
- Include screenshots for UI changes on desktop and mobile.
- Mention whether the change affects Mail, Contacts, Settings, Login, Compose,
  PWA, labels, or remote-content behavior.

## Branding

Forks should replace the Cybrense/CBS branding assets before public deployment
unless they have permission to use that brand.
