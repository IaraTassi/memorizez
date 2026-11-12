describe("API", () => {
  const { getCsrfToken, apiRequest } = require("../js/api");

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
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("getCsrfToken", () => {
    it("should return the CSRF token successfully", async () => {
      global.fetch.mockResolvedValue(
        createMockResponse({
          token: "test-csrf-token",
        }),
      );

      const token = await getCsrfToken();

      expect(token).toBe("test-csrf-token");

      const [url, options] = global.fetch.mock.calls[0];

      expect(url).toBe("https://memorizez.onrender.com/csrf");

      expect(options.method).toBe("GET");
      expect(options.credentials).toBe("include");

      expect(options.headers).toEqual({
        Accept: "application/json",
      });

      expect(options.signal).toBeDefined();
      expect(options.signal).toBeInstanceOf(AbortSignal);
    });

    it("should throw an error when CSRF request fails", async () => {
      global.fetch.mockResolvedValue(
        createMockResponse(null, {
          status: 500,
        }),
      );

      await expect(getCsrfToken()).rejects.toMatchObject({
        message: "Não foi possível validar a segurança da sessão.",
        status: 500,
        code: "CSRF_ERROR",
      });
    });

    it("should use the backend userMessage when CSRF request fails", async () => {
      global.fetch.mockResolvedValue(
        createMockResponse(
          {
            userMessage: "Falha na validação da sessão.",
            code: "CSRF_INVALID",
          },
          { status: 403 },
        ),
      );

      await expect(getCsrfToken()).rejects.toMatchObject({
        message: "Falha na validação da sessão.",
        status: 403,
        code: "CSRF_INVALID",
      });
    });

    it("should reject an invalid CSRF token response", async () => {
      global.fetch.mockResolvedValue(
        createMockResponse({
          token: "",
        }),
      );

      await expect(getCsrfToken()).rejects.toMatchObject({
        code: "INVALID_CSRF_TOKEN",
      });
    });

    it("should throw CSRF_TIMEOUT_ERROR when CSRF response body reading exceeds timeout", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn(() => new Promise(() => {})),
      });

      await expect(
        getCsrfToken({
          timeoutMs: 20,
        }),
      ).rejects.toMatchObject({
        code: "CSRF_TIMEOUT_ERROR",
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
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
      expect(options.credentials).toBe("include");

      expectRequestHeaders(options, {
        Accept: "application/json",
      });
    });

    it("should make a POST request with CSRF token", async () => {
      global.fetch
        .mockResolvedValueOnce(
          createMockResponse({
            token: "test-csrf-token",
          }),
        )
        .mockResolvedValueOnce(
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

      expect(global.fetch).toHaveBeenCalledTimes(2);

      const [csrfUrl, csrfOptions] = global.fetch.mock.calls[0];

      expect(csrfUrl).toBe("https://memorizez.onrender.com/csrf");

      expect(csrfOptions.method).toBe("GET");
      expect(csrfOptions.credentials).toBe("include");

      expect(csrfOptions.headers).toEqual({
        Accept: "application/json",
      });

      expect(csrfOptions.signal).toBeDefined();
      expect(csrfOptions.signal).toBeInstanceOf(AbortSignal);

      const [url, options] = global.fetch.mock.calls[1];

      expect(url).toBe("https://memorizez.onrender.com/collections");

      expect(options.method).toBe("POST");
      expect(options.body).toBe(body);
      expect(options.credentials).toBe("include");

      expect(options.signal).toBeDefined();
      expect(options.signal).toBeInstanceOf(AbortSignal);

      expectRequestHeaders(options, {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": "test-csrf-token",
      });
    });

    it("should make a PUT request with CSRF token", async () => {
      global.fetch
        .mockResolvedValueOnce(
          createMockResponse({
            token: "test-csrf-token",
          }),
        )
        .mockResolvedValueOnce(
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
      expect(global.fetch).toHaveBeenCalledTimes(2);

      const [url, options] = global.fetch.mock.calls[1];

      expect(url).toBe("https://memorizez.onrender.com/collections/1");

      expect(options.method).toBe("PUT");
      expect(options.body).toBe(body);
      expect(options.credentials).toBe("include");

      expectRequestHeaders(options, {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": "test-csrf-token",
      });
    });

    it("should make a DELETE request with CSRF token", async () => {
      global.fetch
        .mockResolvedValueOnce(
          createMockResponse({
            token: "test-csrf-token",
          }),
        )
        .mockResolvedValueOnce(
          createMockResponse(null, {
            status: 204,
          }),
        );

      const result = await apiRequest("/collections/1", {
        method: "DELETE",
      });

      expect(result).toBeNull();
      expect(global.fetch).toHaveBeenCalledTimes(2);

      const [url, options] = global.fetch.mock.calls[1];

      expect(url).toBe("https://memorizez.onrender.com/collections/1");

      expect(options.method).toBe("DELETE");
      expect(options.credentials).toBe("include");

      expectRequestHeaders(options, {
        Accept: "application/json",
        "X-CSRF-TOKEN": "test-csrf-token",
      });
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

    it("should not make the API request when CSRF token retrieval fails", async () => {
      global.fetch.mockResolvedValue(
        createMockResponse(null, {
          status: 500,
        }),
      );

      await expect(
        apiRequest("/collections", {
          method: "POST",
          body: JSON.stringify({
            name: "Java",
          }),
        }),
      ).rejects.toMatchObject({
        message: "Não foi possível validar a segurança da sessão.",
        status: 500,
        code: "CSRF_ERROR",
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("should throw NETWORK_ERROR when the API connection fails", async () => {
      global.fetch.mockRejectedValue(new TypeError("Failed to fetch"));

      await expect(apiRequest("/collections")).rejects.toMatchObject({
        message:
          "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
        code: "NETWORK_ERROR",
      });
    });

    it("should throw CSRF_CONNECTION_ERROR when CSRF connection fails", async () => {
      global.fetch.mockRejectedValue(new TypeError("Failed to fetch"));

      await expect(getCsrfToken()).rejects.toMatchObject({
        code: "CSRF_CONNECTION_ERROR",
      });
    });

    it("should throw TIMEOUT_ERROR when response body reading exceeds timeout", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
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
  });
});
