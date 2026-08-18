import { conversations } from "../mock-conversations.js";
import { ConversationItem } from "./conversationItem.js";

export function Inbox({ onSelectConversation }) {
  const inbox = document.createElement("section");

  inbox.className = "inbox";

  inbox.innerHTML = `
    <header class="inbox-header">

      <div class="inbox-title-row">
        <h2>Inbox</h2>

        <span class="inbox-count">
          ${conversations.length}
        </span>
      </div>

      <div class="inbox-search">
        <i class="fa-solid fa-magnifying-glass"></i>

        <input
          type="search"
          placeholder="Buscar"
          aria-label="Buscar conversación"
        />
      </div>

      <nav class="inbox-filters">

        <button
          class="inbox-filter is-active"
          data-filter="all"
        >
          Todas
          <span>18</span>
        </button>

        <button
          class="inbox-filter"
          data-filter="unread"
        >
          No leídas
          <span>6</span>
        </button>

        <button
          class="inbox-filter"
          data-filter="pending"
        >
          Pendientes
        </button>

      </nav>

    </header>

    <div class="inbox-list"></div>
  `;

  const list = inbox.querySelector(".inbox-list");

  conversations.forEach((conversation) => {
    list.appendChild(
      ConversationItem(
        conversation,
        onSelectConversation
      )
    );
  });

  return inbox;
}