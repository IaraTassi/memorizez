(function () {
    const originalFetch = window.fetch;

    window.fetch = async function (input, init = {}) {
        const request = input instanceof Request ? input : null;

        const method = (
            init.method ||
            request?.method ||
            "GET"
        ).toUpperCase();

        const protectedMethods = ["POST", "PUT", "PATCH", "DELETE"];

        if (!protectedMethods.includes(method)) {
            return originalFetch.call(this, input, init);
        }

        const csrfResponse = await originalFetch.call(this, "/csrf", {
            method: "GET",
            credentials: "include"
        });

        if (!csrfResponse.ok) {
            throw new Error("Nao foi possivel obter o token CSRF.");
        }

        const csrf = await csrfResponse.json();

        const headers = new Headers(request?.headers || {});
        new Headers(init.headers || {}).forEach((value, key) => {
            headers.set(key, value);
        });

        headers.set(csrf.headerName, csrf.token);

        const options = {
            ...init,
            method,
            headers,
            credentials: "include"
        };

        return originalFetch.call(this, input, options);
    };
})();
