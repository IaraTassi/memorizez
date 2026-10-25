const API_BASE_URL = "https://memorizez.onrender.com";

async function getCsrfToken() {
  const response = await fetch(`${API_BASE_URL}/csrf`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Não foi possível obter o token de segurança.");
  }

  const data = await response.json();
  return data.token;
}

async function apiRequest(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const headers = { ...options.headers };

  const needsCsrf = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  if (needsCsrf) {
    headers["X-CSRF-TOKEN"] = await getCsrfToken();
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    method,
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    const error = new Error("Não foi possível concluir a solicitação.");
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return response.json();
  }

  return null;
}
