let container = document.getElementById("container");
let showMoreContainer = document.getElementById("showMoreContainer");
let clickd = document.getElementById("showmore");
clickd.addEventListener('click', function () {
    container.style.display = "none";
    showMoreContainer.classList.remove('d-none');
});