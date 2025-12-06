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

submit.addEventListener("click", async () => {
    if (!checkInputs())
        return; 

    console.log(await insertGig());
});

// Load gigs
const grid = document.querySelector("#gigs-grid");

function createGig(id, want, prov, desc, firstname, lastname, colorNum, 
    user_id) {
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
    actionButton.textContent = "Connect";

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
    footer.appendChild(actionButton);
    body.appendChild(footer);
    card.appendChild(body);
    grid.appendChild(card);
}

async function createGigs() {
    let colorNum = 0;
    const totalColors = 10;
    const response = await fetch("/api/advert");
    const gigsData = await response.json();

    if (gigsData.result == false)
        return;

    for (let x of gigsData.data) {
        createGig(x.id, x.skill_wanted, x.skill_provided, x.description, 
            x.firstname, x.lastname, (colorNum++ % totalColors), x.user_id);
    }
}

createGigs();