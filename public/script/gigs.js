// Insert gigs
const teaching = document.querySelector("#post-gig-teach");
const want = document.querySelector("#post-gig-want");
const description = document.querySelector("#post-gig-description");
const submit = document.querySelector("#post-gig-submit");

function checkEmpty(inp) {
    if (inp.value.trim() == "")
        return false;
    return true;
}

function checkInputs() {
    if (!checkEmpty(teaching) | !checkEmpty(want))
        return false;
    return true;
}

async function insertGig() {
    let response = await fetch("/api/current-user");
    let user = await response.json();

    if (user.result == false)
        return;
    
    const advert = {
        id: crypto.randomUUID(),
        description: description.value.trim(),
        skillWanted: want.value.trim(),
        skillProvided: teaching.value.trim(),
        isActive: true,
        userID: user.data.id
    };

    response = await fetch("/api/create-advert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ advert })
    });   

    console.log(response);
}

async function engageGig(advertId) {
    const response = await fetch("/api/create-engagement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ advertId })
    });
    const result = await response.json();
    if (result.result) {
        alert("Engagement created!");
        loadEngagements();
    } else {
        alert(result.message);
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
        alert(result.message);
        loadEngagements();
    } else {
        alert(result.message);
    }
}

async function deleteGig(id, cardElement) {
    if (!confirm("Are you sure you want to delete this gig?")) return;

    const response = await fetch(`/api/advert/${id}`, {
        method: "DELETE"
    });
    const result = await response.json();
    if (result.result) {
        alert("Gig deleted");
        if (cardElement) {
            cardElement.remove();
        } else {
            loadGigs();
        }
    } else {
        alert(result.message);
    }
}

async function cancelEngagement(id) {
    if (!confirm("Are you sure you want to cancel this engagement?")) return;

    const response = await fetch("/api/cancel-engagement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ engagementId: id })
    });
    const result = await response.json();
    if (result.result) {
        alert("Engagement cancelled");
        loadEngagements();
    } else {
        alert(result.message);
    }
}

async function loadEngagements() {
    const response = await fetch("/api/my-engagements");
    const result = await response.json();
    
    if (!result.result) return;

    const activeGrid = document.querySelector("#engagements-grid");
    const completedGrid = document.querySelector("#completed-engagements-grid");
    activeGrid.innerHTML = "";
    completedGrid.innerHTML = "";

    result.data.forEach(eng => {
        if (eng.status === 'cancelled') return;

        const card = document.createElement("div");
        card.classList.add("gig-card");
        
        let statusText = eng.status;
        if (eng.status === 'active') {
            if (eng.provider_completed && !eng.receiver_completed) statusText = "Waiting for receiver";
            else if (!eng.provider_completed && eng.receiver_completed) statusText = "Waiting for provider";
            else statusText = "In Progress";
        }

        card.innerHTML = `
            <div class="gig-card-body">
                <div class="gig-exchange">
                    <div class="gig-side">
                        <span class="gig-label">TEACHING</span>
                        <div class="gig-skill">${eng.skill_provided}</div>
                    </div>
                    <div class="gig-arrow">⇄</div>
                    <div class="gig-side">
                        <span class="gig-label">LEARNING</span>
                        <div class="gig-skill">${eng.skill_wanted}</div>
                    </div>
                </div>
                <p class="gig-description">${eng.description}</p>
                <div class="gig-footer">
                    <div class="gig-status">Status: ${statusText}</div>
                    ${eng.status !== 'completed' ? `
                        <div style="display: flex; gap: 8px;">
                            <button onclick="completeEngagement('${eng.id}')" class="gig-action-btn">Mark Complete</button>
                            <button onclick="cancelEngagement('${eng.id}')" class="gig-action-btn" style="background-color: #ef4444;">Cancel</button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        if (eng.status === 'completed') {
            completedGrid.appendChild(card);
        } else {
            activeGrid.appendChild(card);
        }
    });
}

submit.addEventListener("click", async () => {
    if (!checkInputs())
        return; 

    submit.disabled = true;
    submit.innerText = "Creating...";

    try {
        await insertGig();
        description.value = "";
        want.value = "";
        teaching.value = "";
        loadGigs();
    } catch (error) {
        console.error(error);
        alert("Failed to create gig");
    } finally {
        submit.disabled = false;
        submit.innerText = "Create Gig";
    }
});

// Load gigs
const grid = document.querySelector("#gigs-grid");

function createGig(id, want, prov, desc, firstname, lastname, colorNum, 
    user_id, engagement_count, isOwner) {
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
    } else {
        actionButton.innerText = "Engage";
        actionButton.onclick = () => engageGig(id);
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

async function loadGigs() {
    let colorNum = 0;
    const totalColors = 10;
    const response = await fetch("/api/advert");
    const gigsData = await response.json();

    if (gigsData.result == false)
        return;

    // Get current user to check ownership
    const userResponse = await fetch("/api/current-user");
    const userData = await userResponse.json();
    const currentUserId = userData.result ? userData.data.id : null;

    grid.innerHTML = ""; // Clear grid before adding items

    for (let x of gigsData.data) {
        createGig(x.id, x.skill_wanted, x.skill_provided, x.description, 
            x.firstname, x.lastname, (colorNum++ % totalColors), x.user_id, x.engagement_count, x.user_id === currentUserId);
    }
}

loadGigs();
loadEngagements();