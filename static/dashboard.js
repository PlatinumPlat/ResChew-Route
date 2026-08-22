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

let locationMarker;

const addressInput = document.getElementById("location");
const latitudeInput = document.getElementById("latitude");
const longitudeInput = document.getElementById("longitude");
const locationStatus = document.getElementById("location-status");

function showLocationStatus(message, isError = false) {
    locationStatus.textContent = message;
    locationStatus.classList.toggle("error", isError);
}

function setLocationResult([longitude, latitude], address) {
    latitudeInput.value = latitude.toFixed(6);
    longitudeInput.value = longitude.toFixed(6);
    addressInput.value = address;

    if (locationMarker) {
        locationMarker.setLngLat([longitude, latitude]);
    } else {
        locationMarker = new mapboxgl.Marker().setLngLat([longitude, latitude]).addTo(map);
    }
    map.flyTo({ center: [longitude, latitude], zoom: 14 });
}

async function searchLocation(query, reverse = false) {
    const endpoint = reverse
        ? `https://api.mapbox.com/geocoding/v5/mapbox.places/${query[0]},${query[1]}.json`
        : `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`;
    const response = await fetch(`${endpoint}?access_token=${mapboxgl.accessToken}&limit=1`);
    if (!response.ok) throw new Error("Location search failed");
    const data = await response.json();
    if (!data.features.length) throw new Error("No matching location found");
    const feature = data.features[0];
    setLocationResult(feature.center, feature.place_name);
    showLocationStatus("Location found");
}

document.getElementById("address-search-btn").addEventListener("click", async () => {
    const address = addressInput.value.trim();
    if (!address) return showLocationStatus("Enter an address to search", true);
    showLocationStatus("Searching...");
    try {
        await searchLocation(address);
    } catch (error) {
        showLocationStatus(error.message, true);
    }
});

document.getElementById("coordinate-search-btn").addEventListener("click", async () => {
    const latitude = Number(latitudeInput.value);
    const longitude = Number(longitudeInput.value);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
        !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        return showLocationStatus("Enter a valid latitude and longitude", true);
    }
    showLocationStatus("Searching...");
    try {
        await searchLocation([longitude, latitude], true);
    } catch (error) {
        showLocationStatus(error.message, true);
    }
});

[addressInput, latitudeInput, longitudeInput].forEach(input => {
    input.addEventListener("keydown", event => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        document.getElementById(input === addressInput ? "address-search-btn" : "coordinate-search-btn").click();
    });
});

const places = [
];

map.on('load', () => {
    places.forEach(place => {
        new mapboxgl.Marker().setLngLat([place.lon, place.lat]).addTo(map);
    })
})