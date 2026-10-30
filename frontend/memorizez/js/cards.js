document.addEventListener("DOMContentLoaded", async () => {
  const pageTitle = document.querySelector("#pageTitle");
  const collectionDescription = document.querySelector(
    "#collectionDescription",
  );
  const cardsList = document.querySelector("#cardsList");
  const cardsFeedback = document.querySelector("#cardsFeedback");
  const createCardButton = document.querySelector("#createCardButton");

  const cardModalOverlay = document.querySelector("#card-modal-overlay");
  const cardModal = cardModalOverlay?.querySelector(".card-modal");
  const cardForm = document.querySelector("#card-form");
  const closeCardFormButton = document.querySelector("#close-card-form");
  const cancelCardFormButton = document.querySelector("#cancel-card-form");
  const cardFront = document.querySelector("#card-front");
  const cardBack = document.querySelector("#card-back");
  const cardNotes = document.querySelector("#card-notes");
  const cardModalTitle = document.querySelector("#card-modal-title");
  const cardModalDescription = document.querySelector(
    "#card-modal-description",
  );
  const cardEditWarning = document.querySelector("#card-edit-warning");
  const saveCardButton = document.querySelector("#save-card");

  const deleteCardOverlay = document.querySelector("#delete-card-overlay");
  const cancelDeleteCardButton = document.querySelector("#cancel-delete-card");
  const confirmDeleteCardButton = document.querySelector(
    "#confirm-delete-card",
  );

  let editingCard = null;
  let deletingCard = null;
  let loadedCards = [];

  const params = new URLSearchParams(window.location.search);
  const collectionId = params.get("collectionId");

  if (!pageTitle || !collectionDescription || !cardsList || !cardsFeedback) {
    console.error("Não foi possível encontrar os elementos da página.");
    return;
  }

  function showFeedback(message, type = "") {
    cardsFeedback.textContent = message;
    cardsFeedback.className = "cards-feedback";

    if (type) {
      cardsFeedback.classList.add(`cards-${type}`);
    }

    cardsFeedback.hidden = false;
  }

  function hideFeedback() {
    cardsFeedback.textContent = "";
    cardsFeedback.hidden = true;
    cardsFeedback.className = "cards-feedback";
  }

  function showMessage(message) {
    const paragraph = document.createElement("p");
    paragraph.textContent = message;

    cardsList.replaceChildren(paragraph);
  }

  function formatDate(date) {
    if (!date) return "Data indisponível";

    const [year, month, day] = date.split("-");

    if (!year || !month || !day) return "Data indisponível";

    return `${day}/${month}/${year}`;
  }

  async function loadCollection() {
    const collections = await apiRequest("/collections");

    const collection = collections.find((item) => item.id === collectionId);

    if (!collection) {
      throw new Error("Coleção não encontrada.");
    }

    pageTitle.textContent = collection.name;
    collectionDescription.textContent = `Criada em ${formatDate(collection.createdAt)}`;
    collectionDescription.hidden = false;
  }

  function openCardModal() {
    if (!cardModalOverlay || !cardModal) return;

    cardModalOverlay.hidden = false;
    cardModal.focus();
  }

  function closeCardModal() {
    if (!cardModalOverlay) return;

    cardModalOverlay.hidden = true;
    cardForm?.reset();

    editingCard = null;

    if (cardModalTitle) {
      cardModalTitle.textContent = "Novo cartão";
    }

    if (cardModalDescription) {
      cardModalDescription.textContent =
        "Preencha a frente e o verso do cartão. As observações são opcionais.";
    }

    if (cardEditWarning) {
      cardEditWarning.hidden = true;
    }

    if (saveCardButton) {
      saveCardButton.textContent = "Criar cartão";
    }

    createCardButton?.focus();
  }

  function prepareEditCard(card) {
    editingCard = card;

    cardModalTitle.textContent = "Editar cartão";
    cardModalDescription.textContent = "Atualize as informações deste cartão.";
    cardEditWarning.hidden = false;

    cardFront.value = card.front;
    cardBack.value = card.back;
    cardNotes.value = card.notes || "";

    saveCardButton.textContent = "Salvar alterações";

    openCardModal();
  }

  if (createCardButton && cardModalOverlay && cardModal) {
    createCardButton.addEventListener("click", openCardModal);

    closeCardFormButton?.addEventListener("click", closeCardModal);
    cancelCardFormButton?.addEventListener("click", closeCardModal);

    cardModalOverlay.addEventListener("click", (event) => {
      if (event.target === cardModalOverlay) {
        closeCardModal();
      }
    });
  }

  if (cardForm) {
    cardForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!collectionId) {
        showFeedback("Não foi possível identificar a coleção.", "error");
        return;
      }

      const front = cardFront.value.trim();
      const back = cardBack.value.trim();
      const notes = cardNotes.value.trim();

      if (!front || !back) {
        showFeedback("Preencha a frente e o verso do cartão.", "error");
        return;
      }

      saveCardButton.disabled = true;

      try {
        const isEditing = editingCard !== null;

        const path = isEditing
          ? `/collections/${encodeURIComponent(collectionId)}/cards/${encodeURIComponent(editingCard.id)}`
          : `/collections/${encodeURIComponent(collectionId)}/cards`;

        await apiRequest(path, {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            front,
            back,
            notes,
          }),
        });

        closeCardModal();
        await loadCards();

        showFeedback(
          isEditing
            ? "Cartão atualizado com sucesso."
            : "Cartão criado com sucesso.",
          "success",
        );
      } catch (error) {
        console.error("Não foi possível salvar o cartão:", error);

        if (error.status === 401) {
          window.location.replace("index.html");
          return;
        }

        showFeedback(
          error.status === 400
            ? "Verifique os campos e tente novamente."
            : "Não foi possível salvar o cartão. Tente novamente.",
          "error",
        );
      } finally {
        saveCardButton.disabled = false;
      }
    });
  }

  function closeDeleteCardModal() {
    if (!deleteCardOverlay) return;

    deleteCardOverlay.hidden = true;
    deletingCard = null;

    createCardButton?.focus();
  }

  cancelDeleteCardButton?.addEventListener("click", closeDeleteCardModal);

  deleteCardOverlay?.addEventListener("click", (event) => {
    if (event.target === deleteCardOverlay) {
      closeDeleteCardModal();
    }
  });

  confirmDeleteCardButton?.addEventListener("click", async () => {
    if (!deletingCard || !collectionId) return;

    confirmDeleteCardButton.disabled = true;

    try {
      await apiRequest(
        `/collections/${encodeURIComponent(collectionId)}/cards/${encodeURIComponent(deletingCard.id)}`,
        {
          method: "DELETE",
        },
      );

      closeDeleteCardModal();
      await loadCards();

      showFeedback("Cartão excluído com sucesso.", "success");
    } catch (error) {
      console.error("Não foi possível excluir o cartão:", error);

      if (error.status === 401) {
        window.location.replace("index.html");
        return;
      }

      showFeedback(
        "Não foi possível excluir o cartão. Tente novamente.",
        "error",
      );
    } finally {
      confirmDeleteCardButton.disabled = false;
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    if (cardModalOverlay && !cardModalOverlay.hidden) {
      closeCardModal();
      return;
    }

    if (deleteCardOverlay && !deleteCardOverlay.hidden) {
      closeDeleteCardModal();
    }
  });

  function createCardItem(card) {
    const item = document.createElement("article");
    item.className = "card-item";
    item.tabIndex = 0;
    item.setAttribute("role", "link");
    item.setAttribute("aria-label", `Abrir cartão: ${card.front}`);

    const content = document.createElement("div");
    content.className = "card-item-content";

    const front = document.createElement("p");
    front.className = "card-item-front";
    front.textContent = card.front;

    const date = document.createElement("p");
    date.className = "card-item-date";
    date.textContent = `Criado em ${formatDate(card.createdAt)}`;

    content.append(front, date);

    const menuContainer = document.createElement("details");
    menuContainer.className = "card-menu";

    const menuButton = document.createElement("summary");
    menuButton.setAttribute("aria-label", `Ações do cartão: ${card.front}`);
    menuButton.setAttribute("title", "Ações do cartão");

    menuButton.innerHTML = `
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <circle cx="12" cy="5" r="1.7"/>
        <circle cx="12" cy="12" r="1.7"/>
        <circle cx="12" cy="19" r="1.7"/>
      </svg>
    `;

    const menu = document.createElement("div");
    menu.className = "card-menu-items";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "Editar";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Excluir";

    menu.append(editButton, deleteButton);
    menuContainer.append(menuButton, menu);
    item.append(content, menuContainer);

    function openCard() {
      const url = new URL("card-details.html", window.location.href);
      url.searchParams.set("collectionId", collectionId);
      url.searchParams.set("cardId", card.id);

      window.location.href = url.href;
    }

    item.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;

      openCard();
    });

    item.addEventListener("keydown", (event) => {
      if (
        event.target === item &&
        (event.key === "Enter" || event.key === " ")
      ) {
        event.preventDefault();
        openCard();
      }
    });

    menuContainer.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    editButton.addEventListener("click", () => {
      menuContainer.open = false;
      prepareEditCard(card);
    });

    deleteButton.addEventListener("click", () => {
      menuContainer.open = false;
      deletingCard = card;

      if (!deleteCardOverlay) {
        console.error("Modal de exclusão não encontrado no HTML.");
        return;
      }

      deleteCardOverlay.hidden = false;
      deleteCardOverlay.querySelector(".confirmation-modal")?.focus();
    });

    return item;
  }

  async function loadCards() {
    hideFeedback();
    showMessage("Carregando cartões...");

    try {
      const page = await apiRequest(
        `/collections/${encodeURIComponent(collectionId)}/cards?page=0&size=100`,
      );

      const cards = page.content;

      if (!Array.isArray(cards)) {
        throw new Error("Formato inesperado ao carregar os cartões.");
      }

      loadedCards = cards;

      if (cards.length === 0 && page.totalElements === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "cards-empty";
        emptyMessage.textContent =
          "Você ainda não tem cartões nesta coleção. Crie seu primeiro cartão para começar a estudar!";

        cardsList.replaceChildren(emptyMessage);
        return;
      }

      const fragment = document.createDocumentFragment();

      cards.forEach((card) => {
        fragment.append(createCardItem(card));
      });

      cardsList.replaceChildren(fragment);

      if (page.totalPages > 1) {
        showFeedback(
          `Exibindo ${cards.length} cartões desta página. Há mais cartões nesta coleção.`,
        );
      }
    } catch (error) {
      console.error("Não foi possível carregar os cartões:", error);

      if (error.status === 401) {
        window.location.replace("index.html");
        return;
      }

      showMessage("Não foi possível carregar os cartões.");
      showFeedback(
        error.message === "Formato inesperado ao carregar os cartões."
          ? error.message
          : "Ocorreu um erro ao carregar os cartões. Tente novamente.",
        "error",
      );
    }
  }

  if (!collectionId) {
    pageTitle.textContent = "Coleção não informada";
    collectionDescription.hidden = true;
    showMessage("Acesse esta página a partir de uma coleção.");
    return;
  }

  try {
    await loadCollection();
    await loadCards();

    const editCardId = params.get("editCardId");

    if (editCardId) {
      const card = loadedCards.find((item) => String(item.id) === editCardId);

      if (card) {
        prepareEditCard(card);
      } else {
        showFeedback(
          "Não foi possível encontrar o cartão para edição.",
          "error",
        );
      }
    }
  } catch (error) {
    console.error("Não foi possível carregar a coleção:", error);

    if (error.status === 401) {
      window.location.replace("index.html");
      return;
    }

    pageTitle.textContent = "Coleção indisponível";
    collectionDescription.hidden = true;
    showMessage("Não foi possível carregar esta coleção.");
    showFeedback("Verifique se a coleção existe e tente novamente.", "error");
  }
});
