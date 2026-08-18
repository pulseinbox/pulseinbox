import { messages } from "../mock-messages.js";

const quickReplies = [
  {
    id: "greeting",
    label: "Saludo",
    icon: "fa-regular fa-hand",
    text: "¡Hola! Gracias por escribirnos. ¿En qué podemos ayudarte?",
  },
  {
    id: "price",
    label: "Precio",
    icon: "fa-solid fa-tag",
    text: "¡Claro! Te compartimos el precio del producto que estás consultando.",
  },
  {
    id: "availability",
    label: "Disponibilidad",
    icon: "fa-solid fa-box",
    text: "Sí, tenemos disponibilidad actualmente.",
  },
  {
    id: "shipping",
    label: "Envíos",
    icon: "fa-solid fa-truck",
    text: "Sí, realizamos envíos. Podemos indicarte las opciones disponibles.",
  },
  {
    id: "sizes",
    label: "Tallas",
    icon: "fa-solid fa-ruler",
    text: "Tenemos diferentes tallas disponibles. ¿Qué talla estás buscando?",
  },
];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getCurrentTime() {
  return new Intl.DateTimeFormat("es-GT", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());
}

function getChannelIcon(channel) {
  switch (channel) {
    case "instagram":
      return "fa-brands fa-instagram";

    case "facebook":
      return "fa-brands fa-facebook-f";

    case "tiktok":
      return "fa-brands fa-tiktok";

    default:
      return "fa-solid fa-comment";
  }
}

function createMessageMarkup(message) {
  const isOutgoing =
    message.sender === "employee";

  return `
    <div
      class="chat-message ${
        isOutgoing
          ? "is-outgoing"
          : "is-incoming"
      }"
    >

      <div class="chat-bubble">
        ${escapeHtml(message.text)}
      </div>

      <time class="chat-message-time">
        ${escapeHtml(message.timestamp)}
      </time>

    </div>
  `;
}

function createQuickReplyMarkup(reply) {
  return `
    <button
      type="button"
      class="quick-reply"
      data-quick-reply="${reply.id}"
    >

      <span class="quick-reply-icon">
        <i class="${reply.icon}"></i>
      </span>

      <span class="quick-reply-content">

        <span class="quick-reply-label">
          ${escapeHtml(reply.label)}
        </span>

        <span class="quick-reply-preview">
          ${escapeHtml(reply.text)}
        </span>

      </span>

    </button>
  `;
}

export function Chat(conversation = null) {
  const chat = document.createElement("section");

  chat.className = "chat";

  if (!conversation) {
    chat.innerHTML = `
      <div class="chat-empty">

        <div class="chat-empty-icon">
          <i class="fa-regular fa-comments"></i>
        </div>

        <h2>Selecciona una conversación</h2>

        <p>
          Selecciona una conversación del Inbox para comenzar.
        </p>

      </div>
    `;

    return chat;
  }


  /* =======================================================
     CONVERSATION DATA
  ======================================================= */

  const customerName =
    conversation.customer.name;

  const companyName =
    conversation.company.name;

  const companyColor =
    conversation.company.color;

  const channel =
    conversation.channel.type;


  /* =======================================================
     MESSAGES
  ======================================================= */

  if (!messages[conversation.id]) {
    messages[conversation.id] = [];
  }

  const conversationMessages =
    messages[conversation.id];


  /* =======================================================
     RENDER
  ======================================================= */

  chat.innerHTML = `
    <header class="chat-header">

      <div class="chat-customer">

        <div class="chat-avatar">
          ${escapeHtml(
            customerName
              .charAt(0)
              .toUpperCase()
          )}
        </div>

        <div class="chat-customer-info">

          <div class="chat-customer-name">
            ${escapeHtml(customerName)}
          </div>

          <div class="chat-company">

            <span
              class="chat-company-dot"
              style="--company-color: ${companyColor}"
            ></span>

            ${escapeHtml(companyName)}

          </div>

        </div>

      </div>


      <div class="chat-channel">

        <i class="${getChannelIcon(channel)}"></i>

        <span>
          ${escapeHtml(channel)} DM
        </span>

      </div>

    </header>


    <div class="chat-messages">

      <div class="chat-date">
        HOY
      </div>

      <div class="chat-message-list">

        ${conversationMessages
          .map(createMessageMarkup)
          .join("")}

      </div>

    </div>


    <form class="chat-composer">

      <div class="quick-replies">

        <div class="quick-replies-header">

          <span>
            Respuestas rápidas
          </span>

          <button
            type="button"
            class="quick-replies-close"
            aria-label="Cerrar respuestas rápidas"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>

        </div>

        <div class="quick-replies-list">

          ${quickReplies
            .map(createQuickReplyMarkup)
            .join("")}

        </div>

      </div>


      <input
        type="text"
        class="chat-input"
        placeholder="Escribe un mensaje..."
        autocomplete="off"
      />


      <div class="chat-actions">

        <button
          type="button"
          class="chat-action chat-quick-replies-toggle"
          aria-label="Respuestas rápidas"
          aria-expanded="false"
        >
          <i class="fa-regular fa-comment-dots"></i>
        </button>


        <button
          type="button"
          class="chat-action"
          aria-label="Emoji"
        >
          <i class="fa-regular fa-face-smile"></i>
        </button>


        <button
          type="button"
          class="chat-action"
          aria-label="Imagen"
        >
          <i class="fa-regular fa-image"></i>
        </button>


        <button
          type="button"
          class="chat-action"
          aria-label="Adjuntar archivo"
        >
          <i class="fa-solid fa-paperclip"></i>
        </button>


        <button
          type="submit"
          class="chat-send"
          aria-label="Enviar mensaje"
        >
          <i class="fa-solid fa-paper-plane"></i>
        </button>

      </div>

    </form>
  `;


  /* =======================================================
     ELEMENTS
  ======================================================= */

  const messagesContainer =
    chat.querySelector(".chat-messages");

  const messageList =
    chat.querySelector(".chat-message-list");

  const composer =
    chat.querySelector(".chat-composer");

  const input =
    chat.querySelector(".chat-input");

  const quickRepliesPanel =
    chat.querySelector(".quick-replies");

  const quickRepliesToggle =
    chat.querySelector(
      ".chat-quick-replies-toggle"
    );

  const quickRepliesClose =
    chat.querySelector(
      ".quick-replies-close"
    );


  /* =======================================================
     INITIAL SCROLL
  ======================================================= */

  requestAnimationFrame(() => {
    messagesContainer.scrollTop =
      messagesContainer.scrollHeight;
  });


  /* =======================================================
     QUICK REPLIES TOGGLE
  ======================================================= */

  function toggleQuickReplies(force) {
    const shouldOpen =
      typeof force === "boolean"
        ? force
        : !quickRepliesPanel.classList.contains(
            "is-visible"
          );

    quickRepliesPanel.classList.toggle(
      "is-visible",
      shouldOpen
    );

    quickRepliesToggle.setAttribute(
      "aria-expanded",
      String(shouldOpen)
    );
  }


  quickRepliesToggle.addEventListener(
    "click",
    () => {
      toggleQuickReplies();
    }
  );


  quickRepliesClose.addEventListener(
    "click",
    () => {
      toggleQuickReplies(false);
    }
  );


  /* =======================================================
     SELECT QUICK REPLY
  ======================================================= */

  quickRepliesPanel
    .querySelectorAll(".quick-reply")
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          const replyId =
            button.dataset.quickReply;

          const reply =
            quickReplies.find(
              (item) =>
                item.id === replyId
            );

          if (!reply) {
            return;
          }

          input.value = reply.text;

          input.focus();

          input.setSelectionRange(
            input.value.length,
            input.value.length
          );

          toggleQuickReplies(false);
        }
      );

    });


  /* =======================================================
     SEND MESSAGE
  ======================================================= */

  composer.addEventListener(
    "submit",
    (event) => {

      event.preventDefault();

      const text =
        input.value.trim();

      if (!text) {
        return;
      }

      const message = {
        id: `msg-${Date.now()}`,
        conversationId:
          conversation.id,
        sender: "employee",
        text,
        timestamp: getCurrentTime(),
      };

      conversationMessages.push(
        message
      );

      messageList.insertAdjacentHTML(
        "beforeend",
        createMessageMarkup(message)
      );

      input.value = "";

      requestAnimationFrame(() => {

        messagesContainer.scrollTo({
          top:
            messagesContainer.scrollHeight,
          behavior: "smooth",
        });

      });

      input.focus();
    }
  );


  return chat;
}