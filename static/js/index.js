

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


let page = 0;
let isLoadingPage = false;
let keywordInput = document.querySelector("#keyword");
let noResult = document.querySelector("#no-result");
let html = document.querySelector("html");
let body = document.querySelector("body");
let attractionsGroup = document.querySelector("#attractions-group");
let dialogSection = document.querySelector("#dialog-section");
let dialogSignup = document.querySelector("#dialog-signup");
let dialogSignin = document.querySelector("#dialog-signin");

window.onload = function() {
    window.scrollTo(0, 0);
    queryAttractions(page, keywordInput.value);
}

keywordInput.addEventListener("keyup", function (event) {
    if (event.key === "Enter")
        document.querySelector("#search-btn").onclick();
});

let signinClose = document.querySelector("#signin-close");
signinClose.addEventListener("click", function() {
    dialogSection.style.display = "none";
});

let signupClose = document.querySelector("#signup-close");
signupClose.addEventListener("click", function() {
    dialogSection.style.display = "none";
});

let btnSigninNSignup = document.querySelector("#btn-signin-n-signup");
btnSigninNSignup.addEventListener("click", function() {
    dialogSection.style.display = "flex";
    dialogSignin.style.animationName = "signin-block";
    dialogSignin.style.animationDuration = "1s";
    dialogSignin.style.display = "block";
    dialogSignup.style.display = "none";
    
});

let changeToSignupText = document.querySelector("#change-to-signup-text");
changeToSignupText.addEventListener("click", function() {
    dialogSignin.style.display = "none";
    dialogSignup.style.display = "block";
});

let changeToSigninText = document.querySelector("#change-to-signin-text");
changeToSigninText.addEventListener("click", function() {
    dialogSignin.style.animationName = "none";
    dialogSignin.style.display = "block";
    dialogSignup.style.display = "none";
});
