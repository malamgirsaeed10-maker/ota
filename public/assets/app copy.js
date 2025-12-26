/* =========================================================
   GLOBAL STATE
========================================================= */
let selectedFlight = null;
let pricedFlight = null;
let stripe = null;
let elements = null;
let allFlights = [];

/* =========================================================
   DOM READY
========================================================= */
document.addEventListener('DOMContentLoaded', () => {
    initAirportTypeahead();
    initSearchForm();
    initPassengerFlow();
    initPaymentForm();
});
function buildAirlineFilters(flights) {
    const container = document.getElementById('airlineFilters');
    container.innerHTML = '';

    const airlines = new Set();

    flights.forEach(f =>
        f.validatingAirlineCodes.forEach(c => airlines.add(c))
    );

    airlines.forEach(code => {
        container.innerHTML += `
            <label>
                <input type="checkbox" value="${code}" class="filter-airline">
                ${code}
            </label><br>
        `;
    });
}
function applyFilters() {
    const stopFilters = [...document.querySelectorAll('.filter-stop:checked')]
        .map(i => parseInt(i.value));

    const airlineFilters = [...document.querySelectorAll('.filter-airline:checked')]
        .map(i => i.value);

    const filtered = allFlights.filter(f => {
        const stops = f.itineraries[0].segments.length - 1;
        const airline = f.validatingAirlineCodes[0];

        const stopMatch =
            stopFilters.length === 0 || stopFilters.includes(stops >= 2 ? 2 : stops);

        const airlineMatch =
            airlineFilters.length === 0 || airlineFilters.includes(airline);

        return stopMatch && airlineMatch;
    });

    renderResults(filtered);
}
document.addEventListener('change', e => {
    if (e.target.classList.contains('filter-stop') ||
        e.target.classList.contains('filter-airline')) {
        applyFilters();
    }
});


function renderResults(flights) {
    const results = document.getElementById('results');
    results.innerHTML = '';

    flights.forEach(flight => {
        results.innerHTML +=
            flight.itineraries.length === 2
                ? renderReturnCard(flight)
                : renderOneWayCard(flight);
    });
}


/* =========================================================
   AIRPORT TYPEAHEAD
========================================================= */
function initAirportTypeahead() {

    function airportTypeahead(inputId, listId) {
        const input = document.getElementById(inputId);
        const list = document.getElementById(listId);
        let timer = null;

        if (!input || !list) return;

        input.addEventListener('input', () => {
            clearTimeout(timer);
            const q = input.value.trim();

            if (q.length < 2) {
                list.style.display = 'none';
                return;
            }

            timer = setTimeout(async () => {
                try {
                    const res = await fetch('../api/airports.php?q=' + encodeURIComponent(q));
                    const data = await res.json();
                    list.innerHTML = '';

                    if (!Array.isArray(data)) return;

                    data.forEach(a => {
                        const div = document.createElement('div');
                        div.className = 'typeahead-item';
                        div.innerHTML = `<strong>${a.iataCode}</strong> ${a.name}, ${a.address?.cityName || ''}`;
                        div.onclick = () => {
                            input.value = a.iataCode;
                            list.style.display = 'none';
                        };
                        list.appendChild(div);
                    });

                    list.style.display = 'block';
                } catch {
                    list.style.display = 'none';
                }
            }, 300);
        });

        document.addEventListener('click', e => {
            if (!e.target.closest(`#${inputId}`)) list.style.display = 'none';
        });
    }

    airportTypeahead('origin', 'origin-list');
    airportTypeahead('destination', 'destination-list');
}

function airlineLogo(code) {
    return `<img src="assets/airlines/${code}.png"
                 onerror="this.style.display='none'"
                 class="airline-logo">`;
}



/* ===============================
   FLIGHT UI HELPERS
================================ */

function time(at) {
    return new Date(at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function duration(segments) {
    let mins = 0;
    segments.forEach(s => {
        mins += (new Date(s.arrival.at) - new Date(s.departure.at)) / 60000;
    });
    return `${Math.floor(mins / 60)}h ${Math.round(mins % 60)}m`;
}

function stops(segments) {
    return segments.length === 1
        ? 'Direct'
        : `${segments.length - 1} stop · ${segments[0].arrival.iataCode}`;
}


function renderOneWayCard(flight) {
    const segs = flight.itineraries[0].segments;

    return `
<div class="flight-card">
    <div class="flight-left">
        <div class="airline-box">
            ${airlineLogo(flight.validatingAirlineCodes[0])}
        </div>

        <div class="flight-segment">
            <div>
                <div class="flight-time">${time(segs[0].departure.at)}</div>
                <div class="flight-code">${segs[0].departure.iataCode}</div>
            </div>

            <div class="flight-center">
                <div class="flight-duration">${duration(segs)}</div>
                <div class="flight-stop">${stops(segs)}</div>
            </div>

            <div>
                <div class="flight-time">${time(segs.at(-1).arrival.at)}</div>
                <div class="flight-code">${segs.at(-1).arrival.iataCode}</div>
            </div>
        </div>
    </div>

    <div class="flight-price">
        <strong>${flight.price.currency} ${flight.price.total}</strong>
        <button onclick='selectFlight(${JSON.stringify(flight)})'>
            Select →
        </button>
    </div>
</div>`;
}

function renderReturnCard(flight) {
    return `
<div class="flight-card" style="flex-direction:column">
    ${renderReturnLeg(flight.itineraries[0], flight, true)}
    <div class="return-divider"></div>
    ${renderReturnLeg(flight.itineraries[1], flight, false)}
</div>`;
}

function renderReturnLeg(itinerary, flight, showPrice) {
    const segs = itinerary.segments;

    return `
<div style="width:100%; display:flex; justify-content:space-between; align-items:center">
    <div class="flight-left">
        <div class="airline-box">
            <strong>${flight.validatingAirlineCodes[0]}</strong>
        </div>

        <div class="flight-segment">
            <div>
                <div class="flight-time">${time(segs[0].departure.at)}</div>
                <div class="flight-code">${segs[0].departure.iataCode}</div>
            </div>

            <div class="flight-center">
                <div class="flight-duration">${duration(segs)}</div>
                <div class="flight-stop">${stops(segs)}</div>
            </div>

            <div>
                <div class="flight-time">${time(segs.at(-1).arrival.at)}</div>
                <div class="flight-code">${segs.at(-1).arrival.iataCode}</div>
            </div>
        </div>
    </div>

    ${showPrice ? `
    <div class="flight-price">
        <strong>${flight.price.currency} ${flight.price.total}</strong>
        <button onclick='selectFlight(${JSON.stringify(flight)})'>
            Select →
        </button>
    </div>` : ''}
</div>`;
}







/* =========================================================
   SEARCH FLIGHTS
========================================================= */
function initSearchForm() {
    const form = document.getElementById('searchForm');
    const results = document.getElementById('results');

    form.addEventListener('submit', async e => {
        e.preventDefault();
        results.innerHTML = 'Searching flights…';

        const params = new URLSearchParams({
            originLocationCode: document.getElementById('origin').value,
            destinationLocationCode: document.getElementById('destination').value,
            departureDate: document.getElementById('departureDate').value,
            adults: document.getElementById('adults').value
        });


        try {
            const res = await fetch('../api/search.php?' + params.toString());
            const data = await res.json();

            results.innerHTML = '';

            if (data.errors) {
                results.innerHTML =
                    `<p style="color:red">${data.errors[0].detail}</p>`;
                return;
            }

            if (!Array.isArray(data.data) || data.data.length === 0) {
                results.innerHTML = '<p>No flights found.</p>';
                return;
            }

            allFlights = data.data;
            buildAirlineFilters(allFlights);
            renderResults(allFlights);


        } catch (err) {
            console.error(err);
            results.innerHTML =
                '<p style="color:red">Search failed.</p>';
        }
    });
}




/* =========================================================
   FLIGHT SELECTION & PRICING
========================================================= */
async function selectFlight(flight) {
    try {
        const res = await fetch('../api/pricing.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify([flight])
        });

        const data = await res.json();
        if (!data?.data?.flightOffers) {
            alert('Pricing failed');
            return;
        }

        pricedFlight = data.data.flightOffers[0];
        openPassengerModal();

    } catch {
        alert('Pricing error');
    }
}

/* =========================================================
   PASSENGER FLOW
========================================================= */
function initPassengerFlow() {
    document.getElementById('continueToPay').onclick = () => {
        const inputs = document.querySelectorAll('#passengerForm input');
        for (const i of inputs) {
            if (!i.value.trim()) {
                alert('Fill all passenger details');
                return;
            }
        }
        document.getElementById('passengerModal').classList.add('hidden');
        startPayment();
    };
}

function openPassengerModal() {
    const count = parseInt(adults.value, 10);
    const form = document.getElementById('passengerForm');
    form.innerHTML = '';

    for (let i = 1; i <= count; i++) {
        form.innerHTML += `
            <h4>Passenger ${i}</h4>
            <input name="firstName${i}" placeholder="First Name" required>
            <input name="lastName${i}" placeholder="Last Name" required>
            <input name="email${i}" placeholder="Email" required>
            <hr>
        `;
    }

    document.getElementById('passengerModal').classList.remove('hidden');
}

/* =========================================================
   STRIPE PAYMENT
========================================================= */
async function startPayment() {
    const res = await fetch('../api/create_payment.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: pricedFlight.price.total })
    });

    const data = await res.json();
    stripe = Stripe(data.publicKey);
    elements = stripe.elements({ clientSecret: data.clientSecret });

    const paymentElement = elements.create('payment');
    paymentElement.mount('#payment-element');

    document.getElementById('paymentModal').classList.remove('hidden');
}

function initPaymentForm() {
    document.getElementById('payment-form').onsubmit = async e => {
        e.preventDefault();

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            redirect: 'if_required'
        });

        if (error) {
            document.getElementById('payment-error').innerText = error.message;

            return;
        }

        document.getElementById('paymentModal').classList.add('hidden');
        finalizeBooking(paymentIntent.id);
    };
}

/* =========================================================
   FINAL BOOKING
========================================================= */
async function finalizeBooking(paymentId) {
    const passenger = {
        firstName: document.querySelector('[name="firstName1"]').value,
        lastName: document.querySelector('[name="lastName1"]').value,
        email: document.querySelector('[name="email1"]').value
    };

    const res = await fetch('../api/book.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            flightOffer: pricedFlight,
            ...passenger,
            paymentId
        })
    });

    const booking = await res.json();

    await fetch('../api/save_booking.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...passenger,
            pnr: booking.pnr,
            amount: pricedFlight.price.total,
            currency: pricedFlight.price.currency,
            paymentId
        })
    });

    window.location.href = `confirmation.php?pnr=${booking.pnr}`;
}




document.querySelectorAll('[name="tripType"]').forEach(radio => {
    radio.addEventListener('change', e => {
        const type = e.target.value;
        document.getElementById('returnDateWrap')
            .classList.toggle('d-none', type !== 'RETURN');
    });
});
function buildSearchPayload() {
    const tripType = document.querySelector('[name="tripType"]:checked').value;
    const adultsCount = adults.value;

    let originDestinations = [];

    if (tripType === 'ONE_WAY') {
        originDestinations.push({
            id: '1',
            originLocationCode: origin.value,
            destinationLocationCode: destination.value,
            departureDateTimeRange: {
                date: departureDate.value
            }
        });
    }

    if (tripType === 'RETURN') {
        originDestinations.push(
            {
                id: '1',
                originLocationCode: origin.value,
                destinationLocationCode: destination.value,
                departureDateTimeRange: { date: departureDate.value }
            },
            {
                id: '2',
                originLocationCode: destination.value,
                destinationLocationCode: origin.value,
                departureDateTimeRange: { date: returnDate.value }
            }
        );
    }

    // MULTI (basic)
    if (tripType === 'MULTI') {
        originDestinations.push(
            {
                id: '1',
                originLocationCode: origin.value,
                destinationLocationCode: destination.value,
                departureDateTimeRange: { date: departureDate.value }
            }
            // future legs can be added here
        );
    }

    return {
        currencyCode: 'USD',
        originDestinations,
        travelers: [{ id: '1', travelerType: 'ADULT' }],
        sources: ['GDS']
    };
}
