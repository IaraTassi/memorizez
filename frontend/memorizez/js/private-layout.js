document.addEventListener("DOMContentLoaded", async () => {
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

  const modalOverlay = document.querySelector(".modal-overlay");

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

  let currentAction = null;

  confirmButton.addEventListener("click", async () => {
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
  });

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
