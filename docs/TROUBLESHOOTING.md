# Troubleshooting

## Container Does Not Start

Check Compose config:

```bash
docker compose config --quiet
```

Then start:

```bash
docker compose up -d --build
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

Labels are synchronized through Roundcube user preferences and cached in
`localStorage`. If labels do not appear on another device:

- confirm both devices use the same Roundcube account,
- confirm the `cybrense_skin` plugin is enabled,
- inspect the `plugin.cybrense_labels_save` request for an error response,
- verify the Roundcube database is writable and persistent,
- reload once to import legacy browser-only labels.

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

Confirm the custom image was built and the runtime mounts exist:

```text
cbs-mail:local
./db:/var/roundcube/db
./config/config.inc.php:/var/www/html/config/config.inc.php
```

Also confirm the plugin is enabled:

```php
$config['plugins'] = [..., 'cybrense_skin'];
```
