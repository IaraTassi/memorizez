document.addEventListener("DOMContentLoaded", async () => {
  function renderPrivateHeader() {
    if (document.querySelector("#private-header")) return;

    const currentPage = document.body.dataset.page;

    const navigationLinks = [
      { page: "collections", href: "collections.html", label: "Coleções" },
      { page: "review", href: "review.html", label: "Revisão" },
      { page: "free-study", href: "free-study.html", label: "Estudo livre" },
      { page: "history", href: "history.html", label: "Histórico" },
    ];

    const linksHTML = navigationLinks
      .map((link) => {
        const isCurrentPage = link.page === currentPage;

        return `
          <a
            href="${link.href}"
            ${isCurrentPage ? 'aria-current="page"' : ""}
          >
            ${link.label}
          </a>
        `;
      })
      .join("");

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
            <div class="dropdown">
              <button
                class="profile-button dropdown-toggle p-0 border-0 bg-transparent d-flex align-items-center"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
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
          </div>
        </header>
      </div>
    `;

    document.body.insertAdjacentHTML("afterbegin", headerHTML);
  }

  function renderPrivateFooter() {
    if (document.querySelector("#private-footer")) return;

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

        <span>© 2026 Todos os direitos reservados.</span>
      </div>
    </footer>
  `;

    document.body.insertAdjacentHTML("beforeend", footerHTML);
  }

  function renderAccountModal() {
    if (document.querySelector("#account-confirmation-overlay")) return;

    const modalHTML = `
    <div class="modal-overlay" id="account-confirmation-overlay" hidden>
      <section
        class="confirmation-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
        aria-describedby="confirmation-message"
        tabindex="-1"
      >
        <button class="modal-close" type="button" aria-label="Fechar janela">
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

        <h2 class="modal-title" id="confirmation-title">Deseja sair?</h2>

        <p class="modal-message" id="confirmation-message">
          Sua sessão será encerrada. Você precisará entrar novamente para
          acessar suas coleções e seus estudos.
        </p>

        <div class="modal-actions">
          <button class="btn button-secondary modal-cancel" type="button">
            Cancelar
          </button>

          <button class="btn button-primary modal-confirm" type="button">
            Sair
          </button>
        </div>
      </section>
    </div>
  `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
  }

  renderPrivateHeader();
  renderPrivateFooter();
  renderAccountModal();

  const profileName = document.querySelector(".profile-name");

  if (profileName) {
    try {
      const user = await apiRequest("/users/me");
      profileName.textContent = user.name;
    } catch (error) {
      console.error("Não foi possível carregar os dados do usuário:", error);

      if (error.status === 401) {
        window.location.replace("index.html");
        return;
      }
    }
  }

  const modalOverlay = document.querySelector("#account-confirmation-overlay");

  if (!modalOverlay) return;

  const modal = modalOverlay.querySelector(".confirmation-modal");
  const closeButton = modalOverlay.querySelector(".modal-close");
  const cancelButton = modalOverlay.querySelector(".modal-cancel");
  const confirmButton = modalOverlay.querySelector(".modal-confirm");
  const modalTitle = modalOverlay.querySelector(".modal-title");
  const modalMessage = modalOverlay.querySelector(".modal-message");

  if (
    !modal ||
    !closeButton ||
    !cancelButton ||
    !confirmButton ||
    !modalTitle ||
    !modalMessage
  ) {
    return;
  }

  let previousFocus = null;
  let currentAction = null;

  function openModal(type) {
    if (!["logout", "delete-account"].includes(type)) return;

    previousFocus = document.activeElement;
    currentAction = type;

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
    modal.focus();
  }

  async function confirmAction() {
    if (!currentAction) return;

    confirmButton.disabled = true;

    try {
      if (currentAction === "logout") {
        await apiRequest("/logout", {
          method: "POST",
        });
      } else if (currentAction === "delete-account") {
        await apiRequest("/users", {
          method: "DELETE",
        });
      }

      window.location.replace("index.html");
    } catch (error) {
      console.error("Erro ao executar a ação:", error);

      alert(
        currentAction === "delete-account"
          ? "Não foi possível excluir sua conta. Tente novamente."
          : "Não foi possível encerrar a sessão. Tente novamente.",
      );
    } finally {
      confirmButton.disabled = false;
    }
  }

  function closeModal() {
    if (modalOverlay.hidden) return;

    modalOverlay.hidden = true;

    if (previousFocus instanceof HTMLElement) {
      previousFocus.focus();
    }
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

  document.addEventListener("keydown", (event) => {
    if (modalOverlay.hidden) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
      return;
    }

    if (event.key !== "Tab") return;

    const focusableElements = modal.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );

    const elements = [...focusableElements].filter(
      (element) => element.getClientRects().length > 0,
    );

    if (elements.length === 0) {
      event.preventDefault();
      modal.focus();
      return;
    }

    const firstElement = elements[0];
    const lastElement = elements[elements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  });
});
