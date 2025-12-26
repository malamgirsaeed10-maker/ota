<?php

declare(strict_types=1); ?>
<!DOCTYPE html>
<html>

<head>
    <title>Flight Booking</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="assets/style.css">
</head>

<body>

    <h2>Flight Booking (Test Environment)</h2>
    <p><strong>Notice:</strong> Test environment may return PNR but does not issue tickets.</p>
    <div class="mb-3">
        <label class="form-label fw-bold">Trip Type</label>
        <div class="btn-group w-100" role="group">
            <input type="radio" class="btn-check" name="tripType" id="oneway" value="ONE_WAY" checked>
            <label class="btn btn-outline-primary" for="oneway">One Way</label>

            <input type="radio" class="btn-check" name="tripType" id="return" value="RETURN">
            <label class="btn btn-outline-primary" for="return">Return</label>

            <input type="radio" class="btn-check" name="tripType" id="multi" value="MULTI">
            <label class="btn btn-outline-primary" for="multi">Multi-City</label>
        </div>
    </div>

    <form id="searchForm">
        <div style="position:relative">
            <label>Origin Airport</label>
            <input id="origin" autocomplete="off" required>
            <div class="typeahead" id="origin-list"></div>
        </div>

        <div style="position:relative">
            <label>Destination Airport</label>
            <input id="destination" autocomplete="off" required>
            <div class="typeahead" id="destination-list"></div>
        </div>

        <div class="row g-3">
            <div class="col-md-4">
                <label>Departure Date</label>
                <input id="departureDate" type="date" class="form-control" required>
            </div>

            <div class="col-md-4 d-none" id="returnDateWrap">
                <label>Return Date</label>
                <input id="returnDate" type="date" class="form-control">
            </div>
        </div>


        <select id="adults">
            <option value="1">1</option>
            <option value="2">2</option>
        </select>

        <button type="submit">Search</button>
    </form>

    <div style="display:flex; gap:20px; margin-top:20px">

        <!-- FILTERS -->
        <div id="filters" style="width:220px">
            <h4>Stops</h4>
            <label><input type="checkbox" value="0" class="filter-stop"> Direct</label><br>
            <label><input type="checkbox" value="1" class="filter-stop"> 1 Stop</label><br>
            <label><input type="checkbox" value="2" class="filter-stop"> 2+ Stops</label>

            <hr>

            <h4>Airlines</h4>
            <div id="airlineFilters"></div>
        </div>

        <!-- RESULTS -->
        <div id="sortBar" style="margin:20px 0; display:flex; gap:10px;">
            <button onclick="sortFlights('cheap')">Cheapest</button>
            <button onclick="sortFlights('fast')">Fastest</button>
            <button onclick="sortFlights('best')">Best</button>
        </div>

        <div id="results" style="flex:1"></div>
    </div>


    <!-- PASSENGER MODAL -->
    <div id="passengerModal" class="modal hidden">
        <div class="modal-content">
            <h3>Passenger Details</h3>
            <form id="passengerForm"></form>
            <button id="continueToPay">Continue to Payment</button>
        </div>
    </div>

    <!-- PAYMENT MODAL -->
    <div id="paymentModal" class="modal hidden">
        <div class="modal-content">
            <h3>Secure Payment</h3>
            <form id="payment-form">
                <div id="payment-element"></div>
                <button>Pay & Confirm Booking</button>
            </form>
            <div id="payment-error" style="color:red"></div>
        </div>
    </div>

    <script src="https://js.stripe.com/v3/"></script>
    <script src="assets/app.js"></script>

</body>

</html>