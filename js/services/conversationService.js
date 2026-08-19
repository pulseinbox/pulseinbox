import { messages } from "../mock-messages.js";
import { employees } from "../mock-employees.js";

import {
  canAccessConversation,
  canTakeConversation,
  canAssignConversation,
  canAssignToEmployee,
  can,
  PERMISSIONS,
} from "../permissions.js";


/* =========================================================
   TAKE CONVERSATION
========================================================= */

export function takeConversation(
  conversation,
  user
) {
  if (!conversation || !user) {
    return {
      success: false,
      reason: "invalid_data",
    };
  }

  if (!canTakeConversation(user, conversation)) {
    return {
      success: false,
      reason: "not_allowed",
    };
  }

  conversation.assignedTo = user.id;
  conversation.status = "active";
  conversation.unreadCount = 0;
  conversation.updatedAt = new Date().toISOString();

  return {
    success: true,
    conversation,
  };
}


/* =========================================================
   ASSIGN CONVERSATION
========================================================= */

export function assignConversation(
  conversation,
  employeeId,
  user
) {
  if (!conversation || !user || !employeeId) {
    return {
      success: false,
      reason: "invalid_data",
    };
  }

  if (!canAssignConversation(user, conversation)) {
    return {
      success: false,
      reason: "not_allowed",
    };
  }

  const employee = employees.find(
    (item) => item.id === employeeId
  );

  if (!employee) {
    return {
      success: false,
      reason: "employee_not_found",
    };
  }

  if (!canAssignToEmployee(user, conversation, employee)) {
    return {
      success: false,
      reason: "employee_not_allowed",
    };
  }

  conversation.assignedTo = employee.id;

  if (conversation.status === "unread") {
    conversation.status = "active";
  }

  conversation.unreadCount = 0;
  conversation.updatedAt = new Date().toISOString();

  return {
    success: true,
    conversation,
  };
}


/* =========================================================
   UNASSIGN CONVERSATION
========================================================= */

export function unassignConversation(
  conversation,
  user
) {
  if (!conversation || !user) {
    return {
      success: false,
      reason: "invalid_data",
    };
  }

  if (!canAssignConversation(user, conversation)) {
    return {
      success: false,
      reason: "not_allowed",
    };
  }

  conversation.assignedTo = null;

  if (conversation.status === "unread") {
    conversation.status = "active";
  }

  conversation.updatedAt = new Date().toISOString();

  return {
    success: true,
    conversation,
  };
}


/* =========================================================
   CHANGE CONVERSATION STATUS
========================================================= */

export function changeConversationStatus(
  conversation,
  newStatus,
  user
) {
  if (!conversation || !user || !newStatus) {
    return {
      success: false,
      reason: "invalid_data",
    };
  }

  if (!can(user, PERMISSIONS.CHANGE_STATUS)) {
    return {
      success: false,
      reason: "not_allowed",
    };
  }

  if (!canAccessConversation(user, conversation)) {
    return {
      success: false,
      reason: "conversation_not_allowed",
    };
  }

  const allowedStatuses = [
    "unread",
    "active",
    "pending",
    "closed",
  ];

  if (!allowedStatuses.includes(newStatus)) {
    return {
      success: false,
      reason: "invalid_status",
    };
  }

  conversation.status = newStatus;

  if (newStatus !== "unread") {
    conversation.unreadCount = 0;
  }

  conversation.updatedAt = new Date().toISOString();

  return {
    success: true,
    conversation,
  };
}


/* =========================================================
   ADD MESSAGE
========================================================= */

export function addMessage(
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

  if (!canAccessConversation(user, conversation)) {
    return {
      success: false,
      reason: "conversation_not_allowed",
    };
  }

  if (
    sender === "employee" &&
    !can(user, PERMISSIONS.REPLY_MESSAGES)
  ) {
    return {
      success: false,
      reason: "not_allowed",
    };
  }

  if (!messages[conversation.id]) {
    messages[conversation.id] = [];
  }

  const timestamp =
    new Intl.DateTimeFormat("es-GT", {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date());

  const message = {
    id: `msg-${Date.now()}`,
    conversationId: conversation.id,
    sender,
    text: text.trim(),
    timestamp,
  };

  messages[conversation.id].push(message);

  conversation.lastMessage = {
    text: message.text,
    timestamp: message.timestamp,
  };

  conversation.status = "active";
  conversation.unreadCount = 0;
  conversation.updatedAt = new Date().toISOString();

  return {
    success: true,
    message,
    conversation,
  };
}
