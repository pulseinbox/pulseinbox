import { messages } from "../mock-messages.js";
import { employees } from "../mock-employees.js";
import {
  getCurrentUser,
} from "../auth/auth.js";

import {
  can,
  canAccessCompany,
  PERMISSIONS,
} from "../permissions.js";

import {
  takeConversation,
  assignConversation,
  unassignConversation,
  changeConversationStatus,
  addMessage,
} from "../services/conversationService.js";


/* =========================================================
   QUICK REPLIES
========================================================= */

const quickReplies = [
  {
    id: "greeting",
    label: "Saludo",
    icon: "fa-regular fa-hand",
    text:
      "¡Hola! Gracias por escribirnos. ¿En qué podemos ayudarte?",
  },

  {
    id: "price",
    label: "Precio",
    icon: "fa-solid fa-tag",
    text:
      "¡Claro! Te compartimos el precio del producto que estás consultando.",
  },

  {
    id: "availability",
    label: "Disponibilidad",
    icon: "fa-solid fa-box",
    text:
      "Sí, tenemos disponibilidad actualmente.",
  },

  {
    id: "shipping",
    label: "Envíos",
    icon: "fa-solid fa-truck",
    text:
      "Sí, realizamos envíos. Podemos indicarte las opciones disponibles.",
  },

  {
    id: "sizes",
    label: "Tallas",
    icon: "fa-solid fa-ruler",
    text:
      "Tenemos diferentes tallas disponibles. ¿Qué talla estás buscando?",
  },
];


/* =========================================================
   HELPERS
========================================================= */

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


function getStatusLabel(status) {
  switch (status) {
    case "unread":
      return "No leído";

    case "active":
      return "En conversación";

    case "pending":
      return "Pendiente";

    case "closed":
      return "Cerrado";

    default:
      return "Estado";
  }
}


function getEmployee(employeeId) {
  return employees.find(
    (employee) =>
      employee.id === employeeId
  );
}


/* =========================================================
   MESSAGE MARKUP
========================================================= */

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


/* =========================================================
   QUICK REPLY MARKUP
========================================================= */

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


/* =========================================================
   EMPLOYEE OPTION MARKUP
========================================================= */

function createEmployeeOptionMarkup(
  employee,
  currentEmployeeId
) {
  const isCurrent =
    employee.id === currentEmployeeId;

  return `
    <button
      type="button"
      data-employee="${employee.id}"
      class="${
        isCurrent
          ? "is-current"
          : ""
      }"
    >

      <span class="chat-assignee-avatar">
        ${employee.name
          .charAt(0)
          .toUpperCase()}
      </span>

      <span class="chat-assignee-name">
        ${escapeHtml(employee.name)}
      </span>

      ${
        isCurrent
          ? `
            <i
              class="fa-solid fa-check"
            ></i>
          `
          : ""
      }

    </button>
  `;
}


/* =========================================================
   AVAILABLE ASSIGNEES
========================================================= */

function getAvailableAssignees(
  user,
  companyId
) {
  if (!user || !companyId) {
    return [];
  }

  if (
    !canAccessCompany(
      user,
      companyId
    )
  ) {
    return [];
  }

  if (
    !can(
      user,
      PERMISSIONS.ASSIGN_CONVERSATIONS
    )
  ) {
    return [];
  }

  return employees.filter(
    (employee) =>
      employee.companies?.includes(
        companyId
      )
  );
}


/* =========================================================
   CHAT
========================================================= */

export function Chat(
  conversation = null,
  {
    onConversationChange = null,
  } = {}
) {
  const chat =
    document.createElement("section");

  chat.className = "chat";


  /* =======================================================
     EMPTY CHAT
  ======================================================= */

  if (!conversation) {
    chat.innerHTML = `
      <div class="chat-empty">

        <div class="chat-empty-icon">
          <i class="fa-regular fa-comments"></i>
        </div>

        <h2>
          Selecciona una conversación
        </h2>

        <p>
          Selecciona una conversación del Inbox para comenzar.
        </p>

      </div>
    `;

    return chat;
  }


  /* =======================================================
     CURRENT USER
  ======================================================= */

  const currentUser =
    getCurrentUser();


  /* =======================================================
     CONVERSATION DATA
  ======================================================= */

  const customerName =
    conversation.customer.name;

  const companyName =
    conversation.company.name;

  const companyColor =
    conversation.company.color;

  const companyId =
    conversation.company.id;

  const channel =
    conversation.channel.type;


  /* =======================================================
     PERMISSIONS
  ======================================================= */

  const canTakeConversation =
    can(
      currentUser,
      PERMISSIONS.TAKE_CONVERSATIONS
    );

  const canAssignConversation =
    can(
      currentUser,
      PERMISSIONS.ASSIGN_CONVERSATIONS
    );

  const canChangeStatus =
    can(
      currentUser,
      PERMISSIONS.CHANGE_STATUS
    );

  const canReply =
    can(
      currentUser,
      PERMISSIONS.REPLY_MESSAGES
    );


  /* =======================================================
     ASSIGNMENT STATE
  ======================================================= */

  const assignedEmployee =
    getEmployee(
      conversation.assignedTo
    );

  const isAssignedToCurrentUser =
    Boolean(
      conversation.assignedTo &&
      currentUser?.id ===
        conversation.assignedTo
    );

  const isUnassigned =
    !conversation.assignedTo;


  const availableAssignees =
    getAvailableAssignees(
      currentUser,
      companyId
    );


  /* =======================================================
     MESSAGES
  ======================================================= */

  if (!messages[conversation.id]) {
    messages[conversation.id] = [];
  }

  const conversationMessages =
    messages[conversation.id];


  /* =======================================================
     ASSIGNEE UI
  ======================================================= */

  let assigneeMarkup = "";


  /*
   * Manager / Admin
   *
   * They can assign conversations
   * to employees belonging to this
   * company.
   */

  if (canAssignConversation) {

    assigneeMarkup = `
      <div class="chat-assignee">

        <button
          type="button"
          class="chat-assignee-button"
          aria-expanded="false"
        >

          <span class="chat-assignee-avatar">
            ${
              assignedEmployee
                ? assignedEmployee.name
                    .charAt(0)
                    .toUpperCase()
                : `<i class="fa-solid fa-user"></i>`
            }
          </span>

          <span class="chat-assignee-label">
            ${
              assignedEmployee
                ? escapeHtml(
                    assignedEmployee.name
                  )
                : "Sin asignar"
            }
          </span>

          <i class="fa-solid fa-chevron-down"></i>

        </button>


        <div class="chat-assignee-menu">

          <div class="chat-assignee-menu-title">
            Asignar conversación
          </div>


          <button
            type="button"
            data-employee="unassigned"
            class="${
              isUnassigned
                ? "is-current"
                : ""
            }"
          >

            <span class="chat-assignee-avatar is-empty">
              <i class="fa-solid fa-user"></i>
            </span>

            <span class="chat-assignee-name">
              Sin asignar
            </span>

            ${
              isUnassigned
                ? `
                  <i class="fa-solid fa-check"></i>
                `
                : ""
            }

          </button>


          ${
            availableAssignees
              .map(
                (employee) =>
                  createEmployeeOptionMarkup(
                    employee,
                    conversation.assignedTo
                  )
              )
              .join("")
          }

        </div>

      </div>
    `;
  }


  /*
   * Agent
   *
   * They can only take an
   * unassigned conversation.
   */

  else {

    if (isUnassigned) {

      if (canTakeConversation) {

        assigneeMarkup = `
          <div class="chat-assignee">

            <button
              type="button"
              class="chat-assignee-button chat-take-button"
              aria-label="Tomar conversación"
            >

              <span class="chat-assignee-avatar is-empty">
                <i class="fa-solid fa-hand-pointer"></i>
              </span>

              <span class="chat-assignee-label">
                Tomar conversación
              </span>

            </button>

          </div>
        `;

      }

    }

    else {

      assigneeMarkup = `
        <div class="chat-assignee">

          <div
            class="chat-assignee-button is-readonly"
          >

            <span class="chat-assignee-avatar">
              ${
                assignedEmployee
                  ? assignedEmployee.name
                      .charAt(0)
                      .toUpperCase()
                  : `<i class="fa-solid fa-user"></i>`
              }
            </span>

            <span class="chat-assignee-label">
              ${
                assignedEmployee
                  ? escapeHtml(
                      assignedEmployee.name
                    )
                  : "Sin asignar"
              }
            </span>

          </div>

        </div>
      `;
    }
  }


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


      <div class="chat-header-actions">

        <div class="chat-channel">

          <i class="${getChannelIcon(channel)}"></i>

          <span>
            ${escapeHtml(channel)} DM
          </span>

        </div>


        ${assigneeMarkup}


        <div class="chat-status">

          <button
            type="button"
            class="chat-status-button"
            aria-expanded="false"
            ${
              !canChangeStatus
                ? "disabled"
                : ""
            }
          >

            <span class="chat-status-dot"></span>

            <span class="chat-status-label">
              Estado
            </span>

            <i class="fa-solid fa-chevron-down"></i>

          </button>


          <div class="chat-status-menu">

            <button
              type="button"
              data-status="unread"
            >
              <span
                class="chat-status-option-dot is-unread"
              ></span>

              No leído
            </button>


            <button
              type="button"
              data-status="active"
            >
              <span
                class="chat-status-option-dot is-active"
              ></span>

              En conversación
            </button>


            <button
              type="button"
              data-status="pending"
            >
              <span
                class="chat-status-option-dot is-pending"
              ></span>

              Pendiente
            </button>


            <button
              type="button"
              data-status="closed"
            >
              <span
                class="chat-status-option-dot is-closed"
              ></span>

              Cerrado
            </button>

          </div>

        </div>

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
        ${
          !canReply
            ? "disabled"
            : ""
        }
      />


      <div class="chat-actions">

        <button
          type="button"
          class="chat-action chat-quick-replies-toggle"
          aria-label="Respuestas rápidas"
          aria-expanded="false"
          ${
            !canReply
              ? "disabled"
              : ""
          }
        >
          <i class="fa-regular fa-comment-dots"></i>
        </button>


        <button
          type="button"
          class="chat-action"
          aria-label="Emoji"
          ${
            !canReply
              ? "disabled"
              : ""
          }
        >
          <i class="fa-regular fa-face-smile"></i>
        </button>


        <button
          type="button"
          class="chat-action"
          aria-label="Imagen"
          ${
            !canReply
              ? "disabled"
              : ""
          }
        >
          <i class="fa-regular fa-image"></i>
        </button>


        <button
          type="button"
          class="chat-action"
          aria-label="Adjuntar archivo"
          ${
            !canReply
              ? "disabled"
              : ""
          }
        >
          <i class="fa-solid fa-paperclip"></i>
        </button>


        <button
          type="submit"
          class="chat-send"
          aria-label="Enviar mensaje"
          ${
            !canReply
              ? "disabled"
              : ""
          }
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
    chat.querySelector(
      ".chat-messages"
    );

  const messageList =
    chat.querySelector(
      ".chat-message-list"
    );

  const composer =
    chat.querySelector(
      ".chat-composer"
    );

  const input =
    chat.querySelector(
      ".chat-input"
    );


  /* =======================================================
     QUICK REPLIES
  ======================================================= */

  const quickRepliesPanel =
    chat.querySelector(
      ".quick-replies"
    );

  const quickRepliesToggle =
    chat.querySelector(
      ".chat-quick-replies-toggle"
    );

  const quickRepliesClose =
    chat.querySelector(
      ".quick-replies-close"
    );


  /* =======================================================
     STATUS
  ======================================================= */

  const statusButton =
    chat.querySelector(
      ".chat-status-button"
    );

  const statusMenu =
    chat.querySelector(
      ".chat-status-menu"
    );

  const statusLabel =
    chat.querySelector(
      ".chat-status-label"
    );

  const statusDot =
    chat.querySelector(
      ".chat-status-dot"
    );

  const statusOptions =
    chat.querySelectorAll(
      ".chat-status-menu [data-status]"
    );


  /* =======================================================
     ASSIGNEE
  ======================================================= */

  const assigneeButton =
    chat.querySelector(
      ".chat-assignee-button"
    );

  const assigneeMenu =
    chat.querySelector(
      ".chat-assignee-menu"
    );


  /* =======================================================
     STATUS UI
  ======================================================= */

  function updateStatusUI(
    status
  ) {
    statusLabel.textContent =
      getStatusLabel(status);

    statusDot.className =
      `chat-status-dot is-${status}`;
  }


  updateStatusUI(
    conversation.status
  );


  /* =======================================================
     ASSIGNMENT
  ======================================================= */

  if (assigneeButton) {

    /*
     * Manager / Admin
     */

    if (canAssignConversation) {

      assigneeButton.addEventListener(
        "click",
        () => {

          const isOpen =
            assigneeMenu.classList.contains(
              "is-visible"
            );

          assigneeMenu.classList.toggle(
            "is-visible",
            !isOpen
          );

          assigneeButton.setAttribute(
            "aria-expanded",
            String(!isOpen)
          );

        }
      );


      const assigneeOptions =
        assigneeMenu.querySelectorAll(
          "[data-employee]"
        );


      assigneeOptions.forEach(
        (option) => {

          option.addEventListener(
            "click",
            () => {

              const employeeId =
                option.dataset.employee;


              if (
                employeeId !== "unassigned" &&
                !availableAssignees.some(
                  (employee) =>
                    employee.id === employeeId
                )
              ) {
                return;
              }


              const result =
                employeeId === "unassigned"
                  ? unassignConversation(
                      conversation,
                      currentUser
                    )
                  : assignConversation(
                      conversation,
                      employeeId,
                      currentUser
                    );


              if (!result.success) {
                return;
              }


              assigneeMenu.classList.remove(
                "is-visible"
              );


              assigneeButton.setAttribute(
                "aria-expanded",
                "false"
              );


              if (
                typeof onConversationChange ===
                "function"
              ) {
                onConversationChange(
                  conversation
                );
              }

            }
          );

        }
      );

    }


    /*
     * Agent
     */

    else if (
      canTakeConversation &&
      isUnassigned
    ) {

      assigneeButton.addEventListener(
        "click",
        () => {

          const result =
            takeConversation(
              conversation,
              currentUser
            );


          if (!result.success) {
            return;
          }


          if (
            typeof onConversationChange ===
            "function"
          ) {
            onConversationChange(
              conversation
            );
          }

        }
      );

    }

  }


  /* =======================================================
     STATUS MENU
  ======================================================= */

  if (
    statusButton &&
    canChangeStatus
  ) {

    statusButton.addEventListener(
      "click",
      () => {

        const isOpen =
          statusMenu.classList.contains(
            "is-visible"
          );


        statusMenu.classList.toggle(
          "is-visible",
          !isOpen
        );


        statusButton.setAttribute(
          "aria-expanded",
          String(!isOpen)
        );

      }
    );


    statusOptions.forEach(
      (option) => {

        option.addEventListener(
          "click",
          () => {

            const newStatus =
              option.dataset.status;


            const result =
              changeConversationStatus(
                conversation,
                newStatus,
                currentUser
              );


            if (!result.success) {
              return;
            }


            updateStatusUI(
              result.conversation.status
            );


            statusMenu.classList.remove(
              "is-visible"
            );


            statusButton.setAttribute(
              "aria-expanded",
              "false"
            );


            if (
              typeof onConversationChange ===
              "function"
            ) {
              onConversationChange(
                conversation
              );
            }

          }
        );

      }
    );

  }


  /* =======================================================
     INITIAL SCROLL
  ======================================================= */

  requestAnimationFrame(
    () => {

      messagesContainer.scrollTop =
        messagesContainer.scrollHeight;

    }
  );


  /* =======================================================
     QUICK REPLIES TOGGLE
  ======================================================= */

  function toggleQuickReplies(
    force
  ) {

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


  if (quickRepliesToggle) {

    quickRepliesToggle.addEventListener(
      "click",
      () => {
        toggleQuickReplies();
      }
    );

  }


  if (quickRepliesClose) {

    quickRepliesClose.addEventListener(
      "click",
      () => {
        toggleQuickReplies(false);
      }
    );

  }


  /* =======================================================
     SELECT QUICK REPLY
  ======================================================= */

  quickRepliesPanel
    .querySelectorAll(
      ".quick-reply"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            const replyId =
              button.dataset.quickReply;


            const reply =
              quickReplies.find(
                (item) =>
                  item.id ===
                  replyId
              );


            if (!reply) {
              return;
            }


            input.value =
              reply.text;


            input.focus();


            input.setSelectionRange(
              input.value.length,
              input.value.length
            );


            toggleQuickReplies(
              false
            );

          }
        );

      }
    );


  /* =======================================================
     SEND MESSAGE
  ======================================================= */

  composer.addEventListener(
    "submit",
    (event) => {

      event.preventDefault();


      if (!canReply) {
        return;
      }


      const text =
        input.value.trim();


      if (!text) {
        return;
      }


      const result =
        addMessage(
          conversation,
          text,
          "employee",
          currentUser
        );


      if (!result.success) {
        return;
      }


      const message =
        result.message;


      conversationMessages.push(
        message
      );


      messageList.insertAdjacentHTML(
        "beforeend",
        createMessageMarkup(
          message
        )
      );


      input.value = "";


      updateStatusUI(
        result.conversation.status
      );


      if (
        typeof onConversationChange ===
        "function"
      ) {
        onConversationChange(
          conversation
        );
      }


      requestAnimationFrame(
        () => {

          messagesContainer.scrollTo({
            top:
              messagesContainer.scrollHeight,

            behavior:
              "smooth",
          });

        }
      );


      input.focus();

    }
  );


  return chat;
}