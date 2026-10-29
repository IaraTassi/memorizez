document.addEventListener("DOMContentLoaded", () => {
  const collectionsList = document.getElementById("collectionsList");
  const feedback = document.getElementById("collectionsFeedback");

  const openFormButton = document.getElementById("createCollectionButton");
  const modalOverlay = document.getElementById("collection-modal-overlay");
  const modalTitle = document.getElementById("collection-modal-title");
  const modalDescription = document.getElementById(
    "collection-modal-description",
  );
  const form = document.getElementById("collection-form");
  const nameInput = document.getElementById("collection-name");
  const closeFormButton = document.getElementById("close-collection-form");
  const cancelFormButton = document.getElementById("cancel-collection-form");
  const saveButton = document.getElementById("save-collection");

  const deleteModalOverlay = document.getElementById(
    "delete-collection-modal-overlay",
  );
  const cancelDeleteButton = document.getElementById(
    "cancel-delete-collection",
  );
  const confirmDeleteButton = document.getElementById(
    "confirm-delete-collection",
  );

  let previousFocusedElement = null;
  let editingCollection = null;
  let deletingCollection = null;

  function showFeedback(message, type = "success") {
    feedback.textContent = message;
    feedback.dataset.type = type;
    feedback.hidden = false;
  }

  function clearFeedback() {
    feedback.textContent = "";
    feedback.hidden = true;
    delete feedback.dataset.type;
  }

  function openModal(collection = null) {
    previousFocusedElement = document.activeElement;
    editingCollection = collection;

    form.reset();
    clearFeedback();

    if (editingCollection) {
      modalTitle.textContent = "Editar coleção";
      modalDescription.textContent = "Altere o nome da sua coleção.";
      nameInput.value = editingCollection.name;
      saveButton.textContent = "Salvar alterações";
    } else {
      modalTitle.textContent = "Nova coleção";
      modalDescription.textContent =
        "Dê um nome à sua coleção para organizar seus cartões de estudo.";
      nameInput.value = "";
      saveButton.textContent = "Criar coleção";
    }

    modalOverlay.hidden = false;
    nameInput.focus();
  }

  function closeModal() {
    modalOverlay.hidden = true;
    form.reset();
    editingCollection = null;

    modalTitle.textContent = "Nova coleção";
    modalDescription.textContent =
      "Dê um nome à sua coleção para organizar seus cartões de estudo.";
    saveButton.textContent = "Criar coleção";

    if (previousFocusedElement) {
      previousFocusedElement.focus();
    }
  }

  function openDeleteModal(collection) {
    deletingCollection = collection;
    previousFocusedElement = document.activeElement;

    deleteModalOverlay.hidden = false;
    confirmDeleteButton.focus();
  }

  function closeDeleteModal() {
    deleteModalOverlay.hidden = true;
    deletingCollection = null;

    if (previousFocusedElement) {
      previousFocusedElement.focus();
    }
  }

  function formatDate(dateString) {
    if (!dateString) return "Data indisponível";

    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  }

  function createCollectionCard(collection) {
    const card = document.createElement("article");
    card.className = "collection-card";

    const header = document.createElement("div");
    header.className = "collection-card-header";

    const icon = document.createElement("div");
    icon.className = "collection-card-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = `
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
    >
      <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <path d="M3 10h18"/>
    </svg>
  `;

    const info = document.createElement("div");
    info.className = "collection-card-info";

    const title = document.createElement("h2");
    title.className = "collection-card-title";
    title.textContent = collection.name;

    const createdAt = document.createElement("p");
    createdAt.className = "collection-card-date";
    createdAt.textContent = `Criada em ${formatDate(collection.createdAt)}`;

    info.append(title, createdAt);

    const menu = document.createElement("details");
    menu.className = "collection-menu";

    const menuToggle = document.createElement("summary");
    menuToggle.setAttribute(
      "aria-label",
      `Ações da coleção ${collection.name}`,
    );
    menuToggle.innerHTML = `
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

    const menuItems = document.createElement("div");
    menuItems.className = "collection-menu-items";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "Editar coleção";

    editButton.addEventListener("click", () => {
      menu.open = false;
      openModal(collection);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Excluir coleção";
    deleteButton.addEventListener("click", () => {
      menu.open = false;
      openDeleteModal(collection);
    });

    menuItems.append(editButton, deleteButton);
    menu.append(menuToggle, menuItems);

    header.append(icon, info, menu);

    const divider = document.createElement("div");
    divider.className = "collection-card-divider";
    divider.setAttribute("aria-hidden", "true");

    function createStat(label, value) {
      const stat = document.createElement("div");
      stat.className = "collection-card-stat";

      const statLabel = document.createElement("span");
      statLabel.className = "collection-card-stat-label";
      statLabel.textContent = label;

      const statValue = document.createElement("span");
      statValue.className = "collection-card-stat-value";
      statValue.textContent = value;

      stat.append(statLabel, statValue);

      return stat;
    }

    const stats = document.createElement("div");
    stats.className = "collection-card-stats";

    stats.append(
      createStat("Total de cartões", collection.cardCount),
      createStat("Disponíveis para estudo", collection.availableCardCount),
    );

    const footer = document.createElement("div");
    footer.className = "collection-card-footer";

    const viewCardsLink = document.createElement("a");
    viewCardsLink.className = "collection-view-cards";
    viewCardsLink.textContent = "Ver cartões";

    viewCardsLink.href = `cards.html?collectionId=${encodeURIComponent(collection.id)}`;

    footer.appendChild(viewCardsLink);

    card.append(header, divider, stats, footer);

    return card;
  }

  function renderCollections(collections) {
    collectionsList.replaceChildren();

    if (collections.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "collections-empty";
      emptyMessage.textContent =
        "Você ainda não tem coleções. Crie sua primeira coleção para começar!";

      collectionsList.appendChild(emptyMessage);
      return;
    }

    const fragment = document.createDocumentFragment();

    collections.forEach((collection) => {
      fragment.appendChild(createCollectionCard(collection));
    });

    collectionsList.appendChild(fragment);
  }

  async function loadCollections() {
    collectionsList.replaceChildren();

    const loadingMessage = document.createElement("p");
    loadingMessage.textContent = "Carregando coleções...";
    collectionsList.appendChild(loadingMessage);

    try {
      const collections = await apiRequest("/collections");

      collections.sort((a, b) => {
        return b.createdAt.localeCompare(a.createdAt);
      });
      renderCollections(collections);
    } catch (error) {
      if (error.status === 401) {
        window.location.replace("index.html");
        return;
      }

      collectionsList.replaceChildren();

      const errorMessage = document.createElement("p");
      errorMessage.className = "collections-error";
      errorMessage.textContent =
        "Não foi possível carregar suas coleções. Tente novamente.";

      collectionsList.appendChild(errorMessage);
    }
  }

  openFormButton.addEventListener("click", () => openModal());
  closeFormButton.addEventListener("click", closeModal);
  cancelFormButton.addEventListener("click", closeModal);
  cancelDeleteButton.addEventListener("click", closeDeleteModal);

  deleteModalOverlay.addEventListener("click", (event) => {
    if (event.target === deleteModalOverlay) {
      closeDeleteModal();
    }
  });

  confirmDeleteButton.addEventListener("click", async () => {
    if (!deletingCollection) return;

    const collectionId = deletingCollection.id;

    confirmDeleteButton.disabled = true;
    confirmDeleteButton.textContent = "Excluindo...";

    try {
      await apiRequest(`/collections/${collectionId}`, {
        method: "DELETE",
      });

      closeDeleteModal();
      showFeedback("Coleção excluída com sucesso.");
      await loadCollections();
    } catch (error) {
      if (error.status === 401) {
        window.location.replace("index.html");
        return;
      }

      closeDeleteModal();
      showFeedback(
        error.status === 404
          ? "Esta coleção não foi encontrada. Atualize a página e tente novamente."
          : "Não foi possível excluir a coleção. Tente novamente.",
        "error",
      );
    } finally {
      confirmDeleteButton.disabled = false;
      confirmDeleteButton.textContent = "Excluir coleção";
    }
  });

  modalOverlay.addEventListener("click", (event) => {
    if (event.target === modalOverlay) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    if (!modalOverlay.hidden) {
      closeModal();
    } else if (!deleteModalOverlay.hidden) {
      closeDeleteModal();
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFeedback();

    const name = nameInput.value.trim();

    if (!name) {
      showFeedback("Informe um nome para a coleção.", "error");
      nameInput.focus();
      return;
    }

    saveButton.disabled = true;
    saveButton.textContent = editingCollection ? "Salvando..." : "Criando...";

    try {
      if (editingCollection) {
        await apiRequest(`/collections/${editingCollection.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name }),
        });
      } else {
        await apiRequest("/collections", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name }),
        });
      }

      const wasEditing = Boolean(editingCollection);

      closeModal();

      showFeedback(
        wasEditing
          ? "Coleção atualizada com sucesso."
          : "Coleção criada com sucesso.",
      );

      await loadCollections();
    } catch (error) {
      if (error.status === 401) {
        window.location.replace("index.html");
        return;
      }

      if (error.status === 404 && editingCollection) {
        showFeedback(
          "Esta coleção não foi encontrada. Atualize a página e tente novamente.",
          "error",
        );
      } else if (error.status === 400) {
        showFeedback(
          editingCollection
            ? "Não foi possível atualizar a coleção. Confira o nome e tente novamente."
            : "Não foi possível criar a coleção. Confira o nome e tente novamente.",
          "error",
        );
      } else {
        showFeedback(
          editingCollection
            ? "Ocorreu um erro ao atualizar a coleção. Tente novamente."
            : "Ocorreu um erro ao criar a coleção. Tente novamente.",
          "error",
        );
      }
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = "Criar coleção";
    }
  });

  loadCollections();
});
