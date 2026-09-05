import { adminDb } from "../../lib/firebaseAdmin.js";

const FACEBOOK_PAGE_ID = "1092282083961021";
const COMPANY_ID = "black-node";

export default async function handler(req, res) {
  console.log("META WEBHOOK:", req.method);

  /*
   * =========================================================
   * GET — VERIFICACIÓN DEL WEBHOOK
   * =========================================================
   */

  if (req.method === "GET") {
    const mode = req.query?.["hub.mode"];
    const token = req.query?.["hub.verify_token"];
    const challenge = req.query?.["hub.challenge"];

    const verifyToken = process.env.META_VERIFY_TOKEN;

    console.log("META WEBHOOK DEBUG:", {
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
    });

    if (!verifyToken) {
      console.error(
        "META WEBHOOK: META_VERIFY_TOKEN no está configurado"
      );

      return res
        .status(500)
        .send("META_VERIFY_TOKEN_NOT_CONFIGURED");
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
   * =========================================================
   * POST — EVENTOS DE META
   * =========================================================
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
       * Meta envía eventos de tipo:
       *
       * {
       *   object: "page",
       *   entry: [...]
       * }
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
       * =======================================================
       * PROCESAR ENTRIES
       * =======================================================
       */

      for (const entry of body.entry) {
        const pageId = entry.id;

        /*
         * Solo procesamos nuestra página de Black Node.
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
       * Meta espera una respuesta 200.
       *
       * El error queda registrado en Vercel
       * para poder depurarlo.
       */

      return res
        .status(200)
        .send("EVENT_RECEIVED");
    }
  }

  /*
   * =========================================================
   * MÉTODO NO PERMITIDO
   * =========================================================
   */

  return res
    .status(405)
    .send("Method Not Allowed");
}


/*
 * ===========================================================
 * PROCESAR EVENTO DE MESSAGING
 * ===========================================================
 */

async function processMessagingEvent(event) {
  if (!event) {
    return;
  }

  const senderId = event.sender?.id;
  const recipientId = event.recipient?.id;

  /*
   * Necesitamos ambos identificadores para poder
   * determinar quién envió el mensaje y a qué página.
   */

  if (!senderId || !recipientId) {
    console.warn(
      "META EVENT: sender o recipient faltante"
    );

    return;
  }

  /*
   * =========================================================
   * IGNORAR EVENTOS QUE NO SON MENSAJES
   * =========================================================
   */

  if (!event.message) {
    console.log(
      "META EVENT: evento sin message",
      {
        senderId,
        recipientId,
        hasDelivery: Boolean(event.delivery),
        hasRead: Boolean(event.read),
        hasPostback: Boolean(event.postback),
      }
    );

    return;
  }

  const message = event.message;

  /*
   * =========================================================
   * IGNORAR ECHO
   * =========================================================
   *
   * Los echoes representan mensajes enviados por nuestra
   * propia página. Todavía no los procesamos porque el
   * flujo outbound lo construiremos posteriormente.
   */

  if (message.is_echo) {
    console.log(
      "META EVENT: echo ignorado"
    );

    return;
  }

  /*
   * =========================================================
   * MESSAGE ID
   * =========================================================
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
   * =========================================================
   * TEXTO
   * =========================================================
   */

  const text =
    typeof message.text === "string"
      ? message.text.trim()
      : "";

  /*
   * Por ahora procesamos mensajes de texto.
   *
   * Si el cliente manda una imagen, sticker,
   * audio, etc., dejamos registrado el evento
   * pero no intentamos convertirlo en texto.
   */

  if (!text) {
    console.log(
      "META EVENT: mensaje sin texto",
      {
        externalMessageId,
        attachments: message.attachments
          ? message.attachments.length
          : 0,
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
      text,
    }
  );

  /*
   * =========================================================
   * CUSTOMER
   * =========================================================
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
   * =========================================================
   * CONVERSATION
   * =========================================================
   *
   * Usamos un ID determinista:
   *
   * facebook_{PAGE_ID}_{SENDER_ID}
   *
   * Esto evita crear una conversación nueva
   * cada vez que llegue un mensaje.
   */

  const conversationId =
    `facebook_${FACEBOOK_PAGE_ID}_${senderId}`;

  const conversationRef =
    adminDb
      .collection("conversations")
      .doc(conversationId);

  const conversationSnapshot =
    await conversationRef.get();

  /*
   * =========================================================
   * TIMESTAMP
   * =========================================================
   */

  const eventTimestamp =
    event.timestamp
      ? new Date(event.timestamp)
      : new Date();

  /*
   * =========================================================
   * DEDUPLICACIÓN
   * =========================================================
   *
   * Meta puede reenviar eventos.
   *
   * Antes de crear el mensaje comprobamos si
   * ya existe un mensaje con ese externalMessageId.
   */

  const existingMessageSnapshot =
    await conversationRef
      .collection("messages")
      .where(
        "externalMessageId",
        "==",
        externalMessageId
      )
      .limit(1)
      .get();

  if (!existingMessageSnapshot.empty) {
    console.log(
      "META EVENT: mensaje duplicado ignorado",
      externalMessageId
    );

    return;
  }

  /*
   * =========================================================
   * CREAR CONVERSACIÓN
   * =========================================================
   */

  if (!conversationSnapshot.exists) {
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
        text,
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
     * =======================================================
     * ACTUALIZAR CONVERSACIÓN EXISTENTE
     * =======================================================
     */

    const currentData =
      conversationSnapshot.data() || {};

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
        text,
      },

      updatedAt: eventTimestamp,
    });

    console.log(
      "META EVENT: conversación actualizada",
      conversationId
    );
  }

  /*
   * =========================================================
   * CREAR MESSAGE
   * =========================================================
   */

  const messageRef =
    conversationRef
      .collection("messages")
      .doc();

  await messageRef.set({
    conversationId,

    sender: "customer",

    senderId: customerId,

    text,

    externalMessageId,

    channel: "facebook",

    createdAt: eventTimestamp,
  });

  console.log(
    "META EVENT: mensaje guardado",
    {
      conversationId,
      messageId: messageRef.id,
      externalMessageId,
    }
  );
}