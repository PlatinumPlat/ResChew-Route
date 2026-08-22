const sidebarLinks = document.querySelectorAll(".sidebar-link");
const pages = document.querySelectorAll(".dashboard-page");
mapboxgl.accessToken = '';

sidebarLinks.forEach(link => {
    link.addEventListener("click", event => {
        event.preventDefault();
        const pageName = link.dataset.page;
        sidebarLinks.forEach(item => {
            item.classList.remove("active");
        });
        link.classList.add("active");
        pages.forEach(page => {
            page.classList.add("hidden");
        });
        const selectedPage = document.getElementById(`${pageName}-page`);
        if (pageName === "post") {
            setTimeout(() => {
                map.resize();
            }, 0);
        }
        selectedPage.classList.remove("hidden");
    });
});

const map = new mapboxgl.Map({
    container: 'map',
    center: [-98.5795, 39.8283],
    zoom: 3
});

const places = [
];

map.on('load', () => {
    places.forEach(place => {
        new mapboxgl.Marker().setLngLat([place.lon, place.lat]).addTo(map);
    })
})