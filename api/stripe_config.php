<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

$stripeEnv = env('STRIPE_ENV', 'TEST');

if ($stripeEnv === 'LIVE') {
    $secret = env('STRIPE_LIVE_SECRET');
    $public = env('STRIPE_LIVE_PUBLIC');
} else {
    $secret = env('STRIPE_TEST_SECRET');
    $public = env('STRIPE_TEST_PUBLIC');
}

if (!$secret || !$public) {
    http_response_code(500);
    echo json_encode(['error' => 'Stripe keys are not configured properly']);
    exit;
}

define('STRIPE_SECRET', $secret);
define('STRIPE_PUBLIC', $public);
