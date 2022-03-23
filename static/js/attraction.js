
function checkDayTime() {
    let cost = document.querySelector("#cost");

    if (document.querySelector("#morning").checked) {
        cost.textContent = "新台幣 2000 元";
    } else {
        cost.textContent = "新台幣 2500 元";
    }
}


function queryAttraction(urlId) {
    let url = `/api/attraction/${urlId}`;

    fetch(url).then((response) => {
        return response.json();
    }).then((dataJson) => {
        let data = dataJson.data;

        let name = document.querySelector("#name");
        let categoryAtMRT = document.querySelector("#category-at-mrt");
        let description = document.querySelector("#description");
        let address = document.querySelector("#address-content");
        let transport = document.querySelector("#transport-content");
        let currentImg = document.querySelector("#img>img");

        name.textContent = data.name;
        categoryAtMRT.textContent = `${data.category} at ${data.mrt}`;
        description.textContent = data.description;
        address.textContent = data.address;
        transport.textContent = data.transport;

        images = data.images;
        imageLength = images.length;
        currentImg.src = images[0];

        let circleBox = document.querySelector("#circle-box");
        circleBox.innerHTML = '';
        for (let i=0; i<imageLength; i++) {
            let circle = document.createElement("div");
            circle.id = `circle-${i}`;
            circle.className = "circle";
            if (i == 0) {
                circle.style.background = "#000000";
            }
            circleBox.appendChild(circle);
        }
    });
}


function changeImage() {
    let previousCircle = document.querySelector(`#circle-${previousImgNumber}`);
    let currentCircle = document.querySelector(`#circle-${currentImgNumber}`);
    let currentImg = document.querySelector("#img>img");

    previousCircle.style.background = "#FFFFFF";
    currentCircle.style.background = "#000000";
    currentImg.src = images[currentImgNumber];
}


function changeImageLeft() {
    previousImgNumber = currentImgNumber;
    currentImgNumber -= 1;
    if (currentImgNumber < 0) 
        currentImgNumber += imageLength;
    changeImage();
}


function changeImageRight() {
    previousImgNumber = currentImgNumber;
    currentImgNumber += 1;
    if (currentImgNumber === imageLength) 
        currentImgNumber -= imageLength;
    changeImage();
}


let images = null;
let imageLength = 0;
let previousImgNumber = 0;
let currentImgNumber = 0;
let href = window.location.href.split('/');
let urlId = href.pop();

let dialogSection = document.querySelector("#dialog-section");
let dialogSignup = document.querySelector("#dialog-signup");
let dialogSignin = document.querySelector("#dialog-signin");

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

queryAttraction(urlId);
