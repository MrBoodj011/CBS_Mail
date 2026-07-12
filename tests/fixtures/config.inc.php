<?php

$config['imap_host'] = 'greenmail:3143';
$config['smtp_host'] = 'greenmail:3025';
$config['db_dsnw'] = 'sqlite:////var/roundcube/db/sqlite.db?mode=0646';
$config['des_key'] = str_repeat('e', 24);
$config['product_name'] = 'Cybrense Mail E2E';
$config['skin'] = 'elastic';
$config['language'] = 'fr_FR';
$config['plugins'] = ['archive', 'zipdownload', 'newmail_notifier', 'cybrense_skin'];
$config['refresh_interval'] = 60;
$config['newmail_notifier_basic'] = true;
$config['newmail_notifier_desktop'] = false;
$config['newmail_notifier_sound'] = false;
$config['request_path'] = '/';
$config['force_https'] = false;
$config['use_https'] = false;
$config['show_images'] = 0;
$config['skin_logo'] = [
    'elastic:login' => 'skins/elastic/branding/logo_dark.png',
    'elastic:*' => 'skins/elastic/branding/logo.png',
    'elastic:*[favicon]' => 'skins/elastic/branding/favicon-cybrense.ico',
];

if (file_exists(__DIR__ . '/config.docker.inc.php')) {
    include __DIR__ . '/config.docker.inc.php';
}
