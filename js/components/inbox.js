import {
  ConversationItem,
} from "./conversationItem.js";

import {
  logout,
  getCurrentUser,
} from "../auth/auth.js";

import {
  getConversations,
  subscribeToConversations,
  subscribeToIncomingMessages,
} from "../services/conversationService.js";


export function Inbox({
  onSelectConversation,
  onConversationChange,
}) {

  const inbox =
    document.createElement(
      "section"
    );


  inbox.className =
    "inbox";


  /* =======================================================
     STATE
  ======================================================= */

  const currentUser =
    getCurrentUser();


  let conversations = [];

  let currentFilter =
    "all";

  let searchTerm =
    "";

  let isLoading =
    true;

  let unsubscribeConversations =
    null;

  let unsubscribeIncomingMessages =
    null;


  /* =======================================================
     MARKUP
  ======================================================= */

  inbox.innerHTML = `
    <header class="inbox-header">

      <div class="inbox-title-row">

        <div class="inbox-title">

          <h2>Inbox</h2>

          <span class="inbox-count">
            0
          </span>

        </div>


        <button
          type="button"
          class="inbox-logout"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
        >

          <i
            class="fa-solid fa-right-from-bracket"
          ></i>

          <span>
            Cerrar sesión
          </span>

        </button>

      </div>


      <div class="inbox-search">

        <i
          class="fa-solid fa-magnifying-glass"
        ></i>

        <input
          type="search"
          placeholder="Buscar conversación..."
          autocomplete="off"
        />

      </div>


      <div class="inbox-filters">

        <button
          type="button"
          class="inbox-filter is-active"
          data-filter="all"
        >
          Todas
        </button>


        <button
          type="button"
          class="inbox-filter"
          data-filter="unread"
        >
          No leídas
        </button>


        <button
          type="button"
          class="inbox-filter"
          data-filter="active"
        >
          En conversación
        </button>


        <button
          type="button"
          class="inbox-filter"
          data-filter="pending"
        >
          Pendientes
        </button>

      </div>

    </header>


    <div class="inbox-list">

      <div class="placeholder">
        Cargando conversaciones...
      </div>

    </div>
  `;


  /* =======================================================
     ELEMENTS
  ======================================================= */

  const list =
    inbox.querySelector(
      ".inbox-list"
    );


  const count =
    inbox.querySelector(
      ".inbox-count"
    );


  const searchInput =
    inbox.querySelector(
      ".inbox-search input"
    );


  const filterButtons =
    inbox.querySelectorAll(
      ".inbox-filter"
    );


  const logoutButton =
    inbox.querySelector(
      ".inbox-logout"
    );


  /* =======================================================
     MESSAGE SOUND
  ======================================================= */

  const newMessageSound =
    new Audio(
      "/assets/new-message.wav"
    );


  newMessageSound.preload =
    "auto";


  newMessageSound.volume =
    0.45;


  function playNewMessageSound() {

    try {

      newMessageSound.currentTime =
        0;


      const playPromise =
        newMessageSound.play();


      if (
        playPromise &&
        typeof playPromise.catch ===
          "function"
      ) {

        playPromise.catch(
          (error) => {

            console.debug(
              "INBOX: sonido bloqueado por el navegador:",
              error
            );

          }
        );

      }

    } catch (error) {

      console.debug(
        "INBOX: no se pudo reproducir el sonido:",
        error
      );

    }

  }


  /* =======================================================
     LOAD CONVERSATIONS
  ======================================================= */

  async function loadConversations() {

    console.log(
      "========================================"
    );

    console.log(
      "INBOX: iniciando carga"
    );

    console.log(
      "INBOX: usuario actual:",
      currentUser
    );


    if (!currentUser) {

      console.warn(
        "INBOX: no existe usuario autenticado"
      );

      conversations = [];

      isLoading =
        false;

      render();

      return;

    }


    isLoading =
      true;

    render();


    try {

      console.log(
        "INBOX: llamando getConversations()..."
      );


      conversations =
        await getConversations(
          currentUser
        );


      console.log(
        "INBOX: conversaciones recibidas:",
        conversations
      );


      console.log(
        "INBOX: cantidad:",
        conversations.length
      );


      isLoading =
        false;

      render();


      /*
       * Cancelamos cualquier listener anterior.
       */

      if (
        typeof unsubscribeConversations ===
        "function"
      ) {

        unsubscribeConversations();

        unsubscribeConversations =
          null;

      }


      /*
       * Escuchamos cambios de conversaciones
       * en tiempo real.
       */

      unsubscribeConversations =
        await subscribeToConversations(
          currentUser,

          (updatedConversations) => {

            /*
             * Este listener solamente actualiza
             * la información visual del Inbox.
             *
             * NO genera sonido.
             *
             * El sonido se decide exclusivamente
             * desde subscribeToIncomingMessages(),
             * que inspecciona mensajes nuevos y
             * verifica sender === "customer".
             */

            conversations =
              updatedConversations;


            isLoading =
              false;


            render();

          },

          (error) => {

            console.error(
              "INBOX: error en tiempo real:",
              error
            );

          }
        );


      /*
       * Listener independiente para mensajes entrantes.
       *
       * Este es el ÚNICO lugar desde donde se reproduce
       * el sonido de nueva entrada.
       */

      if (
        typeof unsubscribeIncomingMessages ===
        "function"
      ) {

        unsubscribeIncomingMessages();

        unsubscribeIncomingMessages =
          null;

      }


      unsubscribeIncomingMessages =
        await subscribeToIncomingMessages(

          currentUser,

          (
            message,
            conversation
          ) => {

            console.log(
              "INBOX: mensaje entrante:",
              message,
              conversation
            );


            playNewMessageSound();

          },

          (error) => {

            console.error(
              "INBOX: error en listener de mensajes entrantes:",
              error
            );

          }

        );


    } catch (error) {

      console.error(
        "INBOX: error cargando conversaciones:",
        error
      );


      conversations = [];

      isLoading =
        false;


      list.innerHTML = `
        <div class="placeholder">
          No se pudieron cargar las conversaciones
        </div>
      `;


      return;

    }


    console.log(
      "INBOX: render finalizado"
    );

    console.log(
      "========================================"
    );

  }


  /* =======================================================
     RENDER
  ======================================================= */

  function render() {

    count.textContent =
      conversations.length;


    list.innerHTML =
      "";


    /* =====================================================
       LOADING
    ===================================================== */

    if (isLoading) {

      list.innerHTML = `
        <div class="placeholder">
          Cargando conversaciones...
        </div>
      `;

      return;

    }


    /* =====================================================
       FILTER
    ===================================================== */

    const filteredConversations =
      conversations.filter(
        (conversation) => {

          const matchesFilter =
            currentFilter ===
              "all" ||
            conversation.status ===
              currentFilter;


          const customerName =
            conversation.customer?.name
              ?.toLowerCase() ??
            "";


          const companyName =
            conversation.company?.name
              ?.toLowerCase() ??
            "";


          const message =
            conversation.lastMessage?.text
              ?.toLowerCase() ??
            "";


          const matchesSearch =
            !searchTerm ||
            customerName.includes(
              searchTerm
            ) ||
            companyName.includes(
              searchTerm
            ) ||
            message.includes(
              searchTerm
            );


          return (
            matchesFilter &&
            matchesSearch
          );

        }
      );


    console.log(
      "INBOX: conversaciones filtradas:",
      filteredConversations
    );


    /* =====================================================
       EMPTY STATE
    ===================================================== */

    if (
      filteredConversations.length ===
      0
    ) {

      list.innerHTML = `
        <div class="placeholder">
          No hay conversaciones
        </div>
      `;

      return;

    }


    /* =====================================================
       CONVERSATION ITEMS
    ===================================================== */

    filteredConversations.forEach(
      (conversation) => {

        try {

          const item =
            ConversationItem(
              conversation,
              onSelectConversation
            );


          list.appendChild(
            item
          );


        } catch (error) {

          console.error(
            "INBOX: error creando ConversationItem:",
            error,
            conversation
          );

        }

      }
    );

  }


  /* =======================================================
     SEARCH
  ======================================================= */

  searchInput.addEventListener(
    "input",
    (event) => {

      searchTerm =
        event.target.value
          .trim()
          .toLowerCase();


      render();

    }
  );


  /* =======================================================
     FILTERS
  ======================================================= */

  filterButtons.forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          currentFilter =
            button.dataset.filter;


          filterButtons.forEach(
            (filterButton) => {

              filterButton.classList.toggle(
                "is-active",
                filterButton ===
                  button
              );

            }
          );


          render();

        }
      );

    }
  );


  /* =======================================================
     LOGOUT
  ======================================================= */

  logoutButton.addEventListener(
    "click",
    async () => {

      try {

        await logout();

        window.location.reload();

      } catch (error) {

        console.error(
          "Error cerrando sesión:",
          error
        );

      }

    }
  );


  /* =======================================================
     CONVERSATION CHANGE
  ======================================================= */

  function handleConversationChange(
    conversation
  ) {

    if (
      typeof onConversationChange ===
      "function"
    ) {

      onConversationChange(
        conversation
      );

    }


    loadConversations();

  }


  /* =======================================================
     PUBLIC METHODS
  ======================================================= */

  inbox.refresh =
    loadConversations;


  inbox.handleConversationChange =
    handleConversationChange;


  /*
   * Permite cerrar el listener cuando
   * el Inbox deja de utilizarse.
   */

  inbox.destroy =
    () => {

      if (
        typeof unsubscribeConversations ===
        "function"
      ) {

        unsubscribeConversations();

        unsubscribeConversations =
          null;

      }


      if (
        typeof unsubscribeIncomingMessages ===
        "function"
      ) {

        unsubscribeIncomingMessages();

        unsubscribeIncomingMessages =
          null;

      }

    };


  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  loadConversations();


  return inbox;

}