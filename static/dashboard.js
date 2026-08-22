const sidebarLinks = document.querySelectorAll(".sidebar-link");
const pages = document.querySelectorAll(".dashboard-page");

sidebarLinks.forEach(link => {
    link.addEventListener("click", function (event) {
        event.preventDefault();
        const pageName = this.getAttribute("data-page");
        console.log("Clicked:", pageName);
        sidebarLinks.forEach(link => {
            link.classList.remove("active");
        });
        this.classList.add("active");
        pages.forEach(page => {
            page.classList.add("hidden");
        });
        const selectedPage = document.getElementById(pageName + "-page");
        console.log("Showing:", selectedPage);
        if (selectedPage) {
            selectedPage.classList.remove("hidden");
        }
    });
});

mapboxgl.accessToken = '';
const map = new mapboxgl.Map({
    container: 'map',
    center: [-98.5795, 39.8283],
    zoom: 3
});

const cities = [
    { id: 'nyc', lon: -74.006, lat: 40.7128 }
];

map.on('load', () => {
    cities.forEach(city => {
        new mapboxgl.Marker().setLngLat([city.lon, city.lat]).addTo(map);
    })
})