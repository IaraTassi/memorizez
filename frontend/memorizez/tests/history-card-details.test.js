describe("History Card Details", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const fs = require("fs");
  const path = require("path");

  const historyCardDetailsHtml = fs.readFileSync(
    path.resolve(__dirname, "../history-card-details.html"),
    "utf8",
  );

  const bodyHtml = historyCardDetailsHtml.match(
    /<body[^>]*>([\s\S]*?)<\/body>/i,
  )[1];

  async function loadHistoryCardDetailsPage(
    apiResponses = [],
    collectionId = "1",
    cardId = "10",
  ) {
    document.body.innerHTML = bodyHtml;

    window.history.replaceState(
      {},
      "",
      `/history-card-details.html${
        collectionId && cardId
          ? `?collectionId=${encodeURIComponent(collectionId)}&cardId=${encodeURIComponent(cardId)}`
          : collectionId
            ? `?collectionId=${encodeURIComponent(collectionId)}`
            : cardId
              ? `?cardId=${encodeURIComponent(cardId)}`
              : ""
      }`,
    );

    global.apiRequest = jest.fn();

    apiResponses.forEach((response) => {
      if (response.type === "reject") {
        global.apiRequest.mockRejectedValueOnce(response.error);
      } else {
        global.apiRequest.mockResolvedValueOnce(response.value);
      }
    });

    document.dispatchEvent(new Event("DOMContentLoaded"));

    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  require("../js/history-card-details");

  const cardDetails = {
    id: 10,
    front: "O que é uma classe em Java?",
    createdAt: "2026-10-20T10:30:00",
    nextReviewDate: "2026-11-10",
  };

  const timelinePage = {
    content: [
      {
        id: 3,
        action: "REMEMBERED",
        createdAt: "2026-10-20T14:30:00",
      },
      {
        id: 2,
        action: "NOT_REMEMBERED",
        createdAt: "2026-10-15T09:45:00",
      },
      {
        id: 1,
        action: "EDITED",
        createdAt: "2026-10-10T11:20:00",
      },
    ],
    number: 0,
    totalPages: 1,
    totalElements: 3,
    first: true,
    last: true,
  };

  it("should load card details and timeline successfully", async () => {
    await loadHistoryCardDetailsPage([
      { value: cardDetails },
      { value: timelinePage },
    ]);

    expect(document.getElementById("pageTitle").textContent).toBe(
      "O que é uma classe em Java?",
    );

    expect(document.getElementById("nextReviewDate").textContent).toBe(
      "10/11/2026",
    );

    const timelineEvents = [
      ...document.querySelectorAll(".history-timeline-event"),
    ];

    expect(timelineEvents).toHaveLength(4);

    expect(
      document.querySelector(
        ".history-timeline-event-created .history-timeline-event-title",
      ).textContent,
    ).toBe("Cartão criado");

    expect(
      document.querySelector(
        ".history-timeline-event-edited .history-timeline-event-title",
      ).textContent,
    ).toBe("Cartão editado");

    expect(
      document.querySelector(
        ".history-timeline-event-not-remembered .history-timeline-event-title",
      ).textContent,
    ).toBe("Não lembrei");

    expect(
      document.querySelector(
        ".history-timeline-event-remembered .history-timeline-event-title",
      ).textContent,
    ).toBe("Lembrei");

    expect(
      timelineEvents.map(
        (event) =>
          event.className.match(
            /history-timeline-event-(created|edited|not-remembered|remembered)/,
          )?.[1],
      ),
    ).toEqual(["remembered", "not-remembered", "edited", "created"]);

    expect(global.apiRequest).toHaveBeenCalledTimes(2);

    expect(global.apiRequest).toHaveBeenNthCalledWith(
      1,
      "/history/collections/1/cards/10",
    );

    expect(global.apiRequest).toHaveBeenNthCalledWith(
      2,
      "/history/collections/1/cards/10/history?page=0&size=20",
    );
  });

  it("should show an error when collectionId is missing", async () => {
    await loadHistoryCardDetailsPage([], "", "10");

    expect(document.querySelector(".history-timeline-error").textContent).toBe(
      "Não foi possível identificar o cartão selecionado.",
    );

    expect(global.apiRequest).not.toHaveBeenCalled();
  });

  it("should show an error when cardId is missing", async () => {
    await loadHistoryCardDetailsPage([], "1", "");

    expect(document.querySelector(".history-timeline-error").textContent).toBe(
      "Não foi possível identificar o cartão selecionado.",
    );

    expect(global.apiRequest).not.toHaveBeenCalled();
  });

  it("should show an error when both identifiers are missing", async () => {
    await loadHistoryCardDetailsPage([], "", "");

    expect(document.querySelector(".history-timeline-error").textContent).toBe(
      "Não foi possível identificar o cartão selecionado.",
    );

    expect(global.apiRequest).not.toHaveBeenCalled();
  });

  it("should show a session expired message when loading card details returns 401", async () => {
    await loadHistoryCardDetailsPage([
      {
        type: "reject",
        error: Object.assign(new Error("Unauthorized"), { status: 401 }),
      },
    ]);

    expect(
      document.querySelector(".history-timeline-error").textContent,
    ).toContain("Sua sessão expirou.");

    expect(global.apiRequest).toHaveBeenCalledTimes(1);
  });

  it("should show a session expired message when loading card details returns 403", async () => {
    await loadHistoryCardDetailsPage([
      {
        type: "reject",
        error: Object.assign(new Error("Forbidden"), { status: 403 }),
      },
    ]);

    expect(
      document.querySelector(".history-timeline-error").textContent,
    ).toContain("Sua sessão expirou.");
  });

  it("should show an error when card details cannot be loaded", async () => {
    await loadHistoryCardDetailsPage([
      {
        type: "reject",
        error: new Error("Network error"),
      },
    ]);

    expect(document.querySelector(".history-timeline-error").textContent).toBe(
      "Não foi possível carregar os detalhes do cartão.",
    );
  });

  it("should show an error when the card is not found", async () => {
    await loadHistoryCardDetailsPage([{ value: null }]);

    expect(document.querySelector(".history-timeline-error").textContent).toBe(
      "Não foi possível carregar os detalhes do cartão.",
    );
  });

  it("should show a message when there is no next review scheduled", async () => {
    await loadHistoryCardDetailsPage([
      {
        value: {
          ...cardDetails,
          nextReviewDate: null,
        },
      },
      { value: timelinePage },
    ]);

    expect(document.getElementById("nextReviewDate").textContent).toBe(
      "Ainda não há uma próxima revisão agendada.",
    );
  });

  it("should update the back link with the collection identifier", async () => {
    await loadHistoryCardDetailsPage([
      { value: cardDetails },
      { value: timelinePage },
    ]);

    expect(document.querySelector(".page-back-link").getAttribute("href")).toBe(
      "history-cards.html?collectionId=1",
    );
  });

  it("should show a session expired message when loading timeline returns 401", async () => {
    await loadHistoryCardDetailsPage([
      { value: cardDetails },
      {
        type: "reject",
        error: Object.assign(new Error("Unauthorized"), { status: 401 }),
      },
    ]);

    expect(
      document.querySelector(".history-timeline-error").textContent,
    ).toContain("Sua sessão expirou.");

    expect(global.apiRequest).toHaveBeenCalledTimes(2);
  });

  it("should show a session expired message when loading timeline returns 403", async () => {
    await loadHistoryCardDetailsPage([
      { value: cardDetails },
      {
        type: "reject",
        error: Object.assign(new Error("Forbidden"), { status: 403 }),
      },
    ]);

    expect(
      document.querySelector(".history-timeline-error").textContent,
    ).toContain("Sua sessão expirou.");
  });

  it("should show an error when timeline cannot be loaded", async () => {
    await loadHistoryCardDetailsPage([
      { value: cardDetails },
      {
        type: "reject",
        error: new Error("Network error"),
      },
    ]);

    expect(document.querySelector(".history-timeline-error").textContent).toBe(
      "Não foi possível carregar a linha do tempo. Tente novamente.",
    );
  });

  it("should show an error when timeline response is invalid", async () => {
    await loadHistoryCardDetailsPage([
      { value: cardDetails },
      { value: { content: "invalid" } },
    ]);

    expect(document.querySelector(".history-timeline-error").textContent).toBe(
      "Não foi possível carregar a linha do tempo. Tente novamente.",
    );
  });

  it("should not display events with unknown actions", async () => {
    await loadHistoryCardDetailsPage([
      { value: cardDetails },
      {
        value: {
          ...timelinePage,
          content: [
            {
              id: 4,
              action: "UNKNOWN",
              createdAt: "2026-10-20T10:30:00",
            },
          ],
        },
      },
    ]);

    expect(document.querySelectorAll(".history-timeline-event")).toHaveLength(
      1,
    );

    expect(
      document.querySelector(".history-timeline-event-created"),
    ).not.toBeNull();

    expect(document.querySelector(".history-timeline-event-edited")).toBeNull();
  });

  it("should not display the creation event before the last timeline page", async () => {
    await loadHistoryCardDetailsPage([
      { value: cardDetails },
      {
        value: {
          ...timelinePage,
          totalPages: 2,
          last: false,
        },
      },
    ]);

    expect(
      document.querySelector(".history-timeline-event-created"),
    ).toBeNull();

    expect(document.querySelectorAll(".history-timeline-event")).toHaveLength(
      3,
    );
  });

  it("should display pagination and navigate between timeline pages", async () => {
    const firstPage = {
      ...timelinePage,
      totalPages: 2,
      last: false,
    };

    const secondPage = {
      ...timelinePage,
      content: [
        {
          id: 4,
          action: "REMEMBERED",
          createdAt: "2026-10-25T16:40:00",
        },
      ],
      number: 1,
      totalPages: 2,
      first: false,
      last: true,
    };

    await loadHistoryCardDetailsPage([
      { value: cardDetails },
      { value: firstPage },
      { value: secondPage },
      { value: firstPage },
    ]);

    let buttons = document.querySelectorAll(
      ".history-timeline-pagination-button",
    );

    expect(buttons).toHaveLength(2);
    expect(buttons[0].textContent).toBe("Anterior");
    expect(buttons[0].disabled).toBe(true);
    expect(buttons[1].textContent).toBe("Próxima");
    expect(buttons[1].disabled).toBe(false);

    expect(
      document.querySelector(".history-timeline-pagination-info").textContent,
    ).toBe("Página 1 de 2");

    buttons[1].click();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(global.apiRequest).toHaveBeenNthCalledWith(
      3,
      "/history/collections/1/cards/10/history?page=1&size=20",
    );

    expect(
      document.querySelector(".history-timeline-pagination-info").textContent,
    ).toBe("Página 2 de 2");

    buttons = document.querySelectorAll(".history-timeline-pagination-button");

    expect(buttons[0].disabled).toBe(false);
    expect(buttons[1].disabled).toBe(true);

    expect(
      document.querySelector(".history-timeline-event-created"),
    ).not.toBeNull();

    buttons[0].click();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(global.apiRequest).toHaveBeenNthCalledWith(
      4,
      "/history/collections/1/cards/10/history?page=0&size=20",
    );

    expect(
      document.querySelector(".history-timeline-pagination-info").textContent,
    ).toBe("Página 1 de 2");
  });
});
