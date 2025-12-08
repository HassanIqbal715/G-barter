const headerButtons = document.querySelector("#header-buttons");
const headerProfile = document.querySelector("#header-profile");
const headerProfileText = document.querySelector("#header-profile-text");
const headerLogout = document.querySelector("#logout-btn");
const loader = document.querySelector("#loader");

async function getCurrentUser() {
    try {
        const response = await fetch("/api/current-user");
        const data = await response.json();

        if (data.result) {
            const user = data.data;

            let username = user.firstname + " " + user.lastname;

            headerProfileText.textContent = username;
            headerButtons.style.display = "none";
            headerProfile.style.display = "flex";
        }
    } catch (error) {
        console.error("Error fetching current user:", error);
    } finally {
        loader.style.display = "none";
        document.body.style.overflow = "auto";
    }
}

await getCurrentUser();

headerLogout.addEventListener("click", async (e) => {
    e.preventDefault();
    const response = await fetch("/logout");
    const data = await response.json();

    if (data.result == false) {
        console.error(data.error);
    }
    else if (data.result == true) {
        window.location.href = "/";
    }
});