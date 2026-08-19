import { Inbox } from "./inbox.js";
import { Chat } from "./chat.js";


export function AppShell() {

  const shell =
    document.createElement("main");


  shell.className =
    "app-shell";


  shell.innerHTML = `
    <section class="app-inbox"></section>

    <section class="app-chat"></section>
  `;


  /* =======================================================
     ELEMENTS
  ======================================================= */

  const inboxContainer =
    shell.querySelector(
      ".app-inbox"
    );


  const chatContainer =
    shell.querySelector(
      ".app-chat"
    );


  /* =======================================================
     STATE
  ======================================================= */

  let selectedConversation =
    null;

  let inbox =
    null;


  /* =======================================================
     RENDER CHAT
  ======================================================= */

  function renderChat(
    conversation
  ) {

    if (!conversation) {
      return;
    }


    selectedConversation =
      conversation;


    chatContainer.innerHTML =
      "";


    chatContainer.appendChild(
      Chat(
        conversation,
        {
          onConversationChange:
            handleConversationChange,
        }
      )
    );
  }


  /* =======================================================
     CONVERSATION CHANGE
  ======================================================= */

  function handleConversationChange(
    conversation
  ) {

    if (!conversation) {
      return;
    }


    /*
     * Mantener la conversación
     * seleccionada actualizada.
     */

    if (
      selectedConversation?.id ===
      conversation.id
    ) {

      selectedConversation =
        conversation;

    }


    /*
     * Actualizar Inbox.
     *
     * Esto permite actualizar:
     *
     * - estado
     * - contador
     * - preview
     * - orden visual
     */

    if (
      inbox &&
      typeof inbox.refresh ===
        "function"
    ) {

      inbox.refresh();

    }


    /*
     * Volver a renderizar el Chat.
     *
     * Esto es importante para que
     * cualquier cambio realizado
     * dentro de Chat se refleje
     * inmediatamente.
     *
     * Ejemplos:
     *
     * - asignación
     * - tomar conversación
     * - cambio de estado
     * - nuevo mensaje
     */

    if (
      selectedConversation?.id ===
      conversation.id
    ) {

      renderChat(
        selectedConversation
      );

    }

  }


  /* =======================================================
     CREATE INBOX
  ======================================================= */

  inbox =
    Inbox({
      onSelectConversation:
        renderChat,
    });


  /* =======================================================
     MOUNT INBOX
  ======================================================= */

  inboxContainer.appendChild(
    inbox
  );


  /* =======================================================
     RETURN
  ======================================================= */

  return shell;
}