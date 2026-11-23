describe("History Cards", () => {
  const fs = require("fs");
  const path = require("path");

  const historyCardsHtml = fs.readFileSync(
    path.resolve(__dirname, "../../history-cards.html"),
    "utf8",
  );

  const bodyMatch = historyCardsHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

  const bodyHtml = bodyMatch ? bodyMatch[1] : "";

  function rejectedResponse(error) {
    return {
      type: "reject",
      error,
    };
  }

  async function waitForAsync() {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  async function loadHistoryCardsPage(
    apiResponses = [],
    collectionId = "1",
    authenticated = true,
    includeElements = true,
  ) {
    document.body.innerHTML = bodyHtml;

    if (!includeElements) {
      document.body.innerHTML = "<main></main>";
    }

    window.history.replaceState(
      {},
      "",
      `/history-cards.html${
        collectionId ? `?collectionId=${encodeURIComponent(collectionId)}` : ""
      }`,
    );

    window.MemorizezSession = {
      requireAuthentication: jest.fn(() => authenticated),
    };

    global.apiRequest = jest.fn();

    apiResponses.forEach((response) => {
      if (response?.type === "reject") {
        global.apiRequest.mockRejectedValueOnce(response.error);
      } else if (
        response &&
        Object.prototype.hasOwnProperty.call(response, "value")
      ) {
        global.apiRequest.mockResolvedValueOnce(response.value);
      } else {
        global.apiRequest.mockResolvedValueOnce(response);
      }
    });

    jest.resetModules();

    let initialize;

    const originalAddEventListener = document.addEventListener.bind(document);

    const addEventListenerSpy = jest
      .spyOn(document, "addEventListener")
      .mockImplementation((event, callback, options) => {
        if (event === "DOMContentLoaded") {
          initialize = callback;
          return;
        }

        originalAddEventListener(event, callback, options);
      });

    try {
      require("../../js/pages/history-cards");

      if (initialize) {
        initialize();
      }
    } finally {
      addEventListenerSpy.mockRestore();
    }

    await waitForAsync();
  }

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = "";
  });

  it("should not execute when the user is not authenticated", async () => {
    await loadHistoryCardsPage([], "1", false);

    expect(window.MemorizezSession.requireAuthentication).toHaveBeenCalled();

    expect(apiRequest).not.toHaveBeenCalled();
  });

  it("should not execute when the required elements do not exist", async () => {
    await loadHistoryCardsPage([], "1", true, false);

    expect(apiRequest).not.toHaveBeenCalled();
  });

  it("should show an error when collectionId is missing", async () => {
    await loadHistoryCardsPage([], "");

    expect(
      document.querySelector(".history-cards-error-message").textContent,
    ).toBe("Não foi possível identificar a coleção selecionada.");

    expect(apiRequest).not.toHaveBeenCalled();
  });

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

    expect(document.getElementById("pageTitle").textContent).toBe("Java");

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

    expect(apiRequest).toHaveBeenNthCalledWith(1, "/history/collections");

    expect(apiRequest).toHaveBeenNthCalledWith(
      2,
      "/history/collections/1/cards?page=0&size=20",
    );
  });

  it("should show an error when the collection does not exist", async () => {
    await loadHistoryCardsPage([
      {
        value: [{ id: 2, name: "Java" }],
      },
    ]);

    expect(
      document.querySelector(".history-cards-error-message").textContent,
    ).toBe("Coleção não encontrada.");

    expect(apiRequest).toHaveBeenCalledTimes(1);
  });

  it("should show an error when the collections response is invalid", async () => {
    await loadHistoryCardsPage([
      {
        value: {},
      },
    ]);

    expect(
      document.querySelector(".history-cards-error-message").textContent,
    ).toBe("Não foi possível carregar os dados da coleção.");

    expect(apiRequest).toHaveBeenCalledTimes(1);
  });

  it("should show an error when loading collections fails", async () => {
    await loadHistoryCardsPage([rejectedResponse(new Error("Network error"))]);

    expect(
      document.querySelector(".history-cards-error-message").textContent,
    ).toBe("Não foi possível carregar os dados da coleção.");

    expect(apiRequest).toHaveBeenCalledTimes(1);
  });

  it("should show a generic error when loading collections returns 401", async () => {
    const error = Object.assign(new Error("Unauthorized"), {
      status: 401,
    });

    await loadHistoryCardsPage([rejectedResponse(error)]);

    expect(
      document.querySelector(".history-cards-error-message").textContent,
    ).toBe("Não foi possível carregar os dados da coleção.");
  });

  it("should show a permission error when loading collections returns 403", async () => {
    const error = Object.assign(new Error("Forbidden"), {
      status: 403,
    });

    await loadHistoryCardsPage([rejectedResponse(error)]);

    expect(
      document.querySelector(".history-cards-error-message").textContent,
    ).toBe("Você não tem permissão para consultar esta coleção.");
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

    expect(apiRequest).toHaveBeenCalledTimes(2);
  });

  it("should show an error when the cards response is invalid", async () => {
    await loadHistoryCardsPage([
      {
        value: [{ id: 1, name: "Java" }],
      },
      {
        value: {
          content: "invalid",
        },
      },
    ]);

    expect(
      document.querySelector(".history-cards-error-message").textContent,
    ).toBe("Não foi possível carregar os cartões. Tente novamente.");
  });

  it("should show an error when the cards response is null", async () => {
    await loadHistoryCardsPage([
      {
        value: [{ id: 1, name: "Java" }],
      },
      {
        value: null,
      },
    ]);

    expect(
      document.querySelector(".history-cards-error-message").textContent,
    ).toBe("Não foi possível carregar os cartões. Tente novamente.");
  });

  it("should show a generic error when loading cards fails", async () => {
    await loadHistoryCardsPage([
      {
        value: [{ id: 1, name: "Java" }],
      },
      rejectedResponse(new Error("Network error")),
    ]);

    expect(
      document.querySelector(".history-cards-error-message").textContent,
    ).toBe("Não foi possível carregar os cartões. Tente novamente.");

    expect(apiRequest).toHaveBeenCalledTimes(2);
  });

  it("should show a generic error when loading cards returns 401", async () => {
    const error = Object.assign(new Error("Unauthorized"), {
      status: 401,
    });

    await loadHistoryCardsPage([
      {
        value: [{ id: 1, name: "Java" }],
      },
      rejectedResponse(error),
    ]);

    expect(
      document.querySelector(".history-cards-error-message").textContent,
    ).toBe("Não foi possível carregar os cartões. Tente novamente.");
  });

  it("should show a permission error when loading cards returns 403", async () => {
    const error = Object.assign(new Error("Forbidden"), {
      status: 403,
    });

    await loadHistoryCardsPage([
      {
        value: [{ id: 1, name: "Java" }],
      },
      rejectedResponse(error),
    ]);

    expect(
      document.querySelector(".history-cards-error-message").textContent,
    ).toBe("Você não tem permissão para consultar estes cartões.");
  });

  it("should render the card as a button", async () => {
    await loadHistoryCardsPage([
      {
        value: [{ id: 1, name: "Java" }],
      },
      {
        value: {
          content: [
            {
              id: 10,
              front: "O que é Java?",
              editCount: 1,
              rememberedCount: 2,
              notRememberedCount: 0,
            },
          ],
          number: 0,
          totalPages: 1,
          totalElements: 1,
          first: true,
          last: true,
        },
      },
    ]);

    const row = document.querySelector(".history-card-row");

    expect(row).not.toBeNull();
    expect(row.tagName).toBe("BUTTON");
    expect(row.type).toBe("button");
  });

  it("should render all card counters with their labels", async () => {
    await loadHistoryCardsPage([
      {
        value: [{ id: 1, name: "Java" }],
      },
      {
        value: {
          content: [
            {
              id: 10,
              front: "O que é Java?",
              editCount: 3,
              rememberedCount: 4,
              notRememberedCount: 2,
            },
          ],
          number: 0,
          totalPages: 1,
          totalElements: 1,
          first: true,
          last: true,
        },
      },
    ]);

    expect(
      document.querySelector(".history-card-counter-edits").textContent,
    ).toContain("Edições");

    expect(
      document.querySelector(".history-card-counter-remembered").textContent,
    ).toContain("Lembrei");

    expect(
      document.querySelector(".history-card-counter-not-remembered")
        .textContent,
    ).toContain("Não lembrei");
  });

  it("should render the timeline action", async () => {
    await loadHistoryCardsPage([
      {
        value: [{ id: 1, name: "Java" }],
      },
      {
        value: {
          content: [
            {
              id: 10,
              front: "O que é Java?",
              editCount: 1,
              rememberedCount: 2,
              notRememberedCount: 0,
            },
          ],
          number: 0,
          totalPages: 1,
          totalElements: 1,
          first: true,
          last: true,
        },
      },
    ]);

    expect(document.querySelector(".history-card-action").textContent).toBe(
      "Ver timeline",
    );
  });

  it("should not render pagination when there is only one page", async () => {
    await loadHistoryCardsPage([
      {
        value: [{ id: 1, name: "Java" }],
      },
      {
        value: {
          content: [
            {
              id: 10,
              front: "O que é Java?",
              editCount: 1,
              rememberedCount: 2,
              notRememberedCount: 0,
            },
          ],
          number: 0,
          totalPages: 1,
          totalElements: 1,
          first: true,
          last: true,
        },
      },
    ]);

    expect(document.querySelector(".history-cards-pagination")).toBeNull();
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

    expect(
      document
        .querySelector(".history-cards-pagination")
        .getAttribute("aria-label"),
    ).toBe("Paginação do histórico");

    buttons[1].click();

    await waitForAsync();

    expect(apiRequest).toHaveBeenNthCalledWith(
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

    await waitForAsync();

    expect(apiRequest).toHaveBeenNthCalledWith(
      4,
      "/history/collections/1/cards?page=0&size=20",
    );

    expect(document.querySelector(".history-card-front").textContent).toBe(
      "O que é uma classe?",
    );
  });

  it("should use the page size of 20 when loading cards", async () => {
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

    expect(apiRequest).toHaveBeenNthCalledWith(
      2,
      "/history/collections/1/cards?page=0&size=20",
    );
  });
});
