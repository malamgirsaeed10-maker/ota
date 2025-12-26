<?php
$pnr = htmlspecialchars($_GET['pnr'] ?? 'N/A');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Booking Confirmation</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: system-ui; background:#f5f7fa; padding:30px; }
        .box {
            max-width:600px;
            margin:auto;
            background:#fff;
            padding:30px;
            border-radius:8px;
            box-shadow:0 8px 25px rgba(0,0,0,.1);
        }
        .success { color:green; font-size:18px; }
        .note {
            background:#fff3cd;
            padding:15px;
            border-radius:6px;
            margin-top:20px;
            color:#856404;
        }
    </style>
</head>
<body>

<div class="box">
    <h2 class="success">Booking Confirmed</h2>

    <p><strong>PNR:</strong> <?= $pnr ?></p>

    <p>Your booking has been successfully created.</p>

    <div class="note">
        <strong>Important Notice:</strong><br>
        This booking was created in the Amadeus TEST environment.
        A PNR may be generated, however <strong>no airline ticket has been issued</strong>.
    </div>

    <br>
    <a href="index.php">Book another flight</a>
</div>

</body>
</html>
