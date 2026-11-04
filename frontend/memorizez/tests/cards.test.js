describe("Cards", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const fs = require("fs");
  const path = require("path");

  const cardsHtml = fs.readFileSync(
    path.resolve(__dirname, "../cards.html"),
    "utf8",
  );

  const bodyHtml = cardsHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i)[1];

  async function loadCardsPage(apiResponses, search = "?collectionId=1") {
    window.history.replaceState({}, "", `/cards.html${search}`);

    document.body.innerHTML = bodyHtml;

    global.apiRequest = jest.fn();

    apiResponses.forEach((response) => {
      global.apiRequest.mockResolvedValueOnce(response);
    });

    document.dispatchEvent(new Event("DOMContentLoaded"));

    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  require("../js/card-modals");
  require("../js/cards");

  it("should load the collection and its cards successfully", async () => {
    const collection = {
      id: "1",
      name: "Java",
      createdAt: "2026-10-20T10:00:00",
    };

    const card = {
      id: "10",
      front: "O que é Java?",
      back: "Uma linguagem de programação.",
      notes: "",
      createdAt: "2026-10-21T10:30:00",
    };

    const page = {
      content: [card],
      totalElements: 1,
      totalPages: 1,
    };

    await loadCardsPage([[collection], page]);

    expect(apiRequest).toHaveBeenNthCalledWith(1, "/collections");

    expect(apiRequest).toHaveBeenNthCalledWith(
      2,
      "/collections/1/cards?page=0&size=100",
    );

    expect(document.querySelector("#pageTitle").textContent).toBe("Java");

    expect(document.querySelector(".card-item-front").textContent).toBe(
      "O que é Java?",
    );
  });

  it("should show an empty message when the collection has no cards", async () => {
    const collection = {
      id: "1",
      name: "Java",
      createdAt: "2026-10-20T10:30:00",
    };

    const page = {
      content: [],
      totalElements: 0,
      totalPages: 0,
    };

    await loadCardsPage([[collection], page]);

    const emptyMessage = document.querySelector(".cards-empty");

    expect(emptyMessage).not.toBeNull();

    expect(emptyMessage.textContent).toContain(
      "Você ainda não tem cartões nesta coleção.",
    );
  });

  it("should show an error when the collection does not exist", async () => {
    await loadCardsPage([
      [
        {
          id: "2",
          name: "JavaScript",
          createdAt: "2026-10-20T10:30:00",
        },
      ],
    ]);

    expect(document.querySelector("#pageTitle").textContent).toBe(
      "Coleção indisponível",
    );

    expect(document.querySelector("#cardsList").textContent).toContain(
      "Não foi possível carregar esta coleção.",
    );

    expect(document.querySelector("#cardsFeedback").textContent).toBe(
      "Verifique se a coleção existe e tente novamente.",
    );

    expect(apiRequest).toHaveBeenCalledTimes(1);
  });

  it("should show an error when loading cards fails", async () => {
    const collection = {
      id: "1",
      name: "Java",
      createdAt: "2026-10-20T10:30:00",
    };

    const error = new Error("Erro interno do servidor.");
    error.status = 500;

    await loadCardsPage([[collection], Promise.reject(error)]);

    expect(apiRequest).toHaveBeenCalledTimes(2);

    expect(document.querySelector("#cardsList").textContent).toBe(
      "Não foi possível carregar os cartões.",
    );

    expect(document.querySelector("#cardsFeedback").textContent).toBe(
      "Ocorreu um erro ao carregar os cartões. Tente novamente.",
    );

    expect(
      document
        .querySelector("#cardsFeedback")
        .classList.contains("cards-error"),
    ).toBe(true);
  });

  it("should show an error when the cards response has an unexpected format", async () => {
    const collection = {
      id: "1",
      name: "Java",
      createdAt: "2026-10-20T10:30:00",
    };

    const invalidPage = {
      content: null,
      totalElements: 0,
      totalPages: 0,
    };

    await loadCardsPage([[collection], invalidPage]);

    expect(document.querySelector("#cardsList").textContent).toBe(
      "Não foi possível carregar os cartões.",
    );

    expect(document.querySelector("#cardsFeedback").textContent).toBe(
      "Formato inesperado ao carregar os cartões.",
    );

    expect(
      document
        .querySelector("#cardsFeedback")
        .classList.contains("cards-error"),
    ).toBe(true);
  });

  it("should open the card form modal when clicking the create button", async () => {
    const collection = {
      id: "1",
      name: "Java",
      createdAt: "2026-10-20T10:30:00",
    };

    await loadCardsPage([
      [collection],
      {
        content: [],
        totalElements: 0,
        totalPages: 0,
      },
    ]);

    const createButton = document.querySelector("#createCardButton");
    const modal = document.querySelector("#card-modal-overlay");

    expect(modal.hidden).toBe(true);

    createButton.click();

    expect(modal.hidden).toBe(false);
    expect(document.querySelector("#card-modal-title").textContent.trim()).toBe(
      "Novo cartão",
    );
  });

  it("should open the edit modal with the current card data", async () => {
    const collection = {
      id: "1",
      name: "Java",
      createdAt: "2026-10-20T10:30:00",
    };

    const card = {
      id: "10",
      front: "O que é Java?",
      back: "Uma linguagem de programação.",
      notes: "Estudar para a prova.",
      createdAt: "2026-10-21T10:30:00",
    };

    const page = {
      content: [card],
      totalElements: 1,
      totalPages: 1,
    };

    await loadCardsPage([[collection], page]);

    const cardItem = document.querySelector(".card-item");
    const editButton = cardItem.querySelector(".card-menu button");
    const modal = document.querySelector("#card-modal-overlay");

    expect(modal.hidden).toBe(true);

    editButton.click();

    expect(modal.hidden).toBe(false);

    expect(document.querySelector("#card-modal-title").textContent.trim()).toBe(
      "Editar cartão",
    );

    expect(document.querySelector("#card-modal-description").textContent).toBe(
      "Atualize as informações deste cartão.",
    );

    expect(document.querySelector("#card-edit-warning").hidden).toBe(false);

    expect(document.querySelector("#card-front").value).toBe("O que é Java?");

    expect(document.querySelector("#card-back").value).toBe(
      "Uma linguagem de programação.",
    );

    expect(document.querySelector("#card-notes").value).toBe(
      "Estudar para a prova.",
    );

    expect(document.querySelector("#save-card").textContent.trim()).toBe(
      "Salvar alterações",
    );

    expect(cardItem.querySelector(".card-menu").open).toBe(false);
  });

  it("should open and close the delete confirmation modal", async () => {
    const collection = {
      id: "1",
      name: "Java",
      createdAt: "2026-10-20T10:30:00",
    };

    const card = {
      id: "10",
      front: "O que é Java?",
      back: "Uma linguagem de programação.",
      notes: "Estudar para a prova.",
      createdAt: "2026-10-21T10:30:00",
    };

    const page = {
      content: [card],
      totalElements: 1,
      totalPages: 1,
    };

    await loadCardsPage([[collection], page]);

    const cardItem = document.querySelector(".card-item");
    const deleteButton = cardItem.querySelector(
      ".card-menu button:nth-child(2)",
    );
    const deleteModal = document.querySelector("#delete-card-overlay");

    expect(deleteModal.hidden).toBe(true);

    deleteButton.click();

    expect(deleteModal.hidden).toBe(false);
    expect(apiRequest).toHaveBeenCalledTimes(2);

    document.querySelector("#close-delete-card").click();

    expect(deleteModal.hidden).toBe(true);
  });

  it("should close the delete confirmation modal when clicking cancel", async () => {
    const collection = { id: "1", name: "Java" };
    const card = {
      id: "10",
      front: "O que é Java?",
      back: "Uma linguagem de programação.",
      notes: "",
      createdAt: "2026-10-21T10:30:00",
    };

    const page = {
      content: [card],
      totalElements: 1,
      totalPages: 1,
    };

    await loadCardsPage([[collection], page]);

    const cardItem = document.querySelector(".card-item");
    const deleteButton = cardItem.querySelector(
      ".card-menu button:nth-child(2)",
    );
    const deleteModal = document.querySelector("#delete-card-overlay");

    deleteButton.click();

    expect(deleteModal.hidden).toBe(false);

    document.querySelector("#cancel-delete-card").click();

    expect(deleteModal.hidden).toBe(true);
    expect(apiRequest).toHaveBeenCalledTimes(2);
  });

  it("should close the card form modal when clicking the close button", async () => {
    const collection = {
      id: "1",
      name: "Java",
      createdAt: "2026-10-20T10:30:00",
    };

    await loadCardsPage([
      [collection],
      {
        content: [],
        totalElements: 0,
        totalPages: 0,
      },
    ]);

    document.querySelector("#createCardButton").click();

    const modal = document.querySelector("#card-modal-overlay");

    document.querySelector("#close-card-form").click();

    expect(modal.hidden).toBe(true);
    expect(document.querySelector("#card-form").elements).toBeDefined();
  });

  it("should close the card form modal when clicking cancel", async () => {
    const collection = {
      id: "1",
      name: "Java",
      createdAt: "2026-10-20T10:30:00",
    };

    await loadCardsPage([
      [collection],
      {
        content: [],
        totalElements: 0,
        totalPages: 0,
      },
    ]);

    document.querySelector("#createCardButton").click();

    const modal = document.querySelector("#card-modal-overlay");

    document.querySelector("#cancel-card-form").click();

    expect(modal.hidden).toBe(true);
  });

  it("should close the card form modal when clicking outside", async () => {
    const collection = {
      id: "1",
      name: "Java",
      createdAt: "2026-10-20T10:30:00",
    };

    await loadCardsPage([
      [collection],
      {
        content: [],
        totalElements: 0,
        totalPages: 0,
      },
    ]);

    document.querySelector("#createCardButton").click();

    const modal = document.querySelector("#card-modal-overlay");

    modal.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
      }),
    );

    expect(modal.hidden).toBe(true);
  });

  it("should close the card form modal when pressing Escape", async () => {
    const collection = {
      id: "1",
      name: "Java",
      createdAt: "2026-10-20T10:30:00",
    };

    await loadCardsPage([
      [collection],
      {
        content: [],
        totalElements: 0,
        totalPages: 0,
      },
    ]);

    document.querySelector("#createCardButton").click();

    const modal = document.querySelector("#card-modal-overlay");

    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
      }),
    );

    expect(modal.hidden).toBe(true);
  });

  it("should not create a card when the front is empty", async () => {
    const collection = {
      id: "1",
      name: "Java",
      createdAt: "2026-10-20T10:30:00",
    };

    await loadCardsPage([
      [collection],
      {
        content: [],
        totalElements: 0,
        totalPages: 0,
      },
    ]);

    document.querySelector("#createCardButton").click();

    document.querySelector("#card-back").value =
      "Uma linguagem de programação.";

    document
      .querySelector("#card-form")
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    expect(apiRequest).toHaveBeenCalledTimes(2);

    expect(document.querySelector("#cardsFeedback").textContent).toBe(
      "Preencha a frente e o verso do cartão.",
    );
  });

  it("should not create a card when the back is empty", async () => {
    const collection = {
      id: "1",
      name: "Java",
      createdAt: "2026-10-20T10:30:00",
    };

    await loadCardsPage([
      [collection],
      {
        content: [],
        totalElements: 0,
        totalPages: 0,
      },
    ]);

    document.querySelector("#createCardButton").click();

    document.querySelector("#card-front").value = "O que é Java?";

    document
      .querySelector("#card-form")
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    expect(apiRequest).toHaveBeenCalledTimes(2);

    expect(document.querySelector("#cardsFeedback").textContent).toBe(
      "Preencha a frente e o verso do cartão.",
    );
  });

  it("should not create a card when collectionId is missing", async () => {
    await loadCardsPage([], "/cards.html");

    document.querySelector("#createCardButton").click();

    document.querySelector("#card-front").value = "O que é Java?";
    document.querySelector("#card-back").value =
      "Uma linguagem de programação.";

    document
      .querySelector("#card-form")
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    expect(apiRequest).not.toHaveBeenCalled();

    expect(document.querySelector("#cardsFeedback").textContent).toBe(
      "Não foi possível identificar a coleção.",
    );
  });

  it("should create a card successfully", async () => {
    const collection = {
      id: "1",
      name: "Java",
      createdAt: "2026-10-20T10:30:00",
    };

    const emptyPage = {
      content: [],
      totalElements: 0,
      totalPages: 0,
    };

    const createdPage = {
      content: [
        {
          id: 10,
          front: "O que é Java?",
          back: "Uma linguagem de programação.",
          notes: "Conceito básico",
          createdAt: "2026-10-21T10:30:00",
        },
      ],
      totalElements: 1,
      totalPages: 1,
    };

    await loadCardsPage([
      [collection],
      emptyPage,
      null,
      [collection],
      createdPage,
    ]);

    document.querySelector("#createCardButton").click();

    document.querySelector("#card-front").value = "  O que é Java?  ";
    document.querySelector("#card-back").value =
      "  Uma linguagem de programação.  ";
    document.querySelector("#card-notes").value = "  Conceito básico  ";

    document
      .querySelector("#card-form")
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(apiRequest).toHaveBeenNthCalledWith(
      3,
      "/collections/1/cards",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          front: "O que é Java?",
          back: "Uma linguagem de programação.",
          notes: "Conceito básico",
        }),
      }),
    );

    expect(document.querySelector("#card-modal-overlay").hidden).toBe(true);

    expect(document.querySelector("#cardsFeedback").textContent).toBe(
      "Cartão criado com sucesso.",
    );
  });

  it("should show an error when card creation fails with status 400", async () => {
    const collection = {
      id: "1",
      name: "Java",
      createdAt: "2026-10-20T10:30:00",
    };

    const emptyPage = {
      content: [],
      totalElements: 0,
      totalPages: 0,
    };

    const error = new Error("Bad Request");
    error.status = 400;

    await loadCardsPage([[collection], emptyPage, Promise.reject(error)]);

    document.querySelector("#createCardButton").click();

    document.querySelector("#card-front").value = "O que é Java?";
    document.querySelector("#card-back").value =
      "Uma linguagem de programação.";

    document
      .querySelector("#card-form")
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.querySelector("#cardsFeedback").textContent).toBe(
      "Verifique os campos e tente novamente.",
    );

    expect(document.querySelector("#card-modal-overlay").hidden).toBe(false);
  });

  it("should show a message error when card creation fails", async () => {
    const collection = {
      id: "1",
      name: "Java",
      createdAt: "2026-10-20T10:30:00",
    };

    const emptyPage = {
      content: [],
      totalElements: 0,
      totalPages: 0,
    };

    const error = new Error("Internal Server Error");
    error.status = 500;

    await loadCardsPage([[collection], emptyPage, Promise.reject(error)]);

    document.querySelector("#createCardButton").click();

    document.querySelector("#card-front").value = "O que é Java?";
    document.querySelector("#card-back").value =
      "Uma linguagem de programação.";

    document
      .querySelector("#card-form")
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.querySelector("#cardsFeedback").textContent).toBe(
      "Não foi possível salvar o cartão. Tente novamente.",
    );

    expect(document.querySelector("#card-modal-overlay").hidden).toBe(false);
  });
});
