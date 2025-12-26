<?php

declare(strict_types=1);

header('Content-Type: application/json');

require_once __DIR__ . '/stripe_config.php';
require_once __DIR__ . '/../vendor/autoload.php';

use Stripe\Stripe;
use Stripe\PaymentIntent;

Stripe::setApiKey(STRIPE_SECRET);

// Read input
$input = json_decode(file_get_contents('php://input'), true);

if (
    !is_array($input) ||
    !isset($input['amount']) ||
    !is_numeric($input['amount'])
) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Invalid amount supplied'
    ]);
    exit;
}

try {
    $intent = PaymentIntent::create([
        'amount' => (int) round($input['amount'] * 100), // cents
        'currency' => 'usd',
        'automatic_payment_methods' => [
            'enabled' => true
        ],
        'metadata' => [
            'environment' => APP_ENV,
            'module' => 'flight-booking'
        ]
    ]);

    echo json_encode([
        'clientSecret' => $intent->client_secret,
        'publicKey'    => STRIPE_PUBLIC
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'error'   => 'Stripe PaymentIntent failed',
        'message' => $e->getMessage()
    ]);
}
