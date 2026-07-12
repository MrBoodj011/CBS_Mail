# Changelog

## Unreleased

- Fixed Docker/config environment mismatches and persisted SQLite under the mounted `./db` directory.
- Kept label and trusted-sender migrations isolated to the active account, including message iframes.
- Added repository invariant checks, least-privilege CI permissions, and a hardened Nginx example.
- Hardened label rendering and notifications against DOM injection and pinned the Roundcube image digest.
- Added SameSite cookie guidance and documented the privacy risk of broad trusted domains.
- Improved mobile drawer toggles, keyboard focus states, and touch target sizing.
- Fixed mobile access to label deletion controls and hardened mobile message mailbox routing.
- Hardened one-tap mobile message opening and added a navigation fallback.
- Fixed label persistence fallback, mailbox-scoped assignments, and stale label filters.
- Fixed restoring hidden default labels and surfaced storage errors instead of showing false success.
- Removed the redundant mail-list toolbar menu control.
- Added persistent trusted-domain handling for remote-content warnings.
- Replaced the default Roundcube About surface with a branded CBS Mail page.

## 1.0.1

- Added CI validation workflow.
- Added Code of Conduct, Support, Configuration, Troubleshooting, Deployment, Branding, Maintenance, and Roadmap docs.
- Added Dependabot for GitHub Actions and CODEOWNERS.
- Added Git attributes and editor configuration for cleaner contributions.
- Updated GitHub Actions dependencies.
- Prepared the repository for open-source publication.
- Added public setup documentation and contribution/security guidance.
- Clarified that CBS Mail is a Roundcube-based custom UI overlay.
- Added `.env.example` and made Docker mail host settings configurable.

## 1.0.0

- Custom Cybrense/CBS Roundcube UI skin and plugin layer.
- Desktop and mobile app shell.
- PWA manifest and service worker.
- Browser-side account-specific labels.
- Branded login, compose, message view, notifications, and toolbars.
- Remote-content trust UX for known senders.
