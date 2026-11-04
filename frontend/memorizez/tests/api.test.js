describe("API", () => {
  const { getCsrfToken, apiRequest } = require("../js/api");

  describe("getCsrfToken", () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it("should return the CSRF token successfully", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          token: "test-csrf-token",
        }),
      });

      const token = await getCsrfToken();

      expect(token).toBe("test-csrf-token");

      expect(global.fetch).toHaveBeenCalledWith(
        "https://memorizez.onrender.com/csrf",
        {
          method: "GET",
          credentials: "include",
        },
      );
    });

    it("should throw an error when CSRF request fails", async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(getCsrfToken()).rejects.toThrow(
        "Não foi possível obter o token de segurança.",
      );
    });
  });

  describe("apiRequest", () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it("should make a GET request successfully", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      });

      const result = await apiRequest("/collections");

      expect(result).toBeNull();

      expect(global.fetch).toHaveBeenCalledWith(
        "https://memorizez.onrender.com/collections",
        {
          method: "GET",
          credentials: "include",
          headers: {},
        },
      );
    });

    it("should make a POST request with CSRF token", async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            token: "test-csrf-token",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          headers: {
            get: jest.fn().mockReturnValue("application/json"),
          },
          json: jest.fn().mockResolvedValue({
            id: 1,
            name: "Java",
          }),
        });

      const result = await apiRequest("/collections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Java",
        }),
      });

      expect(result).toEqual({
        id: 1,
        name: "Java",
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);

      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        "https://memorizez.onrender.com/csrf",
        {
          method: "GET",
          credentials: "include",
        },
      );

      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        "https://memorizez.onrender.com/collections",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": "test-csrf-token",
          },
          body: JSON.stringify({
            name: "Java",
          }),
          credentials: "include",
        },
      );
    });

    it("should make a PUT request with CSRF token", async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            token: "test-csrf-token",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 204,
          headers: {
            get: jest.fn().mockReturnValue(null),
          },
        });

      const result = await apiRequest("/collections/1", {
        method: "PUT",
        body: JSON.stringify({
          name: "Java Spring",
        }),
      });

      expect(result).toBeNull();

      expect(global.fetch).toHaveBeenCalledTimes(2);

      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        "https://memorizez.onrender.com/collections/1",
        {
          method: "PUT",
          body: JSON.stringify({
            name: "Java Spring",
          }),
          credentials: "include",
          headers: {
            "X-CSRF-TOKEN": "test-csrf-token",
          },
        },
      );
    });

    it("should make a DELETE request with CSRF token", async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            token: "test-csrf-token",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 204,
          headers: {
            get: jest.fn().mockReturnValue(null),
          },
        });

      const result = await apiRequest("/collections/1", {
        method: "DELETE",
      });

      expect(result).toBeNull();

      expect(global.fetch).toHaveBeenCalledTimes(2);

      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        "https://memorizez.onrender.com/collections/1",
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            "X-CSRF-TOKEN": "test-csrf-token",
          },
        },
      );
    });

    it("should throw an error when the API request fails", async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(apiRequest("/collections")).rejects.toMatchObject({
        message: "Não foi possível concluir a solicitação.",
        status: 500,
      });
    });

    it("should return JSON data when response content type is JSON", async () => {
      const responseData = [
        { id: 1, name: "Java" },
        { id: 2, name: "Spring Boot" },
      ];

      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue("application/json"),
        },
        json: jest.fn().mockResolvedValue(responseData),
      });

      const result = await apiRequest("/collections");

      expect(result).toEqual(responseData);
    });

    it("should return null when response is not JSON", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue("text/html"),
        },
        json: jest.fn(),
      });

      const result = await apiRequest("/collections");

      expect(result).toBeNull();
    });

    it("should not make the API request when CSRF token retrieval fails", async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(
        apiRequest("/collections", {
          method: "POST",
          body: JSON.stringify({ name: "Java" }),
        }),
      ).rejects.toThrow("Não foi possível obter o token de segurança.");

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("should return null when response has no content type", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
        json: jest.fn(),
      });

      const result = await apiRequest("/collections");

      expect(result).toBeNull();
    });
  });
});
