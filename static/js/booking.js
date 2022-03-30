

function checkLoginStatus() {
    fetch("/api/user").then((response) => {
        return response.json();
    }).then((dataJson) => {
        let data = dataJson.data;
        let btnSigninNSignup = document.querySelector("#btn-signin-n-signup");

        if (data === null) {
            window.location = '/';
        } else {
            btnSigninNSignup.textContent = "登出系統";
            showBookingInfo(data["name"], data["email"]);
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


function showBookingInfo(name, email) {
    fetch("/api/booking").then((response) => {
        return response.json();
    }).then((dataJson) => {
        let data = dataJson.data;
        let emptyState = document.querySelector("#empty-state");
        let section = document.querySelector("#section");
        let hrs = document.querySelectorAll("hr");
        let contactForm = document.querySelector("#contact-form")
        let payment = document.querySelector("#payment");
        let confirm = document.querySelector("#confirm");
        let footer = document.querySelector("#footer");
        let footerText = document.querySelector("#text");
        let headline = document.querySelector("#headline");
        headline.textContent = `您好，${name}，待預定的行程如下：`

        if (data === null) {
            html.style.height = "100%";
            body.style.height = "100%";
            emptyState.style.display = "flex";
            section.style.display = "none";
            for (let i=0; i<hrs.length; i++) {
                hrs[i].style.display = "none";
            }
            contactForm.style.display = "none";
            payment.style.display = "none";
            confirm.style.display = "none";
            footer.style.height = "100%";
            footer.style.alignItems = "flex-start";
            footerText.style.margin = "45px 0px 0px";
        } else {
            html.style.height = "auto";
            body.style.height = "auto";
            emptyState.style.display = "none";
            section.style.display = "flex";
            for (let i=0; i<hrs.length; i++) {
                hrs[i].style.display = "block";
            }
            contactForm.style.display = "flex";
            payment.style.display = "flex";
            confirm.style.display = "flex";
            footer.style.height = "104px";
            footer.style.alignItems = "center";
            footerText.style.margin = "0px";


            let picture = document.querySelector("#picture>img");
            picture.src = data["attraction"]["image"];

            let inforTitle = document.querySelector("#infor-title");
            inforTitle.textContent = `台北一日遊：${data["attraction"]["name"]}`;

            let inforDate = document.querySelector("#infor-date");
            inforDate.innerHTML = `<span>日期：</span>${data["date"]}`;
            let inforTime = document.querySelector("#infor-time");
            let time = (data["time"] === "morning")? "早上 9:00 至中午 12:00": "下午 2:00 至傍晚 5:00";
            inforTime.innerHTML = `<span>時間：</span>${time}`;
            let inforCost = document.querySelector("#infor-cost");
            inforCost.innerHTML = `<span>費用：</span>新台幣 ${data["price"]} 元`;
            let inforLocation = document.querySelector("#infor-location");
            inforLocation.innerHTML = `<span>地點：</span>${data["attraction"]["address"]}`;

            let contactNameBox = document.querySelector("#contact-name>input");
            contactNameBox.value = name;
            let contactEmailBox = document.querySelector("#contact-email>input");
            contactEmailBox.value = email;

            let confirmTotal = document.querySelector("#confirm-total");
            confirmTotal.textContent = `總價：新台幣 ${data["price"]} 元`;
        }
    });
}


function deleteSchedule() {
    fetch("/api/booking", {
        method: "DELETE",
    }).then((response) => {
        return response.json();
    }).then((dataJson) => {
        if (dataJson.ok)
            window.location.reload();
    });
}


let html = document.querySelector("html");
let body = document.querySelector("body");

window.onload = function() {
    checkLoginStatus();
}

let btnBooking = document.querySelector("#btn-booking");
btnBooking.addEventListener("click", function() {
    window.location = "/booking";
});

let btnSigninNSignup = document.querySelector("#btn-signin-n-signup");
btnSigninNSignup.addEventListener("click", logOut);

let delScheduleBtn = document.querySelector("#icon-delete");
delScheduleBtn.addEventListener("click", deleteSchedule);