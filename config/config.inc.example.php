<?php

/* Example Roundcube configuration for CBS Mail.
 * Copy this file to config.inc.php and set a unique des_key locally.
 */

$cybrense_mail_host = static function ($direct_name, $host_name, $port_name, $fallback_host, $fallback_port) {
    $direct = getenv($direct_name);
    if ($direct !== false && $direct !== '') {
        return $direct;
    }

    $host = getenv($host_name) ?: $fallback_host;
    $port = getenv($port_name) ?: $fallback_port;

    return preg_match('/:\\d+$/', $host) ? $host : $host . ':' . $port;
};

$config['imap_host'] = $cybrense_mail_host(
    'ROUNDCUBEMAIL_IMAP_HOST',
    'ROUNDCUBEMAIL_DEFAULT_HOST',
    'ROUNDCUBEMAIL_DEFAULT_PORT',
    'ssl://imap.example.com',
    '993'
);
$config['smtp_host'] = $cybrense_mail_host(
    'ROUNDCUBEMAIL_SMTP_HOST',
    'ROUNDCUBEMAIL_SMTP_SERVER',
    'ROUNDCUBEMAIL_SMTP_PORT',
    'ssl://smtp.example.com',
    '465'
);
unset($cybrense_mail_host);

// This path is mounted from ./db by docker-compose.yml and matches the official image.
$config['db_dsnw'] = 'sqlite:////var/roundcube/db/sqlite.db?mode=0646';

$config['support_url'] = '';

$config['skin_logo'] = [
    'elastic:login' => 'skins/elastic/branding/logo_dark.png',
    'elastic:login[small]' => 'skins/elastic/branding/logo_dark.png',
    'elastic:*' => 'skins/elastic/branding/logo.png',
    'elastic:*[dark]' => 'skins/elastic/branding/logo_white.png',
    'elastic:*[small]' => 'skins/elastic/branding/logo.png',
    'elastic:*[small-dark]' => 'skins/elastic/branding/logo_white.png',
    'elastic:*[favicon]' => 'skins/elastic/branding/favicon-cybrense.ico',
];

$config['temp_dir'] = '/tmp/roundcube-temp';
$config['force_https'] = true;
$config['use_https'] = true;
$config['session_samesite'] = 'Lax';

$cybrense_trusted_host = getenv('ROUNDCUBEMAIL_TRUSTED_HOST');
$config['trusted_host_patterns'] = $cybrense_trusted_host
    ? ['^' . preg_quote($cybrense_trusted_host, '/') . '$']
    : [];
unset($cybrense_trusted_host);

// Generate a unique 24-character key for each deployment.
$config['des_key'] = 'CHANGE_ME_24_CHAR_SECRET';

$config['product_name'] = 'Cybrense Mail';
$config['language'] = 'fr_FR';
$config['dark_mode_support'] = false;

// Check for new mail once per minute. The official newmail_notifier plugin
// exposes browser notification controls under Settings > Preferences > Mailbox.
$config['refresh_interval'] = 60;
$config['newmail_notifier_basic'] = true;
$config['newmail_notifier_desktop'] = false;
$config['newmail_notifier_sound'] = false;
$config['newmail_notifier_desktop_timeout'] = 10;

// Allow remote resources for trusted senders/domains only.
$config['show_images'] = 3;
$config['dont_override'] = array_unique(array_merge($config['dont_override'] ?? [], ['show_images']));
$config['collected_senders'] = '2';

$config['cybrense_remote_content_trusted_domains'] = [
    'cybrense.com',
    'mattermost.com',
    'slack.com',
    'github.com',
    'google.com',
    'microsoft.com',
    'apple.com',
    'linkedin.com',
    'atlassian.com',
    'cloudflare.com',
    'stripe.com',
    'paypal.com',
];

$config['cybrense_remote_content_trusted_senders'] = [
    // 'noreply@example.com',
];

$config['request_path'] = '/';

$config['plugins'] = [
    'archive',
    'zipdownload',
    'password',
    'filesystem_attachments',
    'newmail_notifier',
    'cybrense_skin',
];

// Optional server-side filters and vacation responses. This only enables the
// Roundcube UI when a real ManageSieve service has been configured.
if (filter_var(getenv('CYBRENSE_ENABLE_MANAGESIEVE'), FILTER_VALIDATE_BOOLEAN)) {
    $config['plugins'][] = 'managesieve';
    $config['managesieve_host'] = getenv('CYBRENSE_MANAGESIEVE_HOST') ?: 'localhost';
    $config['managesieve_port'] = (int) (getenv('CYBRENSE_MANAGESIEVE_PORT') ?: 4190);
}

if (file_exists(__DIR__ . '/config.docker.inc.php')) {
    include(__DIR__ . '/config.docker.inc.php');
}
