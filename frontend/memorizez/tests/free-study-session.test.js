describe("Free Study Session", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const fs = require("fs");
  const path = require("path");

  const freeStudySessionHtml = fs.readFileSync(
    path.resolve(__dirname, "../free-study-session.html"),
    "utf8",
  );

  const bodyHtml = freeStudySessionHtml.match(
    /<body[^>]*>([\s\S]*?)<\/body>/i,
  )[1];

  async function loadFreeStudySessionPage(
    apiResponses = [],
    collectionId = "1",
    includeContainer = true,
  ) {
    document.body.innerHTML = bodyHtml;

    if (!includeContainer) {
      document.body.innerHTML = "<main></main>";
    }

    delete window.location;
    window.history.replaceState(
      {},
      "",
      `/free-study-session.html${
        collectionId ? `?collectionId=${collectionId}` : ""
      }`,
    );

    global.apiRequest = jest.fn();

    apiResponses.forEach((response) => {
      global.apiRequest.mockResolvedValueOnce(response);
    });

    document.dispatchEvent(new Event("DOMContentLoaded"));

    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  require("../js/free-study-session");

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
      ,
      {
        back: "Java é uma linguagem de programação.",
        notes: "Criada pela Sun Microsystems.",
      },
    ]);

    const revealButton = document.querySelector(".free-study-session-button");

    revealButton.click();

    await new Promise((resolve) => setTimeout(resolve, 0));

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

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.querySelector(".free-study-session-back").textContent).toBe(
      "Java é uma linguagem de programação.",
    );

    expect(document.querySelector(".free-study-session-notes")).toBeNull();

    expect(revealButton.textContent).toBe("Próximo cartão");
  });

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

    // Revela o primeiro cartão.
    button.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Avança para o próximo cartão.
    button.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

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

    // Revela o cartão.
    revealButton.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Solicita o próximo cartão.
    const nextButton = document.querySelector(".free-study-session-button");

    nextButton.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

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

  it("should show an error message when revealing the card fails", async () => {
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

    apiRequest.mockRejectedValueOnce(new Error("Server error"));

    const revealButton = document.querySelector(".free-study-session-button");

    revealButton.click();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(
      document.querySelector(".free-study-session-error").textContent,
    ).toBe("Não foi possível revelar o cartão. Tente novamente.");

    expect(revealButton.disabled).toBe(false);
    expect(revealButton.textContent).toBe("Revelar verso");
  });

  it.each([401, 403])(
    "should show an authentication error when revealing the card returns %i",
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
      ]);

      apiRequest.mockRejectedValueOnce({
        status,
      });

      const revealButton = document.querySelector(".free-study-session-button");

      revealButton.click();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(
        document.querySelector(".free-study-session-error").textContent,
      ).toBe("Sua sessão expirou. Entre novamente para continuar.");

      expect(revealButton.disabled).toBe(false);
      expect(revealButton.textContent).toBe("Revelar verso");
    },
  );
});
