<?php
require 'auth.php';
$body = json_decode(file_get_contents('php://input'), true);
$token = getToken();

$ch = curl_init(AMADEUS_BASE . '/v1/shopping/flight-offers/pricing');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer $token",
        "Content-Type: application/json"
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'data' => [
            'type' => 'flight-offers-pricing',
            'flightOffers' => $body
        ]
    ])
]);
$res = json_decode(curl_exec($ch), true);
curl_close($ch);

jsonResponse($res);

