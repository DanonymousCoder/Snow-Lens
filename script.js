const themes = document.querySelectorAll(".types a");

themes.forEach(theme => {
    theme.addEventListener("click", () => {
        themes.forEach(th => {th.classList.remove("type-active")});
        
        theme.classList.add("type-active");
    })
} )


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
        // this.setupEventListeners();
        // this.loadFavourites();
    },

    createSnowFlakes() {
        const snowFlakesCount = 20;

        for (let i=0; i < snowFlakesCount; i++) {
            const snowflake = document.createElement('div');

            snowflake.className = 'snowflake';
            snowflake.innerHTML = '';

            snowflake.style.left = `${Math.random() * 100}%`;
            snowflake.style.animationDuration = `${Math.random() * 3 + 2}s`;
            snowflake.style.animationDelay = `${Math.random() + 2}s`;

            snowflake.style.opacity = `${Math.random() * 0.6 + 0.4}`

            document.body.appendChild(snowflake);
        }

    }

};

document.addEventListener('DOMContentLoaded', () => app.init());