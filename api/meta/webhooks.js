import { createHash } from "node:crypto";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

/*
 * =========================================================
 * FIREBASE ADMIN
 * =========================================================
 *
 * Inicializamos Firebase Admin directamente dentro de esta
 * Function para evitar problemas de inclusión de archivos
 * compartidos en el bundle de Vercel.
 */

function getAdminDb() {
  const existingApps = getApps();

  const firebaseApp =
    existingApps.length > 0
      ? existingApps[0]
      : initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey:
              process.env.FIREBASE_PRIVATE_KEY?.replace(
                /\\n/g,
                "\n"
              ),
          }),
        });

  return getFirestore(firebaseApp);
}

const adminDb = getAdminDb();

/*
 * =========================================================
 * CONFIGURACIÓN
 * =========================================================
 *
 * Los valores actuales se mantienen como fallback para
 * que el prototipo siga funcionando aunque todavía no
 * hayamos creado estas variables en Vercel.
 */

const FACEBOOK_PAGE_ID =
  process.env.META_FACEBOOK_PAGE_ID ||
  "1092282083961021";

const COMPANY_ID =
  process.env.META_FACEBOOK_COMPANY_ID ||
  "black-node";

/*
 * =========================================================
 * HANDLER PRINCIPAL
 * =========================================================
 */

export default async function handler(req, res) {
  console.log("META WEBHOOK:", req.method);

  /*
   * =======================================================
   * GET — VERIFICACIÓN DEL WEBHOOK
   * =======================================================
   */

  if (req.method === "GET") {
    const mode = req.query?.["hub.mode"];
    const token = req.query?.["hub.verify_token"];
    const challenge = req.query?.["hub.challenge"];

    const verifyToken =
      process.env.META_VERIFY_TOKEN;

    console.log(
      "META WEBHOOK DEBUG:",
      {
        mode,
        tokenReceived: Boolean(token),
        challengeReceived: Boolean(challenge),
        envConfigured: Boolean(verifyToken),
        tokenLength: token?.length ?? 0,
        envLength: verifyToken?.length ?? 0,
        tokensMatch: Boolean(
          token &&
            verifyToken &&
            token === verifyToken
        ),
      }
    );

    if (!verifyToken) {
      console.error(
        "META WEBHOOK: META_VERIFY_TOKEN no está configurado"
      );

      return res
        .status(500)
        .send(
          "META_VERIFY_TOKEN_NOT_CONFIGURED"
        );
    }

    if (
      mode === "subscribe" &&
      token === verifyToken
    ) {
      console.log(
        "META WEBHOOK: verificación correcta"
      );

      return res
        .status(200)
        .send(challenge);
    }

    console.warn(
      "META WEBHOOK: token incorrecto"
    );

    return res
      .status(403)
      .send("Forbidden");
  }

  /*
   * =======================================================
   * POST — EVENTOS DE META
   * =======================================================
   */

  if (req.method === "POST") {
    try {
      console.log(
        "META WEBHOOK: evento recibido"
      );

      const body = req.body;

      console.log(
        "META WEBHOOK PAYLOAD:",
        JSON.stringify(body, null, 2)
      );

      /*
       * =====================================================
       * VALIDAR PAYLOAD
       * =====================================================
       */

      if (
        !body ||
        body.object !== "page" ||
        !Array.isArray(body.entry)
      ) {
        console.warn(
          "META WEBHOOK: payload no reconocido"
        );

        return res
          .status(200)
          .send("EVENT_RECEIVED");
      }

      /*
       * =====================================================
       * PROCESAR ENTRIES
       * =====================================================
       */

      for (const entry of body.entry) {
        const pageId = entry.id;

        /*
         * Solo procesamos nuestra página.
         */

        if (pageId !== FACEBOOK_PAGE_ID) {
          console.log(
            "META WEBHOOK: página ignorada:",
            pageId
          );

          continue;
        }

        const messagingEvents =
          Array.isArray(entry.messaging)
            ? entry.messaging
            : [];

        for (const event of messagingEvents) {
          await processMessagingEvent(event);
        }
      }

      return res
        .status(200)
        .send("EVENT_RECEIVED");

    } catch (error) {
      console.error(
        "META WEBHOOK ERROR:",
        error
      );

      /*
       * Meta espera una respuesta 200 para evitar
       * reintentos innecesarios mientras depuramos.
       */

      return res
        .status(200)
        .send("EVENT_RECEIVED");
    }
  }

  /*
   * =======================================================
   * MÉTODO NO PERMITIDO
   * =======================================================
   */

  return res
    .status(405)
    .send("Method Not Allowed");
}


/*
 * =========================================================
 * PROCESAR EVENTO DE MESSAGING
 * =========================================================
 */

async function processMessagingEvent(event) {
  if (!event) {
    return;
  }

  const senderId =
    event.sender?.id;

  const recipientId =
    event.recipient?.id;

  /*
   * Necesitamos ambos identificadores para determinar
   * quién envió el mensaje y a qué página llegó.
   */

  if (!senderId || !recipientId) {
    console.warn(
      "META EVENT: sender o recipient faltante"
    );

    return;
  }

  /*
   * =======================================================
   * IGNORAR EVENTOS QUE NO SON MENSAJES
   * =======================================================
   */

  if (!event.message) {
    console.log(
      "META EVENT: evento sin message",
      {
        senderId,
        recipientId,
        hasDelivery: Boolean(
          event.delivery
        ),
        hasRead: Boolean(
          event.read
        ),
        hasPostback: Boolean(
          event.postback
        ),
      }
    );

    return;
  }

  const message =
    event.message;

  /*
   * =======================================================
   * IGNORAR ECHO
   * =======================================================
   *
   * Los echoes representan mensajes enviados desde nuestra
   * propia página.
   *
   * El flujo outbound lo construiremos posteriormente.
   */

  if (message.is_echo) {
    console.log(
      "META EVENT: echo ignorado"
    );

    return;
  }

  /*
   * =======================================================
   * MESSAGE ID
   * =======================================================
   */

  const externalMessageId =
    message.mid ?? null;

  if (!externalMessageId) {
    console.warn(
      "META EVENT: mensaje sin MID"
    );

    return;
  }

  /*
   * =======================================================
   * TEXTO / ADJUNTOS
   * =======================================================
   */

  const text =
    typeof message.text === "string"
      ? message.text.trim()
      : "";

  const attachments =
    Array.isArray(
      message.attachments
    )
      ? message.attachments
      : [];

  /*
   * Si existe texto usamos el texto.
   *
   * Si no existe texto pero sí hay attachment,
   * generamos una representación temporal para
   * que el mensaje no desaparezca de Pulse Inbox.
   */

  const messageText =
    text ||
    getAttachmentText(
      attachments
    );

  if (!messageText) {
    console.log(
      "META EVENT: mensaje sin texto ni attachment",
      {
        externalMessageId,
      }
    );

    return;
  }

  console.log(
    "META EVENT: mensaje de cliente",
    {
      senderId,
      recipientId,
      externalMessageId,
      text: messageText,
      attachmentsCount:
        attachments.length,
    }
  );

  /*
   * =======================================================
   * CUSTOMER
   * =======================================================
   */

  const customerId =
    `facebook_${senderId}`;

  const customerRef =
    adminDb
      .collection("customers")
      .doc(customerId);

  const customerSnapshot =
    await customerRef.get();

  if (!customerSnapshot.exists) {
    await customerRef.set({
      name: "Cliente de Facebook",
      avatar: null,
      active: true,
      externalId: senderId,
      channel: "facebook",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(
      "META EVENT: customer creado",
      customerId
    );
  } else {
    await customerRef.set(
      {
        updatedAt: new Date(),
      },
      {
        merge: true,
      }
    );
  }

  /*
   * =======================================================
   * CONVERSATION
   * =======================================================
   *
   * Un usuario de Facebook mantiene una conversación
   * determinista con nuestra página:
   *
   * facebook_{PAGE_ID}_{SENDER_ID}
   */

  const conversationId =
    `facebook_${FACEBOOK_PAGE_ID}_${senderId}`;

  const conversationRef =
    adminDb
      .collection("conversations")
      .doc(conversationId);

  /*
   * =======================================================
   * TIMESTAMP
   * =======================================================
   */

  const eventTimestamp =
    event.timestamp
      ? new Date(event.timestamp)
      : new Date();

  /*
   * =======================================================
   * DEDUPLICACIÓN
   * =======================================================
   *
   * En lugar de hacer una query para comprobar si existe
   * el MID, generamos un ID determinista para el documento.
   *
   * Si Meta reenvía exactamente el mismo evento,
   * utilizará el mismo documento.
   */

  const messageDocumentId =
    createMessageDocumentId(
      externalMessageId
    );

  const messageRef =
    conversationRef
      .collection("messages")
      .doc(messageDocumentId);

  const existingMessageSnapshot =
    await messageRef.get();

  if (existingMessageSnapshot.exists) {
    console.log(
      "META EVENT: mensaje duplicado ignorado",
      externalMessageId
    );

    return;
  }

  /*
   * =======================================================
   * CONVERSACIÓN
   * =======================================================
   */

  const conversationSnapshot =
    await conversationRef.get();

  if (!conversationSnapshot.exists) {
    /*
     * =====================================================
     * CREAR CONVERSACIÓN
     * =====================================================
     */

    await conversationRef.set({
      customerId,
      companyId: COMPANY_ID,

      channel: "facebook",

      externalConversationId:
        senderId,

      status: "unread",

      unreadCount: 1,

      lastMessage: {
        sender: "customer",
        senderId: customerId,
        text: messageText,
      },

      createdAt: eventTimestamp,
      updatedAt: eventTimestamp,
    });

    console.log(
      "META EVENT: conversación creada",
      conversationId
    );

  } else {
    /*
     * =====================================================
     * ACTUALIZAR CONVERSACIÓN EXISTENTE
     * =====================================================
     */

    const currentData =
      conversationSnapshot.data() ||
      {};

    const currentUnreadCount =
      Number(
        currentData.unreadCount ?? 0
      );

    await conversationRef.update({
      customerId,
      companyId: COMPANY_ID,

      channel: "facebook",

      externalConversationId:
        senderId,

      status: "unread",

      unreadCount:
        currentUnreadCount + 1,

      lastMessage: {
        sender: "customer",
        senderId: customerId,
        text: messageText,
      },

      updatedAt: eventTimestamp,
    });

    console.log(
      "META EVENT: conversación actualizada",
      conversationId
    );
  }

  /*
   * =======================================================
   * CREAR MESSAGE
   * =======================================================
   */

  const messageData = {
    conversationId,

    sender: "customer",

    senderId: customerId,

    text: messageText,

    externalMessageId,

    channel: "facebook",

    createdAt: eventTimestamp,
  };

  /*
   * Guardamos attachments solamente cuando existen.
   * Esto nos permitirá utilizarlos posteriormente para
   * renderizar imágenes, audio, archivos, etc.
   */

  if (attachments.length > 0) {
    messageData.attachments =
      attachments;
  }

  await messageRef.set(
    messageData
  );

  console.log(
    "META EVENT: mensaje guardado",
    {
      conversationId,
      messageId: messageRef.id,
      externalMessageId,
    }
  );
}


/*
 * =========================================================
 * GENERAR ID DETERMINISTA PARA MESSAGE
 * =========================================================
 */

function createMessageDocumentId(
  externalMessageId
) {
  return createHash("sha256")
    .update(externalMessageId)
    .digest("hex");
}


/*
 * =========================================================
 * REPRESENTACIÓN DE ATTACHMENTS
 * =========================================================
 */

function getAttachmentText(
  attachments
) {
  if (!attachments.length) {
    return "";
  }

  const type =
    attachments[0]?.type;

  switch (type) {
    case "image":
      return "📷 Imagen";

    case "audio":
      return "🎤 Audio";

    case "video":
      return "🎥 Video";

    case "file":
      return "📎 Archivo";

    case "fallback":
      return "🔗 Enlace";

    default:
      return "📎 Archivo adjunto";
  }
}