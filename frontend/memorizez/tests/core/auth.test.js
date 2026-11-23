describe("Auth", () => {
  const {
    getToken,
    saveToken,
    removeToken,
    isAuthenticated,
  } = require("../../js/core/auth");

  const TOKEN_STORAGE_KEY = "memorizez.token";

  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe("getToken", () => {
    it("should return null when there is no stored token", () => {
      expect(getToken()).toBeNull();
    });

    it("should return the stored token", () => {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, "test-jwt-token");

      expect(getToken()).toBe("test-jwt-token");
    });
  });

  describe("saveToken", () => {
    it("should save the JWT token in sessionStorage", () => {
      saveToken("test-jwt-token");

      expect(sessionStorage.getItem(TOKEN_STORAGE_KEY)).toBe("test-jwt-token");
    });

    it("should reject a non-string token", () => {
      expect(() => saveToken(null)).toThrow(TypeError);
    });

    it("should reject an empty token", () => {
      expect(() => saveToken("")).toThrow(TypeError);
    });

    it("should reject a token containing only whitespace", () => {
      expect(() => saveToken("   ")).toThrow(TypeError);
    });
  });

  describe("removeToken", () => {
    it("should remove the stored token", () => {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, "test-jwt-token");

      removeToken();

      expect(sessionStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    });

    it("should not throw when there is no stored token", () => {
      expect(() => removeToken()).not.toThrow();
    });
  });

  describe("isAuthenticated", () => {
    it("should return false when there is no stored token", () => {
      expect(isAuthenticated()).toBe(false);
    });

    it("should return true when a token is stored", () => {
      saveToken("test-jwt-token");

      expect(isAuthenticated()).toBe(true);
    });

    it("should return false after removing the token", () => {
      saveToken("test-jwt-token");

      removeToken();

      expect(isAuthenticated()).toBe(false);
    });
  });

  describe("MemorizezAuth", () => {
    it("should expose the authentication methods on window", () => {
      expect(window.MemorizezAuth).toBeDefined();
      expect(window.MemorizezAuth.getToken).toBe(getToken);
      expect(window.MemorizezAuth.saveToken).toBe(saveToken);
      expect(window.MemorizezAuth.removeToken).toBe(removeToken);
      expect(window.MemorizezAuth.isAuthenticated).toBe(isAuthenticated);
    });
  });
});
