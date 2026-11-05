describe("Study", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const fs = require("fs");
  const path = require("path");

  const studyHtml = fs.readFileSync(
    path.resolve(__dirname, "../study.html"),
    "utf8",
  );

  const bodyHtml = studyHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i)[1];

  async function loadStudyPage(apiResponses, search = "?collectionId=1") {
    window.history.replaceState({}, "", `/study.html${search}`);

    document.body.innerHTML = bodyHtml;

    global.apiRequest = jest.fn();

    apiResponses.forEach((response) => {
      global.apiRequest.mockResolvedValueOnce(response);
    });

    jest.resetModules();
    require("../js/study");

    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  it("should load the collection and start the study session successfully", async () => {
    const collections = [
      {
        id: "1",
        name: "Java",
      },
    ];

    const firstCard = {
      cardId: 10,
      front: "O que é Java?",
      progress: {
        completedCards: 0,
        totalCards: 5,
        percentage: 0,
      },
    };

    await loadStudyPage([collections, firstCard]);

    expect(apiRequest).toHaveBeenNthCalledWith(1, "/collections");

    expect(apiRequest).toHaveBeenNthCalledWith(
      2,
      "/reviews/collections/1/start",
      {
        method: "POST",
      },
    );

    expect(document.querySelector("#studyCollectionName").textContent).toBe(
      "Java",
    );

    expect(document.querySelector(".study-card-front").textContent).toBe(
      "O que é Java?",
    );

    expect(document.querySelector("#study-progress-count").textContent).toBe(
      "0/5 cartões",
    );
  });

  it("should show a message when collectionId is missing", async () => {
    await loadStudyPage([], "");

    expect(apiRequest).not.toHaveBeenCalled();

    expect(document.querySelector("#study-message").textContent).toBe(
      "Nenhuma coleção foi informada.",
    );
  });

  it("should show an error when the collection does not exist", async () => {
    await loadStudyPage([[]]);

    expect(apiRequest).toHaveBeenCalledTimes(1);

    expect(document.querySelector("#study-message").textContent).toBe(
      "Coleção não encontrada.",
    );
  });

  it("should show an error when loading collections fails", async () => {
    await loadStudyPage([Promise.reject(new Error("Network error"))]);

    expect(document.querySelector("#study-message").textContent).toBe(
      "Não foi possível iniciar a revisão. Verifique se há cartões disponíveis.",
    );
  });

  it("should show an error when starting the study session fails", async () => {
    const collections = [
      {
        id: "1",
        name: "Java",
      },
    ];

    const error = new Error("Not found");
    error.status = 404;

    await loadStudyPage([collections, Promise.reject(error)]);

    expect(document.querySelector("#study-message").textContent).toBe(
      "Coleção não encontrada.",
    );
  });

  it("should show an error when the session has expired", async () => {
    const error = new Error("Unauthorized");
    error.status = 401;

    await loadStudyPage([Promise.reject(error)]);

    expect(document.querySelector("#study-message").textContent).toBe(
      "Sua sessão expirou. Entre novamente para continuar.",
    );
  });

  it("should reveal the card answer when clicking the card", async () => {
    const collections = [{ id: "1", name: "Java" }];

    const firstCard = {
      cardId: 10,
      front: "O que é Java?",
      progress: {
        completedCards: 0,
        totalCards: 5,
        percentage: 0,
      },
    };

    const revealedCard = {
      cardId: 10,
      front: "O que é Java?",
      back: "Uma linguagem de programação.",
      notes: null,
    };

    await loadStudyPage([collections, firstCard, revealedCard]);

    document.querySelector(".study-card").click();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(apiRequest).toHaveBeenNthCalledWith(
      3,
      "/reviews/collections/1/cards/10/review",
    );

    expect(document.querySelector(".study-card-answer").textContent).toBe(
      "Uma linguagem de programação.",
    );

    expect(
      document.querySelector(".study-card").getAttribute("aria-label"),
    ).toBe("Resposta revelada");

    expect(
      document.querySelectorAll(".study-actions button").every,
    ).toBeUndefined();

    const buttons = document.querySelectorAll(".study-actions button");

    expect(buttons[0].disabled).toBe(false);
    expect(buttons[1].disabled).toBe(false);
  });

  it("should display the card notes when revealing the answer", async () => {
    const collections = [{ id: "1", name: "Java" }];

    const firstCard = {
      cardId: 10,
      front: "O que é Java?",
      progress: {
        completedCards: 0,
        totalCards: 5,
        percentage: 0,
      },
    };

    const revealedCard = {
      cardId: 10,
      front: "O que é Java?",
      back: "Uma linguagem de programação.",
      notes: "Criada pela Sun Microsystems.",
    };

    await loadStudyPage([collections, firstCard, revealedCard]);

    document.querySelector(".study-card").click();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.querySelector(".study-card-notes").textContent).toBe(
      "Criada pela Sun Microsystems.",
    );
  });

  it("should reveal the answer when pressing Enter", async () => {
    const collections = [{ id: "1", name: "Java" }];

    const firstCard = {
      cardId: 10,
      front: "O que é Java?",
      progress: {
        completedCards: 0,
        totalCards: 5,
        percentage: 0,
      },
    };

    const revealedCard = {
      cardId: 10,
      front: "O que é Java?",
      back: "Uma linguagem de programação.",
      notes: null,
    };

    await loadStudyPage([collections, firstCard, revealedCard]);

    document.querySelector(".study-card").dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
      }),
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.querySelector(".study-card-answer").textContent).toBe(
      "Uma linguagem de programação.",
    );
  });

  it("should reveal the answer when pressing Space", async () => {
    const collections = [{ id: "1", name: "Java" }];

    const firstCard = {
      cardId: 10,
      front: "O que é Java?",
      progress: {
        completedCards: 0,
        totalCards: 5,
        percentage: 0,
      },
    };

    const revealedCard = {
      cardId: 10,
      front: "O que é Java?",
      back: "Uma linguagem de programação.",
      notes: null,
    };

    await loadStudyPage([collections, firstCard, revealedCard]);

    document.querySelector(".study-card").dispatchEvent(
      new KeyboardEvent("keydown", {
        key: " ",
        bubbles: true,
      }),
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.querySelector(".study-card-answer").textContent).toBe(
      "Uma linguagem de programação.",
    );
  });

  it("should not request the answer more than once while revealing", async () => {
    const collections = [{ id: "1", name: "Java" }];

    const firstCard = {
      cardId: 10,
      front: "O que é Java?",
      progress: {
        completedCards: 0,
        totalCards: 5,
        percentage: 0,
      },
    };

    let resolveReveal;

    const pendingReveal = new Promise((resolve) => {
      resolveReveal = resolve;
    });

    await loadStudyPage([collections, firstCard, pendingReveal]);

    const studyCard = document.querySelector(".study-card");

    studyCard.click();
    studyCard.click();

    expect(apiRequest).toHaveBeenCalledTimes(3);

    resolveReveal({
      cardId: 10,
      front: "O que é Java?",
      back: "Uma linguagem de programação.",
      notes: null,
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.querySelector(".study-card-answer").textContent).toBe(
      "Uma linguagem de programação.",
    );
  });

  it("should show an error when revealing the answer fails", async () => {
    const collections = [{ id: "1", name: "Java" }];

    const firstCard = {
      cardId: 10,
      front: "O que é Java?",
      progress: {
        completedCards: 0,
        totalCards: 5,
        percentage: 0,
      },
    };

    await loadStudyPage([
      collections,
      firstCard,
      Promise.reject(new Error("Network error")),
    ]);

    document.querySelector(".study-card").click();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.querySelector("#study-message").textContent).toBe(
      "Não foi possível revelar a resposta. Tente novamente.",
    );

    expect(
      document.querySelector(".study-card").classList.contains("is-revealed"),
    ).toBe(false);

    const buttons = document.querySelectorAll(".study-actions button");

    expect(buttons[0].disabled).toBe(true);
    expect(buttons[1].disabled).toBe(true);
  });

  it("should submit REMEMBERED when clicking the remember button", async () => {
    const collections = [{ id: "1", name: "Java" }];

    const firstCard = {
      cardId: 10,
      front: "O que é Java?",
      progress: {
        completedCards: 0,
        totalCards: 5,
        percentage: 0,
      },
    };

    const revealedCard = {
      cardId: 10,
      front: "O que é Java?",
      back: "Uma linguagem de programação.",
      notes: null,
    };

    const response = {
      completed: false,
      progress: {
        completedCards: 1,
        totalCards: 5,
        percentage: 20,
      },
      nextCard: {
        cardId: 11,
        front: "O que é JVM?",
      },
    };

    await loadStudyPage([collections, firstCard, revealedCard, response]);

    document.querySelector(".study-card").click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    document.querySelector(".button-primary").click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(apiRequest).toHaveBeenNthCalledWith(
      4,
      "/reviews/collections/1/cards/10/result",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ result: "REMEMBERED" }),
      },
    );
  });

  it("should submit NOT_REMEMBERED when clicking the forgot button", async () => {
    const collections = [{ id: "1", name: "Java" }];

    const firstCard = {
      cardId: 10,
      front: "O que é Java?",
      progress: {
        completedCards: 0,
        totalCards: 5,
        percentage: 0,
      },
    };

    const revealedCard = {
      cardId: 10,
      front: "O que é Java?",
      back: "Uma linguagem de programação.",
      notes: null,
    };

    const response = {
      completed: false,
      progress: {
        completedCards: 1,
        totalCards: 5,
        percentage: 20,
      },
      nextCard: {
        cardId: 11,
        front: "O que é JVM?",
      },
    };

    await loadStudyPage([collections, firstCard, revealedCard, response]);

    document.querySelector(".study-card").click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    document.querySelector(".button-secondary").click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(apiRequest).toHaveBeenNthCalledWith(
      4,
      "/reviews/collections/1/cards/10/result",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ result: "NOT_REMEMBERED" }),
      }),
    );
  });

  it("should update the progress after submitting a result", async () => {
    const collections = [{ id: "1", name: "Java" }];

    const firstCard = {
      cardId: 10,
      front: "O que é Java?",
      progress: {
        completedCards: 0,
        totalCards: 5,
        percentage: 0,
      },
    };

    const revealedCard = {
      cardId: 10,
      front: "O que é Java?",
      back: "Uma linguagem de programação.",
      notes: null,
    };

    const response = {
      completed: false,
      progress: {
        completedCards: 1,
        totalCards: 5,
        percentage: 20,
      },
      nextCard: {
        cardId: 11,
        front: "O que é JVM?",
      },
    };

    await loadStudyPage([collections, firstCard, revealedCard, response]);

    document.querySelector(".study-card").click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    document.querySelector(".button-primary").click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.querySelector("#study-progress-count").textContent).toBe(
      "1/5 cartões",
    );

    expect(
      document.querySelector("#study-progress-percentage").textContent,
    ).toBe("20%");

    expect(document.querySelector("#study-progress-bar").style.width).toBe(
      "20%",
    );

    expect(
      document
        .querySelector("#study-progress-track")
        .getAttribute("aria-valuenow"),
    ).toBe("20");
  });

  it("should display the next card after submitting a result", async () => {
    const collections = [{ id: "1", name: "Java" }];

    const firstCard = {
      cardId: 10,
      front: "O que é Java?",
      progress: {
        completedCards: 0,
        totalCards: 5,
        percentage: 0,
      },
    };

    const revealedCard = {
      cardId: 10,
      front: "O que é Java?",
      back: "Uma linguagem de programação.",
      notes: null,
    };

    const response = {
      completed: false,
      progress: {
        completedCards: 1,
        totalCards: 5,
        percentage: 20,
      },
      nextCard: {
        cardId: 11,
        front: "O que é JVM?",
      },
    };

    await loadStudyPage([collections, firstCard, revealedCard, response]);

    document.querySelector(".study-card").click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    document.querySelector(".button-primary").click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.querySelector(".study-card-front").textContent).toBe(
      "O que é JVM?",
    );

    expect(document.querySelector(".study-card-answer").textContent).toBe(
      "Carregando resposta…",
    );

    const buttons = document.querySelectorAll(".study-actions button");

    expect(buttons[0].disabled).toBe(true);
    expect(buttons[1].disabled).toBe(true);
  });

  it("should disable the answer buttons while submitting a result", async () => {
    const collections = [{ id: "1", name: "Java" }];

    const firstCard = {
      cardId: 10,
      front: "O que é Java?",
      progress: {
        completedCards: 0,
        totalCards: 5,
        percentage: 0,
      },
    };

    const revealedCard = {
      cardId: 10,
      front: "O que é Java?",
      back: "Uma linguagem de programação.",
      notes: null,
    };

    let resolveResult;

    const pendingResult = new Promise((resolve) => {
      resolveResult = resolve;
    });

    await loadStudyPage([collections, firstCard, revealedCard, pendingResult]);

    document.querySelector(".study-card").click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const buttons = document.querySelectorAll(".study-actions button");

    buttons[0].click();

    expect(buttons[0].disabled).toBe(true);
    expect(buttons[1].disabled).toBe(true);

    resolveResult({
      completed: false,
      progress: {
        completedCards: 1,
        totalCards: 5,
        percentage: 20,
      },
      nextCard: {
        cardId: 11,
        front: "O que é JVM?",
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.querySelector(".study-card-front").textContent).toBe(
      "O que é JVM?",
    );
  });

  it("should show an error when submitting a result fails", async () => {
    const collections = [{ id: "1", name: "Java" }];

    const firstCard = {
      cardId: 10,
      front: "O que é Java?",
      progress: {
        completedCards: 0,
        totalCards: 5,
        percentage: 0,
      },
    };

    const revealedCard = {
      cardId: 10,
      front: "O que é Java?",
      back: "Uma linguagem de programação.",
      notes: null,
    };

    await loadStudyPage([
      collections,
      firstCard,
      revealedCard,
      Promise.reject(new Error("Network error")),
    ]);

    document.querySelector(".study-card").click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    document.querySelector(".button-primary").click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.querySelector("#study-message").textContent).toBe(
      "Não foi possível registrar sua resposta. Tente novamente.",
    );

    const buttons = document.querySelectorAll(".study-actions button");

    expect(buttons[0].disabled).toBe(false);
    expect(buttons[1].disabled).toBe(false);
  });

  it("should show a session expired message when submitting a result returns 401", async () => {
    const collections = [{ id: "1", name: "Java" }];

    const firstCard = {
      cardId: 10,
      front: "O que é Java?",
      progress: {
        completedCards: 0,
        totalCards: 5,
        percentage: 0,
      },
    };

    const revealedCard = {
      cardId: 10,
      front: "O que é Java?",
      back: "Uma linguagem de programação.",
      notes: null,
    };

    const error = new Error("Unauthorized");
    error.status = 401;

    await loadStudyPage([
      collections,
      firstCard,
      revealedCard,
      Promise.reject(error),
    ]);

    document.querySelector(".study-card").click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    document.querySelector(".button-primary").click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.querySelector("#study-message").textContent).toBe(
      "Sua sessão expirou. Entre novamente para continuar.",
    );

    const buttons = document.querySelectorAll(".study-actions button");

    expect(buttons[0].disabled).toBe(false);
    expect(buttons[1].disabled).toBe(false);
  });

  it("should allow retrying after submitting a result fails", async () => {
    const collections = [{ id: "1", name: "Java" }];

    const firstCard = {
      cardId: 10,
      front: "O que é Java?",
      progress: {
        completedCards: 0,
        totalCards: 5,
        percentage: 0,
      },
    };

    const revealedCard = {
      cardId: 10,
      front: "O que é Java?",
      back: "Uma linguagem de programação.",
      notes: null,
    };

    const successfulResponse = {
      completed: false,
      progress: {
        completedCards: 1,
        totalCards: 5,
        percentage: 20,
      },
      nextCard: {
        cardId: 11,
        front: "O que é JVM?",
      },
    };

    await loadStudyPage([
      collections,
      firstCard,
      revealedCard,
      Promise.reject(new Error("Network error")),
      successfulResponse,
    ]);

    document.querySelector(".study-card").click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    document.querySelector(".button-primary").click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    document.querySelector(".button-primary").click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(apiRequest).toHaveBeenCalledTimes(5);

    expect(document.querySelector(".study-card-front").textContent).toBe(
      "O que é JVM?",
    );
  });

  it("should display the completion screen when the study session is completed", async () => {
    const collections = [{ id: "1", name: "Java" }];

    const firstCard = {
      cardId: 10,
      front: "O que é Java?",
      progress: {
        completedCards: 0,
        totalCards: 1,
        percentage: 0,
      },
    };

    const revealedCard = {
      cardId: 10,
      front: "O que é Java?",
      back: "Uma linguagem de programação.",
      notes: null,
    };

    const response = {
      completed: true,
      progress: {
        completedCards: 1,
        totalCards: 1,
        percentage: 100,
      },
    };

    await loadStudyPage([collections, firstCard, revealedCard, response]);

    document.querySelector(".study-card").click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    document.querySelector(".button-primary").click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.querySelector(".study-completion h2").textContent).toBe(
      "Revisão concluída!",
    );

    expect(document.querySelector(".study-completion p").textContent).toBe(
      "Você concluiu todos os cartões disponíveis desta sessão.",
    );
  });

  it("should clear the current card when the study session is completed", async () => {
    const collections = [{ id: "1", name: "Java" }];

    const firstCard = {
      cardId: 10,
      front: "O que é Java?",
      progress: {
        completedCards: 0,
        totalCards: 1,
        percentage: 0,
      },
    };

    const revealedCard = {
      cardId: 10,
      front: "O que é Java?",
      back: "Uma linguagem de programação.",
      notes: null,
    };

    const response = {
      completed: true,
      progress: {
        completedCards: 1,
        totalCards: 1,
        percentage: 100,
      },
    };

    await loadStudyPage([collections, firstCard, revealedCard, response]);

    document.querySelector(".study-card").click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    document.querySelector(".button-primary").click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.querySelector(".study-card")).toBeNull();
    expect(document.querySelector(".study-actions")).toBeNull();

    expect(
      document.querySelector("#study-content .study-completion"),
    ).not.toBeNull();
  });

  it("should display a button to return to the review page when completed", async () => {
    const collections = [{ id: "1", name: "Java" }];

    const firstCard = {
      cardId: 10,
      front: "O que é Java?",
      progress: {
        completedCards: 0,
        totalCards: 1,
        percentage: 0,
      },
    };

    const revealedCard = {
      cardId: 10,
      front: "O que é Java?",
      back: "Uma linguagem de programação.",
      notes: null,
    };

    const response = {
      completed: true,
      progress: {
        completedCards: 1,
        totalCards: 1,
        percentage: 100,
      },
    };

    await loadStudyPage([collections, firstCard, revealedCard, response]);

    document.querySelector(".study-card").click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    document.querySelector(".button-primary").click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const backButton = document.querySelector(".study-completion button");

    expect(backButton).not.toBeNull();
    expect(backButton.textContent).toBe("Voltar à revisão");
    expect(backButton.disabled).toBe(false);
  });
});
