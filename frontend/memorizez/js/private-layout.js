let privateLayoutKeydownHandler = null;
let privateLayoutSessionExpiredHandler = null;

document.addEventListener("DOMContentLoaded", async () => {
  if (privateLayoutKeydownHandler) {
    document.removeEventListener("keydown", privateLayoutKeydownHandler);
  }

  if (privateLayoutSessionExpiredHandler) {
    window.removeEventListener(
      "memorizez:session-expired",
      privateLayoutSessionExpiredHandler,
    );
  }

  const PROFILE_NAME_STORAGE_KEY = "memorizez.profileName";

  const navigationLinks = [
    {
      pages: ["collections", "cards", "card-details"],
      href: "collections.html",
      label: "Coleções",
      icon: `
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <path d="M3 10h18"/>
        </svg>
      `,
    },
    {
      pages: ["review", "study"],
      href: "review.html",
      label: "Revisão",
      icon: `
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="m2 10 10-5 10 5-10 5-10-5z"/>
          <path d="M6 12v5c3 2 9 2 12 0v-5"/>
          <path d="M22 10v6"/>
        </svg>
      `,
    },
    {
      pages: ["free-study", "free-study-session"],
      href: "free-study.html",
      label: "Estudo livre",
      icon: `
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22z"/>
          <path d="M4 5.5v14A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M8 7h8"/>
          <path d="M8 11h8"/>
        </svg>
      `,
    },
    {
      pages: ["history", "history-cards", "history-card-details"],
      href: "history.html",
      label: "Histórico",
      icon: `
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9"/>
          <path d="M12 7v5l3 2"/>
        </svg>
      `,
    },
  ];

  const currentPage = document.body.dataset.page;

  function getStoredProfileName() {
    try {
      const name = sessionStorage.getItem(PROFILE_NAME_STORAGE_KEY);
      return name?.trim() || null;
    } catch {
      return null;
    }
  }

  function saveProfileName(name) {
    try {
      sessionStorage.setItem(PROFILE_NAME_STORAGE_KEY, name);
    } catch {
      console.warn("[MEMORIZEZ] Não foi possível armazenar o nome do perfil.");
    }
  }

  function clearStoredProfileName() {
    try {
      sessionStorage.removeItem(PROFILE_NAME_STORAGE_KEY);
    } catch {
      console.warn("[MEMORIZEZ] Não foi possível limpar o nome do perfil.");
    }
  }

  function renderNavigationLinks() {
    return navigationLinks
      .map(({ pages, href, label }) => {
        const isCurrentPage = pages.includes(currentPage);

        return `
          <a
            href="${href}"
            ${isCurrentPage ? 'aria-current="page"' : ""}
          >
            ${label}
          </a>
        `;
      })
      .join("");
  }

  function renderProfileDropdown() {
    return `
      <div class="dropdown profile-dropdown">
        <button
          class="profile-button dropdown-toggle p-0 border-0 bg-transparent d-flex align-items-center"
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
          aria-label="Abrir menu do perfil"
        >
          <svg
            class="profile-icon"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
          </svg>

          <span class="profile-name">Meu perfil</span>
        </button>

        <ul class="dropdown-menu dropdown-menu-end">
          <li>
            <button
              class="dropdown-item"
              type="button"
              data-modal-open="logout"
            >
              Sair
            </button>
          </li>

          <li>
            <button
              class="dropdown-item dropdown-item-danger"
              type="button"
              data-modal-open="delete-account"
            >
              Excluir conta
            </button>
          </li>
        </ul>
      </div>
    `;
  }

  function renderPrivateHeader() {
    if (document.querySelector("#private-header")) {
      return;
    }

    const linksHTML = renderNavigationLinks();

    const headerHTML = `
  <div id="private-header">
    <header class="navbar">
      <a
        class="brand"
        href="collections.html"
        aria-label="MEMORIZEZ, Minhas coleções"
      >
        <img src="assets/logo.svg" alt="" class="hero-logo" />
      </a>

      <nav class="nav-links" aria-label="Navegação principal">
        ${linksHTML}
      </nav>

      <div class="nav-actions">
        ${renderProfileDropdown()}
      </div>
    </header>
  </div>
`;

    document.body.insertAdjacentHTML("afterbegin", headerHTML);
  }

  function renderPrivateBottomNavigation() {
    if (document.querySelector("#private-bottom-nav")) {
      return;
    }

    const navigationItemsHTML = navigationLinks
      .map(({ pages, href, label, icon }) => {
        const isCurrentPage = pages.includes(currentPage);

        return `
          <a
            class="bottom-nav-item"
            href="${href}"
            ${isCurrentPage ? 'aria-current="page"' : ""}
          >
            <span class="bottom-nav-icon">
              ${icon}
            </span>

            <span class="bottom-nav-label">
              ${label}
            </span>
          </a>
        `;
      })
      .join("");

    const bottomNavigationHTML = `
      <nav
        id="private-bottom-nav"
        class="private-bottom-nav"
        aria-label="Navegação inferior"
      >
        ${navigationItemsHTML}

        <div class="bottom-nav-item bottom-nav-profile">
          ${renderProfileDropdown()}
        </div>
      </nav>
    `;

    document.body.insertAdjacentHTML("beforeend", bottomNavigationHTML);
  }

  function renderPrivateFooter() {
    if (document.querySelector("#private-footer")) {
      return;
    }

    const footerHTML = `
      <footer id="private-footer">
        <div class="footer-inner">
          <a
            class="footer-brand"
            href="collections.html"
            aria-label="MEMORIZEZ, Minhas coleções"
          >
            <img src="assets/logo.svg" alt="" class="hero-logo" />
          </a>

          <span class="footer-copyright">
            © ${new Date().getFullYear()} Todos os direitos reservados.
          </span>
        </div>
      </footer>
    `;

    document.body.insertAdjacentHTML("beforeend", footerHTML);
  }

  function renderAccountModal() {
    if (document.querySelector("#account-confirmation-overlay")) {
      return;
    }

    const modalHTML = `
      <div
        class="modal-overlay"
        id="account-confirmation-overlay"
        hidden
      >
        <section
          class="confirmation-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirmation-title"
          aria-describedby="confirmation-message confirmation-feedback"
          tabindex="-1"
        >
          <button
            class="modal-close"
            type="button"
            aria-label="Fechar janela"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>

          <h2 class="modal-title" id="confirmation-title">
            Deseja sair?
          </h2>

          <p class="modal-message" id="confirmation-message">
            Sua sessão será encerrada. Você precisará entrar novamente para
            acessar suas coleções e seus estudos.
          </p>

          <p
            class="modal-message"
            id="confirmation-feedback"
            role="alert"
            aria-live="assertive"
            hidden
          ></p>

          <div class="modal-actions">
            <button
              class="btn button-secondary modal-cancel"
              type="button"
            >
              Cancelar
            </button>

            <button
              class="btn button-primary modal-confirm"
              type="button"
            >
              Sair
            </button>
          </div>
        </section>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
  }

  renderPrivateHeader();
  renderPrivateBottomNavigation();
  renderPrivateFooter();
  renderAccountModal();

  const modalOverlay = document.querySelector("#account-confirmation-overlay");

  if (!modalOverlay) {
    console.error("[MEMORIZEZ] Não foi possível inicializar o modal de conta.");
    return;
  }

  const modal = modalOverlay.querySelector(".confirmation-modal");
  const closeButton = modalOverlay.querySelector(".modal-close");
  const cancelButton = modalOverlay.querySelector(".modal-cancel");
  const confirmButton = modalOverlay.querySelector(".modal-confirm");
  const modalTitle = modalOverlay.querySelector(".modal-title");
  const modalMessage = modalOverlay.querySelector("#confirmation-message");
  const modalFeedback = modalOverlay.querySelector("#confirmation-feedback");

  if (
    !modal ||
    !closeButton ||
    !cancelButton ||
    !confirmButton ||
    !modalTitle ||
    !modalMessage ||
    !modalFeedback
  ) {
    console.error(
      "[MEMORIZEZ] Não foi possível inicializar os controles do modal.",
    );
    return;
  }

  let previousFocus = null;
  let currentAction = null;
  let isSubmitting = false;

  function clearModalFeedback() {
    modalFeedback.textContent = "";
    modalFeedback.hidden = true;
  }

  function showModalFeedback(message) {
    modalFeedback.textContent = message;
    modalFeedback.hidden = false;
  }

  function getApiErrorMessage(error, fallbackMessage) {
    const extractErrorMessage = window.MemorizezApi?.extractErrorMessage;

    if (typeof extractErrorMessage === "function") {
      return extractErrorMessage(error?.data) || fallbackMessage;
    }

    const userMessage = error?.data?.userMessage;

    return typeof userMessage === "string" && userMessage.trim()
      ? userMessage.trim()
      : fallbackMessage;
  }

  function setModalControlsForSessionExpired() {
    closeButton.hidden = true;
    cancelButton.hidden = true;

    confirmButton.hidden = false;
    confirmButton.textContent = "Ir para login";
  }

  function setModalControlsForConfirmation() {
    closeButton.hidden = false;
    cancelButton.hidden = false;

    confirmButton.hidden = false;
  }

  function openModal(type) {
    if (!["logout", "delete-account"].includes(type)) {
      return;
    }

    if (isSubmitting || currentAction === "session-expired") {
      return;
    }

    previousFocus = document.activeElement;
    currentAction = type;

    clearModalFeedback();
    setModalControlsForConfirmation();

    if (type === "logout") {
      modalTitle.textContent = "Deseja sair?";

      modalMessage.textContent =
        "Sua sessão será encerrada. Você precisará entrar novamente para acessar suas coleções e seus estudos.";

      confirmButton.textContent = "Sair";
    }

    if (type === "delete-account") {
      modalTitle.textContent = "Excluir sua conta?";

      modalMessage.textContent =
        "Essa ação é permanente. Sua conta, suas coleções, seus cartões, suas revisões e seu histórico serão excluídos. Não será possível recuperar esses dados.";

      confirmButton.textContent = "Excluir conta";
    }

    modalOverlay.hidden = false;
    cancelButton.focus();
  }

  function openSessionExpiredModal() {
    if (currentAction === "session-expired") {
      return;
    }

    previousFocus = document.activeElement;
    currentAction = "session-expired";

    clearModalFeedback();

    modalTitle.textContent = "Sua sessão expirou";

    modalMessage.textContent =
      "Por segurança, sua sessão não está mais ativa. Entre novamente para continuar seus estudos.";

    setModalControlsForSessionExpired();

    modalOverlay.hidden = false;
    confirmButton.focus();
  }

  function setSubmittingState(submitting) {
    isSubmitting = submitting;

    confirmButton.disabled = submitting;
    cancelButton.disabled = submitting;
    closeButton.disabled = submitting;

    modal.setAttribute("aria-busy", String(submitting));

    if (submitting) {
      confirmButton.textContent = "Processando...";
      return;
    }

    if (currentAction === "session-expired") {
      confirmButton.textContent = "Ir para login";
    } else if (currentAction === "delete-account") {
      confirmButton.textContent = "Excluir conta";
    } else {
      confirmButton.textContent = "Sair";
    }
  }

  function closeModal() {
    if (modalOverlay.hidden || isSubmitting) {
      return;
    }

    if (currentAction === "session-expired") {
      return;
    }

    modalOverlay.hidden = true;

    clearModalFeedback();

    currentAction = null;

    if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
      previousFocus.focus();
    }

    previousFocus = null;
  }

  function redirectToLogin() {
    window.location.replace("auth.html?mode=login");
  }

  async function confirmAction() {
    if (!currentAction || isSubmitting) {
      return;
    }

    if (currentAction === "session-expired") {
      redirectToLogin();
      return;
    }

    const action = currentAction;

    setSubmittingState(true);
    clearModalFeedback();

    try {
      if (action === "logout") {
        await apiRequest("/logout", {
          method: "POST",
        });
      } else if (action === "delete-account") {
        await apiRequest("/users", {
          method: "DELETE",
        });
      }

      clearStoredProfileName();
      window.location.replace("index.html");
    } catch (error) {
      console.error(`[MEMORIZEZ] Erro ao executar ${action}:`, {
        status: error?.status ?? null,
        code: error?.code ?? null,
        data: error?.data ?? null,
      });

      if (error?.status === 401) {
        openSessionExpiredModal();
        return;
      }

      const communicationFailure = [
        "NETWORK_ERROR",
        "RESPONSE_READ_ERROR",
        "CSRF_CONNECTION_ERROR",
        "TIMEOUT_ERROR",
      ].includes(error?.code);

      let fallbackMessage;

      if (action === "delete-account") {
        fallbackMessage = communicationFailure
          ? "Não foi possível confirmar o resultado da exclusão devido a uma falha de comunicação. Verifique sua conexão antes de tentar novamente."
          : "Não foi possível excluir sua conta. Tente novamente.";
      } else {
        fallbackMessage = communicationFailure
          ? "Não foi possível confirmar o encerramento da sessão devido a uma falha de comunicação. Verifique sua conexão antes de tentar novamente."
          : "Não foi possível encerrar sua sessão. Tente novamente.";
      }

      showModalFeedback(getApiErrorMessage(error, fallbackMessage));
    } finally {
      setSubmittingState(false);
    }
  }

  function getFocusableElements() {
    const selector = [
      "button:not([disabled])",
      "a[href]",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
    ].join(",");

    return [...modal.querySelectorAll(selector)].filter(
      (element) => !element.hidden,
    );
  }

  document.querySelectorAll("[data-modal-open]").forEach((button) => {
    button.addEventListener("click", () => {
      openModal(button.dataset.modalOpen);
    });
  });

  confirmButton.addEventListener("click", confirmAction);
  closeButton.addEventListener("click", closeModal);
  cancelButton.addEventListener("click", closeModal);

  modalOverlay.addEventListener("click", (event) => {
    if (event.target === modalOverlay) {
      closeModal();
    }
  });

  privateLayoutKeydownHandler = (event) => {
    if (modalOverlay.hidden) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusableElements = getFocusableElements();

    if (focusableElements.length === 0) {
      event.preventDefault();
      modal.focus();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (
      event.shiftKey &&
      (document.activeElement === firstElement ||
        document.activeElement === modal)
    ) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (
      !event.shiftKey &&
      (document.activeElement === lastElement ||
        document.activeElement === modal)
    ) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  document.addEventListener("keydown", privateLayoutKeydownHandler);

  privateLayoutSessionExpiredHandler = () => {
    clearStoredProfileName();
    openSessionExpiredModal();
  };

  window.addEventListener(
    "memorizez:session-expired",
    privateLayoutSessionExpiredHandler,
  );

  const profileNames = document.querySelectorAll(".profile-name");

  if (profileNames.length > 0) {
    const cachedName = getStoredProfileName();

    if (cachedName) {
      profileNames.forEach((element) => {
        element.textContent = cachedName;
      });
    }

    try {
      const user = await apiRequest("/users/me");

      if (typeof user?.name === "string" && user.name.trim()) {
        const authenticatedName = user.name.trim();

        profileNames.forEach((element) => {
          element.textContent = authenticatedName;
        });

        saveProfileName(authenticatedName);
      }
    } catch (error) {
      if (error?.status === 401) {
        clearStoredProfileName();

        profileNames.forEach((element) => {
          element.textContent = "Meu perfil";
        });

        openSessionExpiredModal();
      }

      console.error(
        "[MEMORIZEZ] Não foi possível carregar os dados do usuário:",
        {
          status: error?.status ?? null,
          code: error?.code ?? null,
        },
      );
    }
  }
});
