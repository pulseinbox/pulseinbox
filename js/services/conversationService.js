import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  addDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  deleteField,
  onSnapshot,
} from "firebase/firestore";

import { db } from "../auth/auth.js";

import {
  canAccessConversation,
  canTakeConversation,
  canAssignConversation,
  canAssignToEmployee,
  can,
  PERMISSIONS,
} from "../permissions.js";


/* =========================================================
   RETENTION POLICY
========================================================= */

/*
 * Active conversations are kept while operational.
 * Closed conversations receive a purgeAt date 90 days
 * after closing.
 *
 * This prepares retention metadata only. It does NOT
 * delete conversations or messages yet.
 */

export const CLOSED_CONVERSATION_RETENTION_DAYS = 90;

const CLOSED_CONVERSATION_RETENTION_MS =
  CLOSED_CONVERSATION_RETENTION_DAYS *
  24 *
  60 *
  60 *
  1000;


/* =========================================================
   HELPERS
========================================================= */


function normalizeConversation(
  document
) {

  if (!document.exists()) {
    return null;
  }

  const data =
    document.data();

  return {
    id:
      document.id,

    ...data,

    lastMessage:
      data.lastMessage ?? null,

    unreadCount:
      data.unreadCount ?? 0,

    assignedTo:
      data.assignedTo ?? null,
  };
}


/* =========================================================
   GET EMPLOYEES FOR COMPANY
========================================================= */

export async function getEmployeesForCompany(
  user,
  companyId
) {

  if (
    !user ||
    !companyId
  ) {
    return [];
  }


  if (
    !can(
      user,
      PERMISSIONS.ASSIGN_CONVERSATIONS
    )
  ) {
    return [];
  }


  if (
    !user.companies?.includes(
      companyId
    )
  ) {
    return [];
  }


  const snapshot =
    await getDocs(
      collection(
        db,
        "employees"
      )
    );


  return snapshot.docs
    .map(
      (employeeDocument) => {

        const data =
          employeeDocument.data();

        return {
          id:
            employeeDocument.id,

          uid:
            data.uid ??
            employeeDocument.id,

          name:
            data.name ??
            data.email ??
            "Empleado",

          email:
            data.email ??
            "",

          avatar:
            data.avatar ??
            null,

          role:
            data.role ??
            null,

          companies:
            Array.isArray(
              data.companies
            )
              ? data.companies
              : [],

          active:
            data.active !== false,
        };

      }
    )
    .filter(
      (employee) =>
        employee.active &&
        employee.companies.includes(
          companyId
        )
    );

}


/* =========================================================
   GET CONVERSATIONS
========================================================= */

export async function getConversations(
  user
) {

  if (!user) {
    return [];
  }


  if (
    !can(
      user,
      PERMISSIONS.VIEW_CONVERSATIONS
    )
  ) {
    return [];
  }


  /* =======================================================
     GET CONVERSATIONS FROM FIRESTORE
  ======================================================= */

  const snapshot =
    await getDocs(
      collection(
        db,
        "conversations"
      )
    );


  const rawConversations =
    snapshot.docs
      .map(
        normalizeConversation
      )
      .filter(Boolean);


  console.log(
    "SERVICE: conversaciones de Firestore:",
    rawConversations
  );


  /* =======================================================
     ENRICH CONVERSATIONS
  ======================================================= */

  const enrichedConversations =
    await Promise.all(

      rawConversations.map(
        async (
          conversation
        ) => {

          let customer =
            null;

          let company =
            null;


          /* ===============================================
             CUSTOMER
          =============================================== */

          if (
            conversation.customerId
          ) {

            const customerRef =
              doc(
                db,
                "customers",
                conversation.customerId
              );


            const customerSnapshot =
              await getDoc(
                customerRef
              );


            if (
              customerSnapshot.exists()
            ) {

              customer = {

                id:
                  customerSnapshot.id,

                ...customerSnapshot.data(),

              };

            }

          }


          /* ===============================================
             COMPANY
          =============================================== */

          if (
            conversation.companyId
          ) {

            const companyRef =
              doc(
                db,
                "companies",
                conversation.companyId
              );


            const companySnapshot =
              await getDoc(
                companyRef
              );


            if (
              companySnapshot.exists()
            ) {

              company = {

                id:
                  companySnapshot.id,

                ...companySnapshot.data(),

              };

            }

          }


          /* ===============================================
             RETURN ENRICHED CONVERSATION
          =============================================== */

          return {

            ...conversation,

            customer:
              customer ?? {

                id:
                  conversation.customerId ??
                  null,

                name:
                  "Cliente",

                avatar:
                  null,

              },


            company:
              company ?? {

                id:
                  conversation.companyId ??
                  null,

                name:
                  "Empresa",

                color:
                  "#888888",

              },

          };

        }
      )
    );


  /* =======================================================
     APPLY PERMISSIONS AFTER ENRICHMENT
  ======================================================= */

  const accessibleConversations =
    enrichedConversations.filter(
      (conversation) => {

        const accessible =
          canAccessConversation(
            user,
            conversation
          );


        console.log(
          "SERVICE: acceso conversación",
          conversation.id,
          conversation.company?.id,
          accessible
        );


        return accessible;

      }
    );


  /* =======================================================
     SORT
  ======================================================= */

  accessibleConversations.sort(
    (
      first,
      second
    ) => {

      const firstTime =
        getTimestampValue(
          first.updatedAt
        );


      const secondTime =
        getTimestampValue(
          second.updatedAt
        );


      return (
        secondTime -
        firstTime
      );

    }
  );


  console.log(
    "SERVICE: conversaciones accesibles:",
    accessibleConversations
  );


  return accessibleConversations;
}


/* =========================================================
   GET CONVERSATION
========================================================= */



export async function getConversation(
  conversationId,
  user
) {

  if (
    !conversationId ||
    !user
  ) {
    return null;
  }


  /* =======================================================
     GET CONVERSATION FROM FIRESTORE
  ======================================================= */

  const conversationRef =
    doc(
      db,
      "conversations",
      conversationId
    );


  const snapshot =
    await getDoc(
      conversationRef
    );


  if (
    !snapshot.exists()
  ) {
    return null;
  }


  const conversation =
    normalizeConversation(
      snapshot
    );


  if (!conversation) {
    return null;
  }


  /* =======================================================
     LOAD CUSTOMER
  ======================================================= */

  let customer =
    null;


  if (
    conversation.customerId
  ) {

    const customerRef =
      doc(
        db,
        "customers",
        conversation.customerId
      );


    const customerSnapshot =
      await getDoc(
        customerRef
      );


    if (
      customerSnapshot.exists()
    ) {

      customer = {

        id:
          customerSnapshot.id,

        ...customerSnapshot.data(),

      };

    }

  }


  /* =======================================================
     LOAD COMPANY
  ======================================================= */

  let company =
    null;


  if (
    conversation.companyId
  ) {

    const companyRef =
      doc(
        db,
        "companies",
        conversation.companyId
      );


    const companySnapshot =
      await getDoc(
        companyRef
      );


    if (
      companySnapshot.exists()
    ) {

      company = {

        id:
          companySnapshot.id,

        ...companySnapshot.data(),

      };

    }

  }


  /* =======================================================
     ENRICH CONVERSATION
  ======================================================= */

  const enrichedConversation = {

    ...conversation,

    customer:
      customer ?? {

        id:
          conversation.customerId ??
          null,

        name:
          "Cliente",

        avatar:
          null,

      },


    company:
      company ?? {

        id:
          conversation.companyId ??
          null,

        name:
          "Empresa",

        color:
          "#888888",

      },

  };


  /* =======================================================
     CHECK ACCESS AFTER ENRICHMENT
  ======================================================= */

  if (
    !canAccessConversation(
      user,
      enrichedConversation
    )
  ) {

    return null;

  }


  return enrichedConversation;

}


/* =========================================================
   GET MESSAGES
========================================================= */

/* =========================================================
   GET MESSAGES
========================================================= */

export async function getMessages(
  conversationId,
  user
) {

  if (
    !conversationId ||
    !user
  ) {
    return [];
  }


  /* =======================================================
     VERIFY CONVERSATION ACCESS
  ======================================================= */

  const conversation =
    await getConversation(
      conversationId,
      user
    );


  if (!conversation) {

    console.warn(
      "SERVICE: conversación no encontrada o sin acceso:",
      conversationId
    );

    return [];
  }


  /* =======================================================
     MESSAGE COLLECTION
  ======================================================= */

  const messagesRef =
    collection(
      db,
      "conversations",
      conversationId,
      "messages"
    );


  /* =======================================================
     GET ALL MESSAGES
     
     No usamos orderBy aquí porque algunos
     documentos creados manualmente podrían
     no tener createdAt.
  ======================================================= */

  const snapshot =
    await getDocs(
      messagesRef
    );


  console.log(
    "SERVICE: mensajes encontrados en Firestore:",
    snapshot.size
  );


  /* =======================================================
     NORMALIZE MESSAGES
  ======================================================= */

  const normalizedMessages =
    snapshot.docs.map(
      (document) => {

        const data =
          document.data();


        console.log(
          "SERVICE: mensaje:",
          document.id,
          data
        );


        return {

          id:
            document.id,

          conversationId,

          ...data,

          timestamp:
            formatMessageTime(
              data.createdAt
            ),

        };

      }
    );


  /* =======================================================
     SORT MESSAGES
  ======================================================= */

  normalizedMessages.sort(
    (first, second) => {

      const firstTime =
        getTimestampValue(
          first.createdAt
        );


      const secondTime =
        getTimestampValue(
          second.createdAt
        );


      return (
        firstTime -
        secondTime
      );

    }
  );


  console.log(
    "SERVICE: mensajes normalizados:",
    normalizedMessages
  );


  return normalizedMessages;
}


/* =========================================================
   SUBSCRIBE TO CONVERSATIONS - REAL TIME
========================================================= */

export function subscribeToConversations(
  user,
  onConversations,
  onError
) {

  if (
    !user ||
    typeof onConversations !==
      "function"
  ) {

    return () => {};

  }


  if (
    !can(
      user,
      PERMISSIONS.VIEW_CONVERSATIONS
    )
  ) {

    if (
      typeof onError ===
      "function"
    ) {

      onError(
        new Error(
          "CONVERSATIONS_NOT_ALLOWED"
        )
      );

    }

    return () => {};

  }


  const conversationsRef =
    collection(
      db,
      "conversations"
    );


  const unsubscribe =
    onSnapshot(
      conversationsRef,

      async () => {

        try {

          /*
           * onSnapshot dispara cada vez que cambia
           * una conversación. Reutilizamos
           * getConversations() para conservar el
           * enriquecimiento de customer/company
           * y las reglas de acceso existentes.
           */

          const conversations =
            await getConversations(
              user
            );


          console.log(
            "SERVICE: conversaciones en tiempo real:",
            conversations
          );


          onConversations(
            conversations
          );

        } catch (error) {

          console.error(
            "SERVICE: error procesando conversaciones en tiempo real:",
            error
          );


          if (
            typeof onError ===
            "function"
          ) {

            onError(
              error
            );

          }

        }

      },

      (error) => {

        console.error(
          "SERVICE: error en listener de conversaciones:",
          error
        );


        if (
          typeof onError ===
          "function"
        ) {

          onError(
            error
          );

        }

      }
    );


  return unsubscribe;

}


/* =========================================================
   SUBSCRIBE TO INCOMING MESSAGES - GLOBAL REAL TIME
========================================================= */

export async function subscribeToIncomingMessages(
  user,
  onIncomingMessage,
  onError
) {

  if (
    !user ||
    typeof onIncomingMessage !== "function"
  ) {

    return () => {};

  }


  let conversations = [];

  try {

    /*
     * Obtenemos solamente las conversaciones que el usuario
     * puede ver. Cada una tendrá su propio listener de mensajes.
     */

    conversations =
      await getConversations(
        user
      );

  } catch (error) {

    console.error(
      "SERVICE: error obteniendo conversaciones para notificaciones:",
      error
    );

    if (
      typeof onError === "function"
    ) {

      onError(error);

    }

    return () => {};

  }


  const unsubscribers = [];


  conversations.forEach(
    (conversation) => {

      const messagesRef =
        collection(
          db,
          "conversations",
          conversation.id,
          "messages"
        );


      let firstSnapshot = true;


      const unsubscribe =
        onSnapshot(
          messagesRef,

          (snapshot) => {

            try {

              /*
               * El primer snapshot contiene el historial.
               * No debemos notificar esos mensajes.
               */

              if (firstSnapshot) {

                firstSnapshot =
                  false;

                return;

              }


              /*
               * Solo reaccionamos a documentos NUEVOS.
               */

              snapshot
                .docChanges()
                .filter(
                  (change) =>
                    change.type ===
                    "added"
                )
                .forEach(
                  (change) => {

                    const data =
                      change.doc.data();


                    /*
                     * Solo los mensajes enviados por
                     * el cliente producen sonido.
                     *
                     * Los mensajes del empleado nunca
                     * generan notificación.
                     */

                    if (
                      data.sender !==
                      "customer"
                    ) {

                      return;

                    }


                    const message = {

                      id:
                        change.doc.id,

                      conversationId:
                        conversation.id,

                      ...data,

                    };


                    console.log(
                      "SERVICE: mensaje entrante detectado:",
                      message
                    );


                    onIncomingMessage(
                      message,
                      conversation
                    );

                  }
                );

            } catch (error) {

              console.error(
                "SERVICE: error procesando mensaje entrante:",
                error
              );


              if (
                typeof onError ===
                "function"
              ) {

                onError(error);

              }

            }

          },

          (error) => {

            console.error(
              "SERVICE: error escuchando mensajes de",
              conversation.id,
              error
            );


            if (
              typeof onError ===
              "function"
            ) {

              onError(error);

            }

          }
        );


      unsubscribers.push(
        unsubscribe
      );

    }
  );


  console.log(
    "SERVICE: listeners globales de mensajes:",
    unsubscribers.length
  );


  return () => {

    unsubscribers.forEach(
      (unsubscribe) => {

        try {

          unsubscribe();

        } catch (error) {

          console.debug(
            "SERVICE: error cerrando listener:",
            error
          );

        }

      }
    );

  };

}


/* =========================================================
   SUBSCRIBE TO MESSAGES - REAL TIME
========================================================= */

export async function subscribeToMessages(
  conversationId,
  user,
  onMessages,
  onError
) {

  if (
    !conversationId ||
    !user ||
    typeof onMessages !== "function"
  ) {
    return () => {};
  }


  /* =======================================================
     VERIFY CONVERSATION ACCESS
  ======================================================= */

  const conversation =
    await getConversation(
      conversationId,
      user
    );


  if (!conversation) {

    console.warn(
      "SERVICE: conversación no encontrada o sin acceso:",
      conversationId
    );

    if (
      typeof onError === "function"
    ) {

      onError(
        new Error(
          "CONVERSATION_NOT_ALLOWED"
        )
      );

    }

    return () => {};
  }


  /* =======================================================
     MESSAGE COLLECTION
  ======================================================= */

  const messagesRef =
    collection(
      db,
      "conversations",
      conversationId,
      "messages"
    );


  /* =======================================================
     REAL-TIME LISTENER
  ======================================================= */

  const unsubscribe =
    onSnapshot(
      messagesRef,

      (snapshot) => {

        try {

          const normalizedMessages =
            snapshot.docs.map(
              (document) => {

                const data =
                  document.data();


                return {

                  id:
                    document.id,

                  conversationId,

                  ...data,

                  timestamp:
                    data.createdAt
                      ? formatMessageTime(
                          data.createdAt
                        )
                      : data.timestamp ?? "",

                };

              }
            );


          normalizedMessages.sort(
            (
              first,
              second
            ) => {

              const firstTime =
                getTimestampValue(
                  first.createdAt
                );


              const secondTime =
                getTimestampValue(
                  second.createdAt
                );


              if (
                firstTime === 0 &&
                secondTime === 0
              ) {
                return 0;
              }


              if (
                firstTime === 0
              ) {
                return -1;
              }


              if (
                secondTime === 0
              ) {
                return 1;
              }


              return (
                firstTime -
                secondTime
              );

            }
          );


          console.log(
            "SERVICE: mensajes en tiempo real:",
            normalizedMessages
          );


          onMessages(
            normalizedMessages
          );

        } catch (error) {

          console.error(
            "SERVICE: error procesando mensajes:",
            error
          );


          if (
            typeof onError === "function"
          ) {

            onError(
              error
            );

          }

        }

      },

      (error) => {

        console.error(
          "SERVICE: error en listener de mensajes:",
          error
        );


        if (
          typeof onError === "function"
        ) {

          onError(
            error
          );

        }

      }
    );


  return unsubscribe;

}


/* =========================================================
   TAKE CONVERSATION
========================================================= */

export async function takeConversation(
  conversation,
  user
) {

  if (
    !conversation ||
    !user
  ) {
    return {
      success: false,
      reason: "invalid_data",
    };
  }


  if (
    !canTakeConversation(
      user,
      conversation
    )
  ) {
    return {
      success: false,
      reason: "not_allowed",
    };
  }


  const conversationRef =
    doc(
      db,
      "conversations",
      conversation.id
    );


  await updateDoc(
    conversationRef,
    {

      assignedTo:
        user.uid,

      status:
        "active",

      unreadCount:
        0,

      lastActivityAt:
        serverTimestamp(),

      closedAt:
        deleteField(),

      purgeAt:
        deleteField(),

      updatedAt:
        serverTimestamp(),

    }
  );


  return {

    success: true,

    conversation: {

      ...conversation,

      assignedTo:
        user.uid,

      status:
        "active",

      unreadCount:
        0,

    },

  };
}


/* =========================================================
   ASSIGN CONVERSATION
========================================================= */

export async function assignConversation(
  conversation,
  employee,
  user
) {

  if (
    !conversation ||
    !user ||
    !employee
  ) {
    return {
      success: false,
      reason: "invalid_data",
    };
  }


  if (
    !canAssignConversation(
      user,
      conversation
    )
  ) {
    return {
      success: false,
      reason: "not_allowed",
    };
  }


  if (
    !canAssignToEmployee(
      user,
      conversation,
      employee
    )
  ) {
    return {
      success: false,
      reason:
        "employee_not_allowed",
    };
  }


  const conversationRef =
    doc(
      db,
      "conversations",
      conversation.id
    );


  const assignedEmployeeId =
    employee.uid ??
    employee.id;


  const updateData = {

    assignedTo:
      assignedEmployeeId,

    unreadCount:
      0,

    lastActivityAt:
      serverTimestamp(),

    closedAt:
      deleteField(),

    purgeAt:
      deleteField(),

    updatedAt:
      serverTimestamp(),

  };


  if (
    conversation.status ===
    "unread"
  ) {

    updateData.status =
      "active";

  }


  await updateDoc(
    conversationRef,
    updateData
  );


  return {

    success: true,

    conversation: {

      ...conversation,

      assignedTo:
        assignedEmployeeId,

      status:
        conversation.status ===
        "unread"
          ? "active"
          : conversation.status,

      unreadCount:
        0,

    },

  };
}


/* =========================================================
   UNASSIGN CONVERSATION
========================================================= */

export async function unassignConversation(
  conversation,
  user
) {

  if (
    !conversation ||
    !user
  ) {
    return {
      success: false,
      reason: "invalid_data",
    };
  }


  if (
    !canAssignConversation(
      user,
      conversation
    )
  ) {
    return {
      success: false,
      reason: "not_allowed",
    };
  }


  const conversationRef =
    doc(
      db,
      "conversations",
      conversation.id
    );


  await updateDoc(
    conversationRef,
    {

      assignedTo:
        null,

      lastActivityAt:
        serverTimestamp(),

      closedAt:
        deleteField(),

      purgeAt:
        deleteField(),

      updatedAt:
        serverTimestamp(),

    }
  );


  return {

    success: true,

    conversation: {

      ...conversation,

      assignedTo:
        null,

    },

  };
}


/* =========================================================
   CHANGE CONVERSATION STATUS
========================================================= */

export async function changeConversationStatus(
  conversation,
  newStatus,
  user
) {

  if (
    !conversation ||
    !user ||
    !newStatus
  ) {
    return {
      success: false,
      reason: "invalid_data",
    };
  }


  if (
    !can(
      user,
      PERMISSIONS.CHANGE_STATUS
    )
  ) {
    return {
      success: false,
      reason: "not_allowed",
    };
  }


  if (
    !canAccessConversation(
      user,
      conversation
    )
  ) {
    return {
      success: false,
      reason:
        "conversation_not_allowed",
    };
  }


  const allowedStatuses = [
    "unread",
    "active",
    "pending",
    "closed",
  ];


  if (
    !allowedStatuses.includes(
      newStatus
    )
  ) {
    return {
      success: false,
      reason: "invalid_status",
    };
  }


  const conversationRef =
    doc(
      db,
      "conversations",
      conversation.id
    );


  const updateData = {

    status:
      newStatus,

    lastActivityAt:
      serverTimestamp(),

    updatedAt:
      serverTimestamp(),

  };


  if (
    newStatus !==
    "unread"
  ) {

    updateData.unreadCount =
      0;

  }


  /*
   * Closed conversations start their retention window.
   */

  if (
    newStatus ===
    "closed"
  ) {

    updateData.closedAt =
      serverTimestamp();

    updateData.purgeAt =
      Timestamp.fromMillis(
        Date.now() +
        CLOSED_CONVERSATION_RETENTION_MS
      );

  }


  /*
   * Reopening a conversation removes the previous
   * retention markers.
   */

  if (
    newStatus !==
    "closed"
  ) {

    updateData.closedAt =
      deleteField();

    updateData.purgeAt =
      deleteField();

  }


  await updateDoc(
    conversationRef,
    updateData
  );


  return {

    success: true,

    conversation: {

      ...conversation,

      status:
        newStatus,

      unreadCount:
        newStatus !==
        "unread"
          ? 0
          : conversation.unreadCount,

    },

  };
}


/* =========================================================
   ADD MESSAGE
========================================================= */

export async function addMessage(
  conversation,
  text,
  sender,
  user
) {

  if (
    !conversation ||
    !user ||
    !text?.trim()
  ) {
    return {
      success: false,
      reason: "invalid_data",
    };
  }


  if (
    !canAccessConversation(
      user,
      conversation
    )
  ) {
    return {
      success: false,
      reason:
        "conversation_not_allowed",
    };
  }


  if (
    sender === "employee" &&
    !can(
      user,
      PERMISSIONS.REPLY_MESSAGES
    )
  ) {
    return {
      success: false,
      reason: "not_allowed",
    };
  }


  const conversationRef =
    doc(
      db,
      "conversations",
      conversation.id
    );


  const messagesRef =
    collection(
      conversationRef,
      "messages"
    );


  const messageData = {

    conversationId:
      conversation.id,

    sender,

    senderId:
      sender === "employee"
        ? user.uid
        : conversation.customerId,

    text:
      text.trim(),

    createdAt:
      serverTimestamp(),

  };


  const messageRef =
    await addDoc(
      messagesRef,
      messageData
    );


  await updateDoc(
    conversationRef,
    {

      lastMessage: {

        text:
          text.trim(),

        sender,

        senderId:
          sender === "employee"
            ? user.uid
            : conversation.customerId,

      },

      status:
        "active",

      unreadCount:
        0,

      lastActivityAt:
        serverTimestamp(),

      closedAt:
        deleteField(),

      purgeAt:
        deleteField(),

      updatedAt:
        serverTimestamp(),

    }
  );


  return {

    success: true,

    message: {

      id:
        messageRef.id,

      conversationId:
        conversation.id,

      sender,

      senderId:
        sender === "employee"
          ? user.uid
          : conversation.customerId,

      text:
        text.trim(),

      timestamp:
        formatMessageTime(
          new Date()
        ),

    },

    conversation: {

      ...conversation,

      status:
        "active",

      unreadCount:
        0,

      lastMessage: {

        text:
          text.trim(),

        sender,

        senderId:
          sender === "employee"
            ? user.uid
            : conversation.customerId,

      },

    },

  };
}


/* =========================================================
   TIMESTAMP HELPERS
========================================================= */

function getTimestampValue(
  timestamp
) {

  if (!timestamp) {
    return 0;
  }


  if (
    typeof timestamp.toMillis ===
    "function"
  ) {

    return timestamp.toMillis();

  }


  if (
    timestamp instanceof Date
  ) {

    return timestamp.getTime();

  }


  if (
    typeof timestamp ===
    "string"
  ) {

    return new Date(
      timestamp
    ).getTime();

  }


  return 0;
}


function formatMessageTime(
  timestamp
) {

  if (!timestamp) {
    return "";
  }


  const date =
    timestamp instanceof Date
      ? timestamp
      : typeof timestamp.toDate ===
          "function"
        ? timestamp.toDate()
        : new Date(timestamp);


  return new Intl.DateTimeFormat(
    "es-GT",
    {
      hour: "numeric",
      minute: "2-digit",
    }
  ).format(date);
}