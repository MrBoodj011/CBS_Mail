<?php

/* Example Roundcube configuration for CBS Mail.
 * Copy this file to config.inc.php and set a unique des_key locally.
 */

$config['imap_host'] = getenv('ROUNDCUBEMAIL_IMAP_HOST') ?: 'ssl://imap.example.com:993';
$config['smtp_host'] = getenv('ROUNDCUBEMAIL_SMTP_HOST') ?: 'ssl://smtp.example.com:465';
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

// Generate a unique 24-character key for each deployment.
$config['des_key'] = 'CHANGE_ME_24_CHAR_SECRET';

$config['product_name'] = 'Cybrense Mail';
$config['language'] = 'fr_FR';
$config['dark_mode_support'] = false;

// Allow remote resources for trusted senders/domains only.
$config['show_images'] = 3;
$config['dont_override'] = array_unique(array_merge($config['dont_override'] ?? [], ['show_images']));
$config['collected_senders'] = '2';

$config['cybrense_remote_content_trusted_domains'] = [
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

$config['plugins'] = ['archive', 'zipdownload', 'password', 'filesystem_attachments', 'cybrense_skin'];

if (file_exists(__DIR__ . '/config.docker.inc.php')) {
    include(__DIR__ . '/config.docker.inc.php');
}
