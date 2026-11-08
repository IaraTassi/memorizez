document.addEventListener("DOMContentLoaded", () => {
  const cardsContainer = document.getElementById("history-cards-list");
  const collectionNameElement = document.getElementById("pageTitle");

  const params = new URLSearchParams(window.location.search);
  const collectionId = params.get("collectionId");

  const pageSize = 20;
  let currentPage = 0;

  function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    if (text !== undefined) {
      element.textContent = text;
    }

    return element;
  }

  function createCounter(label, value, className) {
    const counter = createElement("span", `history-card-counter ${className}`);

    const count = createElement("strong", "history-card-counter-value", value);
    const text = createElement("span", "history-card-counter-label", label);

    counter.append(count, text);

    return counter;
  }

  function createCardRow(card) {
    const row = createElement("button", "history-card-row");
    row.type = "button";

    row.addEventListener("click", () => {
      const destination = new URL(
        "history-card-details.html",
        window.location.href,
      );

      destination.searchParams.set("collectionId", collectionId);
      destination.searchParams.set("cardId", card.id);

      window.location.href = destination.href;
    });

    const front = createElement("span", "history-card-front", card.front);

    const counters = createElement("span", "history-card-counters");

    counters.append(
      createCounter("Edições", card.editCount, "history-card-counter-edits"),
      createCounter(
        "Lembrei",
        card.rememberedCount,
        "history-card-counter-remembered",
      ),
      createCounter(
        "Não lembrei",
        card.notRememberedCount,
        "history-card-counter-not-remembered",
      ),
    );

    const action = createElement("span", "history-card-action", "Ver timeline");

    row.append(front, counters, action);

    return row;
  }

  function showMessage(message, className) {
    const paragraph = createElement("p", className, message);
    cardsContainer.replaceChildren(paragraph);
  }

  function createPagination(page) {
    if (page.totalPages <= 1) {
      return null;
    }

    const pagination = createElement("nav", "history-cards-pagination");
    pagination.setAttribute("aria-label", "Paginação do histórico");

    const previousButton = createElement(
      "button",
      "history-cards-pagination-button",
      "Anterior",
    );

    previousButton.type = "button";
    previousButton.disabled = page.first;
    previousButton.addEventListener("click", () => {
      loadCards(currentPage - 1);
    });

    const pageInformation = createElement(
      "span",
      "history-cards-pagination-info",
      `Página ${page.number + 1} de ${page.totalPages}`,
    );

    const nextButton = createElement(
      "button",
      "history-cards-pagination-button",
      "Próxima",
    );

    nextButton.type = "button";
    nextButton.disabled = page.last;
    nextButton.addEventListener("click", () => {
      loadCards(currentPage + 1);
    });

    pagination.append(previousButton, pageInformation, nextButton);

    return pagination;
  }

  async function loadCollectionName() {
    const collections = await apiRequest("/history/collections");

    if (!Array.isArray(collections)) {
      throw new Error("Resposta inesperada ao carregar as coleções.");
    }

    const collection = collections.find(
      (item) => String(item.id) === collectionId,
    );

    if (!collection) {
      throw new Error("Coleção não encontrada.");
    }

    collectionNameElement.textContent = collection.name;
  }

  async function loadCards(pageNumber = 0) {
    currentPage = pageNumber;
    showMessage("Carregando cartões...", "history-cards-message");

    try {
      const page = await apiRequest(
        `/history/collections/${encodeURIComponent(collectionId)}/cards?page=${pageNumber}&size=${pageSize}`,
      );

      if (!page || !Array.isArray(page.content)) {
        throw new Error("Resposta inesperada ao carregar os cartões.");
      }

      if (page.content.length === 0 && page.totalElements === 0) {
        showMessage(
          "Esta coleção ainda não possui cartões.",
          "history-cards-empty-message",
        );
        return;
      }

      const fragment = document.createDocumentFragment();

      page.content.forEach((card) => {
        fragment.append(createCardRow(card));
      });

      const pagination = createPagination(page);

      if (pagination) {
        fragment.append(pagination);
      }

      cardsContainer.replaceChildren(fragment);
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        showMessage(
          "Sua sessão expirou. Faça login novamente para consultar o histórico.",
          "history-cards-error-message",
        );
        return;
      }

      showMessage(
        "Não foi possível carregar os cartões. Tente novamente.",
        "history-cards-error-message",
      );
    }
  }

  async function initialize() {
    if (!collectionId) {
      showMessage(
        "Não foi possível identificar a coleção selecionada.",
        "history-cards-error-message",
      );
      return;
    }

    try {
      await loadCollectionName();
      await loadCards();
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        showMessage(
          "Sua sessão expirou. Faça login novamente para consultar o histórico.",
          "history-cards-error-message",
        );
        return;
      }

      showMessage(
        "Não foi possível carregar os dados da coleção.",
        "history-cards-error-message",
      );
    }
  }

  initialize();
});
