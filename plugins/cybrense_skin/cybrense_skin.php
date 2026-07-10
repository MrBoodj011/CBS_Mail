<?php

class cybrense_skin extends rcube_plugin
{
    public $task = 'login|mail|addressbook|settings';

    public function init()
    {
        $this->add_hook('message_check_safe', [$this, 'message_check_safe']);
        $this->register_action('plugin.cybrense_trust_sender', [$this, 'trust_sender']);
        $this->include_stylesheet('cybrense_ui.css');
        $this->include_stylesheet('cybrense_mobile.css');
        $this->include_stylesheet('cybrense_compact.css');
        $this->include_stylesheet('cybrense_labels.css');
        $this->include_stylesheet('cybrense_login.css');
        $this->include_script('cybrense_ui.js');
        $this->include_script('cybrense_pwa.js');
        $this->add_pwa_headers();
        $this->sync_trusted_remote_senders_env();
    }

    private function add_pwa_headers()
    {
        try {
            $rcmail = rcmail::get_instance();

            if (!$rcmail->output || !method_exists($rcmail->output, 'add_header')) {
                return;
            }

            $host = !empty($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : '';
            $proto = !empty($_SERVER['HTTP_X_FORWARDED_PROTO'])
                ? $_SERVER['HTTP_X_FORWARDED_PROTO']
                : (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https' : 'http');
            $proto = in_array($proto, ['http', 'https'], true) ? $proto : 'https';
            $manifest_url = $host ? $proto . '://' . $host . '/cybrense-manifest.json' : '/cybrense-manifest.json';
            $worker_url = '/cybrense-sw.js';

            $rcmail->output->set_env('cybrense_pwa_service_worker', $worker_url);
            $rcmail->output->set_env('cybrense_pwa_scope', '/');
            $rcmail->output->add_header(implode("\n", [
                '<link rel="manifest" href="' . html::quote($manifest_url) . '">',
                '<link rel="icon" type="image/png" sizes="256x256" href="static.php/skins/elastic/branding/favicon-cybrense.png">',
                '<link rel="apple-touch-icon" sizes="180x180" href="static.php/skins/elastic/branding/apple-touch-icon.png">',
                '<meta name="application-name" content="Cybrense Mail">',
                '<meta name="apple-mobile-web-app-title" content="Cybrense Mail">',
                '<meta name="mobile-web-app-capable" content="yes">',
                '<meta name="apple-mobile-web-app-capable" content="yes">',
                '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
                '<meta name="theme-color" content="#061d3a">',
                '<meta name="msapplication-TileColor" content="#061d3a">',
            ]));
        } catch (Exception $error) {
            // PWA metadata is progressive enhancement; mail must continue normally.
        }
    }

    private function sync_trusted_remote_senders_env()
    {
        try {
            $rcmail = rcmail::get_instance();

            if ($rcmail->output) {
                $rcmail->output->set_env(
                    'cybrense_trusted_remote_senders',
                    array_values(array_unique(array_map(
                        'strtolower',
                        (array) $rcmail->config->get('cybrense_trusted_remote_senders', [])
                    )))
                );
            }
        } catch (Exception $error) {
            // Env sync is only for frontend convenience; message safety still uses config.
        }
    }

    public function trust_sender()
    {
        $rcmail = rcmail::get_instance();
        $sender = rcube_utils::get_input_string('_sender', rcube_utils::INPUT_POST, true);
        $email = $this->extract_email($sender);

        if ($email) {
            $trusted = array_map(
                'strtolower',
                (array) $rcmail->config->get('cybrense_trusted_remote_senders', [])
            );

            if (!in_array($email, $trusted, true)) {
                $trusted[] = $email;
                sort($trusted);

                if ($rcmail->user) {
                    $rcmail->user->save_prefs([
                        'cybrense_trusted_remote_senders' => $trusted,
                    ]);
                }
            }

            $rcmail->output->set_env('cybrense_trusted_remote_senders', $trusted);
        }

        $rcmail->output->send();
    }

    public function message_check_safe($args)
    {
        if (empty($args['message']) || empty($args['message']->sender['mailto'])) {
            return $args;
        }

        $sender = $this->extract_email($args['message']->sender['mailto']);
        if (!$sender) {
            return $args;
        }

        $domain = substr(strrchr($sender, '@') ?: '', 1);

        if (!$domain) {
            return $args;
        }

        $rcmail = rcmail::get_instance();
        $trusted_senders = array_map(
            'strtolower',
            (array) $rcmail->config->get('cybrense_remote_content_trusted_senders', [])
        );
        $user_trusted_senders = array_map(
            'strtolower',
            (array) $rcmail->config->get('cybrense_trusted_remote_senders', [])
        );
        $trusted_domains = array_map(
            'strtolower',
            (array) $rcmail->config->get('cybrense_remote_content_trusted_domains', [])
        );

        if (
            in_array($sender, $trusted_senders, true)
            || in_array($sender, $user_trusted_senders, true)
            || $this->domain_matches($domain, $trusted_domains)
            || $this->sender_exists_in_contacts($sender, $rcmail)
        ) {
            $args['message']->set_safe(true);
        }

        return $args;
    }

    private function extract_email($value)
    {
        $value = trim((string) $value);

        if ($value === '') {
            return '';
        }

        $addresses = rcube_mime::decode_address_list($value, 1, false);
        foreach ((array) $addresses as $address) {
            if (!empty($address['mailto'])) {
                $email = strtolower(trim($address['mailto']));
                return rcube_utils::check_email($email, false) ? $email : '';
            }
        }

        if (preg_match('/[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/i', $value, $match)) {
            $email = strtolower($match[0]);
            return rcube_utils::check_email($email, false) ? $email : '';
        }

        return '';
    }

    private function sender_exists_in_contacts($sender, $rcmail)
    {
        try {
            return $rcmail->contact_exists(
                $sender,
                rcube_addressbook::TYPE_TRUSTED_SENDER
                | rcube_addressbook::TYPE_DEFAULT
                | rcube_addressbook::TYPE_RECIPIENT
                | rcube_addressbook::TYPE_WRITEABLE
            );
        } catch (Exception $error) {
            return false;
        }
    }

    private function domain_matches($sender_domain, $trusted_domains)
    {
        foreach ($trusted_domains as $trusted_domain) {
            $trusted_domain = ltrim(trim($trusted_domain), '@*.');

            if ($trusted_domain === '') {
                continue;
            }

            if ($sender_domain === $trusted_domain) {
                return true;
            }

            if (substr($sender_domain, -strlen('.' . $trusted_domain)) === '.' . $trusted_domain) {
                return true;
            }
        }

        return false;
    }
}
