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

// Show result on page + notification
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

// Live location tracking
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
            },
            error => alert("Please allow location access."),
            { enableHighAccuracy: true }
        );
    } else alert("Geolocation is not supported by your browser.");
}

// Manual place input
function loginWithPlaceName() {
    const place = document.getElementById("placeName").value;
    if (!place) return alert("Please enter a place name!");

    fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${place}&limit=1&appid=f6b138f613d74536572ca7800d8b31f7`)
    .then(res => res.json())
    .then(locData => {
        if (!locData[0]) return alert("Place not found!");
        const lat = locData[0].lat;
        const lon = locData[0].lon;

        fetch("/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat: lat, lon: lon })
        })
        .then(res => res.json())
        .then(data => {
            const rec = data.risk === "High" ? "Avoid this area" : "Safe to visit";

            if (userMarker) map.removeLayer(userMarker);
            userMarker = L.marker([lat, lon]).addTo(map).bindPopup(place).openPopup();
            map.setView([lat, lon], 12);

            showResult(place, data.risk, rec);
        });
    });
}
