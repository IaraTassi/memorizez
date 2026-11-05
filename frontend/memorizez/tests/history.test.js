describe("History", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const fs = require("fs");
  const path = require("path");

  const historyHtml = fs.readFileSync(
    path.resolve(__dirname, "../history.html"),
    "utf8",
  );

  const bodyHtml = historyHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i)[1];

  async function loadHistoryPage(apiResponse = []) {
    document.body.innerHTML = bodyHtml;

    global.apiRequest = jest.fn().mockResolvedValue(apiResponse);

    document.dispatchEvent(new Event("DOMContentLoaded"));

    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  require("../js/history");

  it("should load the collections successfully", async () => {
    const collections = [
      {
        id: "1",
        name: "Java",
        cardCount: 10,
      },
    ];

    await loadHistoryPage(collections);

    expect(apiRequest).toHaveBeenCalledWith("/history/collections");

    expect(document.querySelector(".history-collection-name").textContent).toBe(
      "Java",
    );

    expect(
      document.querySelector(".history-collection-count").textContent,
    ).toBe("10 cartões");
  });

  it("should show an empty message when the user has no collections", async () => {
    await loadHistoryPage([]);

    expect(apiRequest).toHaveBeenCalledWith("/history/collections");

    expect(document.querySelector(".history-empty-message").textContent).toBe(
      "Você ainda não possui coleções para consultar no histórico.",
    );
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
    await loadHistoryPage({ message: "Invalid response" });

    expect(apiRequest).toHaveBeenCalledWith("/history/collections");

    expect(document.querySelector(".history-error-message").textContent).toBe(
      "Não foi possível carregar suas coleções. Tente novamente.",
    );
  });

  it("should show an authentication error when the API returns 401", async () => {
    const error = new Error("Unauthorized");
    error.status = 401;

    global.apiRequest = jest.fn().mockRejectedValue(error);

    document.body.innerHTML = bodyHtml;
    document.dispatchEvent(new Event("DOMContentLoaded"));

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.querySelector(".history-error-message").textContent).toBe(
      "Sua sessão expirou. Faça login novamente para consultar o histórico.",
    );
  });

  it("should show an authentication error when the API returns 403", async () => {
    const error = new Error("Forbidden");
    error.status = 403;

    global.apiRequest = jest.fn().mockRejectedValue(error);

    document.body.innerHTML = bodyHtml;
    document.dispatchEvent(new Event("DOMContentLoaded"));

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.querySelector(".history-error-message").textContent).toBe(
      "Sua sessão expirou. Faça login novamente para consultar o histórico.",
    );
  });

  it("should show a generic error message when the API request fails", async () => {
    const error = new Error("Internal Server Error");

    global.apiRequest = jest.fn().mockRejectedValue(error);

    document.body.innerHTML = bodyHtml;
    document.dispatchEvent(new Event("DOMContentLoaded"));

    await new Promise((resolve) => setTimeout(resolve, 0));

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

    expect(
      button
        .querySelector(".history-collection-icon")
        .getAttribute("aria-hidden"),
    ).toBe("true");

    expect(
      button
        .querySelector(".history-collection-chevron")
        .getAttribute("aria-hidden"),
    ).toBe("true");
  });
});
