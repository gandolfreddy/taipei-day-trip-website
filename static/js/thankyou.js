

function checkLoginStatus() {
    fetch("/api/user").then((response) => {
        return response.json();
    }).then((dataJson) => {
        let data = dataJson.data;
        let btnSigninNSignup = document.querySelector("#btn-signin-n-signup");

        if (data === null) {
            window.location = '/';
        } else {
            user_name = data["name"];
            btnSigninNSignup.textContent = "登出系統";
            let order_number = window.location.href.split('=').pop();
            showBookingInfo(order_number);
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


function showBookingInfo(order_number) {
    fetch(`/api/order/${order_number}`).then((response) => {
        return response.json();
    }).then((dataJson) => {
        let data = dataJson.data;
        pageInfo = dataJson.data;
        let emptyState = document.querySelector("#empty-state");
        let section = document.querySelector("#section");
        let hrs = document.querySelectorAll("hr");
        let contactForm = document.querySelector("#contact-form");
        let footer = document.querySelector("#footer");
        let footerText = document.querySelector("#text");

        let headline = document.querySelector("#headline");
        headline.textContent = `您好，${user_name}，行程資訊如下：` 
        
        if (data === null) {
            html.style.height = "100%";
            body.style.height = "100%";
            emptyState.style.display = "flex";
            section.style.display = "none";
            for (let i=0; i<hrs.length; i++) {
                hrs[i].style.display = "none";
            }
            contactForm.style.display = "none";
            footer.style.height = "100%";
            footer.style.alignItems = "flex-start";
            footerText.style.margin = "45px 0px 0px";

            emptyState.textContent = `查無訂單編號 ${order_number} 的行程。`;
        } else {
            html.style.height = "auto";
            body.style.height = "auto";
            emptyState.style.display = "none";
            section.style.display = "flex";
            for (let i=0; i<hrs.length; i++) {
                hrs[i].style.display = "block";
            }
            contactForm.style.display = "flex";
            footer.style.height = "104px";
            footer.style.alignItems = "center";
            footerText.style.margin = "0px";

            headline.textContent = `您好，${user_name}，行程資訊如下，祝您旅途愉快：`
            let picture = document.querySelector("#picture>img");
            console.log(data);
            picture.src = data["trip"]["attraction"]["image"];

            let inforTitle = document.querySelector("#infor-title");
            inforTitle.textContent = `台北一日遊：${data["trip"]["attraction"]["name"]}`;

            let inforOrderNumber = document.querySelector("#infor-orderNumber");
            inforOrderNumber.innerHTML = `<span>訂單編號：</span>${order_number}`;
            let inforDate = document.querySelector("#infor-date");
            inforDate.innerHTML = `<span>日期：</span>${data["trip"]["date"]}`;
            let inforTime = document.querySelector("#infor-time");
            let time = (data["trip"]["time"] === "morning")? "早上 9:00 至中午 12:00": "下午 2:00 至傍晚 5:00";
            inforTime.innerHTML = `<span>時間：</span>${time}`;
            let inforCost = document.querySelector("#infor-cost");
            inforCost.innerHTML = `<span>費用：</span>新台幣 ${data["price"]} 元`;
            let inforLocation = document.querySelector("#infor-location");
            inforLocation.innerHTML = `<span>地點：</span>${data["trip"]["attraction"]["address"]}`;

            let contactName = document.querySelector("#contact-name");
            contactName.innerHTML = `<span>聯絡姓名：</span><div>${data["contact"]["name"]}</div>`;
            let contactEmail = document.querySelector("#contact-email");
            contactEmail.innerHTML = `<span>連絡信箱：</span><div>${data["contact"]["email"]}</div>`;
            let contactPhone = document.querySelector("#contact-phone");
            contactPhone.innerHTML = `<span>手機號碼：</span><div>${data["contact"]["phone"]}</div>`;
        }
    });
}


let html = document.querySelector("html");
let body = document.querySelector("body");
let user_name = null;

window.onload = function() {
    checkLoginStatus();
}

let btnBooking = document.querySelector("#btn-booking");
btnBooking.addEventListener("click", function() {
    window.location = "/booking";
});

let btnSigninNSignup = document.querySelector("#btn-signin-n-signup");
btnSigninNSignup.addEventListener("click", logOut);