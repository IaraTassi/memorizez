describe("Session", () => {
  let MemorizezSession;
  let removeTokenMock;

  beforeAll(() => {
    MemorizezSession = require("../../js/core/session");
  });

  beforeEach(() => {
    sessionStorage.clear();

    removeTokenMock = jest.fn();

    window.MemorizezAuth = {
      isAuthenticated: jest.fn(() =>
        Boolean(sessionStorage.getItem("memorizez.token")),
      ),
      removeToken: removeTokenMock,
    };

    window.history.replaceState({}, "", "/collections.html");
  });

  afterEach(() => {
    sessionStorage.clear();
    delete window.MemorizezAuth;
    jest.clearAllMocks();
  });

  describe("hasActiveSession", () => {
    it("should return false when there is no stored token", () => {
      expect(MemorizezSession.hasActiveSession()).toBe(false);
    });

    it("should return true when a token is stored", () => {
      sessionStorage.setItem("memorizez.token", "test-jwt-token");

      expect(MemorizezSession.hasActiveSession()).toBe(true);
    });
  });

  describe("requireAuthentication", () => {
    it("should return true when the user is authenticated", () => {
      sessionStorage.setItem("memorizez.token", "test-jwt-token");

      expect(MemorizezSession.requireAuthentication()).toBe(true);
    });

    it("should return false when there is no active session", () => {
      expect(MemorizezSession.requireAuthentication()).toBe(false);
    });
  });

  describe("session expiration", () => {
    it("should remove the token when session expires", () => {
      window.dispatchEvent(new Event("memorizez:session-expired"));

      expect(removeTokenMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("MemorizezSession", () => {
    it("should expose session methods on window", () => {
      expect(window.MemorizezSession).toBeDefined();

      expect(window.MemorizezSession.hasActiveSession).toBe(
        MemorizezSession.hasActiveSession,
      );

      expect(window.MemorizezSession.requireAuthentication).toBe(
        MemorizezSession.requireAuthentication,
      );
    });
  });
});
