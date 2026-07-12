<?php

require_once __DIR__ . '/../plugins/cybrense_skin/cybrense_label_store.php';

function assert_same($expected, $actual, $message)
{
    if ($expected !== $actual) {
        fwrite(STDERR, $message . "\nExpected: " . var_export($expected, true) . "\nActual: " . var_export($actual, true) . "\n");
        exit(1);
    }
}

assert_same(null, cybrense_label_store::normalize('not-json'), 'Invalid JSON must be rejected.');

$store = cybrense_label_store::normalize([
    'updatedAt' => '1234',
    'labels' => [
        ['id' => 'security', 'name' => "  Securite\nUrgente  ", 'color' => 'green'],
        ['id' => 'security', 'name' => 'Duplicate', 'color' => 'red'],
        ['id' => '../bad', 'name' => 'Bad identifier', 'color' => 'purple'],
        ['id' => 'projects', 'name' => 'Projets', 'color' => 'not-a-color'],
    ],
    'hiddenLabels' => ['archive', 'archive', '../bad'],
    'messages' => [
        'INBOX|42' => ['security', 'security', 'unknown', 'projects'],
        'invalid-key' => ['security'],
    ],
]);

assert_same(2, $store['version'], 'The normalized store must use schema version 2.');
assert_same(1234, $store['updatedAt'], 'The client timestamp must be preserved.');
assert_same([
    ['id' => 'security', 'name' => 'Securite Urgente', 'color' => 'green'],
    ['id' => 'projects', 'name' => 'Projets', 'color' => 'blue'],
], $store['labels'], 'Labels must be sanitized, deduplicated, and use known colors.');
assert_same(['archive'], $store['hiddenLabels'], 'Hidden labels must be valid and unique.');
assert_same([
    'INBOX|42' => ['security', 'projects'],
], $store['messages'], 'Assignments must reference existing labels and valid message keys.');

$many_labels = [];
for ($i = 0; $i < 60; $i++) {
    $many_labels[] = ['id' => 'label-' . $i, 'name' => 'Label ' . $i, 'color' => 'blue'];
}

$limited = cybrense_label_store::normalize(['labels' => $many_labels]);
assert_same(50, count($limited['labels']), 'A user store must contain at most 50 labels.');

echo "Label store tests passed.\n";
