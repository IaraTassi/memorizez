describe("Auth", () => {
  const fs = require("fs");
  const path = require("path");

  const authHtml = fs.readFileSync(
    path.resolve(__dirname, "../../auth.html"),
    "utf8",
  );

  const bodyMatch = authHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

  if (!bodyMatch) {
    throw new Error("Não foi possível encontrar o body de auth.html");
  }

  const bodyHtml = bodyMatch[1];

  async function waitForAsync() {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  }

  function loadAuthPage(search = "") {
    jest.resetModules();

    document.body.innerHTML = bodyHtml;

    window.history.replaceState({}, "", `/auth.html${search}`);

    global.apiRequest = jest.fn();

    window.MemorizezAuth = {
      getToken: jest.fn(),
      saveToken: jest.fn(),
      removeToken: jest.fn(),
      isAuthenticated: jest.fn(),
    };

    sessionStorage.clear();

    require("../../js/pages/auth");
  }

  function fillRegisterForm() {
    document.querySelector("#registerName").value = "Maria";
    document.querySelector("#registerEmail").value = "maria@email.com";
    document.querySelector("#registerPassword").value = "123456";
    document.querySelector("#confirmPassword").value = "123456";
  }

  function fillLoginForm() {
    document.querySelector("#loginEmail").value = "maria@email.com";
    document.querySelector("#loginPassword").value = "123456";
  }

  function submitForm(form) {
    form.dispatchEvent(
      new Event("submit", {
        bubbles: true,
        cancelable: true,
      }),
    );
  }

  function getFormMessage(form) {
    return form.querySelector('[role="alert"]');
  }

  beforeEach(() => {
    loadAuthPage();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it("should switch between register and login faces", () => {
    const authCard = document.querySelector("#authCard");

    const loginButton = document.querySelector('[data-auth-flip="login"]');

    const registerButton = document.querySelector(
      '[data-auth-flip="register"]',
    );

    const registerFace = document.querySelector(".auth-card__face--register");

    const loginFace = document.querySelector(".auth-card__face--login");

    loginButton.click();

    expect(authCard.classList.contains("is-login")).toBe(true);
    expect(registerFace.getAttribute("aria-hidden")).toBe("true");
    expect(loginFace.getAttribute("aria-hidden")).toBe("false");
    expect(registerFace.inert).toBe(true);
    expect(loginFace.inert).toBe(false);
    expect(document.activeElement.id).toBe("loginTitle");

    registerButton.click();

    expect(authCard.classList.contains("is-login")).toBe(false);
    expect(registerFace.getAttribute("aria-hidden")).toBe("false");
    expect(loginFace.getAttribute("aria-hidden")).toBe("true");
    expect(registerFace.inert).toBe(false);
    expect(loginFace.inert).toBe(true);
    expect(document.activeElement.id).toBe("registerTitle");
  });

  it("should show login face when mode is login", () => {
    loadAuthPage("?mode=login");

    expect(
      document.querySelector("#authCard").classList.contains("is-login"),
    ).toBe(true);

    expect(document.activeElement.id).toBe("loginTitle");
  });

  it("should show register face when mode is register", () => {
    loadAuthPage("?mode=register");

    expect(
      document.querySelector("#authCard").classList.contains("is-login"),
    ).toBe(false);

    expect(document.activeElement.id).toBe("registerTitle");
  });

  it("should keep the default face when mode is invalid", () => {
    loadAuthPage("?mode=invalid");

    expect(
      document.querySelector("#authCard").classList.contains("is-login"),
    ).toBe(false);
  });

  it("should not switch faces while registration is in progress", async () => {
    global.apiRequest.mockImplementation(() => new Promise(() => {}));

    fillRegisterForm();

    submitForm(document.querySelector("#registerForm"));

    document.querySelector('[data-auth-flip="login"]').click();

    expect(
      document.querySelector("#authCard").classList.contains("is-login"),
    ).toBe(false);

    expect(
      document.querySelector("#registerForm button[type='submit']").disabled,
    ).toBe(true);
  });

  it("should not register when required fields are empty", () => {
    const registerForm = document.querySelector("#registerForm");

    submitForm(registerForm);

    expect(global.apiRequest).not.toHaveBeenCalled();

    expect(
      document.querySelector("#registerName").getAttribute("aria-invalid"),
    ).toBe("true");

    expect(
      document.querySelector("#registerEmail").getAttribute("aria-invalid"),
    ).toBe("true");

    expect(
      document.querySelector("#registerPassword").getAttribute("aria-invalid"),
    ).toBe("true");

    expect(
      document.querySelector("#confirmPassword").getAttribute("aria-invalid"),
    ).toBe("true");
  });

  it("should show an error when name exceeds 100 characters", () => {
    fillRegisterForm();

    document.querySelector("#registerName").value = "A".repeat(101);

    submitForm(document.querySelector("#registerForm"));

    expect(global.apiRequest).not.toHaveBeenCalled();

    expect(document.querySelector("#registerNameError").textContent).toBe(
      "O nome deve ter no máximo 100 caracteres.",
    );
  });

  it("should show an error when email is invalid", () => {
    fillRegisterForm();

    document.querySelector("#registerEmail").value = "email-invalido";

    submitForm(document.querySelector("#registerForm"));

    expect(global.apiRequest).not.toHaveBeenCalled();

    expect(document.querySelector("#registerEmailError").textContent).toBe(
      "Informe um endereço de e-mail válido.",
    );
  });

  it("should show an error when password has fewer than 6 characters", () => {
    fillRegisterForm();

    document.querySelector("#registerPassword").value = "12345";
    document.querySelector("#confirmPassword").value = "12345";

    submitForm(document.querySelector("#registerForm"));

    expect(global.apiRequest).not.toHaveBeenCalled();

    expect(document.querySelector("#registerPasswordError").textContent).toBe(
      "A senha deve ter pelo menos 6 caracteres.",
    );
  });

  it("should show an error when passwords do not match", () => {
    fillRegisterForm();

    document.querySelector("#confirmPassword").value = "654321";

    submitForm(document.querySelector("#registerForm"));

    expect(global.apiRequest).not.toHaveBeenCalled();

    expect(document.querySelector("#confirmPasswordError").textContent).toBe(
      "As senhas não coincidem.",
    );
  });

  it("should clear field error when the user changes the input", () => {
    const email = document.querySelector("#registerEmail");
    const error = document.querySelector("#registerEmailError");

    fillRegisterForm();

    email.value = "email-invalido";

    submitForm(document.querySelector("#registerForm"));

    expect(email.getAttribute("aria-invalid")).toBe("true");

    email.value = "maria@email.com";
    email.dispatchEvent(new Event("input", { bubbles: true }));

    expect(email.hasAttribute("aria-invalid")).toBe(false);
    expect(error.textContent).toBe("");
    expect(error.hidden).toBe(true);
  });

  it("should not login when required fields are empty", () => {
    const loginForm = document.querySelector("#loginForm");

    submitForm(loginForm);

    expect(global.apiRequest).not.toHaveBeenCalled();

    expect(
      document.querySelector("#loginEmail").getAttribute("aria-invalid"),
    ).toBe("true");

    expect(
      document.querySelector("#loginPassword").getAttribute("aria-invalid"),
    ).toBe("true");
  });

  it("should not login with an invalid email", () => {
    fillLoginForm();

    document.querySelector("#loginEmail").value = "email-invalido";

    submitForm(document.querySelector("#loginForm"));

    expect(global.apiRequest).not.toHaveBeenCalled();

    expect(document.querySelector("#loginEmailError").textContent).toBe(
      "Informe um endereço de e-mail válido.",
    );
  });

  it("should register successfully", async () => {
    global.apiRequest.mockResolvedValueOnce({});

    fillRegisterForm();

    const registerForm = document.querySelector("#registerForm");

    submitForm(registerForm);

    expect(global.apiRequest).toHaveBeenCalledWith(
      "/users",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Maria",
          email: "maria@email.com",
          password: "123456",
          confirmPassword: "123456",
        }),
      }),
    );

    await waitForAsync();

    expect(getFormMessage(registerForm).textContent).toBe(
      "Conta criada com sucesso!",
    );

    expect(
      getFormMessage(registerForm).classList.contains("auth-error--success"),
    ).toBe(true);

    expect(registerForm.querySelector('[role="alert"]').hidden).toBe(false);

    expect(document.querySelector("#registerName").value).toBe("");
    expect(document.querySelector("#registerEmail").value).toBe("");
    expect(document.querySelector("#registerPassword").value).toBe("");
    expect(document.querySelector("#confirmPassword").value).toBe("");

    expect(
      document.querySelector("#registerForm button[type='submit']").disabled,
    ).toBe(false);
  });

  it("should switch to login after successful registration", async () => {
    jest.useFakeTimers();

    global.apiRequest.mockResolvedValueOnce({});

    fillRegisterForm();

    submitForm(document.querySelector("#registerForm"));

    await waitForAsync();

    expect(
      document.querySelector("#authCard").classList.contains("is-login"),
    ).toBe(false);

    jest.advanceTimersByTime(1500);

    await waitForAsync();

    expect(
      document.querySelector("#authCard").classList.contains("is-login"),
    ).toBe(true);

    expect(document.activeElement.id).toBe("loginTitle");
  });

  it("should prevent repeated registration while a request is pending", async () => {
    let resolveRequest;

    global.apiRequest.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );

    fillRegisterForm();

    const registerForm = document.querySelector("#registerForm");

    submitForm(registerForm);
    submitForm(registerForm);

    expect(global.apiRequest).toHaveBeenCalledTimes(1);

    expect(registerForm.querySelector('button[type="submit"]').disabled).toBe(
      true,
    );

    resolveRequest({});

    await waitForAsync();
  });

  it("should show an error when registration fails with status 409", async () => {
    const error = Object.assign(new Error("Conflict"), {
      status: 409,
    });

    global.apiRequest.mockRejectedValueOnce(error);

    fillRegisterForm();

    const registerForm = document.querySelector("#registerForm");

    submitForm(registerForm);

    await waitForAsync();

    expect(getFormMessage(registerForm).textContent).toBe(
      "Já existe uma conta cadastrada com esses dados.",
    );

    expect(registerForm.querySelector('button[type="submit"]').disabled).toBe(
      false,
    );
  });

  it("should use the backend message when registration fails with status 409", async () => {
    const error = Object.assign(new Error("Conflict"), {
      status: 409,
      data: {
        userMessage: "Este e-mail já está cadastrado.",
      },
    });

    global.apiRequest.mockRejectedValueOnce(error);

    fillRegisterForm();

    const registerForm = document.querySelector("#registerForm");

    submitForm(registerForm);

    await waitForAsync();

    expect(getFormMessage(registerForm).textContent).toBe(
      "Este e-mail já está cadastrado.",
    );
  });

  it("should show a specific message when registration times out", async () => {
    const error = Object.assign(new Error("Request timeout"), {
      code: "TIMEOUT_ERROR",
    });

    global.apiRequest.mockRejectedValueOnce(error);

    fillRegisterForm();

    const registerForm = document.querySelector("#registerForm");

    submitForm(registerForm);

    await waitForAsync();

    expect(getFormMessage(registerForm).textContent).toBe(
      "A solicitação de cadastro demorou mais que o esperado. Verifique se a operação foi concluída antes de tentar novamente.",
    );
  });

  it("should show a specific message when registration response cannot be read", async () => {
    const error = Object.assign(new Error("Response read error"), {
      code: "RESPONSE_READ_ERROR",
    });

    global.apiRequest.mockRejectedValueOnce(error);

    fillRegisterForm();

    const registerForm = document.querySelector("#registerForm");

    submitForm(registerForm);

    await waitForAsync();

    expect(getFormMessage(registerForm).textContent).toBe(
      "Não foi possível confirmar o cadastro. Atualize a página antes de tentar novamente.",
    );
  });

  it("should show a network error when registration fails due to connection", async () => {
    const error = Object.assign(new Error("Network error"), {
      code: "NETWORK_ERROR",
    });

    global.apiRequest.mockRejectedValueOnce(error);

    fillRegisterForm();

    const registerForm = document.querySelector("#registerForm");

    submitForm(registerForm);

    await waitForAsync();

    expect(getFormMessage(registerForm).textContent).toBe(
      "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
    );
  });

  it("should login successfully and save the JWT token", async () => {
    global.apiRequest.mockResolvedValueOnce({
      token: "jwt-token-123",
    });

    fillLoginForm();

    sessionStorage.setItem("memorizez.profileName", "Nome antigo");

    const loginForm = document.querySelector("#loginForm");

    submitForm(loginForm);

    await waitForAsync();

    expect(global.apiRequest).toHaveBeenCalledWith(
      "/users/login",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "maria@email.com",
          password: "123456",
        }),
      }),
    );

    expect(window.MemorizezAuth.saveToken).toHaveBeenCalledWith(
      "jwt-token-123",
    );

    expect(sessionStorage.getItem("memorizez.profileName")).toBeNull();

    expect(getFormMessage(loginForm).textContent).toBe(
      "Login realizado com sucesso!",
    );

    expect(
      getFormMessage(loginForm).classList.contains("auth-error--success"),
    ).toBe(true);
  });

  it("should show an error when login credentials are invalid", async () => {
    const error = Object.assign(new Error("Unauthorized"), {
      status: 401,
    });

    global.apiRequest.mockRejectedValueOnce(error);

    fillLoginForm();

    const loginForm = document.querySelector("#loginForm");

    submitForm(loginForm);

    await waitForAsync();

    expect(getFormMessage(loginForm).textContent).toBe(
      "E-mail ou senha inválidos.",
    );

    expect(window.MemorizezAuth.saveToken).not.toHaveBeenCalled();
  });

  it("should show a permission error when login returns 403", async () => {
    const error = Object.assign(new Error("Forbidden"), {
      status: 403,
    });

    global.apiRequest.mockRejectedValueOnce(error);

    fillLoginForm();

    const loginForm = document.querySelector("#loginForm");

    submitForm(loginForm);

    await waitForAsync();

    expect(getFormMessage(loginForm).textContent).toBe(
      "A solicitação não foi autorizada. Atualize a página e tente novamente.",
    );
  });

  it("should show the backend message when login returns 403", async () => {
    const error = Object.assign(new Error("Forbidden"), {
      status: 403,
      data: {
        userMessage: "Acesso temporariamente bloqueado.",
      },
    });

    global.apiRequest.mockRejectedValueOnce(error);

    fillLoginForm();

    const loginForm = document.querySelector("#loginForm");

    submitForm(loginForm);

    await waitForAsync();

    expect(getFormMessage(loginForm).textContent).toBe(
      "Acesso temporariamente bloqueado.",
    );
  });

  it("should show an error when login response does not contain a token", async () => {
    global.apiRequest.mockResolvedValueOnce({});

    fillLoginForm();

    const loginForm = document.querySelector("#loginForm");

    submitForm(loginForm);

    await waitForAsync();

    expect(window.MemorizezAuth.saveToken).not.toHaveBeenCalled();

    expect(getFormMessage(loginForm).textContent).toBe(
      "Não foi possível entrar agora. Tente novamente.",
    );
  });

  it("should show an error when login response contains an empty token", async () => {
    global.apiRequest.mockResolvedValueOnce({
      token: "   ",
    });

    fillLoginForm();

    const loginForm = document.querySelector("#loginForm");

    submitForm(loginForm);

    await waitForAsync();

    expect(window.MemorizezAuth.saveToken).not.toHaveBeenCalled();

    expect(getFormMessage(loginForm).textContent).toBe(
      "Não foi possível entrar agora. Tente novamente.",
    );
  });

  it("should show an error when the authentication service is unavailable", async () => {
    global.apiRequest.mockResolvedValueOnce({
      token: "jwt-token-123",
    });

    window.MemorizezAuth.saveToken = undefined;

    fillLoginForm();

    const loginForm = document.querySelector("#loginForm");

    submitForm(loginForm);

    await waitForAsync();

    expect(getFormMessage(loginForm).textContent).toBe(
      "Não foi possível entrar agora. Tente novamente.",
    );
  });

  it("should show a specific message when login times out", async () => {
    const error = Object.assign(new Error("Request timeout"), {
      code: "TIMEOUT_ERROR",
    });

    global.apiRequest.mockRejectedValueOnce(error);

    fillLoginForm();

    const loginForm = document.querySelector("#loginForm");

    submitForm(loginForm);

    await waitForAsync();

    expect(getFormMessage(loginForm).textContent).toBe(
      "A solicitação de login demorou mais que o esperado. Verifique se a operação foi concluída antes de tentar novamente.",
    );
  });

  it("should show a network error when login fails due to connection", async () => {
    const error = Object.assign(new Error("Network error"), {
      code: "NETWORK_ERROR",
    });

    global.apiRequest.mockRejectedValueOnce(error);

    fillLoginForm();

    const loginForm = document.querySelector("#loginForm");

    submitForm(loginForm);

    await waitForAsync();

    expect(getFormMessage(loginForm).textContent).toBe(
      "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
    );
  });

  it("should show an error when login returns status 404", async () => {
    const error = Object.assign(new Error("Not found"), {
      status: 404,
    });

    global.apiRequest.mockRejectedValueOnce(error);

    fillLoginForm();

    const loginForm = document.querySelector("#loginForm");

    submitForm(loginForm);

    await waitForAsync();

    expect(getFormMessage(loginForm).textContent).toBe(
      "O serviço de autenticação não está disponível.",
    );
  });

  it("should prevent repeated login while a request is pending", async () => {
    let resolveRequest;

    global.apiRequest.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );

    fillLoginForm();

    const loginForm = document.querySelector("#loginForm");

    submitForm(loginForm);
    submitForm(loginForm);

    expect(global.apiRequest).toHaveBeenCalledTimes(1);

    expect(loginForm.querySelector('button[type="submit"]').disabled).toBe(
      true,
    );

    resolveRequest({
      token: "jwt-token-123",
    });

    await waitForAsync();

    expect(window.MemorizezAuth.saveToken).toHaveBeenCalledWith(
      "jwt-token-123",
    );
  });
});
