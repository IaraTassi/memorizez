describe("Review", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const fs = require("fs");
  const path = require("path");

  const reviewHtml = fs.readFileSync(
    path.resolve(__dirname, "../review.html"),
    "utf8",
  );

  const bodyHtml = reviewHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i)[1];

  async function loadReviewPage(apiResponse = []) {
    document.body.innerHTML = bodyHtml;

    global.apiRequest = jest.fn();

    if (apiResponse.type === "reject") {
      global.apiRequest.mockRejectedValue(apiResponse.error);
    } else {
      global.apiRequest.mockResolvedValue(apiResponse.value ?? apiResponse);
    }

    document.dispatchEvent(new Event("DOMContentLoaded"));

    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  require("../js/review");

  it("should load the collections successfully", async () => {
    const collections = [
      {
        id: "1",
        name: "Java",
        createdAt: "2026-10-20T10:30:00",
        cardCount: 10,
        availableCardCount: 5,
      },
    ];

    await loadReviewPage(collections);

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
    const collections = [
      {
        id: "1",
        name: "Java",
        createdAt: "2026-10-20T10:30:00",
        cardCount: 10,
        availableCardCount: 0,
      },
    ];

    await loadReviewPage(collections);

    expect(document.querySelector(".review-status-text").textContent).toBe(
      "Você está em dia",
    );
  });

  it("should disable the study button when no cards are available", async () => {
    const collections = [
      {
        id: "1",
        name: "Java",
        createdAt: "2026-10-20T10:30:00",
        cardCount: 10,
        availableCardCount: 0,
      },
    ];

    await loadReviewPage(collections);

    const reviewButton = document.querySelector(".review-start-button");

    expect(reviewButton.disabled).toBe(true);
  });

  it("should enable the study button when cards are available", async () => {
    const collections = [
      {
        id: "1",
        name: "Java",
        createdAt: "2026-10-20T10:30:00",
        cardCount: 10,
        availableCardCount: 5,
      },
    ];

    await loadReviewPage(collections);

    const reviewButton = document.querySelector(".review-start-button");

    expect(reviewButton.disabled).toBe(false);
  });

  it("should disable the free study button when the collection has no cards", async () => {
    const collections = [
      {
        id: "1",
        name: "Java",
        createdAt: "2026-10-20T10:30:00",
        cardCount: 0,
        availableCardCount: 0,
      },
    ];

    await loadReviewPage(collections);

    const freeStudyButton = document.querySelector(".review-free-study-button");

    expect(freeStudyButton.disabled).toBe(true);
  });

  it("should enable the free study button when the collection has cards", async () => {
    const collections = [
      {
        id: "1",
        name: "Java",
        createdAt: "2026-10-20T10:30:00",
        cardCount: 10,
        availableCardCount: 0,
      },
    ];

    await loadReviewPage(collections);

    const freeStudyButton = document.querySelector(".review-free-study-button");

    expect(freeStudyButton.disabled).toBe(false);
  });
});
