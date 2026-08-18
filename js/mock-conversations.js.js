export const conversations = [
  {
    id: "conv-001",

    customer: {
      id: "customer-001",
      name: "Juan Pérez",
      avatar: null,
    },

    company: {
      id: "outsider",
      name: "Outsider",
      color: "#8B5CF6",
    },

    channel: {
      type: "instagram",
      conversationId: "ig-conv-001",
    },

    status: "unread",

    assignedTo: null,

    lastMessage: {
      text: "Hola, sigue disponible esta gorra?",
      timestamp: "11:28 AM",
    },

    unreadCount: 1,

    createdAt: "2026-08-18T11:28:00",
    updatedAt: "2026-08-18T11:28:00",
  },

  {
    id: "conv-002",

    customer: {
      id: "customer-002",
      name: "María López",
      avatar: null,
    },

    company: {
      id: "angora",
      name: "Angora",
      color: "#FBB023",
    },

    channel: {
      type: "facebook",
      conversationId: "fb-conv-002",
    },

    status: "active",

    assignedTo: "employee-001",

    lastMessage: {
      text: "Hola, ¿hacen envíos?",
      timestamp: "2:10 PM",
    },

    unreadCount: 0,

    createdAt: "2026-08-18T14:10:00",
    updatedAt: "2026-08-18T14:10:00",
  },

  {
    id: "conv-003",

    customer: {
      id: "customer-003",
      name: "Carlos Ramírez",
      avatar: null,
    },

    company: {
      id: "outsider",
      name: "Outsider",
      color: "#8B5CF6",
    },

    channel: {
      type: "tiktok",
      conversationId: "tt-conv-003",
    },

    status: "pending",

    assignedTo: "employee-001",

    lastMessage: {
      text: "¿Todavía tienen disponible?",
      timestamp: "1:40 PM",
    },

    unreadCount: 0,

    createdAt: "2026-08-18T13:40:00",
    updatedAt: "2026-08-18T13:40:00",
  },
];