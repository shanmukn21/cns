const container = document.getElementById('container');
const registerBtn = document.getElementById('register');
const forgotBtn = document.getElementById('forgotten');
const loginBtn = document.getElementById('login');

registerBtn.addEventListener('click', () => {
    container.classList.add("active");
});
forgotBtn.addEventListener('click', () => {
    container.classList.add("active");
});

loginBtn.addEventListener('click', () => {
    container.classList.remove("active");
}); 