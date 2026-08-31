function getChannelIcon(channel) {
  switch (channel) {
    case "instagram":
      return "fa-brands fa-instagram";

    case "facebook":
      return "fa-brands fa-facebook-f";

    case "tiktok":
      return "fa-brands fa-tiktok";

    case "whatsapp":
      return "fa-brands fa-whatsapp";

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
      return "Sin estado";
  }
}

export function ConversationItem(
  conversation,
  onSelect
) {
  const item = document.createElement("article");

  item.className = "conversation-item";

  if (conversation.status === "unread") {
    item.classList.add("is-unread");
  }

  // ==========================================
  // CUSTOMER
  // ==========================================

  const customerName =
    conversation.customer?.name ||
    "Cliente";

  // ==========================================
  // COMPANY
  // ==========================================

  const companyName =
    conversation.company?.name ||
    conversation.companyId ||
    "Empresa";

  const companyColor =
    conversation.company?.color ||
    "#888888";

  // ==========================================
  // CHANNEL
  // ==========================================

  // Firestore:
  // channel: "instagram"
  //
  // NO:
  // conversation.channel.type

  const channel =
    typeof conversation.channel === "string"
      ? conversation.channel
      : conversation.channel?.type || "";

  const channelIcon =
    getChannelIcon(channel);

  // ==========================================
  // LAST MESSAGE
  // ==========================================

  const lastMessage =
    conversation.lastMessage?.text ||
    "Sin mensajes";

  const timestamp =
    conversation.lastMessage?.timestamp ||
    "";

  // ==========================================
  // STATUS
  // ==========================================

  const statusLabel =
    getStatusLabel(
      conversation.status
    );

  // ==========================================
  // RENDER
  // ==========================================

  item.innerHTML = `
    <div
      class="conversation-company-dot"
      style="--company-color: ${companyColor}"
    ></div>

    <div class="conversation-avatar">
      <span>
        ${customerName.charAt(0).toUpperCase()}
      </span>
    </div>

    <div class="conversation-content">

      <div class="conversation-top">

        <h3 class="conversation-name">
          ${customerName}
        </h3>

        ${
          timestamp
            ? `
              <time class="conversation-time">
                ${timestamp}
              </time>
            `
            : ""
        }

      </div>

      <div class="conversation-meta">

        <span class="conversation-company">
          ${companyName}
        </span>

        <span class="conversation-separator">
          ·
        </span>

        <span class="conversation-channel">
          <i class="${channelIcon}"></i>
        </span>

      </div>

      <div class="conversation-bottom">

        <div class="conversation-preview-wrapper">

          <p class="conversation-preview">
            ${lastMessage}
          </p>

          <span class="conversation-status">
            ${statusLabel}
          </span>

        </div>

        ${
          conversation.unreadCount > 0
            ? `
              <span class="conversation-unread">
                ${conversation.unreadCount}
              </span>
            `
            : ""
        }

      </div>

    </div>
  `;

  item.addEventListener(
    "click",
    () => {
      onSelect(conversation);
    }
  );

  return item;
}