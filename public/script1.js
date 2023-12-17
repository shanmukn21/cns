var searchbtn = document.getElementById('searchbtn');
var sortNameChange = document.getElementById('sort');
selected.classList.toggle('d-none');
var itemsContainer = document.getElementById('container');
var loading = document.getElementById('loading');
function startLoading() {
    loading.style.display = 'flex';
}
searchbtn.onclick = function () {
    loading.style.display = 'flex';
}
let productNames = itemsContainer.getElementsByClassName('productName');
let itemImages = itemsContainer.getElementsByClassName('item-img');
let anchorElements = itemsContainer.getElementsByClassName('anchor');
let companyNames = itemsContainer.getElementsByClassName('companyName');
let itemDiscriptions = itemsContainer.getElementsByClassName('description');
let prices = itemsContainer.getElementsByClassName('price');
let itemLogos = itemsContainer.getElementsByClassName('item-logo');

let fetchedData = [];
for (let i = 0; i < prices.length; i++) {
    fetchedData.push({
        name: productNames[i].textContent,
        img: itemImages[i].src,
        descr: itemDiscriptions[i].innerHTML,
        price: prices[i].innerText,
        logo: itemLogos[i].src,
        cName: companyNames[i].innerHTML,
        anchor: anchorElements[i].href
    });
};


function floatReturn(a) {
    let price = (a.price.split('₹')[1].split(','));
    return (parseFloat(price.join('')));

}
floatReturn(fetchedData[0]);
function lowToHigh() {
    fetchedData.sort((a, b) => {
        const aPrice = floatReturn(a);
        const bPrice = floatReturn(b);
        if (aPrice < bPrice) {
            return -1;
        } else if (aPrice > bPrice) {
            return 1;
        } else {
            return 0;
        }
    });
}
function highToLow() {
    fetchedData.sort((a, b) => {
        const aPrice = floatReturn(a);
        const bPrice = floatReturn(b);
        if (aPrice > bPrice) {
            return -1;
        } else if (aPrice < bPrice) {
            return 1;
        } else {
            return 0;
        }
    });
}
function assignChanges() {
    for (let i = 0; i < prices.length; i++) {
        productNames[i].innerHTML = fetchedData[i].name;
        itemImages[i].src = fetchedData[i].img;
        itemDiscriptions[i].innerHTML = fetchedData[i].descr;
        prices[i].innerHTML = fetchedData[i].price;
        itemLogos[i].src = fetchedData[i].logo;
        companyNames[i].innerHTML = fetchedData[i].cName;
        anchorElements[i].href = fetchedData[i].anchor;

    }
}
sortNameChange.addEventListener('change', () => {
    itemsContainer.classList.add('d-none')
    loading.style.display = 'flex';
    if (sortNameChange.value == 'low-high') {
        lowToHigh();
        assignChanges();
        loading.style.display = 'none';
        itemsContainer.classList.remove('d-none');

    } else if (sortNameChange.value == 'high-low') {
        highToLow();
        assignChanges();
        loading.style.display = 'none';
        itemsContainer.classList.remove('d-none');
    }

});

let historyDiv = document.getElementById('historyData');
let historyItems = historyDiv.getElementsByClassName('historyItem');
let searchItem = document.getElementById('search');
valueAssaignEach();
function addOnclickEvent(a) {
    a.onclick = function () {
        searchItem.value = a.textContent;
    }
}
function valueAssaignEach() {
    for (let i = 0; i < historyItems.length; i++) {
        addOnclickEvent(historyItems[i]);
    }
}