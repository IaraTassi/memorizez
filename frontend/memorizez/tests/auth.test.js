describe("Auth", () => {
  const fs = require("fs");
  const path = require("path");

  const authHtml = fs.readFileSync(
    path.resolve(__dirname, "../auth.html"),
    "utf8",
  );

  const bodyHtml = authHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i)[1];

  function loadAuthPage(search = "") {
    window.history.replaceState({}, "", `/auth.html${search}`);

    document.body.innerHTML = bodyHtml;

    global.apiRequest = jest.fn();

    jest.resetModules();
    require("../js/auth");
  }

  beforeEach(() => {
    loadAuthPage();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should switch between register and login faces", () => {
    const authCard = document.querySelector("#authCard");
    const loginButton = document.querySelector('[data-auth-flip="login"]');
    const registerButton = document.querySelector(
      '[data-auth-flip="register"]',
    );

    loginButton.click();

    expect(authCard.classList.contains("is-login")).toBe(true);
    expect(
      document
        .querySelector(".auth-card__face--register")
        .getAttribute("aria-hidden"),
    ).toBe("true");

    registerButton.click();

    expect(authCard.classList.contains("is-login")).toBe(false);
    expect(
      document
        .querySelector(".auth-card__face--login")
        .getAttribute("aria-hidden"),
    ).toBe("true");
  });

  it("should show login face when mode is login", () => {
    loadAuthPage("?mode=login");

    expect(
      document.querySelector("#authCard").classList.contains("is-login"),
    ).toBe(true);

    expect(document.activeElement.id).toBe("loginTitle");
  });

  it("should not register when required fields are empty", () => {
    const registerForm = document.querySelector("#registerForm");

    registerForm.dispatchEvent(
      new Event("submit", {
        bubbles: true,
        cancelable: true,
      }),
    );

    expect(global.apiRequest).not.toHaveBeenCalled();

    expect(
      document.querySelector("#registerEmail").getAttribute("aria-invalid"),
    ).toBe("true");
  });

  it("should not login when required fields are empty", () => {
    const loginForm = document.querySelector("#loginForm");

    loginForm.dispatchEvent(
      new Event("submit", {
        bubbles: true,
        cancelable: true,
      }),
    );

    expect(global.apiRequest).not.toHaveBeenCalled();

    expect(
      document.querySelector("#loginEmail").getAttribute("aria-invalid"),
    ).toBe("true");

    expect(
      document.querySelector("#loginPassword").getAttribute("aria-invalid"),
    ).toBe("true");
  });

  it("should register successfully", async () => {
    global.apiRequest.mockResolvedValueOnce({});

    document.querySelector("#registerName").value = "Maria";
    document.querySelector("#registerEmail").value = "maria@email.com";
    document.querySelector("#registerPassword").value = "123456";
    document.querySelector("#confirmPassword").value = "123456";

    const registerForm = document.querySelector("#registerForm");

    registerForm.dispatchEvent(
      new Event("submit", {
        bubbles: true,
        cancelable: true,
      }),
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(global.apiRequest).toHaveBeenCalledWith(
      "/users",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "Maria",
          email: "maria@email.com",
          password: "123456",
          confirmPassword: "123456",
        }),
      }),
    );

    expect(registerForm.querySelector('[role="alert"]').textContent).toBe(
      "Conta criada com sucesso!",
    );
  });

  it("should show an error when registration fails with status 409", async () => {
    const error = new Error("Conflict");
    error.status = 409;

    global.apiRequest.mockRejectedValueOnce(error);

    document.querySelector("#registerName").value = "Maria";
    document.querySelector("#registerEmail").value = "maria@email.com";
    document.querySelector("#registerPassword").value = "123456";
    document.querySelector("#confirmPassword").value = "123456";

    document.querySelector("#registerForm").dispatchEvent(
      new Event("submit", {
        bubbles: true,
        cancelable: true,
      }),
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(
      document.querySelector("#registerForm [role='alert']").textContent,
    ).toBe(
      "Não foi possível criar a conta. Verifique os dados ou tente outro e-mail.",
    );
  });

  it("should login successfully", async () => {
    global.apiRequest.mockResolvedValueOnce({});

    document.querySelector("#loginEmail").value = "maria@email.com";
    document.querySelector("#loginPassword").value = "123456";

    document.querySelector("#loginForm").dispatchEvent(
      new Event("submit", {
        bubbles: true,
        cancelable: true,
      }),
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(global.apiRequest).toHaveBeenCalledWith(
      "/users/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          email: "maria@email.com",
          password: "123456",
        }),
      }),
    );

    expect(
      document.querySelector("#loginForm [role='alert']").textContent,
    ).toBe("Login realizado com sucesso!");
  });

  it("should show an error when login credentials are invalid", async () => {
    const error = new Error("Unauthorized");
    error.status = 401;

    global.apiRequest.mockRejectedValueOnce(error);

    document.querySelector("#loginEmail").value = "maria@email.com";
    document.querySelector("#loginPassword").value = "123456";

    document.querySelector("#loginForm").dispatchEvent(
      new Event("submit", {
        bubbles: true,
        cancelable: true,
      }),
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(
      document.querySelector("#loginForm [role='alert']").textContent,
    ).toBe("E-mail ou senha inválidos.");
  });
});
