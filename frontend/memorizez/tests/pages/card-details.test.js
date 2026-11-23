describe("Card Details", () => {
  const fs = require("fs");
  const path = require("path");

  const cardDetailsHtml = fs.readFileSync(
    path.resolve(__dirname, "../../card-details.html"),
    "utf8",
  );

  const bodyHtml = cardDetailsHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i)[1];

  const collection = {
    id: "1",
    name: "Java",
  };

  const card = {
    id: "10",
    front: "O que é Java?",
    back: "Uma linguagem de programação.",
    notes: "Estudar para a prova.",
    createdAt: "2026-10-20T10:30:00",
  };

  const cardsPage = {
    content: [card],
    totalElements: 1,
    totalPages: 1,
  };

  async function loadCardDetailsPage(
    apiResponses = [],
    search = "?collectionId=1&cardId=10",
  ) {
    window.history.replaceState({}, "", `/card-details.html${search}`);

    document.body.innerHTML = bodyHtml;

    window.MemorizezSession = {
      requireAuthentication: jest.fn(() => true),
    };

    global.apiRequest = jest.fn();

    apiResponses.forEach((response) => {
      global.apiRequest.mockImplementationOnce(() => response);
    });

    document.dispatchEvent(new Event("DOMContentLoaded"));

    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  function submitCardForm() {
    document.querySelector("#card-form").dispatchEvent(
      new Event("submit", {
        bubbles: true,
        cancelable: true,
      }),
    );
  }

  function openEditModal() {
    document.querySelector("#editCardButton").click();
  }

  function openDeleteModal() {
    document.querySelector("#deleteCardButton").click();
  }

  require("../../js/components/card-modals");
  require("../../js/pages/card-details");

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should load the card details successfully", async () => {
    await loadCardDetailsPage([[collection], cardsPage]);

    const fields = document.querySelectorAll(".card-details-field");

    expect(apiRequest).toHaveBeenNthCalledWith(1, "/collections");

    expect(apiRequest).toHaveBeenNthCalledWith(
      2,
      "/collections/1/cards?page=0&size=100",
    );

    expect(document.querySelector("#pageTitle").textContent).toBe("Java");

    expect(document.querySelector("#backToCards").getAttribute("href")).toBe(
      "cards.html?collectionId=1",
    );

    expect(fields).toHaveLength(3);
    expect(fields[0].textContent).toContain("O que é Java?");
    expect(fields[1].textContent).toContain("Uma linguagem de programação.");
    expect(fields[2].textContent).toContain("Estudar para a prova.");

    expect(document.querySelector("#cardCreatedAt").textContent).toBe(
      "Criado em 20/10/2026",
    );

    expect(document.querySelector("#cardDetailsActions").hidden).toBe(false);
  });

  it("should show an error when the collection does not exist", async () => {
    await loadCardDetailsPage([[{ id: "2", name: "Spring" }], cardsPage]);

    expect(document.querySelector("#pageTitle").textContent).toBe(
      "Detalhes indisponíveis",
    );

    expect(document.querySelector("#cardDetailsFeedback").textContent).toBe(
      "Coleção não encontrada.",
    );

    expect(document.querySelector("#cardDetailsContent").textContent).toContain(
      "Não foi possível carregar este cartão.",
    );
  });

  it("should show an error when the card does not exist in the collection", async () => {
    await loadCardDetailsPage([
      [collection],
      {
        content: [],
        totalElements: 0,
        totalPages: 0,
      },
    ]);

    expect(document.querySelector("#pageTitle").textContent).toBe(
      "Detalhes indisponíveis",
    );

    expect(document.querySelector("#cardDetailsFeedback").textContent).toBe(
      "Cartão não encontrado nesta coleção.",
    );
  });

  it("should show a generic error when loading details fails", async () => {
    const error = new Error("Server error");
    error.status = 500;

    await loadCardDetailsPage([[collection], Promise.reject(error)]);

    expect(document.querySelector("#pageTitle").textContent).toBe(
      "Detalhes indisponíveis",
    );

    expect(document.querySelector("#cardDetailsFeedback").textContent).toBe(
      "Ocorreu um erro ao carregar o cartão. Tente novamente.",
    );

    expect(document.querySelector("#cardDetailsActions")).toBeNull();
  });

  it("should show a message when collectionId is missing", async () => {
    await loadCardDetailsPage([], "?cardId=10");

    expect(document.querySelector("#pageTitle").textContent).toBe(
      "Cartão não informado",
    );

    expect(document.querySelector("#cardDetailsContent").textContent).toContain(
      "Acesse esta página a partir de uma coleção.",
    );

    expect(apiRequest).not.toHaveBeenCalled();
  });

  it("should show a message when cardId is missing", async () => {
    await loadCardDetailsPage([], "?collectionId=1");

    expect(document.querySelector("#pageTitle").textContent).toBe(
      "Cartão não informado",
    );

    expect(document.querySelector("#cardDetailsContent").textContent).toContain(
      "Acesse esta página a partir de uma coleção.",
    );

    expect(apiRequest).not.toHaveBeenCalled();
  });

  it("should open the edit modal with the current card data", async () => {
    await loadCardDetailsPage([[collection], cardsPage]);

    openEditModal();

    expect(document.querySelector("#card-modal-overlay").hidden).toBe(false);

    expect(document.querySelector("#card-modal-title").textContent).toBe(
      "Editar cartão",
    );

    expect(document.querySelector("#card-modal-description").textContent).toBe(
      "Atualize as informações deste cartão.",
    );

    expect(document.querySelector("#card-edit-warning").hidden).toBe(false);

    expect(document.querySelector("#card-front").value).toBe(card.front);
    expect(document.querySelector("#card-back").value).toBe(card.back);
    expect(document.querySelector("#card-notes").value).toBe(card.notes);

    expect(document.querySelector("#save-card").textContent).toBe(
      "Salvar alterações",
    );
  });

  it("should close the edit modal using the close button", async () => {
    await loadCardDetailsPage([[collection], cardsPage]);

    openEditModal();

    document.querySelector("#close-card-form").click();

    expect(document.querySelector("#card-modal-overlay").hidden).toBe(true);
    expect(document.querySelector("#card-front").value).toBe("");
    expect(document.querySelector("#card-back").value).toBe("");
  });

  it("should close the edit modal using the cancel button", async () => {
    await loadCardDetailsPage([[collection], cardsPage]);

    openEditModal();

    document.querySelector("#cancel-card-form").click();

    expect(document.querySelector("#card-modal-overlay").hidden).toBe(true);
  });

  it("should close the edit modal when clicking outside it", async () => {
    await loadCardDetailsPage([[collection], cardsPage]);

    openEditModal();

    document
      .querySelector("#card-modal-overlay")
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(document.querySelector("#card-modal-overlay").hidden).toBe(true);
  });

  it("should close the edit modal when pressing Escape", async () => {
    await loadCardDetailsPage([[collection], cardsPage]);

    openEditModal();

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(document.querySelector("#card-modal-overlay").hidden).toBe(true);
  });

  it("should open the delete confirmation modal", async () => {
    await loadCardDetailsPage([[collection], cardsPage]);

    openDeleteModal();

    expect(document.querySelector("#delete-card-overlay").hidden).toBe(false);
  });

  it("should close the delete modal using the close button", async () => {
    await loadCardDetailsPage([[collection], cardsPage]);

    openDeleteModal();

    document.querySelector("#close-delete-card").click();

    expect(document.querySelector("#delete-card-overlay").hidden).toBe(true);
  });

  it("should close the delete modal using the cancel button", async () => {
    await loadCardDetailsPage([[collection], cardsPage]);

    openDeleteModal();

    document.querySelector("#cancel-delete-card").click();

    expect(document.querySelector("#delete-card-overlay").hidden).toBe(true);
  });

  it("should close the delete modal when clicking outside it", async () => {
    await loadCardDetailsPage([[collection], cardsPage]);

    openDeleteModal();

    document
      .querySelector("#delete-card-overlay")
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(document.querySelector("#delete-card-overlay").hidden).toBe(true);
  });

  it("should close the delete modal when pressing Escape", async () => {
    await loadCardDetailsPage([[collection], cardsPage]);

    openDeleteModal();

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(document.querySelector("#delete-card-overlay").hidden).toBe(true);
  });

  it("should not update a card when the front is empty", async () => {
    await loadCardDetailsPage([[collection], cardsPage]);

    openEditModal();

    document.querySelector("#card-front").value = "   ";
    document.querySelector("#card-back").value = "Verso atualizado";

    submitCardForm();

    expect(apiRequest).toHaveBeenCalledTimes(2);

    expect(document.querySelector("#cardDetailsFeedback").textContent).toBe(
      "Preencha a frente do cartão.",
    );

    expect(document.querySelector("#card-modal-overlay").hidden).toBe(false);
  });

  it("should not update a card when the back is empty", async () => {
    await loadCardDetailsPage([[collection], cardsPage]);

    openEditModal();

    document.querySelector("#card-front").value = "Frente atualizada";
    document.querySelector("#card-back").value = "   ";

    submitCardForm();

    expect(apiRequest).toHaveBeenCalledTimes(2);

    expect(document.querySelector("#cardDetailsFeedback").textContent).toBe(
      "Preencha o verso do cartão.",
    );

    expect(document.querySelector("#card-modal-overlay").hidden).toBe(false);
  });

  it("should not update a card when the front exceeds 200 characters", async () => {
    await loadCardDetailsPage([[collection], cardsPage]);

    openEditModal();

    document.querySelector("#card-front").value = "a".repeat(201);
    document.querySelector("#card-back").value = "Verso atualizado";

    submitCardForm();

    expect(apiRequest).toHaveBeenCalledTimes(2);

    expect(document.querySelector("#cardDetailsFeedback").textContent).toBe(
      "A frente do cartão deve ter no máximo 200 caracteres.",
    );
  });

  it("should not update a card when the back exceeds 400 characters", async () => {
    await loadCardDetailsPage([[collection], cardsPage]);

    openEditModal();

    document.querySelector("#card-front").value = "Frente atualizada";
    document.querySelector("#card-back").value = "a".repeat(401);

    submitCardForm();

    expect(apiRequest).toHaveBeenCalledTimes(2);

    expect(document.querySelector("#cardDetailsFeedback").textContent).toBe(
      "O verso do cartão deve ter no máximo 400 caracteres.",
    );
  });

  it("should not update a card when notes exceed 300 characters", async () => {
    await loadCardDetailsPage([[collection], cardsPage]);

    openEditModal();

    document.querySelector("#card-front").value = "Frente atualizada";
    document.querySelector("#card-back").value = "Verso atualizado";
    document.querySelector("#card-notes").value = "a".repeat(301);

    submitCardForm();

    expect(apiRequest).toHaveBeenCalledTimes(2);

    expect(document.querySelector("#cardDetailsFeedback").textContent).toBe(
      "As notas devem ter no máximo 300 caracteres.",
    );
  });

  it("should update a card successfully", async () => {
    const updatedCard = {
      ...card,
      front: "O que é Spring?",
      back: "Um framework Java.",
      notes: "Revisar Spring Boot.",
    };

    const updatedCardsPage = {
      content: [updatedCard],
      totalElements: 1,
      totalPages: 1,
    };

    await loadCardDetailsPage([
      [collection],
      cardsPage,
      null,
      [collection],
      updatedCardsPage,
    ]);

    openEditModal();

    document.querySelector("#card-front").value = updatedCard.front;
    document.querySelector("#card-back").value = updatedCard.back;
    document.querySelector("#card-notes").value = updatedCard.notes;

    submitCardForm();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(apiRequest).toHaveBeenNthCalledWith(
      3,
      "/collections/1/cards/10",
      expect.objectContaining({
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          front: updatedCard.front,
          back: updatedCard.back,
          notes: updatedCard.notes,
        }),
      }),
    );

    expect(apiRequest).toHaveBeenNthCalledWith(4, "/collections");
    expect(apiRequest).toHaveBeenNthCalledWith(
      5,
      "/collections/1/cards?page=0&size=100",
    );

    expect(document.querySelector("#card-modal-overlay").hidden).toBe(true);

    expect(document.querySelector("#cardDetailsFeedback").textContent).toBe(
      "Cartão atualizado com sucesso.",
    );

    expect(document.querySelector("#cardDetailsFeedback").classList).toContain(
      "cards-success",
    );

    const fields = document.querySelectorAll(".card-details-field");

    expect(fields[0].textContent).toContain(updatedCard.front);
    expect(fields[1].textContent).toContain(updatedCard.back);
    expect(fields[2].textContent).toContain(updatedCard.notes);
  });

  it("should show a validation error when card update fails with status 400", async () => {
    const error = new Error("Bad request");
    error.status = 400;

    await loadCardDetailsPage([[collection], cardsPage, Promise.reject(error)]);

    openEditModal();

    document.querySelector("#card-front").value = "Frente atualizada";
    document.querySelector("#card-back").value = "Verso atualizado";

    submitCardForm();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(apiRequest).toHaveBeenCalledTimes(3);

    expect(document.querySelector("#cardDetailsFeedback").textContent).toBe(
      "Verifique os campos e tente novamente.",
    );

    expect(document.querySelector("#card-modal-overlay").hidden).toBe(false);
    expect(document.querySelector("#save-card").disabled).toBe(false);
  });

  it("should show an error when card update fails with status 404", async () => {
    const error = new Error("Not found");
    error.status = 404;

    await loadCardDetailsPage([[collection], cardsPage, Promise.reject(error)]);

    openEditModal();

    document.querySelector("#card-front").value = "Frente atualizada";
    document.querySelector("#card-back").value = "Verso atualizado";

    submitCardForm();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.querySelector("#cardDetailsFeedback").textContent).toBe(
      "O cartão ou a coleção não foi encontrado. Atualize a página e tente novamente.",
    );

    expect(document.querySelector("#card-modal-overlay").hidden).toBe(false);
  });

  it("should show a generic error when card update fails", async () => {
    const error = new Error("Server error");
    error.status = 500;

    await loadCardDetailsPage([[collection], cardsPage, Promise.reject(error)]);

    openEditModal();

    document.querySelector("#card-front").value = "Frente atualizada";
    document.querySelector("#card-back").value = "Verso atualizado";

    submitCardForm();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.querySelector("#cardDetailsFeedback").textContent).toBe(
      "Não foi possível atualizar o cartão. Tente novamente.",
    );

    expect(document.querySelector("#card-modal-overlay").hidden).toBe(false);
    expect(document.querySelector("#save-card").disabled).toBe(false);
  });

  it("should show an error when card deletion fails", async () => {
    const error = new Error("Server error");
    error.status = 500;

    await loadCardDetailsPage([[collection], cardsPage, Promise.reject(error)]);

    openDeleteModal();

    expect(document.querySelector("#delete-card-overlay").hidden).toBe(false);

    document.querySelector("#confirm-delete-card").click();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(apiRequest).toHaveBeenNthCalledWith(3, "/collections/1/cards/10", {
      method: "DELETE",
    });

    expect(document.querySelector("#cardDetailsFeedback").textContent).toBe(
      "Não foi possível excluir o cartão. Tente novamente.",
    );

    expect(document.querySelector("#confirm-delete-card").disabled).toBe(false);
  });

  it("should delete a card successfully", async () => {
    await loadCardDetailsPage([[collection], cardsPage, null]);

    openDeleteModal();

    document.querySelector("#confirm-delete-card").click();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(apiRequest).toHaveBeenNthCalledWith(3, "/collections/1/cards/10", {
      method: "DELETE",
    });
  });

  it("should not load the page when the user is not authenticated", async () => {
    window.history.replaceState(
      {},
      "",
      "/card-details.html?collectionId=1&cardId=10",
    );

    document.body.innerHTML = bodyHtml;

    window.MemorizezSession = {
      requireAuthentication: jest.fn(() => false),
    };

    global.apiRequest = jest.fn();

    document.dispatchEvent(new Event("DOMContentLoaded"));

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(window.MemorizezSession.requireAuthentication).toHaveBeenCalled();

    expect(apiRequest).not.toHaveBeenCalled();
  });
});
