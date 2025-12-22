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
    const response = await fetch("/api/my-engagements");
    const result = await response.json();
    
    if (!result.result) return;

    // Get current user to check completion status
    const userResponse = await fetch("/api/current-user");
    const userData = await userResponse.json();
    const currentUserId = userData.result ? userData.data.id : null;

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

        const isProvider = eng.provider_id === currentUserId;
        const isReceiver = eng.receiver_id === currentUserId;
        const userCompleted = (isProvider && eng.provider_completed) || (isReceiver && eng.receiver_completed);

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
                            ${!userCompleted ? 
                                `<button onclick="completeEngagement('${eng.id}')" class="gig-action-btn">Mark Complete</button>` : 
                                `<button disabled class="gig-action-btn" style="background-color: #9ca3af; cursor: default;">Waiting for other</button>`
                            }
                            <button onclick="cancelEngagement('${eng.id}', this)" class="gig-action-btn" style="background-color: #ef4444;">Cancel</button>
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
        fetchAndRenderTriplets();
        showModal("Gig created successfully!", "alert");
    } catch (error) {
        console.error(error);
        showModal("Failed to create gig", "alert");
    } finally {
        submit.disabled = false;
        submit.innerText = "Create Gig";
    }
});

// Load gigs
const grid = document.querySelector("#gigs-grid");

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

async function loadGigs() {
    try {
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

        // Get my engagements to check status
        const engagementResponse = await fetch("/api/my-engagements");
        const engagementData = await engagementResponse.json();
        const myEngagedAdvertIds = new Set();
        if (engagementData.result) {
            engagementData.data.forEach(eng => {
                if (eng.status === 'active') {
                    myEngagedAdvertIds.add(eng.advert_id);
                }
            });
        }

        grid.innerHTML = ""; // Clear grid before adding items

        for (let x of gigsData.data) {
            if (x.user_id === currentUserId) {
                createGig(x.id, x.skill_wanted, x.skill_provided, x.description, 
                    x.firstname, x.lastname, (colorNum++ % totalColors), x.user_id, x.engagement_count, x.user_id === currentUserId, myEngagedAdvertIds.has(x.id));
            }
        }
    } catch (error) {
        console.error("Error loading gigs:", error);
    }
}

async function confirmTriTrade(gigA, gigB, gigC, btn) {
    if (btn) {
        btn.innerText = "Confirming...";
        btn.disabled = true;
    }

    try {
        const response = await fetch("/api/confirm-tri-trade", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ gigA, gigB, gigC })
        });
        const result = await response.json();
        
        if (result.result) {
            showModal(result.message, "alert");
            fetchAndRenderTriplets(); // Refresh UI
        } else {
            showModal(result.message, "alert");
            if (btn) {
                btn.innerText = "Confirm My Part";
                btn.disabled = false;
            }
        }
    } catch (error) {
        console.error(error);
        showModal("An error occurred", "alert");
        if (btn) {
            btn.innerText = "Confirm My Part";
            btn.disabled = false;
        }
    }
}

async function fetchAndRenderTriplets() {
    try {
        const response = await fetch("/api/tri-trades");
        const result = await response.json();
        
        if (!result.result) return;

        const container = document.querySelector("#tri-trades-grid");
        if (!container) return; // Ensure container exists in HTML
        
        container.innerHTML = "";

        // Get current user ID to orient the loop correctly
        const userResponse = await fetch("/api/current-user");
        const userData = await userResponse.json();
        const currentUserId = userData.result ? userData.data.id : null;

        const renderedTrades = new Set();

        result.data.forEach(trade => {
            // Deduplicate trades
            const tradeId = [trade.gig_a_id, trade.gig_b_id, trade.gig_c_id].sort().join('-');
            if (renderedTrades.has(tradeId)) return;
            renderedTrades.add(tradeId);

            // Determine who is who relative to the current user
            let userA, userB, userC;
            let skillA, skillB, skillC;
            let myAccepted = false;
            
            // We want to display it as: You (A) -> B -> C -> You (A)
            // So we need to rotate the trade data so current user is A
            if (trade.user_a_id === currentUserId) {
                userA = { name: "You", id: trade.user_a_id, isMe: true };
                userB = { name: trade.user_b_firstname + " " + trade.user_b_lastname, id: trade.user_b_id, isMe: false, initials: trade.user_b_firstname[0] + trade.user_b_lastname[0] };
                userC = { name: trade.user_c_firstname + " " + trade.user_c_lastname, id: trade.user_c_id, isMe: false, initials: trade.user_c_firstname[0] + trade.user_c_lastname[0] };
                skillA = trade.skill_a_provided;
                skillB = trade.skill_b_provided;
                skillC = trade.skill_c_provided;
                myAccepted = trade.a_accepted;
            } else if (trade.user_b_id === currentUserId) {
                userA = { name: "You", id: trade.user_b_id, isMe: true };
                userB = { name: trade.user_c_firstname + " " + trade.user_c_lastname, id: trade.user_c_id, isMe: false, initials: trade.user_c_firstname[0] + trade.user_c_lastname[0] };
                userC = { name: trade.user_a_firstname + " " + trade.user_a_lastname, id: trade.user_a_id, isMe: false, initials: trade.user_a_firstname[0] + trade.user_a_lastname[0] };
                skillA = trade.skill_b_provided;
                skillB = trade.skill_c_provided;
                skillC = trade.skill_a_provided;
                myAccepted = trade.b_accepted;
            } else {
                userA = { name: "You", id: trade.user_c_id, isMe: true };
                userB = { name: trade.user_a_firstname + " " + trade.user_a_lastname, id: trade.user_a_id, isMe: false, initials: trade.user_a_firstname[0] + trade.user_a_lastname[0] };
                userC = { name: trade.user_b_firstname + " " + trade.user_b_lastname, id: trade.user_b_id, isMe: false, initials: trade.user_b_firstname[0] + trade.user_b_lastname[0] };
                skillA = trade.skill_c_provided;
                skillB = trade.skill_a_provided;
                skillC = trade.skill_b_provided;
                myAccepted = trade.c_accepted;
            }

            const card = document.createElement("div");
            card.className = "card loop-card";
            
            let actionButton = "";
            if (trade.circle_status === 'active') {
                actionButton = `<button class="btn-primary" disabled style="background-color: #10b981; cursor: default;">Trade Active!</button>`;
            } else if (myAccepted) {
                actionButton = `<button class="btn-primary" disabled style="background-color: #9ca3af; cursor: default;">Waiting for others...</button>`;
            } else {
                actionButton = `<button class="btn-primary" onclick="confirmTriTrade('${trade.gig_a_id}', '${trade.gig_b_id}', '${trade.gig_c_id}', this)">Confirm My Part</button>`;
            }

            card.innerHTML = `
                <div class="loop-header">
                    <span class="loop-badge">⚡ 3-Way Match</span>
                </div>
                <div class="loop-flow">
                    <div class="flow-step">
                        <div class="step-icon my-icon">You</div>
                        <div class="step-arrow">
                            <span class="arrow-label">Teaching <strong>${skillA}</strong></span> ➔
                        </div>
                        <div class="step-icon other-icon">${userB.initials}</div>
                    </div>
                    <div class="flow-connector">
                        <div class="connector-label">${userB.name} teaches <strong>${skillB}</strong> to ${userC.name}</div>
                    </div>
                    <div class="flow-step">
                        <div class="step-icon other-icon">${userC.initials}</div>
                        <div class="step-arrow">
                            <span class="arrow-label">Teaching <strong>${skillC}</strong></span> ➔
                        </div>
                        <div class="step-icon my-icon">You</div>
                    </div>
                </div>
                <div class="card-actions">
                    ${actionButton}
                    <button class="btn-secondary">Decline</button>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (error) {
        console.error("Error loading tri-trades:", error);
    }
}

loadGigs();
loadEngagements();
fetchAndRenderTriplets();