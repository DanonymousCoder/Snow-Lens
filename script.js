const themes = document.querySelectorAll(".types a");
const container = document.querySelector('.container');


const app = {

    API_KEYS: ENV.API_KEYS,

    state: {
        currentCity: null,
        weatherData: null,
        isCelcius: true,
        favorites: [],
        map: null,
        searchTimeout: null
    },

    init() {
        console.log("App up and running...");
        this.createSnowFlakes();
        this.setupEventListeners();
        this.loadFavourites();
    },

    createSnowFlakes() {
        const snowFlakesCount = 20;

        for (let i=0; i < snowFlakesCount; i++) {
            const snowflake = document.createElement('div');

            snowflake.className = 'snowflake';
            snowflake.innerHTML = '❄';

            snowflake.style.left = `${Math.random() * 120}%`;
            snowflake.style.animationDuration = `${Math.random() * 3 + 2}s`;
            snowflake.style.animationDelay = `${Math.random() + 2}s`;

            snowflake.style.opacity = `${Math.random() * 0.6 + 0.4}`

            container.appendChild(snowflake);
        }

    },
    

    setupEventListeners() {
        const searchInput = document.getElementById('city-search');
        searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        themes.forEach(theme => {
            theme.addEventListener("click", (e) => {
                themes.forEach(th => {th.classList.remove("type-active")});
                
                theme.classList.add("type-active");

                this.switchTheme(e.target.dataset.theme);
            })
        } )
    },

    switchTheme(theme) {
        document.body.className = '';

        if (theme === 'aurora') {
            document.body.className = 'aurora';
        } else if (theme === 'frost') {
            document.body.className = 'frost';
        }
    },

    handleSearch(query) {
        clearTimeout(this.state.searchTimeout);

        if (query.length < 2) {
            document.getElementById('suggestions').innerHTML = '';
            document.getElementById('suggestions').classList.add('hidden');
            return;
        }

        this.state.searchTimeout = setTimeout(async () => {
            try {
                const suggestions = await this.fetchCitySuggestions(query);

                this.displaySuggestions(suggestions);
            } catch (error) {
                console.error('Search Error: ', error);
            }
        }, 300)
    },

    /**
     * async fetchCitySuggestions(query) {
        const mockCities = [
            {
                id: 1,
                name: 'Reykjavik',
                country: 'Iceland',
                latitude: 64.1466,
                longitude: -21.9426
            },
            {
                id: 2,
                name: 'Tromsa',
                country: 'Norway',
                latitude: 69.6492,
                longitude: 18.9553
            },
            {
                id: 3,
                name: 'Whistler',
                country: 'Canada',
                latitude: 50.1163,
                longitude: -122.9574
            },
            {
                id: 4,
                name: 'Lagos',
                country: 'Nigeria',
                latitude: 6.6137,
                longitude: 3.3553
            },
            {
                id: 5,
                name: 'Kano',
                country: 'Nigeria',
                latitude: 12.0022,
                longitude: 8.5920
            }
        ];


        return mockCities.filter(city => city.name.toLowerCase().includes(query.toLowerCase()) || 
            city.country.toLowerCase().includes(query.toLowerCase()));
    },
     */

    async fetchCitySuggestions(query) {
        const limit = 5;
        const url = `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=${limit}&appid=${this.API_KEYS.openweather}`;

        const response = await fetch(url);
        const data = await response.json();

        return data.map(city => ({
            name: city.name,
            country: city.country,
            latitude: city.lat,
            longitude: city.lon,
            state: city.state
        }));
    },

    displaySuggestions(cities) {
        const suggestionDiv = document.getElementById('suggestions');

        if (cities.length === 0) {
            suggestionDiv.innerHTML = '';
            suggestionDiv.classList.add('hidden');
            return;
        }

        suggestionDiv.innerHTML = cities.map(city => 
            `
                <div class="suggestion-item" onclick="app.selectCity(${JSON.stringify(city).replace(/"/g, '&quot;')})">
                    <strong>${city.name}</strong>, ${city.country}
                </div>
            `
        ).join(' ');

        suggestionDiv.classList.remove('hidden');
    },

    async selectCity(city) {
        document.getElementById('suggestions').innerHTML = '';
        document.getElementById('suggestions').classList.add('hidden');

        document.getElementById('city-search').value = `${city.name}, ${city.country}`;

        this.state.currentCity = city;

        document.getElementById("content").classList.remove("hidden");

        await Promise.all([
            this.fetchWeather(city),
            this.fetchImages(city.name),
            this.initMap(city.latitude, city.longitude)
        ]);

        this.updateFavouriteBtn();
    },

    /**
     * async fetchWeather(city) {
        try {
            const mockWeather = {
                temp: -5 + Math.random() * 10,
                description: 'Light snow',
                icon: '13d',
                humidity: 60 + Math.random() * 30,
                wind_speed: 5 + Math.random() * 15,
                snow: Math.random() > 0.5 ? {'1h': Math.random() * 5} : null
            };

            this.state.weatherData = mockWeather;

            // this.displayWeather(mockWeather);
        } catch (error) {
            this.showError("Failed to fetch weather data")
        }
    }
     */
    
    async fetchWeather(city) {
        try {
            const url = `https://api.openweathermap.org/data/2.5/weather?lat=${city.latitude}&lon=${city.longitude}&units=metric&appid=${this.API_KEYS.openweather}`;
            const response = await fetch(url);

            if (!response.ok)
                throw new Error(`HTTP error, status: ${response.status}`);

            const data = await response.json();

            const weatherData = {
                temp: data.main.temp,
                feels_like: data.main.feels_like,
                humidity: data.main.humidity,
                wind_speed: data.wind.speed,
                description: data.weather[0].description,
                icon: data.weather[0].icon,
                snow: data.snow || null
            };

            this.state.weatherData = weatherData;
            this.displayWeather(weatherData);

            console.log("Weather Data: ", weatherData);
        } catch (error) {
            this.showError("Failed to fetch weather data");
            console.error("Failed to fetch weather", error);
        }
    },

    async fetchImages(cityName) {
        try {
            const searchQuery = `winter ${cityName}`;
            const url = `https://api.unsplash.com/search/photos?query=${searchQuery}&per_page=5&client_id=${this.API_KEYS.unsplash}`;

            const response = await fetch(url);
            const data = await response.json();

            const images = data.results.map(photo => photo.urls.regular);

            this.displayGallery(images);
        } catch(error) {
            console.error("Failed to fetch images:", error);
        }
    },

    displayGallery(images) {
        const galleryHTML = `
            <div class='hero-image'>
                <img src='${images[0]}' alt='Winter destination' />
            </div>
            <div class='gallery-grid'>
                ${images.slice(1).map(img => `
                        <div class='gallery-item'>
                            <img src='${img}' alt='Winter image' />
                        </div>
                    `).join(' ')}
            </div>
        `;

        document.getElementById('gallerysection').innerHTML = galleryHTML;
    },

    displayWeather(weather) {
        const temp = this.state.isCelcius ? weather.temp : (weather.temp * 9/5) + 32;
        const unit = this.state.isCelcius ? '°C' : '°F';

        const weatherHTML = `
            <div class='weather-icon'>
                <img src='http://openweathermap.org/img/wn/${weather.icon}@2x.png' alt='${weather.description}'>
            </div>
            <h2>${this.state.currentCity.name}</h2>
            <p class='weather-desc'>${weather.description}</p>
            <div class='temperature'>${Math.round(temp)}${unit}</div>

            <div class='temp-toggle'>
                <button class='toggle-btn ${this.state.isCelcius ? 'active': ''}' onclick='app.toggleTempUnit(true)'>°C</button>
                <button class='toggle-btn ${!this.state.isCelcius ? 'active': ''}' onclick='app.toggleTempUnit(false)'>°F</button>
            </div>

            <div class='weather-details'>
                <div class='detail-item'>
                    <h4 class='detail-label'>Humidity</h4>
                    <p class='detail-value'>${weather.humidity}%</p>
                </div>
                <div class='detail-item'>
                    <h4 class='detail-label'>Wind</h4>
                    <p class='detail-value'>${weather.wind_speed.toFixed(1)} m/s</p>
                </div>
                <div class='detail-item'>
                    <h4 class='detail-label'>Snow</h4>
                    <p class='detail-value'>${weather.snow && weather.snow['1h'] ? weather.snow['1h'].toFixed(1) + 'mm' : 'None'}</p>
                </div>
            </div>
        `;

        document.getElementById('weather-content').innerHTML = weatherHTML;
    },

    toggleTempUnit(isCelcius) {
        if (this.state.isCelcius === isCelcius) return;
        this.state.isCelcius = isCelcius;
        if (this.state.weatherData) {
            this.displayWeather(this.state.weatherData);
        }
    },

    showError(message) {
        const container = document.getElementById('weather-content');
        if (container) {
            container.innerHTML = `<div class="error">${message}</div>`;
        }
        console.error(message);
    },

    initMap(lat, lon) {
        if (this.state.map) {
            this.state.map.remove();
        }

        this.state.map = L.map("map").setView([lat, lon], 10);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'OpenStreetMap Contributors'
        }).addTo(this.state.map);

        L.marker([lat, lon])
            .addTo(this.state.map)
            .bindPopup(`<b>${this.state.currentCity.name}</b> <br>${this.state.currentCity.country}`)
            .openPopup();
    },

    loadFavourites() {
        const stored = localStorage.getItem('winterFavourites');
        if (stored) {
            this.state.favorites = JSON.parse(stored);
            this.updateFavouritesCount();
        }
    },

    saveFavourites() {
        localStorage.setItem('winterFavourites', JSON.stringify(this.state.favorites));
        this.updateFavouritesCount();
    },

    toggleFavourite() {
        if (!this.state.currentCity) return;

        const cityKey = `${this.state.currentCity.name}-${this.state.currentCity.country}`;
        const index = this.state.favorites.findIndex(
            fav => `${fav.name}-${fav.country}` === cityKey
        );

        if (index > -1) {
            // Remove from favourites
            this.state.favorites.splice(index, 1);
        } else {
            // Add to favourites
            this.state.favorites.push({
                name: this.state.currentCity.name,
                country: this.state.currentCity.country,
                latitude: this.state.currentCity.latitude,
                longitude: this.state.currentCity.longitude
            });
        }

        this.saveFavourites();
        this.updateFavouriteBtn();
    },

    updateFavouriteBtn() {
        if (!this.state.currentCity) return;

        const cityKey = `${this.state.currentCity.name}-${this.state.currentCity.country}`;
        const isFavourite = this.state.favorites.some(
            fav => `${fav.name}-${fav.country}` === cityKey
        );

        const btn = document.getElementById('favourite-btn');
        const text = document.getElementById('favourite-text');
        
        if (isFavourite) {
            text.textContent = 'Remove from favourites';
            btn.style.background = 'rgba(255, 100, 100, 0.3)';
        } else {
            text.textContent = 'Add to favourites';
            btn.style.background = '';
        }
    },

    updateFavouritesCount() {
        const countElement = document.getElementById('favourites-count');
        if (countElement) {
            countElement.textContent = this.state.favorites.length;
        }
    },

    generateTripPlan() {
        if (!this.state.currentCity || !this.state.weatherData) {
            alert('Please select a city first!');
            return;
        }

        const weather = this.state.weatherData;
        const city = this.state.currentCity;
        const temp = weather.temp;

        let timing = ' ';
        let packingList = [];
        let activities = [];

        if (temp < 0 && weather.snow) {
            timing = 'Perfect snow conditions right now!!!';
        } else if (temp < 5) {
            timing = 'Cold enough, but wait for some snows';
        } else {
            timing = 'Too warm, wait for the winter weather';
        }

        packingList = [
            'Winter coat',
            'Warm boots',
            'Gloves & hat',
            'Scarf'
        ];

        if (temp < -10) {
            packingList.push('Hand warmers');
        }
            
        if (weather.snow) {
            packingList.push('Ski gear');
        }

         activities = [
            'Visit cozy cafés',
            'Winter photography',
            'Indoor museums'
        ];
        
        if (weather.snow) {
            activities.push('Skiing');
            activities.push('Build snowmens');
        }
        
        if (city.lat > 60) {
            activities.push('Watch northern lights');
        }

        const planHTML = `
            <h2>Trip Plan: ${city.name}</h2>

            <h3>When to Go</h3>
            <p style="font-size: 1.2em;">${timing}</p>
            <p>Current: ${temp.toFixed(1)}°C, ${weather.snow ? 'Snowing' : 'No snow'}</p>

            <h3>What to Pack</h3>
            <ul>
                ${packingList.map(item => `<li>${item}</li>`).join('')}
            </ul>
            
            <h3>Things to Do</h3>
            <ul>
                ${activities.map(item => `<li>${item}</li>`).join('')}
            </ul>
            
            <h3>Quick Tips</h3>
            <ul>
                <li>Book early for peak season</li>
                <li>Check daily weather forecasts</li>
                <li>Dress in layers</li>
                ${city.lat > 60 ? '<li>Download aurora forecast app</li>' : ''}
            </ul>
            
            <button onclick="app.closeModal()" 
                    style="margin-top: 20px; padding: 12px 30px; background: white; 
                            border: none; border-radius: 25px; cursor: pointer; font-size: 1em;">
                Close
            </button>
        `;

        document.getElementById('trip-plan').innerHTML = planHTML;
        document.getElementById('trip-modal').classList.add('open');
    },

    closeModal() {
        document.getElementById('trip-modal').classList.remove('open');
    }

};

document.addEventListener('DOMContentLoaded', () => app.init());

// app.fetchCitySuggestions("Lagos").then(console.log);