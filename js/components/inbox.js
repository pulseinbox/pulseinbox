import { conversations } from "../mock-conversations.js";
import { ConversationItem } from "./conversationItem.js";
import { logout } from "../auth/auth.js";
import { getCurrentUser } from "../auth/auth.js";
import {
  canAccessConversation,
} from "../permissions.js";


export function Inbox({
  onSelectConversation,
  onConversationChange,
}) {
  const inbox =
    document.createElement("section");

  inbox.className = "inbox";


  /* =======================================================
     AUTHENTICATED USER
  ======================================================= */

  const currentUser =
    getCurrentUser();


  /* =======================================================
     ACCESSIBLE CONVERSATIONS
  ======================================================= */

  const accessibleConversations =
    currentUser
      ? conversations.filter(
          (conversation) =>
            canAccessConversation(
              currentUser,
              conversation
            )
        )
      : [];


  /* =======================================================
     MARKUP
  ======================================================= */

  inbox.innerHTML = `
    <header class="inbox-header">

      <div class="inbox-title-row">

        <div class="inbox-title">

          <h2>Inbox</h2>

          <span class="inbox-count">
            ${accessibleConversations.length}
          </span>

        </div>


        <button
          type="button"
          class="inbox-logout"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
        >
          <i class="fa-solid fa-right-from-bracket"></i>

          <span>
            Cerrar sesión
          </span>
        </button>

      </div>


      <div class="inbox-search">

        <i class="fa-solid fa-magnifying-glass"></i>

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


    <div class="inbox-list"></div>
  `;


  /* =======================================================
     ELEMENTS
  ======================================================= */

  const list =
    inbox.querySelector(
      ".inbox-list"
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
     STATE
  ======================================================= */

  let currentFilter =
    "all";

  let searchTerm =
    "";


  /* =======================================================
     RENDER
  ======================================================= */

  function render() {
    list.innerHTML = "";


    const filteredConversations =
      accessibleConversations.filter(
        (conversation) => {

          const matchesFilter =
            currentFilter === "all" ||
            conversation.status ===
              currentFilter;


          const customerName =
            conversation.customer.name
              .toLowerCase();


          const companyName =
            conversation.company.name
              .toLowerCase();


          const message =
            conversation.lastMessage.text
              .toLowerCase();


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

        list.appendChild(
          ConversationItem(
            conversation,
            onSelectConversation
          )
        );

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
                filterButton === button
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
    () => {

      logout();

      window.location.reload();

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


    render();
  }


  /* =======================================================
     PUBLIC METHODS
  ======================================================= */

  inbox.refresh =
    render;

  inbox.handleConversationChange =
    handleConversationChange;


  /* =======================================================
     INITIAL RENDER
  ======================================================= */

  render();


  return inbox;
}