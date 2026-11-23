describe("API", () => {
  const { apiRequest } = require("../../js/core/api");

  const TOKEN_STORAGE_KEY = "memorizez.token";
  const SESSION_EXPIRED_EVENT = "memorizez:session-expired";

  function createMockResponse(
    body = null,
    { status = 200, contentType = "application/json", readError = null } = {},
  ) {
    const headers = {
      get: jest.fn((name) => {
        if (name.toLowerCase() === "content-type") {
          return contentType;
        }

        return null;
      }),
    };

    const text = readError
      ? jest.fn().mockRejectedValue(readError)
      : jest
          .fn()
          .mockResolvedValue(
            body === null
              ? ""
              : typeof body === "string"
                ? body
                : JSON.stringify(body),
          );

    return {
      ok: status >= 200 && status < 300,
      status,
      headers,
      text,
    };
  }

  function expectRequestHeaders(options, expectedHeaders) {
    expect(options.headers).toBeInstanceOf(Headers);

    Object.entries(expectedHeaders).forEach(([name, value]) => {
      expect(options.headers.get(name)).toBe(value);
    });
  }

  beforeEach(() => {
    global.fetch = jest.fn();
    sessionStorage.clear();
  });

  afterEach(() => {
    jest.resetAllMocks();
    sessionStorage.clear();
  });

  describe("apiRequest", () => {
    it("should make a GET request successfully", async () => {
      global.fetch.mockResolvedValue(createMockResponse());

      const result = await apiRequest("/collections");

      expect(result).toBeNull();
      expect(global.fetch).toHaveBeenCalledTimes(1);

      const [url, options] = global.fetch.mock.calls[0];

      expect(url).toBe("https://memorizez.onrender.com/collections");
      expect(options.method).toBe("GET");
      expect(options.credentials).toBeUndefined();

      expectRequestHeaders(options, {
        Accept: "application/json",
      });

      expect(options.headers.has("Authorization")).toBe(false);
    });

    it("should make a POST request successfully with JWT", async () => {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, "test-jwt-token");

      global.fetch.mockResolvedValue(
        createMockResponse(
          {
            id: 1,
            name: "Java",
          },
          { status: 201 },
        ),
      );

      const body = JSON.stringify({
        name: "Java",
      });

      const result = await apiRequest("/collections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      });

      expect(result).toEqual({
        id: 1,
        name: "Java",
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);

      const [url, options] = global.fetch.mock.calls[0];

      expect(url).toBe("https://memorizez.onrender.com/collections");
      expect(options.method).toBe("POST");
      expect(options.body).toBe(body);
      expect(options.credentials).toBeUndefined();

      expect(options.signal).toBeDefined();
      expect(options.signal).toBeInstanceOf(AbortSignal);

      expectRequestHeaders(options, {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer test-jwt-token",
      });

      expect(options.headers.has("X-CSRF-TOKEN")).toBe(false);
    });

    it("should make a PUT request successfully with JWT", async () => {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, "test-jwt-token");

      global.fetch.mockResolvedValue(
        createMockResponse(null, {
          status: 204,
        }),
      );

      const body = JSON.stringify({
        name: "Java Spring",
      });

      const result = await apiRequest("/collections/1", {
        method: "PUT",
        body,
      });

      expect(result).toBeNull();
      expect(global.fetch).toHaveBeenCalledTimes(1);

      const [url, options] = global.fetch.mock.calls[0];

      expect(url).toBe("https://memorizez.onrender.com/collections/1");
      expect(options.method).toBe("PUT");
      expect(options.body).toBe(body);
      expect(options.credentials).toBeUndefined();

      expectRequestHeaders(options, {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer test-jwt-token",
      });

      expect(options.headers.has("X-CSRF-TOKEN")).toBe(false);
    });

    it("should make a DELETE request successfully with JWT", async () => {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, "test-jwt-token");

      global.fetch.mockResolvedValue(
        createMockResponse(null, {
          status: 204,
        }),
      );

      const result = await apiRequest("/collections/1", {
        method: "DELETE",
      });

      expect(result).toBeNull();
      expect(global.fetch).toHaveBeenCalledTimes(1);

      const [url, options] = global.fetch.mock.calls[0];

      expect(url).toBe("https://memorizez.onrender.com/collections/1");
      expect(options.method).toBe("DELETE");
      expect(options.credentials).toBeUndefined();

      expectRequestHeaders(options, {
        Accept: "application/json",
        Authorization: "Bearer test-jwt-token",
      });

      expect(options.headers.has("X-CSRF-TOKEN")).toBe(false);
    });

    it("should not send Authorization when there is no stored token", async () => {
      global.fetch.mockResolvedValue(createMockResponse());

      await apiRequest("/collections");

      const [, options] = global.fetch.mock.calls[0];

      expect(options.headers.has("Authorization")).toBe(false);
    });

    it("should not send Authorization for user registration", async () => {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, "test-jwt-token");

      global.fetch.mockResolvedValue(
        createMockResponse(
          {
            id: 1,
            name: "Usuario",
          },
          { status: 201 },
        ),
      );

      await apiRequest("/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Usuario",
          email: "usuario@example.com",
          password: "password",
          confirmPassword: "password",
        }),
      });

      const [, options] = global.fetch.mock.calls[0];

      expect(options.headers.has("Authorization")).toBe(false);
    });

    it("should not send Authorization for login", async () => {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, "test-jwt-token");

      global.fetch.mockResolvedValue(
        createMockResponse({
          token: "new-jwt-token",
        }),
      );

      await apiRequest("/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "usuario@example.com",
          password: "password",
        }),
      });

      const [, options] = global.fetch.mock.calls[0];

      expect(options.headers.has("Authorization")).toBe(false);
    });

    it("should throw an error when the API request fails", async () => {
      global.fetch.mockResolvedValue(
        createMockResponse(null, {
          status: 500,
        }),
      );

      await expect(apiRequest("/collections")).rejects.toMatchObject({
        message: "Não foi possível concluir a solicitação.",
        status: 500,
        code: null,
      });
    });

    it("should use the backend userMessage when the API request fails", async () => {
      global.fetch.mockResolvedValue(
        createMockResponse(
          {
            userMessage: "Coleção não encontrada.",
            code: "COLLECTION_NOT_FOUND",
          },
          { status: 404 },
        ),
      );

      await expect(apiRequest("/collections/1")).rejects.toMatchObject({
        message: "Coleção não encontrada.",
        status: 404,
        code: "COLLECTION_NOT_FOUND",
      });
    });

    it("should return JSON data when response content type is JSON", async () => {
      const responseData = [
        { id: 1, name: "Java" },
        { id: 2, name: "Spring Boot" },
      ];

      global.fetch.mockResolvedValue(createMockResponse(responseData));

      const result = await apiRequest("/collections");

      expect(result).toEqual(responseData);
    });

    it("should preserve text responses as rawMessage", async () => {
      global.fetch.mockResolvedValue(
        createMockResponse("<html>Server error</html>", {
          contentType: "text/html",
        }),
      );

      const result = await apiRequest("/collections");

      expect(result).toEqual({
        rawMessage: "<html>Server error</html>",
      });
    });

    it("should return null when response has no content", async () => {
      global.fetch.mockResolvedValue(
        createMockResponse(null, {
          contentType: "text/html",
        }),
      );

      const result = await apiRequest("/collections");

      expect(result).toBeNull();
    });

    it("should parse JSON even when content type is missing", async () => {
      global.fetch.mockResolvedValue(
        createMockResponse(
          {
            id: 1,
            name: "Java",
          },
          {
            contentType: null,
          },
        ),
      );

      const result = await apiRequest("/collections");

      expect(result).toEqual({
        id: 1,
        name: "Java",
      });
    });

    it("should preserve invalid JSON as rawMessage", async () => {
      global.fetch.mockResolvedValue(
        createMockResponse("{invalid json", {
          contentType: "application/json",
        }),
      );

      const result = await apiRequest("/collections");

      expect(result).toEqual({
        rawMessage: "{invalid json",
      });
    });

    it("should throw RESPONSE_READ_ERROR when response reading fails", async () => {
      global.fetch.mockResolvedValue(
        createMockResponse(null, {
          status: 200,
          readError: new Error("Stream read failed"),
        }),
      );

      await expect(apiRequest("/collections")).rejects.toMatchObject({
        message: "Não foi possível ler a resposta do servidor.",
        status: 200,
        code: "RESPONSE_READ_ERROR",
      });
    });

    it("should throw NETWORK_ERROR when the API connection fails", async () => {
      global.fetch.mockRejectedValue(new TypeError("Failed to fetch"));

      await expect(apiRequest("/collections")).rejects.toMatchObject({
        message:
          "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
        code: "NETWORK_ERROR",
      });
    });

    it("should throw TIMEOUT_ERROR when response body reading exceeds timeout", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: {
          get: jest.fn(() => "application/json"),
        },
        text: jest.fn(() => new Promise(() => {})),
      });

      await expect(
        apiRequest("/collections", {
          timeoutMs: 20,
        }),
      ).rejects.toMatchObject({
        code: "TIMEOUT_ERROR",
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("should throw REQUEST_ABORTED when the request is externally cancelled", async () => {
      global.fetch.mockImplementation(() => new Promise(() => {}));

      const controller = new AbortController();

      const request = apiRequest("/collections", {
        signal: controller.signal,
      });

      controller.abort();

      await expect(request).rejects.toMatchObject({
        code: "REQUEST_ABORTED",
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("should reject external URLs before making a fetch request", async () => {
      await expect(
        apiRequest("https://malicious-example.com/endpoint"),
      ).rejects.toThrow("A URL da API deve pertencer à origem configurada.");

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should dispatch session expired event when a protected request returns 401", async () => {
      const eventHandler = jest.fn();

      window.addEventListener(SESSION_EXPIRED_EVENT, eventHandler);

      global.fetch.mockResolvedValue(
        createMockResponse(
          {
            message: "Unauthorized",
          },
          { status: 401 },
        ),
      );

      await expect(apiRequest("/collections")).rejects.toMatchObject({
        status: 401,
      });

      expect(eventHandler).toHaveBeenCalledTimes(1);

      window.removeEventListener(SESSION_EXPIRED_EVENT, eventHandler);
    });

    it("should not dispatch session expired event for login when it returns 401", async () => {
      const eventHandler = jest.fn();

      window.addEventListener(SESSION_EXPIRED_EVENT, eventHandler);

      global.fetch.mockResolvedValue(
        createMockResponse(
          {
            message: "Credenciais inválidas.",
          },
          { status: 401 },
        ),
      );

      await expect(
        apiRequest("/users/login", {
          method: "POST",
          body: JSON.stringify({
            email: "usuario@example.com",
            password: "wrong-password",
          }),
        }),
      ).rejects.toMatchObject({
        status: 401,
      });

      expect(eventHandler).not.toHaveBeenCalled();

      window.removeEventListener(SESSION_EXPIRED_EVENT, eventHandler);
    });

    it("should not dispatch session expired event for registration when it returns 401", async () => {
      const eventHandler = jest.fn();

      window.addEventListener(SESSION_EXPIRED_EVENT, eventHandler);

      global.fetch.mockResolvedValue(
        createMockResponse(
          {
            message: "Unauthorized",
          },
          { status: 401 },
        ),
      );

      await expect(
        apiRequest("/users", {
          method: "POST",
          body: JSON.stringify({
            name: "Usuario",
            email: "usuario@example.com",
            password: "password",
            confirmPassword: "password",
          }),
        }),
      ).rejects.toMatchObject({
        status: 401,
      });

      expect(eventHandler).not.toHaveBeenCalled();

      window.removeEventListener(SESSION_EXPIRED_EVENT, eventHandler);
    });
  });
});
