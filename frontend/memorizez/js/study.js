const studyCollectionName = document.getElementById("studyCollectionName");
const studyProgressCount = document.getElementById("study-progress-count");
const studyProgressPercentage = document.getElementById(
  "study-progress-percentage",
);
const studyProgressTrack = document.getElementById("study-progress-track");
const studyProgressBar = document.getElementById("study-progress-bar");
const studyMessage = document.getElementById("study-message");
const studyContent = document.getElementById("study-content");

const params = new URLSearchParams(window.location.search);
const collectionId = params.get("collectionId");

let currentCard = null;
let isRevealed = false;
let isSubmitting = false;
let isCompleted = false;

function showMessage(message) {
  studyMessage.textContent = message;
}

function clearMessage() {
  studyMessage.textContent = "";
}

function updateProgress(progress) {
  if (!progress) {
    return;
  }

  const { completedCards, totalCards, percentage } = progress;

  studyProgressCount.textContent = `${completedCards}/${totalCards} cartões`;

  studyProgressPercentage.textContent = `${percentage}%`;

  studyProgressBar.style.width = `${percentage}%`;
  studyProgressTrack.setAttribute("aria-valuenow", percentage);
}

function createButton(text, className, onClick) {
  const button = document.createElement("button");

  button.type = "button";
  button.className = `btn ${className}`;
  button.textContent = text;
  button.addEventListener("click", onClick);

  return button;
}

function renderCard(card) {
  currentCard = card;
  isRevealed = false;
  isSubmitting = false;
  isCompleted = false;

  studyContent.replaceChildren();

  const cardContainer = document.createElement("div");
  cardContainer.className = "study-card-container";

  const studyCard = document.createElement("div");
  studyCard.className = "study-card";
  studyCard.setAttribute("role", "button");
  studyCard.setAttribute("tabindex", "0");
  studyCard.setAttribute("aria-label", "Revelar resposta do cartão");

  const cardInner = document.createElement("div");
  cardInner.className = "study-card-inner";

  const frontFace = document.createElement("div");
  frontFace.className = "study-card-face study-card-face--front";

  const front = document.createElement("span");
  front.className = "study-card-front";
  front.textContent = card.front;

  const instruction = document.createElement("span");
  instruction.className = "study-card-instruction";
  instruction.textContent = "Clique no cartão para revelar a resposta";

  frontFace.append(front, instruction);

  const backFace = document.createElement("div");
  backFace.className = "study-card-face study-card-face--back";

  const backFront = document.createElement("span");
  backFront.className = "study-card-front-revealed";
  backFront.textContent = card.front;

  const answer = document.createElement("span");
  answer.className = "study-card-answer";
  answer.textContent = "Carregando resposta…";
  answer.setAttribute("aria-live", "polite");

  backFace.append(backFront, answer);
  cardInner.append(frontFace, backFace);
  studyCard.append(cardInner);

  const actions = document.createElement("div");
  actions.className = "study-actions";

  const rememberButton = createButton("Lembrei", "button-primary", () =>
    submitResult("REMEMBERED"),
  );

  const forgotButton = createButton("Não lembrei", "button-secondary", () =>
    submitResult("NOT_REMEMBERED"),
  );

  rememberButton.disabled = true;
  forgotButton.disabled = true;

  actions.append(rememberButton, forgotButton);
  cardContainer.append(studyCard, actions);
  studyContent.append(cardContainer);

  async function handleReveal() {
    if (isRevealed || isSubmitting || isCompleted) {
      return;
    }

    isSubmitting = true;
    studyCard.classList.add("is-revealed");

    await revealCard({
      studyCard,
      front,
      instruction,
      answer,
      rememberButton,
      forgotButton,
    });
  }

  studyCard.addEventListener("click", handleReveal);

  studyCard.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleReveal();
    }
  });
}

async function revealCard(elements) {
  const {
    studyCard,
    front,
    instruction,
    answer,
    rememberButton,
    forgotButton,
  } = elements;

  try {
    clearMessage();

    const revealedCard = await apiRequest(
      `/reviews/collections/${encodeURIComponent(collectionId)}` +
        `/cards/${encodeURIComponent(currentCard.cardId)}/review`,
    );

    currentCard = revealedCard;

    answer.textContent = revealedCard.back;

    if (revealedCard.notes) {
      const notes = document.createElement("span");
      notes.className = "study-card-notes";
      notes.textContent = revealedCard.notes;

      answer.parentElement.append(notes);
    }

    front.classList.add("study-card-front-revealed");
    instruction.remove();

    isRevealed = true;

    studyCard.setAttribute("aria-label", "Resposta revelada");

    rememberButton.disabled = false;
    forgotButton.disabled = false;
  } catch (error) {
    studyCard.classList.remove("is-revealed");

    showMessage(
      error.status === 401
        ? "Sua sessão expirou. Entre novamente para continuar."
        : "Não foi possível revelar a resposta. Tente novamente.",
    );
  } finally {
    isSubmitting = false;
  }
}

async function submitResult(result) {
  if (!currentCard || !isRevealed || isSubmitting || isCompleted) {
    return;
  }

  isSubmitting = true;

  const buttons = studyContent.querySelectorAll("button");
  buttons.forEach((button) => {
    button.disabled = true;
  });

  clearMessage();

  try {
    const response = await apiRequest(
      `/reviews/collections/${encodeURIComponent(collectionId)}` +
        `/cards/${encodeURIComponent(currentCard.cardId)}/result`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ result }),
      },
    );

    updateProgress(response.progress);

    if (response.completed) {
      renderCompletion();
      return;
    }

    renderCard(response.nextCard);
  } catch (error) {
    showMessage(
      error.status === 401
        ? "Sua sessão expirou. Entre novamente para continuar."
        : "Não foi possível registrar sua resposta. Tente novamente.",
    );

    buttons.forEach((button) => {
      button.disabled = false;
    });
  } finally {
    isSubmitting = false;
  }
}

function renderCompletion() {
  isCompleted = true;
  currentCard = null;
  studyContent.replaceChildren();

  const completion = document.createElement("div");
  completion.className = "study-completion";

  const title = document.createElement("h2");
  title.textContent = "Revisão concluída!";

  const description = document.createElement("p");
  description.textContent =
    "Você concluiu todos os cartões disponíveis desta sessão.";

  const backButton = createButton("Voltar à revisão", "button-primary", () => {
    window.location.href = "review.html";
  });

  completion.append(title, description, backButton);
  studyContent.append(completion);

  showMessage("");
}

async function initializeStudy() {
  if (!collectionId) {
    showMessage("Nenhuma coleção foi informada.");
    return;
  }

  try {
    showMessage("Carregando revisão...");

    const collections = await apiRequest("/collections");

    const collection = collections.find(
      (item) => String(item.id) === collectionId,
    );

    if (!collection) {
      showMessage("Coleção não encontrada.");
      return;
    }

    studyCollectionName.textContent = collection.name;

    const firstCard = await apiRequest(
      `/reviews/collections/${encodeURIComponent(collectionId)}/start`,
      {
        method: "POST",
      },
    );

    updateProgress(firstCard.progress);
    renderCard(firstCard);
    clearMessage();
  } catch (error) {
    if (error.status === 401) {
      showMessage("Sua sessão expirou. Entre novamente para continuar.");
    } else if (error.status === 404) {
      showMessage("Coleção não encontrada.");
    } else {
      showMessage(
        "Não foi possível iniciar a revisão. Verifique se há cartões disponíveis.",
      );
    }
  }
}

initializeStudy();
