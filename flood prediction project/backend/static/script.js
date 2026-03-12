let map, userMarker;

// Initialize map
map = L.map('map').setView([20, 77], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

// Ask permission for notifications
function askPermission() {
    if ("Notification" in window) {
        Notification.requestPermission();
    }
}

// Show result
function showResult(place, floodRisk, recommendation) {
    const resultDiv = document.getElementById("result");
    let color = "green";
    if(floodRisk === "Medium") color = "orange";
    else if(floodRisk === "High") color = "red";

    resultDiv.style.backgroundColor = color;
    resultDiv.innerHTML = `
        <p>Location: <b>${place}</b></p>
        <p>Flood Risk: <b>${floodRisk}</b></p>
        <p>Recommendation: ${recommendation}</p>
    `;

    if ("Notification" in window && Notification.permission === "granted") {
        new Notification(`Flood Risk Alert: ${place}`, {
            body: `Risk Level: ${floodRisk}\n${recommendation}`,
            icon: "https://cdn-icons-png.flaticon.com/512/564/564619.png"
        });
    }
}

// Live Location Tracking
function loginWithLiveLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                if (userMarker) map.removeLayer(userMarker);
                userMarker = L.marker([lat, lon]).addTo(map).bindPopup("You are here").openPopup();
                map.setView([lat, lon], 12);

                fetch("/predict", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ lat: lat, lon: lon })
                })
                .then(res => res.json())
                .then(data => {
                    const rec = data.risk === "High" ? "Avoid this area" : "Safe to visit";
                    showResult("Your Location", data.risk, rec);
                });

            }, error => alert("Please allow location access."),
            { enableHighAccuracy: true }
        );
    } else alert("Geolocation is not supported by your browser.");
}

// Manual Place Input
function loginWithPlaceName() {
    const place = document.getElementById("placeName").value;

    if (!place) {
        alert("Please enter a place!");
        return;
    }

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${place}`)
    .then(res => res.json())
    .then(data => {

        if(data.length === 0){
            alert("Place not found");
            return;
        }

        const lat = data[0].lat;
        const lon = data[0].lon;

        if (userMarker) map.removeLayer(userMarker);

        userMarker = L.marker([lat, lon]).addTo(map)
            .bindPopup(place)
            .openPopup();

        map.setView([lat, lon], 12);

        fetch("/predict", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({lat: lat, lon: lon})
})
.then(res => res.json())
.then(data => {

    const rec = data.risk === "High"
        ? "Avoid this area"
        : "Safe to visit";

    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
    .then(res => res.json())
    .then(location => {

        const placeName = location.display_name;

        showResult(placeName, data.risk, rec);

    });

});

        });

    };

function enableSafety() {

    // Ask notification permission
    if ("Notification" in window) {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                console.log("Notifications enabled");
            }
        });
    }

    // Ask location permission
    if (navigator.geolocation) {

        navigator.geolocation.getCurrentPosition(

            function(position) {

                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                console.log("Location enabled:", lat, lon);

                startFloodMonitoring(lat, lon);

            },

            function() {
                alert("Location permission is required for flood alerts.");
            },

            { enableHighAccuracy: true }

        );

    } else {
        alert("Geolocation not supported");
    }

}


function startFloodMonitoring(lat, lon) {

    fetch("/predict", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            lat: lat,
            lon: lon
        })
    })
    .then(res => res.json())
    .then(data => {

        const risk = data.risk;

        if(risk === "High") {

            new Notification("Flood Warning!", {
                body: "High flood risk near your area.",
                icon: "https://cdn-icons-png.flaticon.com/512/564/564619.png"
            });

        }

    });

}
map.on("click", function(e) {

    const lat = e.latlng.lat;
    const lon = e.latlng.lng;

    if (userMarker) {
        map.removeLayer(userMarker);
    }

    userMarker = L.marker([lat, lon]).addTo(map)
        .bindPopup("Selected Location")
        .openPopup();

    map.setView([lat, lon], 12);

    fetch("/predict", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            lat: lat,
            lon: lon
        })
    })
    .then(res => res.json())
    .then(data => {

        const rec = data.risk === "High"
            ? "Avoid this area"
            : "Safe to visit";

        showResult("Selected Map Location", data.risk, rec);

    });

});