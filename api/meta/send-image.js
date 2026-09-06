import {
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";

import {
  getAuth,
} from "firebase-admin/auth";

import {
  getFirestore,
} from "firebase-admin/firestore";


/* =========================================================
   FIREBASE ADMIN
========================================================= */

function getAdminApp() {
  const existingApps = getApps();

  if (existingApps.length > 0) {
    return existingApps[0];
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID;

  const clientEmail =
    process.env.FIREBASE_CLIENT_EMAIL;

  const privateKey =
    process.env.FIREBASE_PRIVATE_KEY?.replace(
      /\\n/g,
      "\n"
    );

  if (
    !projectId ||
    !clientEmail ||
    !privateKey
  ) {
    throw new Error(
      "Firebase Admin no está configurado."
    );
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}


const adminApp = getAdminApp();

const adminAuth = getAuth(adminApp);

const adminDb = getFirestore(adminApp);


/* =========================================================
   CONFIGURACIÓN META
========================================================= */

const FACEBOOK_PAGE_ID =
  process.env.META_FACEBOOK_PAGE_ID ||
  "1092282083961021";

const GRAPH_API_VERSION =
  process.env.META_GRAPH_API_VERSION ||
  "v26.0";

const PAGE_ACCESS_TOKEN =
  process.env.META_PAGE_ACCESS_TOKEN;


/* =========================================================
   CONFIGURACIÓN IMAGEKIT
========================================================= */

const IMAGEKIT_URL_ENDPOINT =
  process.env.IMAGEKIT_URL_ENDPOINT;


/* =========================================================
   HELPERS
========================================================= */

function isValidImageKitUrl(value) {
  if (!value || typeof value !== "string") {
    return false;
  }

  if (!IMAGEKIT_URL_ENDPOINT) {
    return false;
  }

  try {
    const imageUrl = new URL(value);
    const endpointUrl = new URL(
      IMAGEKIT_URL_ENDPOINT
    );

    if (
      imageUrl.protocol !== "https:" ||
      endpointUrl.protocol !== "https:"
    ) {
      return false;
    }

    return (
      imageUrl.origin === endpointUrl.origin
    );
  } catch {
    return false;
  }
}


/* =========================================================
   HANDLER
========================================================= */

export default async function handler(
  req,
  res
) {
  console.log(
    "META SEND IMAGE:",
    req.method
  );


  /* =======================================================
     METHOD
  ======================================================= */

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({
        success: false,
        reason: "method_not_allowed",
      });
  }


  try {
    /* =====================================================
       VALIDAR CONFIGURACIÓN
    ===================================================== */

    if (!PAGE_ACCESS_TOKEN) {
      console.error(
        "META SEND IMAGE: META_PAGE_ACCESS_TOKEN no está configurado"
      );

      return res
        .status(500)
        .json({
          success: false,
          reason:
            "meta_access_token_not_configured",
        });
    }

    if (!IMAGEKIT_URL_ENDPOINT) {
      console.error(
        "META SEND IMAGE: IMAGEKIT_URL_ENDPOINT no está configurado"
      );

      return res
        .status(500)
        .json({
          success: false,
          reason:
            "imagekit_endpoint_not_configured",
        });
    }


    /* =====================================================
       AUTENTICACIÓN FIREBASE
    ===================================================== */

    const authorization =
      req.headers.authorization || "";

    if (
      !authorization.startsWith(
        "Bearer "
      )
    ) {
      return res
        .status(401)
        .json({
          success: false,
          reason:
            "missing_authentication",
        });
    }

    const idToken =
      authorization.substring(
        "Bearer ".length
      );

    let decodedToken;

    try {
      decodedToken =
        await adminAuth.verifyIdToken(
          idToken
        );
    } catch (error) {
      console.error(
        "META SEND IMAGE: token Firebase inválido:",
        error.message
      );

      return res
        .status(401)
        .json({
          success: false,
          reason:
            "invalid_authentication",
        });
    }

    const employeeUid =
      decodedToken.uid;


    /* =====================================================
       EMPLOYEE
    ===================================================== */

    const employeeRef =
      adminDb
        .collection("employees")
        .doc(employeeUid);

    const employeeSnapshot =
      await employeeRef.get();

    if (!employeeSnapshot.exists) {
      return res
        .status(403)
        .json({
          success: false,
          reason:
            "employee_not_found",
        });
    }

    const employee =
      employeeSnapshot.data() || {};

    if (employee.active === false) {
      return res
        .status(403)
        .json({
          success: false,
          reason:
            "employee_inactive",
        });
    }


    /* =====================================================
       PERMISO DE RESPUESTA
    ===================================================== */

    const allowedRoles = [
      "admin",
      "manager",
      "agent",
    ];

    if (
      !allowedRoles.includes(
        employee.role
      )
    ) {
      return res
        .status(403)
        .json({
          success: false,
          reason:
            "reply_not_allowed",
        });
    }


    /* =====================================================
       REQUEST BODY
    ===================================================== */

    const {
      conversationId,
      imageUrl,
      fileName,
    } = req.body || {};

    if (
      !conversationId ||
      !imageUrl ||
      typeof imageUrl !== "string"
    ) {
      return res
        .status(400)
        .json({
          success: false,
          reason:
            "invalid_image_data",
        });
    }

    if (!isValidImageKitUrl(imageUrl)) {
      return res
        .status(400)
        .json({
          success: false,
          reason:
            "invalid_imagekit_url",
        });
    }


    /* =====================================================
       CONVERSATION
    ===================================================== */

    const conversationRef =
      adminDb
        .collection("conversations")
        .doc(conversationId);

    const conversationSnapshot =
      await conversationRef.get();

    if (!conversationSnapshot.exists) {
      return res
        .status(404)
        .json({
          success: false,
          reason:
            "conversation_not_found",
        });
    }

    const conversation =
      conversationSnapshot.data() || {};


    /* =====================================================
       VALIDAR EMPRESA
    ===================================================== */

    const employeeCompanies =
      Array.isArray(employee.companies)
        ? employee.companies
        : [];

    if (
      conversation.companyId &&
      !employeeCompanies.includes(
        conversation.companyId
      )
    ) {
      return res
        .status(403)
        .json({
          success: false,
          reason:
            "company_access_denied",
        });
    }


    /* =====================================================
       VALIDAR CHANNEL
    ===================================================== */

    if (
      conversation.channel !==
      "facebook"
    ) {
      return res
        .status(400)
        .json({
          success: false,
          reason:
            "unsupported_channel",
        });
    }


    /* =====================================================
       CUSTOMER
    ===================================================== */

    if (!conversation.customerId) {
      return res
        .status(400)
        .json({
          success: false,
          reason:
            "customer_not_found",
        });
    }

    const customerRef =
      adminDb
        .collection("customers")
        .doc(
          conversation.customerId
        );

    const customerSnapshot =
      await customerRef.get();

    if (!customerSnapshot.exists) {
      return res
        .status(404)
        .json({
          success: false,
          reason:
            "customer_not_found",
        });
    }

    const customer =
      customerSnapshot.data() || {};

    const recipientId =
      customer.externalId;

    if (!recipientId) {
      return res
        .status(400)
        .json({
          success: false,
          reason:
            "facebook_recipient_not_found",
        });
    }


    /* =====================================================
       META SEND API
    ===================================================== */

    const metaUrl =
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${FACEBOOK_PAGE_ID}/messages`;

    console.log(
      "META SEND IMAGE: enviando imagen",
      {
        conversationId,
        employeeUid,
        recipientId,
        fileName: fileName || null,
      }
    );

    const metaResponse =
      await fetch(
        metaUrl,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${PAGE_ACCESS_TOKEN}`,
          },

          body: JSON.stringify({
            recipient: {
              id: recipientId,
            },

            messaging_type:
              "RESPONSE",

            message: {
              attachment: {
                type: "image",

                payload: {
                  url: imageUrl,

                  is_reusable:
                    true,
                },
              },
            },
          }),
        }
      );

    const metaData =
      await metaResponse.json();


    /* =====================================================
       META ERROR
    ===================================================== */

    if (!metaResponse.ok) {
      console.error(
        "META SEND IMAGE ERROR:",
        {
          status:
            metaResponse.status,

          response:
            metaData,
        }
      );

      return res
        .status(502)
        .json({
          success: false,
          reason:
            "meta_send_failed",
          metaStatus:
            metaResponse.status,
          metaError:
            metaData?.error || null,
        });
    }


    /* =====================================================
       MESSAGE ID
    ===================================================== */

    const externalMessageId =
      metaData?.message_id ||
      null;


    /* =====================================================
       GUARDAR MESSAGE
    ===================================================== */

    const messageRef =
      conversationRef
        .collection("messages")
        .doc();

    await messageRef.set({
      conversationId,

      sender:
        "employee",

      senderId:
        employeeUid,

      text:
        "📷 Imagen",

      attachments: [
        {
          type: "image",

          payload: {
            url: imageUrl,
          },

          title:
            fileName ||
            "Imagen",
        },
      ],

      channel:
        "facebook",

      externalMessageId,

      createdAt:
        new Date(),

      deliveryStatus:
        "sent",
    });


    /* =====================================================
       ACTUALIZAR CONVERSATION
    ===================================================== */

    await conversationRef.update({
      lastMessage: {
        text:
          "📷 Imagen",

        sender:
          "employee",

        senderId:
          employeeUid,
      },

      status:
        "active",

      unreadCount:
        0,

      lastActivityAt:
        new Date(),

      closedAt:
        null,

      purgeAt:
        null,

      updatedAt:
        new Date(),
    });


    console.log(
      "META SEND IMAGE: imagen enviada y guardada",
      {
        conversationId,

        messageId:
          messageRef.id,

        externalMessageId,
      }
    );


    /* =====================================================
       RESPONSE
    ===================================================== */

    return res
      .status(200)
      .json({
        success: true,

        message: {
          id:
            messageRef.id,

          conversationId,

          sender:
            "employee",

          senderId:
            employeeUid,

          text:
            "📷 Imagen",

          attachments: [
            {
              type: "image",

              payload: {
                url: imageUrl,
              },

              title:
                fileName ||
                "Imagen",
            },
          ],

          externalMessageId,

          deliveryStatus:
            "sent",

          timestamp:
            new Date().toISOString(),
        },

        meta: {
          recipientId:
            metaData?.recipient_id ||
            recipientId,

          messageId:
            externalMessageId,
        },
      });

  } catch (error) {
    console.error(
      "META SEND IMAGE UNEXPECTED ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        success: false,
        reason:
          "internal_server_error",
        message:
          error.message,
      });
  }
}
