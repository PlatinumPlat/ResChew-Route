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

function generatePostCode() {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    let code = "RC-";
    for (let i = 0; i < 2; i++) {
        code += letters[Math.floor(Math.random() * letters.length)];
    }
    code += "-";
    for (let i = 0; i < 4; i++) {
        code += numbers[Math.floor(Math.random() * numbers.length)];
    }
    return code;
}

const postFoodBtn = document.getElementById("post-food-btn");

postFoodBtn.addEventListener("click", () => {
    const location = document.getElementById("location").value.trim();
    const food = document.getElementById("food").value.trim();
    const quantity = document.getElementById("quantity").value;
    const expiry = document.getElementById("expiry").value;
    const notes = document.getElementById("notes").value.trim();
    const latitude = Number(document.getElementById("latitude").value);
    const longitude = Number(document.getElementById("longitude").value);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        alert("Please select a valid location first.");
        return;
    }
    if (!location || !food || !quantity || !expiry) {
        alert("Please fill in all required fields.");
        return;
    }
    const post = {
        id: Date.now(),
        code:generatePostCode(),
        location: location,
        latitude: latitude,
        longitude: longitude,
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
    document.getElementById("latitude").value = "";
    document.getElementById("longitude").value = "";

    console.log("Saved post:", post);
    console.log("All posts:", posts);
    loadHistory();
    loadDashboardStats();
});

const GHG_FOOD_FACTORS = [
    { keywords: ["dairy herd", "dairy beef"], value: 33.3 },
    { keywords: ["beef herd", "cattle", "steak", "beef"], value: 99.48 },
    { keywords: ["lamb", "mutton", "goat"], value: 39.72 },
    { keywords: ["dark chocolate"], value: 46.65 },
    { keywords: ["chocolate"], value: 34 },
    { keywords: ["coffee"], value: 28.53 },
    { keywords: ["prawn", "shrimp"], value: 26.87 },
    { keywords: ["cheese"], value: 23.88 },
    { keywords: ["fish", "salmon", "seafood"], value: 13.63 },
    { keywords: ["pig", "pork", "ham", "bacon"], value: 12.31 },
    { keywords: ["poultry", "chicken", "turkey"], value: 9.87 },
    { keywords: ["eggplant"], value: 0.53 },
    { keywords: ["egg"], value: 4.67 },
    { keywords: ["rice"], value: 4.45 },
    { keywords: ["groundnut", "peanut"], value: 3.23 },
    { keywords: ["beet sugar"], value: 1.81 },
    { keywords: ["cane sugar", "sugar"], value: 3.2 },
    { keywords: ["tofu"], value: 3.16 },
    { keywords: ["soy milk", "soymilk"], value: 0.98 },
    { keywords: ["milk", "dairy"], value: 3.15 },
    { keywords: ["avocado"], value: 2.5 },
    { keywords: ["oatmeal", "oat"], value: 2.48 },
    { keywords: ["tomato"], value: 2.09 },
    { keywords: ["bean", "lentil", "pulse"], value: 2 },
    { keywords: ["wine"], value: 1.79 },
    { keywords: ["maize", "corn"], value: 1.7 },
    { keywords: ["wheat", "rye", "bread", "pasta"], value: 1.57 },
    { keywords: ["berry", "berries", "grape"], value: 1.53 },
    { keywords: ["cassava"], value: 1.32 },
    { keywords: ["barley"], value: 1.18 },
    { keywords: ["peach"], value: 1.05 },
    { keywords: ["pea"], value: 0.98 },
    { keywords: ["soy"], value: 0.98 },
    { keywords: ["banana"], value: 0.86 },
    { keywords: ["brassica", "cabbage", "broccoli", "cauliflower"], value: 0.51 },
    { keywords: ["onion", "leek"], value: 0.5 },
    { keywords: ["potato"], value: 0.46 },
    { keywords: ["apple"], value: 0.43 },
    { keywords: ["nut", "almond", "walnut"], value: 0.43 },
    { keywords: ["root vegetable", "carrot", "turnip"], value: 0.43 },
    { keywords: ["citrus", "orange", "lemon", "lime", "grapefruit"], value: 0.39 },
    { keywords: ["fruit"], value: 1.05 },
    { keywords: ["vegetable", "veggie", "salad"], value: 0.53 }
];

const GHG_AVERAGE = 10.44;

function getGhgFactorForFood(foodName) {
    const name = String(foodName || "").toLowerCase();
    if (!name) return GHG_AVERAGE;
    const match = GHG_FOOD_FACTORS.find(item =>
        item.keywords.some(keyword => name.includes(keyword))
    );
    return match ? match.value : GHG_AVERAGE;
}

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
    const totalGhg = posts.reduce((total, post) => {
        const quantity = Number(post.quantity);
        if (!Number.isFinite(quantity) || quantity <= 0) return total;
        return total + quantity * getGhgFactorForFood(post.food);
    }, 0);
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
    const acceptedPostIds = (JSON.parse(localStorage.getItem("foodBankAccepted")) || []).map(item => item.postId);
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
                    ${acceptedPostIds.includes(post.id) ? '<span class="delivery-badge">Food bank accepted</span>' : '<span class="delivery-badge delivery-badge-pending">Awaiting food bank</span>'}

                    <button class="delete-post-btn" data-id="${post.id}">
                        <i class="fa-solid fa-delete-left"></i>
                    </button>
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

map.on("load", () => {
    loadMapPosts();
});

loadHistory();
loadDashboardStats();