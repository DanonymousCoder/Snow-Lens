const themes = document.querySelectorAll(".types a");


const app = {

    API_KEYS : {
        openweather: '',
        unsplash: '',
        geodb: ''
    },

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

    async fetchCitySuggestions(query) {
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

    displaySuggestions(cities) {
        const suggestionDiv = document.getElementById('suggestion');

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

        documebt.getElementById("content").classList.remove("hidden");

        await Promise.all([
            this.fetchWeather(city),
            this.fetchImages(city.name),
            this.initMap(city.latitude, city.longitude)
        ])
    }

};

document.addEventListener('DOMContentLoaded', () => app.init());