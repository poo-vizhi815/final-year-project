from flask import Flask, render_template, request, jsonify
import requests

app = Flask(__name__)

# OpenWeatherMap API key
API_KEY = "f6b138f613d74536572ca7800d8b31f7"

# Hardcoded landslide-prone regions (districts/areas in India)
LANDSLIDE_PRONE_REGIONS = {
    'himachal pradesh', 'uttarakhand', 'darjeeling', 'nilgiris', 'khasi hills',
    'mizoram', 'meghalaya', 'nagaland', 'manipur', 'arunachal pradesh',
    'assam', 'sikkim', 'tripura', 'munnar', 'ooty', 'kodaikanal', 'coorg',
    'madras', 'tamil nadu', 'karnataka', 'western ghats', 'himalayas'
}

def get_rainfall_category(rainfall_mm):
    """Classify rainfall intensity"""
    if rainfall_mm < 5:
        return "Low", False
    elif rainfall_mm < 15:
        return "Moderate", False
    elif rainfall_mm < 20:
        return "Heavy", False
    else:
        return "OverRainfall Warning", True

def predict_landslide(rainfall_mm, location_name, humidity):
    """Predict landslide risk based on rainfall, location, and humidity"""
    location_lower = location_name.lower()
    
    # Check if location is in landslide-prone regions
    is_hilly = any(region in location_lower for region in LANDSLIDE_PRONE_REGIONS)
    
    # Landslide prediction logic
    if rainfall_mm > 20 and is_hilly:
        return "Predicted"
    elif rainfall_mm > 15 and is_hilly and humidity > 75:
        return "Predicted"
    elif rainfall_mm > 20 and humidity > 85:
        return "Likely"
    else:
        return "Nil"

def get_reverse_geocode(lat, lon):
    """Get place name from coordinates using Nominatim"""
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}"
        response = requests.get(url, timeout=5).json()
        return response.get("address", {}).get("city") or response.get("address", {}).get("town") or response.get("address", {}).get("village") or "Unknown Location"
    except:
        return "Unknown Location"

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    """Enhanced prediction endpoint with rainfall and landslide analysis"""
    data = request.get_json()
    lat = data.get("lat")
    lon = data.get("lon")
    location_name = data.get("location_name", "Unknown")

    if lat is None or lon is None:
        return jsonify({
            "risk": "Unknown",
            "rainfall": 0,
            "rainfall_category": "Unknown",
            "over_rainfall": False,
            "landslide": "Nil",
            "recommendation": "Unable to fetch data"
        })

    try:
        # Fetch weather data from OpenWeatherMap
        weather_url = f"http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API_KEY}&units=metric"
        weather_response = requests.get(weather_url, timeout=5).json()
        
        # Extract rainfall data (convert from mm to cm for display)
        rain_1h = weather_response.get("rain", {}).get("1h", 0)
        rain_3h = weather_response.get("rain", {}).get("3h", 0)
        rainfall_mm = max(rain_1h, rain_3h) * 10  # Convert to mm (approximate)
        rainfall_cm = rainfall_mm / 10
        
        humidity = weather_response.get("main", {}).get("humidity", 0)
        temperature = weather_response.get("main", {}).get("temp", 0)
        pressure = weather_response.get("main", {}).get("pressure", 1013)
        
        # Get rainfall category
        rainfall_category, over_rainfall = get_rainfall_category(rainfall_cm)
        
        # Flood risk calculation (improved)
        if rainfall_cm >= 20 or humidity > 85 or pressure < 980:
            flood_risk = "High"
        elif rainfall_cm >= 5 or humidity > 70:
            flood_risk = "Medium"
        else:
            flood_risk = "Low"
        
        # Landslide prediction
        landslide_risk = predict_landslide(rainfall_cm, location_name, humidity)
        
        # Generate recommendation
        if flood_risk == "High" or landslide_risk in ["Predicted", "Likely"]:
            recommendation = "⚠️ Avoid this area. Severe risks detected!"
        elif flood_risk == "Medium" or landslide_risk == "Predicted":
            recommendation = "⚠️ Exercise caution. Moderate risks present."
        else:
            recommendation = "✅ Safe to visit."
        
        return jsonify({
            "risk": flood_risk,
            "rainfall": round(rainfall_cm, 2),
            "rainfall_category": rainfall_category,
            "over_rainfall": over_rainfall,
            "landslide": landslide_risk,
            "recommendation": recommendation,
            "humidity": humidity,
            "temperature": temperature
        })
    
    except Exception as e:
        return jsonify({
            "risk": "Error",
            "rainfall": 0,
            "rainfall_category": "Unknown",
            "over_rainfall": False,
            "landslide": "Nil",
            "recommendation": f"Error fetching data: {str(e)}"
        })

@app.route('/reverse-geocode', methods=['GET'])
def reverse_geocode():
    """Reverse geocoding endpoint"""
    lat = request.args.get("lat")
    lon = request.args.get("lon")
    
    if not lat or not lon:
        return jsonify({"error": "Missing coordinates"}), 400
    
    try:
        place_name = get_reverse_geocode(float(lat), float(lon))
        return jsonify({"place": place_name})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/search-location', methods=['GET'])
def search_location():
    """Search for location coordinates from place name"""
    place_name = request.args.get("q")
    
    if not place_name:
        return jsonify({"error": "Missing place name"}), 400
    
    try:
        # Try Nominatim (OSM) API first - better for Indian places
        headers = {'User-Agent': 'FloodLandslidePredictor/1.0'}
        nominatim_url = f"https://nominatim.openstreetmap.org/search?q={place_name}&format=json&limit=10&countrycodes=in"
        
        response = requests.get(nominatim_url, headers=headers, timeout=5)
        results = response.json()
        
        if results and len(results) > 0:
            # Find best match
            best_result = results[0]
            for result in results:
                if place_name.lower() in result['display_name'].lower():
                    best_result = result
                    break
            
            return jsonify({
                "success": True,
                "lat": float(best_result['lat']),
                "lon": float(best_result['lon']),
                "display_name": best_result['display_name']
            })
        
        # Fallback to OpenWeatherMap API
        weather_url = f"http://api.openweathermap.org/geo/1.0/direct?q={place_name},IN&limit=5&appid={API_KEY}"
        weather_response = requests.get(weather_url, timeout=5)
        weather_data = weather_response.json()
        
        if weather_data and len(weather_data) > 0:
            best = weather_data[0]
            return jsonify({
                "success": True,
                "lat": best['lat'],
                "lon": best['lon'],
                "display_name": f"{best['name']}, {best.get('state', '')}, {best['country']}"
            })
        
        return jsonify({
            "success": False,
            "error": f"Location '{place_name}' not found"
        }), 404
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Error searching location: {str(e)}"
        }), 500

if __name__ == '__main__':
    app.run(debug=True)
