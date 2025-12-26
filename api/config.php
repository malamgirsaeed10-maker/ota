<?php
declare(strict_types=1);

/**
 * GLOBAL CONFIG (Windows-safe, Apache-safe)
 */

require_once __DIR__ . '/../vendor/autoload.php';

/* ==========================================
   LOAD .ENV FILE MANUALLY (GUARANTEED)
========================================== */
$root = dirname(__DIR__);

if (!file_exists($root . '/.env')) {
    die('.env file not found at project root');
}

$dotenv = Dotenv\Dotenv::createImmutable($root);
$dotenv->load();

/* ==========================================
   SAFE ENV ACCESS (NO getenv())
========================================== */
function env(string $key, $default = null) {
    return $_ENV[$key] ?? $_SERVER[$key] ?? $default;
}

/* ==========================================
   APP ENV
========================================== */
define('APP_ENV', env('APP_ENV', 'TEST'));

/* ==========================================
   AMADEUS
========================================== */
define('AMADEUS_KEY', env('AMADEUS_KEY'));
define('AMADEUS_SECRET', env('AMADEUS_SECRET'));

if (!AMADEUS_KEY || !AMADEUS_SECRET) {
    die('Amadeus credentials are not configured');
}

define(
    'AMADEUS_BASE',
    APP_ENV === 'LIVE'
        ? 'https://api.amadeus.com'
        : 'https://test.api.amadeus.com'
);

/* ==========================================
   HELPERS
========================================== */
function jsonResponse(array $data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data, JSON_PRETTY_PRINT);
    exit;
}

function logError(string $message): void {
    file_put_contents(
        dirname(__DIR__) . '/logs/app.log',
        date('[Y-m-d H:i:s] ') . $message . PHP_EOL,
        FILE_APPEND
    );
}
