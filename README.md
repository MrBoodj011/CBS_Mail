# Cybrense Mail - Roundcube Custom UI

Date: 2026-07-10

This project is a customized Roundcube webmail instance branded for Cybrense IT Services. The goal was to replace the old/default Roundcube interface with a professional, responsive, app-like UI for desktop and mobile.

## Main Goal

- Keep Roundcube as the mail engine.
- Brand the full interface as Cybrense Mail.
- Make the UI look like a modern web app, not the old Roundcube UI.
- Make Mail, Contacts, Settings, Login, Compose, message view, labels, toolbars, notifications, and mobile layout consistent.
- Prepare the interface to work nicely as a mobile/PWA web app.

## Project Structure

Important folders/files:

- `docker-compose.yml`
  - Runs Roundcube on `http://127.0.0.1:8090/`.
  - Mounts local config, branding, templates, plugin, and PWA files into the container.

- `config/config.inc.php`
  - Roundcube configuration.
  - Enables the custom plugin and mail server settings.

- `plugins/cybrense_skin/`
  - Main custom plugin and UI logic.
  - This is where most of the work is.

- `branding/`
  - Cybrense logos, favicon, PWA icons, watermark.

- `pwa/`
  - Static manifest and service worker for web app support.

- `templates/`
  - Customized Elastic templates for Roundcube screens.

## Custom Plugin

Plugin file:

- `plugins/cybrense_skin/cybrense_skin.php`

What it does:

- Loads the custom CSS files:
  - `cybrense_ui.css`
  - `cybrense_mobile.css`
  - `cybrense_compact.css`
  - `cybrense_labels.css`
  - `cybrense_login.css`
- Loads the custom JS files:
  - `cybrense_ui.js`
  - `cybrense_pwa.js`
- Applies PWA headers:
  - manifest
  - favicon
  - apple touch icon
  - theme colors
  - web app metadata
- Handles trusted remote-content senders.
- Uses `message_check_safe` to allow remote resources for trusted senders/domains/contacts.
- Adds the action `plugin.cybrense_trust_sender` for trusting a sender from the UI.

## Branding

Branding files:

- `branding/logo_dark.png`
- `branding/logo_white.png`
- `branding/favicon-cybrense.png`
- `branding/favicon-cybrense.ico`
- `branding/apple-touch-icon.png`
- `branding/pwa-icon-192.png`
- `branding/pwa-icon-512.png`
- `branding/watermark.html`

What was changed:

- Professional Cybrense favicon added.
- Login logo changed to black/dark logo.
- Browser tab, PWA icons, and app metadata use Cybrense branding.
- Old/default Roundcube visual identity is hidden or replaced.

## Login Page

Main file:

- `plugins/cybrense_skin/cybrense_login.css`

What was fixed:

- The login page was visually too low and not centered.
- Elastic/Roundcube was leaving old `top` offsets on `#logo` and `#login-form`.
- A final reset removes those offsets.
- Logo + form now behave as one centered block.
- Desktop and mobile login were checked for:
  - no horizontal overflow
  - no vertical overflow on mobile
  - centered group in viewport

Important final block:

- `Final login alignment reset`

## Sidebar

Main files:

- `plugins/cybrense_skin/cybrense_labels.css`
- `plugins/cybrense_skin/cybrense_ui.css`
- `plugins/cybrense_skin/cybrense_ui.js`

What was changed:

- Dark Cybrense sidebar added.
- Sidebar is applied globally to Mail, Contacts, and Settings.
- Contacts/Addressbook no longer falls back to a broken icon-only rail on desktop.
- Logout button is styled as a full branded button.
- Extra old sidebar cards like usage/storage/protection were removed/hidden where requested.
- Sidebar footer keeps the clean logout action.
- Mobile sidebar opens as a drawer instead of staying broken or invisible.

Important final blocks:

- `Final global app sidebar`
- `Final global mobile drawer`

## Top Bars And Toolbars

Main files:

- `plugins/cybrense_skin/cybrense_labels.css`
- `plugins/cybrense_skin/cybrense_ui.css`

What was fixed:

- Top toolbar icons were misaligned.
- Some icons looked too small or too high.
- Broken split-button arrows remained visible.
- Message action toolbar now uses clean pill styling.
- Icons are centered vertically and horizontally.
- Disabled arrows/dropdown fragments for reply/reply-all/forward are hidden.
- Buttons have stable sizes so the toolbar does not jump.

Important final blocks:

- `Final message action toolbar polish`
- `Final message toolbar alignment`

## Mail List

Main files:

- `plugins/cybrense_skin/cybrense_ui.js`
- `plugins/cybrense_skin/cybrense_ui.css`
- `plugins/cybrense_skin/cybrense_mobile.css`
- `plugins/cybrense_skin/cybrense_labels.css`

What was changed:

- Mail rows were converted into cleaner card-like rows.
- Sender, subject, labels, flags, unread state, and date were restyled.
- Date is always visible.
- Date format was changed to `DD/MM/YY`.
- Time-only display such as `13:30` was replaced by date when needed.
- Hover-only date behavior was removed.
- Flag indicator was made more visible.
- Unread/read states were adjusted to be easier to distinguish.
- Row layout was tuned for desktop and mobile.

## Labels / Etiquettes

Main files:

- `plugins/cybrense_skin/cybrense_ui.js`
- `plugins/cybrense_skin/cybrense_labels.css`

What was added:

- Custom label system in the UI.
- Default labels:
  - Cybrense Team
  - Securite
  - Projets
  - Facturation
  - Archive
- Ability to add labels.
- Ability to delete labels.
- Ability to assign/remove labels to a message with one click.
- Ability to assign more than one label to the same email.
- Label count display in the sidebar.
- Label filtering from the sidebar.
- Label UI in message view and list view.

Important note:

- Labels are stored per account in browser `localStorage`.
- Store key format:
  - `cybrense.labels.v1.<email>`
- This means each account has its own labels.
- These labels are frontend metadata, not IMAP server-side labels.

## Message View

Main files:

- `plugins/cybrense_skin/cybrense_ui.css`
- `plugins/cybrense_skin/cybrense_labels.css`
- `plugins/cybrense_skin/cybrense_ui.js`

What was changed:

- Message header card restyled.
- Subject, sender, details, headers, and raw text links cleaned.
- Message body placed in a clean white box.
- Labels block redesigned.
- Remote content warning branded.
- Toast notifications branded.
- Old-looking Roundcube UI parts hidden or restyled.

Remote content:

- The warning "remote resources blocked" was restyled.
- The backend can trust senders through plugin preferences.
- Known/trusted senders can be allowed through the custom plugin logic.

## Compose Page

Main files:

- `templates/compose.html`
- `plugins/cybrense_skin/cybrense_ui.css`

What was changed:

- Compose page restyled to match the Cybrense UI.
- Sidebar remains branded.
- Send button styled.
- Attachment/options panel styled.
- Top icons aligned better.
- Inputs, labels, and editor area cleaned visually.

## Contacts / Addressbook

Main files:

- `templates/addressbook.html`
- `plugins/cybrense_skin/cybrense_labels.css`
- `plugins/cybrense_skin/cybrense_ui.js`

What was fixed:

- Contacts page was showing the sidebar as a small broken icon rail.
- Global sidebar rules now apply outside Mail.
- Mobile menu button logic now works for non-mail pages too.
- Contacts, Settings, and Mail share the same app shell style.

## Mobile / Web App Behavior

Main files:

- `plugins/cybrense_skin/cybrense_mobile.css`
- `plugins/cybrense_skin/cybrense_ui.js`
- `plugins/cybrense_skin/cybrense_pwa.js`
- `pwa/cybrense-manifest.json`
- `pwa/cybrense-sw.js`

What was added/fixed:

- Responsive classes are added by JS:
  - `cybrense-ui-wide`
  - `cybrense-ui-tight`
  - `cybrense-ui-narrow`
  - `cybrense-ui-phone`
  - `cybrense-list-tight`
  - `cybrense-list-tiny`
  - `cybrense-list-nano`
  - `cybrense-content-tight`
  - `cybrense-content-tiny`
  - `cybrense-content-nano`
- Mobile menu drawer opens from the left.
- Mobile folder/sidebar drawer support improved.
- Page height follows the real visible browser height using:
  - `--cybrense-app-height`
- Mobile login checked at `390x844`.
- Desktop login checked at `1920x945`.
- Horizontal overflow was checked and removed for login.

## PWA

Files:

- `pwa/cybrense-manifest.json`
- `pwa/cybrense-sw.js`
- `plugins/cybrense_skin/cybrense_pwa.js`

What was added:

- Static manifest mounted into Roundcube public path.
- Static service worker mounted into Roundcube public path.
- PWA app name/title:
  - `Cybrense Mail`
- App icons:
  - 192px
  - 512px
  - Apple touch icon
- Theme color:
  - `#061d3a`

Service worker behavior:

- Network-first.
- If network fails, returns a simple offline error response.
- It does not cache old UI aggressively.

Mounted paths in `docker-compose.yml`:

```yaml
- ./pwa/cybrense-manifest.json:/var/www/html/public_html/cybrense-manifest.json
- ./pwa/cybrense-sw.js:/var/www/html/public_html/cybrense-sw.js
```

## Docker

Before running from a fresh clone, create your local config:

```powershell
Copy-Item config\config.inc.example.php config\config.inc.php
```

Then edit `config/config.inc.php` and replace:

```php
$config['des_key'] = 'CHANGE_ME_24_CHAR_SECRET';
```

Use a unique 24-character value for the deployment. The real `config/config.inc.php` is intentionally ignored by Git because it contains local secrets.

Run:

```powershell
docker compose up -d
```

Open:

```text
http://127.0.0.1:8090/
```

Check containers:

```powershell
docker compose ps
```

Check Roundcube response:

```powershell
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:8090/?_task=login"
```

## Verification Commands

JavaScript syntax:

```powershell
node --check plugins\cybrense_skin\cybrense_ui.js
node --check plugins\cybrense_skin\cybrense_pwa.js
```

CSS brace check:

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

PHP syntax:

```powershell
docker exec roundcube php -l /var/www/html/plugins/cybrense_skin/cybrense_skin.php
```

Check served CSS:

```powershell
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:8090/static.php/plugins/cybrense_skin/cybrense_labels.css"
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:8090/static.php/plugins/cybrense_skin/cybrense_login.css"
```

Check PWA files:

```powershell
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:8090/cybrense-manifest.json"
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:8090/cybrense-sw.js"
```

## Cache / Refresh Notes

After CSS/JS changes, Chrome can keep old files.

Use:

```text
Ctrl + F5
```

If PWA/service worker still shows old UI:

1. Open Chrome DevTools.
2. Go to Application.
3. Service Workers.
4. Unregister the service worker.
5. Go to Storage/Clear storage.
6. Clear site data.
7. Reload.

## Known Notes

- The custom label system is browser-side and account-specific.
- If the browser storage is cleared, custom UI labels can be lost.
- Roundcube mail storage and real emails are still handled by the mail server.
- Docker Desktop must be running before `docker compose` and localhost checks work.
- Some UI rules are final override rules because Roundcube Elastic has many strong default styles.

## Main Files To Edit Later

Use these files for future changes:

- Login page:
  - `plugins/cybrense_skin/cybrense_login.css`
- Mail / app shell / sidebar / message view:
  - `plugins/cybrense_skin/cybrense_ui.css`
  - `plugins/cybrense_skin/cybrense_labels.css`
- Mobile fixes:
  - `plugins/cybrense_skin/cybrense_mobile.css`
- JS behavior:
  - `plugins/cybrense_skin/cybrense_ui.js`
  - `plugins/cybrense_skin/cybrense_pwa.js`
- PWA:
  - `pwa/cybrense-manifest.json`
  - `pwa/cybrense-sw.js`
- Branding:
  - `branding/`
- Docker mounts:
  - `docker-compose.yml`
