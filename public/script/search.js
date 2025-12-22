// Search page logic
const grid = document.querySelector("#gigs-grid");
const searchInput = document.querySelector("#search-input");
let allGigs = [];
let currentUserId = null;
let myEngagedAdvertIds = new Set();

async function engageGig(advertId, btn) {
    if (btn) {
        btn.innerText = "Engaging...";
        btn.disabled = true;
    }
    
    try {
        const response = await fetch("/api/create-engagement", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ advertId })
        });
        const result = await response.json();
        if (result.result) {
            showModal("Engagement created!", "alert");
            loadEngagements();
            loadGigs();
        } else {
            showModal(result.message, "alert");
            if (btn) {
                btn.innerText = "Engage";
                btn.disabled = false;
            }
        }
    } catch (error) {
        console.error(error);
        showModal("An error occurred", "alert");
        if (btn) {
            btn.innerText = "Engage";
            btn.disabled = false;
        }
    }
}

async function completeEngagement(engagementId) {
    const response = await fetch("/api/complete-engagement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ engagementId })
    });
    const result = await response.json();
    if (result.result) {
        showModal(result.message, "alert");
        loadEngagements();
        loadGigs();
    } else {
        showModal(result.message, "alert");
    }
}

async function deleteGig(id, cardElement) {
    showModal("Are you sure you want to delete this gig?", "danger", async () => {
        const response = await fetch(`/api/advert/${id}`, {
            method: "DELETE"
        });
        const result = await response.json();
        if (result.result) {
            showModal("Gig deleted", "alert");
            if (cardElement) {
                cardElement.remove();
            } else {
                loadGigs();
            }
        } else {
            showModal(result.message, "alert");
        }
    }, "Delete Gig");
}

async function cancelEngagement(id, btn) {
    showModal("Are you sure you want to cancel this engagement?", "danger", async () => {
        if (btn) {
            btn.innerText = "Cancelling...";
            btn.disabled = true;
        }

        const response = await fetch("/api/cancel-engagement", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ engagementId: id })
        });
        const result = await response.json();
        if (result.result) {
            showModal("Engagement cancelled", "alert");
            loadEngagements();
            loadGigs();
        } else {
            showModal(result.message, "alert");
            if (btn) {
                btn.innerText = "Cancel";
                btn.disabled = false;
            }
        }
    }, "Cancel Engagement");
}

async function loadEngagements() {
    // We don't need to load engagements on the search page, 
    // but we might need to know which gigs are already engaged by the user to disable the button.
    // The loadGigs function handles the "engaged" status check.
}

// Load gigs
// const grid = document.querySelector("#gigs-grid"); // Already defined at top

function createGig(id, want, prov, desc, firstname, lastname, colorNum, 
    user_id, engagement_count, isOwner, isEngaged) {
    const colors = [
        { backgroundColor: "#bfdbfe", color: "#1e40af" },
        { backgroundColor: "#fef3c7", color: "#92400e" },
        { backgroundColor: "#d1fae5", color: "#065f46" },
        { backgroundColor: "#ffe4e6", color: "#9f1239" },
        { backgroundColor: "#ede9fe", color: "#5b21b6" },
        { backgroundColor: "#ccfbf1", color: "#0f766e" },
        { backgroundColor: "#fce7f3", color: "#9d174d" },
        { backgroundColor: "#f3f4f6", color: "#374151" },
        { backgroundColor: "#ffedd5", color: "#c2410c" },
        { backgroundColor: "#ecfccb", color: "#4d7c0f" }
    ];

    const card = document.createElement("div");
    const body = document.createElement("div");
    const exchange = document.createElement("div");
    const side1 = document.createElement("div");
    const label1 = document.createElement("span");
    const skill1 = document.createElement("div");
    const arrow = document.createElement("div");
    const side2 = document.createElement("div");
    const label2 = document.createElement("span");
    const skill2 = document.createElement("div");
    const description = document.createElement("p");
    const footer = document.createElement("div");
    const user = document.createElement("div");
    const avatar = document.createElement("div");
    const username = document.createElement("span");
    const actionButton = document.createElement("button");
    const engagementInfo = document.createElement("div");

    card.classList.add("gig-card");
    body.classList.add("gig-card-body");
    exchange.classList.add("gig-exchange");
    side1.classList.add("gig-side");
    label1.classList.add("gig-label");
    skill1.classList.add("gig-skill");
    arrow.classList.add("gig-arrow");
    side2.classList.add("gig-side");
    label2.classList.add("gig-label");
    skill2.classList.add("gig-skill");
    description.classList.add("gig-description");
    footer.classList.add("gig-footer");
    user.classList.add("gig-user");
    avatar.classList.add("user-avatar");
    username.classList.add("user-name");
    actionButton.classList.add("gig-action-btn");
    engagementInfo.classList.add("gig-status");

    if (isOwner) {
        actionButton.innerText = "Delete";
        actionButton.style.backgroundColor = "#ef4444";
        actionButton.onclick = () => deleteGig(id, card);
    } else if (isEngaged) {
        actionButton.innerText = "Engaged";
        actionButton.disabled = true;
        actionButton.style.backgroundColor = "#9ca3af";
        actionButton.style.cursor = "default";
    } else {
        actionButton.innerText = "Engage";
        actionButton.onclick = () => engageGig(id, actionButton);
    }

    engagementInfo.innerText = `${engagement_count} active engagements`;

    side2.style.alignItems = "flex-end";
    avatar.style.backgroundColor = colors[colorNum].backgroundColor;
    avatar.style.color = colors[colorNum].color;

    label1.textContent = "Offering";
    skill1.textContent = prov;
    arrow.textContent = "⇄";
    label2.textContent = "Seeking";
    skill2.textContent = want;
    description.textContent = desc;
    username.textContent = firstname + " " + lastname;
    avatar.textContent = firstname[0].toUpperCase() + lastname[0].toUpperCase();

    side1.appendChild(label1);
    side1.appendChild(skill1);
    side2.appendChild(label2);
    side2.appendChild(skill2);
    exchange.appendChild(side1);
    exchange.appendChild(arrow);
    exchange.appendChild(side2);
    body.appendChild(exchange);
    body.appendChild(description);
    user.appendChild(avatar);
    user.appendChild(username);
    footer.appendChild(user);
    footer.appendChild(engagementInfo);
    footer.appendChild(actionButton);

    body.appendChild(footer);
    card.appendChild(body);
    grid.appendChild(card);
}

function renderGigs(gigs) {
    grid.innerHTML = ""; // Clear grid before adding items
    let colorNum = 0;
    const totalColors = 10;

    for (let x of gigs) {
        if (x.user_id !== currentUserId) {
            createGig(x.id, x.skill_wanted, x.skill_provided, x.description, 
                x.firstname, x.lastname, (colorNum++ % totalColors), x.user_id, x.engagement_count, x.user_id === currentUserId, myEngagedAdvertIds.has(x.id));
        }
    }
}

async function loadGigs() {
    try {
        const response = await fetch("/api/advert");
        const gigsData = await response.json();

        if (gigsData.result == false)
            return;

        allGigs = gigsData.data;

        // Get current user to check ownership
        const userResponse = await fetch("/api/current-user");
        const userData = await userResponse.json();
        currentUserId = userData.result ? userData.data.id : null;

        // Get my engagements to check status
        const engagementResponse = await fetch("/api/my-engagements");
        const engagementData = await engagementResponse.json();
        myEngagedAdvertIds = new Set();
        if (engagementData.result) {
            engagementData.data.forEach(eng => {
                if (eng.status === 'active') {
                    myEngagedAdvertIds.add(eng.advert_id);
                }
            });
        }

        renderGigs(allGigs);
    } catch (error) {
        console.error("Error loading gigs:", error);
    }
}

if (searchInput) {
    searchInput.addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase();
        const filteredGigs = allGigs.filter(gig => 
            gig.skill_wanted.toLowerCase().includes(term) || 
            gig.skill_provided.toLowerCase().includes(term) ||
            gig.description.toLowerCase().includes(term)
        );
        renderGigs(filteredGigs);
    });
}

loadGigs();
// loadEngagements();