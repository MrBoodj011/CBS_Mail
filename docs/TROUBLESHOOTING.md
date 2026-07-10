# Troubleshooting

## Container Does Not Start

Check Compose config:

```bash
docker compose config --quiet
```

Then start:

```bash
docker compose up -d
docker compose ps
```

## Login Page Does Not Load

Check the local URL:

```text
http://127.0.0.1:8090/
```

Check container logs:

```bash
docker logs roundcube --tail 100
```

## PHP Errors

Run:

```bash
docker exec roundcube php -l /var/www/html/plugins/cybrense_skin/cybrense_skin.php
docker exec roundcube sh -lc 'tail -100 /var/www/html/logs/errors.log'
```

## CSS Or JS Changes Do Not Appear

Roundcube serves plugin assets through `static.php`, not direct `/plugins/...`
paths.

Expected examples:

```text
/static.php/plugins/cybrense_skin/cybrense_ui.js
/static.php/plugins/cybrense_skin/cybrense_labels.css
```

Hard refresh the browser. For installed PWA mode, close and reopen the app.

## PWA Shows Old UI

The service worker is network-first, but browsers can still keep old state.

1. Close and reopen the installed app.
2. Hard refresh in the browser.
3. In devtools, unregister the service worker.
4. Clear site data only when needed.

## Labels Disappeared

Labels are browser-side metadata in `localStorage`. They can disappear if:

- browser storage is cleared,
- the account changes,
- the site origin changes,
- private/incognito mode is used.

## Remote Content Warning Keeps Appearing

Remote images are blocked by design until the sender is trusted. Confirm:

- the sender email is correct,
- the user clicked the trust/allow action,
- Roundcube preferences are saving correctly,
- the sender/domain is included in trusted config if it should be trusted by
  default.

## Mobile Tap Does Not Open A Message

Check browser console errors first. The mobile UI relies on the custom
`cybrense_ui.js` behavior loaded through Roundcube static assets.

Verify the asset is served:

```text
/static.php/plugins/cybrense_skin/cybrense_ui.js
```

Then close/reopen the PWA or hard refresh the browser.

## UI Looks Unstyled

Confirm these mounts exist in Docker:

```text
./templates:/var/www/html/skins/elastic/templates
./plugins/cybrense_skin:/var/www/html/plugins/cybrense_skin
./branding:/var/www/html/skins/elastic/branding
```

Also confirm the plugin is enabled:

```php
$config['plugins'] = [..., 'cybrense_skin'];
```
