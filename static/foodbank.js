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
        if (pageName === "history") {
            loadFoodBankHistory();
        }
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


function loadMapPosts() {
    const posts = JSON.parse(localStorage.getItem("foodPosts")) || [];
    posts.forEach(post => {
        const popup = new mapboxgl.Popup({
            offset: 25
        }).setHTML(`
            <strong>${post.food}</strong>
            <br>
            Quantity: ${post.quantity}
            <br>
            Expires: ${post.expiry}
            <br>
            ${post.location}
            <br>
            <strong>Matching Code: ${post.code || "N/A"}</strong>
        `);
        new mapboxgl.Marker()
            .setLngLat([
                Number(post.longitude),
                Number(post.latitude)
            ])
            .setPopup(popup)
            .addTo(map);
    });
}

function loadFoodBankLocation() {
    const foodBankLocation = JSON.parse(localStorage.getItem("foodBankLocation"));
    if (!foodBankLocation) return;
    const popup = new mapboxgl.Popup({
        offset: 25
    }).setHTML(`
        <strong>Food Bank</strong>
        <br>
        ${foodBankLocation.location}
        <br>
        <strong>Matching Code: ${foodBankLocation.code}</strong>
    `);
    new mapboxgl.Marker()
        .setLngLat([
            Number(foodBankLocation.longitude),
            Number(foodBankLocation.latitude)
        ])
        .setPopup(popup)
        .addTo(map);
}

function loadFoodPosts() {
    const postsList = document.getElementById("food-posts-list");
    if (!postsList) return;
    const posts = JSON.parse(localStorage.getItem("foodPosts")) || [];
    postsList.innerHTML = "";
    if (posts.length === 0) {
        postsList.innerHTML = `
            <div class="empty-history">
                <i class="fa-solid fa-box-open"></i>
                <h3>No food posts available</h3>
                <p>Restaurants haven't posted any food yet.</p>
            </div>
        `;
        return;
    }
    [...posts].reverse().forEach(post => {
        const card = document.createElement("div");
        card.className = "history-card";
        const createdDate = new Date(post.createdAt);
        card.innerHTML = `
            <div class="history-card-content">
                <div class="history-card-header">
                    <div>
                        <h2>${post.food}</h2>
                        <span class="post-date">
                            Posted ${createdDate.toLocaleDateString()}
                        </span>
                    </div>
                </div>
                <div class="history-details">
                    <div class="history-detail">
                        <i class="fa-solid fa-location-dot"></i>
                        <div>
                            <span>Location</span>
                            ${post.location}
                        </div>
                    </div>
                    <div class="history-detail">
                        <i class="fa-solid fa-box"></i>
                        <div>
                            <span>Quantity</span>
                            ${post.quantity}
                        </div>
                    </div>
                    <div class="history-detail">
                        <i class="fa-solid fa-clock"></i>
                        <div>
                            <span>Expires</span>
                            ${post.expiry}
                        </div>
                    </div>
                    <div class="history-detail">
                        <i class="fa-solid fa-key"></i>
                        <div>
                            <span>Matching Code</span>
                            <strong>${post.code || "N/A"}</strong>
                        </div>
                    </div>
                </div>
                ${post.notes
                ? `
                    <div class="history-notes">
                        <i class="fa-solid fa-note-sticky"></i>
                        <span>${post.notes}</span>
                    </div>
                `
                : ""}
            </div>
        `;
        postsList.appendChild(card);
    });
}

function loadFoodBankHistory() {
    const historyList = document.getElementById("history-list");
    if (!historyList) return;

    const requests = JSON.parse(localStorage.getItem("deliveryRequests")) || [];

    historyList.innerHTML = "";

    if (requests.length === 0) {
        historyList.innerHTML = `
            <div class="empty-history">
                <i class="fa-solid fa-clock-rotate-left"></i>
                <h3>No delivery requests yet</h3>
                <p>Your delivery requests will appear here.</p>
            </div>
        `;
        return;
    }

    [...requests].reverse().forEach(request => {
        const card = document.createElement("div");

        card.className = "history-card";

        const createdDate = new Date(request.createdAt);

        card.innerHTML = `
            <div class="history-card-content">

                <div class="history-card-header">
                    <div>
                        <h2>${request.food}</h2>
                        <span class="post-date">
                            Requested ${createdDate.toLocaleDateString()}
                        </span>
                    </div>

                    <button class="delete-request-btn" data-id="${request.id}">
                        <i class="fa-solid fa-delete-left"></i>
                    </button>
                </div>

                <div class="history-details">

                    <div class="history-detail">
                        <i class="fa-solid fa-location-dot"></i>
                        <div>
                            <span>Food Bank Location</span>
                            ${request.deliveryLocation}
                        </div>
                    </div>

                    <div class="history-detail">
                        <i class="fa-solid fa-box"></i>
                        <div>
                            <span>Quantity</span>
                            ${request.quantity}
                        </div>
                    </div>

                    <div class="history-detail">
                        <i class="fa-solid fa-key"></i>
                        <div>
                            <span>Matching Code</span>
                            <strong>${request.code}</strong>
                        </div>
                    </div>

                    <div class="history-detail">
                        <i class="fa-solid fa-store"></i>
                        <div>
                            <span>Restaurant Location</span>
                            ${request.restaurantLocation}
                        </div>
                    </div>

                </div>

            </div>
        `;

        historyList.appendChild(card);
    });

    document.querySelectorAll(".delete-request-btn").forEach(button => {

        button.addEventListener("click", () => {

            const id = Number(button.dataset.id);

            const confirmed = confirm(
                "Are you sure you want to delete this delivery request?"
            );

            if (!confirmed) return;

            const requests =
                JSON.parse(localStorage.getItem("deliveryRequests")) || [];

            const updatedRequests =
                requests.filter(request => request.id !== id);

            localStorage.setItem(
                "deliveryRequests",
                JSON.stringify(updatedRequests)
            );

            loadFoodBankHistory();
        });

    });
} const requestDeliveryBtn = document.getElementById("request-delivery-btn");

if (requestDeliveryBtn) {
    requestDeliveryBtn.addEventListener("click", function (event) {
        event.preventDefault();

        const location = document.getElementById("location").value.trim();
        const latitude = Number(document.getElementById("latitude").value);
        const longitude = Number(document.getElementById("longitude").value);
        const code = document.getElementById("delivery-code").value.trim().toUpperCase();

        if (!location || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            alert("Please enter a valid food bank address.");
            return;
        }

        if (!code) {
            alert("Please enter the matching code.");
            return;
        }


        const posts = JSON.parse(localStorage.getItem("foodPosts")) || [];

        const matchingPost = posts.find(post => {
            return String(post.code || "").toUpperCase() === code;
        });

        if (!matchingPost) {
            alert("No food post was found with that matching code.");
            return;
        }

        const foodBankLocation = {
            location: location,
            latitude: latitude,
            longitude: longitude,
            code: code,
            updatedAt: new Date().toISOString()
        };

        localStorage.setItem(
            "foodBankLocation",
            JSON.stringify(foodBankLocation)
        );

        const request = {
            id: Date.now(),
            code: code,
            food: matchingPost.food,
            quantity: matchingPost.quantity,
            restaurantLocation: matchingPost.location,
            restaurantLatitude: matchingPost.latitude,
            restaurantLongitude: matchingPost.longitude,
            deliveryLocation: location,
            latitude: latitude,
            longitude: longitude,
            createdAt: new Date().toISOString()
        };

        const requests =
            JSON.parse(localStorage.getItem("deliveryRequests")) || [];

        requests.push(request);

        localStorage.setItem(
            "deliveryRequests",
            JSON.stringify(requests)
        );

        const popup = new mapboxgl.Popup({
            offset: 25
        }).setHTML(`
            <strong>Food Bank</strong>
            <br>
            ${request.deliveryLocation}
            <br>
            <strong>Matching Code: ${request.code}</strong>
            <br>
            Food: ${request.food}
            <br>
            Quantity: ${request.quantity}
            <br>
        `);

        new mapboxgl.Marker()
            .setLngLat([
                request.longitude,
                request.latitude
            ])
            .setPopup(popup)
            .addTo(map);

        alert("Delivery request submitted!");

        document.getElementById("location").value = "";
        document.getElementById("latitude").value = "";
        document.getElementById("longitude").value = "";
        document.getElementById("delivery-code").value = "";

        loadFoodBankHistory();

        console.log("Delivery request saved:", request);
    });
}

map.on("load", () => {
    loadMapPosts();
    loadFoodBankLocation();
});

loadFoodPosts();
loadFoodBankHistory();