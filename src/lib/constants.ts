export const COLLECTIONS = {
  USERS: 'users',
  TRANSACTIONS: 'transactions',
  ANNOUNCEMENTS: 'announcements',
  RESOLVING_DECK: 'resolvingDeck',
  BILLS: 'bills',
  FORGIVENESS_LOGS: 'forgivenessLogs',
  VOTES: 'votes',
  DEBTS: 'debts',
  REWARDS: 'rewards',
  ROLE_REQUESTS: 'roleRequests',
  COMPLAINTS: 'complaints',
  COMPLAINT_MESSAGES: 'complaintMessages',
  DIRECT_CONVERSATIONS: 'directConversations',
  DIRECT_MESSAGES: 'directMessages',
  GROUPS: 'groups',
  ACTIVITY_LOGS: 'activityLogs',
  SPY_NETWORK: 'spyNetwork',
  SPECIAL_OPS_LOGS: 'specialOpsLogs',
  INTERNAL_NOTES: 'internalNotes',
  RECRUITMENTS: 'recruitments',
  WARNINGS: 'warnings', // typically used as subcollection
  PENDING_ACCOUNT_REQUESTS: 'pendingAccountRequests',
  SYSTEM_STATUS: 'systemStatus',
  SYSTEM_CONFIG: 'systemConfig',
  ROLES_CONFIG: 'roles_config',
  ROLES: 'roles'
} as const;

export const COMPLAINT_STATUS = {
  PENDING: 'pending',
  UNDER_REVIEW: 'under_review',
  RESOLVED: 'resolved',
  ARCHIVED: 'archived'
} as const;

export const BILL_STATUS = {
  SUBMITTED: 'submitted',
  REVIEWING: 'reviewing',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ARCHIVED: 'archived',
  ACTIVE: 'active'
} as const;
