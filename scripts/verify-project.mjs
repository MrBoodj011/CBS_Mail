import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const failures = [];

function requireText(file, text, message) {
  if (!read(file).includes(text)) {
    failures.push(`${file}: ${message}`);
  }
}

function requireFile(file) {
  if (!fs.existsSync(path.join(root, file))) {
    failures.push(`${file}: referenced file is missing`);
  }
}

const compose = read("docker-compose.yml");
const dockerfile = read("Dockerfile");
const serviceWorker = read("pwa/cybrense-sw.js");
if (!/FROM roundcube\/roundcubemail@sha256:[a-f0-9]{64}/.test(dockerfile)) {
  failures.push("Dockerfile: Roundcube base image must be pinned by digest");
}

if (/roundcube\/roundcubemail:latest/.test(compose + dockerfile)) {
  failures.push("Docker configuration must not use an unpinned latest image");
}

requireText("docker-compose.yml", "./db:/var/roundcube/db", "SQLite persistence mount is missing");
requireText("config/config.inc.example.php", "/var/roundcube/db/sqlite.db", "SQLite path does not match the Docker mount");
requireText("config/config.inc.example.php", "newmail_notifier", "official browser notifications are not enabled");
requireText("docker-compose.yml", "healthcheck:", "container healthcheck is missing");
requireText("docker-compose.yml", "strpos($$body", "healthcheck must inspect response content");
requireText("docker-compose.yml", "_user", "healthcheck must require the login form");
requireText("docker-compose.yml", "CBS_MAIL_HTTP_PORT", "host port must be configurable");
requireText("docker-compose.yml", "CBS_MAIL_CONTAINER_NAME", "container name must be configurable");

if (!serviceWorker.includes('event.request.mode === "navigate"')) {
  failures.push("pwa/cybrense-sw.js: navigation fallback is missing");
}
if (!serviceWorker.includes("never written to Cache Storage")) {
  failures.push("pwa/cybrense-sw.js: private-cache safety invariant is undocumented");
}
if (/cache\.put\s*\(\s*event\.request/.test(serviceWorker)) {
  failures.push("pwa/cybrense-sw.js: authenticated requests must never be cached");
}

for (const name of [
  "ROUNDCUBEMAIL_DEFAULT_HOST",
  "ROUNDCUBEMAIL_DEFAULT_PORT",
  "ROUNDCUBEMAIL_SMTP_SERVER",
  "ROUNDCUBEMAIL_SMTP_PORT",
  "ROUNDCUBEMAIL_TRUSTED_HOST"
]) {
  requireText("docker-compose.yml", name, `${name} is not passed to the container`);
  requireText("config/config.inc.example.php", name, `${name} is not consumed by the public config`);
}

for (const file of [
  "branding/logo.png",
  "branding/logo_dark.png",
  "branding/logo_white.png",
  "branding/favicon-cybrense.ico",
  "branding/apple-touch-icon.png",
  "branding/pwa-icon-192.png",
  "branding/pwa-icon-512.png",
  "pwa/cybrense-manifest.json",
  "pwa/cybrense-sw.js",
  "pwa/offline.html",
  "Dockerfile",
  "deploy/backup.sh",
  "deploy/check-health.sh",
  "deploy/nginx-cbsmail-site.conf.example",
  "docs/MAIL_SERVER_ADMIN.md",
  "plugins/cybrense_skin/cybrense_skin.php",
  "plugins/cybrense_skin/cybrense_label_store.php",
  "plugins/cybrense_skin/cybrense_tokens.css",
  "plugins/cybrense_skin/cybrense_ui.js",
  "site/index.html",
  "site/styles.css",
  "site/site.js",
  "site/assets/product-desktop.png",
  "site/assets/product-mobile.png"
]) {
  requireFile(file);
}

requireFile("tests/label_store_test.php");
requireFile("tests/e2e/mail.spec.js");
requireFile("tests/docker-compose.e2e.yml");
requireFile("tests/fixtures/config.inc.php");
requireFile("package.json");
requireFile("package-lock.json");
requireFile("playwright.config.js");
requireFile("playwright.site.config.js");
requireFile("scripts/serve-site.mjs");
requireFile("tests/site/site.spec.js");
requireFile("scripts/dedupe-css.mjs");
requireFile("scripts/check-css-quality.mjs");

for (const template of ["mail", "message", "compose", "addressbook", "settings", "login"]) {
  requireFile(`templates/${template}.html`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Repository invariants verified.");
