describe("Collections", () => {
  const fs = require("fs");
  const path = require("path");

  const collectionsHtml = fs.readFileSync(
    path.resolve(__dirname, "../../collections.html"),
    "utf8",
  );

  const bodyHtml = collectionsHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i)[1];

  require("../../js/pages/collections");

  const sampleCollection = {
    id: 1,
    name: "Java",
    createdAt: "2026-10-20T10:30:00",
    cardCount: 10,
    availableCardCount: 5,
  };

  async function settlePromises() {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  }

  function loadCollectionsPage(
    apiResponse = Promise.resolve([]),
    authenticated = true,
  ) {
    document.body.innerHTML = bodyHtml;

    window.MemorizezSession = {
      requireAuthentication: jest.fn(() => authenticated),
    };

    global.apiRequest = jest.fn().mockReturnValue(apiResponse);

    document.dispatchEvent(new Event("DOMContentLoaded"));
  }

  function getFormElements() {
    return {
      openButton: document.getElementById("createCollectionButton"),
      form: document.getElementById("collection-form"),
      nameInput: document.getElementById("collection-name"),
      nameFeedback: document.getElementById("collection-name-feedback"),
      feedback: document.getElementById("collectionsFeedback"),
      modal: document.getElementById("collection-modal-overlay"),
      saveButton: document.getElementById("save-collection"),
    };
  }

  function submitForm(form) {
    form.dispatchEvent(
      new Event("submit", {
        bubbles: true,
        cancelable: true,
      }),
    );
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should require authentication before loading collections", async () => {
    loadCollectionsPage(Promise.resolve([]), false);

    await settlePromises();

    expect(window.MemorizezSession.requireAuthentication).toHaveBeenCalled();

    expect(global.apiRequest).not.toHaveBeenCalled();

    expect(document.querySelector(".collection-card")).toBeNull();
  });

  it("should load collections when the user is authenticated", async () => {
    loadCollectionsPage(Promise.resolve([sampleCollection]), true);

    await settlePromises();

    expect(window.MemorizezSession.requireAuthentication).toHaveBeenCalled();

    expect(global.apiRequest).toHaveBeenCalledWith("/collections");

    expect(document.querySelector(".collection-card-title").textContent).toBe(
      "Java",
    );
  });

  it("should show an empty message when there are no collections", async () => {
    loadCollectionsPage(Promise.resolve([]));

    await settlePromises();

    expect(document.querySelector(".collections-empty").textContent).toContain(
      "Você ainda não tem coleções",
    );

    expect(document.querySelector(".collection-card")).toBeNull();
  });

  it("should show an error message when loading collections fails", async () => {
    loadCollectionsPage(Promise.reject(new Error("Network error")));

    await settlePromises();

    expect(document.querySelector(".collections-error").textContent).toContain(
      "Não foi possível carregar suas coleções",
    );
  });

  it("should display collection information correctly", async () => {
    loadCollectionsPage(Promise.resolve([sampleCollection]));

    await settlePromises();

    expect(document.querySelector(".collection-card-title").textContent).toBe(
      "Java",
    );

    expect(
      document.querySelector(".collection-card-date").textContent,
    ).toContain("20/10/2026");

    const stats = document.querySelectorAll(".collection-card-stat-value");

    expect(stats[0].textContent).toBe("10");
    expect(stats[1].textContent).toBe("5");
  });

  it("should generate the correct link to view collection cards", async () => {
    loadCollectionsPage(Promise.resolve([sampleCollection]));

    await settlePromises();

    const link = document.querySelector(".collection-view-cards");

    expect(link.getAttribute("href")).toBe("cards.html?collectionId=1");
  });

  it("should open the creation modal when clicking the create button", () => {
    loadCollectionsPage();

    const { openButton, modal, nameInput } = getFormElements();

    openButton.click();

    expect(modal.hidden).toBe(false);
    expect(nameInput.value).toBe("");
    expect(document.activeElement).toBe(nameInput);

    expect(document.getElementById("collection-modal-title").textContent).toBe(
      "Nova coleção",
    );
  });

  it("should close the creation modal and restore focus", () => {
    loadCollectionsPage();

    const { openButton, modal } = getFormElements();

    openButton.focus();
    openButton.click();

    expect(document.activeElement).toBe(
      document.getElementById("collection-name"),
    );

    document.getElementById("close-collection-form").click();

    expect(modal.hidden).toBe(true);
    expect(document.activeElement).toBe(openButton);
  });

  it("should close the creation modal when clicking the cancel button", () => {
    loadCollectionsPage();

    const { openButton, modal } = getFormElements();

    openButton.click();

    document.getElementById("cancel-collection-form").click();

    expect(modal.hidden).toBe(true);
  });

  it("should close the creation modal when clicking the overlay", () => {
    loadCollectionsPage();

    const { openButton, modal } = getFormElements();

    openButton.click();

    modal.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
      }),
    );

    expect(modal.hidden).toBe(true);
  });

  it("should close the creation modal when pressing Escape", () => {
    loadCollectionsPage();

    const { openButton, modal } = getFormElements();

    openButton.click();

    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
      }),
    );

    expect(modal.hidden).toBe(true);
  });

  it("should update the name character counter", () => {
    loadCollectionsPage();

    const { openButton, nameInput } = getFormElements();

    openButton.click();

    nameInput.value = "Java Spring";

    nameInput.dispatchEvent(new Event("input", { bubbles: true }));

    expect(document.getElementById("collection-name-counter").textContent).toBe(
      "11 / 100 caracteres",
    );
  });

  it("should not create a collection with an empty name", () => {
    loadCollectionsPage();

    const { openButton, form, nameInput, nameFeedback } = getFormElements();

    openButton.click();

    nameInput.value = "   ";

    submitForm(form);

    expect(global.apiRequest).not.toHaveBeenCalledWith(
      "/collections",
      expect.objectContaining({ method: "POST" }),
    );

    expect(nameFeedback.textContent).toBe("Informe um nome para a coleção.");

    expect(nameFeedback.hidden).toBe(false);

    expect(nameInput.getAttribute("aria-invalid")).toBe("true");
  });

  it("should not create a collection with a name longer than 100 characters", () => {
    loadCollectionsPage();

    const { openButton, form, nameInput, nameFeedback } = getFormElements();

    openButton.click();

    nameInput.value = "A".repeat(101);

    submitForm(form);

    expect(global.apiRequest).not.toHaveBeenCalledWith(
      "/collections",
      expect.objectContaining({ method: "POST" }),
    );

    expect(nameFeedback.textContent).toBe(
      "O nome da coleção deve ter no máximo 100 caracteres.",
    );

    expect(nameFeedback.hidden).toBe(false);

    expect(nameInput.getAttribute("aria-invalid")).toBe("true");
  });

  it("should clear the name validation message when typing", () => {
    loadCollectionsPage();

    const { openButton, form, nameInput, nameFeedback } = getFormElements();

    openButton.click();

    nameInput.value = "";

    submitForm(form);

    expect(nameFeedback.hidden).toBe(false);

    nameInput.value = "Java";

    nameInput.dispatchEvent(new Event("input", { bubbles: true }));

    expect(nameFeedback.hidden).toBe(true);
    expect(nameInput.hasAttribute("aria-invalid")).toBe(false);
  });

  it("should create a collection successfully", async () => {
    loadCollectionsPage();

    const { openButton, form, nameInput, feedback } = getFormElements();

    global.apiRequest.mockResolvedValueOnce(null).mockResolvedValueOnce([]);

    openButton.click();

    nameInput.value = "Java Spring";

    submitForm(form);

    await settlePromises();

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

  it("should trim spaces before creating a collection", async () => {
    loadCollectionsPage();

    const { openButton, form, nameInput } = getFormElements();

    global.apiRequest.mockResolvedValueOnce(null).mockResolvedValueOnce([]);

    openButton.click();

    nameInput.value = "  Java Spring  ";

    submitForm(form);

    await settlePromises();

    expect(global.apiRequest).toHaveBeenCalledWith(
      "/collections",
      expect.objectContaining({
        body: JSON.stringify({ name: "Java Spring" }),
      }),
    );
  });

  it("should show an error when collection creation fails with status 400", async () => {
    loadCollectionsPage();

    const { openButton, form, nameInput, feedback } = getFormElements();

    global.apiRequest.mockRejectedValueOnce({
      status: 400,
    });

    openButton.click();

    nameInput.value = "Java Spring";

    submitForm(form);

    await settlePromises();

    expect(feedback.textContent).toBe(
      "Não foi possível criar a coleção. Confira o nome e tente novamente.",
    );

    expect(feedback.dataset.type).toBe("error");
  });

  it("should show a generic error when collection creation fails", async () => {
    loadCollectionsPage();

    const { openButton, form, nameInput, feedback } = getFormElements();

    global.apiRequest.mockRejectedValueOnce(new Error("Network error"));

    openButton.click();

    nameInput.value = "Java Spring";

    submitForm(form);

    await settlePromises();

    expect(feedback.textContent).toBe(
      "Ocorreu um erro ao criar a coleção. Tente novamente.",
    );

    expect(feedback.dataset.type).toBe("error");
  });

  it("should open the editing modal with the collection name", async () => {
    loadCollectionsPage(Promise.resolve([sampleCollection]));

    await settlePromises();

    document.querySelector(".collection-menu-items button:first-child").click();

    const { modal, nameInput, saveButton } = getFormElements();

    expect(modal.hidden).toBe(false);
    expect(nameInput.value).toBe("Java");

    expect(document.getElementById("collection-modal-title").textContent).toBe(
      "Editar coleção",
    );

    expect(saveButton.textContent).toBe("Salvar alterações");
  });

  it("should update a collection successfully", async () => {
    loadCollectionsPage(Promise.resolve([sampleCollection]));

    await settlePromises();

    document.querySelector(".collection-menu-items button:first-child").click();

    const { form, nameInput, feedback } = getFormElements();

    global.apiRequest.mockResolvedValueOnce(null).mockResolvedValueOnce([]);

    nameInput.value = "Java Spring";

    submitForm(form);

    await settlePromises();

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

  it("should show an error when updating a collection that does not exist", async () => {
    loadCollectionsPage(Promise.resolve([sampleCollection]));

    await settlePromises();

    document.querySelector(".collection-menu-items button:first-child").click();

    const { form, nameInput, feedback } = getFormElements();

    global.apiRequest.mockRejectedValueOnce({
      status: 404,
    });

    nameInput.value = "Java Spring";

    submitForm(form);

    await settlePromises();

    expect(feedback.textContent).toBe(
      "Esta coleção não foi encontrada. Atualize a página e tente novamente.",
    );

    expect(feedback.dataset.type).toBe("error");
  });

  it("should show an error when updating a collection fails with status 400", async () => {
    loadCollectionsPage(Promise.resolve([sampleCollection]));

    await settlePromises();

    document.querySelector(".collection-menu-items button:first-child").click();

    const { form, nameInput, feedback } = getFormElements();

    global.apiRequest.mockRejectedValueOnce({
      status: 400,
    });

    nameInput.value = "Java Spring";

    submitForm(form);

    await settlePromises();

    expect(feedback.textContent).toBe(
      "Não foi possível atualizar a coleção. Confira o nome e tente novamente.",
    );

    expect(feedback.dataset.type).toBe("error");
  });

  it("should open the delete modal when clicking the delete button", async () => {
    loadCollectionsPage(Promise.resolve([sampleCollection]));

    await settlePromises();

    document.querySelector(".collection-menu-items button:last-child").click();

    const deleteModal = document.getElementById(
      "delete-collection-modal-overlay",
    );

    expect(deleteModal.hidden).toBe(false);

    expect(document.activeElement).toBe(
      document.getElementById("confirm-delete-collection"),
    );
  });

  it("should close the delete modal when clicking the close button", async () => {
    loadCollectionsPage(Promise.resolve([sampleCollection]));

    await settlePromises();

    document.querySelector(".collection-menu-items button:last-child").click();

    const deleteModal = document.getElementById(
      "delete-collection-modal-overlay",
    );

    document.getElementById("close-delete-collection").click();

    expect(deleteModal.hidden).toBe(true);

    expect(global.apiRequest).not.toHaveBeenCalledWith(
      "/collections/1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("should close the delete modal when clicking cancel", async () => {
    loadCollectionsPage(Promise.resolve([sampleCollection]));

    await settlePromises();

    document.querySelector(".collection-menu-items button:last-child").click();

    const deleteModal = document.getElementById(
      "delete-collection-modal-overlay",
    );

    document.getElementById("cancel-delete-collection").click();

    expect(deleteModal.hidden).toBe(true);
  });

  it("should close the delete modal when clicking the overlay", async () => {
    loadCollectionsPage(Promise.resolve([sampleCollection]));

    await settlePromises();

    document.querySelector(".collection-menu-items button:last-child").click();

    const deleteModal = document.getElementById(
      "delete-collection-modal-overlay",
    );

    deleteModal.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
      }),
    );

    expect(deleteModal.hidden).toBe(true);
  });

  it("should close the delete modal when pressing Escape", async () => {
    loadCollectionsPage(Promise.resolve([sampleCollection]));

    await settlePromises();

    document.querySelector(".collection-menu-items button:last-child").click();

    const deleteModal = document.getElementById(
      "delete-collection-modal-overlay",
    );

    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
      }),
    );

    expect(deleteModal.hidden).toBe(true);
  });

  it("should delete a collection successfully", async () => {
    loadCollectionsPage(Promise.resolve([sampleCollection]));

    await settlePromises();

    document.querySelector(".collection-menu-items button:last-child").click();

    const confirmButton = document.getElementById("confirm-delete-collection");

    const deleteModal = document.getElementById(
      "delete-collection-modal-overlay",
    );

    const feedback = document.getElementById("collectionsFeedback");

    global.apiRequest.mockResolvedValueOnce(null).mockResolvedValueOnce([]);

    confirmButton.click();

    await settlePromises();

    expect(global.apiRequest).toHaveBeenCalledWith("/collections/1", {
      method: "DELETE",
    });

    expect(deleteModal.hidden).toBe(true);

    expect(feedback.textContent).toBe("Coleção excluída com sucesso.");
  });

  it("should show an error when deleting a collection that does not exist", async () => {
    loadCollectionsPage(Promise.resolve([sampleCollection]));

    await settlePromises();

    document.querySelector(".collection-menu-items button:last-child").click();

    const confirmButton = document.getElementById("confirm-delete-collection");

    const feedback = document.getElementById("collectionsFeedback");

    global.apiRequest.mockRejectedValueOnce({
      status: 404,
    });

    confirmButton.click();

    await settlePromises();

    expect(feedback.textContent).toBe(
      "Esta coleção não foi encontrada. Atualize a página e tente novamente.",
    );

    expect(feedback.dataset.type).toBe("error");
  });

  it("should show a generic error when deleting a collection fails", async () => {
    loadCollectionsPage(Promise.resolve([sampleCollection]));

    await settlePromises();

    document.querySelector(".collection-menu-items button:last-child").click();

    const confirmButton = document.getElementById("confirm-delete-collection");

    const feedback = document.getElementById("collectionsFeedback");

    global.apiRequest.mockRejectedValueOnce(new Error("Network error"));

    confirmButton.click();

    await settlePromises();

    expect(feedback.textContent).toBe(
      "Não foi possível excluir a coleção. Tente novamente.",
    );

    expect(feedback.dataset.type).toBe("error");
  });
});
