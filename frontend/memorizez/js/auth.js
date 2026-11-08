const authCard = document.querySelector("#authCard");

const registerFace = document.querySelector(".auth-card__face--register");
const loginFace = document.querySelector(".auth-card__face--login");

const registerTitle = document.querySelector("#registerTitle");
const loginTitle = document.querySelector("#loginTitle");

const flipButtons = document.querySelectorAll("[data-auth-flip]");

const registerForm = document.querySelector("#registerForm");
const loginForm = document.querySelector("#loginForm");

let isRegistering = false;
let isLoggingIn = false;
let isTransitioningAfterRegister = false;

function clearStoredProfileName() {
  try {
    sessionStorage.removeItem("memorizez.profileName");
  } catch (error) {
    console.warn(
      "[MEMORIZEZ] Não foi possível limpar o nome do perfil.",
      error,
    );
  }
}

function showAuthFace(face, shouldFocus = true) {
  const showLogin = face === "login";

  if (!authCard || !registerFace || !loginFace) {
    return;
  }

  authCard.classList.toggle("is-login", showLogin);

  registerFace.setAttribute("aria-hidden", String(showLogin));
  loginFace.setAttribute("aria-hidden", String(!showLogin));

  registerFace.inert = showLogin;
  loginFace.inert = !showLogin;

  if (shouldFocus) {
    const activeTitle = showLogin ? loginTitle : registerTitle;
    activeTitle?.focus();
  }
}

const params = new URLSearchParams(window.location.search);
const initialMode = params.get("mode");

if (initialMode === "login" || initialMode === "register") {
  showAuthFace(initialMode);
}

flipButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (isRegistering || isLoggingIn || isTransitioningAfterRegister) {
      return;
    }

    const destination = button.dataset.authFlip;

    if (destination === "login" || destination === "register") {
      showAuthFace(destination);
    }
  });
});

function showFieldError(input, message) {
  if (!input) {
    return;
  }

  const errorElement = document.querySelector(`#${input.id}Error`);

  if (!errorElement) {
    return;
  }

  input.setAttribute("aria-invalid", "true");
  errorElement.textContent = message;
  errorElement.hidden = false;
}

function clearFieldError(input) {
  if (!input) {
    return;
  }

  const errorElement = document.querySelector(`#${input.id}Error`);

  input.removeAttribute("aria-invalid");

  if (errorElement) {
    errorElement.textContent = "";
    errorElement.hidden = true;
  }
}

function showFormError(form, message) {
  if (!form) {
    return;
  }

  const errorElement = form.querySelector('[role="alert"]');

  if (!errorElement) {
    return;
  }

  errorElement.classList.remove("auth-error--success");
  errorElement.textContent = message;
  errorElement.hidden = false;
}

function clearFormError(form) {
  if (!form) {
    return;
  }

  const errorElement = form.querySelector('[role="alert"]');

  if (!errorElement) {
    return;
  }

  errorElement.classList.remove("auth-error--success");
  errorElement.textContent = "";
  errorElement.hidden = true;
}

function showFormSuccess(form, message) {
  if (!form) {
    return;
  }

  const errorElement = form.querySelector('[role="alert"]');

  if (!errorElement) {
    return;
  }

  errorElement.textContent = message;
  errorElement.classList.add("auth-error--success");
  errorElement.hidden = false;
}

function focusFirstInvalid(form) {
  form?.querySelector('[aria-invalid="true"]')?.focus();
}

function validateRequired(input, message) {
  if (!input) {
    return false;
  }

  if (!input.value.trim()) {
    showFieldError(input, message);
    return false;
  }

  clearFieldError(input);
  return true;
}

function validateName(input) {
  if (!validateRequired(input, "Informe seu nome.")) {
    return false;
  }

  if (input.value.trim().length > 100) {
    showFieldError(input, "O nome deve ter no máximo 100 caracteres.");
    return false;
  }

  clearFieldError(input);
  return true;
}

function validateEmail(input) {
  if (!validateRequired(input, "Informe seu e-mail.")) {
    return false;
  }

  if (!input.validity.valid) {
    showFieldError(input, "Informe um endereço de e-mail válido.");
    return false;
  }

  clearFieldError(input);
  return true;
}

function validatePassword(input) {
  if (!validateRequired(input, "Informe sua senha.")) {
    return false;
  }

  if (input.value.length < 6) {
    showFieldError(input, "A senha deve ter pelo menos 6 caracteres.");
    return false;
  }

  clearFieldError(input);
  return true;
}

function validatePasswordConfirmation(password, confirmation) {
  if (!validateRequired(confirmation, "Confirme sua senha.")) {
    return false;
  }

  if (!password || password.value !== confirmation.value) {
    showFieldError(confirmation, "As senhas não coincidem.");
    return false;
  }

  clearFieldError(confirmation);
  return true;
}

const fields = document.querySelectorAll(
  "#registerForm input, #loginForm input",
);

fields.forEach((input) => {
  input.addEventListener("input", () => {
    if (input.getAttribute("aria-invalid") === "true") {
      clearFieldError(input);
    }
  });
});

function setSubmitting(form, submitting, loadingText) {
  if (!form) {
    return;
  }

  const button = form.querySelector('button[type="submit"]');

  if (!button) {
    return;
  }

  if (submitting) {
    if (button.dataset.originalHtml === undefined) {
      button.dataset.originalHtml = button.innerHTML;
      button.dataset.originalDisabled = String(button.disabled);
    }

    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.textContent = loadingText;
    return;
  }

  if (button.dataset.originalHtml !== undefined) {
    button.innerHTML = button.dataset.originalHtml;
  }

  button.disabled = button.dataset.originalDisabled === "true";
  button.removeAttribute("aria-busy");

  delete button.dataset.originalHtml;
  delete button.dataset.originalDisabled;
}

function getBackendMessage(error) {
  const message = error?.data?.userMessage;

  return typeof message === "string" && message.trim() ? message.trim() : null;
}

function getRequestInfrastructureErrorMessage(error, operation) {
  switch (error?.code) {
    case "CSRF_CONNECTION_ERROR":
      return "Não foi possível validar a segurança da solicitação. Verifique sua conexão e tente novamente.";

    case "INVALID_CSRF_TOKEN":
      return "Não foi possível validar a segurança da solicitação. Atualize a página e tente novamente.";

    case "CSRF_ERROR":
      return (
        getBackendMessage(error) ||
        "Não foi possível validar a segurança da solicitação. Atualize a página e tente novamente."
      );

    case "RESPONSE_READ_ERROR":
      return `Não foi possível confirmar o ${operation}. Atualize a página antes de tentar novamente.`;

    case "NETWORK_ERROR":
      return "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";

    default:
      return null;
  }
}

function getRegisterErrorMessage(error) {
  const infrastructureMessage = getRequestInfrastructureErrorMessage(
    error,
    "cadastro",
  );

  if (infrastructureMessage) {
    return infrastructureMessage;
  }

  const backendMessage = getBackendMessage(error);

  switch (error?.status) {
    case 400:
    case 422:
      return (
        backendMessage ||
        "Os dados enviados são inválidos. Verifique as informações e tente novamente."
      );

    case 409:
      return (
        backendMessage || "Já existe uma conta cadastrada com esses dados."
      );

    case 401:
      return "Não foi possível autenticar a solicitação. Atualize a página e tente novamente.";

    case 403:
      return (
        backendMessage ||
        "A solicitação não foi autorizada. Atualize a página e tente novamente."
      );

    case 429:
      return "Muitas tentativas foram realizadas. Aguarde um pouco e tente novamente.";

    case 500:
    case 502:
    case 503:
    case 504:
      return (
        backendMessage ||
        "O servidor está temporariamente indisponível. Tente novamente mais tarde."
      );

    default:
      return "Não foi possível criar sua conta agora. Tente novamente.";
  }
}

function getLoginErrorMessage(error) {
  const infrastructureMessage = getRequestInfrastructureErrorMessage(
    error,
    "login",
  );

  if (infrastructureMessage) {
    return infrastructureMessage;
  }

  const backendMessage = getBackendMessage(error);

  switch (error?.status) {
    case 400:
    case 401:
      return "E-mail ou senha inválidos.";

    case 403:
      return (
        backendMessage ||
        "A solicitação não foi autorizada. Atualize a página e tente novamente."
      );

    case 404:
      return "O serviço de autenticação não está disponível.";

    case 422:
      return backendMessage || "Os dados informados são inválidos.";

    case 429:
      return "Muitas tentativas de acesso. Aguarde um pouco antes de tentar novamente.";

    case 500:
    case 502:
    case 503:
    case 504:
      return (
        backendMessage ||
        "O servidor está temporariamente indisponível. Tente novamente mais tarde."
      );

    default:
      return "Não foi possível entrar agora. Tente novamente.";
  }
}

if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (isRegistering || isTransitioningAfterRegister) {
      return;
    }

    clearFormError(registerForm);

    const name = document.querySelector("#registerName");
    const email = document.querySelector("#registerEmail");
    const password = document.querySelector("#registerPassword");
    const confirmPassword = document.querySelector("#confirmPassword");

    const nameValid = validateName(name);
    const emailValid = validateEmail(email);
    const passwordValid = validatePassword(password);

    const confirmPasswordValid = validatePasswordConfirmation(
      password,
      confirmPassword,
    );

    if (!nameValid || !emailValid || !passwordValid || !confirmPasswordValid) {
      focusFirstInvalid(registerForm);
      return;
    }

    isRegistering = true;
    setSubmitting(registerForm, true, "Criando conta...");

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

      isTransitioningAfterRegister = true;

      showFormSuccess(registerForm, "Conta criada com sucesso!");

      registerForm.reset();

      [name, email, password, confirmPassword].forEach(clearFieldError);

      showAuthFace("register", false);

      window.setTimeout(() => {
        clearFormError(registerForm);
        isTransitioningAfterRegister = false;
        showAuthFace("login");
      }, 1500);
    } catch (error) {
      console.error("[MEMORIZEZ] Erro no cadastro:", {
        status: error?.status ?? null,
        code: error?.code ?? null,
        data: error?.data ?? null,
      });

      showFormError(registerForm, getRegisterErrorMessage(error));
    } finally {
      isRegistering = false;
      setSubmitting(registerForm, false);
    }
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (isLoggingIn) {
      return;
    }

    clearFormError(loginForm);

    const email = document.querySelector("#loginEmail");
    const password = document.querySelector("#loginPassword");

    const emailValid = validateEmail(email);
    const passwordValid = validateRequired(password, "Informe sua senha.");

    if (!emailValid || !passwordValid) {
      focusFirstInvalid(loginForm);
      return;
    }

    isLoggingIn = true;
    setSubmitting(loginForm, true, "Entrando...");

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

      clearStoredProfileName();

      showFormSuccess(loginForm, "Login realizado com sucesso!");

      window.location.assign("collections.html");
    } catch (error) {
      console.error("[MEMORIZEZ] Erro no login:", {
        message: error?.message ?? null,
        status: error?.status ?? null,
        code: error?.code ?? null,
        data: error?.data ?? null,
      });

      showFormError(loginForm, getLoginErrorMessage(error));
    } finally {
      isLoggingIn = false;
      setSubmitting(loginForm, false);
    }
  });
}
