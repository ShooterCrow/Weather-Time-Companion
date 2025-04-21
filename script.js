document.addEventListener("DOMContentLoaded", () => {
  // API key for WeatherAPI
  const API_KEY = "1fd22c90235048979b455244252104";

  // DOM elements
  const citySearch = document.getElementById("citySearch");
  const citySearchMobile = document.getElementById("citySearchMobile");
  const getLocationBtn = document.getElementById("getLocation");
  const weatherContent = document.getElementById("weatherContent");
  const weatherLoading = document.getElementById("weatherLoading");
  const adviceContent = document.getElementById("adviceContent");
  const adviceLoading = document.getElementById("adviceLoading");
  const hourlyContent = document.getElementById("hourlyContent");
  const hourlyLoading = document.getElementById("hourlyLoading");
  const errorContainer = document.getElementById("errorContainer");

  // Default city
  let defaultCity = "London";

  // Ask for user permission before using geolocation
  const ask = confirm("Would you like to use your current location to get weather info?");
  if (ask) {
    getUserLocation();
  } else {
    getWeatherData(defaultCity);
  }

  // Event listeners
  citySearch.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      getWeatherData(citySearch.value);
    }
  });

  citySearchMobile.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      getWeatherData(citySearchMobile.value);
    }
  });

  getLocationBtn.addEventListener("click", getUserLocation);

  // Get user's location
  function getUserLocation() {
    if (navigator.geolocation) {
      showLoadingState();
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          getWeatherByCoords(lat, lon);
        },
        (error) => {
          showError(
            "Unable to retrieve your location. Please search for a city instead."
          );
          getWeatherData(defaultCity);
        }
      );
    } else {
      showError(
        "Geolocation is not supported by your browser. Please search for a city instead."
      );
      getWeatherData(defaultCity);
    }
  }

  // Get weather data by city name
  function getWeatherData(city) {
    if (!city) return;

    showLoadingState();

    fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${city}&days=1&aqi=yes&alerts=no`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            "City not found. Please check the spelling and try again."
          );
        }
        return response.json();
      })
      .then((data) => {
        updateWeatherUI(data);
        updateHourlyForecast(data);
      })
      .catch((error) => {
        showError(error.message);
      });
  }

  // Get weather data by coordinates
  function getWeatherByCoords(lat, lon) {
    fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${lat},${lon}&days=1&aqi=yes&alerts=no`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            "Unable to fetch weather data. Please try again later."
          );
        }
        return response.json();
      })
      .then((data) => {
        updateWeatherUI(data);
        updateHourlyForecast(data);
      })
      .catch((error) => {
        showError(error.message);
      });
  }

  // Update the weather UI
  function updateWeatherUI(data) {
    document.getElementById("cityName").textContent = `${data.location.name}, ${data.location.country}`;
    document.getElementById("localTime").textContent = data.location.localtime;
    document.getElementById("temperature").textContent = `${Math.round(data.current.temp_c)}°`;
    document.getElementById("weatherCondition").textContent = data.current.condition.text;
    document.getElementById("weatherIcon").src = `https:${data.current.condition.icon}`;
    document.getElementById("maxTemp").textContent = `${Math.round(data.forecast.forecastday[0].day.maxtemp_c)}°C`;
    document.getElementById("minTemp").textContent = `${Math.round(data.forecast.forecastday[0].day.mintemp_c)}°C`;
    document.getElementById("feelsLike").textContent = `${Math.round(data.current.feelslike_c)}°C`;
    document.getElementById("windSpeed").textContent = `${data.current.wind_kph} km/h`;
    document.getElementById("humidity").textContent = `${data.current.humidity}%`;
    document.getElementById("pressure").textContent = `${data.current.pressure_mb} mb`;
    document.getElementById("visibility").textContent = `${data.current.vis_km} km`;
    document.getElementById("sunrise").textContent = data.forecast.forecastday[0].astro.sunrise;
    document.getElementById("sunset").textContent = data.forecast.forecastday[0].astro.sunset;
    document.getElementById("uvIndex").textContent = data.current.uv;
    document.getElementById("moonrise").textContent = data.forecast.forecastday[0].astro.moonrise;
    document.getElementById("moonset").textContent = data.forecast.forecastday[0].astro.moonset;
    document.getElementById("moonPhase").textContent = data.forecast.forecastday[0].astro.moon_phase;
    document.getElementById("chanceOfRain").textContent = `${data.forecast.forecastday[0].day.daily_chance_of_rain}%`;
    document.getElementById("precipitation").textContent = `${data.current.precip_mm} mm`;
    document.getElementById("cloudCover").textContent = `${data.current.cloud}%`;
    document.getElementById("windDirection").textContent = data.current.wind_dir;
    document.getElementById("windGust").textContent = `${data.current.gust_kph} km/h`;
    document.getElementById("airQuality").textContent = getAirQualityText(data.current.air_quality["us-epa-index"]);

    generateAdvice(data);
    hideLoadingState();
  }

  // Update hourly forecast
  function updateHourlyForecast(data) {
    const hourlyForecastEl = document.getElementById("hourlyForecast");
    hourlyForecastEl.innerHTML = "";

    const currentHour = new Date(data.location.localtime).getHours();
    const hourlyData = data.forecast.forecastday[0].hour;

    const remainingHours = hourlyData.filter((hour) => {
      const hourTime = new Date(hour.time).getHours();
      return hourTime >= currentHour;
    });

    remainingHours.forEach((hour, index) => {
      if (index < 24) {
        const hourTime = new Date(hour.time).getHours();
        const formattedHour = hourTime % 12 === 0 ? "12" : hourTime % 12;
        const ampm = hourTime >= 12 ? "PM" : "AM";

        const hourlyItem = document.createElement("div");
        hourlyItem.className = "forecast-item animate-fade-in";
        hourlyItem.style.animationDelay = `${index * 0.1}s`;
        hourlyItem.innerHTML = `
          <div class="forecast-hour">${formattedHour} ${ampm}</div>
          <img src="https:${hour.condition.icon}" alt="${hour.condition.text}" width="40">
          <div class="forecast-temp">${Math.round(hour.temp_c)}°</div>
          <div><i class="fas fa-tint neon-accent"></i> ${hour.chance_of_rain}%</div>
        `;
        hourlyForecastEl.appendChild(hourlyItem);
      }
    });
  }

  // Personalized advice
  function generateAdvice(data) {
    const adviceIcon = document.getElementById("adviceIcon");
    const timeAdvice = document.getElementById("timeAdvice");
    const weatherAdvice = document.getElementById("weatherAdvice");

    const temp = data.current.temp_c;
    const isRaining = data.current.condition.text.toLowerCase().includes("rain");
    const isSnowing = data.current.condition.text.toLowerCase().includes("snow");
    const isClear = data.current.condition.text.toLowerCase().includes("clear") || data.current.condition.text.toLowerCase().includes("sunny");
    const windSpeed = data.current.wind_kph;
    const humidity = data.current.humidity;

    const localDateTime = new Date(data.location.localtime);
    const hour = localDateTime.getHours();
    const isMorning = hour >= 5 && hour < 12;
    const isAfternoon = hour >= 12 && hour < 18;
    const isEvening = hour >= 18 && hour < 22;
    const isNight = hour >= 22 || hour < 5;

    let timeAdviceText = "";
    let iconClass = "";

    if (isMorning) {
      timeAdviceText = "Good morning! It's the perfect time to set your goals for the day.";
      iconClass = "fa-coffee";
    } else if (isAfternoon) {
      timeAdviceText = "Good afternoon! Remember to take short breaks to maintain productivity.";
      iconClass = "fa-sun";
    } else if (isEvening) {
      timeAdviceText = "Good evening! Consider winding down with some relaxing activities.";
      iconClass = "fa-moon";
    } else {
      timeAdviceText = "It's late night! Try to get some rest soon.";
      iconClass = "fa-bed";
    }

    let weatherAdviceText = "";
    if (temp < 0) {
      weatherAdviceText = "It's freezing outside! Bundle up.";
    } else if (temp < 10) {
      weatherAdviceText = "It's chilly. A warm jacket will help.";
    } else if (temp < 20) {
      weatherAdviceText = "Cool weather today. A light jacket is fine.";
    } else if (temp < 27) {
      weatherAdviceText = "The weather is pleasant. Enjoy!";
    } else if (temp < 32) {
      weatherAdviceText = "It's getting warm. Stay hydrated!";
    } else {
      weatherAdviceText = "It's really hot! Keep cool and drink water.";
    }

    if (isRaining) weatherAdviceText += " Don't forget your umbrella.";
    if (isSnowing) weatherAdviceText += " Be cautious of slippery roads.";
    if (windSpeed > 30) weatherAdviceText += " It's windy—stay safe.";
    if (humidity > 80) weatherAdviceText += " It might feel hotter than it is due to humidity.";

    adviceIcon.innerHTML = `<i class="fas ${iconClass}"></i>`;
    timeAdvice.textContent = timeAdviceText;
    weatherAdvice.textContent = weatherAdviceText;
  }

  function getAirQualityText(index) {
    switch (index) {
      case 1: return "Good";
      case 2: return "Moderate";
      case 3: return "Unhealthy for sensitive groups";
      case 4: return "Unhealthy";
      case 5: return "Very Unhealthy";
      case 6: return "Hazardous";
      default: return "Unknown";
    }
  }

  function showLoadingState() {
    errorContainer.classList.add("d-none");
    weatherContent.classList.add("d-none");
    adviceContent.classList.add("d-none");
    hourlyContent.classList.add("d-none");
    weatherLoading.classList.remove("d-none");
    adviceLoading.classList.remove("d-none");
    hourlyLoading.classList.remove("d-none");
  }

  function hideLoadingState() {
    weatherLoading.classList.add("d-none");
    adviceLoading.classList.add("d-none");
    hourlyLoading.classList.add("d-none");
    weatherContent.classList.remove("d-none");
    adviceContent.classList.remove("d-none");
    hourlyContent.classList.remove("d-none");
  }

  function showError(message) {
    errorContainer.classList.remove("d-none");
    errorContainer.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle me-2"></i> ${message}
      </div>
    `;
    hideLoadingState();
  }
});