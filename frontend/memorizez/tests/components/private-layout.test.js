require("../../js/core/auth");
require("../../js/core/session");
require("../../js/components/private-layout");

describe("Private Layout", () => {
  async function flushPromises() {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  async function loadPrivateLayoutPage(
    page = "collections",
    apiResponse = Promise.resolve({ name: "Usuário de Teste" }),
  ) {
    document.body.innerHTML = "<main></main>";
    document.body.dataset.page = page;

    window.MemorizezAuth.saveToken("test-jwt-token");
    sessionStorage.removeItem("memorizez.profileName");

    global.apiRequest = jest.fn().mockImplementation(() =>
      Promise.resolve(apiResponse).catch((error) => {
        if (error?.status === 401) {
          window.dispatchEvent(new Event("memorizez:session-expired"));
        }

        throw error;
      }),
    );

    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});

    document.dispatchEvent(new Event("DOMContentLoaded"));

    await flushPromises();
  }

  afterEach(() => {
    sessionStorage.clear();
    jest.restoreAllMocks();
  });

  describe("rendering", () => {
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

    it("should render the mobile bottom navigation", async () => {
      await loadPrivateLayoutPage();

      const mobileNavigation = document.querySelector(".private-bottom-nav");

      expect(mobileNavigation).not.toBeNull();
      expect(mobileNavigation.querySelectorAll("a")).toHaveLength(4);
    });

    it.each([
      ["cards", "collections.html"],
      ["card-details", "collections.html"],
      ["study", "review.html"],
      ["free-study-session", "free-study.html"],
      ["history-cards", "history.html"],
      ["history-card-details", "history.html"],
    ])(
      "should keep the parent navigation item active on the %s page",
      async (page, expectedHref) => {
        await loadPrivateLayoutPage(page);

        const currentLink = document.querySelector(
          '.nav-links a[aria-current="page"]',
        );

        expect(currentLink).not.toBeNull();
        expect(currentLink.getAttribute("href")).toBe(expectedHref);
      },
    );
  });

  describe("profile", () => {
    it("should request the authenticated user's profile", async () => {
      await loadPrivateLayoutPage();

      expect(global.apiRequest).toHaveBeenCalledWith("/users/me");
    });

    it("should render the user's name after loading the profile", async () => {
      await loadPrivateLayoutPage();

      expect(document.querySelector(".profile-name").textContent).toBe(
        "Usuário de Teste",
      );
    });

    it("should store the authenticated user's name in sessionStorage", async () => {
      await loadPrivateLayoutPage();

      expect(sessionStorage.getItem("memorizez.profileName")).toBe(
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

    it("should show the cached profile name before refreshing the profile", async () => {
      sessionStorage.setItem("memorizez.profileName", "Nome armazenado");

      await loadPrivateLayoutPage();

      expect(document.querySelector(".profile-name").textContent).toBe(
        "Usuário de Teste",
      );
    });
  });

  describe("session expiration", () => {
    it("should show the session expired modal when loading the user returns 401", async () => {
      await loadPrivateLayoutPage(
        "collections",
        Promise.reject({ status: 401 }),
      );

      const overlay = document.getElementById("account-confirmation-overlay");

      expect(global.apiRequest).toHaveBeenCalledWith("/users/me");
      expect(overlay.hidden).toBe(false);

      expect(overlay.querySelector(".modal-title").textContent).toBe(
        "Sua sessão expirou",
      );

      expect(overlay.querySelector(".modal-confirm").textContent).toBe(
        "Ir para login",
      );
    });

    it("should remove the stored token when the session expires", async () => {
      await loadPrivateLayoutPage(
        "collections",
        Promise.reject({ status: 401 }),
      );

      expect(window.MemorizezAuth.getToken()).toBeNull();
    });

    it("should hide the cancel and close buttons when the session expires", async () => {
      await loadPrivateLayoutPage(
        "collections",
        Promise.reject({ status: 401 }),
      );

      const overlay = document.getElementById("account-confirmation-overlay");

      expect(overlay.querySelector(".modal-cancel").hidden).toBe(true);
      expect(overlay.querySelector(".modal-close").hidden).toBe(true);
    });
  });

  describe("logout confirmation modal", () => {
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
  });

  describe("logout action", () => {
    it("should remove the JWT token when confirming logout", async () => {
      await loadPrivateLayoutPage();

      sessionStorage.setItem("memorizez.profileName", "Usuário de Teste");

      const logoutButton = document.querySelector('[data-modal-open="logout"]');

      const overlay = document.getElementById("account-confirmation-overlay");

      logoutButton.click();
      overlay.querySelector(".modal-confirm").click();

      expect(window.MemorizezAuth.getToken()).toBeNull();

      expect(sessionStorage.getItem("memorizez.profileName")).toBeNull();
    });

    it("should not call the logout endpoint when confirming logout", async () => {
      await loadPrivateLayoutPage();

      const logoutButton = document.querySelector('[data-modal-open="logout"]');

      const overlay = document.getElementById("account-confirmation-overlay");

      logoutButton.click();
      overlay.querySelector(".modal-confirm").click();

      expect(global.apiRequest).not.toHaveBeenCalledWith("/logout", {
        method: "POST",
      });
    });
  });

  describe("delete account confirmation modal", () => {
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

    it("should call the delete account endpoint when confirming deletion", async () => {
      await loadPrivateLayoutPage();

      const deleteButton = document.querySelector(
        '[data-modal-open="delete-account"]',
      );

      const overlay = document.getElementById("account-confirmation-overlay");

      deleteButton.click();
      overlay.querySelector(".modal-confirm").click();

      await flushPromises();

      expect(global.apiRequest).toHaveBeenCalledWith("/users", {
        method: "DELETE",
      });
    });

    it("should remove the JWT token after successful account deletion", async () => {
      await loadPrivateLayoutPage();

      const deleteButton = document.querySelector(
        '[data-modal-open="delete-account"]',
      );

      const overlay = document.getElementById("account-confirmation-overlay");

      deleteButton.click();
      overlay.querySelector(".modal-confirm").click();

      await flushPromises();

      expect(window.MemorizezAuth.getToken()).toBeNull();
    });

    it("should show an error message when account deletion fails", async () => {
      await loadPrivateLayoutPage();

      global.apiRequest.mockRejectedValueOnce(new Error("Network error"));

      const deleteButton = document.querySelector(
        '[data-modal-open="delete-account"]',
      );

      const overlay = document.getElementById("account-confirmation-overlay");

      const confirmButton = overlay.querySelector(".modal-confirm");
      const feedback = overlay.querySelector("#confirmation-feedback");

      deleteButton.click();
      confirmButton.click();

      await flushPromises();

      expect(global.apiRequest).toHaveBeenLastCalledWith("/users", {
        method: "DELETE",
      });

      expect(feedback.hidden).toBe(false);

      expect(feedback.textContent).toBe(
        "Não foi possível excluir sua conta. Tente novamente.",
      );

      expect(confirmButton.disabled).toBe(false);
    });

    it("should keep the JWT token when account deletion fails", async () => {
      await loadPrivateLayoutPage();

      global.apiRequest.mockRejectedValueOnce(new Error("Network error"));

      const deleteButton = document.querySelector(
        '[data-modal-open="delete-account"]',
      );

      const overlay = document.getElementById("account-confirmation-overlay");

      deleteButton.click();
      overlay.querySelector(".modal-confirm").click();

      await flushPromises();

      expect(window.MemorizezAuth.getToken()).toBe("test-jwt-token");
    });
  });
});
