# Mail Server And Administration

CBS Mail is a Roundcube client. It authenticates against IMAP and sends through
SMTP, but it does not create mailboxes, domains, aliases, or quotas itself.

## Where Accounts Are Managed

Use the administration layer belonging to the configured mail server:

| Mail platform | Typical administration surface |
| --- | --- |
| mailcow | mailcow administration UI |
| iRedMail | iRedAdmin |
| Postfix + Dovecot | PostfixAdmin or the hosting control panel |
| cPanel / Plesk | The control panel mail-account screen |
| Microsoft 365 / Google Workspace | The provider admin console |

Do not expose an unauthenticated mailbox-creation endpoint from Roundcube. An
admin panel must have separate authorization, audit logs, rate limiting, and
CSRF protection.

## Optional Filters And Vacation Responses

CBS Mail can expose Roundcube's official ManageSieve UI when the mail server
supports RFC 5804. Add these values to `.env`:

```env
CYBRENSE_ENABLE_MANAGESIEVE=true
CYBRENSE_MANAGESIEVE_HOST=mail.example.com
CYBRENSE_MANAGESIEVE_PORT=4190
```

Restart the container after changing these values. Keep the feature disabled
when no ManageSieve endpoint exists; otherwise users will see controls that
cannot save.

## Recommended Integration Boundary

Keep webmail and account administration separate:

```text
CBS Mail / Roundcube -> IMAP + SMTP + optional ManageSieve
Admin panel          -> mail platform database/API
Identity provider    -> optional SSO and MFA enforcement
```

For a public deployment, prefer SSO/MFA at the identity-provider or mail-server
layer instead of implementing a second password database inside this skin.
