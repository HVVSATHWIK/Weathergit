document.addEventListener('DOMContentLoaded', () => {
    const viewer = new Cesium.Viewer('cesiumContainer', {
        imageryProvider: new Cesium.OpenStreetMapImageryProvider({
            url: 'https://a.tile.openstreetmap.org/'
        }),
        timeline: false,
        animation: false
    });

    viewer.scene.globe.enableLighting = true;
    viewer.scene.requestRenderMode = true;
    viewer.scene.maximumRenderTimeChange = Infinity;

    const weatherInfo = document.getElementById('weather-info');
    const temperature = document.getElementById('temperature');
    const humidity = document.getElementById('humidity');
    const windSpeed = document.getElementById('wind-speed');
    const condition = document.getElementById('condition');
    const forecast = document.getElementById('forecast');
    const timeDate = document.getElementById('time-date');

    const apiKey = process.env.REACT_APP_WEATHER_API_KEY;
    const geminiApiKey = process.env.REACT_APP_GENAI_API_KEY;

    let cesiumBillboard;

    function updateWeatherInfo(data) {
        temperature.textContent = `Temperature: ${data.main.temp}°C`;
        humidity.textContent = `Humidity: ${data.main.humidity}%`;
        windSpeed.textContent = `Wind Speed: ${data.wind.speed} m/s`;
        condition.textContent = `Condition: ${data.weather[0].description}`;
        timeDate.textContent = `Time & Date: ${new Date().toLocaleString()}`;
        weatherInfo.style.display = 'block';
    }

    async function fetchWithRetry(url, options, retries = 3, delay = 2000) {
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                const response = await fetch(url, options);
                if (response.ok) {
                    return await response.json();
                } else {
                    if (response.status === 503 && attempt < retries - 1) {
                        await new Promise(resolve => setTimeout(resolve, delay));
                    } else {
                        throw new Error(`Request failed with status ${response.status}`);
                    }
                }
            } catch (error) {
                if (attempt === retries - 1) throw error;
            }
        }
    }

    async function fetchWeather(lat, lon) {
        try {
            const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
            const weatherData = await weatherResponse.json();
            updateWeatherInfo(weatherData);

            const aiResponse = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: `Based on the weather conditions - Temperature: ${weatherData.main.temp}°C, Humidity: ${weatherData.main.humidity}%, Wind Speed: ${weatherData.wind.speed} m/s, Condition: ${weatherData.weather[0].description} - is it advisable to go outside?` }]
                    }]
                })
            });

            const aiData = await aiResponse.json();
            if (aiData.choices && aiData.choices.length > 0) {
                const advice = aiData.choices[0].text.trim();
                forecast.textContent = `AI Advice: ${advice}`;
            } else {
                forecast.textContent = 'AI Advice: No advice available at the moment or The server is too busy at the moment';
            }

            const speech = new SpeechSynthesisUtterance(forecast.textContent);
            speech.lang = 'en-US';
            speech.pitch = 1;
            speech.rate = 1;
            window.speechSynthesis.speak(speech);

        } catch (error) {
            handleError('Error fetching weather data or AI advice:', error);
        }
    }

    async function searchLocation() {
        const location = document.getElementById('location-input').value.trim();
        if (!location) {
            handleError('You need to provide a location first.');
            return;
        }

        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${location}`);
            const data = await response.json();
            if (data.length > 0) {
                const { lat, lon } = data[0];
                viewer.camera.flyTo({
                    destination: Cesium.Cartesian3.fromDegrees(lon, lat, 1000000)
                });

                if (cesiumBillboard) viewer.entities.remove(cesiumBillboard);
                cesiumBillboard = viewer.entities.add({
                    position: Cesium.Cartesian3.fromDegrees(lon, lat),
                    billboard: {
                        image: 'https://cdn.pixabay.com/photo/2015/12/14/20/30/location-1093169_1280.png',
                        width: 32,
                        height: 32
                    }
                });

                fetchWeather(lat, lon);
            } else {
                handleError('Location not found!');
            }
        } catch (error) {
            handleError('Error searching for location:', error);
        }
    }

    function handleError(message, error) {
        console.error(message, error);

        const speech = new SpeechSynthesisUtterance(message);
        speech.lang = 'en-US';
        speech.pitch = 1;
        speech.rate = 1;
        window.speechSynthesis.speak(speech);

        const feedback = document.createElement('div');
        feedback.classList.add('feedback');
        feedback.textContent = message;
        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), 3000);
    }

    document.getElementById('search-button').addEventListener('click', searchLocation);
    document.getElementById('location-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchLocation();
        }
    });

    document.getElementById('satelliteButton').addEventListener('click', () => {
        viewer.imageryLayers.removeAll();
        viewer.imageryLayers.addImageryProvider(new Cesium.OpenStreetMapImageryProvider({
            url: 'https://a.tile.openstreetmap.org/'
        }));
    });
});
