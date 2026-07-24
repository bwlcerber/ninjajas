<?php
/**
 * PHP File Deletion Handler for NinjaPromo Sales Portal
 * Deletes uploaded files from the server uploads/ directory structure
 * to keep hosting disk space clean.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method. Only POST is allowed.']);
    exit;
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

$files = [];
if ($data && isset($data['files']) && is_array($data['files'])) {
    $files = $data['files'];
} else if ($data && isset($data['file'])) {
    $files = [$data['file']];
} else if (isset($_POST['file'])) {
    $files = [$_POST['file']];
} else if (isset($_POST['files']) && is_array($_POST['files'])) {
    $files = $_POST['files'];
}

if (empty($files)) {
    echo json_encode(['success' => false, 'error' => 'No files specified for deletion.']);
    exit;
}

$deleted = [];
$failed = [];

foreach ($files as $file) {
    if (!is_string($file)) continue;
    $file = trim($file);
    if (empty($file)) continue;

    // Parse URL if full URL is passed
    if (strpos($file, 'http://') === 0 || strpos($file, 'https://') === 0) {
        $parsed = parse_url($file, PHP_URL_PATH);
        if ($parsed) {
            $file = ltrim($parsed, '/');
        }
    }

    // Strip leading slashes
    $file = ltrim($file, '/');

    // Security check: path must begin with uploads/ and contain no path traversal (..)
    if (strpos($file, 'uploads/') === 0 && strpos($file, '..') === false) {
        $fullPath = __DIR__ . '/' . $file;
        if (file_exists($fullPath) && is_file($fullPath)) {
            if (@unlink($fullPath)) {
                $deleted[] = $file;
            } else {
                $failed[] = ['file' => $file, 'reason' => 'Permission denied or unlink failed'];
            }
        } else {
            // File already doesn't exist on disk
            $deleted[] = $file;
        }
    } else {
        $failed[] = ['file' => $file, 'reason' => 'Invalid file path or target outside uploads directory'];
    }
}

echo json_encode([
    'success' => true,
    'deleted' => $deleted,
    'failed' => $failed
]);
