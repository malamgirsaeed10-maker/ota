/* =========================================================
   GLOBAL STATE
========================================================= */
let allFlights = [];
let pricedFlight = null;
let stripe = null;
let elements = null;

/* Airport cache */
const airportCache = {};
let activeIndex = -1;

/* =========================================================
   DOM READY
========================================================= */
document.addEventListener('DOMContentLoaded', () => {
    initAirportTypeahead();
    initTripTypeUI();
    initMultiCityUI();
    initSearchForm();
});
/* =========================================================
   AIRLINE FILTERS
========================================================= */
function buildAirlineFilters(flights) {
    const container = document.getElementById('airlineFilters');

    // If filter UI does not exist, fail silently
    if (!container) return;

    container.innerHTML = '';

    const airlines = new Set();

    flights.forEach(flight => {
        if (Array.isArray(flight.validatingAirlineCodes)) {
            flight.validatingAirlineCodes.forEach(code => airlines.add(code));
        }
    });

    if (!airlines.size) return;

    airlines.forEach(code => {
        const label = document.createElement('label');
        label.innerHTML = `
            <input type="checkbox" class="filter-airline" value="${code}">
            ${code}
        `;
        container.appendChild(label);
        container.appendChild(document.createElement('br'));
    });
}

/* =========================================================
   AIRPORT TYPEAHEAD (FAST + KEYBOARD + CACHE)
========================================================= */
function initAirportTypeahead() {

    function bind(inputId, listId) {
        const input = document.getElementById(inputId);
        const list = document.getElementById(listId);
        let controller = null;

        input.addEventListener('input', async () => {
            const q = input.value.trim().toUpperCase();
            activeIndex = -1;

            if (q.length < 2) {
                list.style.display = 'none';
                return;
            }

            /* Cache */
            if (airportCache[q]) {
                renderList(airportCache[q]);
                return;
            }

            if (controller) controller.abort();
            controller = new AbortController();

            try {
                const res = await fetch(`../api/airports.php?q=${q}`, {
                    signal: controller.signal
                });
                const data = await res.json();
                airportCache[q] = data;
                renderList(data);
            } catch (e) {
                if (e.name !== 'AbortError') console.error(e);
            }
        });

        input.addEventListener('keydown', e => {
            const items = list.querySelectorAll('.typeahead-item');
            if (!items.length) return;

            if (e.key === 'ArrowDown') {
                activeIndex = (activeIndex + 1) % items.length;
            } else if (e.key === 'ArrowUp') {
                activeIndex = (activeIndex - 1 + items.length) % items.length;
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (items[activeIndex]) items[activeIndex].click();
            }

            items.forEach((el, i) =>
                el.classList.toggle('active', i === activeIndex)
            );
        });

        function renderList(data) {
            list.innerHTML = '';
            if (!Array.isArray(data) || !data.length) return;

            data.slice(0, 8).forEach(a => {
                const div = document.createElement('div');
                div.className = 'typeahead-item';
                div.innerHTML = `<strong>${a.iataCode}</strong> ${a.name}`;
                div.onclick = () => {
                    input.value = a.iataCode;
                    list.style.display = 'none';
                };
                list.appendChild(div);
            });

            list.style.display = 'block';
        }
    }

    bind('origin', 'origin-list');
    bind('destination', 'destination-list');
}

/* =========================================================
   TRIP TYPE UI
========================================================= */
function initTripTypeUI() {
    document.querySelectorAll('[name="tripType"]').forEach(r => {
        r.addEventListener('change', e => {
            document.getElementById('returnDateWrap')
                ?.classList.toggle('hidden', e.target.value !== 'RETURN');

            document.getElementById('multiCityWrap')
                ?.classList.toggle('hidden', e.target.value !== 'MULTI');
        });
    });
}

/* =========================================================
   MULTI-CITY UI (ADD / REMOVE LEGS)
========================================================= */
function initMultiCityUI() {
    const container = document.getElementById('multiCityWrap');
    if (!container) return;

    document.getElementById('addLeg').onclick = () => {
        const idx = container.children.length + 1;
        container.insertAdjacentHTML('beforeend', `
            <div class="leg">
                <input placeholder="From" class="mc-origin">
                <input placeholder="To" class="mc-destination">
                <input type="date" class="mc-date">
            </div>
        `);
    };
}

/* =========================================================
   BUILD SEARCH PAYLOAD (FIXED)
========================================================= */
function buildSearchPayload() {
    const type = document.querySelector('[name="tripType"]:checked')?.value || 'ONE_WAY';
    let originDestinations = [];

    if (type === 'ONE_WAY') {
        originDestinations.push({
            id: '1',
            originLocationCode: origin.value,
            destinationLocationCode: destination.value,
            departureDateTimeRange: { date: departureDate.value }
        });
    }

    if (type === 'RETURN') {
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

    if (type === 'MULTI') {
        document.querySelectorAll('.leg').forEach((l, i) => {
            originDestinations.push({
                id: String(i + 1),
                originLocationCode: l.querySelector('.mc-origin').value,
                destinationLocationCode: l.querySelector('.mc-destination').value,
                departureDateTimeRange: { date: l.querySelector('.mc-date').value }
            });
        });
    }

    return {
        currencyCode: 'USD',
        originDestinations,
        travelers: [{ id: '1', travelerType: 'ADULT' }],
        sources: ['GDS']
    };
}

/* =========================================================
   SEARCH FLIGHTS (GET — API COMPATIBLE)
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
            const res = await fetch(`../api/search.php?${params.toString()}`);
            const data = await res.json();

            if (data.errors?.length) {
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
   CHEAPEST / FASTEST BADGES
========================================================= */
function markBadges(flights) {
    const cheapest = Math.min(...flights.map(f => +f.price.total));
    const fastest = Math.min(...flights.map(f =>
        f.itineraries.reduce((t, i) => t + i.duration.replace(/[A-Z]/g, ':'), 0)
    ));

    return flights.map(f => ({
        ...f,
        badge:
            +f.price.total === cheapest ? 'Cheapest' :
                f.itineraries[0].duration === fastest ? 'Fastest' : null
    }));
}

/* =========================================================
   RENDER RESULTS
========================================================= */
function renderResults(flights) {
    const r = document.getElementById('results');
    r.innerHTML = '';

    flights.forEach(f => {
        r.innerHTML +=
            f.itineraries.length === 2
                ? renderReturnCard(f)
                : renderOneWayCard(f);
    });
}

function addBadges(flights) {
    const cheapest = Math.min(...flights.map(f => +f.price.total));

    flights.forEach(f => {
        if (+f.price.total === cheapest) {
            f.badge = 'Cheapest';
        }
    });

    return flights;
}



document.addEventListener('change', e => {
    if (!e.target.classList.contains('filter-airline')) return;

    const selected = [...document.querySelectorAll('.filter-airline:checked')]
        .map(i => i.value);

    const filteredFlights = selected.length
        ? allFlights.filter(f =>
            selected.includes(f.validatingAirlineCodes[0]))
        : allFlights;

    renderResults(filteredFlights);
});
/* =========================================================
   FLIGHT HELPER FUNCTIONS (GLOBAL)
========================================================= */

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
    if (segments.length === 1) return 'Direct';
    return `${segments.length - 1} stop · ${segments[0].arrival.iataCode}`;
}


function renderReturnCard(f) {
    const outSegs = f.itineraries[0].segments;
    const retSegs = f.itineraries[1].segments;
    const carrier = f.validatingAirlineCodes[0];

    return `
    <div class="flight-card" style="position:relative; flex-direction:column">

        ${f.badge ? `
            <span class="badge" style="
                position:absolute;
                top:-10px;
                left:20px;
                background:var(--primary);
                padding:4px 12px;
                border-radius:20px;
                font-size:0.7rem;
                font-weight:bold;
                color:#fff;">
                ${f.badge}
            </span>
        ` : ''}

        ${renderLeg(outSegs, carrier)}
        <div class="return-divider"></div>
        ${renderLeg(retSegs, carrier, true, f)}
    </div>
    `;
}

function renderLeg(segs, carrier, showPrice = false, flight = null) {
    return `
    <div class="flight-left">
        <div class="airline-box">
            <img src="https://pics.avs.io/60/60/${carrier}.png"
                 onerror="this.style.display='none'">
        </div>

        <div class="flight-info-row"
             style="flex:1; display:flex; justify-content:space-around; align-items:center; margin-left:20px;">

            <div class="flight-segment text-center">
                <span class="time-big">${time(segs[0].departure.at)}</span>
                <span class="code-small">${segs[0].departure.iataCode}</span>
            </div>

            <div class="flight-center">
                <span class="flight-duration">${duration(segs)}</span>
                <span class="duration-line"></span>
                <span class="flight-stop">${stops(segs)}</span>
            </div>

            <div class="flight-segment text-center">
                <span class="time-big">${time(segs.at(-1).arrival.at)}</span>
                <span class="code-small">${segs.at(-1).arrival.iataCode}</span>
            </div>
        </div>

        ${showPrice ? `
        <div class="price-tag">
            <span>Total Fare</span>
            <strong>${flight.price.currency} ${flight.price.total}</strong>
            <button onclick='selectFlight(${JSON.stringify(flight)})'>
                Select →
            </button>
        </div>` : ''}
    </div>`;
}

function airlineLogo(code) {
    return `<img src="assets/airlines/${code}.png"
                 onerror="this.style.display='none'"
                 class="airline-logo">`;
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


function sortFlights(type) {
    let sorted = [...allFlights];

    if (type === 'cheap') {
        sorted.sort((a, b) => +a.price.total - +b.price.total);
    }

    if (type === 'fast') {
        sorted.sort((a, b) =>
            a.itineraries[0].duration.localeCompare(b.itineraries[0].duration)
        );
    }

    if (type === 'best') {
        sorted.sort((a, b) =>
            (+a.price.total * 0.6) -
            (+b.price.total * 0.6)
        );
    }

    renderResults(sorted);
}
