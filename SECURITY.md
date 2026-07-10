# Security Policy

## Reporting A Vulnerability

Please do not open a public issue for exploitable security problems.

Use GitHub private vulnerability reporting if it is enabled for the repository.
If it is not enabled, contact the repository owner privately and include:

- A short description of the issue.
- Steps to reproduce.
- Affected files or URLs.
- Any known impact.

## Sensitive Data

Never commit:

- Production credentials.
- `.env` files.
- `config/config.inc.php`.
- Database files from `db/`.
- Logs containing message data or account details.
- SSH keys, API tokens, or deployment passwords.

The repository includes `config/config.inc.example.php` and `.env.example` as
safe templates for local setup.

## Scope

CBS Mail customizes Roundcube's UI and plugin behavior. Vulnerabilities in
Roundcube core or its official Docker image should also be reported upstream:

https://roundcube.net/
