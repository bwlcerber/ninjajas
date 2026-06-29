<?php
/**
 * PHP Upload Handler for NinjaPromo Sales Portal
 * Saves uploaded files into the corresponding uploads/ directory structure.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method. Only POST is allowed.']);
    exit;
}

if (!isset($_FILES['file'])) {
    echo json_encode(['success' => false, 'error' => 'No file was uploaded.']);
    exit;
}

$type = isset($_POST['type']) ? trim($_POST['type']) : 'default';
$allowedTypes = ['creatives', 'reports', 'thumbnails', 'internal-docs'];

if (!in_array($type, $allowedTypes)) {
    $type = 'thumbnails'; // Default fallback
}

$uploadDir = __DIR__ . '/uploads/' . $type . '/';

if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$file = $_FILES['file'];
$fileName = preg_replace('/[^a-zA-Z0-9\-\._]/', '_', $file['name']); // Sanitize file name
$targetPath = $uploadDir . $fileName;

if (move_uploaded_file($file['tmp_name'], $targetPath)) {
    $relativeUrl = 'uploads/' . $type . '/' . $fileName;
    echo json_encode([
        'success' => true,
        'url' => $relativeUrl,
        'name' => $fileName
    ]);
} else {
    echo json_encode([
        'success' => false,
        'error' => 'Failed to save the uploaded file on the server.'
    ]);
}
