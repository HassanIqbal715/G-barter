const email = document.querySelector("#login-email");
const password = document.querySelector("#login-password");
const emailError = document.querySelector("#email-error");
const passwordError = document.querySelector("#password-error");
const submit = document.querySelector("#login-submit");

function toggleError(inputElement, msgElement, show) {
    if (show) {
        inputElement.classList.add("invalid"); // Adds red border
        msgElement.classList.add("show");      // Shows text
    } else {
        inputElement.classList.remove("invalid");
        msgElement.classList.remove("show");
    }
}

function checkEmail() {
    const val = email.value.trim();

    if (val === "") {
        toggleError(email, emailError, true);
        return false;
    }

    const atIndex = val.indexOf("@");
    if (atIndex === -1) {
        toggleError(email, emailError, true);
        return false;
    }

    if (!val.endsWith(".com")) {
        toggleError(email, emailError, true);
        return false;
    }

    const dotIndex = val.lastIndexOf(".com");

    if (dotIndex <= atIndex + 1) {
        toggleError(email, emailError, true);
        return false;
    }

    toggleError(email, emailError, false);
    return true;
}

function checkPassword() {
    const pass = password.value.trim();

    if (pass == "") {
        toggleError(password, passwordError, true);
        return false;
    }

    if (pass.length < 8) {
        toggleError(password, passwordError, true);
        return false;
    }
    
    toggleError(password, passwordError, false);
    return true; 
}

async function checkLogin(email, password) {
    const person = {
        email: email,
        password: password
    };

    const response = await fetch("/api/check-login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ person })
    });

    const result = await response.json();

    if (result.result) {
        console.log("Logged in!");
        window.location.href = "/dash";
    }
    else {
        console.log(result.message);
    }

    return result.result;
}

submit.addEventListener("click", async () => {
    if (checkEmail() | checkPassword()) {
        submit.disabled = true;
        submit.innerText = "Logging in...";
        
        try {
            if (! await checkLogin(email.value.trim(), password.value.trim())) {
                toggleError(email, emailError, true);
                toggleError(password, passwordError, true);
            }
        } catch (error) {
            console.error(error);
        } finally {
            submit.disabled = false;
            submit.innerText = "Login";
        }
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        submit.click();
    }
});