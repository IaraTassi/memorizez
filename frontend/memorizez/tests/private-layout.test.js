describe("Private Layout", () => {
  async function loadPrivateLayoutPage(
    page = "collections",
    apiResponse = Promise.resolve({ name: "Usuário de Teste" }),
  ) {
    document.body.innerHTML = "<main></main>";
    document.body.dataset.page = page;

    global.apiRequest = jest.fn().mockReturnValue(apiResponse);

    jest.spyOn(console, "error").mockImplementation(() => {});

    document.dispatchEvent(new Event("DOMContentLoaded"));

    await Promise.resolve();
  }

  require("../js/private-layout");
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should render the private header, footer and account modal", async () => {
    await loadPrivateLayoutPage();

    expect(document.getElementById("private-header")).not.toBeNull();
    expect(document.getElementById("private-footer")).not.toBeNull();
    expect(
      document.getElementById("account-confirmation-overlay"),
    ).not.toBeNull();
  });

  it("should render all navigation links", async () => {
    await loadPrivateLayoutPage();

    const navigation = document.querySelector(".nav-links");

    expect(navigation.textContent).toContain("Coleções");
    expect(navigation.textContent).toContain("Revisão");
    expect(navigation.textContent).toContain("Estudo livre");
    expect(navigation.textContent).toContain("Histórico");
  });

  it("should mark the current page in the navigation", async () => {
    await loadPrivateLayoutPage("review");

    const currentLink = document.querySelector(
      '.nav-links a[aria-current="page"]',
    );

    expect(currentLink).not.toBeNull();
    expect(currentLink.getAttribute("href")).toBe("review.html");
  });

  it("should render the user's name after loading the profile", async () => {
    await loadPrivateLayoutPage();

    expect(global.apiRequest).toHaveBeenCalledWith("/users/me");

    expect(document.querySelector(".profile-name").textContent).toBe(
      "Usuário de Teste",
    );
  });

  it("should keep the default profile name when loading the user fails", async () => {
    await loadPrivateLayoutPage(
      "collections",
      Promise.reject(new Error("Network error")),
    );

    expect(document.querySelector(".profile-name").textContent).toBe(
      "Meu perfil",
    );

    expect(console.error).toHaveBeenCalled();
  });

  it("should redirect to login when loading the user returns 401", async () => {
    await loadPrivateLayoutPage("collections", Promise.reject({ status: 401 }));

    expect(global.apiRequest).toHaveBeenCalledWith("/users/me");
    expect(console.error).toHaveBeenCalled();
  });

  it("should open the logout confirmation modal", async () => {
    await loadPrivateLayoutPage();

    const logoutButton = document.querySelector('[data-modal-open="logout"]');

    const overlay = document.getElementById("account-confirmation-overlay");

    const modal = overlay.querySelector(".confirmation-modal");

    logoutButton.click();

    expect(overlay.hidden).toBe(false);
    expect(modal.querySelector(".modal-title").textContent).toBe(
      "Deseja sair?",
    );
    expect(modal.querySelector(".modal-confirm").textContent).toBe("Sair");
  });

  it("should open the delete account confirmation modal", async () => {
    await loadPrivateLayoutPage();

    const deleteButton = document.querySelector(
      '[data-modal-open="delete-account"]',
    );

    const overlay = document.getElementById("account-confirmation-overlay");

    const modal = overlay.querySelector(".confirmation-modal");

    deleteButton.click();

    expect(overlay.hidden).toBe(false);
    expect(modal.querySelector(".modal-title").textContent).toBe(
      "Excluir sua conta?",
    );
    expect(modal.querySelector(".modal-message").textContent).toContain(
      "Essa ação é permanente.",
    );
    expect(modal.querySelector(".modal-confirm").textContent).toBe(
      "Excluir conta",
    );
  });

  it("should close the modal and restore focus when clicking cancel", async () => {
    await loadPrivateLayoutPage();

    const logoutButton = document.querySelector('[data-modal-open="logout"]');

    const overlay = document.getElementById("account-confirmation-overlay");

    const cancelButton = overlay.querySelector(".modal-cancel");

    logoutButton.focus();
    logoutButton.click();
    cancelButton.click();

    expect(overlay.hidden).toBe(true);
    expect(document.activeElement).toBe(logoutButton);
  });

  it("should close the modal when clicking the close button", async () => {
    await loadPrivateLayoutPage();

    const logoutButton = document.querySelector('[data-modal-open="logout"]');

    const overlay = document.getElementById("account-confirmation-overlay");

    const closeButton = overlay.querySelector(".modal-close");

    logoutButton.focus();
    logoutButton.click();
    closeButton.click();

    expect(overlay.hidden).toBe(true);
    expect(document.activeElement).toBe(logoutButton);
  });

  it("should close the modal when clicking outside", async () => {
    await loadPrivateLayoutPage();

    const logoutButton = document.querySelector('[data-modal-open="logout"]');

    const overlay = document.getElementById("account-confirmation-overlay");

    logoutButton.focus();
    logoutButton.click();

    overlay.click();

    expect(overlay.hidden).toBe(true);
    expect(document.activeElement).toBe(logoutButton);
  });

  it("should close the modal when pressing Escape", async () => {
    await loadPrivateLayoutPage();

    const logoutButton = document.querySelector('[data-modal-open="logout"]');

    const overlay = document.getElementById("account-confirmation-overlay");

    logoutButton.focus();
    logoutButton.click();

    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
      }),
    );

    expect(overlay.hidden).toBe(true);
    expect(document.activeElement).toBe(logoutButton);
  });

  it("should call the logout endpoint when confirming logout", async () => {
    await loadPrivateLayoutPage();

    const logoutButton = document.querySelector('[data-modal-open="logout"]');

    const overlay = document.getElementById("account-confirmation-overlay");

    const confirmButton = overlay.querySelector(".modal-confirm");

    logoutButton.click();
    confirmButton.click();

    await Promise.resolve();

    expect(global.apiRequest).toHaveBeenCalledWith("/logout", {
      method: "POST",
    });
  });

  it("should call the delete account endpoint when confirming deletion", async () => {
    await loadPrivateLayoutPage();

    const deleteButton = document.querySelector(
      '[data-modal-open="delete-account"]',
    );

    const overlay = document.getElementById("account-confirmation-overlay");

    const confirmButton = overlay.querySelector(".modal-confirm");

    deleteButton.click();
    confirmButton.click();

    await Promise.resolve();

    expect(global.apiRequest).toHaveBeenCalledWith("/users", {
      method: "DELETE",
    });
  });

  it("should show an alert when logout fails", async () => {
    await loadPrivateLayoutPage();

    global.apiRequest.mockRejectedValueOnce(new Error("Network error"));

    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});

    const logoutButton = document.querySelector('[data-modal-open="logout"]');

    const overlay = document.getElementById("account-confirmation-overlay");

    const confirmButton = overlay.querySelector(".modal-confirm");

    logoutButton.click();
    confirmButton.click();

    await Promise.resolve();
    await Promise.resolve();

    expect(global.apiRequest).toHaveBeenLastCalledWith("/logout", {
      method: "POST",
    });

    expect(alertSpy).toHaveBeenCalledWith(
      "Não foi possível encerrar a sessão. Tente novamente.",
    );

    expect(confirmButton.disabled).toBe(false);
  });

  it("should show an alert when account deletion fails", async () => {
    await loadPrivateLayoutPage();

    global.apiRequest.mockRejectedValueOnce(new Error("Network error"));

    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});

    const deleteButton = document.querySelector(
      '[data-modal-open="delete-account"]',
    );

    const overlay = document.getElementById("account-confirmation-overlay");

    const confirmButton = overlay.querySelector(".modal-confirm");

    deleteButton.click();
    confirmButton.click();

    await Promise.resolve();
    await Promise.resolve();

    expect(global.apiRequest).toHaveBeenLastCalledWith("/users", {
      method: "DELETE",
    });

    expect(alertSpy).toHaveBeenCalledWith(
      "Não foi possível excluir sua conta. Tente novamente.",
    );

    expect(confirmButton.disabled).toBe(false);
  });
});
