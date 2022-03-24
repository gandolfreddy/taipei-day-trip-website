

function queryAttractions(page, keyword) {
    noResult.style.display = "none";
    html.style.height = "auto";
    body.style.height = "auto";

    let url = `/api/attractions?page=${page}&keyword=${keyword}`;

    fetch(url).then((response) => {
        return response.json();
    }).then((dataJson) => {
        let data = dataJson.data;
        let nextPage = dataJson.nextPage;

        if (!data.length) {
            attractionsGroup.style.display = "none";
            noResult.style.display = "block";
            html.style.height = "100%";
            body.style.height = "100%";
            return null;
        }
        
        attractionsGroup.style.display = "flex";
        for (let item of data) {
            attractionsGroup.innerHTML += `
            <a href="/attraction/${item.id}" class="item">
                <img src=${item.images[0]}>
                <div id="name">${item.name}</div>
                <div id="info">
                    <div id="mrt">${item.mrt}</div>
                    <div id="category">${item.category}</div>
                </div>
            </a>
            `;
        }
        return nextPage;
    }).then((nextPage) => {
        window.onscroll = function() {
            let footer = document.querySelector("#footer");
            if (window.scrollY+window.innerHeight>footer.offsetTop && nextPage) {
                if (!isLoadingPage) {
                    isLoadingPage = true;
                    queryAttractions(nextPage, keyword);
                }
            } else {
                isLoadingPage = false;
            }
        }
    });
}


function searchKeyword() {
    attractionsGroup.innerHTML = '';
    keyword = keywordInput.value;

    window.scrollTo(0, 0);
    queryAttractions(page, keyword);
}

/* new on week-4 */
function checkLoginStatus() {
    fetch("/api/user").then((response) => {
        return response.json();
    }).then((dataJson) => {
        let data = dataJson.data;
        
        let btnSigninNSignup = document.querySelector("#btn-signin-n-signup");
        if (data == null) {
            btnSigninNSignup.textContent = "登入/註冊";
        } else {
            btnSigninNSignup.textContent = "登出系統";
        }
    });
}


function signUp() {
    let name = document.querySelector("#signup-name").value;
    let email = document.querySelector("#signup-email").value;
    let pswd = document.querySelector("#signup-pswd").value;

    let data = {
        "name": name,
        "email": email,
        "password": pswd
    };
    
    fetch("/api/user", {
        method: "POST",
        headers: new Headers({"Content-Type": "application/json"}),
        body: JSON.stringify(data)
    }).then((response) => {
        return response.json();
    }).then((dataJson) => {
        dialogSignup.style.height = "364px";
        signupMsg.style.display = "flex";
        if (dataJson["error"]) {
            signupMsg.textContent = dataJson["message"];
            signupMsg.style.color = "red";
        } else {
            signupMsg.textContent = "註冊成功！！";
            signupMsg.style.color = "green";
        }
    });
}


function signIn() {
    let email = document.querySelector("#signin-email").value;
    let pswd = document.querySelector("#signin-pswd").value;

    let data = {
        "email": email,
        "password": pswd
    };
    
    fetch("/api/user", {
        method: "PATCH",
        headers: new Headers({"Content-Type": "application/json"}),
        body: JSON.stringify(data)
    }).then((response) => {
        return response.json();
    }).then((dataJson) => {
        dialogSignin.style.height = "307px";
        signinMsg.style.display = "flex";
        if (dataJson["error"]) {
            signinMsg.textContent = dataJson["message"];
            signinMsg.style.color = "red";
        } else {
            window.location.reload();
        }
    });
}


function logOut() {
    fetch("/api/user", {
        method: "DELETE",
    }).then((response) => {
        return response.json();
    }).then((dataJson) => {
        if (dataJson.ok)
            window.location.reload();
    });
}


let page = 0;
let isLoadingPage = false;
let keywordInput = document.querySelector("#keyword");
let noResult = document.querySelector("#no-result");
let html = document.querySelector("html");
let body = document.querySelector("body");
let attractionsGroup = document.querySelector("#attractions-group");
/* new on week-4 */
let dialogSection = document.querySelector("#dialog-section");
let dialogSignup = document.querySelector("#dialog-signup");
let dialogSignin = document.querySelector("#dialog-signin");
let signupMsg = document.querySelector("#signup-msg");
let signinMsg = document.querySelector("#signin-msg");

window.onload = function() {
    window.scrollTo(0, 0);
    checkLoginStatus();
    queryAttractions(page, keywordInput.value);
}

keywordInput.addEventListener("keyup", function (event) {
    if (event.key === "Enter")
        document.querySelector("#search-btn").onclick();
});

/* new on week-4 */
let signinClose = document.querySelector("#signin-close");
signinClose.addEventListener("click", function() {
    dialogSection.style.display = "none";
    dialogSignin.style.height = "275px";
    signinMsg.style.display = "none";
});

let signupClose = document.querySelector("#signup-close");
signupClose.addEventListener("click", function() {
    dialogSection.style.display = "none";
    dialogSignup.style.height = "332px";
    signupMsg.style.display = "none";
});

let btnSigninNSignup = document.querySelector("#btn-signin-n-signup");
btnSigninNSignup.addEventListener("click", function() {
    if (btnSigninNSignup.textContent === "登入/註冊") {
        dialogSection.style.display = "flex";
        dialogSignin.style.animationName = "signin-block";
        dialogSignin.style.animationDuration = "1s";
        dialogSignin.style.display = "block";
        dialogSignup.style.display = "none";
    } else {
        logOut();
    }
});

let changeToSignupText = document.querySelector("#change-to-signup-text");
changeToSignupText.addEventListener("click", function() {
    dialogSignin.style.display = "none";
    dialogSignup.style.display = "block";
    dialogSignup.style.height = "332px";
    signupMsg.style.display = "none";
});

let changeToSigninText = document.querySelector("#change-to-signin-text");
changeToSigninText.addEventListener("click", function() {
    dialogSignin.style.animationName = "none";
    dialogSignin.style.display = "block";
    dialogSignup.style.display = "none";
    dialogSignin.style.height = "275px";
    signinMsg.style.display = "none";
});

let signupButton = document.querySelector("#signup-button");
signupButton.addEventListener("click", signUp);

let signinButton = document.querySelector("#signin-button");
signinButton.addEventListener("click", signIn);