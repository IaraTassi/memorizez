document.addEventListener("DOMContentLoaded", () => {
  const pageTitle = document.getElementById("pageTitle");
  const nextReviewDate = document.getElementById("nextReviewDate");
  const timelineContainer = document.getElementById("history-card-timeline");

  const params = new URLSearchParams(window.location.search);
  const collectionId = params.get("collectionId");
  const cardId = params.get("cardId");

  const pageSize = 20;
  let currentPage = 0;
  let cardCreatedAt = null;

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

  function showMessage(container, message, className) {
    const paragraph = createElement("p", className, message);
    container.replaceChildren(paragraph);
  }

  function renderNextReview(date) {
    nextReviewDate.textContent = date
      ? formatDate(date)
      : "Ainda não há uma próxima revisão agendada.";
  }

  function getActionDetails(action) {
    const actions = {
      EDITED: {
        label: "Cartão editado",
        className: "history-timeline-event-edited",
      },
      REMEMBERED: {
        label: "Lembrei",
        className: "history-timeline-event-remembered",
      },
      NOT_REMEMBERED: {
        label: "Não lembrei",
        className: "history-timeline-event-not-remembered",
      },
    };

    return actions[action] || null;
  }

  function createTimelineEvent(event) {
    const details = getActionDetails(event.action);

    if (!details) {
      return null;
    }

    const item = createElement(
      "article",
      `history-timeline-event ${details.className}`,
    );

    const marker = createElement("span", "history-timeline-marker");
    marker.setAttribute("aria-hidden", "true");

    const content = createElement("div", "history-timeline-content");

    const title = createElement(
      "h3",
      "history-timeline-event-title",
      details.label,
    );

    const date = createElement(
      "p",
      "history-timeline-event-date",
      formatDate(event.createdAt, true),
    );

    content.append(title, date);
    item.append(marker, content);

    return item;
  }

  function createCreationEvent(date) {
    const item = createElement(
      "article",
      "history-timeline-event history-timeline-event-created",
    );

    const marker = createElement("span", "history-timeline-marker");
    marker.setAttribute("aria-hidden", "true");

    const content = createElement("div", "history-timeline-content");

    const title = createElement(
      "h3",
      "history-timeline-event-title",
      "Cartão criado",
    );

    const formattedDate = createElement(
      "p",
      "history-timeline-event-date",
      formatDate(date),
    );

    content.append(title, formattedDate);
    item.append(marker, content);

    return item;
  }

  function createPagination(page) {
    if (page.totalPages <= 1) {
      return null;
    }

    const pagination = createElement("nav", "history-timeline-pagination");

    pagination.setAttribute("aria-label", "Paginação da linha do tempo");

    const previousButton = createElement(
      "button",
      "history-timeline-pagination-button",
      "Anterior",
    );

    previousButton.type = "button";
    previousButton.disabled = page.first;

    previousButton.addEventListener("click", () => {
      loadTimeline(currentPage - 1);
    });

    const information = createElement(
      "span",
      "history-timeline-pagination-info",
      `Página ${page.number + 1} de ${page.totalPages}`,
    );

    const nextButton = createElement(
      "button",
      "history-timeline-pagination-button",
      "Próxima",
    );

    nextButton.type = "button";
    nextButton.disabled = page.last;

    nextButton.addEventListener("click", () => {
      loadTimeline(currentPage + 1);
    });

    pagination.append(previousButton, information, nextButton);

    return pagination;
  }

  async function loadCardDetails() {
    const card = await apiRequest(
      `/history/collections/${encodeURIComponent(collectionId)}/cards/${encodeURIComponent(cardId)}`,
    );

    if (!card) {
      throw new Error("Cartão não encontrado.");
    }

    pageTitle.textContent = card.front;
    renderNextReview(card.nextReviewDate);
    cardCreatedAt = card.createdAt;

    return card;
  }

  const backLink = document.querySelector(".page-back-link");

  if (backLink && collectionId) {
    backLink.href = `history-cards.html?collectionId=${encodeURIComponent(collectionId)}`;
  }

  async function loadTimeline(pageNumber = 0) {
    currentPage = pageNumber;

    showMessage(
      timelineContainer,
      "Carregando linha do tempo...",
      "history-timeline-message",
    );

    try {
      const page = await apiRequest(
        `/history/collections/${encodeURIComponent(collectionId)}/cards/${encodeURIComponent(cardId)}/history?page=${pageNumber}&size=${pageSize}`,
      );

      if (!page || !Array.isArray(page.content)) {
        throw new Error("Resposta inesperada ao carregar a linha do tempo.");
      }

      const fragment = document.createDocumentFragment();

      page.content
        .filter((event) => event.action !== "CREATED")
        .forEach((event) => {
          const item = createTimelineEvent(event);

          if (item) {
            fragment.append(item);
          }
        });

      if (page.last && cardCreatedAt) {
        fragment.append(createCreationEvent(cardCreatedAt));
      }

      if (page.totalPages > 1) {
        const pagination = createPagination(page);
        fragment.append(pagination);
      }

      timelineContainer.replaceChildren(fragment);
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        showMessage(
          timelineContainer,
          "Sua sessão expirou. Faça login novamente para consultar o histórico.",
          "history-timeline-error",
        );
        return;
      }

      showMessage(
        timelineContainer,
        "Não foi possível carregar a linha do tempo. Tente novamente.",
        "history-timeline-error",
      );
    }
  }

  async function initialize() {
    if (!collectionId || !cardId) {
      showMessage(
        timelineContainer,
        "Não foi possível identificar o cartão selecionado.",
        "history-timeline-error",
      );
      return;
    }

    try {
      await loadCardDetails();
      await loadTimeline(0);
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        showMessage(
          timelineContainer,
          "Sua sessão expirou. Faça login novamente para consultar o histórico.",
          "history-timeline-error",
        );
        return;
      }

      showMessage(
        timelineContainer,
        "Não foi possível carregar os detalhes do cartão.",
        "history-timeline-error",
      );
    }
  }

  initialize();
});
