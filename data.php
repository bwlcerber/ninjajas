<?php
/**
 * PHP Data Handler for NinjaPromo Sales Portal
 * Handles loading and saving the portal content override database to the server.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

$type = isset($_GET['type']) ? $_GET['type'] : 'content';
if ($type === 'users') {
    $filename = __DIR__ . '/uploads/users.json';
} else {
    $filename = __DIR__ . '/uploads/content_override.json';
}

// Ensure the directory exists
$dir = dirname($filename);
if (!is_dir($dir)) {
    mkdir($dir, 0755, true);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    if ($input) {
        $json = json_decode($input, true);
        if ($json !== null) {
            // Attempt write and verify it succeeded
            $written = file_put_contents($filename, $input, LOCK_EX);
            if ($written !== false) {
                echo json_encode(['success' => true, 'bytes' => $written]);
            } else {
                // Write failed — report error with diagnostics
                echo json_encode([
                    'success' => false,
                    'error' => 'File write failed',
                    'path' => $filename,
                    'dir_exists' => is_dir(dirname($filename)),
                    'dir_writable' => is_writable(dirname($filename)),
                    'file_exists' => file_exists($filename),
                    'file_writable' => file_exists($filename) ? is_writable($filename) : 'n/a'
                ]);
            }
            exit;
        }
    }
    echo json_encode(['success' => false, 'error' => 'Invalid JSON data']);
    exit;
} else {
    if (file_exists($filename)) {
        echo file_get_contents($filename);
    } else {
        echo json_encode([
            'materials' => [],
            'clientRefs' => [],
            'clientProfiles' => []
        ]);
    }
}
