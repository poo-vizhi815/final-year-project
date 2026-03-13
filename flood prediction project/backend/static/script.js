// Map and markers
let map;
let userMarker;
let riskCircle;

// Initialize the application
function initializeApp() {
    initializeMap();
    askPermission();
}

// Initialize Leaflet Map
function initializeMap() {
    map = L.map('map').setView([20, 77], 5);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    // Right-click context menu for map
    map.on('contextmenu', handleMapRightClick);

    // Add instruction at 5 second delay
    setTimeout(() => {
        if (map) {
            L.control.attribution({position: 'bottomright'}).addTo(map);
        }
    }, 100);
}

// Handle right-click on map
function handleMapRightClick(e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    // Get place name via reverse geocoding
    reverseGeocode(lat, lng).then(placeName => {
        document.getElementById('placeName').value = placeName;
        
        // Show loading state
        showLoadingState();
        
        // Fetch prediction
        fetchPrediction(lat, lng, placeName);
    });
}

// Reverse geocoding using Nominatim
async function reverseGeocode(lat, lon) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
        const data = await response.json();
        
        const place = data.address?.city || data.address?.town || data.address?.village || 
                     data.address?.county || data.address?.state || 'Selected Location';
        return place;
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return 'Selected Location';
    }
}

// Geocode place name to coordinates
async function geoCodPlace(placeName) {
    try {
        // Clean the place name
        const cleanedPlace = placeName.trim();
        
        // Try Nominatim first (support for small villages and districts)
        console.log('Geocoding:', cleanedPlace);
        
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanedPlace)}&format=json&limit=5&countrycodes=in`;
        const response = await fetch(nominatimUrl);
        const data = await response.json();
        
        console.log('Nominatim results:', data);
        
        if (data && data.length > 0) {
            // Filter for most relevant results
            let bestResult = data[0];
            
            // Prefer exact or partial name matches
            for (let result of data) {
                const displayName = result.display_name.toLowerCase();
                if (displayName.includes(cleanedPlace.toLowerCase())) {
                    bestResult = result;
                    break;
                }
            }
            
            return {
                lat: parseFloat(bestResult.lat),
                lon: parseFloat(bestResult.lon),
                display_name: bestResult.display_name
            };
        }
        
        // Fallback to OpenWeatherMap API
        const weatherUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cleanedPlace)}&limit=5&appid=f6b138f613d74536572ca7800d8b31f7`;
        const weatherResponse = await fetch(weatherUrl, { timeout: 5000 });
        const weatherData = await weatherResponse.json();
        
        console.log('OpenWeatherMap results:', weatherData);
        
        if (weatherData && weatherData.length > 0) {
            const best = weatherData[0];
            return {
                lat: best.lat,
                lon: best.lon,
                display_name: `${best.name}${best.state ? ', ' + best.state : ''}, ${best.country}`
            };
        }
        
        // Try with country code (India specific)
        const indiaUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cleanedPlace + ',IN')}&limit=1&appid=f6b138f613d74536572ca7800d8b31f7`;
        const indiaResponse = await fetch(indiaUrl, { timeout: 5000 });
        const indiaData = await indiaResponse.json();
        
        if (indiaData && indiaData.length > 0) {
            const best = indiaData[0];
            return {
                lat: best.lat,
                lon: best.lon,
                display_name: `${best.name}${best.state ? ', ' + best.state : ''}, ${best.country}`
            };
        }
        
        console.error('No results found for:', cleanedPlace);
        return null;
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
}

// Ask for notification permission
function askPermission() {
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }
}

// Show loading state
function showLoadingState() {
    const panel = document.getElementById('resultPanel');
    panel.classList.remove('hidden');
    panel.classList.add('show');
    document.querySelector('.result-content h2').textContent = 'Loading...';
}

// Fetch prediction from backend
async function fetchPrediction(lat, lon, locationName) {
    try {
        const response = await fetch('/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lat: lat,
                lon: lon,
                location_name: locationName
            })
        });

        const data = await response.json();
        displayResults(locationName, lat, lon, data);
    } catch (error) {
        console.error('Prediction error:', error);
        showError('Failed to fetch prediction. Please try again.');
    }
}

// Display results in the result panel
function displayResults(location, lat, lon, data) {
    const panel = document.getElementById('resultPanel');
    
    // Update location
    document.getElementById('resultLocation').textContent = location;
    document.getElementById('resultLocation').className = 'value';
    
    // Update flood risk with color coding
    const floodRiskEl = document.getElementById('resultFloodRisk');
    floodRiskEl.textContent = data.risk;
    floodRiskEl.className = 'value risk-' + data.risk.toLowerCase();
    
    // Update rainfall
    document.getElementById('resultRainfall').textContent = `${data.rainfall} cm`;
    document.getElementById('resultRainfall').className = 'value rainfall-' + 
        data.rainfall_category.toLowerCase().replace(' ', '-');
    
    // Update rainfall status
    const rainfallStatusEl = document.getElementById('resultRainfallStatus');
    rainfallStatusEl.textContent = data.rainfall_category + (data.over_rainfall ? ' ⚠️' : '');
    rainfallStatusEl.className = 'value ' + (data.over_rainfall ? 'rainfall-over' : '');
    
    // Update landslide risk
    const landslideEl = document.getElementById('resultLandslide');
    landslideEl.textContent = data.landslide;
    landslideEl.className = 'value landslide-' + data.landslide.toLowerCase();
    
    // Update temperature and humidity
    document.getElementById('resultTemp').textContent = `${data.temperature}°C`;
    document.getElementById('resultHumidity').textContent = `${data.humidity}%`;
    
    // Update recommendation
    document.getElementById('recommendationText').textContent = data.recommendation;
    
    // Update map
    updateMapMarkers(lat, lon, location, data.risk);
    
    // Show result panel
    panel.classList.remove('hidden');
    panel.classList.add('show');
    
    // Send notification
    sendNotification(location, data);
}

// Update map markers and visualization
function updateMapMarkers(lat, lon, location, riskLevel) {
    // Remove existing markers
    if (userMarker) map.removeLayer(userMarker);
    if (riskCircle) map.removeLayer(riskCircle);
    
    // Add marker
    userMarker = L.marker([lat, lon]).addTo(map);
    userMarker.bindPopup(`<b>${location}</b><br>Risk: ${riskLevel}`).openPopup();
    
    // Add risk circle with color based on risk level
    let color;
    let radius;
    
    if (riskLevel === 'High') {
        color = '#dc3545'; // Red
        radius = 5000;
    } else if (riskLevel === 'Medium') {
        color = '#ff9800'; // Orange
        radius = 3000;
    } else {
        color = '#28a745'; // Green
        radius = 2000;
    }
    
    riskCircle = L.circle([lat, lon], {
        color: color,
        fill: true,
        fillColor: color,
        fillOpacity: 0.2,
        radius: radius
    }).addTo(map);
    
    // Center map
    map.setView([lat, lon], 12);
}

// Send notification
function sendNotification(location, data) {
    if ("Notification" in window && Notification.permission === "granted") {
        const title = `Risk Alert: ${location}`;
        const options = {
            body: `Flood: ${data.risk} | Landslide: ${data.landslide}\nRainfall: ${data.rainfall} cm`,
            icon: 'https://cdn-icons-png.flaticon.com/512/564/564619.png',
            tag: 'risk-alert'
        };
        new Notification(title, options);
    }
}

// Search place by name
async function searchPlace() {
    const placeName = document.getElementById('placeName').value.trim();
    
    if (!placeName) {
        alert('Please enter a place name!');
        return;
    }
    
    showLoadingState();
    
    try {
        // Use backend search endpoint for better accuracy
        const searchResponse = await fetch(`/search-location?q=${encodeURIComponent(placeName)}`);
        const searchData = await searchResponse.json();
        
        if (!searchData.success) {
            alert(`Location "${placeName}" not found. Try:\n- Using full district name (e.g., "Vellore District")\n- Right-clicking on the map`);
            document.getElementById('resultPanel').classList.add('hidden');
            return;
        }
        
        const displayName = searchData.display_name || placeName;
        document.getElementById('placeName').value = displayName;
        fetchPrediction(searchData.lat, searchData.lon, displayName);
    } catch (error) {
        console.error('Search error:', error);
        alert('Error searching location. Please try again.');
        document.getElementById('resultPanel').classList.add('hidden');
    }
}

// Get user's live location
function getUserLocation() {
    if (navigator.geolocation) {
        showLoadingState();
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const placeName = await reverseGeocode(lat, lon);
                
                document.getElementById('placeName').value = placeName;
                fetchPrediction(lat, lon, placeName);
            },
            (error) => {
                alert('Please allow location access: ' + error.message);
                document.getElementById('resultPanel').classList.add('hidden');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    } else {
        alert('Geolocation is not supported by your browser.');
    }
}

// Show error
function showError(message) {
    document.getElementById('resultPanel').classList.add('hidden');
    alert(message);
}
