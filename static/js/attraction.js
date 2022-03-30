
function checkDayTime() {
    let cost = document.querySelector("#cost");

    if (document.querySelector("#morning").checked) {
        cost.textContent = "新台幣 2000 元";
        time = "morning";
    } else {
        cost.textContent = "新台幣 2500 元";
        time = "afternoon";
    }

    return time;
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


function book(urlId) {
    let date = document.querySelector("#booking-date>input").value;
    let time = checkDayTime();
    let price = document.querySelector("#cost").textContent.replace(/\D/g, "");;

    let data = {
        "attractionId": urlId,
        "date": date,
        "time": time,
        "price": price
    };
    
    fetch("/api/booking", {
        method: "POST",
        headers: new Headers({"Content-Type": "application/json"}),
        body: JSON.stringify(data)
    }).then((response) => {
        return response.json();
    }).then((dataJson) => {
        if (dataJson["ok"]) {
            window.location = "/booking";
        }
    });
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
let signupMsg = document.querySelector("#signup-msg");
let signinMsg = document.querySelector("#signin-msg");

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

let btnBooking = document.querySelector("#btn-booking");
btnBooking.addEventListener("click", function() {
    if (btnSigninNSignup.textContent === "登入/註冊") {
        dialogSection.style.display = "flex";
        dialogSignin.style.animationName = "signin-block";
        dialogSignin.style.animationDuration = "1s";
        dialogSignin.style.display = "block";
        dialogSignup.style.display = "none";
    } else {
        window.location = "/booking";
    }
});

let startBookingBtn = document.querySelector("#booking-button");
startBookingBtn.addEventListener("click", function() {
    if (btnSigninNSignup.textContent === "登入/註冊") {
        dialogSection.style.display = "flex";
        dialogSignin.style.animationName = "signin-block";
        dialogSignin.style.animationDuration = "1s";
        dialogSignin.style.display = "block";
        dialogSignup.style.display = "none";
    } else {
        book(urlId);
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

checkLoginStatus()
queryAttraction(urlId);
