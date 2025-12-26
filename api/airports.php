<?php
require_once 'auth.php';

$q = trim($_GET['q'] ?? '');
if (strlen($q) < 2) jsonResponse([]);

$token = getToken();

$url = AMADEUS_BASE . "/v1/reference-data/locations?subType=AIRPORT,CITY&keyword=$q&view=LIGHT";

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ["Authorization: Bearer $token"]
]);

$data = json_decode(curl_exec($ch), true);
curl_close($ch);

jsonResponse($data['data'] ?? []);
