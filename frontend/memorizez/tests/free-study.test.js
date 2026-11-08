describe("Free Study", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const fs = require("fs");
  const path = require("path");

  const freeStudyHtml = fs.readFileSync(
    path.resolve(__dirname, "../free-study.html"),
    "utf8",
  );

  const bodyHtml = freeStudyHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i)[1];

  async function loadFreeStudyPage(apiResponse = [], includeContainer = true) {
    document.body.innerHTML = bodyHtml;

    if (!includeContainer) {
      document.body.innerHTML = "<main></main>";
    }

    global.apiRequest = jest
      .fn()
      .mockReturnValue(
        apiResponse instanceof Promise
          ? apiResponse
          : Promise.resolve(apiResponse),
      );

    document.dispatchEvent(new Event("DOMContentLoaded"));

    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  require("../js/free-study");

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

    expect(apiRequest).toHaveBeenCalledWith("/free-study/collections");

    expect(document.querySelectorAll(".free-study-collection")).toHaveLength(2);

    expect(
      document.querySelectorAll(".free-study-collection-name")[0].textContent,
    ).toBe("Java");

    expect(
      document.querySelectorAll(".free-study-collection-name")[1].textContent,
    ).toBe("JavaScript");
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

  it("should show a session expired message when loading collections returns 401", async () => {
    const error = new Error("Unauthorized");
    error.status = 401;

    await loadFreeStudyPage(Promise.reject(error));

    expect(
      document.querySelector(".free-study-error-message").textContent,
    ).toBe("Sua sessão expirou. Entre novamente para acessar o estudo livre.");
  });

  it("should show a session expired message when loading collections returns 403", async () => {
    const error = new Error("Forbidden");
    error.status = 403;

    await loadFreeStudyPage(Promise.reject(error));

    expect(
      document.querySelector(".free-study-error-message").textContent,
    ).toBe("Sua sessão expirou. Entre novamente para acessar o estudo livre.");
  });

  it("should show a generic error when loading collections fails", async () => {
    await loadFreeStudyPage(Promise.reject(new Error("Network error")));

    expect(
      document.querySelector(".free-study-error-message").textContent,
    ).toBe("Não foi possível carregar suas coleções. Tente novamente.");
  });

  it("should not request collections when the container does not exist", async () => {
    await loadFreeStudyPage([], false);

    expect(apiRequest).not.toHaveBeenCalled();
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

    firstTrigger.click();
    secondTrigger.click();

    expect(collections[0].classList.contains("is-expanded")).toBe(false);
    expect(firstTrigger.getAttribute("aria-expanded")).toBe("false");

    expect(collections[1].classList.contains("is-expanded")).toBe(true);
    expect(secondTrigger.getAttribute("aria-expanded")).toBe("true");
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

  it("should show the study button when a collection has cards", async () => {
    await loadFreeStudyPage([{ id: "1", name: "Java", cardCount: 10 }]);

    const collection = document.querySelector(".free-study-collection");
    const trigger = collection.querySelector(".free-study-collection-trigger");

    trigger.click();

    const startButton = collection.querySelector(".free-study-start-button");

    expect(startButton).not.toBeNull();
    expect(startButton.textContent).toContain("Estudar esta coleção");
  });
});
