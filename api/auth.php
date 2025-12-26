<?php
require_once 'config.php';

function getToken(): string {
    static $token = null;
    static $expires = 0;

    if ($token && time() < $expires) {
        return $token;
    }

    $ch = curl_init(AMADEUS_BASE . '/v1/security/oauth2/token');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
        CURLOPT_POSTFIELDS => http_build_query([
            'grant_type' => 'client_credentials',
            'client_id' => AMADEUS_KEY,
            'client_secret' => AMADEUS_SECRET
        ])
    ]);

    $response = json_decode(curl_exec($ch), true);
    curl_close($ch);

    if (!isset($response['access_token'])) {
        logError('OAuth failure');
        jsonResponse(['error' => 'Authentication failed'], 500);
    }

    $token = $response['access_token'];
    $expires = time() + $response['expires_in'] - 60;
    return $token;
}
