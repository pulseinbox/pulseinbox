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

  const customerName =
    conversation.customer.name;

  const companyName =
    conversation.company.name;

  const companyColor =
    conversation.company.color;

  const channel =
    conversation.channel.type;

  const lastMessage =
    conversation.lastMessage.text;

  const timestamp =
    conversation.lastMessage.timestamp;

  const channelIcon =
    getChannelIcon(channel);

  const statusLabel =
    getStatusLabel(conversation.status);

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

        <time class="conversation-time">
          ${timestamp}
        </time>

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

  item.addEventListener("click", () => {
    onSelect(conversation);
  });

  return item;
}