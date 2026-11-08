document.addEventListener("DOMContentLoaded", async () => {
  CardModals.render();

  const pageTitle = document.querySelector("#pageTitle");
  const cardCreatedAt = document.querySelector("#cardCreatedAt");
  const cardDetailsContent = document.querySelector("#cardDetailsContent");
  const cardDetailsFeedback = document.querySelector("#cardDetailsFeedback");
  const backToCards = document.querySelector("#backToCards");
  const cardDetailsFooter = document.querySelector(".card-details-footer");
  const cardDetailsActions = document.querySelector("#cardDetailsActions");
  const editCardButton = document.querySelector("#editCardButton");
  const deleteCardButton = document.querySelector("#deleteCardButton");

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
  const closeDeleteCardButton = document.querySelector("#close-delete-card");
  const cancelDeleteCardButton = document.querySelector("#cancel-delete-card");
  const confirmDeleteCardButton = document.querySelector(
    "#confirm-delete-card",
  );

  const params = new URLSearchParams(window.location.search);
  const collectionId = params.get("collectionId");
  const cardId = params.get("cardId");

  let currentCard = null;

  function showFeedback(message, type = "") {
    cardDetailsFeedback.textContent = message;
    cardDetailsFeedback.className = "cards-feedback";

    if (type) {
      cardDetailsFeedback.classList.add(`cards-${type}`);
    }

    cardDetailsFeedback.hidden = false;
  }

  function hideFeedback() {
    cardDetailsFeedback.textContent = "";
    cardDetailsFeedback.className = "cards-feedback";
    cardDetailsFeedback.hidden = true;
  }

  function formatDate(dateString, includeTime = false) {
    if (!dateString) {
      return null;
    }

    const [datePart, timePart] = dateString.split("T");
    const [year, month, day] = datePart.split("-");

    const formattedDate = `${day}/${month}/${year}`;

    if (!includeTime || !timePart) {
      return formattedDate;
    }

    const [hours, minutes] = timePart.split(":");

    return `${formattedDate} às ${hours}:${minutes}`;
  }

  function createField(title, value) {
    const section = document.createElement("section");
    section.className = "card-details-field";

    const heading = document.createElement("h2");
    heading.textContent = title.toUpperCase();

    const paragraph = document.createElement("p");
    paragraph.textContent = value || "Nenhuma informação registrada.";

    section.append(heading, paragraph);

    return section;
  }

  function renderCard(card) {
    const panel = document.createElement("article");
    panel.className = "card-details-panel";

    panel.append(
      createField("Frente", card.front),
      createField("Verso", card.back),
      createField("Notas", card.notes),
    );

    cardCreatedAt.textContent = `Criado em ${formatDate(card.createdAt)}`;
    cardCreatedAt.hidden = false;

    cardDetailsActions.hidden = false;

    panel.append(cardDetailsFooter);

    cardDetailsContent.replaceChildren(panel);
  }

  function openEditModal() {
    if (!currentCard || !cardModalOverlay || !cardModal) return;

    hideFeedback();

    cardModalTitle.textContent = "Editar cartão";
    cardModalDescription.textContent = "Atualize as informações deste cartão.";
    cardEditWarning.hidden = false;

    cardFront.value = currentCard.front;
    cardBack.value = currentCard.back;
    cardNotes.value = currentCard.notes || "";

    saveCardButton.textContent = "Salvar alterações";
    cardModalOverlay.hidden = false;
    cardModal.focus();
    cardFront.focus();
  }

  function closeEditModal() {
    if (!cardModalOverlay) return;

    cardModalOverlay.hidden = true;
    cardForm?.reset();

    cardModalTitle.textContent = "Editar cartão";
    cardModalDescription.textContent = "Atualize as informações deste cartão.";
    cardEditWarning.hidden = true;
    saveCardButton.textContent = "Salvar alterações";
    saveCardButton.disabled = false;

    editCardButton?.focus();
  }

  function openDeleteModal() {
    if (!currentCard || !deleteCardOverlay) return;

    hideFeedback();
    deleteCardOverlay.hidden = false;
    deleteCardOverlay.querySelector(".confirmation-modal")?.focus();
  }

  function closeDeleteModal() {
    if (!deleteCardOverlay) return;

    deleteCardOverlay.hidden = true;
    confirmDeleteCardButton.disabled = false;

    deleteCardButton?.focus();
  }

  async function loadDetails() {
    const [collections, cardsPage] = await Promise.all([
      apiRequest("/collections"),
      apiRequest(
        `/collections/${encodeURIComponent(collectionId)}/cards?page=0&size=100`,
      ),
    ]);

    const collection = collections.find(
      (item) => String(item.id) === collectionId,
    );

    if (!collection) {
      throw new Error("Coleção não encontrada.");
    }

    currentCard = cardsPage.content?.find((item) => String(item.id) === cardId);

    if (!currentCard) {
      throw new Error("Cartão não encontrado nesta coleção.");
    }

    pageTitle.textContent = collection.name;
    renderCard(currentCard);
  }

  if (
    !pageTitle ||
    !cardCreatedAt ||
    !cardDetailsContent ||
    !cardDetailsFeedback ||
    !cardDetailsActions ||
    !cardForm ||
    !cardFront ||
    !cardBack ||
    !cardNotes ||
    !cardModalOverlay ||
    !cardModal ||
    !cardModalTitle ||
    !cardModalDescription ||
    !cardEditWarning ||
    !saveCardButton ||
    !deleteCardOverlay ||
    !confirmDeleteCardButton
  ) {
    console.error("Não foi possível encontrar os elementos da página.");
    return;
  }

  if (!collectionId || !cardId) {
    pageTitle.textContent = "Cartão não informado";
    cardDetailsContent.replaceChildren();

    const message = document.createElement("p");
    message.textContent = "Acesse esta página a partir de uma coleção.";
    cardDetailsContent.append(message);

    return;
  }

  backToCards?.setAttribute(
    "href",
    `cards.html?collectionId=${encodeURIComponent(collectionId)}`,
  );

  editCardButton?.addEventListener("click", openEditModal);
  closeCardFormButton?.addEventListener("click", closeEditModal);
  cancelCardFormButton?.addEventListener("click", closeEditModal);

  cardModalOverlay.addEventListener("click", (event) => {
    if (event.target === cardModalOverlay) {
      closeEditModal();
    }
  });

  deleteCardButton?.addEventListener("click", openDeleteModal);
  cancelDeleteCardButton?.addEventListener("click", closeDeleteModal);
  closeDeleteCardButton?.addEventListener("click", closeDeleteModal);

  deleteCardOverlay.addEventListener("click", (event) => {
    if (event.target === deleteCardOverlay) {
      closeDeleteModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    if (!cardModalOverlay.hidden) {
      closeEditModal();
    } else if (!deleteCardOverlay.hidden) {
      closeDeleteModal();
    }
  });

  cardForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!currentCard) return;

    const front = cardFront.value.trim();
    const back = cardBack.value.trim();
    const notes = cardNotes.value.trim();

    if (!front || !back) {
      showFeedback("Preencha a frente e o verso do cartão.", "error");
      return;
    }

    saveCardButton.disabled = true;

    try {
      await apiRequest(
        `/collections/${encodeURIComponent(collectionId)}/cards/${encodeURIComponent(currentCard.id)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ front, back, notes }),
        },
      );

      await loadDetails();
      closeEditModal();

      showFeedback("Cartão atualizado com sucesso.", "success");
    } catch (error) {
      console.error("Não foi possível atualizar o cartão:", error);

      if (error.status === 401) {
        window.location.replace("index.html");
        return;
      }

      showFeedback(
        error.status === 400
          ? "Verifique os campos e tente novamente."
          : "Não foi possível atualizar o cartão. Tente novamente.",
        "error",
      );
    } finally {
      saveCardButton.disabled = false;
    }
  });

  confirmDeleteCardButton.addEventListener("click", async () => {
    if (!currentCard) return;

    confirmDeleteCardButton.disabled = true;

    try {
      await apiRequest(
        `/collections/${encodeURIComponent(collectionId)}/cards/${encodeURIComponent(currentCard.id)}`,
        { method: "DELETE" },
      );

      window.location.href = `cards.html?collectionId=${encodeURIComponent(collectionId)}`;
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

      confirmDeleteCardButton.disabled = false;
    }
  });

  try {
    await loadDetails();
  } catch (error) {
    console.error("Não foi possível carregar os detalhes:", error);

    if (error.status === 401) {
      window.location.replace("index.html");
      return;
    }

    pageTitle.textContent = "Detalhes indisponíveis";
    cardDetailsContent.replaceChildren();

    const message = document.createElement("p");
    message.textContent = "Não foi possível carregar este cartão.";
    cardDetailsContent.append(message);

    showFeedback(
      error.message === "Cartão não encontrado nesta coleção." ||
        error.message === "Coleção não encontrada."
        ? error.message
        : "Ocorreu um erro ao carregar o cartão. Tente novamente.",
      "error",
    );
  }
});
