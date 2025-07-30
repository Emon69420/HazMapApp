from flask import Flask, render_template, request, jsonify
import ee
from datetime import date, timedelta
import requests
import json
import os

app = Flask(__name__)

SERVICE_ACCOUNT_FILE = 'your google earth engine json key file location here'
SERVICE_ACCOUNT_EMAIL = 'your google earth engine service account email here'

credentials = ee.ServiceAccountCredentials(SERVICE_ACCOUNT_EMAIL, SERVICE_ACCOUNT_FILE)

try:
    ee.Initialize(credentials)
except Exception as e:

    print("Earth Engine initialization failed:", e)


def get_wildfire_risk_prediction(data, openrouter_api_key):
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {openrouter_api_key}",
        "Content-Type": "application/json",
        "X-Title": "HazEnd",
        "HTTP-Referer": "https://hazend.tech"  # Replace with your actual domain if you have one
    }

    prompt = f"""
Based on the following environmental and physical data, predict the wildfire risk in the area and return the result as a JSON object with two fields: "prediction" (values: Low, Moderate, or High) and "reasoning" (detailed explanation why you made that prediction).

Data:
{json.dumps(data, indent=2)}
use NDVI & lat long (do not mention lat and long in your answer only the NDVI) for type and amount of vegetation
determine the wildfire risk as Low, Moderate, High, or Extreme. Use a conservative approach: if multiple high-risk indicators (e.g., temperature > 40°C, humidity < 20%, wind > 20 m/s, zero precipitation, significant fire activity) are present, the risk should be marked as High

Rules:
- Always respond with JSON. Format: {{ "prediction": "Moderate", "reasoning": "..." }}
- Never say that you cannot predict due to missing data. Use all available signals.
- Use the latitude and longitude to estimate the types and amount of vegetation present in the region.
- Consider NDVI, temperature, humidity, precipitation, windspeed, AQI, fire activity, elevation, and more.
- Reason through missing values intelligently based on the other data.
- Do not break character. Only return the JSON.
"""
    
    body = {
        "model": "google/gemma-3n-e2b-it:free",
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }

    response = requests.post(url, headers=headers, data=json.dumps(body))
    if response.status_code == 200:
        return response.json()["choices"][0]["message"]["content"]
    else:
        return f"Error getting AI response: {response.text}"


@app.route("/")
def home():
    return render_template("home.html")


@app.route("/about")
def about():
    return render_template("about.html")

@app.route("/gee-data")
def gee_data():
    lat = float(request.args.get('lat', 0))
    lon = float(request.args.get('lon', 0))
    temperature = request.args.get('temperature')       # In Celsius or K?
    humidity = request.args.get('humidity')             # In %
    precipitation = request.args.get('precipitation')   # In mm
    windspeed = request.args.get('windspeed')           # In m/s or km/h
    aqi = request.args.get('aqi')                       # Air Quality Index
    elevation = request.args.get('elevation')           # In meters
    pm25 = request.args.get('pm25')                     # PM2.5 concentration in µg/m³
    pm10 = request.args.get('pm10')                     # PM10 concentration in µg/m³
    o3 = request.args.get('o3')                       # Ozone concentration in µg/m³
    no2 = request.args.get('no2')                     # Nitrogen Dioxide concentration in µg/m³
    so2 = request.args.get('so2')                     # Sulfur Dioxide concentration in µg/m³
    co = request.args.get('co')                       # Carbon Monoxide concentration in µg/m³
    end_date = date.today().isoformat()
    start_date = (date.today() - timedelta(days=30)).isoformat()
    start_date = request.args.get('start', start_date)
    end_date = request.args.get('end', end_date)
    point = ee.Geometry.Point([lon, lat])

    # NDVI from Sentinel-2 - get latest image and mean NDVI value
    s2 = ee.ImageCollection('COPERNICUS/S2').filterDate(start_date, end_date).filterBounds(point).sort('system:time_start', False)
    if s2.size().getInfo() == 0:
        ndvi_mean = None
    else:
        latest_img = ee.Image(s2.first())
        ndvi_img = latest_img.normalizedDifference(['B8', 'B4']).rename('NDVI')
        ndvi_stats = ndvi_img.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=point.buffer(5000),
            scale=30
        )
        ndvi_mean = ndvi_stats.get('NDVI').getInfo()

    # Burn History from MODIS - get latest image and burn value
    burn = ee.ImageCollection('MODIS/006/MCD64A1').filterDate(start_date, end_date).filterBounds(point).sort('system:time_start', False)
    if burn.size().getInfo() == 0:
        burn_value = None
    else:
        latest_burn = ee.Image(burn.first())
        burn_img = latest_burn.select('BurnDate')
        burn_stats = burn_img.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=point.buffer(5000),
            scale=500
        )
        burn_value = burn_stats.get('BurnDate').getInfo()

    # Ignition/Activity from FIRMS - count fire detections
    firms = ee.FeatureCollection('FIRMS').filterDate(start_date, end_date).filterBounds(point.buffer(5000))
    fire_count = firms.size().getInfo()

    # Population Density from WorldPop (proxy)
    # Use the latest available WorldPop image (2020)
    pop_img = ee.ImageCollection('WorldPop/GP/100m/pop').filterDate('2020-01-01', '2020-12-31').filterBounds(point)
    if pop_img.size().getInfo() == 0:
        pop_density = None
    else:
        latest_pop = ee.Image(pop_img.first())
        pop_stats = latest_pop.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=point.buffer(20000),
            scale=100
        )
        pop_density = pop_stats.get('population').getInfo()

    result = {
        "latitude": lat,
        "longitude": lon,
        "ndvi_mean": ndvi_mean,
        "fire_activity_count": fire_count,
        "temperature": float(temperature) if temperature else None,
        "humidity": float(humidity) if humidity else None,
        "precipitation": float(precipitation) if precipitation else None,
        "windspeed": float(windspeed) if windspeed else None,
        "aqi": float(aqi) if aqi else None,
        "elevation": float(elevation) if elevation else None,
        "pm25": float(pm25) if pm25 else None,
        "pm10": float(pm10) if pm10 else None,
        "o3": float(o3) if o3 else None,
        "no2": float(no2) if no2 else None,
        "so2": float(so2) if so2 else None,
        "co": float(co) if co else None
    }
    openrouter_api_key = "open router api key for gemma here"
    prediction = get_wildfire_risk_prediction(result, openrouter_api_key)
    
    return jsonify({"result": result,  "prediction": prediction})

if __name__ == "__main__":
    app.run(debug=True)
