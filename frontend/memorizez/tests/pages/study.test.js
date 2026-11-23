describe("Study", () => {
  const fs = require("fs");
  const path = require("path");

  const studyHtml = fs.readFileSync(
    path.resolve(__dirname, "../../study.html"),
    "utf8",
  );

  const bodyHtml = studyHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i)[1];

  const progress = {
    completedCards: 0,
    totalCards: 5,
    percentage: 0,
  };

  const collections = [{ id: "1", name: "Java" }];

  const firstCard = {
    cardId: 10,
    front: "O que é Java?",
    progress,
  };

  const revealedCard = {
    cardId: 10,
    front: "O que é Java?",
    back: "Uma linguagem de programação.",
    notes: null,
  };

  const nextCardResponse = {
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

  const completedResponse = {
    completed: true,
    progress: {
      completedCards: 1,
      totalCards: 1,
      percentage: 100,
    },
  };

  async function waitForAsync() {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  async function loadStudyPage(
    apiResponses = [],
    search = "?collectionId=1",
    authenticated = true,
  ) {
    window.history.replaceState({}, "", `/study.html${search}`);

    document.body.innerHTML = bodyHtml;

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
      require("../../js/pages/study");

      if (initialize) {
        initialize();
      }
    } finally {
      addEventListenerSpy.mockRestore();
    }

    await waitForAsync();
  }

  function rejectedResponse(error) {
    return {
      type: "reject",
      error,
    };
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should load the collection and start the study session successfully", async () => {
    await loadStudyPage([collections, firstCard]);

    expect(global.apiRequest).toHaveBeenNthCalledWith(1, "/collections");

    expect(global.apiRequest).toHaveBeenNthCalledWith(
      2,
      "/reviews/collections/1/start",
      { method: "POST" },
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

    expect(
      document.querySelector("#study-progress-percentage").textContent,
    ).toBe("0%");
  });

  it("should require authentication before loading the study", async () => {
    await loadStudyPage([], "?collectionId=1", false);

    expect(window.MemorizezSession.requireAuthentication).toHaveBeenCalled();

    expect(global.apiRequest).not.toHaveBeenCalled();
  });

  it("should show a message when collectionId is missing", async () => {
    await loadStudyPage([], "");

    expect(global.apiRequest).not.toHaveBeenCalled();

    expect(document.querySelector("#study-message").textContent).toBe(
      "Nenhuma coleção foi informada.",
    );
  });

  it("should show an error when the collection does not exist", async () => {
    await loadStudyPage([[]]);

    expect(global.apiRequest).toHaveBeenCalledTimes(1);

    expect(document.querySelector("#study-message").textContent).toBe(
      "Coleção não encontrada.",
    );
  });

  it("should show an error when loading collections fails", async () => {
    await loadStudyPage([rejectedResponse(new Error("Network error"))]);

    expect(document.querySelector("#study-message").textContent).toBe(
      "Não foi possível iniciar a revisão. Verifique se há cartões disponíveis.",
    );
  });

  it("should show an error when starting the study session fails", async () => {
    const error = new Error("Not found");
    error.status = 404;

    await loadStudyPage([collections, rejectedResponse(error)]);

    expect(document.querySelector("#study-message").textContent).toBe(
      "Coleção não encontrada.",
    );
  });

  it("should show the generic initialization message when the session request returns 401", async () => {
    const error = new Error("Unauthorized");
    error.status = 401;

    await loadStudyPage([rejectedResponse(error)]);

    expect(document.querySelector("#study-message").textContent).toBe(
      "Não foi possível iniciar a revisão. Verifique se há cartões disponíveis.",
    );
  });

  it("should reveal the card answer when clicking the card", async () => {
    await loadStudyPage([collections, firstCard, revealedCard]);

    document.querySelector(".study-card").click();

    await waitForAsync();

    expect(global.apiRequest).toHaveBeenNthCalledWith(
      3,
      "/reviews/collections/1/cards/10/review",
    );

    expect(document.querySelector(".study-card-answer").textContent).toBe(
      "Uma linguagem de programação.",
    );

    expect(
      document.querySelector(".study-card").getAttribute("aria-label"),
    ).toBe("Resposta revelada");

    const buttons = document.querySelectorAll(".study-actions button");

    expect(buttons[0].disabled).toBe(false);
    expect(buttons[1].disabled).toBe(false);
  });

  it("should display the card notes when revealing the answer", async () => {
    const cardWithNotes = {
      ...revealedCard,
      notes: "Criada pela Sun Microsystems.",
    };

    await loadStudyPage([collections, firstCard, cardWithNotes]);

    document.querySelector(".study-card").click();

    await waitForAsync();

    expect(document.querySelector(".study-card-notes").textContent).toBe(
      "Criada pela Sun Microsystems.",
    );
  });

  it("should not display notes when the revealed card has no notes", async () => {
    await loadStudyPage([collections, firstCard, revealedCard]);

    document.querySelector(".study-card").click();

    await waitForAsync();

    expect(document.querySelector(".study-card-notes")).toBeNull();
  });

  it("should reveal the answer when pressing Enter", async () => {
    await loadStudyPage([collections, firstCard, revealedCard]);

    document.querySelector(".study-card").dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
      }),
    );

    await waitForAsync();

    expect(document.querySelector(".study-card-answer").textContent).toBe(
      "Uma linguagem de programação.",
    );
  });

  it("should reveal the answer when pressing Space", async () => {
    await loadStudyPage([collections, firstCard, revealedCard]);

    document.querySelector(".study-card").dispatchEvent(
      new KeyboardEvent("keydown", {
        key: " ",
        bubbles: true,
      }),
    );

    await waitForAsync();

    expect(document.querySelector(".study-card-answer").textContent).toBe(
      "Uma linguagem de programação.",
    );
  });

  it("should not request the answer more than once while revealing", async () => {
    let resolveReveal;

    const pendingReveal = new Promise((resolve) => {
      resolveReveal = resolve;
    });

    await loadStudyPage([collections, firstCard, pendingReveal]);

    const studyCard = document.querySelector(".study-card");

    studyCard.click();
    studyCard.click();

    expect(global.apiRequest).toHaveBeenCalledTimes(3);

    resolveReveal(revealedCard);

    await waitForAsync();

    expect(document.querySelector(".study-card-answer").textContent).toBe(
      "Uma linguagem de programação.",
    );
  });

  it("should show an error when revealing the answer fails", async () => {
    await loadStudyPage([
      collections,
      firstCard,
      rejectedResponse(new Error("Network error")),
    ]);

    document.querySelector(".study-card").click();

    await waitForAsync();

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
    await loadStudyPage([
      collections,
      firstCard,
      revealedCard,
      nextCardResponse,
    ]);

    document.querySelector(".study-card").click();
    await waitForAsync();

    document.querySelector(".button-primary").click();
    await waitForAsync();

    expect(global.apiRequest).toHaveBeenNthCalledWith(
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
    await loadStudyPage([
      collections,
      firstCard,
      revealedCard,
      nextCardResponse,
    ]);

    document.querySelector(".study-card").click();
    await waitForAsync();

    document.querySelector(".button-secondary").click();
    await waitForAsync();

    expect(global.apiRequest).toHaveBeenNthCalledWith(
      4,
      "/reviews/collections/1/cards/10/result",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ result: "NOT_REMEMBERED" }),
      },
    );
  });

  it("should update the progress after submitting a result", async () => {
    await loadStudyPage([
      collections,
      firstCard,
      revealedCard,
      nextCardResponse,
    ]);

    document.querySelector(".study-card").click();
    await waitForAsync();

    document.querySelector(".button-primary").click();
    await waitForAsync();

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
    await loadStudyPage([
      collections,
      firstCard,
      revealedCard,
      nextCardResponse,
    ]);

    document.querySelector(".study-card").click();
    await waitForAsync();

    document.querySelector(".button-primary").click();
    await waitForAsync();

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
    let resolveResult;

    const pendingResult = new Promise((resolve) => {
      resolveResult = resolve;
    });

    await loadStudyPage([collections, firstCard, revealedCard, pendingResult]);

    document.querySelector(".study-card").click();
    await waitForAsync();

    const buttons = document.querySelectorAll(".study-actions button");

    buttons[0].click();

    expect(buttons[0].disabled).toBe(true);
    expect(buttons[1].disabled).toBe(true);

    resolveResult(nextCardResponse);

    await waitForAsync();

    expect(document.querySelector(".study-card-front").textContent).toBe(
      "O que é JVM?",
    );
  });

  it("should show an error when submitting a result fails", async () => {
    await loadStudyPage([
      collections,
      firstCard,
      revealedCard,
      rejectedResponse(new Error("Network error")),
    ]);

    document.querySelector(".study-card").click();
    await waitForAsync();

    document.querySelector(".button-primary").click();
    await waitForAsync();

    expect(document.querySelector("#study-message").textContent).toBe(
      "Não foi possível registrar sua resposta. Tente novamente.",
    );

    const buttons = document.querySelectorAll(".study-actions button");

    expect(buttons[0].disabled).toBe(false);
    expect(buttons[1].disabled).toBe(false);
  });

  it("should show the generic submission message when the request returns 401", async () => {
    const error = new Error("Unauthorized");
    error.status = 401;

    await loadStudyPage([
      collections,
      firstCard,
      revealedCard,
      rejectedResponse(error),
    ]);

    document.querySelector(".study-card").click();
    await waitForAsync();

    document.querySelector(".button-primary").click();
    await waitForAsync();

    expect(document.querySelector("#study-message").textContent).toBe(
      "Não foi possível registrar sua resposta. Tente novamente.",
    );

    const buttons = document.querySelectorAll(".study-actions button");

    expect(buttons[0].disabled).toBe(false);
    expect(buttons[1].disabled).toBe(false);
  });

  it("should allow retrying after submitting a result fails", async () => {
    await loadStudyPage([
      collections,
      firstCard,
      revealedCard,
      rejectedResponse(new Error("Network error")),
      nextCardResponse,
    ]);

    document.querySelector(".study-card").click();
    await waitForAsync();

    document.querySelector(".button-primary").click();
    await waitForAsync();

    expect(document.querySelector("#study-message").textContent).toBe(
      "Não foi possível registrar sua resposta. Tente novamente.",
    );

    document.querySelector(".button-primary").click();
    await waitForAsync();

    expect(global.apiRequest).toHaveBeenCalledTimes(5);

    expect(document.querySelector(".study-card-front").textContent).toBe(
      "O que é JVM?",
    );
  });

  it("should display the completion screen when the study session is completed", async () => {
    await loadStudyPage([
      collections,
      {
        ...firstCard,
        progress: {
          completedCards: 0,
          totalCards: 1,
          percentage: 0,
        },
      },
      revealedCard,
      completedResponse,
    ]);

    document.querySelector(".study-card").click();
    await waitForAsync();

    document.querySelector(".button-primary").click();
    await waitForAsync();

    expect(document.querySelector(".study-completion h2").textContent).toBe(
      "Revisão concluída!",
    );

    expect(document.querySelector(".study-completion p").textContent).toBe(
      "Você concluiu todos os cartões disponíveis desta sessão.",
    );
  });

  it("should clear the current card when the study session is completed", async () => {
    await loadStudyPage([
      collections,
      {
        ...firstCard,
        progress: {
          completedCards: 0,
          totalCards: 1,
          percentage: 0,
        },
      },
      revealedCard,
      completedResponse,
    ]);

    document.querySelector(".study-card").click();
    await waitForAsync();

    document.querySelector(".button-primary").click();
    await waitForAsync();

    expect(document.querySelector(".study-card")).toBeNull();
    expect(document.querySelector(".study-actions")).toBeNull();

    expect(
      document.querySelector("#study-content .study-completion"),
    ).not.toBeNull();
  });

  it("should display the three navigation buttons when completed", async () => {
    await loadStudyPage([
      collections,
      {
        ...firstCard,
        progress: {
          completedCards: 0,
          totalCards: 1,
          percentage: 0,
        },
      },
      revealedCard,
      completedResponse,
    ]);

    document.querySelector(".study-card").click();
    await waitForAsync();

    document.querySelector(".button-primary").click();
    await waitForAsync();

    const completionButtons = document.querySelectorAll(
      ".study-completion-actions button",
    );

    expect(completionButtons).toHaveLength(3);

    expect(completionButtons[0].textContent).toBe("Estudo Livre");
    expect(completionButtons[1].textContent).toBe("Voltar para Home");
    expect(completionButtons[2].textContent).toBe("Voltar para Revisão");

    completionButtons.forEach((button) => {
      expect(button.disabled).toBe(false);
    });
  });

  it("should clear the message after successfully revealing the answer", async () => {
    await loadStudyPage([collections, firstCard, revealedCard]);

    const message = document.querySelector("#study-message");
    message.textContent = "Mensagem anterior";

    document.querySelector(".study-card").click();

    await waitForAsync();

    expect(message.textContent).toBe("");
  });
});
