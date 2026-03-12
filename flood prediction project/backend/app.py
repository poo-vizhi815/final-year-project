from flask import Flask, render_template, request, jsonify
import requests

app = Flask(__name__)

# Your OpenWeatherMap API key
API_KEY = "f6b138f613d74536572ca7800d8b31f7"

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    lat = data.get("lat")
    lon = data.get("lon")

    if lat is None or lon is None:
        return jsonify({"risk": "Unknown"})

    # Fetch weather data
    url = f"http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API_KEY}&units=metric"
    response = requests.get(url).json()

    rain_1h = response.get("rain", {}).get("1h", 0)
    rain_3h = response.get("rain", {}).get("3h", 0)
    rainfall = max(rain_1h, rain_3h)
    humidity = response.get("main", {}).get("humidity", 0)

    # Realistic flood risk calculation
    if rainfall >= 20 or humidity > 85:
        risk = "High"
    elif rainfall >= 5 or humidity > 70:
        risk = "Medium"
    else:
        risk = "Low"

    return jsonify({"risk": risk})

if __name__ == '__main__':
    app.run(debug=True)