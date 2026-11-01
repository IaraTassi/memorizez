document.addEventListener("DOMContentLoaded", async () => {
  const collectionsContainer = document.querySelector("#review-collections");

  if (!collectionsContainer) {
    return;
  }

  function createCollectionIcon() {
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

    return icon;
  }

  function formatCollectionDate(date) {
    const [year, month, day] = date.split("-").map(Number);

    return new Intl.DateTimeFormat("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(year, month - 1, day)));
  }

  function createCollectionCard(collection) {
    const card = document.createElement("article");
    card.className = "review-collection-card";

    const header = document.createElement("div");
    header.className = "review-collection-header";

    const label = document.createElement("span");
    label.className = "review-collection-label";
    label.textContent = "Coleção";

    header.append(createCollectionIcon(), label);

    const title = document.createElement("h2");
    title.className = "review-collection-name";
    title.textContent = collection.name;

    const date = document.createElement("p");
    date.className = "review-collection-date";
    date.textContent = `Criada em ${formatCollectionDate(collection.createdAt)}`;

    const status = document.createElement("div");
    status.className = "review-collection-status";

    const statusText = document.createElement("span");
    statusText.className = "review-status-text";

    const count = collection.availableCardCount;
    const total = collection.cardCount;

    if (count === 0) {
      statusText.textContent = "Você está em dia";
    } else {
      statusText.textContent = `${count} de ${total} a estudar`;
    }

    const statusIcon = document.createElement("span");
    statusIcon.className = "review-status-icon";
    statusIcon.setAttribute("aria-hidden", "true");

    statusIcon.innerHTML = `
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
  >
    <path d="m2 10 10-5 10 5-10 5-10-5z"/>
    <path d="M6 12v5c3 2 9 2 12 0v-5"/>
    <path d="M22 10v6"/>
  </svg>
`;

    status.append(statusIcon, statusText);

    const actions = document.createElement("div");
    actions.className = "review-collection-actions";

    const reviewButton = document.createElement("button");
    reviewButton.className = "btn button-primary review-start-button";
    reviewButton.type = "button";
    reviewButton.textContent = "Estudar agora";
    reviewButton.disabled = collection.availableCardCount === 0;

    reviewButton.addEventListener("click", () => {
      window.location.href = `study.html?collectionId=${encodeURIComponent(collection.id)}`;
    });

    const freeStudyButton = document.createElement("button");
    freeStudyButton.className = "btn button-secondary review-free-study-button";
    freeStudyButton.type = "button";
    freeStudyButton.textContent = "Estudo livre";

    freeStudyButton.disabled = true;

    actions.append(reviewButton, freeStudyButton);
    card.append(header, title, date, status, actions);

    return card;
  }

  async function loadCollections() {
    collectionsContainer.replaceChildren();

    try {
      const collections = await apiRequest("/collections");

      if (!collections.length) {
        const message = document.createElement("p");
        message.className = "collections-empty";
        message.textContent = "Você ainda não possui coleções.";
        collectionsContainer.append(message);
        return;
      }

      const cards = collections.map(createCollectionCard);
      collectionsContainer.replaceChildren(...cards);
    } catch {
      const message = document.createElement("p");
      message.className = "collections-error";
      message.textContent =
        "Não foi possível carregar suas coleções. Tente novamente.";

      collectionsContainer.append(message);
    }
  }

  await loadCollections();
});
