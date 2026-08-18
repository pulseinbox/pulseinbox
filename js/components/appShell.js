import { Inbox } from "./inbox.js";
import { Chat } from "./chat.js";

export function AppShell() {
  const shell = document.createElement("main");

  shell.className = "app-shell";

  shell.innerHTML = `
    <section class="app-inbox"></section>

    <section class="app-chat"></section>
  `;

  const inboxContainer =
    shell.querySelector(".app-inbox");

  const chatContainer =
    shell.querySelector(".app-chat");

  function renderChat(conversation) {
    chatContainer.innerHTML = "";

    chatContainer.appendChild(
      Chat(conversation)
    );
  }

  const inbox = Inbox({
    onSelectConversation: (conversation) => {
      renderChat(conversation);
    },
  });

  inboxContainer.appendChild(inbox);

  return shell;
}