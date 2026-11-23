const SESSION_EXPIRED_EVENT = "memorizez:session-expired";

function hasActiveSession() {
  return Boolean(window.MemorizezAuth?.isAuthenticated());
}

function requireAuthentication() {
  if (hasActiveSession()) {
    return true;
  }

  window.location.replace("auth.html?mode=login");
  return false;
}

function handleSessionExpired() {
  window.MemorizezAuth?.removeToken();
}

window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);

const MemorizezSession = Object.freeze({
  hasActiveSession,
  requireAuthentication,
});

window.MemorizezSession = MemorizezSession;

if (typeof module !== "undefined" && module.exports) {
  module.exports = MemorizezSession;
}
