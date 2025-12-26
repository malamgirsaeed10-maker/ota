<?php
require_once 'auth.php';

$required = [
    'originLocationCode',
    'destinationLocationCode',
    'departureDate',
    'adults'
];

foreach ($required as $r) {
    if (empty($_GET[$r])) {
        jsonResponse(['error' => "Missing parameter: $r"], 422);
    }
}

$params = http_build_query($_GET);
$token = getToken();

$ch = curl_init(AMADEUS_BASE . "/v2/shopping/flight-offers?$params");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ["Authorization: Bearer $token"]
]);

$response = curl_exec($ch);
curl_close($ch);

jsonResponse(json_decode($response, true));
