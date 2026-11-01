document.addEventListener("DOMContentLoaded", async () => {
  const collectionsContainer = document.querySelector(
    "#free-study-collections",
  );

  if (!collectionsContainer) {
    return;
  }

  function createCollectionIcon() {
    const icon = document.createElement("div");
    icon.className = "free-study-collection-icon";
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

    return icon;
  }

  function createChevronIcon() {
    const icon = document.createElement("span");
    icon.className = "free-study-chevron";
    icon.setAttribute("aria-hidden", "true");

    icon.innerHTML = `
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m6 9 6 6 6-6"/>
      </svg>
    `;

    return icon;
  }

  function closeExpandedCollection() {
    const expandedCard = collectionsContainer.querySelector(
      ".free-study-collection.is-expanded",
    );

    if (!expandedCard) {
      return;
    }

    expandedCard.classList.remove("is-expanded");

    const expandedTrigger = expandedCard.querySelector(
      ".free-study-collection-trigger",
    );

    const expandedPanel = expandedCard.querySelector(
      ".free-study-collection-panel",
    );

    expandedTrigger.setAttribute("aria-expanded", "false");
    expandedPanel.setAttribute("aria-hidden", "true");
    expandedPanel.inert = true;
  }

  function createCollectionCard(collection, index) {
    const card = document.createElement("article");
    card.className = "free-study-collection";

    const trigger = document.createElement("button");
    trigger.className = "free-study-collection-trigger";
    trigger.type = "button";
    trigger.setAttribute("aria-expanded", "false");

    const panelId = `free-study-panel-${index}`;
    trigger.setAttribute("aria-controls", panelId);

    const info = document.createElement("div");
    info.className = "free-study-collection-info";

    const title = document.createElement("h2");
    title.className = "free-study-collection-name";
    title.textContent = collection.name;

    const count = document.createElement("p");
    count.className = "free-study-collection-count";

    const cardCount = collection.cardCount;

    count.textContent =
      cardCount === 1
        ? "1 cartão disponível para estudar."
        : `${cardCount} cartões disponíveis para estudar.`;

    info.append(title, count);

    trigger.append(createCollectionIcon(), info, createChevronIcon());

    const panel = document.createElement("div");
    panel.className = "free-study-collection-panel";
    panel.id = panelId;
    panel.setAttribute("aria-hidden", "true");
    panel.inert = true;

    const panelInner = document.createElement("div");
    panelInner.className = "free-study-collection-panel-inner";

    const content = document.createElement("div");
    content.className = "free-study-collection-content";

    const description = document.createElement("p");
    description.className = "free-study-collection-description";

    if (cardCount > 0) {
      description.textContent =
        cardCount === 1
          ? "Percorra o cartão desta coleção no seu próprio ritmo."
          : "Percorra os cartões desta coleção, um por vez, no seu próprio ritmo.";

      const startButton = document.createElement("button");
      startButton.className = "btn button-primary free-study-start-button";
      startButton.type = "button";
      startButton.textContent = "Estudar esta coleção";

      startButton.addEventListener("click", () => {
        window.location.href = `free-study-session.html?collectionId=${encodeURIComponent(collection.id)}`;
      });

      content.append(description, startButton);
    } else {
      description.textContent = "Esta coleção ainda não possui cartões.";

      const helper = document.createElement("p");
      helper.className = "free-study-collection-helper";
      helper.textContent = "Adicione cartões à coleção para começar a estudar.";

      content.append(description, helper);
    }

    panelInner.append(content);
    panel.append(panelInner);
    card.append(trigger, panel);

    trigger.addEventListener("click", () => {
      const isExpanded = trigger.getAttribute("aria-expanded") === "true";

      closeExpandedCollection();

      if (!isExpanded) {
        card.classList.add("is-expanded");
        trigger.setAttribute("aria-expanded", "true");
        panel.setAttribute("aria-hidden", "false");
        panel.inert = false;
      }
    });

    return card;
  }

  function showMessage(message, className) {
    const element = document.createElement("p");
    element.className = className;
    element.textContent = message;

    collectionsContainer.replaceChildren(element);
  }

  async function loadCollections() {
    collectionsContainer.replaceChildren();

    try {
      const collections = await apiRequest("/free-study/collections");

      if (!collections || collections.length === 0) {
        showMessage(
          "Você ainda não possui coleções para estudar.",
          "free-study-empty-message",
        );
        return;
      }

      const collectionCards = collections.map(createCollectionCard);

      collectionsContainer.replaceChildren(...collectionCards);
    } catch (error) {
      const message =
        error.status === 401 || error.status === 403
          ? "Sua sessão expirou. Entre novamente para acessar o estudo livre."
          : "Não foi possível carregar suas coleções. Tente novamente.";

      showMessage(message, "free-study-error-message");
    }
  }

  await loadCollections();
});
