describe("History", () => {
  const fs = require("fs");
  const path = require("path");

  const historyHtml = fs.readFileSync(
    path.resolve(__dirname, "../../history.html"),
    "utf8",
  );

  const bodyMatch = historyHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyHtml = bodyMatch ? bodyMatch[1] : "";

  async function waitForAsync() {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  async function loadHistoryPage(
    apiResponse = [],
    authenticated = true,
    includeContainer = true,
  ) {
    document.body.innerHTML = bodyHtml;

    if (!includeContainer) {
      document.body.innerHTML = "<main></main>";
    }

    window.MemorizezSession = {
      requireAuthentication: jest.fn(() => authenticated),
    };

    global.apiRequest = jest.fn().mockResolvedValue(apiResponse);

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
      require("../../js/pages/history");

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
    await loadHistoryPage([], false);

    expect(window.MemorizezSession.requireAuthentication).toHaveBeenCalled();

    expect(apiRequest).not.toHaveBeenCalled();
  });

  it("should not execute when the collections container does not exist", async () => {
    await loadHistoryPage([], true, false);

    expect(apiRequest).not.toHaveBeenCalled();
  });

  it("should load the collections successfully", async () => {
    const collections = [
      {
        id: "1",
        name: "Java",
        cardCount: 10,
      },
    ];

    await loadHistoryPage(collections);

    expect(apiRequest).toHaveBeenCalledTimes(1);
    expect(apiRequest).toHaveBeenCalledWith("/history/collections");

    expect(document.querySelector(".history-collection-name").textContent).toBe(
      "Java",
    );

    expect(
      document.querySelector(".history-collection-count").textContent,
    ).toBe("10 cartões");
  });

  it("should render multiple collections", async () => {
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
      {
        id: "3",
        name: "Spring Boot",
        cardCount: 1,
      },
    ];

    await loadHistoryPage(collections);

    const rows = document.querySelectorAll(".history-collection-row");

    expect(rows).toHaveLength(3);

    expect(rows[0].querySelector(".history-collection-name").textContent).toBe(
      "Java",
    );

    expect(rows[1].querySelector(".history-collection-name").textContent).toBe(
      "JavaScript",
    );

    expect(rows[2].querySelector(".history-collection-name").textContent).toBe(
      "Spring Boot",
    );
  });

  it("should show an empty message when the user has no collections", async () => {
    await loadHistoryPage([]);

    expect(apiRequest).toHaveBeenCalledWith("/history/collections");

    expect(document.querySelector(".history-empty-message").textContent).toBe(
      "Você ainda não possui coleções para consultar no histórico.",
    );

    expect(document.querySelector(".history-collection-row")).toBeNull();
  });

  it("should display the singular form when the collection has only one card", async () => {
    const collections = [
      {
        id: "1",
        name: "Java",
        cardCount: 1,
      },
    ];

    await loadHistoryPage(collections);

    expect(
      document.querySelector(".history-collection-count").textContent,
    ).toBe("1 cartão");
  });

  it("should display the plural form when the collection has multiple cards", async () => {
    const collections = [
      {
        id: "1",
        name: "Java",
        cardCount: 10,
      },
    ];

    await loadHistoryPage(collections);

    expect(
      document.querySelector(".history-collection-count").textContent,
    ).toBe("10 cartões");
  });

  it("should show an error message when the API returns an invalid response", async () => {
    await loadHistoryPage({
      message: "Invalid response",
    });

    expect(apiRequest).toHaveBeenCalledWith("/history/collections");

    expect(document.querySelector(".history-error-message").textContent).toBe(
      "Não foi possível carregar suas coleções. Tente novamente.",
    );

    expect(document.querySelector(".history-collection-row")).toBeNull();
  });

  it("should show a generic error message when the API returns null", async () => {
    await loadHistoryPage(null);

    expect(document.querySelector(".history-error-message").textContent).toBe(
      "Não foi possível carregar suas coleções. Tente novamente.",
    );
  });

  it.each([401, 403])(
    "should show a generic error message when the API returns status %i",
    async (status) => {
      const error = new Error("Authentication error");
      error.status = status;

      await loadHistoryPageRejected(error);

      expect(document.querySelector(".history-error-message").textContent).toBe(
        "Não foi possível carregar suas coleções. Tente novamente.",
      );
    },
  );

  it("should show a generic error message when the API request fails", async () => {
    const error = new Error("Internal Server Error");

    await loadHistoryPageRejected(error);

    expect(apiRequest).toHaveBeenCalledWith("/history/collections");

    expect(document.querySelector(".history-error-message").textContent).toBe(
      "Não foi possível carregar suas coleções. Tente novamente.",
    );
  });

  it("should render each collection as a button", async () => {
    const collections = [
      {
        id: "1",
        name: "Java",
        cardCount: 10,
      },
    ];

    await loadHistoryPage(collections);

    const button = document.querySelector(".history-collection-row");

    expect(button).not.toBeNull();
    expect(button.tagName).toBe("BUTTON");
    expect(button.type).toBe("button");

    expect(button.querySelector(".history-collection-name").textContent).toBe(
      "Java",
    );
  });

  it("should render the collection icon with aria-hidden", async () => {
    await loadHistoryPage([
      {
        id: "1",
        name: "Java",
        cardCount: 10,
      },
    ]);

    const icon = document.querySelector(".history-collection-icon");

    expect(icon).not.toBeNull();
    expect(icon.getAttribute("aria-hidden")).toBe("true");
    expect(icon.querySelector("svg")).not.toBeNull();
  });

  it("should render the chevron with aria-hidden", async () => {
    await loadHistoryPage([
      {
        id: "1",
        name: "Java",
        cardCount: 10,
      },
    ]);

    const chevron = document.querySelector(".history-collection-chevron");

    expect(chevron).not.toBeNull();
    expect(chevron.getAttribute("aria-hidden")).toBe("true");
    expect(chevron.textContent).toBe("›");
  });

  it("should render the collection name and card count inside the button", async () => {
    await loadHistoryPage([
      {
        id: "1",
        name: "Java",
        cardCount: 3,
      },
    ]);

    const button = document.querySelector(".history-collection-row");

    expect(button.querySelector(".history-collection-name")).not.toBeNull();

    expect(button.querySelector(".history-collection-count")).not.toBeNull();

    expect(button.querySelector(".history-collection-name").textContent).toBe(
      "Java",
    );

    expect(button.querySelector(".history-collection-count").textContent).toBe(
      "3 cartões",
    );
  });

  async function loadHistoryPageRejected(error) {
    document.body.innerHTML = bodyHtml;

    window.MemorizezSession = {
      requireAuthentication: jest.fn(() => true),
    };

    global.apiRequest = jest.fn().mockRejectedValue(error);

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
      require("../../js/pages/history");

      if (initialize) {
        initialize();
      }
    } finally {
      addEventListenerSpy.mockRestore();
    }

    await waitForAsync();
  }
});
