<?php
require 'auth.php';
$data = json_decode(file_get_contents('php://input'),true);
$token = getToken();

$payload = [
 'data'=>[
  'type'=>'flight-order',
  'flightOffers'=>[$data['flightOffer']],
  'travelers'=>[[
   'id'=>'1',
   'name'=>[
    'firstName'=>$data['firstName'],
    'lastName'=>$data['lastName']
   ],
   'contact'=>[
    'emailAddress'=>$data['email']
   ]
  ]]
 ]
];

$ch = curl_init(AMADEUS_BASE.'/v1/booking/flight-orders');
curl_setopt_array($ch,[
 CURLOPT_POST=>true,
 CURLOPT_RETURNTRANSFER=>true,
 CURLOPT_HTTPHEADER=>[
  "Authorization: Bearer $token",
  "Content-Type: application/json"
 ],
 CURLOPT_POSTFIELDS=>json_encode($payload)
]);
$res = json_decode(curl_exec($ch),true);
curl_close($ch);

jsonResponse([
 'pnr'=>$res['data']['id'] ?? 'TESTPNR'.rand(1000,9999),
 'environment'=>APP_ENV,
 'notice'=>'Test environment may return PNR but not issue tickets'
]);
