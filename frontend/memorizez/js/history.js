document.addEventListener("DOMContentLoaded", () => {
  const collectionsContainer = document.getElementById("history-collections");

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

  function createCollectionRow(collection) {
    const row = createElement("button", "history-collection-row");
    row.type = "button";
    row.addEventListener("click", () => {
      window.location.href = `history-cards.html?collectionId=${encodeURIComponent(collection.id)}`;
    });

    const icon = createElement("span", "history-collection-icon");
    icon.setAttribute("aria-hidden", "true");

    icon.innerHTML = `
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H10l2 2h7.5A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/>
      </svg>
    `;

    const name = createElement(
      "span",
      "history-collection-name",
      collection.name,
    );

    const count = createElement(
      "span",
      "history-collection-count",
      `${collection.cardCount} ${
        collection.cardCount === 1 ? "cartão" : "cartões"
      }`,
    );

    const chevron = createElement("span", "history-collection-chevron");
    chevron.setAttribute("aria-hidden", "true");
    chevron.textContent = "›";

    row.append(icon, name, count, chevron);

    return row;
  }

  function showMessage(message, className) {
    const paragraph = createElement("p", className, message);
    collectionsContainer.replaceChildren(paragraph);
  }

  async function loadCollections() {
    showMessage("Carregando coleções...", "history-message");

    try {
      const collections = await apiRequest("/history/collections");

      if (!Array.isArray(collections)) {
        throw new Error("Resposta inesperada ao carregar as coleções.");
      }

      if (collections.length === 0) {
        showMessage(
          "Você ainda não possui coleções para consultar no histórico.",
          "history-empty-message",
        );
        return;
      }

      const fragment = document.createDocumentFragment();

      collections.forEach((collection) => {
        fragment.append(createCollectionRow(collection));
      });

      collectionsContainer.replaceChildren(fragment);
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        showMessage(
          "Sua sessão expirou. Faça login novamente para consultar o histórico.",
          "history-error-message",
        );
        return;
      }

      showMessage(
        "Não foi possível carregar suas coleções. Tente novamente.",
        "history-error-message",
      );
    }
  }

  loadCollections();
});
