function renderCardModals() {
  const modalsContainer = document.createElement("div");

  modalsContainer.innerHTML = `
    <div
      class="modal-overlay"
      id="card-modal-overlay"
      hidden
    >
      <div
        class="confirmation-modal card-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-modal-title"
        aria-describedby="card-modal-description card-edit-warning"
        tabindex="-1"
      >
        <button
          class="modal-close"
          id="close-card-form"
          type="button"
          aria-label="Fechar formulário"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        <h2 class="modal-title" id="card-modal-title">
          Novo cartão
        </h2>

        <p class="modal-message" id="card-modal-description">
          Preencha a frente e o verso do cartão.
          As observações são opcionais.
        </p>

        <div
          class="card-edit-warning"
          id="card-edit-warning"
          role="note"
          hidden
        >
          <strong>Atenção:</strong>
          Ao editar qualquer campo, o ciclo de revisões programadas
          deste cartão será reiniciado.
        </div>

        <form id="card-form">
          <label for="card-front">Frente</label>
          <textarea id="card-front" required></textarea>

          <label for="card-back">Verso</label>
          <textarea id="card-back" required></textarea>

          <label for="card-notes">Notas</label>
          <textarea id="card-notes"></textarea>

          <div class="modal-actions">
            <button
              class="btn button-secondary"
              id="cancel-card-form"
              type="button"
            >
              Cancelar
            </button>

            <button
              class="btn button-primary"
              id="save-card"
              type="submit"
            >
              Criar cartão
            </button>
          </div>
        </form>
      </div>
    </div>

    <div
      class="modal-overlay"
      id="delete-card-overlay"
      hidden
    >
      <div
        class="confirmation-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-card-title"
        aria-describedby="delete-card-modal-description"
        tabindex="-1"
      >
        <button
          class="modal-close"
          id="close-delete-card"
          type="button"
          aria-label="Fechar confirmação de exclusão"
        >
          <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
        <h2 class="modal-title" id="delete-card-title">
          Excluir cartão?
        </h2>

        <p class="modal-message" id="delete-card-modal-description">
          Tem certeza de que deseja excluir este cartão?
          Todos os dados associados a ele também serão excluídos.
          Esta ação não poderá ser desfeita.
        </p>

        <div class="modal-actions">
          <button
            class="btn button-secondary"
            id="cancel-delete-card"
            type="button"
          >
            Cancelar
          </button>

          <button
            class="btn button-primary"
            id="confirm-delete-card"
            type="button"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.append(modalsContainer);

  return modalsContainer;
}

window.CardModals = {
  render: renderCardModals,
};
