<?php

final class cybrense_label_store
{
    private const MAX_LABELS = 50;
    private const MAX_MESSAGES = 5000;
    private const MAX_LABEL_NAME_LENGTH = 48;
    private const MAX_MESSAGE_KEY_LENGTH = 512;
    private const COLORS = ['blue', 'green', 'purple', 'yellow', 'gray', 'red'];

    public static function normalize($value)
    {
        if (is_string($value)) {
            $value = json_decode($value, true);
        }

        if (!is_array($value)) {
            return null;
        }

        $labels = [];
        $valid_ids = [];

        foreach (array_slice((array) ($value['labels'] ?? []), 0, self::MAX_LABELS) as $label) {
            if (!is_array($label)) {
                continue;
            }

            $id = strtolower(trim((string) ($label['id'] ?? '')));
            $name = self::clean_text($label['name'] ?? '', self::MAX_LABEL_NAME_LENGTH);
            $color = strtolower(trim((string) ($label['color'] ?? 'blue')));

            if (!preg_match('/^[a-z0-9][a-z0-9_-]{0,63}$/', $id) || $name === '' || isset($valid_ids[$id])) {
                continue;
            }

            if (!in_array($color, self::COLORS, true)) {
                $color = 'blue';
            }

            $valid_ids[$id] = true;
            $labels[] = ['id' => $id, 'name' => $name, 'color' => $color];
        }

        $hidden_labels = [];
        foreach (array_slice((array) ($value['hiddenLabels'] ?? []), 0, self::MAX_LABELS) as $id) {
            $id = strtolower(trim((string) $id));
            if (preg_match('/^[a-z0-9][a-z0-9_-]{0,63}$/', $id) && !in_array($id, $hidden_labels, true)) {
                $hidden_labels[] = $id;
            }
        }

        $messages = [];
        $message_count = 0;
        foreach ((array) ($value['messages'] ?? []) as $key => $message_labels) {
            if ($message_count >= self::MAX_MESSAGES) {
                break;
            }

            $key = trim((string) $key);
            if ($key === '' || strlen($key) > self::MAX_MESSAGE_KEY_LENGTH || strpos($key, '|') === false) {
                continue;
            }

            $assigned = [];
            foreach ((array) $message_labels as $id) {
                $id = strtolower(trim((string) $id));
                if (isset($valid_ids[$id]) && !in_array($id, $assigned, true)) {
                    $assigned[] = $id;
                }
            }

            if ($assigned) {
                $messages[$key] = $assigned;
                $message_count++;
            }
        }

        $updated_at = isset($value['updatedAt']) && is_numeric($value['updatedAt'])
            ? max(0, (int) $value['updatedAt'])
            : 0;

        return [
            'version' => 2,
            'updatedAt' => $updated_at,
            'labels' => $labels,
            'hiddenLabels' => $hidden_labels,
            'messages' => $messages,
        ];
    }

    private static function clean_text($value, $max_length)
    {
        $value = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', (string) $value);
        $value = trim((string) preg_replace('/\s+/u', ' ', $value));

        if (function_exists('mb_substr')) {
            return mb_substr($value, 0, $max_length, 'UTF-8');
        }

        return substr($value, 0, $max_length);
    }
}
