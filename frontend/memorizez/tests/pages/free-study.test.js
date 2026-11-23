describe("Free Study", () => {
  const fs = require("fs");
  const path = require("path");

  const freeStudyHtml = fs.readFileSync(
    path.resolve(__dirname, "../../free-study.html"),
    "utf8",
  );

  const bodyHtml = freeStudyHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i)[1];

  async function waitForAsync() {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  function rejectedResponse(error) {
    return {
      type: "reject",
      error,
    };
  }

  async function loadFreeStudyPage(
    apiResponse = [],
    includeContainer = true,
    authenticated = true,
  ) {
    document.body.innerHTML = bodyHtml;

    if (!includeContainer) {
      document.body.innerHTML = "<main></main>";
    }

    window.MemorizezSession = {
      requireAuthentication: jest.fn(() => authenticated),
    };

    global.apiRequest = jest.fn();

    if (apiResponse?.type === "reject") {
      global.apiRequest.mockRejectedValueOnce(apiResponse.error);
    } else {
      global.apiRequest.mockResolvedValueOnce(apiResponse);
    }

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
      require("../../js/pages/free-study");

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

  it("should require authentication before loading collections", async () => {
    await loadFreeStudyPage([], true, false);

    expect(window.MemorizezSession.requireAuthentication).toHaveBeenCalled();

    expect(global.apiRequest).not.toHaveBeenCalled();
  });

  it("should load the collections successfully", async () => {
    const collections = [
      {
        id: "1",
        name: "Java",
        cardCount: 10,
      },
      {
        id: "2",
        name: "JavaScript",
        cardCount: 5,
      },
    ];

    await loadFreeStudyPage(collections);

    expect(global.apiRequest).toHaveBeenCalledWith("/free-study/collections");

    expect(document.querySelectorAll(".free-study-collection")).toHaveLength(2);

    const names = document.querySelectorAll(".free-study-collection-name");

    expect(names[0].textContent).toBe("Java");
    expect(names[1].textContent).toBe("JavaScript");
  });

  it("should display the correct card count for each collection", async () => {
    await loadFreeStudyPage([
      { id: "1", name: "Java", cardCount: 10 },
      { id: "2", name: "JavaScript", cardCount: 5 },
    ]);

    const counts = document.querySelectorAll(".free-study-collection-count");

    expect(counts[0].textContent).toBe("10 cartões disponíveis para estudar.");

    expect(counts[1].textContent).toBe("5 cartões disponíveis para estudar.");
  });

  it("should display a singular message when a collection has one card", async () => {
    await loadFreeStudyPage([{ id: "1", name: "Java", cardCount: 1 }]);

    expect(
      document.querySelector(".free-study-collection-count").textContent,
    ).toBe("1 cartão disponível para estudar.");
  });

  it("should show an empty message when the user has no collections", async () => {
    await loadFreeStudyPage([]);

    expect(
      document.querySelector(".free-study-empty-message").textContent,
    ).toBe("Você ainda não possui coleções para estudar.");
  });

  it("should show an empty message when the API returns null", async () => {
    await loadFreeStudyPage(null);

    expect(
      document.querySelector(".free-study-empty-message").textContent,
    ).toBe("Você ainda não possui coleções para estudar.");
  });

  it("should show a generic error when loading collections fails", async () => {
    await loadFreeStudyPage(rejectedResponse(new Error("Network error")));

    expect(
      document.querySelector(".free-study-error-message").textContent,
    ).toBe("Não foi possível carregar suas coleções. Tente novamente.");
  });

  it("should show a generic error when the request returns 401", async () => {
    const error = new Error("Unauthorized");
    error.status = 401;

    await loadFreeStudyPage(rejectedResponse(error));

    expect(
      document.querySelector(".free-study-error-message").textContent,
    ).toBe("Não foi possível carregar suas coleções. Tente novamente.");
  });

  it("should show a generic error when the request returns 403", async () => {
    const error = new Error("Forbidden");
    error.status = 403;

    await loadFreeStudyPage(rejectedResponse(error));

    expect(
      document.querySelector(".free-study-error-message").textContent,
    ).toBe("Não foi possível carregar suas coleções. Tente novamente.");
  });

  it("should not request collections when the container does not exist", async () => {
    await loadFreeStudyPage([], false);

    expect(global.apiRequest).not.toHaveBeenCalled();
  });

  it("should create the collection icon", async () => {
    await loadFreeStudyPage([{ id: "1", name: "Java", cardCount: 10 }]);

    const icon = document.querySelector(".free-study-collection-icon");

    expect(icon).not.toBeNull();
    expect(icon.getAttribute("aria-hidden")).toBe("true");
    expect(icon.querySelector("svg")).not.toBeNull();
  });

  it("should create the collection chevron icon", async () => {
    await loadFreeStudyPage([{ id: "1", name: "Java", cardCount: 10 }]);

    const icon = document.querySelector(".free-study-chevron");

    expect(icon).not.toBeNull();
    expect(icon.getAttribute("aria-hidden")).toBe("true");
    expect(icon.querySelector("svg")).not.toBeNull();
  });

  it("should expand a collection when clicking its trigger", async () => {
    await loadFreeStudyPage([{ id: "1", name: "Java", cardCount: 10 }]);

    const collection = document.querySelector(".free-study-collection");

    const trigger = collection.querySelector(".free-study-collection-trigger");

    const panel = collection.querySelector(".free-study-collection-panel");

    trigger.click();

    expect(collection.classList.contains("is-expanded")).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(panel.getAttribute("aria-hidden")).toBe("false");
    expect(panel.inert).toBe(false);
  });

  it("should collapse a collection when clicking its trigger again", async () => {
    await loadFreeStudyPage([{ id: "1", name: "Java", cardCount: 10 }]);

    const collection = document.querySelector(".free-study-collection");

    const trigger = collection.querySelector(".free-study-collection-trigger");

    const panel = collection.querySelector(".free-study-collection-panel");

    trigger.click();
    trigger.click();

    expect(collection.classList.contains("is-expanded")).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(panel.getAttribute("aria-hidden")).toBe("true");
    expect(panel.inert).toBe(true);
  });

  it("should close the previously expanded collection when opening another", async () => {
    await loadFreeStudyPage([
      { id: "1", name: "Java", cardCount: 10 },
      { id: "2", name: "JavaScript", cardCount: 5 },
    ]);

    const collections = document.querySelectorAll(".free-study-collection");

    const firstTrigger = collections[0].querySelector(
      ".free-study-collection-trigger",
    );

    const secondTrigger = collections[1].querySelector(
      ".free-study-collection-trigger",
    );

    const firstPanel = collections[0].querySelector(
      ".free-study-collection-panel",
    );

    const secondPanel = collections[1].querySelector(
      ".free-study-collection-panel",
    );

    firstTrigger.click();
    secondTrigger.click();

    expect(collections[0].classList.contains("is-expanded")).toBe(false);
    expect(firstTrigger.getAttribute("aria-expanded")).toBe("false");
    expect(firstPanel.getAttribute("aria-hidden")).toBe("true");
    expect(firstPanel.inert).toBe(true);

    expect(collections[1].classList.contains("is-expanded")).toBe(true);
    expect(secondTrigger.getAttribute("aria-expanded")).toBe("true");
    expect(secondPanel.getAttribute("aria-hidden")).toBe("false");
    expect(secondPanel.inert).toBe(false);
  });

  it("should show an appropriate message when a collection has no cards", async () => {
    await loadFreeStudyPage([{ id: "1", name: "Java", cardCount: 0 }]);

    const collection = document.querySelector(".free-study-collection");

    const trigger = collection.querySelector(".free-study-collection-trigger");

    trigger.click();

    expect(collection.textContent).toContain(
      "Esta coleção ainda não possui cartões.",
    );

    expect(collection.textContent).toContain(
      "Adicione cartões à coleção para começar a estudar.",
    );

    expect(collection.querySelector(".free-study-start-button")).toBeNull();
  });

  it("should show the singular description when a collection has one card", async () => {
    await loadFreeStudyPage([{ id: "1", name: "Java", cardCount: 1 }]);

    const collection = document.querySelector(".free-study-collection");

    collection.querySelector(".free-study-collection-trigger").click();

    expect(
      collection.querySelector(".free-study-collection-description")
        .textContent,
    ).toBe("Percorra o cartão desta coleção no seu próprio ritmo.");
  });

  it("should show the plural description when a collection has multiple cards", async () => {
    await loadFreeStudyPage([{ id: "1", name: "Java", cardCount: 10 }]);

    const collection = document.querySelector(".free-study-collection");

    collection.querySelector(".free-study-collection-trigger").click();

    expect(
      collection.querySelector(".free-study-collection-description")
        .textContent,
    ).toBe(
      "Percorra os cartões desta coleção, um por vez, no seu próprio ritmo.",
    );
  });

  it("should show the study button when a collection has cards", async () => {
    await loadFreeStudyPage([{ id: "1", name: "Java", cardCount: 10 }]);

    const collection = document.querySelector(".free-study-collection");

    const trigger = collection.querySelector(".free-study-collection-trigger");

    trigger.click();

    const startButton = collection.querySelector(".free-study-start-button");

    expect(startButton).not.toBeNull();
    expect(startButton.textContent).toBe("Estudar esta coleção");
    expect(startButton.disabled).toBe(false);
  });

  it("should associate the trigger with its panel using aria-controls", async () => {
    await loadFreeStudyPage([{ id: "1", name: "Java", cardCount: 10 }]);

    const trigger = document.querySelector(".free-study-collection-trigger");

    const panel = document.querySelector(".free-study-collection-panel");

    expect(trigger.getAttribute("aria-controls")).toBe(panel.id);
    expect(panel.id).toBe("free-study-panel-0");
  });

  it("should assign different panel IDs to different collections", async () => {
    await loadFreeStudyPage([
      { id: "1", name: "Java", cardCount: 10 },
      { id: "2", name: "JavaScript", cardCount: 5 },
    ]);

    const panels = document.querySelectorAll(".free-study-collection-panel");

    expect(panels[0].id).toBe("free-study-panel-0");
    expect(panels[1].id).toBe("free-study-panel-1");
    expect(panels[0].id).not.toBe(panels[1].id);
  });
});
