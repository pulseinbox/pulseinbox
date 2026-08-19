/* =========================================================
   PULSE PERMISSIONS
========================================================= */


/* =========================================================
   PERMISSION DEFINITIONS
========================================================= */

export const PERMISSIONS = {
  VIEW_CONVERSATIONS:
    "view_conversations",

  REPLY_MESSAGES:
    "reply_messages",

  CHANGE_STATUS:
    "change_status",

  TAKE_CONVERSATIONS:
    "take_conversations",

  ASSIGN_CONVERSATIONS:
    "assign_conversations",

  MANAGE_EMPLOYEES:
    "manage_employees",

  MANAGE_COMPANIES:
    "manage_companies",

  MANAGE_SETTINGS:
    "manage_settings",
};


/* =========================================================
   ROLE DEFINITIONS
========================================================= */

export const ROLE_PERMISSIONS = {
  admin: [
    PERMISSIONS.VIEW_CONVERSATIONS,
    PERMISSIONS.REPLY_MESSAGES,
    PERMISSIONS.CHANGE_STATUS,
    PERMISSIONS.TAKE_CONVERSATIONS,
    PERMISSIONS.ASSIGN_CONVERSATIONS,
    PERMISSIONS.MANAGE_EMPLOYEES,
    PERMISSIONS.MANAGE_COMPANIES,
    PERMISSIONS.MANAGE_SETTINGS,
  ],

  manager: [
    PERMISSIONS.VIEW_CONVERSATIONS,
    PERMISSIONS.REPLY_MESSAGES,
    PERMISSIONS.CHANGE_STATUS,
    PERMISSIONS.TAKE_CONVERSATIONS,
    PERMISSIONS.ASSIGN_CONVERSATIONS,
  ],

  agent: [
    PERMISSIONS.VIEW_CONVERSATIONS,
    PERMISSIONS.REPLY_MESSAGES,
    PERMISSIONS.CHANGE_STATUS,
    PERMISSIONS.TAKE_CONVERSATIONS,
  ],
};


/* =========================================================
   CHECK PERMISSION
========================================================= */

export function can(
  user,
  permission
) {
  if (!user) {
    return false;
  }

  const rolePermissions =
    ROLE_PERMISSIONS[user.role];

  if (!rolePermissions) {
    return false;
  }

  return rolePermissions.includes(
    permission
  );
}


/* =========================================================
   COMPANY ACCESS
========================================================= */

export function canAccessCompany(
  user,
  companyId
) {
  if (!user || !companyId) {
    return false;
  }

  return (
    Array.isArray(user.companies) &&
    user.companies.includes(companyId)
  );
}


/* =========================================================
   CONVERSATION ACCESS
========================================================= */

export function canAccessConversation(
  user,
  conversation
) {
  if (!user || !conversation) {
    return false;
  }

  if (
    !can(
      user,
      PERMISSIONS.VIEW_CONVERSATIONS
    )
  ) {
    return false;
  }

  return canAccessCompany(
    user,
    conversation.company?.id
  );
}


/* =========================================================
   TAKE CONVERSATION
========================================================= */

export function canTakeConversation(
  user,
  conversation
) {
  if (!user || !conversation) {
    return false;
  }

  if (
    !can(
      user,
      PERMISSIONS.TAKE_CONVERSATIONS
    )
  ) {
    return false;
  }

  if (
    !canAccessConversation(
      user,
      conversation
    )
  ) {
    return false;
  }

  return !conversation.assignedTo;
}


/* =========================================================
   ASSIGN CONVERSATION
========================================================= */

export function canAssignConversation(
  user,
  conversation
) {
  if (!user || !conversation) {
    return false;
  }

  if (
    !can(
      user,
      PERMISSIONS.ASSIGN_CONVERSATIONS
    )
  ) {
    return false;
  }

  return canAccessConversation(
    user,
    conversation
  );
}


/* =========================================================
   ASSIGN TO EMPLOYEE
========================================================= */

export function canAssignToEmployee(
  user,
  conversation,
  employee
) {
  if (
    !user ||
    !conversation ||
    !employee
  ) {
    return false;
  }

  if (
    !canAssignConversation(
      user,
      conversation
    )
  ) {
    return false;
  }

  return (
    Array.isArray(employee.companies) &&
    employee.companies.includes(
      conversation.company?.id
    )
  );
}