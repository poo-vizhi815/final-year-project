# 🌊 Flood & Landslide Risk Prediction System

A comprehensive web-based geospatial prediction system that helps users assess real-time flood and landslide risks for any location in India using weather data and predictive algorithms.

## ✨ Features

### 🗺️ Location Selection (3 Methods)
- **Manual Search**: Enter place name (supports villages, towns, districts)
- **Live GPS Tracking**: Uses device geolocation
- **Right-Click Map**: Click anywhere on map for instant selection

### 🌧️ Rainfall Analysis
- Real-time rainfall data from OpenWeatherMap
- Classification system:
  - **< 5 cm**: Low
  - **5-15 cm**: Moderate
  - **15-20 cm**: Heavy
  - **> 20 cm**: OverRainfall Warning ⚠️

### 🌍 Flood Risk Prediction
- Analyzes rainfall, humidity, and atmospheric pressure
- Returns: **High**, **Medium**, or **Low** risk
- Color-coded visualization on map

### ⛰️ Landslide Risk Prediction
- Location-based prediction (identifies hilly regions)
- Rainfall-triggered alerts
- Returns: **Nil**, **Predicted**, or **Likely**

### 📊 Comprehensive Results Display
- Location name with full address
- Flood risk level
- Rainfall amount & category
- Landslide risk assessment
- Temperature & humidity
- Smart recommendations
- Interactive map visualization

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| **Frontend** | HTML5, CSS3, JavaScript |
| **Map Library** | Leaflet.js |
| **Backend** | Python Flask |
| **Geocoding** | OpenStreetMap Nominatim API |
| **Weather Data** | OpenWeatherMap API |
| **Server** | Flask Development Server (Port 5000) |

## 📋 Requirements

- Python 3.8+
- Flask 3.0.0
- Requests 2.31.0
- Modern web browser

## 🚀 Installation & Setup

### 1. Clone Repository
```bash
git clone https://github.com/SIRISHA12392/flood-and-landslide-prediction.git
cd flood-and-landslide-prediction
```

### 2. Create Virtual Environment
```bash
python -m venv venv
```

**Activate:**
- **Windows**: `venv\Scripts\activate`
- **macOS/Linux**: `source venv/bin/activate`

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run Application
```bash
cd "flood prediction project/backend"
python app.py
```

### 5. Access
Open: `http://localhost:5000`

## 📁 Project Structure

```
flood-and-landslide-prediction/
├── requirements.txt                    # Python dependencies
├── README.md                           # Documentation
└── flood prediction project/
    └── backend/
        ├── app.py                      # Flask backend
        ├── templates/
        │   └── index.html              # UI
        └── static/
            ├── script.js               # Frontend logic
            └── style.css               # Styling
```

## 🔌 API Endpoints

### POST `/predict`
Predict flood and landslide risk for coordinates

### GET `/search-location?q=place_name`
Search location and get coordinates

### GET `/reverse-geocode?lat=X&lon=Y`
Convert coordinates to place name

## 🎯 Prediction Logic

**Flood Risk:**
- High: rainfall >= 20cm OR humidity > 85% OR pressure < 980 hPa
- Medium: rainfall >= 5cm OR humidity > 70%
- Low: Otherwise

**Landslide Risk:**
- Predicted: rainfall > 20cm AND hilly location
- Likely: rainfall > 20cm AND humidity > 85%
- Nil: Otherwise

## 🌐 Supported Locations

✅ All Indian locations:
- Major cities (Delhi, Mumbai, Bangalore)
- States & regions (Kerala, Tamil Nadu)
- Districts (Vellore, Tirupathur)
- Towns & villages (Madhanur, Munnar)
- Hill stations (Ooty, Kodaikanal)

## 🗺️ Landslide-Prone Regions

- Himalayas
- Western Ghats
- Northeast India
- Hill stations
- And more...

## 🔑 Configuration

Update API key in `app.py`:
```python
API_KEY = "your_openweathermap_api_key"
```

Get key from: https://openweathermap.org/api

## 📊 Map Visualization

- 🟢 **Green (2 km)**: Low risk
- 🟡 **Yellow (3 km)**: Medium risk
- 🔴 **Red (5 km)**: High risk

## 📱 Features

- ✅ Real-time weather data
- ✅ Right-click map selection
- ✅ Reverse geocoding
- ✅ Live location tracking
- ✅ Browser notifications
- ✅ Responsive design
- ✅ Multiple API fallbacks

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

## 📄 License

MIT License - Open Source

## ⚠️ Disclaimer

Predictions are based on current weather data. For critical decisions, follow official government warnings.

## 📞 Support

- Open an Issue on GitHub
- Check existing Issues
- Review documentation

---

**Status**: ✅ Production Ready | **Version**: 2.0 | **Developed**: March 2026