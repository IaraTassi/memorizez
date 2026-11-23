describe("Free Study Session", () => {
  const fs = require("fs");
  const path = require("path");

  const freeStudySessionHtml = fs.readFileSync(
    path.resolve(__dirname, "../../free-study-session.html"),
    "utf8",
  );

  const bodyHtml = freeStudySessionHtml.match(
    /<body[^>]*>([\s\S]*?)<\/body>/i,
  )[1];

  function rejectedResponse(error) {
    return {
      type: "reject",
      error,
    };
  }

  async function waitForAsync() {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  async function loadFreeStudySessionPage(
    apiResponses = [],
    collectionId = "1",
    includeContainer = true,
    authenticated = true,
  ) {
    document.body.innerHTML = bodyHtml;

    if (!includeContainer) {
      document.body.innerHTML = "<main></main>";
    }

    window.history.replaceState(
      {},
      "",
      `/free-study-session.html${
        collectionId ? `?collectionId=${collectionId}` : ""
      }`,
    );

    window.MemorizezSession = {
      requireAuthentication: jest.fn(() => authenticated),
    };

    global.apiRequest = jest.fn();

    apiResponses.forEach((response) => {
      if (response?.type === "reject") {
        global.apiRequest.mockRejectedValueOnce(response.error);
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
      require("../../js/pages/free-study-session");

      if (initialize) {
        await initialize();
      }
    } finally {
      addEventListenerSpy.mockRestore();
    }

    await waitForAsync();
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should not execute when the user is not authenticated", async () => {
    await loadFreeStudySessionPage([], "1", true, false);

    expect(window.MemorizezSession.requireAuthentication).toHaveBeenCalled();

    expect(apiRequest).not.toHaveBeenCalled();
  });

  it("should not execute when the content container does not exist", async () => {
    await loadFreeStudySessionPage([], "1", false);

    expect(apiRequest).not.toHaveBeenCalled();
  });

  it("should show an error message when collectionId is missing", async () => {
    await loadFreeStudySessionPage([], "");

    expect(apiRequest).not.toHaveBeenCalled();

    expect(
      document.querySelector(".free-study-session-error").textContent,
    ).toBe(
      "Não foi possível identificar a coleção. Volte ao Estudo livre e selecione uma coleção.",
    );
  });

  it("should show an error message when the collection is not found", async () => {
    await loadFreeStudySessionPage([
      [
        {
          id: "2",
          name: "JavaScript",
          cardCount: 5,
        },
      ],
    ]);

    expect(apiRequest).toHaveBeenCalledTimes(1);
    expect(apiRequest).toHaveBeenCalledWith("/free-study/collections");

    expect(
      document.querySelector(".free-study-session-error").textContent,
    ).toBe(
      "Coleção não encontrada. Volte ao Estudo livre e selecione outra coleção.",
    );
  });

  it("should load and render the first card successfully", async () => {
    await loadFreeStudySessionPage([
      [
        {
          id: "1",
          name: "Java",
          cardCount: 2,
        },
      ],
      {
        cardId: "card-1",
        front: "O que é Java?",
      },
    ]);

    expect(apiRequest).toHaveBeenNthCalledWith(1, "/free-study/collections");

    expect(apiRequest).toHaveBeenNthCalledWith(2, "/free-study/collections/1");

    expect(
      document.querySelector(".free-study-session-title").textContent,
    ).toBe("Estudo livre");

    expect(
      document.querySelector(".free-study-session-collection-name").textContent,
    ).toBe("Java");

    expect(
      document.querySelector(".free-study-session-front").textContent,
    ).toBe("O que é Java?");

    expect(
      document.querySelector(".free-study-session-progress-text").textContent,
    ).toBe("1 de 2");

    expect(
      document.querySelector(".free-study-session-button").textContent,
    ).toBe("Revelar verso");
  });

  it("should configure the progress bar accessibility attributes", async () => {
    await loadFreeStudySessionPage([
      [
        {
          id: "1",
          name: "Java",
          cardCount: 2,
        },
      ],
      {
        cardId: "card-1",
        front: "O que é Java?",
      },
    ]);

    const progress = document.querySelector(
      ".free-study-session-progress-track",
    );

    expect(progress.getAttribute("role")).toBe("progressbar");
    expect(progress.getAttribute("aria-label")).toBe("Progresso da coleção");
    expect(progress.getAttribute("aria-valuemin")).toBe("0");
    expect(progress.getAttribute("aria-valuemax")).toBe("2");
    expect(progress.getAttribute("aria-valuenow")).toBe("1");

    expect(
      document.querySelector(".free-study-session-progress-bar").style.width,
    ).toBe("50%");
  });

  it("should show an empty message when the collection has no cards", async () => {
    await loadFreeStudySessionPage([
      [
        {
          id: "1",
          name: "Java",
          cardCount: 0,
        },
      ],
    ]);

    expect(apiRequest).toHaveBeenCalledTimes(1);

    expect(
      document.querySelector(".free-study-session-message").textContent,
    ).toBe("Esta coleção ainda não possui cartões.");

    expect(document.querySelector(".free-study-session-card")).toBeNull();
  });

  it("should display the completion screen when the first card is unavailable", async () => {
    await loadFreeStudySessionPage([
      [
        {
          id: "1",
          name: "Java",
          cardCount: 1,
        },
      ],
      null,
    ]);

    expect(
      document.querySelector(".free-study-session-completion-title")
        .textContent,
    ).toBe("Coleção concluída!");

    expect(document.querySelector(".free-study-session-card")).toBeNull();
  });

  it("should reveal the card back and display notes", async () => {
    await loadFreeStudySessionPage([
      [
        {
          id: "1",
          name: "Java",
          cardCount: 2,
        },
      ],
      {
        cardId: "card-1",
        front: "O que é Java?",
      },
      {
        back: "Java é uma linguagem de programação.",
        notes: "Criada pela Sun Microsystems.",
      },
    ]);

    const revealButton = document.querySelector(".free-study-session-button");

    revealButton.click();

    await waitForAsync();

    expect(apiRequest).toHaveBeenNthCalledWith(
      3,
      "/free-study/collections/1/cards/card-1/back",
    );

    expect(document.querySelector(".free-study-session-back").textContent).toBe(
      "Java é uma linguagem de programação.",
    );

    expect(
      document.querySelector(".free-study-session-notes").textContent,
    ).toBe("Criada pela Sun Microsystems.");

    expect(
      document
        .querySelector(".free-study-session-front")
        .classList.contains("is-revealed"),
    ).toBe(true);

    expect(revealButton.textContent).toBe("Próximo cartão");
    expect(revealButton.disabled).toBe(false);
  });

  it("should reveal the card back without displaying notes when notes are absent", async () => {
    await loadFreeStudySessionPage([
      [
        {
          id: "1",
          name: "Java",
          cardCount: 2,
        },
      ],
      {
        cardId: "card-1",
        front: "O que é Java?",
      },
      {
        back: "Java é uma linguagem de programação.",
      },
    ]);

    const revealButton = document.querySelector(".free-study-session-button");

    revealButton.click();

    await waitForAsync();

    expect(document.querySelector(".free-study-session-back").textContent).toBe(
      "Java é uma linguagem de programação.",
    );

    expect(document.querySelector(".free-study-session-notes")).toBeNull();

    expect(revealButton.textContent).toBe("Próximo cartão");
  });

  it("should show an error when the reveal request returns no response", async () => {
    await loadFreeStudySessionPage([
      [
        {
          id: "1",
          name: "Java",
          cardCount: 2,
        },
      ],
      {
        cardId: "card-1",
        front: "O que é Java?",
      },
      null,
    ]);

    const revealButton = document.querySelector(".free-study-session-button");

    revealButton.click();

    await waitForAsync();

    expect(
      document.querySelector(".free-study-session-error").textContent,
    ).toBe("Não foi possível revelar o cartão. Tente novamente.");

    expect(revealButton.disabled).toBe(false);
    expect(revealButton.textContent).toBe("Revelar verso");
  });

  it("should show an error when revealing the card fails", async () => {
    await loadFreeStudySessionPage([
      [
        {
          id: "1",
          name: "Java",
          cardCount: 2,
        },
      ],
      {
        cardId: "card-1",
        front: "O que é Java?",
      },
      rejectedResponse(new Error("Server error")),
    ]);

    const revealButton = document.querySelector(".free-study-session-button");

    revealButton.click();

    await waitForAsync();

    expect(
      document.querySelector(".free-study-session-error").textContent,
    ).toBe("Não foi possível revelar o cartão. Tente novamente.");

    expect(revealButton.disabled).toBe(false);
    expect(revealButton.textContent).toBe("Revelar verso");
  });

  it.each([401, 403])(
    "should show the generic error when revealing the card returns status %i",
    async (status) => {
      await loadFreeStudySessionPage([
        [
          {
            id: "1",
            name: "Java",
            cardCount: 2,
          },
        ],
        {
          cardId: "card-1",
          front: "O que é Java?",
        },
        rejectedResponse({
          status,
        }),
      ]);

      const revealButton = document.querySelector(".free-study-session-button");

      revealButton.click();

      await waitForAsync();

      expect(
        document.querySelector(".free-study-session-error").textContent,
      ).toBe("Não foi possível revelar o cartão. Tente novamente.");

      expect(revealButton.disabled).toBe(false);
      expect(revealButton.textContent).toBe("Revelar verso");
    },
  );

  it("should load and render the next card successfully", async () => {
    await loadFreeStudySessionPage([
      [
        {
          id: "1",
          name: "Java",
          cardCount: 2,
        },
      ],
      {
        cardId: "card-1",
        front: "O que é Java?",
      },
      {
        back: "Java é uma linguagem de programação.",
        notes: "Criada pela Sun Microsystems.",
      },
      {
        cardId: "card-2",
        front: "O que é JVM?",
      },
    ]);

    const button = document.querySelector(".free-study-session-button");

    button.click();
    await waitForAsync();

    button.click();
    await waitForAsync();

    expect(apiRequest).toHaveBeenNthCalledWith(
      4,
      "/free-study/collections/1/cards/card-1",
    );

    expect(
      document.querySelector(".free-study-session-front").textContent,
    ).toBe("O que é JVM?");

    expect(document.querySelector(".free-study-session-back")).toBeNull();

    expect(document.querySelector(".free-study-session-notes")).toBeNull();

    expect(
      document.querySelector(".free-study-session-progress-text").textContent,
    ).toBe("2 de 2");

    const nextRevealButton = document.querySelector(
      ".free-study-session-button",
    );

    expect(nextRevealButton.textContent).toBe("Revelar verso");
    expect(nextRevealButton.disabled).toBe(false);
  });

  it("should display the completion screen when there are no more cards", async () => {
    await loadFreeStudySessionPage([
      [
        {
          id: "1",
          name: "Java",
          cardCount: 1,
        },
      ],
      {
        cardId: "card-1",
        front: "O que é Java?",
      },
      {
        back: "Java é uma linguagem de programação.",
      },
      null,
    ]);

    const revealButton = document.querySelector(".free-study-session-button");

    revealButton.click();
    await waitForAsync();

    const nextButton = document.querySelector(".free-study-session-button");

    nextButton.click();
    await waitForAsync();

    expect(apiRequest).toHaveBeenNthCalledWith(
      4,
      "/free-study/collections/1/cards/card-1",
    );

    expect(
      document.querySelector(".free-study-session-completion-title")
        .textContent,
    ).toBe("Coleção concluída!");

    expect(
      document.querySelector(".free-study-session-completion-description")
        .textContent,
    ).toBe("Você percorreu todos os cartões desta coleção.");

    expect(document.querySelector(".free-study-session-card")).toBeNull();

    expect(
      document.querySelector(".free-study-session-button").textContent,
    ).toBe("Voltar ao Estudo livre");
  });

  it("should show an error when loading the next card fails", async () => {
    await loadFreeStudySessionPage([
      [
        {
          id: "1",
          name: "Java",
          cardCount: 2,
        },
      ],
      {
        cardId: "card-1",
        front: "O que é Java?",
      },
      {
        back: "Java é uma linguagem de programação.",
      },
      rejectedResponse(new Error("Server error")),
    ]);

    const button = document.querySelector(".free-study-session-button");

    button.click();
    await waitForAsync();

    button.click();
    await waitForAsync();

    expect(apiRequest).toHaveBeenNthCalledWith(
      4,
      "/free-study/collections/1/cards/card-1",
    );

    expect(
      document.querySelector(".free-study-session-error").textContent,
    ).toBe("Não foi possível carregar o próximo cartão. Tente novamente.");

    expect(button.disabled).toBe(false);
    expect(button.textContent).toBe("Próximo cartão");
  });

  it("should show an error when loading the collection fails", async () => {
    await loadFreeStudySessionPage([
      rejectedResponse(new Error("Server error")),
    ]);

    expect(apiRequest).toHaveBeenCalledTimes(1);

    expect(
      document.querySelector(".free-study-session-error").textContent,
    ).toBe("Não foi possível carregar a coleção. Tente novamente.");
  });

  it("should show the generic error when loading the collection returns status 401", async () => {
    await loadFreeStudySessionPage([
      rejectedResponse({
        status: 401,
      }),
    ]);

    expect(
      document.querySelector(".free-study-session-error").textContent,
    ).toBe("Não foi possível carregar a coleção. Tente novamente.");
  });

  it("should show the generic error when loading the collection returns status 403", async () => {
    await loadFreeStudySessionPage([
      rejectedResponse({
        status: 403,
      }),
    ]);

    expect(
      document.querySelector(".free-study-session-error").textContent,
    ).toBe("Não foi possível carregar a coleção. Tente novamente.");
  });
});
