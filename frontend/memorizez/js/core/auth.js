const TOKEN_STORAGE_KEY = "memorizez.token";

function getToken() {
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    console.warn("[MEMORIZEZ] Não foi possível acessar o token.", error);
    return null;
  }
}

function saveToken(token) {
  if (typeof token !== "string" || !token.trim()) {
    throw new TypeError("O token de autenticação é inválido.");
  }

  try {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch (error) {
    console.error("[MEMORIZEZ] Não foi possível salvar o token.", error);
    throw error;
  }
}

function removeToken() {
  try {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    console.warn("[MEMORIZEZ] Não foi possível remover o token.", error);
  }
}

function isAuthenticated() {
  return Boolean(getToken());
}

const MemorizezAuth = Object.freeze({
  getToken,
  saveToken,
  removeToken,
  isAuthenticated,
});

if (typeof window !== "undefined") {
  window.MemorizezAuth = MemorizezAuth;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = MemorizezAuth;
}
