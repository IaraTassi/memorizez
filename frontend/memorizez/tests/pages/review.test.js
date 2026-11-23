describe("Review", () => {
  const fs = require("fs");
  const path = require("path");

  const reviewHtml = fs.readFileSync(
    path.resolve(__dirname, "../../review.html"),
    "utf8",
  );

  const bodyHtml = reviewHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i)[1];

  const collections = [
    {
      id: "1",
      name: "Java",
      createdAt: "2026-10-20T10:30:00",
      cardCount: 10,
      availableCardCount: 5,
    },
  ];

  async function loadReviewPage(apiResponse = [], authenticated = true) {
    document.body.innerHTML = bodyHtml;

    window.MemorizezSession = {
      requireAuthentication: jest.fn(() => authenticated),
    };

    global.apiRequest = jest.fn();

    if (apiResponse.type === "reject") {
      global.apiRequest.mockRejectedValue(apiResponse.error);
    } else {
      global.apiRequest.mockResolvedValue(apiResponse.value ?? apiResponse);
    }

    document.dispatchEvent(new Event("DOMContentLoaded"));

    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  require("../../js/pages/review");

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should load the collections successfully", async () => {
    await loadReviewPage(collections);

    expect(window.MemorizezSession.requireAuthentication).toHaveBeenCalled();

    expect(apiRequest).toHaveBeenCalledWith("/collections");

    expect(document.querySelector(".review-collection-name").textContent).toBe(
      "Java",
    );

    expect(document.querySelector(".review-status-text").textContent).toBe(
      "5 de 10 a estudar",
    );
  });

  it("should show an empty message when the user has no collections", async () => {
    await loadReviewPage([]);

    expect(apiRequest).toHaveBeenCalledWith("/collections");

    expect(document.querySelector(".collections-empty").textContent).toBe(
      "Você ainda não possui coleções.",
    );
  });

  it("should show an error when loading collections fails", async () => {
    await loadReviewPage({
      type: "reject",
      error: new Error("Network error"),
    });

    expect(apiRequest).toHaveBeenCalledWith("/collections");

    expect(document.querySelector(".collections-error").textContent).toBe(
      "Não foi possível carregar suas coleções. Tente novamente.",
    );
  });

  it("should render multiple collections", async () => {
    await loadReviewPage([
      {
        id: "1",
        name: "Java",
        createdAt: "2026-10-20T10:30:00",
        cardCount: 10,
        availableCardCount: 5,
      },
      {
        id: "2",
        name: "Spring Boot",
        createdAt: "2026-10-21T10:30:00",
        cardCount: 8,
        availableCardCount: 3,
      },
    ]);

    expect(document.querySelectorAll(".review-collection-card")).toHaveLength(
      2,
    );

    expect(
      [...document.querySelectorAll(".review-collection-name")].map(
        (element) => element.textContent,
      ),
    ).toEqual(["Java", "Spring Boot"]);
  });

  it("should show that the collection is up to date when no cards are available", async () => {
    await loadReviewPage([
      {
        ...collections[0],
        availableCardCount: 0,
      },
    ]);

    expect(document.querySelector(".review-status-text").textContent).toBe(
      "Você está em dia",
    );
  });

  it("should show the available cards count when cards need review", async () => {
    await loadReviewPage([
      {
        ...collections[0],
        cardCount: 11,
        availableCardCount: 2,
      },
    ]);

    expect(document.querySelector(".review-status-text").textContent).toBe(
      "2 de 11 a estudar",
    );
  });

  it("should disable the study button when no cards are available", async () => {
    await loadReviewPage([
      {
        ...collections[0],
        availableCardCount: 0,
      },
    ]);

    const reviewButton = document.querySelector(".review-start-button");

    expect(reviewButton.disabled).toBe(true);
  });

  it("should enable the study button when cards are available", async () => {
    await loadReviewPage(collections);

    const reviewButton = document.querySelector(".review-start-button");

    expect(reviewButton.disabled).toBe(false);
  });

  it("should disable the free study button when the collection has no cards", async () => {
    await loadReviewPage([
      {
        ...collections[0],
        cardCount: 0,
        availableCardCount: 0,
      },
    ]);

    const freeStudyButton = document.querySelector(".review-free-study-button");

    expect(freeStudyButton.disabled).toBe(true);
  });

  it("should enable the free study button when the collection has cards", async () => {
    await loadReviewPage([
      {
        ...collections[0],
        cardCount: 10,
        availableCardCount: 0,
      },
    ]);

    const freeStudyButton = document.querySelector(".review-free-study-button");

    expect(freeStudyButton.disabled).toBe(false);
  });

  it("should format the collection creation date", async () => {
    await loadReviewPage(collections);

    expect(document.querySelector(".review-collection-date").textContent).toBe(
      "Criada em 20/10/2026",
    );
  });

  it("should render the collection icon", async () => {
    await loadReviewPage(collections);

    const icon = document.querySelector(".collection-card-icon");

    expect(icon).not.toBeNull();
    expect(icon.getAttribute("aria-hidden")).toBe("true");
    expect(icon.querySelector("svg")).not.toBeNull();
  });

  it("should render the review status icon", async () => {
    await loadReviewPage(collections);

    const icon = document.querySelector(".review-status-icon");

    expect(icon).not.toBeNull();
    expect(icon.getAttribute("aria-hidden")).toBe("true");
    expect(icon.querySelector("svg")).not.toBeNull();
  });

  it("should render the study and free study buttons", async () => {
    await loadReviewPage(collections);

    expect(document.querySelector(".review-start-button").textContent).toBe(
      "Estudar agora",
    );

    expect(
      document.querySelector(".review-free-study-button").textContent,
    ).toBe("Estudo livre");
  });

  it("should not load collections when the user is not authenticated", async () => {
    await loadReviewPage([], false);

    expect(window.MemorizezSession.requireAuthentication).toHaveBeenCalled();

    expect(apiRequest).not.toHaveBeenCalled();
  });

  it("should not render collections when the container does not exist", async () => {
    document.body.innerHTML = "";

    window.MemorizezSession = {
      requireAuthentication: jest.fn(() => true),
    };

    global.apiRequest = jest.fn();

    document.dispatchEvent(new Event("DOMContentLoaded"));

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(apiRequest).not.toHaveBeenCalled();
  });
});
