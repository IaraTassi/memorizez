describe("History Cards", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const fs = require("fs");
  const path = require("path");

  const historyCardsHtml = fs.readFileSync(
    path.resolve(__dirname, "../history-cards.html"),
    "utf8",
  );

  const bodyHtml = historyCardsHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i)[1];

  async function loadHistoryCardsPage(apiResponses = [], collectionId = "1") {
    document.body.innerHTML = bodyHtml;

    window.history.replaceState(
      {},
      "",
      `/history-cards.html${
        collectionId ? `?collectionId=${encodeURIComponent(collectionId)}` : ""
      }`,
    );

    global.apiRequest = jest.fn();

    apiResponses.forEach((response) => {
      if (response.type === "reject") {
        global.apiRequest.mockRejectedValueOnce(response.error);
      } else {
        global.apiRequest.mockResolvedValueOnce(response.value);
      }
    });

    document.dispatchEvent(new Event("DOMContentLoaded"));

    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  require("../js/history-cards");

  it("should load the collection name and its cards successfully", async () => {
    const collections = [
      {
        id: 1,
        name: "Java",
      },
    ];

    const page = {
      content: [
        {
          id: 10,
          front: "O que é uma classe em Java?",
          editCount: 2,
          rememberedCount: 5,
          notRememberedCount: 1,
        },
      ],
      number: 0,
      totalPages: 1,
      totalElements: 1,
      first: true,
      last: true,
    };

    await loadHistoryCardsPage([{ value: collections }, { value: page }]);

    expect(document.getElementById("pageTitle").textContent).toBe(
      "Java",
    );

    expect(document.querySelector(".history-card-row")).not.toBeNull();

    expect(document.querySelector(".history-card-front").textContent).toBe(
      "O que é uma classe em Java?",
    );

    expect(
      document.querySelector(".history-card-counter-edits").textContent,
    ).toContain("2");

    expect(
      document.querySelector(".history-card-counter-remembered").textContent,
    ).toContain("5");

    expect(
      document.querySelector(".history-card-counter-not-remembered")
        .textContent,
    ).toContain("1");

    expect(global.apiRequest).toHaveBeenNthCalledWith(
      1,
      "/history/collections",
    );

    expect(global.apiRequest).toHaveBeenNthCalledWith(
      2,
      "/history/collections/1/cards?page=0&size=20",
    );
  });

  it("should show an error when collectionId is missing", async () => {
    await loadHistoryCardsPage([], "");

    expect(
      document.querySelector(".history-cards-error-message").textContent,
    ).toBe("Não foi possível identificar a coleção selecionada.");

    expect(global.apiRequest).not.toHaveBeenCalled();
  });

  it("should show a session expired message when loading collections returns 401", async () => {
    await loadHistoryCardsPage([
      {
        type: "reject",
        error: Object.assign(new Error("Unauthorized"), { status: 401 }),
      },
    ]);

    expect(
      document.querySelector(".history-cards-error-message").textContent,
    ).toBe(
      "Sua sessão expirou. Faça login novamente para consultar o histórico.",
    );

    expect(global.apiRequest).toHaveBeenCalledTimes(1);
  });

  it("should show a session expired message when loading collections returns 403", async () => {
    await loadHistoryCardsPage([
      {
        type: "reject",
        error: Object.assign(new Error("Forbidden"), { status: 403 }),
      },
    ]);

    expect(
      document.querySelector(".history-cards-error-message").textContent,
    ).toContain("Sua sessão expirou.");
  });

  it("should show an error when collections cannot be loaded", async () => {
    await loadHistoryCardsPage([
      {
        type: "reject",
        error: new Error("Network error"),
      },
    ]);

    expect(
      document.querySelector(".history-cards-error-message").textContent,
    ).toBe("Não foi possível carregar os dados da coleção.");
  });

  it("should show an error when the collections response is invalid", async () => {
    await loadHistoryCardsPage([{ value: {} }]);

    expect(
      document.querySelector(".history-cards-error-message").textContent,
    ).toBe("Não foi possível carregar os dados da coleção.");
  });

  it("should show an error when the collection does not exist", async () => {
    await loadHistoryCardsPage([
      {
        value: [{ id: 2, name: "Java" }],
      },
    ]);

    expect(
      document.querySelector(".history-cards-error-message").textContent,
    ).toBe("Não foi possível carregar os dados da coleção.");

    expect(global.apiRequest).toHaveBeenCalledTimes(1);
  });

  it("should show an empty message when the collection has no cards", async () => {
    await loadHistoryCardsPage([
      {
        value: [{ id: 1, name: "Java" }],
      },
      {
        value: {
          content: [],
          number: 0,
          totalPages: 0,
          totalElements: 0,
          first: true,
          last: true,
        },
      },
    ]);

    expect(
      document.querySelector(".history-cards-empty-message").textContent,
    ).toBe("Esta coleção ainda não possui cartões.");

    expect(document.querySelector(".history-card-row")).toBeNull();
  });

  test("should show a session expired message when loading cards returns 401", async () => {
    await loadHistoryCardsPage([
      {
        value: [{ id: 1, name: "Java" }],
      },
      {
        type: "reject",
        error: Object.assign(new Error("Unauthorized"), { status: 401 }),
      },
    ]);

    expect(
      document.querySelector(".history-cards-error-message").textContent,
    ).toContain("Sua sessão expirou.");

    expect(global.apiRequest).toHaveBeenCalledTimes(2);
  });

  it("should show a session expired message when loading cards returns 403", async () => {
    await loadHistoryCardsPage([
      {
        value: [{ id: 1, name: "Java" }],
      },
      {
        type: "reject",
        error: Object.assign(new Error("Forbidden"), { status: 403 }),
      },
    ]);

    expect(
      document.querySelector(".history-cards-error-message").textContent,
    ).toContain("Sua sessão expirou.");
  });

  it("should show an error when cards cannot be loaded", async () => {
    await loadHistoryCardsPage([
      {
        value: [{ id: 1, name: "Java" }],
      },
      {
        type: "reject",
        error: new Error("Network error"),
      },
    ]);

    expect(
      document.querySelector(".history-cards-error-message").textContent,
    ).toBe("Não foi possível carregar os cartões. Tente novamente.");
  });

  it("should show an error when the cards response is invalid", async () => {
    await loadHistoryCardsPage([
      {
        value: [{ id: 1, name: "Java" }],
      },
      {
        value: { content: "invalid" },
      },
    ]);

    expect(
      document.querySelector(".history-cards-error-message").textContent,
    ).toBe("Não foi possível carregar os cartões. Tente novamente.");
  });

  it("should display pagination and navigate between pages", async () => {
    const collections = [{ id: 1, name: "Java" }];

    const firstPage = {
      content: [
        {
          id: 10,
          front: "O que é uma classe?",
          editCount: 1,
          rememberedCount: 3,
          notRememberedCount: 0,
        },
      ],
      number: 0,
      totalPages: 2,
      totalElements: 2,
      first: true,
      last: false,
    };

    const secondPage = {
      content: [
        {
          id: 11,
          front: "O que é um objeto?",
          editCount: 2,
          rememberedCount: 4,
          notRememberedCount: 1,
        },
      ],
      number: 1,
      totalPages: 2,
      totalElements: 2,
      first: false,
      last: true,
    };

    await loadHistoryCardsPage([
      { value: collections },
      { value: firstPage },
      { value: secondPage },
      { value: firstPage },
    ]);

    let buttons = document.querySelectorAll(".history-cards-pagination-button");

    expect(buttons).toHaveLength(2);
    expect(buttons[0].textContent).toBe("Anterior");
    expect(buttons[0].disabled).toBe(true);
    expect(buttons[1].textContent).toBe("Próxima");
    expect(buttons[1].disabled).toBe(false);

    expect(
      document.querySelector(".history-cards-pagination-info").textContent,
    ).toBe("Página 1 de 2");

    buttons[1].click();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(global.apiRequest).toHaveBeenNthCalledWith(
      3,
      "/history/collections/1/cards?page=1&size=20",
    );

    expect(document.querySelector(".history-card-front").textContent).toBe(
      "O que é um objeto?",
    );

    expect(
      document.querySelector(".history-cards-pagination-info").textContent,
    ).toBe("Página 2 de 2");

    buttons = document.querySelectorAll(".history-cards-pagination-button");

    expect(buttons[0].disabled).toBe(false);
    expect(buttons[1].disabled).toBe(true);

    buttons[0].click();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(global.apiRequest).toHaveBeenNthCalledWith(
      4,
      "/history/collections/1/cards?page=0&size=20",
    );

    expect(document.querySelector(".history-card-front").textContent).toBe(
      "O que é uma classe?",
    );
  });
});
