const themes = document.querySelectorAll(".types a");


const app = {

    

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
        // this.loadFavourites();
    },

    createSnowFlakes() {
        const snowFlakesCount = 20;

        for (let i=0; i < snowFlakesCount; i++) {
            const snowflake = document.createElement('div');

            snowflake.className = 'snowflake';
            snowflake.innerHTML = '❄';

            snowflake.style.left = `${Math.random() * 100}%`;
            snowflake.style.animationDuration = `${Math.random() * 3 + 2}s`;
            snowflake.style.animationDelay = `${Math.random() + 2}s`;

            snowflake.style.opacity = `${Math.random() * 0.6 + 0.4}`

            document.body.appendChild(snowflake);
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
            return;
        }

        suggestionDiv.innerHTML = cities.map(city => 
            `
                <div class="suggestion-item" onclick="app.selectCity(${JSON.stringify(city).replace(/"/g, '$quot;')})">
                    <strong>${city.name}</strong>, ${city.country}
                </div>
            `
        ).join(' ');
    },

    async selectCity(city) {
        document.getElementById('suggestions').innerHTML = '';

        document.getElementById('city-search').value = `${city.name}, ${city.country}`;

        this.state.currentCity = city;

        document.getElementById("content").classList.remove("hidden");

        await Promise.all([
            this.fetchWeather(city),
            this.fetchImages(city.name),
            this.initMap(city.latitude, city.longitude)
        ]);

        // this.updateFavouriteBtn();
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
                throw new error(`HTTP error, status: ${response.status}`);

            const data = await response.json();

            const weatherData = {
                temp: data.main.temp,
                feels_like:data.main.feels_like ,
                humidity: data.main.humidity,
                wind_speed: data.wind.speed,
                description: data.weather[0].description,
                icon: data.weather[0].icon,
                snow: data.snow || null
            }

            this.state.weatherData = data;

            // call function to display weather
            console.log("Weather Data: ", data);
        } catch (error) {
            this.showError("Failed to fetch weather data ", data);
            console.error("Failed to fetch weather");
        }
    },

    async fetchImages(query) {
        try {
            const url = `https://api.unsplash.com/search/photos?query=4{query}&per_page=5&client_id=${this.API_KEYS.unsplash}`;
            const response = await fetch(url);
            const data = await response.json();

            console.log("Images: ", data.results);
        } catch(error) {
            console.error("Failed to fetch images", error);
        }
    },

    displayWeather(weather) {
        const temp = temp.state.isCelcius ?
            weather.temp :
            (weather.temp * 9/5) + 32;

        const weatherHTML = `
            <div class='weather-icon'></div>
            <h2>${this.state.currentCity.name}</h2>
            <p>${weather.description}</p>
            <div class='temperature'>${temp.toFixed(1)}${unit}</div>

            <div class='weather-details'>
                <div class='detail-item'>
                    <h4 class='detail-label'>Humidity</h4>
                    <p class='detail-value'>${weather.humidity.toFixed(0)}%</p>
                </div>
            </div>
        `

        document.getElementById('weatherContent').innerHTML = weatherHTML;
    }

};

document.addEventListener('DOMContentLoaded', () => app.init());

app.fetchCitySuggestions("Lagos").then(console.log);