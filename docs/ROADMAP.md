# Roadmap

This roadmap is intentionally lightweight. It helps contributors understand
where CBS Mail can grow without promising dates.

## Short Term

- Keep the UI stable across desktop, tablet, and phone layouts.
- Continue polishing the compose, message view, contacts, and settings screens.
- Improve documentation for self-hosted deployments.
- Add more automated checks for CSS and template regressions.
- Complete a dedicated, fully tested dark theme before exposing a theme toggle.

## Medium Term

- Screenshot-based UI regression workflow.
- More configurable branding for forks.
- Optional label import/export and IMAP keyword integration.
- Clearer migration notes for existing Roundcube installs.
- Optional native desktop wrapper after the PWA workflow is stable.

## Long Term

- Explore optional IMAP keyword storage for interoperability with other clients.
- Explore theme presets for organizations that want to fork the UI.
- Add a documented plugin configuration reference.
- Track tested Roundcube 1.7.x security updates through digest-pinned Docker
  upgrades.

## Non-Goals

- CBS Mail will not become a mail server.
- CBS Mail will not replace Roundcube core.
- CBS Mail will not store real mail messages outside the configured mail server.
