describe("Card Details", () => {
  const fs = require("fs");
  const path = require("path");

  const cardDetailsHtml = fs.readFileSync(
    path.resolve(__dirname, "../card-details.html"),
    "utf8",
  );

  const bodyHtml = cardDetailsHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i)[1];

  async function loadCardDetailsPage(
    apiResponses,
    search = "?collectionId=1&cardId=10",
  ) {
    window.history.replaceState({}, "", `/card-details.html${search}`);

    document.body.innerHTML = bodyHtml;

    global.apiRequest = jest.fn();

    apiResponses.forEach((response) => {
      global.apiRequest.mockResolvedValueOnce(response);
    });

    document.dispatchEvent(new Event("DOMContentLoaded"));

    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  require("../js/card-modals");
  require("../js/card-details");

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

  it("should show an error when collection does not exist", async () => {
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

  it("should show an error when card does not exist in the collection", async () => {
    await loadCardDetailsPage([
      [collection],
      { content: [], totalElements: 0, totalPages: 0 },
    ]);

    expect(document.querySelector("#pageTitle").textContent).toBe(
      "Detalhes indisponíveis",
    );

    expect(document.querySelector("#cardDetailsFeedback").textContent).toBe(
      "Cartão não encontrado nesta coleção.",
    );
  });

  it("should show an error when loading details fails", async () => {
    const error = new Error("Server error");
    error.status = 500;

    await loadCardDetailsPage([collection, Promise.reject(error)]);

    expect(document.querySelector("#pageTitle").textContent).toBe(
      "Detalhes indisponíveis",
    );

    expect(document.querySelector("#cardDetailsFeedback").textContent).toBe(
      "Ocorreu um erro ao carregar o cartão. Tente novamente.",
    );

    expect(document.querySelector("#cardDetailsActions")).toBeNull();
  });

  it("should show a message when collectionId or cardId is missing", async () => {
    await loadCardDetailsPage([], "/card-details.html?collectionId=1");

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

    document.querySelector("#editCardButton").click();

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

  it("should not update a card when the front is empty", async () => {
    await loadCardDetailsPage([[collection], cardsPage]);

    document.querySelector("#editCardButton").click();

    document.querySelector("#card-front").value = "   ";
    document.querySelector("#card-back").value = "Verso atualizado";

    document
      .querySelector("#card-form")
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    expect(apiRequest).toHaveBeenCalledTimes(2);

    expect(document.querySelector("#cardDetailsFeedback").textContent).toBe(
      "Preencha a frente e o verso do cartão.",
    );

    expect(document.querySelector("#card-modal-overlay").hidden).toBe(false);
  });

  it("should not update a card when the back is empty", async () => {
    await loadCardDetailsPage([[collection], cardsPage]);

    document.querySelector("#editCardButton").click();

    document.querySelector("#card-front").value = "Frente atualizada";
    document.querySelector("#card-back").value = "   ";

    document
      .querySelector("#card-form")
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    expect(apiRequest).toHaveBeenCalledTimes(2);

    expect(document.querySelector("#cardDetailsFeedback").textContent).toBe(
      "Preencha a frente e o verso do cartão.",
    );

    expect(document.querySelector("#card-modal-overlay").hidden).toBe(false);
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

    document.querySelector("#editCardButton").click();

    document.querySelector("#card-front").value = updatedCard.front;
    document.querySelector("#card-back").value = updatedCard.back;
    document.querySelector("#card-notes").value = updatedCard.notes;

    document
      .querySelector("#card-form")
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

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

    document.querySelector("#editCardButton").click();

    document.querySelector("#card-front").value = "Frente atualizada";
    document.querySelector("#card-back").value = "Verso atualizado";

    document
      .querySelector("#card-form")
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(apiRequest).toHaveBeenCalledTimes(3);

    expect(document.querySelector("#cardDetailsFeedback").textContent).toBe(
      "Verifique os campos e tente novamente.",
    );

    expect(document.querySelector("#card-modal-overlay").hidden).toBe(false);
    expect(document.querySelector("#save-card").disabled).toBe(false);
  });

  it("should show a generic error when card update fails", async () => {
    const error = new Error("Server error");
    error.status = 500;

    await loadCardDetailsPage([[collection], cardsPage, Promise.reject(error)]);

    document.querySelector("#editCardButton").click();

    document.querySelector("#card-front").value = "Frente atualizada";
    document.querySelector("#card-back").value = "Verso atualizado";

    document
      .querySelector("#card-form")
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

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

    document.querySelector("#deleteCardButton").click();

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

    document.querySelector("#deleteCardButton").click();

    expect(document.querySelector("#delete-card-overlay").hidden).toBe(false);

    document.querySelector("#confirm-delete-card").click();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(apiRequest).toHaveBeenNthCalledWith(3, "/collections/1/cards/10", {
      method: "DELETE",
    });
  });
});
