mapboxgl.accessToken = window.MAPBOX_ACCESS_TOKEN || "";

const deliveryLinks = document.querySelectorAll(".delivery-dashboard .sidebar-link");
const deliveryPages = document.querySelectorAll(".delivery-dashboard .dashboard-page");
const deliveryMap = new mapboxgl.Map({
    container: "delivery-map",
    center: [-98.5795, 39.8283],
    zoom: 3
});
const acceptedKey = "deliveryAccepted";
const getPosts = () => JSON.parse(localStorage.getItem("foodPosts")) || [];
const getAccepted = () => JSON.parse(localStorage.getItem(acceptedKey)) || [];
const saveAccepted = accepted => localStorage.setItem(acceptedKey, JSON.stringify(accepted));

deliveryLinks.forEach(link => link.addEventListener("click", event => {
    event.preventDefault();
    deliveryLinks.forEach(item => item.classList.remove("active"));
    link.classList.add("active");
    deliveryPages.forEach(page => page.classList.add("hidden"));
    document.getElementById(`${link.dataset.page}-page`).classList.remove("hidden");
    if (link.dataset.page === "pickups") setTimeout(() => deliveryMap.resize(), 0);
}));

function formatDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function renderPickups() {
    const foodBankAccepted = JSON.parse(localStorage.getItem("foodBankAccepted")) || [];
    const claimedIds = getAccepted().map(item => item.postId);
    const posts = foodBankAccepted.map(item => item.post).filter(post => !claimedIds.includes(post.id));
    document.getElementById("pickup-count").textContent = `${posts.length} available`;
    const list = document.getElementById("pickup-list");
    list.innerHTML = posts.length ? "" : `<div class="empty-history"><i class="fa-solid fa-route"></i><h3>No pickups available</h3><p>New restaurant posts will appear here.</p></div>`;
    posts.forEach(post => {
        const card = document.createElement("article");
        card.className = "pickup-card";
        card.innerHTML = `<div class="pickup-card-top"><div><h3>${post.food}</h3><span>${post.quantity} meals</span></div><i class="fa-solid fa-bowl-food"></i></div><p class="pickup-location"><i class="fa-solid fa-location-dot"></i>${post.location}</p><p class="pickup-expiry"><i class="fa-solid fa-clock"></i>Ready until ${formatDate(post.expiry)}</p><button class="accept-button" data-id="${post.id}"><i class="fa-solid fa-check"></i> Accept pickup</button>`;
        list.appendChild(card);
    });
    list.querySelectorAll(".accept-button").forEach(button => button.addEventListener("click", () => acceptPickup(Number(button.dataset.id))));
}

function acceptPickup(postId) {
    const post = getPosts().find(item => item.id === postId);
    if (!post || getAccepted().some(item => item.postId === postId)) return;
    const accepted = getAccepted();
    accepted.push({ postId: post.id, acceptedAt: new Date().toISOString(), post });
    saveAccepted(accepted);
    renderAll();
    alert("Pickup accepted. It has been added to your notifications.");
}

function renderNotifications() {
    const accepted = getAccepted().slice().reverse();
    document.getElementById("notification-count").textContent = accepted.length;
    const list = document.getElementById("notification-list");
    list.innerHTML = accepted.length ? accepted.map(item => `<article class="notification-card"><i class="fa-solid fa-circle-check"></i><div><strong>Pickup accepted</strong><p>${item.post.food} is ready at ${item.post.location}.</p><span>Accepted ${formatDate(item.acceptedAt)}</span></div></article>`).join("") : `<div class="empty-history"><i class="fa-solid fa-bell-slash"></i><h3>No notifications</h3><p>Accepted pickups and route updates will appear here.</p></div>`;
}

function renderHistory() {
    const accepted = getAccepted().slice().reverse();
    const list = document.getElementById("delivery-history");
    list.innerHTML = accepted.length ? accepted.map(item => `<article class="history-card delivery-history-card"><div class="history-card-content"><div class="history-card-header"><div><h2>${item.post.food}</h2><span class="post-date">Accepted ${formatDate(item.acceptedAt)}</span></div><span class="delivery-badge">Accepted</span></div><div class="history-details"><div class="history-detail"><i class="fa-solid fa-location-dot"></i><div><span>Pickup</span><strong>${item.post.location}</strong></div></div><div class="history-detail"><i class="fa-solid fa-box"></i><div><span>Quantity</span><strong>${item.post.quantity} meals</strong></div></div></div></div></article>`).join("") : `<div class="empty-history"><i class="fa-solid fa-road"></i><h3>No deliveries yet</h3><p>Accept a pickup to see it here.</p></div>`;
}

function addPickupMarkers() {
    const foodBankAccepted = JSON.parse(localStorage.getItem("foodBankAccepted")) || [];
    foodBankAccepted.map(item => item.post).forEach(post => {
        const lat = Number(post.latitude);
        const lng = Number(post.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
        new mapboxgl.Marker()
            .setLngLat([lng, lat])
            .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(
                `<strong>${post.food}</strong><br>${post.quantity} meals`
            ))
            .addTo(deliveryMap);
    });
}

function renderAll() { renderPickups(); renderNotifications(); renderHistory(); }
deliveryMap.on("load", () => {
    deliveryMap.resize();
    addPickupMarkers();
});
renderAll();
