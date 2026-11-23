describe("Cards", () => {
  const fs = require("fs");
  const path = require("path");

  const cardsHtml = fs.readFileSync(
    path.resolve(__dirname, "../../cards.html"),
    "utf8",
  );

  const bodyHtml = cardsHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i)[1];

  require("../../js/components/card-modals");
  require("../../js/pages/cards");

  const sampleCollection = {
    id: "1",
    name: "Java",
    createdAt: "2026-10-20T10:00:00",
  };

  const sampleCard = {
    id: "10",
    front: "O que é Java?",
    back: "Uma linguagem de programação.",
    notes: "Estudar para a prova.",
    createdAt: "2026-10-21T10:30:00",
  };

  const emptyPage = {
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: 0,
    first: true,
    last: true,
  };

  function createPage(cards = [sampleCard], overrides = {}) {
    return {
      content: cards,
      totalElements: cards.length,
      totalPages: 1,
      number: 0,
      first: true,
      last: true,
      ...overrides,
    };
  }

  async function settlePromises() {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  async function loadCardsPage(
    apiResponses = [[sampleCollection], emptyPage],
    search = "?collectionId=1",
    authenticated = true,
  ) {
    window.history.replaceState({}, "", `/cards.html${search}`);

    document.body.innerHTML = bodyHtml;

    window.MemorizezSession = {
      requireAuthentication: jest.fn(() => authenticated),
    };

    global.apiRequest = jest.fn();

    apiResponses.forEach((response) => {
      global.apiRequest.mockImplementationOnce(() => response);
    });

    document.dispatchEvent(new Event("DOMContentLoaded"));

    await settlePromises();
  }

  function openCreateModal() {
    document.querySelector("#createCardButton").click();
  }

  function submitCardForm() {
    document.querySelector("#card-form").dispatchEvent(
      new Event("submit", {
        bubbles: true,
        cancelable: true,
      }),
    );
  }

  function fillCardForm({
    front = "O que é Java?",
    back = "Uma linguagem de programação.",
    notes = "",
  } = {}) {
    document.querySelector("#card-front").value = front;
    document.querySelector("#card-back").value = back;
    document.querySelector("#card-notes").value = notes;
  }

  function getFeedback() {
    return document.querySelector("#cardsFeedback");
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should require authentication before rendering the page", async () => {
    await loadCardsPage([], "?collectionId=1", false);

    expect(window.MemorizezSession.requireAuthentication).toHaveBeenCalled();

    expect(global.apiRequest).not.toHaveBeenCalled();
  });

  it("should load the page when the user is authenticated", async () => {
    await loadCardsPage();

    expect(window.MemorizezSession.requireAuthentication).toHaveBeenCalled();

    expect(global.apiRequest).toHaveBeenNthCalledWith(1, "/collections");

    expect(global.apiRequest).toHaveBeenNthCalledWith(
      2,
      "/collections/1/cards?page=0&size=20",
    );
  });

  it("should display the collection information", async () => {
    await loadCardsPage();

    expect(document.querySelector("#pageTitle").textContent).toBe("Java");

    expect(
      document.querySelector("#collectionDescription").textContent,
    ).toContain("20/10/2026");

    expect(document.querySelector("#collectionDescription").hidden).toBe(false);
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

    expect(getFeedback().textContent).toBe(
      "Verifique se a coleção existe e tente novamente.",
    );

    expect(global.apiRequest).toHaveBeenCalledTimes(1);
  });

  it("should show an error when loading the collection fails", async () => {
    const error = new Error("Network error");

    await loadCardsPage([Promise.reject(error)]);

    expect(document.querySelector("#pageTitle").textContent).toBe(
      "Coleção indisponível",
    );

    expect(getFeedback().textContent).toBe(
      "Verifique se a coleção existe e tente novamente.",
    );
  });

  it("should show a message when collectionId is missing", async () => {
    await loadCardsPage([], "/cards.html");

    expect(document.querySelector("#pageTitle").textContent).toBe(
      "Coleção não informada",
    );

    expect(document.querySelector("#collectionDescription").hidden).toBe(true);

    expect(document.querySelector("#cardsList").textContent).toContain(
      "Acesse esta página a partir de uma coleção.",
    );

    expect(global.apiRequest).not.toHaveBeenCalled();
  });

  it("should load the collection cards successfully", async () => {
    await loadCardsPage([[sampleCollection], createPage()]);

    expect(document.querySelector(".card-item-front").textContent).toBe(
      "O que é Java?",
    );

    expect(global.apiRequest).toHaveBeenNthCalledWith(
      2,
      "/collections/1/cards?page=0&size=20",
    );
  });

  it("should display the card creation date", async () => {
    await loadCardsPage([[sampleCollection], createPage()]);

    expect(document.querySelector(".card-item-date").textContent).toContain(
      "21/10/2026",
    );
  });

  it("should show an empty message when there are no cards", async () => {
    await loadCardsPage([[sampleCollection], emptyPage]);

    expect(document.querySelector(".cards-empty").textContent).toContain(
      "Você ainda não tem cartões nesta coleção.",
    );
  });

  it("should show an error when loading cards fails", async () => {
    const error = new Error("Internal Server Error");
    error.status = 500;

    await loadCardsPage([[sampleCollection], Promise.reject(error)]);

    expect(document.querySelector("#cardsList").textContent).toBe(
      "Não foi possível carregar os cartões.",
    );

    expect(getFeedback().textContent).toBe(
      "Ocorreu um erro ao carregar os cartões. Tente novamente.",
    );

    expect(getFeedback().classList.contains("cards-error")).toBe(true);
  });

  it("should show an error when the cards response has an unexpected format", async () => {
    await loadCardsPage([
      [sampleCollection],
      {
        content: null,
        totalElements: 0,
        totalPages: 0,
      },
    ]);

    expect(document.querySelector("#cardsList").textContent).toBe(
      "Não foi possível carregar os cartões.",
    );

    expect(getFeedback().textContent).toBe(
      "Formato inesperado ao carregar os cartões.",
    );
  });

  it("should display pagination when there is more than one page", async () => {
    const page = createPage([sampleCard], {
      totalElements: 41,
      totalPages: 3,
      number: 0,
      first: true,
      last: false,
    });

    await loadCardsPage([[sampleCollection], page]);

    const pagination = document.querySelector(".history-cards-pagination");

    expect(pagination).not.toBeNull();

    expect(
      document.querySelector(".history-cards-pagination-info").textContent,
    ).toBe("Página 1 de 3");

    expect(
      document.querySelector(".history-cards-pagination-button").disabled,
    ).toBe(true);
  });

  it("should load the next page when clicking the next button", async () => {
    const firstPage = createPage([sampleCard], {
      totalElements: 41,
      totalPages: 3,
      number: 0,
      first: true,
      last: false,
    });

    const secondPage = createPage(
      [
        {
          ...sampleCard,
          id: "11",
          front: "O que é Spring?",
        },
      ],
      {
        totalElements: 41,
        totalPages: 3,
        number: 1,
        first: false,
        last: false,
      },
    );

    await loadCardsPage([[sampleCollection], firstPage, secondPage]);

    const nextButton = Array.from(
      document.querySelectorAll(".history-cards-pagination-button"),
    ).find((button) => button.textContent === "Próxima");

    nextButton.click();

    await settlePromises();

    expect(global.apiRequest).toHaveBeenLastCalledWith(
      "/collections/1/cards?page=1&size=20",
    );

    expect(
      document.querySelector(".history-cards-pagination-info").textContent,
    ).toBe("Página 2 de 3");
  });

  it("should open the card form modal", async () => {
    await loadCardsPage();

    openCreateModal();

    expect(document.querySelector("#card-modal-overlay").hidden).toBe(false);

    expect(document.querySelector("#card-modal-title").textContent.trim()).toBe(
      "Novo cartão",
    );
  });

  it("should close the card form modal using the close button", async () => {
    await loadCardsPage();

    openCreateModal();

    document.querySelector("#close-card-form").click();

    expect(document.querySelector("#card-modal-overlay").hidden).toBe(true);
  });

  it("should close the card form modal using the cancel button", async () => {
    await loadCardsPage();

    openCreateModal();

    document.querySelector("#cancel-card-form").click();

    expect(document.querySelector("#card-modal-overlay").hidden).toBe(true);
  });

  it("should close the card form modal when clicking the overlay", async () => {
    await loadCardsPage();

    openCreateModal();

    const overlay = document.querySelector("#card-modal-overlay");

    overlay.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
      }),
    );

    expect(overlay.hidden).toBe(true);
  });

  it("should close the card form modal when pressing Escape", async () => {
    await loadCardsPage();

    openCreateModal();

    const overlay = document.querySelector("#card-modal-overlay");

    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
      }),
    );

    expect(overlay.hidden).toBe(true);
  });

  it("should update all card character counters", async () => {
    await loadCardsPage();

    openCreateModal();

    fillCardForm({
      front: "Java",
      back: "Programação",
      notes: "Estudar",
    });

    document
      .querySelector("#card-front")
      .dispatchEvent(new Event("input", { bubbles: true }));

    document
      .querySelector("#card-back")
      .dispatchEvent(new Event("input", { bubbles: true }));

    document
      .querySelector("#card-notes")
      .dispatchEvent(new Event("input", { bubbles: true }));

    expect(document.querySelector("#card-front-counter").textContent).toBe(
      "4 / 200 caracteres",
    );

    expect(document.querySelector("#card-back-counter").textContent).toBe(
      "11 / 400 caracteres",
    );

    expect(document.querySelector("#card-notes-counter").textContent).toBe(
      "7 / 300 caracteres",
    );
  });

  it("should not create a card when the front is empty", async () => {
    await loadCardsPage();

    openCreateModal();

    fillCardForm({
      front: "   ",
      back: "Uma linguagem de programação.",
    });

    submitCardForm();

    expect(global.apiRequest).toHaveBeenCalledTimes(2);

    expect(document.querySelector("#card-front-feedback").textContent).toBe(
      "Preencha a frente do cartão.",
    );

    expect(
      document.querySelector("#card-front").getAttribute("aria-invalid"),
    ).toBe("true");
  });

  it("should not create a card when the front exceeds 200 characters", async () => {
    await loadCardsPage();

    openCreateModal();

    fillCardForm({
      front: "A".repeat(201),
      back: "Uma linguagem de programação.",
    });

    submitCardForm();

    expect(global.apiRequest).toHaveBeenCalledTimes(2);

    expect(document.querySelector("#card-front-feedback").textContent).toBe(
      "A frente do cartão deve ter no máximo 200 caracteres.",
    );
  });

  it("should not create a card when the back is empty", async () => {
    await loadCardsPage();

    openCreateModal();

    fillCardForm({
      front: "O que é Java?",
      back: "   ",
    });

    submitCardForm();

    expect(global.apiRequest).toHaveBeenCalledTimes(2);

    expect(document.querySelector("#card-back-feedback").textContent).toBe(
      "Preencha o verso do cartão.",
    );
  });

  it("should not create a card when the back exceeds 400 characters", async () => {
    await loadCardsPage();

    openCreateModal();

    fillCardForm({
      front: "O que é Java?",
      back: "A".repeat(401),
    });

    submitCardForm();

    expect(global.apiRequest).toHaveBeenCalledTimes(2);

    expect(document.querySelector("#card-back-feedback").textContent).toBe(
      "O verso do cartão deve ter no máximo 400 caracteres.",
    );
  });

  it("should not create a card when notes exceed 300 characters", async () => {
    await loadCardsPage();

    openCreateModal();

    fillCardForm({
      front: "O que é Java?",
      back: "Uma linguagem de programação.",
      notes: "A".repeat(301),
    });

    submitCardForm();

    expect(global.apiRequest).toHaveBeenCalledTimes(2);

    expect(document.querySelector("#card-notes-feedback").textContent).toBe(
      "As notas devem ter no máximo 300 caracteres.",
    );
  });

  it("should clear field validation feedback when typing", async () => {
    await loadCardsPage();

    openCreateModal();

    fillCardForm({
      front: "",
      back: "Uma linguagem de programação.",
    });

    submitCardForm();

    const front = document.querySelector("#card-front");
    const feedback = document.querySelector("#card-front-feedback");

    expect(feedback.hidden).toBe(false);

    front.value = "Java";

    front.dispatchEvent(new Event("input", { bubbles: true }));

    expect(feedback.hidden).toBe(true);
    expect(front.hasAttribute("aria-invalid")).toBe(false);
  });

  it("should create a card successfully", async () => {
    const createdCard = {
      ...sampleCard,
      front: "O que é Java?",
    };

    await loadCardsPage([
      [sampleCollection],
      emptyPage,
      null,
      createPage([createdCard]),
    ]);

    openCreateModal();

    fillCardForm({
      front: "  O que é Java?  ",
      back: "  Uma linguagem de programação.  ",
      notes: "  Conceito básico  ",
    });

    submitCardForm();

    await settlePromises();

    expect(global.apiRequest).toHaveBeenNthCalledWith(
      3,
      "/collections/1/cards",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          front: "O que é Java?",
          back: "Uma linguagem de programação.",
          notes: "Conceito básico",
        }),
      },
    );

    expect(document.querySelector("#card-modal-overlay").hidden).toBe(true);

    expect(getFeedback().textContent).toBe("Cartão criado com sucesso.");

    expect(getFeedback().classList.contains("cards-success")).toBe(true);
  });

  it("should show an error when card creation fails with status 400", async () => {
    const error = new Error("Bad Request");
    error.status = 400;

    await loadCardsPage([[sampleCollection], emptyPage, Promise.reject(error)]);

    openCreateModal();

    fillCardForm();

    submitCardForm();

    await settlePromises();

    expect(getFeedback().textContent).toBe(
      "Não foi possível salvar o cartão. Confira os dados e tente novamente.",
    );

    expect(getFeedback().classList.contains("cards-error")).toBe(true);

    expect(document.querySelector("#card-modal-overlay").hidden).toBe(false);
  });

  it("should show an error when card creation fails with status 404", async () => {
    const error = new Error("Not Found");
    error.status = 404;

    await loadCardsPage([[sampleCollection], emptyPage, Promise.reject(error)]);

    openCreateModal();

    fillCardForm();

    submitCardForm();

    await settlePromises();

    expect(getFeedback().textContent).toBe(
      "A coleção ou o cartão não foi encontrado. Atualize a página e tente novamente.",
    );
  });

  it("should show a generic error when card creation fails", async () => {
    await loadCardsPage([
      [sampleCollection],
      emptyPage,
      Promise.reject(new Error("Network error")),
    ]);

    openCreateModal();

    fillCardForm();

    submitCardForm();

    await settlePromises();

    expect(getFeedback().textContent).toBe(
      "Ocorreu um erro ao salvar o cartão. Tente novamente.",
    );
  });

  it("should open the edit modal with the current card information", async () => {
    await loadCardsPage([[sampleCollection], createPage()]);

    const editButton = document.querySelector(
      ".card-menu-items button:first-child",
    );

    editButton.click();

    expect(document.querySelector("#card-modal-overlay").hidden).toBe(false);

    expect(document.querySelector("#card-modal-title").textContent).toBe(
      "Editar cartão",
    );

    expect(document.querySelector("#card-front").value).toBe(sampleCard.front);

    expect(document.querySelector("#card-back").value).toBe(sampleCard.back);

    expect(document.querySelector("#card-notes").value).toBe(sampleCard.notes);

    expect(document.querySelector("#card-edit-warning").hidden).toBe(false);
  });

  it("should update a card successfully", async () => {
    await loadCardsPage([
      [sampleCollection],
      createPage(),
      null,
      createPage([
        {
          ...sampleCard,
          front: "O que é Spring?",
        },
      ]),
    ]);

    document.querySelector(".card-menu-items button:first-child").click();

    fillCardForm({
      front: "O que é Spring?",
      back: "Framework Java.",
      notes: "Framework",
    });

    submitCardForm();

    await settlePromises();

    expect(global.apiRequest).toHaveBeenNthCalledWith(
      3,
      "/collections/1/cards/10",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          front: "O que é Spring?",
          back: "Framework Java.",
          notes: "Framework",
        }),
      },
    );

    expect(getFeedback().textContent).toBe("Cartão atualizado com sucesso.");
  });

  it("should show an error when updating a card with status 400", async () => {
    const error = new Error("Bad Request");
    error.status = 400;

    await loadCardsPage([
      [sampleCollection],
      createPage(),
      Promise.reject(error),
    ]);

    document.querySelector(".card-menu-items button:first-child").click();

    fillCardForm({
      front: "O que é Spring?",
      back: "Framework Java.",
    });

    submitCardForm();

    await settlePromises();

    expect(getFeedback().textContent).toBe(
      "Não foi possível salvar o cartão. Confira os dados e tente novamente.",
    );
  });

  it("should show an error when updating a card with status 404", async () => {
    const error = new Error("Not Found");
    error.status = 404;

    await loadCardsPage([
      [sampleCollection],
      createPage(),
      Promise.reject(error),
    ]);

    document.querySelector(".card-menu-items button:first-child").click();

    fillCardForm();

    submitCardForm();

    await settlePromises();

    expect(getFeedback().textContent).toBe(
      "A coleção ou o cartão não foi encontrado. Atualize a página e tente novamente.",
    );
  });

  it("should open the delete confirmation modal", async () => {
    await loadCardsPage([[sampleCollection], createPage()]);

    const deleteButton = document.querySelector(
      ".card-menu-items button:last-child",
    );

    deleteButton.click();

    expect(document.querySelector("#delete-card-overlay").hidden).toBe(false);

    expect(global.apiRequest).toHaveBeenCalledTimes(2);
  });

  it("should close the delete modal using the close button", async () => {
    await loadCardsPage([[sampleCollection], createPage()]);

    document.querySelector(".card-menu-items button:last-child").click();

    document.querySelector("#close-delete-card").click();

    expect(document.querySelector("#delete-card-overlay").hidden).toBe(true);

    expect(global.apiRequest).toHaveBeenCalledTimes(2);
  });

  it("should close the delete modal using the cancel button", async () => {
    await loadCardsPage([[sampleCollection], createPage()]);

    document.querySelector(".card-menu-items button:last-child").click();

    document.querySelector("#cancel-delete-card").click();

    expect(document.querySelector("#delete-card-overlay").hidden).toBe(true);
  });

  it("should close the delete modal when clicking the overlay", async () => {
    await loadCardsPage([[sampleCollection], createPage()]);

    document.querySelector(".card-menu-items button:last-child").click();

    const overlay = document.querySelector("#delete-card-overlay");

    overlay.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
      }),
    );

    expect(overlay.hidden).toBe(true);
  });

  it("should close the delete modal when pressing Escape", async () => {
    await loadCardsPage([[sampleCollection], createPage()]);

    document.querySelector(".card-menu-items button:last-child").click();

    const overlay = document.querySelector("#delete-card-overlay");

    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
      }),
    );

    expect(overlay.hidden).toBe(true);
  });

  it("should delete a card successfully", async () => {
    await loadCardsPage([[sampleCollection], createPage(), null, emptyPage]);

    document.querySelector(".card-menu-items button:last-child").click();

    document.querySelector("#confirm-delete-card").click();

    await settlePromises();

    expect(global.apiRequest).toHaveBeenNthCalledWith(
      3,
      "/collections/1/cards/10",
      {
        method: "DELETE",
      },
    );

    expect(global.apiRequest).toHaveBeenNthCalledWith(
      4,
      "/collections/1/cards?page=0&size=20",
    );

    expect(document.querySelector("#delete-card-overlay").hidden).toBe(true);

    expect(getFeedback().textContent).toBe("Cartão excluído com sucesso.");
  });

  it("should show an error when deleting a card fails", async () => {
    const error = new Error("Network error");
    error.status = 500;

    await loadCardsPage([
      [sampleCollection],
      createPage(),
      Promise.reject(error),
    ]);

    document.querySelector(".card-menu-items button:last-child").click();

    document.querySelector("#confirm-delete-card").click();

    await settlePromises();

    expect(getFeedback().textContent).toBe(
      "Não foi possível excluir o cartão. Tente novamente.",
    );

    expect(getFeedback().classList.contains("cards-error")).toBe(true);
  });

  it("should open the edit modal when editCardId is provided", async () => {
    await loadCardsPage(
      [[sampleCollection], createPage()],
      "?collectionId=1&editCardId=10",
    );

    expect(document.querySelector("#card-modal-overlay").hidden).toBe(false);

    expect(document.querySelector("#card-modal-title").textContent).toBe(
      "Editar cartão",
    );

    expect(document.querySelector("#card-front").value).toBe(sampleCard.front);
  });

  it("should show an error when the requested card for editing is not found", async () => {
    await loadCardsPage(
      [[sampleCollection], emptyPage],
      "?collectionId=1&editCardId=999",
    );

    expect(getFeedback().textContent).toBe(
      "Não foi possível encontrar o cartão para edição.",
    );

    expect(document.querySelector("#card-modal-overlay").hidden).toBe(true);
  });
});
