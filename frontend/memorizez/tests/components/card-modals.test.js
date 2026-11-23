describe("Card Modals", () => {
  let CardModals;

  beforeAll(() => {
    require("../../js/components/card-modals");
    CardModals = window.CardModals;
  });

  beforeEach(() => {
    document.body.innerHTML = "";
  });

  describe("render", () => {
    it("should expose the render method on window", () => {
      expect(CardModals).toBeDefined();
      expect(typeof CardModals.render).toBe("function");
    });

    it("should render the card form modal", () => {
      const container = CardModals.render();

      expect(container).toBeInstanceOf(HTMLDivElement);

      expect(document.getElementById("card-modal-overlay")).not.toBeNull();

      expect(document.getElementById("card-form")).not.toBeNull();
    });

    it("should render the card deletion confirmation modal", () => {
      CardModals.render();

      expect(document.getElementById("delete-card-overlay")).not.toBeNull();

      expect(document.getElementById("confirm-delete-card")).not.toBeNull();
    });

    it("should append the modals container to the document body", () => {
      const container = CardModals.render();

      expect(document.body.contains(container)).toBe(true);
    });

    it("should return the rendered container", () => {
      const container = CardModals.render();

      expect(container).toBeInstanceOf(HTMLDivElement);
      expect(container.querySelector("#card-modal-overlay")).not.toBeNull();
      expect(container.querySelector("#delete-card-overlay")).not.toBeNull();
    });

    it("should render both modals hidden by default", () => {
      CardModals.render();

      expect(document.getElementById("card-modal-overlay").hidden).toBe(true);

      expect(document.getElementById("delete-card-overlay").hidden).toBe(true);
    });
  });

  describe("card form modal", () => {
    beforeEach(() => {
      CardModals.render();
    });

    it("should render the card form fields", () => {
      expect(document.getElementById("card-front")).not.toBeNull();
      expect(document.getElementById("card-back")).not.toBeNull();
      expect(document.getElementById("card-notes")).not.toBeNull();
    });

    it("should mark front and back fields as required", () => {
      expect(document.getElementById("card-front").required).toBe(true);
      expect(document.getElementById("card-back").required).toBe(true);
      expect(document.getElementById("card-notes").required).toBe(false);
    });

    it("should render the character counters", () => {
      expect(
        document.getElementById("card-front-counter").textContent,
      ).toContain("0 / 200");

      expect(
        document.getElementById("card-back-counter").textContent,
      ).toContain("0 / 400");

      expect(
        document.getElementById("card-notes-counter").textContent,
      ).toContain("0 / 300");
    });

    it("should render the field feedback elements hidden", () => {
      expect(document.getElementById("card-front-feedback").hidden).toBe(true);

      expect(document.getElementById("card-back-feedback").hidden).toBe(true);

      expect(document.getElementById("card-notes-feedback").hidden).toBe(true);
    });

    it("should render the edit warning hidden by default", () => {
      expect(document.getElementById("card-edit-warning").hidden).toBe(true);
    });

    it("should render the cancel and submit buttons", () => {
      expect(document.getElementById("cancel-card-form").type).toBe("button");

      expect(document.getElementById("save-card").type).toBe("submit");
    });
  });

  describe("delete card modal", () => {
    beforeEach(() => {
      CardModals.render();
    });

    it("should render the deletion confirmation message", () => {
      expect(
        document.getElementById("delete-card-modal-description").textContent,
      ).toContain("Esta ação não poderá ser desfeita.");
    });

    it("should render the cancel and confirm buttons", () => {
      expect(document.getElementById("cancel-delete-card").type).toBe("button");

      expect(document.getElementById("confirm-delete-card").type).toBe(
        "button",
      );
    });
  });
});
