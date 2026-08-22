const sidebarLinks = document.querySelectorAll(".sidebar-link");
const pages = document.querySelectorAll(".dashboard-page");
mapboxgl.accessToken = 'asdf';

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

const postFoodBtn = document.getElementById("post-food-btn");

postFoodBtn.addEventListener("click", () => {
    const location = document.getElementById("location").value.trim();
    const food = document.getElementById("food").value.trim();
    const quantity = document.getElementById("quantity").value;
    const expiry = document.getElementById("expiry").value;
    const notes = document.getElementById("notes").value.trim();
    if (!location || !food || !quantity || !expiry) {
        alert("Please fill in all required fields.");
        return;
    }
    const post = {
        id: Date.now(),
        location: location,
        food: food,
        quantity: Number(quantity),
        expiry: expiry,
        notes: notes,
        createdAt: new Date().toISOString()
    };
    const posts = JSON.parse(localStorage.getItem("foodPosts")) || [];
    posts.push(post);
    localStorage.setItem("foodPosts", JSON.stringify(posts));
    alert("Post was successful!");
    document.getElementById("location").value = "";
    document.getElementById("food").value = "";
    document.getElementById("quantity").value = "";
    document.getElementById("expiry").value = "";
    document.getElementById("notes").value = "";

    console.log("Saved post:", post);
    console.log("All posts:", posts);
    loadHistory();
    loadDashboardStats();
});

function loadDashboardStats() {
    const countElement = document.getElementById("rescued-food-count");
    const ghgElement = document.getElementById("ghg-count");
    const postsElement = document.getElementById("rescued-food-posts");
    if (!countElement || !ghgElement || !postsElement) return;

    const posts = JSON.parse(localStorage.getItem("foodPosts")) || [];
    const totalQuantity = posts.reduce((total, post) => {
        const quantity = Number(post.quantity);
        return total + (Number.isFinite(quantity) && quantity > 0 ? quantity : 0);
    }, 0);
    const previousQuantity = Number(countElement.dataset.value) || 0;
    const previousGhg = Number(ghgElement.dataset.value) || 0;
    const totalGhg = totalQuantity * 2.5;
    const animationStart = performance.now();
    const animationDuration = 450;

    countElement.dataset.value = totalQuantity;
    ghgElement.dataset.value = totalGhg;
    postsElement.textContent = `${posts.length} ${posts.length === 1 ? "post" : "posts"}`;

    function updateCount(timestamp) {
        const progress = Math.min((timestamp - animationStart) / animationDuration, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        countElement.textContent = Math.round(
            previousQuantity + (totalQuantity - previousQuantity) * easedProgress
        ).toLocaleString();
        ghgElement.textContent = (
            previousGhg + (totalGhg - previousGhg) * easedProgress
        ).toFixed(1);
        if (progress < 1) requestAnimationFrame(updateCount);
    }

    requestAnimationFrame(updateCount);
}

function loadHistory() {
    const historyList = document.getElementById("history-list");
    if (!historyList) return;
    const posts = JSON.parse(localStorage.getItem("foodPosts")) || [];
    historyList.innerHTML = "";
    if (posts.length === 0) {
        historyList.innerHTML = `
            <div class="empty-history">
                <i class="fa-solid fa-box-open"></i>
                <h3>No food posts yet</h3>
                <p>Make one in "Post Food"!</p>
            </div>
        `;
        return;
    }
    posts.reverse().forEach(post => {
        const card = document.createElement("div");
        card.className = "history-card";
        const expiryDate = new Date(post.expiry);
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

                    <button class="delete-post-btn" data-id="${post.id}">
                        <i class="fa-solid fa-delete-left"></i>
                    </button>
                </div>

                <div class="history-details">
                    <div class="history-detail">
                        <i class="fa-solid fa-location-dot"></i>
                        <div>
                            <span>Location</span>
                            <strong>${post.location}</strong>
                        </div>
                    </div>

                    <div class="history-detail">
                        <i class="fa-solid fa-box"></i>
                        <div>
                            <span>Quantity</span>
                            <strong>${post.quantity}</strong>
                        </div>
                    </div>

                    <div class="history-detail">
                        <i class="fa-solid fa-clock"></i>
                        <div>
                            <span>Expires</span>
                            <strong>${expiryDate.toLocaleString()}</strong>
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
                : ""
            }
            </div>
        `;

        historyList.appendChild(card);
    });

    document.querySelectorAll(".delete-post-btn").forEach(button => {
        button.addEventListener("click", () => {
            const id = Number(button.dataset.id);
            const confirmed = confirm(
                "Are you sure you want to delete this food post?"
            );
            if (!confirmed) return;
            const posts = JSON.parse(localStorage.getItem("foodPosts")) || [];
            const updatedPosts = posts.filter(post => post.id !== id);
            localStorage.setItem(
                "foodPosts",
                JSON.stringify(updatedPosts)
            );
            loadHistory();
            loadDashboardStats();
        });
    });
}

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

loadHistory();
loadDashboardStats();