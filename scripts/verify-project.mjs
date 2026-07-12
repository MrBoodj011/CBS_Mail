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
if (/roundcube\/roundcubemail:latest/.test(compose)) {
  failures.push("docker-compose.yml: Roundcube image must be pinned by digest");
}

requireText("docker-compose.yml", "./db:/var/roundcube/db", "SQLite persistence mount is missing");
requireText("config/config.inc.example.php", "/var/roundcube/db/sqlite.db", "SQLite path does not match the Docker mount");

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
  "plugins/cybrense_skin/cybrense_skin.php",
  "plugins/cybrense_skin/cybrense_ui.js"
]) {
  requireFile(file);
}

for (const template of ["mail", "message", "compose", "addressbook", "settings", "login"]) {
  requireFile(`templates/${template}.html`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Repository invariants verified.");
