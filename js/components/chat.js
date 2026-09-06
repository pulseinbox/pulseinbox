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
  subscribeToMessages,
  getEmployeesForCompany,
  addMessage,
} from "../services/conversationService.js";

import {
  sendFacebookMessage,
} from "../services/metaService.js";


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


function getEmployee(
  employeeId,
  employees = [],
  currentUser = null
) {

  if (!employeeId) {
    return null;
  }


  /*
   * Firebase UID is the canonical assignment
   * identifier. Resolve the authenticated user
   * first, then the Firestore employee list.
   */

  if (
    currentUser &&
    (
      currentUser.uid === employeeId ||
      currentUser.id === employeeId
    )
  ) {

    return currentUser;

  }


  return (
    employees.find(
      (employee) =>
        employee.id === employeeId ||
        employee.uid === employeeId
    ) ?? null
  );

}


/* =========================================================
   MESSAGE MARKUP
========================================================= */

function getSafeAttachmentUrl(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  try {
    const url = new URL(value, window.location.origin);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null;
    }

    return url.href;
  } catch {
    return null;
  }
}


function getAttachmentType(attachment) {
  return String(
    attachment?.type ||
    attachment?.payload?.type ||
    "file"
  ).toLowerCase();
}


function getAttachmentUrl(attachment) {
  return getSafeAttachmentUrl(
    attachment?.payload?.url ||
    attachment?.url ||
    attachment?.payload?.src ||
    attachment?.src ||
    null
  );
}


function getAttachmentTitle(attachment, type) {
  const title =
    attachment?.title ||
    attachment?.payload?.title ||
    attachment?.name ||
    attachment?.filename;

  if (title) {
    return String(title);
  }

  switch (type) {
    case "image":
      return "Imagen";

    case "video":
      return "Video";

    case "audio":
      return "Audio";

    case "file":
      return "Archivo";

    default:
      return "Archivo adjunto";
  }
}


function getAttachmentIcon(type) {
  switch (type) {
    case "image":
      return "fa-regular fa-image";

    case "video":
      return "fa-solid fa-play";

    case "audio":
      return "fa-solid fa-volume-high";

    case "file":
      return "fa-regular fa-file";

    default:
      return "fa-solid fa-paperclip";
  }
}


function isAttachmentPlaceholder(text) {
  const normalizedText = String(text || "").trim();

  return [
    "📷 Imagen",
    "🎤 Audio",
    "🎥 Video",
    "📎 Archivo",
    "🔗 Enlace",
    "📎 Archivo adjunto",
  ].includes(normalizedText);
}


function createAttachmentMarkup(attachment) {
  const type = getAttachmentType(attachment);
  const url = getAttachmentUrl(attachment);
  const title = getAttachmentTitle(attachment, type);
  const escapedTitle = escapeHtml(title);

  if (!url) {
    return `
      <div class="chat-attachment chat-attachment--unavailable">
        <span class="chat-attachment-icon">
          <i class="${escapeHtml(getAttachmentIcon(type))}"></i>
        </span>

        <span class="chat-attachment-info">
          <span class="chat-attachment-title">
            ${escapedTitle}
          </span>
          <span class="chat-attachment-status">
            Archivo no disponible
          </span>
        </span>
      </div>
    `;
  }

  if (type === "image") {
    return `
      <a
        class="chat-attachment chat-attachment--image"
        href="${escapeHtml(url)}"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Abrir ${escapedTitle}"
      >
        <img
          src="${escapeHtml(url)}"
          alt="${escapedTitle}"
          loading="lazy"
          referrerpolicy="no-referrer"
        />
      </a>
    `;
  }

  if (type === "video") {
    return `
      <div class="chat-attachment chat-attachment--video">
        <video
          controls
          preload="metadata"
          playsinline
          src="${escapeHtml(url)}"
        >
          Tu navegador no puede reproducir este video.
        </video>
      </div>
    `;
  }

  if (type === "audio") {
    return `
      <div class="chat-attachment chat-attachment--audio">
        <div class="chat-attachment-header">
          <span class="chat-attachment-icon">
            <i class="fa-solid fa-volume-high"></i>
          </span>

          <span class="chat-attachment-title">
            ${escapedTitle}
          </span>
        </div>

        <audio
          controls
          preload="metadata"
          src="${escapeHtml(url)}"
        >
          Tu navegador no puede reproducir este audio.
        </audio>
      </div>
    `;
  }

  return `
    <a
      class="chat-attachment chat-attachment--file"
      href="${escapeHtml(url)}"
      target="_blank"
      rel="noopener noreferrer"
    >
      <span class="chat-attachment-icon">
        <i class="${escapeHtml(getAttachmentIcon(type))}"></i>
      </span>

      <span class="chat-attachment-info">
        <span class="chat-attachment-title">
          ${escapedTitle}
        </span>
        <span class="chat-attachment-action">
          Abrir archivo
        </span>
      </span>

      <i class="fa-solid fa-arrow-up-right-from-square chat-attachment-open"></i>
    </a>
  `;
}


function createMessageMarkup(message) {
  const isOutgoing =
    message.sender === "employee";

  const text =
    typeof message.text === "string"
      ? message.text.trim()
      : "";

  const attachments = Array.isArray(message.attachments)
    ? message.attachments
    : [];

  const shouldShowText =
    Boolean(text) &&
    !(attachments.length > 0 && isAttachmentPlaceholder(text));

  const textMarkup = shouldShowText
    ? `
        <div class="chat-message-text">
          ${escapeHtml(text).replaceAll("\n", "<br>")}
        </div>
      `
    : "";

  const attachmentsMarkup = attachments.length > 0
    ? `
        <div class="chat-attachments">
          ${attachments
            .map(createAttachmentMarkup)
            .join("")}
        </div>
      `
    : "";

  return `
    <div
      class="chat-message ${
        isOutgoing
          ? "is-outgoing"
          : "is-incoming"
      }"
    >

      <div class="chat-bubble ${
        attachments.length > 0
          ? "has-attachments"
          : ""
      }">
        ${textMarkup}
        ${attachmentsMarkup}
      </div>

      <time class="chat-message-time">
        ${escapeHtml(message.timestamp || "")}
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
    employee.id === currentEmployeeId ||
    employee.uid === currentEmployeeId;

  return `
    <button
      type="button"
      data-employee="${employee.uid ?? employee.id}"
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
  employees,
  companyId
) {

  if (
    !companyId ||
    !Array.isArray(employees)
  ) {
    return [];
  }

  return employees.filter(
    (employee) =>
      employee.active !== false &&
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
    typeof conversation.channel === "string"
      ? conversation.channel
      : conversation.channel?.type ??
        conversation.channelType ??
        "social";


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

  let availableEmployees = [];

  let assignedEmployee =
    getEmployee(
      conversation.assignedTo,
      availableEmployees,
      currentUser
    );

  const isAssignedToCurrentUser =
    Boolean(
      conversation.assignedTo &&
      (
        currentUser?.id ===
          conversation.assignedTo ||
        currentUser?.uid ===
          conversation.assignedTo
      )
    );

  const isUnassigned =
    !conversation.assignedTo;


  let availableAssignees =
    getAvailableAssignees(
      availableEmployees,
      companyId
    );

  console.log(
    "CHAT: permisos de conversación",
    {
      conversationId: conversation.id,
      companyId,
      userId: currentUser?.id,
      userUid: currentUser?.uid,
      role: currentUser?.role,
      companies: currentUser?.companies,
      assignedTo: conversation.assignedTo,
      canTake: canTakeConversation,
      canAssign: canAssignConversation,
      canChangeStatus,
      canReply,
      companyAccess:
        canAccessCompany(
          currentUser,
          companyId
        ),
      availableAssignees:
        availableAssignees.map(
          (employee) => ({
            id: employee.id,
            uid: employee.uid,
            name: employee.name,
          })
        ),
    }
  );


  /* =======================================================
     MESSAGES
  ======================================================= */

  let conversationMessages = [];

  let messagesLoaded = false;

  let unsubscribeMessages = null;



  async function loadMessages() {

    try {

      messagesLoaded = false;


      if (messageList) {

        messageList.innerHTML = `
          <div class="placeholder">
            Cargando mensajes...
          </div>
        `;

      }


      console.log(
        "CHAT: iniciando escucha en tiempo real:",
        conversation.id
      );


      /*
       * Cancelamos cualquier listener anterior.
       *
       * Esto es importante cuando el Chat
       * cambia de conversación.
       */

      if (
        typeof unsubscribeMessages ===
        "function"
      ) {

        unsubscribeMessages();

        unsubscribeMessages =
          null;

      }


      /*
       * Firestore real-time listener.
       */

      unsubscribeMessages =
        await subscribeToMessages(
          conversation.id,
          currentUser,

          (messages) => {

            conversationMessages =
              messages;


            messagesLoaded =
              true;


            console.log(
              "CHAT: mensajes recibidos en tiempo real:",
              conversationMessages
            );


            if (!messageList) {
              return;
            }


            if (
              conversationMessages.length ===
              0
            ) {

              messageList.innerHTML = `
                <div class="placeholder">
                  No hay mensajes en esta conversación
                </div>
              `;

              return;

            }


            messageList.innerHTML =
              conversationMessages
                .map(
                  createMessageMarkup
                )
                .join("");


            /*
             * Bajamos al último mensaje.
             */

            requestAnimationFrame(
              () => {

                if (
                  messagesContainer
                ) {

                  messagesContainer.scrollTop =
                    messagesContainer.scrollHeight;

                }

              }
            );

          },

          (error) => {

            console.error(
              "CHAT: error en tiempo real:",
              error
            );


            messagesLoaded =
              false;


            if (messageList) {

              messageList.innerHTML = `
                <div class="placeholder">
                  No se pudieron cargar los mensajes
                </div>
              `;

            }

          }
        );


    } catch (error) {

      console.error(
        "CHAT: error iniciando mensajes en tiempo real:",
        error
      );


      messagesLoaded =
        false;


      if (messageList) {

        messageList.innerHTML = `
          <div class="placeholder">
            No se pudieron cargar los mensajes
          </div>
        `;

      }

    }

  }


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


          <div class="chat-assignee-options">
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

        <div class="placeholder">
          Cargando mensajes...
        </div>

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
     CONVERSATION UI REFRESH
  ======================================================= */

  function updateConversationUI(
    updatedConversation
  ) {

    if (!updatedConversation) {
      return;
    }

    /*
     * Keep the same conversation object as the
     * single source used by this Chat instance.
     */

    Object.assign(
      conversation,
      updatedConversation
    );


    assignedEmployee =
      getEmployee(
        conversation.assignedTo,
        availableEmployees,
        currentUser
      );

    /*
     * Assignee
     */

    const currentAssignedEmployee =
      getEmployee(
        conversation.assignedTo,
        availableEmployees,
        currentUser
      );

    if (assigneeButton) {

      const avatar =
        assigneeButton.querySelector(
          ".chat-assignee-avatar"
        );

      const label =
        assigneeButton.querySelector(
          ".chat-assignee-label"
        );

      if (avatar) {

        avatar.innerHTML =
          currentAssignedEmployee
            ? escapeHtml(
                currentAssignedEmployee.name
                  .charAt(0)
                  .toUpperCase()
              )
            : `<i class="fa-solid fa-user"></i>`;

      }

      if (label) {

        label.textContent =
          currentAssignedEmployee
            ? currentAssignedEmployee.name
            : conversation.assignedTo
              ? "Asignado"
              : "Sin asignar";

      }

    }

    /*
     * Take button / readonly state.
     *
     * Manager/Admin use the assignment menu,
     * while an agent sees the "Tomar" action only
     * when the conversation is unassigned.
     */

    if (
      !canAssignConversation &&
      assigneeButton
    ) {

      const buttonLabel =
        assigneeButton.querySelector(
          ".chat-assignee-label"
        );

      const buttonAvatar =
        assigneeButton.querySelector(
          ".chat-assignee-avatar"
        );

      const assigned =
        Boolean(
          conversation.assignedTo
        );

      if (assigned) {

        assigneeButton.classList.remove(
          "chat-take-button"
        );

        assigneeButton.classList.add(
          "is-readonly"
        );

        if (buttonLabel) {
          buttonLabel.textContent =
            currentAssignedEmployee
              ? currentAssignedEmployee.name
              : conversation.assignedTo
                ? "Asignado"
                : "Sin asignar";
        }

        if (buttonAvatar) {
          buttonAvatar.innerHTML =
            currentAssignedEmployee
              ? escapeHtml(
                  currentAssignedEmployee.name
                    .charAt(0)
                    .toUpperCase()
                )
              : `<i class="fa-solid fa-user"></i>`;
        }

      } else {

        assigneeButton.classList.add(
          "chat-take-button"
        );

        assigneeButton.classList.remove(
          "is-readonly"
        );

        if (buttonLabel) {
          buttonLabel.textContent =
            "Tomar conversación";
        }

        if (buttonAvatar) {
          buttonAvatar.innerHTML =
            `<i class="fa-solid fa-hand-pointer"></i>`;
        }

      }

    }

  }


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

  /*
   * IMPORTANT:
   *
   * Admin / Manager:
   *   - They have the assignment dropdown.
   *
   * Agent:
   *   - They only have "Tomar conversación" when
   *     the conversation is unassigned.
   *
   * Never access assigneeMenu unless it actually exists.
   */

  if (canAssignConversation) {

    /*
     * ADMIN / MANAGER — OPEN/CLOSE MENU
     */

    if (
      assigneeButton &&
      assigneeMenu
    ) {

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

    }


    /*
     * UNASSIGN
     */

    if (assigneeMenu) {

      const unassignedOption =
        assigneeMenu.querySelector(
          '[data-employee="unassigned"]'
        );


      if (unassignedOption) {

        unassignedOption.addEventListener(
          "click",
          async () => {

            try {

              const result =
                await unassignConversation(
                  conversation,
                  currentUser
                );


              if (!result?.success) {

                console.error(
                  "CHAT: no se pudo liberar la conversación:",
                  result?.reason
                );

                return;

              }


              updateConversationUI(
                result.conversation
              );


              assigneeMenu.classList.remove(
                "is-visible"
              );


              if (assigneeButton) {

                assigneeButton.setAttribute(
                  "aria-expanded",
                  "false"
                );

              }


              if (
                typeof onConversationChange ===
                "function"
              ) {

                onConversationChange(
                  result.conversation
                );

              }

            } catch (error) {

              console.error(
                "CHAT: error liberando conversación:",
                error
              );

            }

          }
        );

      }

    }

  }


  /*
   * AGENT — TAKE CONVERSATION
   *
   * This is intentionally a separate branch.
   * It must NOT depend on assigneeMenu.
   */

  else if (
    canTakeConversation &&
    isUnassigned &&
    assigneeButton
  ) {

    assigneeButton.addEventListener(
      "click",
      async () => {

        try {

          const result =
            await takeConversation(
              conversation,
              currentUser
            );


          if (!result?.success) {

            console.error(
              "CHAT: no se pudo tomar la conversación:",
              result?.reason
            );

            return;

          }


          console.log(
            "CHAT: conversación tomada correctamente:",
            {
              conversationId:
                conversation.id,

              assignedTo:
                result.conversation?.assignedTo,

              currentUserId:
                currentUser?.id,

              currentUserUid:
                currentUser?.uid,
            }
          );


          const assignedConversation = {

            ...conversation,

            ...result.conversation,

            assignedTo:
              result.conversation?.assignedTo ??
              currentUser?.uid ??
              currentUser?.id,

            status:
              result.conversation?.status ??
              "active",

          };


          updateConversationUI(
            assignedConversation
          );


          if (
            typeof onConversationChange ===
            "function"
          ) {

            onConversationChange(
              assignedConversation
            );

          }

        } catch (error) {

          console.error(
            "CHAT: error tomando la conversación:",
            error
          );

        }

      }
    );

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
          async () => {

            const newStatus =
              option.dataset.status;


            try {

              const result =
                await changeConversationStatus(
                  conversation,
                  newStatus,
                  currentUser
                );


              if (!result?.success) {

                console.error(
                  "CHAT: no se pudo cambiar el estado:",
                  result?.reason
                );

                return;
              }


              Object.assign(
                conversation,
                result.conversation
              );


              updateStatusUI(
                result.conversation.status
              );


            } catch (error) {

              console.error(
                "CHAT: error cambiando estado:",
                error
              );

              return;

            }


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
     LOAD FIRESTORE EMPLOYEES
  ======================================================= */

  async function loadAvailableEmployees() {

    if (
      !canAssignConversation
    ) {
      return;
    }


    try {

      availableEmployees =
        await getEmployeesForCompany(
          currentUser,
          companyId
        );


      availableAssignees =
        getAvailableAssignees(
          availableEmployees,
          companyId
        );


      assignedEmployee =
        getEmployee(
          conversation.assignedTo,
          availableEmployees,
          currentUser
        );


      console.log(
        "CHAT: empleados reales de Firestore:",
        availableAssignees.map(
          (employee) => ({
            id: employee.id,
            uid: employee.uid,
            name: employee.name,
          })
        )
      );


      /*
       * Update the current assignee display.
       */

      updateConversationUI(
        conversation
      );


      /*
       * Populate the Admin/Manager menu with
       * real Firestore employees.
       */

      renderAssigneeOptions();

    } catch (error) {

      console.error(
        "CHAT: error cargando empleados de Firestore:",
        error
      );

    }

  }


  /* =======================================================
     RENDER ASSIGNEE OPTIONS
  ======================================================= */

  function renderAssigneeOptions() {

    if (!canAssignConversation) {
      return;
    }


    if (!assigneeMenu) {
      return;
    }


    const optionsContainer =
      assigneeMenu.querySelector(
        ".chat-assignee-options"
      );


    if (!optionsContainer) {
      return;
    }


    optionsContainer.innerHTML =
      availableAssignees
        .map(
          (employee) =>
            createEmployeeOptionMarkup(
              employee,
              conversation.assignedTo
            )
        )
        .join("");


    const employeeOptions =
      optionsContainer.querySelectorAll(
        "[data-employee]"
      );


    employeeOptions.forEach(
      (option) => {

        option.addEventListener(
          "click",
          async () => {

            const employeeId =
              option.dataset.employee;


            const employee =
              availableAssignees.find(
                (item) =>
                  item.id === employeeId ||
                  item.uid === employeeId
              );


            if (!employee) {

              console.error(
                "CHAT: empleado de Firestore no encontrado:",
                employeeId
              );

              return;

            }


            try {

              const result =
                await assignConversation(
                  conversation,
                  employee,
                  currentUser
                );


              if (!result?.success) {

                console.error(
                  "CHAT: no se pudo asignar la conversación:",
                  result?.reason
                );

                return;

              }


              updateConversationUI(
                result.conversation
              );


              assigneeMenu.classList.remove(
                "is-visible"
              );


              if (assigneeButton) {

                assigneeButton.setAttribute(
                  "aria-expanded",
                  "false"
                );

              }


              if (
                typeof onConversationChange ===
                "function"
              ) {

                onConversationChange(
                  result.conversation
                );

              }

            } catch (error) {

              console.error(
                "CHAT: error asignando conversación:",
                error
              );

            }

          }
        );

      }
    );

  }


  /* =======================================================
     LOAD FIRESTORE MESSAGES
  ======================================================= */

  loadMessages();


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
    async (event) => {

      event.preventDefault();


      if (!canReply) {
        return;
      }


      const text =
        input.value.trim();


      if (!text) {
        return;
      }


      try {

        input.disabled = true;

        let result;

        if (channel === "facebook") {
          result =
            await sendFacebookMessage(
              conversation.id,
              text
            );
        } else {
          result =
            await addMessage(
              conversation,
              text,
              "employee",
              currentUser
            );
        }


        if (!result.success) {
          console.error(
            "No se pudo enviar el mensaje:",
            result.reason
          );

          return;
        }


        /*
         * No agregamos manualmente el mensaje
         * al DOM. Firestore + onSnapshot()
         * será la única fuente de verdad.
         *
         * Esto evita duplicados cuando Firestore
         * devuelve el mensaje recién creado.
         */

        input.value = "";


        updateStatusUI(
          result.conversation.status
        );


        if (
          typeof onConversationChange ===
          "function"
        ) {

          onConversationChange(
            result.conversation
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


      } catch (error) {

        console.error(
          "Error enviando mensaje:",
          error
        );

      } finally {

        input.disabled =
          !canReply;

        input.focus();

      }

    }
  );


  /*
   * Refresh only the conversation metadata/UI.
   *
   * This avoids destroying and recreating the Chat
   * (and therefore avoids creating duplicate
   * Firestore message listeners).
   */

  chat.refreshConversation =
    updateConversationUI;


  chat.refreshMessages =
    loadMessages;


  /*
   * Permite al componente padre
   * cerrar el listener cuando
   * el Chat deja de utilizarse.
   */

  chat.destroy =
    () => {

      if (
        typeof unsubscribeMessages ===
        "function"
      ) {

        unsubscribeMessages();

        unsubscribeMessages =
          null;

      }

    };


  /*
   * Load real employees only after the Chat DOM,
   * including the assignment menu, has been created.
   */
  loadAvailableEmployees();


  return chat;
}