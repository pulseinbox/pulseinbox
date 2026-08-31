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

  let chat =
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


    /*
     * If the same conversation is already open,
     * update its metadata instead of destroying
     * the Chat and its real-time message listener.
     */

    if (
      chat &&
      selectedConversation?.id ===
        conversation.id &&
      typeof chat.refreshConversation ===
        "function"
    ) {

      selectedConversation =
        conversation;

      chat.refreshConversation(
        conversation
      );

      return;
    }


    /*
     * A different conversation is being opened.
     * Close the previous message listener first.
     */

    if (
      chat &&
      typeof chat.destroy ===
        "function"
    ) {

      chat.destroy();

    }


    selectedConversation =
      conversation;


    chatContainer.innerHTML =
      "";


    chat =
      Chat(
        conversation,
        {
          onConversationChange:
            handleConversationChange,
        }
      );


    chatContainer.appendChild(
      chat
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
     * The conversation returned by Firestore
     * becomes the selected conversation.
     */

    if (
      selectedConversation?.id ===
      conversation.id
    ) {

      selectedConversation =
        conversation;

    }


    /*
     * IMPORTANT:
     *
     * Do NOT call inbox.handleConversationChange()
     * from here.
     *
     * That method calls AppShell's
     * onConversationChange callback, which would
     * create this cycle:
     *
     * AppShell
     *   -> Inbox.handleConversationChange()
     *   -> AppShell.handleConversationChange()
     *   -> Inbox.handleConversationChange()
     *   -> ...
     *
     * Instead, AppShell updates its own selected
     * conversation and simply asks the Inbox to
     * refresh its data.
     */

    if (
      inbox &&
      typeof inbox.refresh ===
        "function"
    ) {

      inbox.refresh();

    }


    /*
     * Update only the Chat metadata/UI.
     * The message listener remains alive.
     */

    if (
      chat &&
      selectedConversation?.id ===
        conversation.id &&
      typeof chat.refreshConversation ===
        "function"
    ) {

      chat.refreshConversation(
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

      onConversationChange:
        handleConversationChange,
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