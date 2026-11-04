describe("Collections", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const fs = require("fs");
  const path = require("path");

  const collectionsHtml = fs.readFileSync(
    path.resolve(__dirname, "../collections.html"),
    "utf8",
  );

  const bodyHtml = collectionsHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i)[1];

  function loadCollectionsPage(apiResponse = Promise.resolve([])) {
    document.body.innerHTML = bodyHtml;

    global.apiRequest = jest.fn().mockReturnValue(apiResponse);

    document.dispatchEvent(new Event("DOMContentLoaded"));
  }

  require("../js/collections");

  it("should load the collections successfully", async () => {
    const collections = [
      {
        id: 1,
        name: "Java",
        createdAt: "2026-10-20T10:30:00",
        cardCount: 10,
        availableCardCount: 5,
      },
    ];

    loadCollectionsPage(Promise.resolve(collections));

    await Promise.resolve();

    expect(global.apiRequest).toHaveBeenCalledWith("/collections");
    expect(document.querySelector(".collection-card-title").textContent).toBe(
      "Java",
    );
  });

  it("should show an empty message when there are no collections", async () => {
    loadCollectionsPage(Promise.resolve([]));

    await Promise.resolve();

    expect(document.querySelector(".collections-empty").textContent).toContain(
      "Você ainda não tem coleções",
    );
  });

  it("should show an error message when loading collections fails", async () => {
    loadCollectionsPage(Promise.reject(new Error("Network error")));

    await Promise.resolve();

    expect(document.querySelector(".collections-error").textContent).toContain(
      "Não foi possível carregar suas coleções",
    );
  });

  it("should open the form modal when clicking the create button", () => {
    loadCollectionsPage();

    const openButton = document.getElementById("createCollectionButton");
    const modal = document.getElementById("collection-modal-overlay");
    const nameInput = document.getElementById("collection-name");

    openButton.click();

    expect(modal.hidden).toBe(false);
    expect(nameInput.value).toBe("");
    expect(document.activeElement).toBe(nameInput);
  });

  it("should not create a collection with an empty name", () => {
    loadCollectionsPage();

    const openButton = document.getElementById("createCollectionButton");
    const form = document.getElementById("collection-form");
    const nameInput = document.getElementById("collection-name");
    const feedback = document.getElementById("collectionsFeedback");

    openButton.click();

    nameInput.value = "   ";
    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );

    expect(global.apiRequest).not.toHaveBeenCalledWith(
      "/collections",
      expect.objectContaining({ method: "POST" }),
    );
    expect(feedback.textContent).toBe("Informe um nome para a coleção.");
    expect(feedback.dataset.type).toBe("error");
  });

  it("should not create a collection with a name longer than 100 characters", () => {
    loadCollectionsPage();

    const openButton = document.getElementById("createCollectionButton");
    const form = document.getElementById("collection-form");
    const nameInput = document.getElementById("collection-name");
    const feedback = document.getElementById("collectionsFeedback");

    openButton.click();

    nameInput.value = "A".repeat(101);
    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );

    expect(global.apiRequest).not.toHaveBeenCalledWith(
      "/collections",
      expect.objectContaining({ method: "POST" }),
    );
    expect(feedback.textContent).toBe(
      "O nome da coleção deve ter no máximo 100 caracteres.",
    );
    expect(feedback.dataset.type).toBe("error");
  });

  it("should create a collection successfully", async () => {
    loadCollectionsPage();

    const openButton = document.getElementById("createCollectionButton");
    const form = document.getElementById("collection-form");
    const nameInput = document.getElementById("collection-name");
    const feedback = document.getElementById("collectionsFeedback");

    global.apiRequest.mockResolvedValueOnce(null).mockResolvedValueOnce([]);

    openButton.click();

    nameInput.value = "Java Spring";

    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );

    await Promise.resolve();
    await Promise.resolve();

    expect(global.apiRequest).toHaveBeenCalledWith("/collections", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: "Java Spring" }),
    });

    expect(feedback.textContent).toBe("Coleção criada com sucesso.");
    expect(feedback.dataset.type).toBe("success");
  });

  it("should update a collection successfully", async () => {
    const collections = [
      {
        id: 1,
        name: "Java",
        createdAt: "2026-10-20T10:30:00",
        cardCount: 10,
        availableCardCount: 5,
      },
    ];

    loadCollectionsPage(Promise.resolve(collections));

    await Promise.resolve();

    const editButton = document.querySelector(
      ".collection-card button:nth-of-type(1)",
    );

    editButton.click();

    const modal = document.getElementById("collection-modal-overlay");
    const nameInput = document.getElementById("collection-name");
    const form = document.getElementById("collection-form");
    const feedback = document.getElementById("collectionsFeedback");

    expect(modal.hidden).toBe(false);
    expect(nameInput.value).toBe("Java");

    nameInput.value = "Java Spring";

    global.apiRequest.mockResolvedValueOnce(null).mockResolvedValueOnce([]);

    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );

    await Promise.resolve();
    await Promise.resolve();

    expect(global.apiRequest).toHaveBeenCalledWith("/collections/1", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: "Java Spring" }),
    });

    expect(feedback.textContent).toBe("Coleção atualizada com sucesso.");
    expect(feedback.dataset.type).toBe("success");
  });

  it("should delete a collection successfully", async () => {
    const collections = [
      {
        id: 1,
        name: "Java",
        createdAt: "2026-10-20T10:30:00",
        cardCount: 10,
        availableCardCount: 5,
      },
    ];

    loadCollectionsPage(Promise.resolve(collections));

    await Promise.resolve();

    const deleteButton = document.querySelector(
      ".collection-card button:nth-of-type(2)",
    );

    deleteButton.click();

    const deleteModal = document.getElementById(
      "delete-collection-modal-overlay",
    );
    const confirmButton = document.getElementById("confirm-delete-collection");
    const feedback = document.getElementById("collectionsFeedback");

    expect(deleteModal.hidden).toBe(false);

    global.apiRequest.mockResolvedValueOnce(null).mockResolvedValueOnce([]);

    confirmButton.click();

    await Promise.resolve();
    await Promise.resolve();

    expect(global.apiRequest).toHaveBeenCalledWith("/collections/1", {
      method: "DELETE",
    });

    expect(deleteModal.hidden).toBe(true);
    expect(feedback.textContent).toBe("Coleção excluída com sucesso.");
  });

  it("should show an error when collection creation fails with status 400", async () => {
    loadCollectionsPage();

    const openButton = document.getElementById("createCollectionButton");
    const form = document.getElementById("collection-form");
    const nameInput = document.getElementById("collection-name");
    const feedback = document.getElementById("collectionsFeedback");

    global.apiRequest.mockRejectedValueOnce({
      status: 400,
    });

    openButton.click();

    nameInput.value = "Java Spring";

    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );

    await Promise.resolve();

    expect(global.apiRequest).toHaveBeenCalledWith("/collections", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: "Java Spring" }),
    });

    expect(feedback.textContent).toBe(
      "Não foi possível criar a coleção. Confira o nome e tente novamente.",
    );

    expect(feedback.dataset.type).toBe("error");
  });

  it("should close the delete modal when clicking the close button", async () => {
    await loadCollectionsPage(
      Promise.resolve([
        {
          id: 1,
          name: "Java",
          createdAt: "2026-01-01T10:30:00",
          cardCount: 2,
          availableCardCount: 2,
        },
      ]),
    );

    const deleteButton = document.querySelector(
      ".collection-menu-items button:last-child",
    );

    deleteButton.click();

    const deleteModal = document.getElementById(
      "delete-collection-modal-overlay",
    );

    expect(deleteModal.hidden).toBe(false);

    document.getElementById("close-delete-collection").click();

    expect(deleteModal.hidden).toBe(true);
    expect(apiRequest).not.toHaveBeenCalledWith(
      "/collections/1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
