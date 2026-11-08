const API_BASE_URL = "https://memorizez.onrender.com";
class ApiError extends Error {
  constructor(message, { status = null, data = null, code = null } = {}) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.code = code;
  }
}

async function readResponseBody(response) {
  if (response.status === 204 || response.status === 205) {
    return null;
  }

  let text;

  try {
    text = await response.text();
  } catch {
    throw new ApiError("Não foi possível ler a resposta do servidor.", {
      status: response.status,
      code: "RESPONSE_READ_ERROR",
    });
  }

  if (!text.trim()) {
    return null;
  }

  const contentType = (
    response.headers.get("content-type") || ""
  ).toLowerCase();

  if (
    contentType.includes("application/json") ||
    contentType.includes("+json")
  ) {
    try {
      return JSON.parse(text);
    } catch {
      return { rawMessage: text };
    }
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
    return new URL(path, API_BASE_URL).pathname;
  } catch {
    return path;
  }
}

function isPublicAuthenticationRequest(path, method) {
  const pathname = getRequestPath(path);

  return (
    (method === "POST" && pathname === "/users") ||
    (method === "POST" && pathname === "/users/login") ||
    pathname === "/csrf"
  );
}

function isAccountSessionRequest(path, method) {
  const pathname = getRequestPath(path);

  return (
    (method === "POST" && pathname === "/logout") ||
    (method === "DELETE" && pathname === "/users")
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
      detail: {
        path,
        method,
        status,
      },
    }),
  );
}

async function getCsrfToken() {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/csrf`, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });
  } catch (error) {
    console.error("[MEMORIZEZ API] Falha ao obter CSRF:", error);

    throw new ApiError(
      "Não foi possível estabelecer conexão para obter o token de segurança.",
      {
        code: "CSRF_CONNECTION_ERROR",
      },
    );
  }

  const data = await readResponseBody(response);

  if (!response.ok) {
    throw new ApiError(
      extractErrorMessage(data) ||
        "Não foi possível validar a segurança da sessão.",
      {
        status: response.status,
        data,
        code: data?.code || "CSRF_ERROR",
      },
    );
  }

  if (!data || typeof data.token !== "string" || !data.token.trim()) {
    throw new ApiError(
      "O servidor não disponibilizou um token de segurança válido.",
      {
        status: response.status,
        data,
        code: "INVALID_CSRF_TOKEN",
      },
    );
  }

  return data.token;
}

async function apiRequest(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers || {});

  headers.set("Accept", "application/json");

  const needsCsrf = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  let token;

  if (needsCsrf) {
    try {
      token = await getCsrfToken();
    } catch (error) {
      if (
        error?.status === 401 &&
        !isPublicAuthenticationRequest(path, method) &&
        !isAccountSessionRequest(path, method)
      ) {
        notifySessionExpired(path, method, error.status);
      }

      throw error;
    }

    headers.set("X-CSRF-TOKEN", token);
  }

  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  if (options.body != null && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      method,
      credentials: "include",
      headers,
    });
  } catch (error) {
    console.error("[MEMORIZEZ API] Falha de comunicação:", {
      path,
      method,
      error,
    });

    throw new ApiError(
      "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
      {
        code: "NETWORK_ERROR",
      },
    );
  }

  const data = await readResponseBody(response);

  if (!response.ok) {
    if (
      response.status === 401 &&
      !isPublicAuthenticationRequest(path, method) &&
      !isAccountSessionRequest(path, method)
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

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    ApiError,
    getCsrfToken,
    apiRequest,
    readResponseBody,
    extractErrorMessage,
    isPublicAuthenticationRequest,
    isAccountSessionRequest,
    notifySessionExpired,
  };
}
