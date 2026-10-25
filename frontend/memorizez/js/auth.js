const authCard = document.querySelector("#authCard");

const registerFace = document.querySelector(".auth-card__face--register");
const loginFace = document.querySelector(".auth-card__face--login");

const registerTitle = document.querySelector("#registerTitle");
const loginTitle = document.querySelector("#loginTitle");

const flipButtons = document.querySelectorAll("[data-auth-flip]");

function showAuthFace(face) {
  const showLogin = face === "login";

  authCard.classList.toggle("is-login", showLogin);

  registerFace.setAttribute("aria-hidden", String(showLogin));
  loginFace.setAttribute("aria-hidden", String(!showLogin));

  registerFace.inert = showLogin;
  loginFace.inert = !showLogin;

  const activeTitle = showLogin ? loginTitle : registerTitle;
  activeTitle.focus();
}

flipButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showAuthFace(button.dataset.authFlip);
  });
});
