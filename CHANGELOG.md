# Changelog

## Unreleased

- Added official Roundcube browser notifications with per-account settings.
- Added an opt-in ManageSieve integration path for filters and vacation replies.
- Added a privacy-safe offline PWA fallback that never caches mail content.
- Added a reproducible CBS Mail Docker image instead of fragile UI bind mounts.
- Added container health checks, external smoke checks, and protected backups.
- Added mail-server/admin integration guidance and expanded PWA security tests.
- Fixed empty-account label persistence when PHP serializes the message map as an empty JSON array.
- Added weekly Docker base-image update checks and documented Roundcube 1.7.1 compatibility.
- Made the localhost port and container name configurable for in-place production upgrades.
- Moved labels to validated, per-user Roundcube preferences with automatic migration from browser storage.
- Added stale-write protection so concurrent Roundcube frames cannot overwrite a newer label click.
- Added disposable IMAP/SMTP-backed Playwright tests for desktop, mobile, message opening, and label persistence.
- Added dependency auditing, shared design tokens, CSS quality budgets, and removed exact duplicate override blocks.
- Made message labels deterministic: one tap/click now adds or removes exactly one label.
- Fixed label filters so non-matching virtualized message rows are actually removed from view.
- Fixed Docker/config environment mismatches and persisted SQLite under the mounted `./db` directory.
- Kept label and trusted-sender migrations isolated to the active account, including message iframes.
- Added repository invariant checks, least-privilege CI permissions, and a hardened Nginx example.
- Added scheduled and pull-request CodeQL analysis for the JavaScript layer.
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
