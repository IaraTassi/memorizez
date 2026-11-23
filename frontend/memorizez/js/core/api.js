const DEFAULT_TIMEOUT_MS = 120000;

const API_BASE_URL = (() => {
  if (
    typeof window !== "undefined" &&
    typeof window.MEMORIZEZ_API_BASE_URL === "string"
  ) {
    return window.MEMORIZEZ_API_BASE_URL.trim().replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    const { hostname, port } = window.location;

    if (hostname === "memorizez.onrender.com") {
      return "";
    }

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      if (port === "5500") {
        return "http://localhost:8080";
      }

      if (port) {
        return "";
      }
    }
  }

  return "https://memorizez.onrender.com";
})();

class ApiError extends Error {
  constructor(message, { status = null, data = null, code = null } = {}) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.code = code;
  }
}

function buildApiUrl(path) {
  if (typeof path !== "string" || !path.trim()) {
    throw new TypeError("O caminho da API deve ser uma string não vazia.");
  }

  try {
    const baseUrl =
      API_BASE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");

    if (!baseUrl) {
      throw new TypeError("A origem da API não está disponível.");
    }

    const normalizedBaseUrl = `${baseUrl.replace(/\/+$/, "")}/`;
    const base = new URL(normalizedBaseUrl);
    const url = new URL(path, base);

    if (url.origin !== base.origin) {
      throw new TypeError("A URL da API deve pertencer à origem configurada.");
    }

    return url.toString();
  } catch (error) {
    if (error instanceof TypeError) {
      throw error;
    }

    throw new TypeError("O caminho informado para a API é inválido.");
  }
}

function createTimeoutError() {
  return new ApiError(
    "O tempo limite da solicitação foi excedido. Tente novamente.",
    { code: "TIMEOUT_ERROR" },
  );
}

function createAbortError() {
  return new ApiError("A solicitação foi cancelada.", {
    code: "REQUEST_ABORTED",
  });
}

async function executeWithTimeout(
  operation,
  {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal = null,
    errorFactory = () => createTimeoutError(),
  } = {},
) {
  if (signal?.aborted) {
    throw createAbortError();
  }

  const controller = new AbortController();
  const effectiveTimeout =
    Number.isFinite(timeoutMs) && timeoutMs > 0
      ? timeoutMs
      : DEFAULT_TIMEOUT_MS;

  let timeoutId;
  let externalAbortHandler;

  const timeoutError = errorFactory();

  let rejectTimeout;
  const timeoutPromise = new Promise((resolve, reject) => {
    rejectTimeout = reject;
  });

  let rejectExternalAbort;
  const externalAbortPromise = new Promise((resolve, reject) => {
    rejectExternalAbort = reject;
  });

  const abortForTimeout = () => {
    controller.abort();
    rejectTimeout(timeoutError);
  };

  externalAbortHandler = () => {
    controller.abort();
    rejectExternalAbort(createAbortError());
  };

  if (signal) {
    signal.addEventListener("abort", externalAbortHandler, {
      once: true,
    });
  }

  timeoutId = setTimeout(abortForTimeout, effectiveTimeout);

  try {
    return await Promise.race([
      operation(controller.signal),
      timeoutPromise,
      ...(signal ? [externalAbortPromise] : []),
    ]);
  } finally {
    clearTimeout(timeoutId);

    if (signal && externalAbortHandler) {
      signal.removeEventListener("abort", externalAbortHandler);
    }
  }
}

async function fetchWithTimeout(
  url,
  options = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
  errorFactory = () => createTimeoutError(),
) {
  const { signal, ...fetchOptions } = options;

  return executeWithTimeout(
    (internalSignal) =>
      fetch(url, {
        ...fetchOptions,
        signal: internalSignal,
      }),
    {
      timeoutMs,
      signal,
      errorFactory,
    },
  );
}

async function requestWithTimeout(
  url,
  options = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
) {
  const { signal, ...fetchOptions } = options;

  return executeWithTimeout(
    async (internalSignal) => {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: internalSignal,
      });

      const data = await readResponseBody(response);

      return { response, data };
    },
    {
      timeoutMs,
      signal,
    },
  );
}

async function readResponseBody(response) {
  if (response.status === 204 || response.status === 205) {
    return null;
  }

  let text;

  try {
    text = await response.text();
  } catch (error) {
    if (error?.name === "AbortError") {
      throw error;
    }

    throw new ApiError("Não foi possível ler a resposta do servidor.", {
      status: response.status,
      code: "RESPONSE_READ_ERROR",
    });
  }

  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { rawMessage: text };
  }
}

function extractErrorMessage(data) {
  if (!data || typeof data !== "object") {
    return null;
  }

  const message = data.userMessage;

  return typeof message === "string" && message.trim() ? message.trim() : null;
}

function getRequestPath(path) {
  try {
    return new URL(buildApiUrl(path)).pathname.replace(/\/$/, "") || "/";
  } catch {
    return typeof path === "string" ? path.split(/[?#]/, 1)[0] : "";
  }
}

function isPublicAuthenticationRequest(path, method) {
  const pathname = getRequestPath(path);

  return (
    (method === "POST" && pathname === "/users") ||
    (method === "POST" && pathname === "/users/login")
  );
}

function notifySessionExpired(path, method, status) {
  if (
    typeof window === "undefined" ||
    typeof window.dispatchEvent !== "function" ||
    typeof window.CustomEvent !== "function"
  ) {
    return;
  }

  window.dispatchEvent(
    new window.CustomEvent("memorizez:session-expired", {
      detail: { path, method, status },
    }),
  );
}

function getStoredToken() {
  try {
    return sessionStorage.getItem("memorizez.token");
  } catch (error) {
    console.warn("[MEMORIZEZ] Não foi possível acessar o token.", error);
    return null;
  }
}

async function apiRequest(path, options = {}) {
  const url = buildApiUrl(path);

  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers || {});

  headers.set("Accept", "application/json");

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const externalSignal = options.signal;

  if (externalSignal?.aborted) {
    throw createAbortError();
  }

  if (!isPublicAuthenticationRequest(path, method)) {
    const token = getStoredToken();

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  if (options.body != null && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const fetchOptions = { ...options };

  delete fetchOptions.timeoutMs;
  delete fetchOptions.signal;

  let result;

  try {
    result = await requestWithTimeout(
      url,
      {
        ...fetchOptions,
        method,
        headers,
        signal: externalSignal,
      },
      timeoutMs,
    );
  } catch (error) {
    if (error instanceof ApiError) {
      if (
        error.code === "REQUEST_ABORTED" ||
        error.code === "TIMEOUT_ERROR" ||
        error.code === "RESPONSE_READ_ERROR"
      ) {
        throw error;
      }
    }

    console.error("[MEMORIZEZ API] Falha de comunicação:", {
      path,
      method,
      error,
    });

    throw new ApiError(
      "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
      { code: "NETWORK_ERROR" },
    );
  }

  const { response, data } = result;

  if (!response.ok) {
    if (
      response.status === 401 &&
      !isPublicAuthenticationRequest(path, method)
    ) {
      notifySessionExpired(path, method, response.status);
    }

    throw new ApiError(
      extractErrorMessage(data) || "Não foi possível concluir a solicitação.",
      {
        status: response.status,
        data,
        code: data?.code || null,
      },
    );
  }

  return data;
}

const MemorizezApi = Object.freeze({
  ApiError,
  fetchWithTimeout,
  apiRequest,
  readResponseBody,
  extractErrorMessage,
  isPublicAuthenticationRequest,
  notifySessionExpired,
  getStoredToken,
});

if (typeof window !== "undefined") {
  window.MemorizezApi = MemorizezApi;
  window.apiRequest = apiRequest;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = MemorizezApi;
}
