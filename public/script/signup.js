const firstname = document.querySelector("#login-firstname");
const lastname = document.querySelector("#login-lastname");
const dob = document.querySelector("#login-dob");
const email = document.querySelector("#login-email");
const password = document.querySelector("#login-password");
const submit = document.querySelector("#login-submit");

const nameError = document.querySelector("#name-error");
const dobError = document.querySelector("#dob-error");
const emailError = document.querySelector("#email-error");
const passwordError = document.querySelector("#password-error");

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

function checkName() {
    let isFalse = true;
    if (firstname.value.trim() == "") {
        toggleError(firstname, nameError, true);
        isFalse = false
    }
    else {
        toggleError(firstname, nameError, false);
    }

    if (lastname.value.trim() == "") {
        toggleError(lastname, nameError, true);
        isFalse = false
    }
    else {
        toggleError(lastname, nameError, false);
    }

    if (isFalse) {
        toggleError(firstname, nameError, false);
        toggleError(lastname, nameError, false);
    }
    
    return isFalse;
}

function checkDob() {
    if (dob.value.trim() == "") {
        toggleError(dob, dobError, true);
        return false;
    }
    toggleError(dob, dobError, false);
    return true;
}

function checkFields() {
    if (
        checkEmail() == false |
        checkName() == false |
        checkDob() == false |
        checkPassword() == false 
    )
        return false;
    else
        return true;
}

async function createAccount(email, password, firstname, lastname, dob) {
    const person = {
        id: crypto.randomUUID(),
        email: email,
        password: password,
        firstname: firstname,
        lastname: lastname,
        dob: dob
    };

    const response = await fetch("/api/create-user", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ person })
    });

    console.log(response);
}

submit.addEventListener("click", async () => {
    if (checkFields()) {
        await createAccount(email.value.trim(), password.value.trim(), 
        firstname.value.trim(), lastname.value.trim(), dob.value.trim());
    }
});

checkCurrentUser();