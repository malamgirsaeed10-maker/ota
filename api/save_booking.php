<?php
require 'config.php';
$db = new PDO("mysql:host=localhost;dbname=flightdb","root","");

$data = json_decode(file_get_contents('php://input'),true);
$stmt = $db->prepare("
INSERT INTO bookings 
(pnr,first_name,last_name,email,amount,currency,stripe_payment_id,environment)
VALUES (?,?,?,?,?,?,?,?)
");
$stmt->execute([
 $data['pnr'],
 $data['firstName'],
 $data['lastName'],
 $data['email'],
 $data['amount'],
 $data['currency'],
 $data['paymentId'],
 APP_ENV
]);

jsonResponse(['status'=>'saved']);
