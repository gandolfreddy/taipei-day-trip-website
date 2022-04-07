

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
        pageInfo = dataJson.data;
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
            emptyState.textContent = "目前沒有任何待預訂的行程";
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


function TapPaySetUp() {
    TPDirect.setupSDK(124045, "app_mgHadYTdlgKQaUy27fVUwLtOQkcf3fLoe6ImpLz002r6vnOa6gbYPRy9FukO", "sandbox");
    TPDirect.card.setup({
        fields: {
            number: {
                element: ".form-control.card-number",
                placeholder: "**** **** **** ****"
            },
            expirationDate: {
                element: ".form-control.expiration-date",
                placeholder: "MM / YY"
            },
            ccv: {
                element: ".form-control.cvc",
                placeholder: "CCV"
            }
        },
        styles: {
            'input': {
                'color': 'gray'
            },
            'input.ccv': {
                // 'font-size': '16px'
            },
            ':focus': {
                'color': 'black'
            },
            '.valid': {
                'color': 'green'
            },
            '.invalid': {
                'color': 'red'
            },
            '@media screen and (max-width: 400px)': {
                'input': {
                    'color': 'orange'
                }
            }
        }
    })
}


function TapPayUpdate() {
    TPDirect.card.onUpdate(function (update) {
        if (update.status.number === 2) {
            setNumberFormGroupToError("#payment-credit-card");
        } else if (update.status.number === 0) {
            setNumberFormGroupToSuccess("#payment-credit-card");
        } else {
            setNumberFormGroupToNormal("#payment-credit-card");
        }

        if (update.status.expiry === 2) {
            setNumberFormGroupToError("#payment-due");
        } else if (update.status.expiry === 0) {
            setNumberFormGroupToSuccess("#payment-due");
        } else {
            setNumberFormGroupToNormal("#payment-due");
        }

        if (update.status.cvc === 2) {
            setNumberFormGroupToError("#payment-verify");
        } else if (update.status.cvc === 0) {
            setNumberFormGroupToSuccess("#payment-verify");
        } else {
            setNumberFormGroupToNormal("#payment-verify");
        }
    })
}


function TapPayGetPrime() {
    TPDirect.card.getPrime((result) => {
        if (result.status === 0) {
            let data = {
                "prime": `${result.card.prime}`,
                "order": {
                    "price": pageInfo["price"], 
                    "trip": {
                        "attraction": {
                            "id": pageInfo["attraction"]["id"],
                            "name": pageInfo["attraction"]["name"], 
                            "address": pageInfo["attraction"]["address"], 
                            "image": pageInfo["attraction"]["image"] 
                        },
                        "date": pageInfo["date"],
                        "time": pageInfo["time"]
                    },
                    "contact": {
                        "name": document.querySelector("#contact-name>input").value,
                        "email": document.querySelector("#contact-email>input").value,
                        "phone": document.querySelector("#contact-phone>input").value
                    }
                }
            };

            fetch("/api/orders", {
                method: "POST",
                headers: new Headers({"Content-Type": "application/json"}),
                body: JSON.stringify(data)
            }).then((response) => {
                return response.json();
            }).then((dataJson) => {
                if (dataJson.error) {
                    showAlert("訂單建立失敗", dataJson.message);
                } else {
                    console.log(dataJson);
                    res = dataJson.data;
                    if (res["payment"]["status"] === 0) {
                        window.location.href = `/thankyou?number=${res["number"]}`;
                    } else {
                        showAlert("訂單付款失敗", "付款失敗，請更換信用卡後重新嘗試");
                    }
                }
            });
        } else {
            showAlert("訂單建立失敗", "信用卡資訊有誤，請重新嘗試");
        }
    });
}


function setNumberFormGroupToError(selector) {
    document.querySelector(selector).classList.add("has-error");
    document.querySelector(selector).classList.remove("has-success");
}


function setNumberFormGroupToSuccess(selector) {
    document.querySelector(selector).classList.remove("has-error");
    document.querySelector(selector).classList.add("has-success");
}


function setNumberFormGroupToNormal(selector) {
    document.querySelector(selector).classList.remove("has-error");
    document.querySelector(selector).classList.remove("has-success");
}


function showAlert(type, msg) {
    dialogSection.style.display = "flex";
    dialogError.style.animationName = "error-block";
    dialogError.style.animationDuration = "0.5s";
    dialogError.style.display = "block";
    errorMsg.style.display = "flex";
    dialogTitle.textContent = type;
    errorMsg.textContent = msg;
}


let html = document.querySelector("html");
let body = document.querySelector("body");
let pageInfo = null;

let dialogSection = document.querySelector("#dialog-section");
let dialogError = document.querySelector("#dialog-error");
let dialogTitle = document.querySelector(".dialog-title");
let errorMsg = document.querySelector("#error-msg");

window.onload = function() {
    checkLoginStatus();
    TapPaySetUp();
    TapPayUpdate();
}

let btnBooking = document.querySelector("#btn-booking");
btnBooking.addEventListener("click", function() {
    window.location = "/booking";
});

let btnSigninNSignup = document.querySelector("#btn-signin-n-signup");
btnSigninNSignup.addEventListener("click", logOut);

let delScheduleBtn = document.querySelector("#icon-delete");
delScheduleBtn.addEventListener("click", deleteSchedule);

let confirmBtn = document.querySelector("#confirm-btn");
confirmBtn.addEventListener("click", TapPayGetPrime);

let ErrorClose = document.querySelector("#error-close");
ErrorClose.addEventListener("click", function() {
    dialogSection.style.display = "none";
    errorMsg.style.display = "none";
});