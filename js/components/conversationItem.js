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

        <p class="conversation-preview">
          ${lastMessage}
        </p>

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