document.addEventListener("DOMContentLoaded", async () => {
  const contentContainer = document.querySelector(
    "#free-study-session-content",
  );

  if (!contentContainer) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const collectionId = params.get("collectionId");

  let collectionName = "";
  let totalCards = 0;
  let currentCard = null;
  let currentCardIndex = 1;
  let isRevealed = false;
  let isLoading = false;

  function showMessage(message, className = "free-study-session-message") {
    const element = document.createElement("p");
    element.className = className;
    element.textContent = message;

    contentContainer.replaceChildren(element);
  }

  function showMessage(message, className = "free-study-session-message") {
    const element = document.createElement("p");
    element.className = className;
    element.textContent = message;

    contentContainer.replaceChildren(element);
  }

  function showSessionError(message) {
    let errorMessage = contentContainer.querySelector(
      ".free-study-session-error",
    );

    if (!errorMessage) {
      errorMessage = createElement("p", "free-study-session-error");

      errorMessage.setAttribute("role", "alert");
      contentContainer.append(errorMessage);
    }

    errorMessage.textContent = message;
  }

  function createElement(tag, className, text = "") {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = text;

    return element;
  }

  function createElement(tag, className, text = "") {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = text;

    return element;
  }

  function createProgress() {
    const header = createElement("header", "free-study-session-header");

    const heading = createElement("div", "free-study-session-heading");

    const title = createElement(
      "h2",
      "free-study-session-title",
      "Estudo livre",
    );

    const collection = createElement(
      "p",
      "free-study-session-collection-name",
      collectionName,
    );

    heading.append(title, collection);

    const progressInfo = createElement(
      "span",
      "free-study-session-progress-text",
      `${currentCardIndex} de ${totalCards}`,
    );

    header.append(heading, progressInfo);

    const progressTrack = createElement(
      "div",
      "free-study-session-progress-track",
    );

    progressTrack.setAttribute("role", "progressbar");
    progressTrack.setAttribute("aria-label", "Progresso da coleção");
    progressTrack.setAttribute("aria-valuemin", "0");
    progressTrack.setAttribute("aria-valuemax", String(totalCards));
    progressTrack.setAttribute("aria-valuenow", String(currentCardIndex));

    const progressBar = createElement("div", "free-study-session-progress-bar");

    progressBar.style.width = `${(currentCardIndex / totalCards) * 100}%`;

    progressTrack.append(progressBar);

    const helper = createElement(
      "p",
      "free-study-session-helper",
      "Seu ritmo, sem pressão de desempenho.",
    );

    return { header, progressTrack, helper };
  }

  function createStudyCard() {
    const card = createElement("article", "free-study-session-card");

    const front = createElement(
      "h2",
      "free-study-session-front",
      currentCard.front,
    );

    const actions = createElement("div", "free-study-session-actions");

    const revealButton = createElement(
      "button",
      "btn button-primary free-study-session-button",
      "Revelar verso",
    );

    revealButton.type = "button";
    revealButton.addEventListener("click", revealCard);

    actions.append(revealButton);
    card.append(front);

    return { card, actions };
  }

  function renderCard() {
    isRevealed = false;

    const { header, progressTrack, helper } = createProgress();
    const { card, actions } = createStudyCard();

    contentContainer.replaceChildren(
      header,
      progressTrack,
      helper,
      card,
      actions,
    );
  }

  async function revealCard() {
    if (isLoading || isRevealed || !currentCard) {
      return;
    }

    isLoading = true;

    contentContainer.querySelector(".free-study-session-error")?.remove();

    const revealButton = contentContainer.querySelector(
      ".free-study-session-button",
    );

    revealButton.disabled = true;
    revealButton.textContent = "Carregando...";

    try {
      const response = await apiRequest(
        `/free-study/collections/${encodeURIComponent(collectionId)}/cards/${encodeURIComponent(currentCard.cardId)}/back`,
      );

      if (!response) {
        throw new Error("Não foi possível carregar o verso do cartão.");
      }

      isRevealed = true;

      const card = contentContainer.querySelector(".free-study-session-card");

      const front = card.querySelector(".free-study-session-front");

      front.classList.add("is-revealed");

      const back = createElement("p", "free-study-session-back", response.back);

      card.append(back);

      if (response.notes) {
        const notes = createElement(
          "p",
          "free-study-session-notes",
          response.notes,
        );

        card.append(notes);
      }

      revealButton.textContent = "Próximo cartão";
      revealButton.disabled = false;

      revealButton.removeEventListener("click", revealCard);
      revealButton.addEventListener("click", nextCard);
    } catch (error) {
      revealButton.disabled = false;
      revealButton.textContent = "Revelar verso";

      showSessionError(
        error?.status === 401 || error?.status === 403
          ? "Sua sessão expirou. Entre novamente para continuar."
          : "Não foi possível revelar o cartão. Tente novamente.",
      );
    } finally {
      isLoading = false;
    }
  }

  async function nextCard() {
    if (isLoading || !isRevealed || !currentCard) {
      return;
    }

    isLoading = true;

    contentContainer.querySelector(".free-study-session-error")?.remove();

    const nextButton = contentContainer.querySelector(
      ".free-study-session-button",
    );

    nextButton.disabled = true;
    nextButton.textContent = "Carregando...";

    try {
      const next = await apiRequest(
        `/free-study/collections/${encodeURIComponent(collectionId)}/cards/${encodeURIComponent(currentCard.cardId)}`,
      );

      if (!next) {
        renderCompletion();
        return;
      }

      currentCard = next;
      currentCardIndex += 1;

      renderCard();
    } catch (error) {
      nextButton.disabled = false;
      nextButton.textContent = "Próximo cartão";

      showSessionError(
        error?.status === 401 || error?.status === 403
          ? "Sua sessão expirou. Entre novamente para continuar."
          : "Não foi possível carregar o próximo cartão. Tente novamente.",
      );
    } finally {
      isLoading = false;
    }
  }

  function renderCompletion() {
    const completion = createElement(
      "section",
      "free-study-session-completion",
    );

    const title = createElement(
      "h2",
      "free-study-session-completion-title",
      "Coleção concluída!",
    );

    const description = createElement(
      "p",
      "free-study-session-completion-description",
      "Você percorreu todos os cartões desta coleção.",
    );

    const backButton = createElement(
      "button",
      "btn button-primary free-study-session-button",
      "Voltar ao Estudo livre",
    );

    backButton.type = "button";

    backButton.addEventListener("click", () => {
      window.location.href = "free-study.html";
    });

    const actions = createElement("div", "free-study-session-actions");

    actions.append(backButton);

    completion.append(title, description);

    contentContainer.replaceChildren(completion, actions);
  }

  async function initializeStudy() {
    if (!collectionId) {
      showMessage(
        "Não foi possível identificar a coleção. Volte ao Estudo livre e selecione uma coleção.",
        "free-study-session-error",
      );
      return;
    }

    try {
      const collections = await apiRequest("/free-study/collections");

      const collection = collections?.find(
        (item) => String(item.id) === collectionId,
      );

      if (!collection) {
        showMessage(
          "Coleção não encontrada. Volte ao Estudo livre e selecione outra coleção.",
          "free-study-session-error",
        );
        return;
      }

      collectionName = collection.name;
      totalCards = collection.cardCount;

      if (totalCards === 0) {
        showMessage("Esta coleção ainda não possui cartões.");
        return;
      }

      currentCard = await apiRequest(
        `/free-study/collections/${encodeURIComponent(collectionId)}`,
      );

      if (!currentCard) {
        renderCompletion();
        return;
      }

      renderCard();
    } catch (error) {
      showMessage(
        error.status === 401 || error.status === 403
          ? "Sua sessão expirou. Entre novamente para acessar o Estudo livre."
          : "Não foi possível carregar a coleção. Tente novamente.",
        "free-study-session-error",
      );
    }
  }

  await initializeStudy();
});
