const sidebarLinks = document.querySelectorAll(".sidebar-link");
const pages = document.querySelectorAll(".dashboard-page");
mapboxgl.accessToken = 'pk.eyJ1Ijoic3B1MTU5IiwiYSI6ImNtdDRlaXBlcDFhcmkzNG9ocmt6cXRhM3QifQ.v0P4JN1OBfbRg1ewdZVdbQ';

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
});

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
        });
    });
}

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

loadHistory();