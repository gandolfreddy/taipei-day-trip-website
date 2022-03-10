

function queryAttractions(page, keyword) {
    noResult.style.display = "none";
    html.style.height = "auto";
    body.style.height = "auto";

    let url = `/api/attractions?page=${page}&keyword=${keyword}`;

    fetch(url).then((response) => {
        return response.json();
    }).then((dataJson) => {
        data = dataJson.data;
        nextPage = dataJson.nextPage;

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
            <div class="item">
                <img src=${item.images[0]}>
                <div id="name">${item.name}</div>
                <div id="info">
                    <div id="mrt">${item.mrt}</div>
                    <div id="category">${item.category}</div>
                </div>
            </div>
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

window.onload = function() {
    window.scrollTo(0, 0);
    queryAttractions(page, keywordInput.value);
}

keywordInput.addEventListener("keyup", function (event) {
    if (event.key === "Enter")
        document.querySelector("#search-btn").onclick();
});










