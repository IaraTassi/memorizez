const authCard = document.querySelector("#authCard");

const registerFace = document.querySelector(".auth-card__face--register");
const loginFace = document.querySelector(".auth-card__face--login");

const registerTitle = document.querySelector("#registerTitle");
const loginTitle = document.querySelector("#loginTitle");

const flipButtons = document.querySelectorAll("[data-auth-flip]");

const registerForm = document.querySelector("#registerForm");
const loginForm = document.querySelector("#loginForm");

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

function showFieldError(input, message) {
  const errorElement = document.querySelector(`#${input.id}Error`);

  input.setAttribute("aria-invalid", "true");
  errorElement.textContent = message;
  errorElement.hidden = false;
}

function clearFieldError(input) {
  const errorElement = document.querySelector(`#${input.id}Error`);

  input.removeAttribute("aria-invalid");
  errorElement.textContent = "";
  errorElement.hidden = true;
}

function showFormError(form, message) {
  const errorElement = form.querySelector('[role="alert"]');

  errorElement.classList.remove("auth-error--success");
  errorElement.textContent = message;
  errorElement.hidden = false;
}

function clearFormError(form) {
  const errorElement = form.querySelector('[role="alert"]');

  errorElement.classList.remove("auth-error--success");
  errorElement.textContent = "";
  errorElement.hidden = true;
}

function showFormSuccess(form, message) {
  const errorElement = form.querySelector('[role="alert"]');

  errorElement.textContent = message;
  errorElement.classList.add("auth-error--success");
  errorElement.hidden = false;
}

function validateRequired(input, message) {
  if (!input.value.trim()) {
    showFieldError(input, message);
    return false;
  }

  clearFieldError(input);
  return true;
}

function validateEmail(input) {
  if (!validateRequired(input, "Informe seu e-mail.")) {
    return false;
  }

  if (input.value.trim().length < 8) {
    showFieldError(input, "O e-mail deve ter pelo menos 8 caracteres.");
    return false;
  }

  if (!input.validity.valid) {
    showFieldError(input, "Informe um endereço de e-mail válido.");
    return false;
  }

  clearFieldError(input);
  return true;
}

function focusFirstInvalid(form) {
  const firstInvalid = form.querySelector('[aria-invalid="true"]');

  if (firstInvalid) {
    firstInvalid.focus();
  }
}

function clearErrorWhileTyping(input) {
  input.addEventListener("input", () => {
    if (input.getAttribute("aria-invalid") === "true") {
      clearFieldError(input);
    }
  });
}

const fields = document.querySelectorAll(
  "#registerForm input, #loginForm input",
);

fields.forEach(clearErrorWhileTyping);

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  clearFormError(registerForm);

  const name = document.querySelector("#registerName");
  const email = document.querySelector("#registerEmail");
  const password = document.querySelector("#registerPassword");
  const confirmPassword = document.querySelector("#confirmPassword");

  const nameValid = validateRequired(name, "Informe seu nome.");

  const emailValid = validateEmail(email);

  let passwordValid = validateRequired(password, "Informe sua senha.");

  let confirmPasswordValid = validateRequired(
    confirmPassword,
    "Confirme sua senha.",
  );

  if (passwordValid && password.value.length < 6) {
    showFieldError(password, "A senha deve ter pelo menos 6 caracteres.");
    passwordValid = false;
  }

  if (confirmPasswordValid && password.value !== confirmPassword.value) {
    showFieldError(confirmPassword, "As senhas não coincidem.");
    confirmPasswordValid = false;
  } else if (confirmPasswordValid) {
    clearFieldError(confirmPassword);
  }

  if (nameValid && emailValid && passwordValid && confirmPasswordValid) {
    const submitButton = registerForm.querySelector('button[type="submit"]');

    submitButton.disabled = true;

    try {
      await apiRequest("/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.value.trim(),
          email: email.value.trim(),
          password: password.value,
          confirmPassword: confirmPassword.value,
        }),
      });

      showFormSuccess(registerForm, "Conta criada com sucesso!");
      registerForm.reset();

      setTimeout(() => {
        clearFormError(registerForm);
        showAuthFace("login");
      }, 1500);
    } catch (error) {
      if (error.status === 400 || error.status === 409) {
        showFormError(
          registerForm,
          "Não foi possível criar a conta. Verifique os dados ou tente outro e-mail.",
        );
      } else {
        showFormError(
          registerForm,
          "Não foi possível criar sua conta agora. Tente novamente.",
        );
      }
    } finally {
      submitButton.disabled = false;
    }

    return;
  }

  focusFirstInvalid(registerForm);
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  clearFormError(loginForm);

  const email = document.querySelector("#loginEmail");
  const password = document.querySelector("#loginPassword");

  const emailValid = validateRequired(email, "Informe seu e-mail.");

  const passwordValid = validateRequired(password, "Informe sua senha.");

  if (!emailValid || !passwordValid) {
    focusFirstInvalid(loginForm);
    return;
  }

  const submitButton = loginForm.querySelector('button[type="submit"]');

  submitButton.disabled = true;

  try {
    await apiRequest("/users/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.value.trim(),
        password: password.value,
      }),
    });

    showFormSuccess(loginForm, "Login realizado com sucesso!");
  } catch (error) {
    if (error.status === 401 || error.status === 400) {
      showFormError(loginForm, "E-mail ou senha inválidos.");
    } else {
      showFormError(
        loginForm,
        "Não foi possível entrar agora. Tente novamente.",
      );
    }
  } finally {
    submitButton.disabled = false;
  }
});
