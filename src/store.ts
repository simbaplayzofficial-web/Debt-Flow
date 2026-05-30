import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { db, auth } from './firebase';
import firebaseConfig from '../firebase-applet-config.json';
import { 
  collection, doc, setDoc, onSnapshot, updateDoc, writeBatch, 
  getDoc, query, where, orderBy, limit, Timestamp, getDocs,
  DocumentData, QueryDocumentSnapshot, deleteDoc, deleteField,
  collectionGroup, addDoc, serverTimestamp, getDocFromServer,
  or
} from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error Detail: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
import { 
  signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  signOut, onAuthStateChanged, User as FirebaseUser,
  reauthenticateWithCredential, updatePassword as updateAuthPassword, 
  EmailAuthProvider, updateEmail
} from 'firebase/auth';

export type UserRole = 'user' | 'admin' | 'add_admin' | 'monitor';

export type UserProfile = {
  id: string;
  uid: string;
  username: string;
  email: string;
  role: UserRole;
  requestedRole?: UserRole | null;
  status: 'active' | 'restricted' | 'suspended';
  warningCount: number;
  warnings: number;
  integrityScore: number;
  integrity: number;
  integrityLevel: number;
  debtOwed: number;
  debtToMe: number;
  ratingAverage: number;
  ratingCount: number;
  rating: number;
  totalLendingTransactions: number;
  isPermanentlyRemoved: boolean;
  restrictedUntil?: string;
  communityServicesNeeded: number;
  isCommunityServiceParticipant?: boolean;
  specialOpsAccess?: boolean;
  createdAt?: any;
  lastLogin?: any;
};

export type RoleRequest = {
  id: string;
  userId: string;
  username: string;
  requestedRole: UserRole;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
};

export type WarningRule = {
  level: number;
  penalty: string;
  integrityDeduction: number;
};

export type Warning = {
  id: string;
  level?: number;
  type?: 'issue' | 'revoke';
  revokedLevel?: number;
  previousLevel?: number;
  newLevel?: number;
  reason: string;
  issuedBy?: string;
  revokedBy?: string;
  targetId: string;
  timestamp: any;
};

export type TransactionStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'awaiting_rating' | 'completed';

export type TransactionRequest = {
  id: string;
  requesterUid: string;
  senderUid: string;
  amount: number;
  pages: number;
  reason: string;
  freeWork: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
};

export type Transaction = {
  id: string;
  senderUid: string;
  requesterUid: string;
  amount: number;
  pages: number;
  reason: string;
  freeWork: boolean;
  status: 'pending_acceptance' | 'active' | 'awaiting_rating' | 'completed' | 'rejected';
  createdAt: any;
  approvedBy?: string;
  rating?: number;

  // Backward compatibility alias definitions
  senderId?: string;
  askerId?: string;
  debt?: number;
  isCommunityService?: boolean;
  validatedBy?: string;
  validatedAt?: string;
};

export type Rating = {
  id: string;
  transactionId: string;
  senderUid: string;
  requesterUid: string;
  stars: number;
  review?: string;
  createdAt: any;
};

export type ActivityLog = {
  id: string;
  userId: string;
  username: string;
  type: string;
  action: string;
  location?: string;
  details: any;
  timestamp: any;
  role?: string;
  severity?: string;
  activityType?: string;
  description?: string;
};

export type AdjustmentStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED';

export type DebtAdjustment = {
  id: string;
  transactionId: string;
  borrowerId: string;
  lenderId: string;
  amount: number;
  status: AdjustmentStatus;
  requestedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
};

export type AnnouncementSection = 'GLOBAL' | 'MONITORING' | 'RESOLVING';

export type Announcement = {
  id: string;
  title: string;
  content: string;
  authorId: string;
  section: AnnouncementSection;
  timestamp: string;
  expiresAt: string; // ISO string for cleanup
};

export type ForgivenessLog = {
  id: string;
  forgiverId: string;
  receiverId: string;
  debtsForgiven: number;
  timestamp: string;
};

export type Leaderboard = {
  communityCarer: {
    userId: string;
    username: string;
    totalContribution: number;
  } | null;
  bestSender: {
    userId: string;
    username: string;
    averageRating: number;
  } | null;
  senderOfTheMonth: {
    userId: string;
    username: string;
    totalDebts: number;
  } | null;
  updatedAt: string;
};

export type DirectConversation = {
  id: string;
  participants: string[];
  createdAt: any;
  updatedAt: any;
  lastMessage?: string;
  lastMessageAt?: any;
};

export type DirectMessage = {
  id: string;
  conversationId: string;
  senderUid: string;
  message: string;
  createdAt: any;
  seenBy: string[];
};

export type Complaint = {
  id: string;
  createdByUid: string;
  createdAt: any;
  status: 'open' | 'claimed' | 'resolved';
  subject: string;
  complaint: string;
  assignedMonitorId: string | null;
  lastMessageAt: any;
};

export type ComplaintMessage = {
  id: string;
  complaintId: string;
  senderRole: 'user' | 'monitor';
  senderUid: string;
  message: string;
  createdAt: any;
};

export type CaseStatus = 'ongoing' | 'resolved' | 'under_investigation';

export type ResolvingCase = {
  id: string;
  involvedUsers: string[];
  description: string;
  status: CaseStatus;
  createdBy: string;
  resolvedAt?: string;
  verdict?: string;
  timestamp: string;
};

export type PendingAccountRequest = {
  id: string;
  username: string;
  generatedEmail: string;
  password?: string;
  requestedRole: 'Standard' | 'Monitor';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string; // ISO String
};

export type GroupId = 'studying' | 'monitoring' | 'chatting' | 'resolving' | 'complaints';

export type GroupPost = {
  id: string;
  groupId: GroupId;
  authorId: string;
  content: string;
  timestamp: string;
};

export type AppRole = {
  id: string;
  roleName: string;
  permissions: string[];
};

export type RoleConfig = {
  admins: string[];
  monitors: string[];
};

export type SystemStatus = {
  emergencyLevel: 1 | 2 | 3;
  updatedBy: string;
  timestamp: string;
};

export type BillPriority = 'Low' | 'Medium' | 'High' | 'Emergency';
export type BillCategory = 'Governance' | 'Economy' | 'Warnings' | 'Elections' | 'Community Service' | 'Monitor Reform';

export type Bill = {
  id: string;
  title: string;
  category: BillCategory | string;
  description: string;
  proposedBy: string;
  createdBy: string;
  priority: BillPriority | string;
  status: 'active' | 'resolved';
  verdict?: string;
  createdAt: any;
  timestamp: string;
  lastEditedBy?: string;
};

export type BillComment = {
  id: string;
  userId: string;
  message: string;
  timestamp: string;
};

export type BillStaffComment = {
  id: string;
  userId: string;
  role: string;
  message: string;
  timestamp: string;
};

export type NetDebt = {
  id: string; // smallerUserId_largerUserId
  user1Id: string;
  user2Id: string;
  netBalance: number; // user2 owes user1 if positive, user1 owes user2 if negative
  updatedAt: string;
};

export type VoteStatus = 'active' | 'closed';

export type VoteType = 'Election' | 'Polling' | 'Decision' | 'Confidence Vote';

export type Vote = {
  id: string;
  title: string;
  type: VoteType;
  options: string[];
  isAnonymous: boolean;
  status: VoteStatus;
  createdBy: string;
  createdAt: any;
  userVotedOption?: string | null;
  results?: Record<string, { count: number; users: string[] }>;
  totalVotes?: number;
};

export type VoteResponse = {
  id: string; // userId
  selectedOption: string;
  votedAt: any;
  username: string;
};

export const SPY_OWNER_ID = "K7MRkBbJtdSapnLfw2giwLzmhwA3";
export const bootstrapAdmins = ['patty@debtflow.com', 'chiti@debtflow.com', 'simbaplayzofficial@gmail.com', 'simba@debtflow.com'];

export type SpyOpsRole = 'investigation' | 'defence' | 'diplomacy';

export type SpyOpsMember = {
  id: string;
  userId: string;
  role: SpyOpsRole;
  active: boolean;
  addedBy: string;
  timestamp: string;
};

export type SpecialOpsLog = {
  id: string;
  userId: string;
  username: string;
  action: string;
  details: any;
  timestamp: any;
};

export type InternalNote = {
  id: string;
  caseId: string;
  authorId: string;
  content: string;
  timestamp: string;
};

export type Recruitment = {
  id: string;
  recruitedUserId: string;
  task: string;
  reward: number;
  duration: string; // ISO end time
  assignedBy: string;
  status: 'active' | 'completed' | 'revoked';
  timestamp: string;
};

export type Reward = {
  id: string;
  userId: string;
  type: 'best_sender' | 'community_carer';
  claimed: boolean;
  rewardChosen?: 'debt_clear' | 'warning_revoke';
  timestamp: string;
  period: string; // e.g. "2024-04"
};

export type SystemBackup = {
  id: string;
  createdAt: any;
  createdBy: string;
  reason: string;
  data: {
    transactionRequests: any[];
    transactions: any[];
    ratings: any[];
    chats: any[];
    complaints: any[];
    logs: any[];
    activity: any[];
    [key: string]: any; // fallback for extra collections
  };
};

type State = {
  currentUser: UserProfile | null;
  users: UserProfile[];
  debts: NetDebt[];
  announcements: Announcement[];
  complaints: Complaint[];
  complaintMessages: ComplaintMessage[];
  roleRequests: RoleRequest[];
  resolvingDeck: ResolvingCase[];
  pendingAccountRequests: PendingAccountRequest[];
  anonymousComplaints: any[];
  systemStatus: SystemStatus | null;
  activityLogs: ActivityLog[];
  debtAdjustments: DebtAdjustment[];
  userWarnings: Warning[];
  allWarnings: Warning[];
  roles: AppRole[];
  specialOpsLogs: SpecialOpsLog[];
  internalNotes: InternalNote[];
  directConversations: DirectConversation[];
  directMessages: DirectMessage[];
  recruitments: Recruitment[];
  rewards: Reward[];
  spyNetwork: SpyOpsMember[];
  forgivenessLogs: ForgivenessLog[];
  votes: Vote[];
  currentLeaderboard: Leaderboard | null;
  hasSpecialAccess: boolean;
  isSpyOwner: boolean;
  specialOpsMode: boolean;
  groupPosts: Record<GroupId, GroupPost[]>;
  rolesConfig: RoleConfig;
  bills: Bill[];
  billComments: BillComment[];
  billStaffComments: BillStaffComment[];
  warningRules: WarningRule[];
  transactionRequests: TransactionRequest[];
  transactions: Transaction[];
  ratings: Rating[];
  systemBackups: SystemBackup[];
  
  isLoading: boolean;
  authError: string | null;
  
  // Auth
  login: (email: string, password: string) => Promise<boolean>;
  signUp: (username: string, email: string, password: string, requestedRole?: UserRole) => Promise<boolean>;
  logout: () => Promise<void>;
  
  // Core Actions
  recordTransaction: (borrowerUid: string, amount: number, pages: number, reason: string, freeWork: boolean) => Promise<string>;
  approveTransactionRequest: (requestId: string, verdict: string) => Promise<void>;
  rejectTransactionRequest: (requestId: string, verdict: string) => Promise<void>;
  acceptTransaction: (transactionId: string) => Promise<void>;
  cancelTransaction: (transactionId: string) => Promise<void>;
  completeTransaction: (transactionId: string) => Promise<void>;
  submitRating: (transactionId: string, senderUid: string, requesterUid: string, stars: number, review: string) => Promise<void>;
  forgiveDebt: (borrowerId: string, amount: number) => Promise<void>;
  calculateNetLedger: (userId: string) => {
    incomingOwed: number;
    outgoingOwed: number;
    netLedger: number;
    limitReached: boolean;
  };
  
  // Admin Actions
  postAnnouncement: (title: string, content: string, section: AnnouncementSection) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  issueWarning: (username: string, level: number, reason: string) => Promise<void>;
  resolveBill: (billId: string, verdictText: string) => Promise<void>;
  createResolvingCase: (description: string, involvedUsers: string[]) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  updateUsername: (newUsername: string) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  revokeWarning: (userId: string, warningId: string) => Promise<void>;
  updateWarningRules: (rules: WarningRule[]) => Promise<void>;
  updateSystemStatus: (level: 1 | 2 | 3) => Promise<void>;
  updateRolesConfig: (admins: string[], monitors: string[]) => Promise<void>;
  updateUserRole: (userId: string, newRole: string) => Promise<void>;
  updateRolePermissions: (roleId: string, permissions: string[]) => Promise<void>;
  approveDebtAdjustment: (adjId: string) => Promise<void>;
  rejectDebtAdjustment: (adjId: string) => Promise<void>;
  approvePendingRequest: (requestId: string) => Promise<void>;
  rejectPendingRequest: (requestId: string) => Promise<void>;
  toggleUserSuspension: (userId: string) => Promise<void>;
  updateUserStats: (userId: string, integrity: number, warnings: number) => Promise<void>;
 
  // Special Ops
  setSpecialOpsMode: (val: boolean) => void;
  updateSpecialOpsAccess: (userId: string, access: boolean) => Promise<void>;
  addInternalNote: (caseId: string, content: string) => Promise<void>;
  recruitUser: (userId: string, task: string, reward: number, durationHours: number) => Promise<void>;
  revokeRecruitment: (recruitmentId: string) => Promise<void>;
  logSpecialOps: (action: string, details: any) => Promise<void>;
  grantSpecialAccess: (userId: string) => Promise<void>;
  claimReward: (rewardId: string, choice: 'debt_clear' | 'warning_revoke') => Promise<void>;
  
  // Spy Ops Authority
  addToSpyNetwork: (userId: string, role: SpyOpsRole) => Promise<void>;
  removeFromSpyNetwork: (memberId: string) => Promise<void>;
  toggleSpyNetworkActive: (memberId: string, active: boolean) => Promise<void>;
 
  // Complaints Bills
  createBill: (title: string, category: string, description: string, priority: string) => Promise<void>;
  updateBill: (billId: string, title: string, description: string) => Promise<void>;
  postBillComment: (billId: string, message: string) => Promise<void>;
  postBillStaffComment: (billId: string, message: string) => Promise<void>;
 
  resetSystem: () => Promise<void>;
  executeGlobalPurge: () => Promise<void>;
  rollbackSystem: (backupId: string) => Promise<void>;
  recalculateLeaderboard: () => Promise<void>;
  
  // Complaints (Black Box)
  submitComplaint: (subject: string, complaint: string, extraFields?: any) => Promise<string>;
  claimComplaint: (complaintId: string) => Promise<void>;
  resolveComplaint: (complaintId: string) => Promise<void>;
  sendComplaintMessage: (complaintId: string, message: string) => Promise<void>;
  updateComplaintStatus: (complaintId: string, status: string) => Promise<void>;
  updateComplaintNotes: (complaintId: string, notes: string) => Promise<void>;
  deleteComplaint: (complaintId: string) => Promise<void>;
  
  // Role Transition
  requestRole: (role: UserRole) => Promise<void>;
  resolveRoleRequest: (requestId: string, approved: boolean) => Promise<void>;
  
  // Vote System
  createVote: (title: string, type: VoteType, options: string[], isAnonymous: boolean) => Promise<void>;
  submitVote: (voteId: string, option: string) => Promise<void>;
  closeVote: (voteId: string) => Promise<void>;

  // Groups
  postToGroup: (groupId: GroupId, content: string) => Promise<void>;
  
  // Chatter
  getOrCreateConversation: (participantId: string) => Promise<string>;
  sendDirectMessage: (conversationId: string, message: string) => Promise<void>;
  
  // Helpers
  calculateDebt: (pages: number) => number;
  logActivity: (action: string, details: any, userId?: string, username?: string, type?: string, location?: string) => Promise<void>;
};

export const useStore = create<State>()((set, get) => ({
  currentUser: null,
  users: [],
  debts: [],
  announcements: [],
  complaints: [],
  complaintMessages: [],
  roleRequests: [],
  resolvingDeck: [],
  anonymousComplaints: [],
  pendingAccountRequests: [],
  systemStatus: null,
  activityLogs: [],
  debtAdjustments: [],
  userWarnings: [],
  allWarnings: [],
  roles: [],
  specialOpsLogs: [],
  internalNotes: [],
  directConversations: [],
  directMessages: [],
  recruitments: [],
  rewards: [],
  spyNetwork: [],
  forgivenessLogs: [],
  votes: [],
  currentLeaderboard: null,
  hasSpecialAccess: false,
  isSpyOwner: false,
  specialOpsMode: false,
  bills: [],
  billComments: [],
  billStaffComments: [],
  transactionRequests: [],
  transactions: [],
  ratings: [],
  systemBackups: [],
  warningRules: [
    { level: 1, penalty: 'Official warning registered', integrityDeduction: 5 },
    { level: 2, penalty: 'Mandatory community service', integrityDeduction: 15 },
    { level: 3, penalty: 'Temporary account restriction', integrityDeduction: 30 },
    { level: 4, penalty: 'Prolonged suspension', integrityDeduction: 50 },
    { level: 5, penalty: 'Permanent removal protocol', integrityDeduction: 100 },
  ],
  groupPosts: {
    studying: [],
    monitoring: [],
    chatting: [],
    resolving: [],
    complaints: []
  },
  rolesConfig: {
    admins: ['patty', 'chiti'],
    monitors: ['babu', 'activa', 'suraj']
  },
  isLoading: true,
  authError: null,

  logActivity: async (action, details, userId, username, type, location) => {
    let finalUserId = userId;
    let finalUsername = username;
    let finalRole = 'user';

    const state = get();
    const currentUser = state.currentUser;

    if (!finalUserId || !finalUsername) {
      if (!currentUser) return;
      finalUserId = currentUser.id;
      finalUsername = currentUser.username;
      finalRole = currentUser.role || 'user';
    } else {
      const foundUser = state.users.find(u => u.id === finalUserId);
      if (foundUser) {
        finalRole = foundUser.role || 'user';
      }
    }

    let finalLocation = location || type || 'System';
    const actionUpper = (action || '').toUpperCase();

    // Redaction for secret/classified ops
    const hasSpecialKeywords = 
      finalLocation.toLowerCase().includes('special') || 
      finalLocation.toLowerCase().includes('spy') ||
      actionUpper.includes('SPECIAL_OPS') ||
      actionUpper.includes('RECRUITMENT') ||
      actionUpper.includes('SPY');

    if (hasSpecialKeywords) {
      finalLocation = 'Restricted Module';
    }

    // Determine severity
    let severity: 'info' | 'warning' | 'critical' = 'info';
    if (
      actionUpper.includes('SUSPEND') || 
      actionUpper.includes('BAN') || 
      actionUpper.includes('REJECT') || 
      actionUpper.includes('DELETE') || 
      actionUpper.includes('WARNING_ISSUED') ||
      actionUpper.includes('CRITICAL') ||
      actionUpper.includes('RESET') ||
      actionUpper.includes('PURGE')
    ) {
      severity = 'critical';
    } else if (
      actionUpper.includes('WARNING') || 
      actionUpper.includes('DISPUTE') || 
      actionUpper.includes('UPDATE') ||
      actionUpper.includes('CLAIM') ||
      actionUpper.includes('ROLE_RESOLVED') ||
      actionUpper.includes('PERMISSIONS')
    ) {
      severity = 'warning';
    }

    // Determine dynamic human-readable description
    let description = '';
    if (hasSpecialKeywords) {
      description = 'Accessed system configuration';
    } else if (typeof details === 'string') {
      description = details;
    } else if (details && typeof details === 'object') {
      if (details.description) {
        description = details.description;
      } else {
        switch (actionUpper) {
          case 'LOGIN':
            description = 'Logged into the platform';
            break;
          case 'LOGOUT':
            description = `Logged out of the platform`;
            break;
          case 'CREATE_TRANSACTION':
            description = `Lended ${details.pages || 0} pages of work to @${details.asker || 'user'}`;
            break;
          case 'APPROVE_TRANSACTION':
            description = `Approved lended work`;
            break;
          case 'REJECT_TRANSACTION':
            description = `Rejected lended work`;
            break;
          case 'RATE_TRANSACTION':
            description = `Given feedback rate of ${details.rating || 5} Star`;
            break;
          case 'FORGIVE_DEBT':
            description = `Approved debt forgiveness for $${details.amount || 0}`;
            break;
          case 'ANNOUNCEMENT_CREATED':
            description = `Created new announcement: "${details.title || 'untitled'}"`;
            break;
          case 'ANNOUNCEMENT_DELETED':
            description = `Deleted announcement: "${details.title || ''}"`;
            break;
          case 'WARNING_ISSUED':
            description = `Issued LEVEL ${details.level || 1} warning to @${details.target || 'user'}`;
            break;
          case 'WARNING_REVOKED':
            description = `Revoked warning from @${details.target || 'user'}`;
            break;
          case 'ACCOUNT_APPROVED':
            description = `Approved account verification for @${details.username || 'user'}`;
            break;
          case 'ACCOUNT_REJECTED':
            description = `Rejected account registration for @${details.username || 'user'}`;
            break;
          case 'USER_SUSPENDED':
            description = `Suspended platform access for @${details.username || 'user'}`;
            break;
          case 'USER_ACTIVATED':
            description = `Restored account access for @${details.username || 'user'}`;
            break;
          case 'ROLE_REQUEST':
            description = `Submitted application for role update`;
            break;
          case 'ROLE_RESOLVED':
            description = `${details.approved ? 'Approved' : 'Rejected'} ${details.target || 'user'}'s promotion request`;
            break;
          case 'VOTE_CREATED':
            description = `Initiated community vote: "${details.title || 'Untitled'}"`;
            break;
          case 'VOTE_SUBMITTED':
            description = `Cast vote on initiative #${details.voteId ? details.voteId.substring(0,8) : ''}`;
            break;
          case 'GROUP_POST':
            description = `Posted a message to ${details.groupId || 'community'}`;
            break;
          case 'BILL_FILED':
            description = `Filed claim: "${details.title || 'Untitled'}"`;
            break;
          case 'RESOLVE_BILL':
            description = `Resolved and closed claim record`;
            break;
          default:
            description = `${action.replace(/_/g, ' ').toLowerCase()}`;
        }
      }
    } else {
      description = action ? action.replace(/_/g, ' ').toLowerCase() : 'system activity';
    }

    // Capitalize first letter of description
    if (description) {
      description = description.charAt(0).toUpperCase() + description.slice(1);
    }

    // Write to Firestore
    try {
      const { serverTimestamp } = await import('firebase/firestore');
      const id = uuidv4();
      await setDoc(doc(db, 'activityLogs', id), {
        id,
        userId: finalUserId,
        username: finalUsername,
        role: finalRole,
        location: finalLocation,
        activityType: action,
        description: description,
        severity: severity,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Activity Logging Failed:", error);
    }
  },

  calculateDebt: (pages) => {
    return Math.ceil(pages / 5);
  },

  login: async (usernameOrEmail, password) => {
    set({ authError: null });
    
    if (!usernameOrEmail || !password || !usernameOrEmail.trim() || !password.trim()) {
      set({ authError: "Missing credentials" });
      return false;
    }
    
    const input = usernameOrEmail.trim();
    const isSpecialRequest = input.endsWith('/special') || input.includes('/special');
    const cleanUsername = isSpecialRequest ? input.replace('/special', '') : input;
    const pass = password.trim();

    const email = cleanUsername.includes('@') ? cleanUsername : `${cleanUsername}@debtflow.com`;
    const rawUsername = cleanUsername.includes('@') ? cleanUsername.split('@')[0] : cleanUsername;
    
    console.log(`[LOGIN_START] Attempting login: ${email}`);

    try {
      // 1. Attempt Firebase Authentication FIRST
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const user = userCredential.user;
      console.log(`[LOGIN_SUCCESS] Auth successful: ${user.uid}`);
      
      // Handle special ops access
      if (isSpecialRequest) {
        const uDoc = await getDoc(doc(db, 'users', user.uid));
        if (!uDoc.exists() || uDoc.data()?.specialOpsAccess !== true) {
          await signOut(auth);
          set({ authError: "Special Ops clearance denied." });
          return false;
        }
        set({ specialOpsMode: true });
      } else {
        set({ specialOpsMode: false });
      }

      // 2. Fetch User Profile & Auto-Repair/Provision if missing
      const userDocRef = doc(db, 'users', user.uid);
      let userDocSnap = await getDoc(userDocRef);
      
      console.log("Auth success");
      console.log("Profile existence:", userDocSnap.exists());
      console.log("Approval status:", userDocSnap.data()?.approved);
      
      if (!userDocSnap.exists()) {
         console.warn(`[LOGIN] Profile missing for UID: ${user.uid}. Auto-provisioning...`);
         const newUserDoc = {
            id: user.uid,
            uid: user.uid,
            username: rawUsername,
            email: email,
            role: 'user', 
            status: 'active',
            warningCount: 0,
            warnings: 0,
            integrityScore: 100,
            integrity: 100,
            integrityLevel: 0,
            debtOwed: 0,
            debtToMe: 0,
            ratingAverage: 5,
            ratingCount: 0,
            rating: 5,
            totalLendingTransactions: 0,
            isPermanentlyRemoved: false,
            communityServicesNeeded: 0,
            specialOpsAccess: false,
            hasCompletedTutorial: false,
            createdAt: serverTimestamp()
          };
          await setDoc(userDocRef, newUserDoc);
          userDocSnap = await getDoc(userDocRef); // Re-fetch
      }

      // Check for suspension
      if (userDocSnap.data()?.status === 'suspended') {
        await signOut(auth);
        set({ authError: "Account suspended by admin sovereignty." });
        return false;
      }

      await updateDoc(userDocRef, { lastLogin: serverTimestamp() });
      await get().logActivity('LOGIN', `Logged into the platform`, user.uid, rawUsername, 'Auth', 'Control Panel');

      return true;
    } catch (error: any) {
      console.error("[LOGIN_FAILURE] Auth failed:", error);
      
      // 3. ONLY if auth fails because user doesn't exist, check pending requests
      if (error.code === 'auth/user-not-found') {
        const usernameLower = rawUsername.toLowerCase();
        const pendingDocRef = doc(db, 'pendingAccountRequests', usernameLower);
        const pendingSnap = await getDoc(pendingDocRef);
        if (pendingSnap.exists()) {
          const reqData = pendingSnap.data();
          if (reqData.status === 'pending') {
            set({ authError: "Account awaiting validation." });
            return false;
          } else if (reqData.status === 'rejected') {
            set({ authError: "Account request rejected." });
            return false;
          }
        }
      }
      
      // Default Auth error
      set({ authError: "Invalid username or password" });
      return false;
    }
  },

  signUp: async (username, _unusedEmail, password, requestedRole) => {
    set({ authError: null });
    const trimmedUsername = username.trim();

    console.log(`[SIGNUP_START] Creating signup request... Triggering signup request for username: ${trimmedUsername}`);

    if (!trimmedUsername || !password) {
      set({ authError: "All fields are required." });
      return false;
    }

    // Validation: alphanumeric, underscores allowed, length 3-20
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(trimmedUsername)) {
      set({ authError: "Username must be 3-20 characters, containing only letters, numbers, or underscores." });
      return false;
    }

    if (password.length < 6) {
      set({ authError: "Password must be at least 6 characters." });
      return false;
    }

    const derivedEmail = `${trimmedUsername}@debtflow.com`;
    console.log(`[SIGNUP] Generated email address internally: ${derivedEmail}`);

    try {
      const usernameLower = trimmedUsername.toLowerCase();
      const pendingDocRef = doc(db, 'pendingAccountRequests', usernameLower);
      const pendingSnap = await getDoc(pendingDocRef);

      if (pendingSnap.exists()) {
        const reqData = pendingSnap.data();
        if (reqData.status === 'pending') {
          set({ authError: "This username is already queued for validation." });
          return false;
        } else if (reqData.status === 'approved') {
          set({ authError: "Username already taken." });
          return false;
        } else if (reqData.status === 'rejected') {
          set({ authError: "Username request rejected." });
          return false;
        }
      }

      console.log("Starting signup request creation for username:", trimmedUsername);
      const requestData = {
        id: usernameLower,
        username: trimmedUsername,
        generatedEmail: derivedEmail,
        password: password,
        requestedRole: requestedRole === 'monitor' ? 'Monitor' : requestedRole === 'admin' ? 'Admin' : 'Standard',
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      console.log("Request payload for pendingAccountRequests:", requestData);

      // Store request in pendingAccountRequests Firestore collection
      await setDoc(doc(db, 'pendingAccountRequests', usernameLower), requestData);

      console.log("Firestore write SUCCESS for pendingAccountRequest document ID:", usernameLower);
      return true;
    } catch (error: any) {
      console.error("[SIGNUP_FAILURE] Error during storage:", error);
      if (error.code === 'permission-denied' || (error.message && error.message.includes("permission"))) {
        set({ authError: "Username already requested." });
      } else {
        set({ authError: error.message || "Account collection request failed." });
      }
      return false;
    }
  },

  logout: async () => {
    const { currentUser, logActivity } = get();
    if (currentUser) {
      await logActivity('LOGOUT', `User @${currentUser.username} logged out`, undefined, undefined, 'Auth');
    }
    await signOut(auth);
    set({ currentUser: null, specialOpsMode: false });
  },

  recordTransaction: async (borrowerUid, amount, pages, reason, freeWork) => {
    const { currentUser, logActivity } = get();
    if (!currentUser) throw new Error("UNAUTHORIZED");

    const finalAmount = freeWork ? 0 : Math.ceil(pages / 5);

    try {
      const requestData = {
        requesterUid: borrowerUid,
        senderUid: currentUser.id,
        amount: finalAmount,
        pages,
        reason,
        freeWork,
        status: 'pending',
        createdAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, 'transactionRequests'), requestData);
      await logActivity('CREATE_TRANSACTION_REQUEST', { requestId: docRef.id, amount: finalAmount, pages, reason, freeWork }, currentUser.id, currentUser.username, 'Profile');
      return docRef.id;
    } catch (error: any) {
      handleFirestoreError(error, OperationType.CREATE, 'transactionRequests');
      throw error;
    }
  },

  createTransactionRequest: async (requesterUid, senderUid, type, amount, reason, deadline) => {
    const { currentUser, logActivity, calculateNetLedger } = get();
    if (!currentUser) throw new Error("UNAUTHENTICATED");

    const ledger = calculateNetLedger(requesterUid);
    const projected = ledger.netLedger - amount;
    if (projected < -10) {
      throw new Error(`Debt limit reached. Requester would go below -10 on Net Ledger (Projected: ${projected}).`);
    }

    try {
      const requestData = {
        requesterUid,
        senderUid,
        type,
        amount,
        reason,
        deadline: deadline || "",
        status: 'pending',
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'transactionRequests'), requestData);
      await logActivity('CREATE_TRANSACTION_REQUEST', {
        requestId: docRef.id,
        requesterUid,
        senderUid,
        type,
        amount,
        reason
      }, currentUser.id, currentUser.username, 'Profile');
      return docRef.id;
    } catch (error: any) {
      handleFirestoreError(error, OperationType.CREATE, 'transactionRequests');
      throw error;
    }
  },

  approveTransactionRequest: async (requestId, verdict) => {
    const { currentUser, logActivity, transactionRequests } = get();
    if (!currentUser || (currentUser.role !== 'monitor' && currentUser.role !== 'rit_chief' && currentUser.role !== 'admin')) {
      throw new Error("UNAUTHORIZED");
    }

    const req = transactionRequests.find(r => r.id === requestId);
    if (!req || req.status !== 'pending') throw new Error("Request not found or not pending");

    try {
      const batch = writeBatch(db);

      // 1. Update Request
      batch.update(doc(db, 'transactionRequests', requestId), {
        status: 'approved',
      });

      // 2. Create TransactionNode
      const txId = uuidv4();
      const nowStr = new Date().toISOString();
      batch.set(doc(db, 'transactions', txId), {
        id: txId,
        senderUid: req.senderUid,
        senderId: req.senderUid, // legacy alias
        requesterUid: req.requesterUid,
        askerId: req.requesterUid, // legacy alias
        amount: req.amount,
        pages: req.pages,
        debt: req.amount, // legacy alias
        reason: req.reason,
        freeWork: req.freeWork,
        isCommunityService: req.freeWork, // legacy alias
        status: 'pending_acceptance',
        createdAt: serverTimestamp(),
        approvedBy: currentUser.id,
        validatedBy: currentUser.id, // holiday alias
        validatedAt: nowStr // legacy alias
      });

      await batch.commit();
      await logActivity('APPROVE_TRANSACTION', { requestId, txId }, currentUser.id, currentUser.username, 'Monitor Workspace');
    } catch (error: any) {
      handleFirestoreError(error, OperationType.WRITE, `transactions/${requestId}`);
      throw error;
    }
  },

  acceptTransaction: async (transactionId) => {
    const { currentUser, transactions, logActivity } = get();
    if (!currentUser) throw new Error("UNAUTHENTICATED");

    const tx = transactions.find(t => t.id === transactionId);
    if (!tx || tx.senderUid !== currentUser.id || tx.status !== 'pending_acceptance') {
      throw new Error("Transaction not found or not pending acceptance");
    }

    try {
      const batch = writeBatch(db);

      // 1. Update status to active
      batch.update(doc(db, 'transactions', transactionId), {
        status: 'active',
      });

      // 2. Update Ledger (if NOT freeWork)
      if (!tx.freeWork) {
        const u1 = tx.senderUid < tx.requesterUid ? tx.senderUid : tx.requesterUid;
        const u2 = tx.senderUid < tx.requesterUid ? tx.requesterUid : tx.senderUid;
        const debtId = `${u1}_${u2}`;
        const debtRef = doc(db, 'debts', debtId);
        
        const currentDebtDoc = get().debts.find(d => d.id === debtId);
        const currentBalance = currentDebtDoc ? currentDebtDoc.netBalance : 0;
        
        // Sender (lender) gives work, requester (borrower) receives.
        // If senderUid is u1 (u1 gives to u2), u2 owes u1 more -> balance increases.
        // If senderUid is u2 (u2 gives to u1), u2 owes u1 less -> balance decreases.
        const balanceChange = tx.senderUid === u1 ? tx.amount : -tx.amount;
        
        batch.set(debtRef, {
          id: debtId,
          user1Id: u1,
          user2Id: u2,
          netBalance: currentBalance + balanceChange,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        
        // Update user stats
        batch.update(doc(db, 'users', tx.senderUid), { debtToMe: (get().users.find(u => u.id === tx.senderUid)?.debtToMe || 0) + tx.amount });
        batch.update(doc(db, 'users', tx.requesterUid), { debtOwed: (get().users.find(u => u.id === tx.requesterUid)?.debtOwed || 0) + tx.amount });
      }

      await batch.commit();
      await logActivity('ACCEPT_TRANSACTION', { transactionId }, currentUser.id, currentUser.username, 'Profile');
    } catch (error: any) {
      handleFirestoreError(error, OperationType.WRITE, `transactions/${transactionId}`);
      throw error;
    }
  },

  cancelTransaction: async (transactionId) => {
    const { currentUser, transactions, logActivity } = get();
    if (!currentUser) throw new Error("UNAUTHENTICATED");

    const tx = transactions.find(t => t.id === transactionId);
    if (!tx || tx.senderUid !== currentUser.id || tx.status !== 'pending_acceptance') {
      throw new Error("Transaction not found or not pending acceptance");
    }

    try {
      await updateDoc(doc(db, 'transactions', transactionId), { status: 'rejected' });
      await logActivity('CANCEL_TRANSACTION', { transactionId }, currentUser.id, currentUser.username, 'Profile');
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `transactions/${transactionId}`);
      throw error;
    }
  },

  rejectTransactionRequest: async (requestId, verdict) => {
    const { currentUser, logActivity, transactionRequests } = get();
    if (!currentUser || (currentUser.role !== 'monitor' && currentUser.role !== 'rit_chief' && currentUser.role !== 'admin')) {
      throw new Error("UNAUTHORIZED");
    }

    const req = transactionRequests.find(r => r.id === requestId);
    if (!req || req.status !== 'pending') throw new Error("Request not found or not pending");

    try {
      await updateDoc(doc(db, 'transactionRequests', requestId), { status: 'rejected' });
      await logActivity('REJECT_TRANSACTION_REQUEST', { requestId }, currentUser.id, currentUser.username, 'Monitor Workspace');
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `transactionRequests/${requestId}`);
      throw error;
    }
  },

  completeTransaction: async (transactionId) => {
    const { currentUser, logActivity, transactions } = get();
    if (!currentUser) throw new Error("UNAUTHENTICATED");

    const tx = transactions.find(t => t.id === transactionId);
    if (!tx || tx.senderUid !== currentUser.id) throw new Error("Only the sender can mark work as completed");

    try {
      await updateDoc(doc(db, 'transactions', transactionId), { status: 'awaiting_rating' });
      await logActivity('COMPLETE_TRANSACTION', { transactionId }, currentUser.id, currentUser.username, 'Profile');
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `transactions/${transactionId}`);
      throw error;
    }
  },

  submitRating: async (transactionId, senderUid, requesterUid, stars, review) => {
    const { currentUser, logActivity } = get();
    if (!currentUser) throw new Error("UNAUTHENTICATED");

    try {
      const batch = writeBatch(db);
      const ratingId = uuidv4();
      batch.set(doc(db, 'ratings', ratingId), {
        id: ratingId,
        transactionId,
        senderUid,
        requesterUid,
        stars,
        review: review || "",
        createdAt: serverTimestamp()
      });

      batch.update(doc(db, 'transactions', transactionId), {
        status: 'completed',
        rating: stars
      });

      await batch.commit();
      
      const { recalculateLeaderboard } = get();
      await recalculateLeaderboard();

      await logActivity('RATE_TRANSACTION', { transactionId, stars }, currentUser.id, currentUser.username, 'Profile');
    } catch (error: any) {
      handleFirestoreError(error, OperationType.WRITE, `ratings/${transactionId}`);
      throw error;
    }
  },

  forgiveDebt: async (borrowerId, amount) => {
    const { currentUser, users, logActivity, calculateNetLedger } = get();
    if (!currentUser) return;

    const borrower = users.find(u => u.id === borrowerId);
    if (!borrower) return;

    const lenderId = currentUser.id;
    const u1 = lenderId < borrowerId ? lenderId : borrowerId;
    const u2 = lenderId < borrowerId ? borrowerId : lenderId;
    const debtId = `${u1}_${u2}`;

    const debtRef = doc(db, 'debts', debtId);
    const debtSnap = await getDoc(debtRef);
    if (!debtSnap.exists()) return;

    const currentBalance = (debtSnap.data() as NetDebt).netBalance;
    // Forgiver (lender) is u1: balance decreases (borrower owes less).
    // Forgiver (lender) is u2: balance increases (lender owed borrower, now owes less).
    const balanceChange = lenderId === u1 ? -amount : amount;
    
    const batch = writeBatch(db);
    batch.update(debtRef, {
      netBalance: currentBalance + balanceChange,
      updatedAt: new Date().toISOString()
    });

    batch.update(doc(db, 'users', lenderId), {
      debtToMe: Math.max(0, (get().users.find(u => u.id === lenderId)?.debtToMe || 0) - amount)
    });
    batch.update(doc(db, 'users', borrowerId), {
      debtOwed: Math.max(0, borrower.debtOwed - amount)
    });

    const logId = uuidv4();
    batch.set(doc(db, 'forgivenessLogs', logId), {
      id: logId,
      forgiverId: lenderId,
      receiverId: borrowerId,
      debtsForgiven: amount,
      timestamp: new Date().toISOString()
    });

    const { recalculateLeaderboard } = get();
    await batch.commit();
    await recalculateLeaderboard();

    // Log Repayment Record
    await logActivity('DEBT_REPAYMENT_RECORDED', {
      debtRef: debtId,
      borrowerId,
      borrowerUsername: borrower.username,
      lenderId,
      lenderUsername: currentUser.username,
      amount,
      description: `@${currentUser.username} recorded repayment of ${amount} DB from @${borrower.username}.`
    }, undefined, undefined, 'Profile', 'Profile');

    // Handle major ledger shift logging
    const borrowerLedger = calculateNetLedger(borrowerId);
    if (amount >= 5) {
      await logActivity('MAJOR_LEDGER_SHIFT', {
        targetUserId: borrowerId,
        targetUsername: borrower.username,
        shiftAmount: amount,
        afterLedger: borrowerLedger.netLedger,
        description: `@${borrower.username} had a major ledger shift of +${amount} DB (Repayment/Forgiveness).`
      }, undefined, undefined, 'Profile', 'Profile');
    }

    await logActivity('FORGIVE_DEBT', { borrowerId, amount }, undefined, undefined, 'Profile');
  },

  calculateNetLedger: (userId) => {
    const { debts } = get();
    let incomingOwed = 0;
    let outgoingOwed = 0;

    debts.forEach((d) => {
      if (d.user1Id === userId) {
        if (d.netBalance > 0) {
          incomingOwed += d.netBalance;
        } else if (d.netBalance < 0) {
          outgoingOwed += Math.abs(d.netBalance);
        }
      } else if (d.user2Id === userId) {
        if (d.netBalance < 0) {
          incomingOwed += Math.abs(d.netBalance);
        } else if (d.netBalance > 0) {
          outgoingOwed += d.netBalance;
        }
      }
    });

    const netLedger = incomingOwed - outgoingOwed;
    const limitReached = netLedger <= -10;

    return {
      incomingOwed,
      outgoingOwed,
      netLedger,
      limitReached
    };
  },

  postAnnouncement: async (title, content, section) => {
    const { currentUser, logActivity } = get();
    if (!currentUser) return;
    
    // Monitors can only post to Monitoring or Resolving sections
    if ((currentUser.role === 'monitor' || currentUser.role === 'rit_chief') && section === 'GLOBAL') return;
    if (currentUser.role === 'user') return;
    
    const id = uuidv4();
    const now = new Date();
    const expiry = new Date(now.getTime() + (24 * 60 * 60 * 1000));
    
    await setDoc(doc(db, 'announcements', id), {
      id,
      title,
      content,
      section,
      authorId: currentUser.id,
      timestamp: now.toISOString(),
      expiresAt: expiry.toISOString()
    });
    await logActivity('ANNOUNCEMENT_CREATED', { title, section }, undefined, undefined, 'Monitor Workspace');
  },

  deleteAnnouncement: async (id) => {
    const { currentUser, logActivity, announcements } = get();
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'add_admin')) return;
    
    const ann = announcements.find(a => a.id === id);
    if (!ann) return;

    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'announcements', id));
    
    await logActivity('ANNOUNCEMENT_DELETED', { title: ann.title }, undefined, undefined, 'Monitor Workspace');
  },

  resetSystem: async () => {
    const { currentUser, logActivity } = get();
    if (!currentUser || currentUser.role !== 'admin') return;

    const { getDocs, query, collection, writeBatch, deleteDoc } = await import('firebase/firestore');
    
    const collectionsToReset = [
      'transactions', 'debts', 'announcements', 'resolvingDeck', 
      'anonymousComplaints', 'forgivenessLogs', 'leaderboard',
      'debtAdjustments', 'activityLogs', 'users'
    ];

    // Resetting main data collections
    for (const collName of collectionsToReset) {
      const q = query(collection(db, collName));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      snapshot.docs.forEach(d => {
        // We delete everything in the identified collections
        batch.delete(d.ref);
      });
      
      await batch.commit();
    }

    // Also clear Group Posts
    const groupIds = ['studying', 'chatting', 'resolving', 'complaints'];
    for (const gid of groupIds) {
      const gq = query(collection(db, 'groups', gid, 'posts'));
      const gSnapshot = await getDocs(gq);
      const gBatch = writeBatch(db);
      gSnapshot.docs.forEach(d => gBatch.delete(d.ref));
      await gBatch.commit();
    }

    await logActivity('DATA_CLEARED', `Master reset executed by ${currentUser.username}`, undefined, undefined, 'Master Data');
  },

  executeGlobalPurge: async () => {
    const { currentUser, logActivity } = get();
    if (!currentUser || currentUser.role !== 'admin') throw new Error("UNAUTHORIZED");

    const { getDocs, query, collection, writeBatch, doc, setDoc, serverTimestamp } = await import('firebase/firestore');

    // 1. GATHER BACKUP SNAPSHOT BEFORE PURGING ANYTHING
    const backupData: any = {
      transactionRequests: [],
      transactions: [],
      ratings: [],
      chats: [],
      complaints: [],
      logs: [],
      activity: []
    };

    const getCollectionDocs = async (collName: string) => {
      try {
        const snap = await getDocs(query(collection(db, collName)));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (err) {
        console.warn(`Backup: Failed to read collection ${collName}:`, err);
        return [];
      }
    };

    // a. transactionRequests
    backupData.transactionRequests = await getCollectionDocs('transactionRequests');

    // b. transactions (including debts, adjustments, and rewards)
    const txsList = await getCollectionDocs('transactions');
    const debtsList = await getCollectionDocs('debts');
    const debtAdjsList = await getCollectionDocs('debtAdjustments');
    const rewardsList = await getCollectionDocs('rewards');
    backupData.transactions = [
      ...txsList.map(x => ({ ...x, _collection: 'transactions' })),
      ...debtsList.map(x => ({ ...x, _collection: 'debts' })),
      ...debtAdjsList.map(x => ({ ...x, _collection: 'debtAdjustments' })),
      ...rewardsList.map(x => ({ ...x, _collection: 'rewards' }))
    ];

    // c. ratings
    const ratingsList = await getCollectionDocs('ratings');
    const txRatingsList = await getCollectionDocs('transactionRatings');
    backupData.ratings = [
      ...ratingsList.map(x => ({ ...x, _collection: 'ratings' })),
      ...txRatingsList.map(x => ({ ...x, _collection: 'transactionRatings' }))
    ];

    // d. chats (including group posts and directMessages)
    const chatsList = await getCollectionDocs('chats');
    const directMsgsList = await getCollectionDocs('directMessages');
    const groupPostsList: any[] = [];
    const groupIds = ['studying', 'chatting', 'resolving', 'complaints', 'monitoring'];
    for (const gid of groupIds) {
      try {
        const gSnap = await getDocs(query(collection(db, 'groups', gid, 'posts')));
        gSnap.docs.forEach(d => {
          groupPostsList.push({ id: d.id, groupId: gid, _collection: 'groupPosts', ...d.data() });
        });
      } catch (err) {
        console.warn(`Backup group post error for group ${gid}:`, err);
      }
    }
    backupData.chats = [
      ...chatsList.map(x => ({ ...x, _collection: 'chats' })),
      ...directMsgsList.map(x => ({ ...x, _collection: 'directMessages' })),
      ...groupPostsList
    ];

    // e. complaints (including anonymous complaints, messages, and cases)
    const complaintsList = await getCollectionDocs('complaints');
    const anonymousCompls = await getCollectionDocs('anonymousComplaints');
    const complaintMsgs = await getCollectionDocs('complaintMessages');
    const complaintChs = await getCollectionDocs('complaintChats');
    const resolvingDeck = await getCollectionDocs('resolvingDeck');
    backupData.complaints = [
      ...complaintsList.map(x => ({ ...x, _collection: 'complaints' })),
      ...anonymousCompls.map(x => ({ ...x, _collection: 'anonymousComplaints' })),
      ...complaintMsgs.map(x => ({ ...x, _collection: 'complaintMessages' })),
      ...complaintChs.map(x => ({ ...x, _collection: 'complaintChats' })),
      ...resolvingDeck.map(x => ({ ...x, _collection: 'resolvingDeck' }))
    ];

    // f. logs
    const logsList = await getCollectionDocs('logs');
    const systemLogsList = await getCollectionDocs('systemLogs');
    const forgivenessLogsList = await getCollectionDocs('forgivenessLogs');
    const specialOpsLogsList = await getCollectionDocs('specialOpsLogs');
    backupData.logs = [
      ...logsList.map(x => ({ ...x, _collection: 'logs' })),
      ...systemLogsList.map(x => ({ ...x, _collection: 'systemLogs' })),
      ...forgivenessLogsList.map(x => ({ ...x, _collection: 'forgivenessLogs' })),
      ...specialOpsLogsList.map(x => ({ ...x, _collection: 'specialOpsLogs' }))
    ];

    // g. activity (including roleRequests, bills, comments, votes, announcements)
    const activityList = await getCollectionDocs('activity');
    const activityLogsList = await getCollectionDocs('activityLogs');
    const roleReqs = await getCollectionDocs('roleRequests');
    const billsList = await getCollectionDocs('bills');
    const billCommentsList = await getCollectionDocs('billComments');
    const billStaffCommentsList = await getCollectionDocs('billStaffComments');
    const votesList = await getCollectionDocs('votes');
    const announcementsList = await getCollectionDocs('announcements');
    backupData.activity = [
      ...activityList.map(x => ({ ...x, _collection: 'activity' })),
      ...activityLogsList.map(x => ({ ...x, _collection: 'activityLogs' })),
      ...roleReqs.map(x => ({ ...x, _collection: 'roleRequests' })),
      ...billsList.map(x => ({ ...x, _collection: 'bills' })),
      ...billCommentsList.map(x => ({ ...x, _collection: 'billComments' })),
      ...billStaffCommentsList.map(x => ({ ...x, _collection: 'billStaffComments' })),
      ...votesList.map(x => ({ ...x, _collection: 'votes' })),
      ...announcementsList.map(x => ({ ...x, _collection: 'announcements' }))
    ];

    // Create system snapshot document in Firestore
    const backupTimestamp = Date.now();
    const backupDocId = `backup_${backupTimestamp}`;
    await setDoc(doc(db, 'systemBackups', backupDocId), {
      createdAt: serverTimestamp(),
      createdBy: currentUser.id,
      reason: "GLOBAL_PURGE",
      data: backupData
    });

    // 2. NOW EXECUTE THE PURGE ACROSS COLLECTIONS
    const collectionsToDelete = [
      'transactions',
      'transactionRequests',
      'ratings',
      'chats',
      'directMessages',
      'complaintMessages',
      'complaintChats',
      'complaints',
      'anonymousComplaints',
      'logs',
      'activity',
      'activityLogs',
      'forgivenessLogs',
      'specialOpsLogs',
      'bills',
      'billComments',
      'billStaffComments',
      'resolvingDeck',
      'roleRequests',
      'debtAdjustments',
      'debts',
      'votes',
      'rewards',
      'systemLogs'
    ];

    for (const collName of collectionsToDelete) {
      try {
        const q = query(collection(db, collName));
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.docs.forEach(d => {
          batch.delete(d.ref);
        });
        await batch.commit();
      } catch (err) {
        console.warn(`Could not purge collection "${collName}":`, err);
      }
    }

    // Clear Group Posts for all groupIds
    for (const gid of groupIds) {
      try {
        const gq = query(collection(db, 'groups', gid, 'posts'));
        const gSnapshot = await getDocs(gq);
        const gBatch = writeBatch(db);
        gSnapshot.docs.forEach(d => gBatch.delete(d.ref));
        await gBatch.commit();
      } catch (err) {
        console.warn(`Could not purge posts of group "${gid}":`, err);
      }
    }

    // Create entry in systemLogs
    try {
      const systemLogRef = doc(collection(db, 'systemLogs'));
      const logBatch = writeBatch(db);
      logBatch.set(systemLogRef, {
        action: "GLOBAL_PURGE",
        executedBy: currentUser.id,
        timestamp: serverTimestamp()
      });
      await logBatch.commit();
    } catch (err) {
      console.error("Failed to log purge to systemLogs:", err);
    }

    await logActivity('GLOBAL_PURGE', `Emergency Purge Cycle executed by @${currentUser.username}`, undefined, undefined, 'Master Data');
  },

  rollbackSystem: async (backupId) => {
    const { currentUser, logActivity } = get();
    if (!currentUser || currentUser.role !== 'admin') throw new Error("UNAUTHORIZED");

    const { getDoc, doc, writeBatch, collection, getDocs, query, setDoc } = await import('firebase/firestore');

    const backupRef = doc(db, 'systemBackups', backupId);
    const backupSnap = await getDoc(backupRef);
    if (!backupSnap.exists()) {
      throw new Error(`Rollback Source not found for "${backupId}"`);
    }

    const backupDoc = backupSnap.data();
    const backupData = backupDoc.data;

    // A. CLEAR CURRENT ACTIVE STATE COLLECTIONS
    const collectionsToClear = [
      'transactions',
      'transactionRequests',
      'ratings',
      'chats',
      'directMessages',
      'complaintMessages',
      'complaintChats',
      'complaints',
      'anonymousComplaints',
      'logs',
      'activity',
      'activityLogs',
      'forgivenessLogs',
      'specialOpsLogs',
      'bills',
      'billComments',
      'billStaffComments',
      'resolvingDeck',
      'roleRequests',
      'debtAdjustments',
      'debts',
      'votes',
      'rewards',
      'systemLogs',
      'announcements'
    ];

    for (const collName of collectionsToClear) {
      try {
        const q = query(collection(db, collName));
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      } catch (err) {
        console.warn(`Rollback purge collection reference failed for "${collName}":`, err);
      }
    }

    // Clear Group Posts for all groupIds
    const groupIds = ['studying', 'chatting', 'resolving', 'complaints', 'monitoring'];
    for (const gid of groupIds) {
      try {
        const gq = query(collection(db, 'groups', gid, 'posts'));
        const gSnapshot = await getDocs(gq);
        const gBatch = writeBatch(db);
        gSnapshot.docs.forEach(d => gBatch.delete(d.ref));
        await gBatch.commit();
      } catch (err) {
        console.warn(`Rollback posts clearing failed for group "${gid}":`, err);
      }
    }

    // B. REWRITE BACKUP RECORDS TO FIREBASE PRESERVING ID INTEGRITY
    const restoreRecord = async (collName: string, id: string, docData: any) => {
      try {
        const cleanData = { ...docData };
        delete cleanData._collection;
        delete cleanData.id;
        delete cleanData.groupId;
        await setDoc(doc(db, collName, id), cleanData);
      } catch (err) {
        console.error(`Rollback: Failed to write record ${id} to collection ${collName}:`, err);
      }
    };

    const restoreGroupPost = async (groupId: string, id: string, docData: any) => {
      try {
        const cleanData = { ...docData };
        delete cleanData._collection;
        delete cleanData.id;
        delete cleanData.groupId;
        await setDoc(doc(db, "groups", groupId, "posts", id), cleanData);
      } catch (err) {
        console.error(`Rollback: Failed to write group post ${id} for group ${groupId}:`, err);
      }
    };

    // 1. transactionRequests
    if (Array.isArray(backupData.transactionRequests)) {
      for (const rec of backupData.transactionRequests) {
        if (rec.id) await restoreRecord('transactionRequests', rec.id, rec);
      }
    }

    // 2. transactions combined list
    if (Array.isArray(backupData.transactions)) {
      for (const rec of backupData.transactions) {
        const targetColl = rec._collection || 'transactions';
        if (rec.id) await restoreRecord(targetColl, rec.id, rec);
      }
    }

    // 3. ratings combined list
    if (Array.isArray(backupData.ratings)) {
      for (const rec of backupData.ratings) {
        const targetColl = rec._collection || 'ratings';
        if (rec.id) await restoreRecord(targetColl, rec.id, rec);
      }
    }

    // 4. chats combined and groupPosts list
    if (Array.isArray(backupData.chats)) {
      for (const rec of backupData.chats) {
        if (rec._collection === 'groupPosts') {
          if (rec.id && rec.groupId) {
            await restoreGroupPost(rec.groupId, rec.id, rec);
          }
        } else {
          const targetColl = rec._collection || 'chats';
          if (rec.id) await restoreRecord(targetColl, rec.id, rec);
        }
      }
    }

    // 5. complaints combined list
    if (Array.isArray(backupData.complaints)) {
      for (const rec of backupData.complaints) {
        const targetColl = rec._collection || 'complaints';
        if (rec.id) await restoreRecord(targetColl, rec.id, rec);
      }
    }

    // 6. logs combined list
    if (Array.isArray(backupData.logs)) {
      for (const rec of backupData.logs) {
        const targetColl = rec._collection || 'logs';
        if (rec.id) await restoreRecord(targetColl, rec.id, rec);
      }
    }

    // 7. activity combined list
    if (Array.isArray(backupData.activity)) {
      for (const rec of backupData.activity) {
        const targetColl = rec._collection || 'activity';
        if (rec.id) await restoreRecord(targetColl, rec.id, rec);
      }
    }

    // Create system log for rollback
    try {
      const { serverTimestamp } = await import('firebase/firestore');
      const systemLogRef = doc(collection(db, 'systemLogs'));
      await setDoc(systemLogRef, {
        action: "GLOBAL_ROLLBACK",
        executedBy: currentUser.id,
        backupRestoreId: backupId,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error("Failed to log rollback to systemLogs:", err);
    }

    await logActivity('GLOBAL_ROLLBACK', `System rolled back to snapshot ${backupId} by @${currentUser.username}`, undefined, undefined, 'Master Data');
  },

  issueWarning: async (username, level, reason) => {
    const { currentUser, users, logActivity, warningRules } = get();
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'rit_chief' && currentUser.role !== 'monitor')) return;
    
    const target = users.find(u => (u.username || '').toLowerCase() === (username || '').toLowerCase());
    if (!target) throw new Error("OPERATIVE_NOT_FOUND: User does not exist.");

    const warningId = uuidv4();
    const newCount = (target.warningCount || 0) + 1;
    const derivedLevel = Math.min(newCount, 5);
    
    // Find matching rule for score deduction
    const rule = warningRules.find(r => r.level === derivedLevel) || { integrityDeduction: derivedLevel * 20 };

    const warning: Warning = {
      id: warningId,
      level: derivedLevel,
      type: 'issue',
      reason,
      issuedBy: currentUser.id,
      targetId: target.id,
      timestamp: new Date().toISOString()
    };

    const updates: Partial<UserProfile> = { 
      warningCount: newCount,
      integrityLevel: derivedLevel,
      integrityScore: Math.max(0, (target.integrityScore || 100) - rule.integrityDeduction)
    };
    
    const batch = writeBatch(db);

    if (derivedLevel === 1) {
      // Just a warning record
    } else if (derivedLevel === 2) {
      updates.communityServicesNeeded = (target.communityServicesNeeded || 0) + 2;
    } else if (derivedLevel === 3) {
      const restrictedUntil = new Date();
      restrictedUntil.setDate(restrictedUntil.getDate() + 21);
      updates.restrictedUntil = restrictedUntil.toISOString();
    } else if (derivedLevel === 4) {
      const restrictedUntil = new Date();
      restrictedUntil.setMonth(restrictedUntil.getMonth() + 1);
      updates.restrictedUntil = restrictedUntil.toISOString();
      updates.debtToMe = 0;
      updates.debtOwed = 0;
      
      const debtorRelations = get().debts.filter(d => d.user1Id === target.id || d.user2Id === target.id);
      debtorRelations.forEach(rel => {
        batch.update(doc(db, 'debts', rel.id), { netBalance: 0, updatedAt: new Date().toISOString() });
      });
    } else if (derivedLevel >= 5) {
      updates.isPermanentlyRemoved = true;
    }
    
    batch.update(doc(db, 'users', target.id), updates);
    batch.set(doc(db, 'users', target.id, 'warnings', warningId), warning);
    
    await batch.commit();
    await logActivity('WARNING_ISSUED', { level: derivedLevel, reason, target: target.username }, undefined, undefined, 'Monitor Workspace');
  },

  revokeWarning: async (userId: string, warningId: string) => {
    const { currentUser, users } = get();
    if (!currentUser || currentUser.role !== 'admin') throw new Error("UNAUTHORIZED: Admin Access Required.");

    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) throw new Error("USER_NOT_FOUND");

    try {
      const currentWarning = targetUser.warningCount || 0;
      const newLevel = Math.max(0, currentWarning - 1);

      // Update user
      await updateDoc(doc(db, "users", userId), {
        warningCount: newLevel,
        integrityLevel: newLevel
      });

      // Add subcollection history (DO NOT delete old warnings)
      await addDoc(collection(db, "users", userId, "warnings"), {
        id: warningId,
        type: "revoke",
        previousLevel: currentWarning,
        newLevel: newLevel,
        reason: "Admin revoke",
        revokedBy: auth.currentUser?.uid,
        timestamp: serverTimestamp()
      });

      // Log globally
      await get().logActivity("WARNING_REVOKED", { target: targetUser.username, warningId }, userId, targetUser.username, "system", "Monitor Workspace");

    } catch (e: any) {
      console.error("Revoke failed:", e);
      throw e;
    }
  },

  updateWarningRules: async (rules) => {
    const { currentUser, logActivity } = get();
    if (!currentUser || currentUser.role !== 'admin') throw new Error("UNAUTHORIZED");

    await setDoc(doc(db, 'systemConfig', 'warningRules'), { rules });
    await logActivity('WARNING_RULES_UPDATED', { ruleCount: rules.length }, undefined, undefined, 'Monitor Workspace');
  },

  resolveBill: async (billId, verdictText) => {
    const { currentUser, logActivity, bills } = get();
    if (!currentUser || currentUser.role !== 'admin') return;

    const bill = bills.find(b => b.id === billId);
    if (!bill) return;

    try {
      await updateDoc(doc(db, 'bills', billId), { 
        status: 'resolved',
        verdict: verdictText
      });
      await logActivity('RESOLVE_BILL', { billId }, undefined, undefined, 'Monitor Workspace');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `bills/${billId}`);
    }
  },

  recalculateLeaderboard: async () => {
    try {
      const { transactions, forgivenessLogs, users } = get();
      
      const approvedTx = transactions.filter(t => t.status === 'completed' || t.status === 'active' || t.status === 'awaiting_rating' || t.status === 'pending_acceptance');
      const approvedCS = approvedTx.filter(t => t.freeWork);
      
      // Community Carer
      const carerMap: Record<string, number> = {};
      approvedCS.forEach(t => {
        const sender = t.senderUid;
        const amt = t.amount || 0;
        if (sender) carerMap[sender] = (carerMap[sender] || 0) + amt;
      });
      forgivenessLogs.forEach(f => {
        carerMap[f.forgiverId] = (carerMap[f.forgiverId] || 0) + f.debtsForgiven;
      });
      
      // Compute weighted reputation score for all users
      const userScores = users.map(u => {
        const userCompletedTx = transactions.filter(t => t.senderUid === u.id && t.status === 'completed');
        const userActiveTx = transactions.filter(t => t.senderUid === u.id && t.status === 'active');
        const userAwaitingRatingTx = transactions.filter(t => t.senderUid === u.id && t.status === 'awaiting_rating');
        
        const completedCount = userCompletedTx.length;
        const totalCount = completedCount + userActiveTx.length + userAwaitingRatingTx.length;
        
        const avgRating = u.ratingAverage || 0;
        const completionRate = totalCount > 0 ? (completedCount / totalCount) : 1;
        const reliability = completionRate * 5; // styled out of 5
        const warningCount = u.warningCount ?? u.warnings ?? 0;
        const warningPenalties = warningCount * 1.0;
        
        const score = avgRating + completedCount - warningPenalties;
        
        return {
          id: u.id,
          username: u.username,
          score,
          avgRating,
          completedCount,
          reliability
        };
      });

      // Find top sender according to Completed Count (Sender of the Month)
      let topSenderId: string | null = null;
      let maxCompleted = 0;
      users.forEach(u => {
        const completedCount = transactions.filter(t => t.senderUid === u.id && t.status === 'completed').length;
        if (completedCount > maxCompleted) {
          maxCompleted = completedCount;
          topSenderId = u.id;
        }
      });

      // Find tops for Community Carer
      let topCarerId: string | null = null;
      let maxCarer = 0;
      Object.entries(carerMap).forEach(([uid, val]) => {
        if (val > maxCarer) {
          maxCarer = val;
          topCarerId = uid;
        }
      });

      // Best Rating (Minimum rating threshold)
      let topRatingId: string | null = null;
      let maxRating = 0;
      users.forEach(u => {
        const count = u.ratingCount || 0;
        if (count >= 2 && u.ratingAverage > maxRating) {
          maxRating = u.ratingAverage;
          topRatingId = u.id;
        }
      });
      // Fallback to u.ratingCount >= 1 if no user has >= 2 rating count
      if (!topRatingId) {
        users.forEach(u => {
          const count = u.ratingCount || 0;
          if (count >= 1 && u.ratingAverage > maxRating) {
            maxRating = u.ratingAverage;
            topRatingId = u.id;
          }
        });
      }

      const topSenderUser = users.find(u => u.id === topSenderId);

      const lbDoc: Leaderboard = {
        communityCarer: topCarerId ? {
          userId: topCarerId,
          username: users.find(u => u.id === topCarerId)?.username || 'Unknown',
          totalContribution: maxCarer
        } : null,
        bestSender: topRatingId ? {
          userId: topRatingId,
          username: users.find(u => u.id === topRatingId)?.username || 'Unknown',
          averageRating: maxRating
        } : null,
        senderOfTheMonth: topSenderId ? {
          userId: topSenderId,
          username: topSenderUser?.username || 'Unknown',
          totalDebts: maxCompleted
        } : null,
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'leaderboard', 'current'), lbDoc);
    } catch (e) {
      console.error("Leaderboard Recalculation Failed:", e);
    }
  },

  createResolvingCase: async (description, involvedUsers) => {
    const { currentUser, logActivity } = get();
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'rit_chief' && currentUser.role !== 'monitor')) return;

    try {
      const id = uuidv4();
      await setDoc(doc(db, 'resolvingDeck', id), {
        id,
        involvedUsers,
        description,
        status: 'under_investigation',
        createdBy: currentUser.id,
        timestamp: new Date().toISOString()
      });
      await logActivity('CREATE_CASE', { caseId: id, involvedUsers }, undefined, undefined, 'Monitor Workspace');
    } catch (error: any) {
      console.error("CREATE_CASE_ERROR:", error);
      throw error;
    }
  },

  updateSystemStatus: async (level) => {
    const { currentUser, logActivity } = get();
    if (!currentUser || currentUser.role !== 'admin') return;

    await setDoc(doc(db, 'systemStatus', 'current'), {
      emergencyLevel: level,
      updatedBy: currentUser.id,
      timestamp: new Date().toISOString()
    });
    await logActivity('UPDATE_SYSTEM_STATUS', { emergencyLevel: level }, undefined, undefined, 'Monitor Workspace');
  },

  createBill: async (title, category, description, priority) => {
    const { currentUser, logActivity } = get();
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'rit_chief' && currentUser.role !== 'monitor')) return;

    try {
      const billId = uuidv4();
      const bill: Bill = {
        id: billId,
        title,
        category,
        description,
        proposedBy: currentUser.username,
        createdBy: currentUser.id,
        priority,
        status: 'active',
        createdAt: serverTimestamp(),
        timestamp: new Date().toISOString()
      };

      await setDoc(doc(db, 'bills', billId), bill);
      await logActivity('BILL_FILED', { title, category, priority }, undefined, undefined, 'Monitor Workspace');
    } catch (error: any) {
      console.error("CREATE_BILL_ERROR:", error);
      throw error;
    }
  },

  updateBill: async (billId, title, description) => {
    const { currentUser, logActivity } = get();
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'rit_chief' && currentUser.role !== 'monitor')) return;

    try {
      await updateDoc(doc(db, 'bills', billId), {
        title,
        description,
        lastEditedBy: currentUser.id,
        timestamp: new Date().toISOString()
      });
      await logActivity('BILL_EDITED', { title }, undefined, undefined, 'Monitor Workspace');
    } catch (error: any) {
      console.error("UPDATE_BILL_ERROR:", error);
      throw error;
    }
  },

  postBillComment: async (billId, message) => {
    const { currentUser } = get();
    if (!currentUser) return;

    const commentId = uuidv4();
    const comment: BillComment = {
      id: commentId,
      userId: currentUser.id,
      message,
      timestamp: new Date().toISOString()
    };

    await setDoc(doc(db, 'bills', billId, 'comments', commentId), comment);
    await get().logActivity('BILL_COMMENT', { billId, preview: message.substring(0, 30) }, undefined, undefined, 'Monitor Workspace');
  },

  postBillStaffComment: async (billId, message) => {
    const { currentUser } = get();
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'rit_chief' && currentUser.role !== 'monitor')) return;

    const commentId = uuidv4();
    const comment: BillStaffComment = {
      id: commentId,
      userId: currentUser.id,
      role: currentUser.role,
      message,
      timestamp: new Date().toISOString()
    };

    await setDoc(doc(db, 'bills', billId, 'staffComments', commentId), comment);
    await get().logActivity('BILL_STAFF_COMMENT', { billId, preview: message.substring(0, 30) }, undefined, undefined, 'Monitor Workspace');
  },

  submitAnonymousComplaint: async (message, category, source) => {
    const id = uuidv4();
    const complainantUid = auth.currentUser?.uid || null;
    try {
      await setDoc(doc(db, 'anonymousComplaints', id), {
        id,
        message,
        category: category || "General",
        createdAt: new Date().toISOString(),
        status: 'pending',
        source,
        assignedTo: null,
        assignedMonitorId: null,
        assignedMonitorName: null,
        anonymousThreadId: null,
        complainantUid,
        internalNotes: ''
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `anonymousComplaints/${id}`);
    }
  },

  updateAnonymousComplaintStatus: async (id, status) => {
    const { currentUser, logActivity } = get();
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'rit_chief' && currentUser.role !== 'monitor')) {
      throw new Error("UNAUTHORIZED");
    }
    try {
      await updateDoc(doc(db, 'anonymousComplaints', id), { status });
      await logActivity('UPDATE_COMPLAINT_STATUS', { id, status }, undefined, undefined, 'Complaints Workspace');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `anonymousComplaints/${id}`);
    }
  },

  assignAnonymousComplaint: async (id, monitorId) => {
    const { currentUser, logActivity, users } = get();
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'rit_chief' && currentUser.role !== 'monitor')) {
      throw new Error("UNAUTHORIZED");
    }
    try {
      const monitorUser = users.find(u => u.id === monitorId);
      const monitorName = monitorUser ? `@${monitorUser.username}` : null;
      await updateDoc(doc(db, 'anonymousComplaints', id), { 
        assignedTo: monitorId,
        assignedMonitorId: monitorId,
        assignedMonitorName: monitorName
      });
      await logActivity('ASSIGN_COMPLAINT', { id, assignedTo: monitorId }, undefined, undefined, 'Complaints Workspace');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `anonymousComplaints/${id}`);
    }
  },

  updateAnonymousComplaintNotes: async (id, notes) => {
    const { currentUser, logActivity } = get();
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'rit_chief' && currentUser.role !== 'monitor')) {
      throw new Error("UNAUTHORIZED");
    }
    try {
      await updateDoc(doc(db, 'anonymousComplaints', id), { internalNotes: notes });
      await logActivity('UPDATE_COMPLAINT_NOTES', { id }, undefined, undefined, 'Complaints Workspace');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `anonymousComplaints/${id}`);
    }
  },

  deleteAnonymousComplaint: async (id) => {
    const { currentUser, logActivity } = get();
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'rit_chief' && currentUser.role !== 'monitor')) {
      throw new Error("UNAUTHORIZED");
    }
    try {
      await deleteDoc(doc(db, 'anonymousComplaints', id));
      await logActivity('DELETE_COMPLAINT', { id }, undefined, undefined, 'Complaints Workspace');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `anonymousComplaints/${id}`);
    }
  },

  claimAnonymousComplaint: async (id) => {
    const { currentUser, logActivity } = get();
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'rit_chief' && currentUser.role !== 'monitor')) {
      throw new Error("UNAUTHORIZED");
    }
    try {
      const monitorId = currentUser.id;
      const monitorName = `@${currentUser.username}`;
      await updateDoc(doc(db, 'anonymousComplaints', id), {
        assignedTo: monitorId,
        assignedMonitorId: monitorId,
        assignedMonitorName: monitorName
      });
      await logActivity('CLAIM_COMPLAINT', { id }, undefined, undefined, 'Complaints Workspace');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `anonymousComplaints/${id}`);
    }
  },

  openAnonymousLine: async (id) => {
    const { currentUser, logActivity } = get();
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'rit_chief' && currentUser.role !== 'monitor')) {
      throw new Error("UNAUTHORIZED");
    }
    try {
      await updateDoc(doc(db, 'anonymousComplaints', id), {
        anonymousThreadId: id
      });
      await logActivity('OPEN_ANONYMOUS_LINE', { id }, undefined, undefined, 'Complaints Workspace');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `anonymousComplaints/${id}`);
    }
  },

  sendAnonymousChatMessage: async (threadId, message, senderType) => {
    const id = uuidv4();
    try {
      await setDoc(doc(db, 'anonymousComplaintChats', id), {
        id,
        threadId,
        senderType,
        message,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `anonymousComplaintChats/${id}`);
    }
  },

  requestRole: async (requestedRole) => {
    const { currentUser, logActivity } = get();
    if (!currentUser) return;
    
    // Prevent redundant requests
    if (currentUser.requestedRole === requestedRole) {
      alert("Application for this role is already pending.");
      return;
    }

    const requestId = uuidv4();
    const batch = writeBatch(db);
    
    batch.set(doc(db, 'roleRequests', requestId), {
      id: requestId,
      userId: currentUser.id,
      username: currentUser.username,
      requestedRole,
      status: 'pending',
      timestamp: new Date().toISOString()
    } as RoleRequest);

    batch.update(doc(db, 'users', currentUser.id), {
      requestedRole
    });

    await batch.commit();
    await logActivity('ROLE_REQUEST', `Applied for ${requestedRole} role`, undefined, undefined, 'Profile');
  },

  resolveRoleRequest: async (requestId, approved) => {
    const { currentUser, roleRequests, logActivity } = get();
    if (!currentUser || currentUser.role !== 'admin') return;

    const request = roleRequests.find(r => r.id === requestId);
    if (!request || request.status !== 'pending') return;

    const batch = writeBatch(db);
    
    batch.update(doc(db, 'roleRequests', requestId), {
      status: approved ? 'approved' : 'rejected'
    });

    if (approved) {
      batch.update(doc(db, 'users', request.userId), {
        role: request.requestedRole,
        requestedRole: null
      });
    } else {
      batch.update(doc(db, 'users', request.userId), {
        requestedRole: null
      });
    }

    await batch.commit();
    await logActivity('ROLE_RESOLVED', { requestId, approved, target: request.username }, undefined, undefined, 'Monitor Workspace');
  },

  deleteUser: async (userId) => {
    const { currentUser, logActivity, users } = get();
    if (!currentUser || currentUser.role !== 'admin') throw new Error("UNAUTHORIZED: Access Denied.");
    
    const target = users.find(u => u.id === userId);
    if (!target) throw new Error("NOT_FOUND: Subject not identified.");

    const batch = writeBatch(db);
    batch.delete(doc(db, 'users', userId));
    await batch.commit();
    
    await logActivity('USER_DELETED', { 
      subject: target.username, 
      id: userId,
      executor: currentUser.username 
    }, undefined, undefined, 'Master Data');
  },

  updateUsername: async (newUsername) => {
    const { currentUser, logActivity } = get();
    if (!currentUser || !auth.currentUser) throw new Error("NOT_AUTHENTICATED");
    
    const trimmed = newUsername.trim().toLowerCase();
    if (trimmed.length < 3) throw new Error("Username too short");
    if (trimmed === currentUser.username.toLowerCase()) return;

    // Uniqueness check
    const q = query(collection(db, 'users'), where('username', '==', trimmed));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) throw new Error("Username already taken");

    try {
      // Sync Auth Email for login consistency
      const user = auth.currentUser;
      const newEmail = `${trimmed}@debtflow.com`;
      await updateEmail(user, newEmail);
      
      await updateDoc(doc(db, 'users', currentUser.id), {
        username: trimmed
      });

      await logActivity('USERNAME_CHANGED', { old: currentUser.username, new: trimmed }, undefined, undefined, 'Profile');
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        throw new Error("Security verification required. Please log out and back in, or change password first to refresh session.");
      }
      throw error;
    }
  },

  updatePassword: async (currentPassword, newPassword) => {
    const { currentUser, logActivity } = get();
    if (!currentUser || !auth.currentUser) throw new Error("NOT_AUTHENTICATED");
    
    if (newPassword.length < 6) throw new Error("Password must be at least 6 characters");

    const user = auth.currentUser;
    const credential = EmailAuthProvider.credential(user.email!, currentPassword);

    try {
      await reauthenticateWithCredential(user, credential);
      await updateAuthPassword(user, newPassword);
      await logActivity('PASSWORD_CHANGED', `Password updated for @${currentUser.username}`, undefined, undefined, 'Profile');
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        throw new Error("Current password incorrect");
      }
      throw error;
    }
  },

  updateRolesConfig: async (admins, monitors) => {
    const { currentUser, logActivity } = get();
    if (!currentUser || currentUser.role !== 'admin') return;
    
    await setDoc(doc(db, 'roles_config', 'global'), {
      admins,
      monitors
    });
    await logActivity('ROLES_CONFIG_UPDATED', { admins, monitors }, undefined, undefined, 'Monitor Workspace');
  },

  updateUserRole: async (userId, newRole) => {
    const { currentUser, logActivity, users } = get();
    if (!currentUser || currentUser.role !== 'admin') throw new Error("UNAUTHORIZED: Admin access required.");
    
    const target = users.find(u => u.id === userId);
    if (!target) throw new Error("User not found.");

    const oldRole = target.role;
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      
      let action = 'ROLE_UPDATED';
      if (!oldRole || oldRole === 'user') action = 'ROLE_ASSIGNED';
      if (newRole === 'user') action = 'ROLE_REVOKED';
      
      await logActivity(action, { target: target.username, oldRole, newRole }, undefined, undefined, 'Monitor Workspace');

      // Force token refresh if current user updated their own role
      if (auth.currentUser && auth.currentUser.uid === userId) {
        await auth.currentUser.getIdToken(true);
      }
    } catch (error) {
       console.error("ROLE_UPDATE_ERROR:", error);
       handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  },

  approvePendingRequest: async (requestId: string) => {
    const { currentUser, logActivity } = get();
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error("UNAUTHORIZED: Only sovereign admins can validate requests.");
    }

    const docRef = doc(db, 'pendingAccountRequests', requestId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error("Approval request not found.");

    const requestData = docSnap.data();
    if (requestData.status !== 'pending') {
      throw new Error(`Request has already been evaluated: ${requestData.status}`);
    }

    const { username, generatedEmail, password, requestedRole } = requestData;

    const { initializeApp, deleteApp } = await import('firebase/app');
    const { getAuth, createUserWithEmailAndPassword, signOut: secondarySignOut } = await import('firebase/auth');

    // Create secondary app instance
    const secondaryApp = initializeApp(firebaseConfig, `SecondaryApp_${requestId}`);
    const secondaryAuth = getAuth(secondaryApp);

    let uid = '';
    try {
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, generatedEmail, password);
      uid = userCredential.user.uid;
      await secondarySignOut(secondaryAuth);
      await deleteApp(secondaryApp);
    } catch (authError: any) {
      try { await deleteApp(secondaryApp); } catch {}
      throw new Error(`Auth creation failed: ${authError.message}`);
    }

    try {
      const userDocRef = doc(db, 'users', uid);
      const mappedRole: UserRole = requestedRole === 'Monitor' ? 'monitor' : requestedRole === 'Admin' ? 'admin' : 'user';

      const newUserDoc = {
        id: uid,
        uid: uid,
        username: username,
        email: generatedEmail,
        role: mappedRole,
        requestedRole: null,
        status: 'active',
        approved: true,
        warningCount: 0,
        warnings: 0,
        integrityScore: 100,
        integrity: 100,
        integrityLevel: 0,
        debtOwed: 0,
        debtToMe: 0,
        ratingAverage: 5,
        ratingCount: 0,
        rating: 5,
        totalLendingTransactions: 0,
        isPermanentlyRemoved: false,
        communityServicesNeeded: 0,
        specialOpsAccess: false,
        hasCompletedTutorial: false,
        createdAt: serverTimestamp()
      };

      // Atomic update
      const batch = writeBatch(db);
      batch.set(userDocRef, newUserDoc);
      batch.update(docRef, { status: 'approved' });
      await batch.commit();

      await logActivity('ACCOUNT_APPROVED', { username, requestedRole, uid }, undefined, undefined, 'Admin Term');
    } catch (err: any) {
      console.error("Approval Firestore Batch Failed:", err);
      throw new Error(`Database record initialization failed: ${err.message}`);
    }
  },

  rejectPendingRequest: async (requestId: string) => {
    const { currentUser, logActivity } = get();
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error("UNAUTHORIZED: Only sovereign admins can validate requests.");
    }

    const docRef = doc(db, 'pendingAccountRequests', requestId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error("Approval request not found.");

    const requestData = docSnap.data();
    if (requestData.status !== 'pending') {
      throw new Error(`Request has already been evaluated: ${requestData.status}`);
    }

    // Mark pending request status as 'rejected'
    await updateDoc(docRef, { status: 'rejected' });

    // Log administrative action
    await logActivity('ACCOUNT_REJECTED', { username: requestData.username, requestedRole: requestData.requestedRole }, undefined, undefined, 'Admin Term');
  },

  toggleUserSuspension: async (userId: string) => {
    const { currentUser, logActivity, users } = get();
    if (!currentUser || currentUser.role !== 'admin') throw new Error("UNAUTHORIZED: Admin access required.");
    
    const target = users.find(u => u.id === userId);
    if (!target) throw new Error("User not found in registry.");

    const newStatus = target.status === 'suspended' ? 'active' : 'suspended';
    await updateDoc(doc(db, 'users', userId), { status: newStatus });
    await logActivity(newStatus === 'suspended' ? 'USER_SUSPENDED' : 'USER_ACTIVATED', { targetId: userId, username: target.username }, undefined, undefined, 'Admin Term');
  },

  updateUserStats: async (userId: string, integrity: number, warnings: number) => {
    const { currentUser, logActivity, users } = get();
    if (!currentUser || currentUser.role !== 'admin') throw new Error("UNAUTHORIZED: Admin access required.");

    const target = users.find(u => u.id === userId);
    if (!target) throw new Error("User not found in registry.");

    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, {
      integrity: Number(integrity),
      integrityScore: Number(integrity),
      warningCount: Number(warnings),
      warnings: Number(warnings),
      integrityLevel: Number(warnings)
    });

    await logActivity('ADMIN_STATS_UPDATE', { 
      targetUserId: userId, 
      targetUsername: target.username, 
      integrity: Number(integrity), 
      warnings: Number(warnings) 
    }, undefined, undefined, 'Admin Term');
  },

  updateRolePermissions: async (roleId, permissions) => {
    const { currentUser, logActivity } = get();
    if (!currentUser || currentUser.role !== 'admin') throw new Error("UNAUTHORIZED");

    await setDoc(doc(db, 'roles', roleId), { permissions }, { merge: true });
    await logActivity('PERMISSIONS_UPDATED', { roleId, permissions }, undefined, undefined, 'Monitor Workspace');
  },

  approveDebtAdjustment: async (adjId) => {
    const { currentUser, users, logActivity } = get();
    if (!currentUser || (currentUser.role !== 'monitor' && currentUser.role !== 'admin')) {
      throw new Error("UNAUTHORIZED: Monitor or Admin access required.");
    }

    const adj = get().debtAdjustments.find(a => a.id === adjId);
    if (!adj || adj.status !== 'REQUESTED') {
      throw new Error("Active requested adjustment not found");
    }

    const lenderId = adj.lenderId;
    const borrowerId = adj.borrowerId;
    const amount = adj.amount;

    const borrower = users.find(u => u.id === borrowerId);
    if (!borrower) throw new Error("Borrower details not found");

    const u1 = lenderId < borrowerId ? lenderId : borrowerId;
    const u2 = lenderId < borrowerId ? borrowerId : lenderId;
    const debtId = `${u1}_${u2}`;

    const debtRef = doc(db, 'debts', debtId);
    const debtSnap = await getDoc(debtRef);
    if (!debtSnap.exists()) throw new Error("Debt ledger entry not found");

    const currentBalance = (debtSnap.data() as any).netBalance;
    const balanceChange = lenderId === u1 ? -amount : amount;

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'debtAdjustments', adjId), {
        status: 'APPROVED',
        resolvedAt: new Date().toISOString(),
        resolvedBy: currentUser.id
      });

      batch.update(debtRef, {
        netBalance: currentBalance + balanceChange,
        updatedAt: new Date().toISOString()
      });

      batch.update(doc(db, 'users', lenderId), {
        debtToMe: Math.max(0, (get().users.find(u => u.id === lenderId)?.debtToMe || 0) - amount)
      });
      batch.update(doc(db, 'users', borrowerId), {
        debtOwed: Math.max(0, borrower.debtOwed - amount)
      });

      const logId = uuidv4();
      batch.set(doc(db, 'forgivenessLogs', logId), {
        id: logId,
        forgiverId: lenderId,
        borrowerId: borrowerId,
        amount: amount,
        timestamp: new Date().toISOString(),
        source: 'Adjustment Approval'
      });

      await batch.commit();
      await logActivity('DEBT_FORGIVENESS_APPROVED', { adjId, borrowerId, amount }, undefined, undefined, 'Monitor Workspace');
    } catch (error: any) {
      console.error("APPROVE_DEBT_ADJUSTMENT_FAILED:", error);
      throw error;
    }
  },

  rejectDebtAdjustment: async (adjId) => {
    const { currentUser, logActivity } = get();
    if (!currentUser || (currentUser.role !== 'monitor' && currentUser.role !== 'admin')) {
      throw new Error("UNAUTHORIZED: Monitor or Admin access required.");
    }

    const adj = get().debtAdjustments.find(a => a.id === adjId);
    if (!adj || adj.status !== 'REQUESTED') {
      throw new Error("Active requested adjustment not found");
    }

    try {
      await updateDoc(doc(db, 'debtAdjustments', adjId), {
        status: 'REJECTED',
        resolvedAt: new Date().toISOString(),
        resolvedBy: currentUser.id
      });
      await logActivity('DEBT_FORGIVENESS_REJECTED', { adjId }, undefined, undefined, 'Monitor Workspace');
    } catch (error: any) {
      console.error("REJECT_DEBT_ADJUSTMENT_FAILED:", error);
      throw error;
    }
  },

  logSpecialOps: async (action, details) => {
    const { currentUser, hasSpecialAccess } = get();
    if (!currentUser || !hasSpecialAccess) return;
    
    const logId = uuidv4();
    await setDoc(doc(db, 'specialOpsLogs', logId), {
      id: logId,
      userId: currentUser.id,
      username: currentUser.username,
      action,
      details,
      timestamp: Timestamp.now()
    });
  },

  grantSpecialAccess: async (userId) => {
    const { currentUser, isSpyOwner } = get();
    // Only current special ops owner can grant absolute legacy access
    if (!isSpyOwner) throw new Error("UNAUTHORIZED");

    await setDoc(doc(db, 'specialAccess', userId), {
      access: true,
      assignedBy: currentUser?.id || 'system',
      timestamp: new Date().toISOString()
    });
    
    await get().logSpecialOps('ACCESS_GRANTED', { targetId: userId });
  },

  addToSpyNetwork: async (userId, role) => {
    const { isSpyOwner, logSpecialOps } = get();
    if (!isSpyOwner) throw new Error("UNAUTHORIZED: Only the Spy Ops Owner can manage membership.");
    
    await setDoc(doc(db, 'spyNetwork', userId), {
      id: userId,
      userId,
      role,
      active: true,
      addedBy: SPY_OWNER_ID,
      timestamp: new Date().toISOString()
    });
    await logSpecialOps('MEMBER_ADDED', { userId, role });
  },

  removeFromSpyNetwork: async (memberId) => {
    const { isSpyOwner, logSpecialOps } = get();
    if (!isSpyOwner) throw new Error("UNAUTHORIZED");
    
    await updateDoc(doc(db, 'spyNetwork', memberId), { active: false });
    await logSpecialOps('MEMBER_DEACTIVATED', { memberId });
  },

  toggleSpyNetworkActive: async (memberId, active) => {
    const { isSpyOwner, logSpecialOps } = get();
    if (!isSpyOwner) throw new Error("UNAUTHORIZED");
    
    await updateDoc(doc(db, 'spyNetwork', memberId), { active });
    await logSpecialOps('MEMBER_STATUS_TOGGLED', { memberId, active });
  },

  setSpecialOpsMode: (val) => {
    set({ specialOpsMode: val });
  },

  updateSpecialOpsAccess: async (userId, access) => {
    const { currentUser, logActivity, users } = get();
    if (!currentUser || currentUser.role !== 'admin') throw new Error("UNAUTHORIZED: Admin access required.");

    const target = users.find(u => u.id === userId);
    if (!target) throw new Error("User not found.");

    try {
      await updateDoc(doc(db, 'users', userId), { specialOpsAccess: access });
      await logActivity(
        access ? 'SPECIAL_OPS_GRANTED' : 'SPECIAL_OPS_REVOKED',
        { target: target.username },
        undefined,
        undefined,
        'Monitor Workspace'
      );
    } catch (error) {
      console.error("SPECIAL_OPS_ACCESS_UPDATE_ERROR:", error);
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  },

  addInternalNote: async (caseId, content) => {
    const { currentUser, hasSpecialAccess, logSpecialOps } = get();
    if (!currentUser || !hasSpecialAccess) throw new Error("UNAUTHORIZED");

    const noteId = uuidv4();
    await setDoc(doc(db, 'internalNotes', noteId), {
      id: noteId,
      caseId,
      authorId: currentUser.id,
      content,
      timestamp: new Date().toISOString()
    });
    await logSpecialOps('NOTE_ADDED', { caseId });
  },

  recruitUser: async (userId, task, reward, durationHours) => {
    const { currentUser, hasSpecialAccess, logSpecialOps } = get();
    if (!currentUser || !hasSpecialAccess) throw new Error("UNAUTHORIZED");

    const recruitmentId = uuidv4();
    const duration = new Date();
    duration.setHours(duration.getHours() + durationHours);

    await setDoc(doc(db, 'recruitments', recruitmentId), {
      id: recruitmentId,
      recruitedUserId: userId,
      task,
      reward,
      duration: duration.toISOString(),
      assignedBy: currentUser.id,
      status: 'active',
      timestamp: new Date().toISOString()
    });
    
    // Grant temporary special access
    await setDoc(doc(db, 'specialAccess', userId), {
      access: true,
      isRecruit: true,
      recruitmentId,
      expiresAt: duration.toISOString()
    });

    await logSpecialOps('USER_RECRUITED', { userId, task, durationHours });
  },

  revokeRecruitment: async (recruitmentId) => {
    const { currentUser, hasSpecialAccess, logSpecialOps, recruitments } = get();
    if (!currentUser || !hasSpecialAccess) throw new Error("UNAUTHORIZED");

    const rec = recruitments.find(r => r.id === recruitmentId);
    if (!rec) return;

    await updateDoc(doc(db, 'recruitments', recruitmentId), { status: 'revoked' });
    await deleteDoc(doc(db, 'specialAccess', rec.recruitedUserId));
    
    await logSpecialOps('RECRUITMENT_REVOKED', { userId: rec.recruitedUserId });
  },

  claimReward: async (rewardId, choice) => {
    const { currentUser, logActivity, rewards } = get();
    if (!currentUser) throw new Error("UNAUTHORIZED");

    const reward = rewards.find(r => r.id === rewardId);
    if (!reward || reward.claimed || reward.userId !== currentUser.id) {
       throw new Error("REWARD_INVALID: Reward already claimed or not for this user.");
    }

    const batch = writeBatch(db);
    const userRef = doc(db, 'users', currentUser.id);

    if (choice === 'debt_clear') {
      batch.update(userRef, { debtOwed: 0 });
    } else if (choice === 'warning_revoke') {
      const currentLevel = currentUser.integrityLevel || 0;
      batch.update(userRef, { 
        integrityLevel: Math.max(0, currentLevel - 1),
        warningCount: Math.max(0, (currentUser.warningCount || 0) - 1)
      });
    }

    batch.update(doc(db, 'rewards', rewardId), {
      claimed: true,
      rewardChosen: choice,
      timestamp: new Date().toISOString()
    });

    await batch.commit();
    await logActivity('REWARD_CLAIMED', { rewardId, choice, type: reward.type }, undefined, undefined, 'Profile');
  },

  postToGroup: async (groupId, content) => {
    const { currentUser, logActivity } = get();
    if (!currentUser) return;
    
    if (groupId === 'monitoring' && currentUser.role !== 'monitor' && currentUser.role !== 'rit_chief' && currentUser.role !== 'admin') return;
    
    const id = uuidv4();
    await setDoc(doc(db, 'groups', groupId, 'posts', id), {
      id,
      groupId,
      authorId: currentUser.id,
      content,
      timestamp: new Date().toISOString()
    });
    await logActivity('GROUP_POST', `Posted to ${groupId}`, undefined, undefined, 'Groups');
  },

  // Unified Vote System
  createVote: async (title, type, options, isAnonymous) => {
    const { currentUser, logActivity } = get();
    if (!currentUser || currentUser.role !== 'admin') throw new Error("UNAUTHORIZED: Admin only.");

    const voteId = uuidv4();
    // NOTA is mandatory
    const normalizedOptions = options.map(o => o.trim()).filter(o => o !== "" && o !== "NOTA");
    const finalOptions = [...normalizedOptions, "NOTA"];
    
    try {
      await setDoc(doc(db, 'votes', voteId), {
        id: voteId,
        title,
        type,
        options: finalOptions,
        isAnonymous,
        status: 'active',
        createdBy: currentUser.id,
        createdAt: serverTimestamp(),
        totalVotes: 0
      });

      await logActivity('VOTE_CREATED', { title, type, isAnonymous }, undefined, undefined, 'Vote System');
    } catch (error) {
       handleFirestoreError(error, OperationType.CREATE, `votes/${voteId}`);
    }
  },

  submitVote: async (voteId, option) => {
    const { currentUser, logActivity } = get();
    if (!currentUser) throw new Error("UNAUTHORIZED");

    try {
      const voteRef = doc(db, 'votes', voteId, 'responses', currentUser.id);
      await setDoc(voteRef, {
        id: currentUser.id,
        selectedOption: option,
        votedAt: serverTimestamp(),
        username: currentUser.username
      });
      await logActivity('VOTE_SUBMITTED', { voteId, option }, undefined, undefined, 'Vote System');
    } catch (error: any) {
      handleFirestoreError(error, OperationType.WRITE, `votes/${voteId}/responses/${currentUser.id}`);
    }
  },

  closeVote: async (voteId) => {
    const { currentUser, logActivity } = get();
    if (!currentUser || currentUser.role !== 'admin') throw new Error("UNAUTHORIZED");

    try {
      const responsesRef = collection(db, 'votes', voteId, 'responses');
      const snapshot = await getDocs(responsesRef);
      const responses = snapshot.docs.map(d => d.data() as VoteResponse);

      const voteDoc = get().votes.find(v => v.id === voteId);
      if (!voteDoc) return;

      const results: Record<string, { count: number; users: string[] }> = {};
      voteDoc.options.forEach(opt => {
        results[opt] = { count: 0, users: [] };
      });

      responses.forEach(res => {
        if (results[res.selectedOption]) {
          results[res.selectedOption].count++;
          results[res.selectedOption].users.push(res.username);
        }
      });

      await updateDoc(doc(db, 'votes', voteId), {
        status: 'closed',
        results,
        totalVotes: responses.length
      });

      await logActivity('VOTE_CLOSED', { voteId, totalVotes: responses.length }, undefined, undefined, 'Vote System');
    } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, `votes/${voteId}`);
    }
  },

  submitComplaint: async (subject, complaint, extraFields = {}) => {
    const { logActivity } = get();
    const user = auth.currentUser;
    const uid = user?.uid;
    if (!uid) throw new Error("User not authenticated");
    
    const docRef = await addDoc(collection(db, "complaints"), {
      subject: subject || "",
      complaint: complaint || "",
      createdByUid: uid,
      createdAt: serverTimestamp(),
      status: "pending",
      assignedMonitorId: null,
      assignedMonitorName: null,
      anonymousThreadId: null,
      internalNotes: "",
      lastMessageAt: serverTimestamp(),
      ...extraFields
    });
    
    await logActivity('COMPLAINT_FILED', { subject, id: docRef.id, ...extraFields }, undefined, undefined, 'Black Box');
    return docRef.id;
  },

  claimComplaint: async (complaintId) => {
    const { currentUser, logActivity } = get();
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'rit_chief' && currentUser.role !== 'monitor')) throw new Error("UNAUTHORIZED");
    await updateDoc(doc(db, "complaints", complaintId), {
      assignedMonitorId: currentUser.uid,
      assignedMonitorName: `@${currentUser.username}`,
      status: "under_review",
      anonymousThreadId: complaintId,
      lastMessageAt: serverTimestamp()
    });
    await logActivity('CLAIM_COMPLAINT', { id: complaintId }, undefined, undefined, 'Complaints Workspace');
  },

  resolveComplaint: async (complaintId) => {
    const { currentUser, logActivity } = get();
    await updateDoc(doc(db, "complaints", complaintId), {
      status: "resolved"
    });
    await logActivity('RESOLVE_COMPLAINT', { id: complaintId }, undefined, undefined, 'Complaints Workspace');
  },

  sendComplaintMessage: async (complaintId, message) => {
    const { currentUser } = get();
    if (!currentUser) throw new Error("UNAUTHORIZED");
    
    await addDoc(collection(db, "complaintChats"), {
      complaintId,
      senderType: currentUser.role === 'monitor' || currentUser.role === 'rit_chief' || currentUser.role === 'admin' ? 'monitor' : 'complainant',
      senderUid: currentUser.uid,
      message,
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp()
    });
    
    await updateDoc(doc(db, "complaints", complaintId), {
      lastMessageAt: serverTimestamp()
    });
  },

  updateComplaintStatus: async (complaintId, status) => {
    const { currentUser, logActivity } = get();
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'rit_chief' && currentUser.role !== 'monitor')) throw new Error("UNAUTHORIZED");
    await updateDoc(doc(db, "complaints", complaintId), { status });
    await logActivity('UPDATE_COMPLAINT_STATUS', { id: complaintId, status }, undefined, undefined, 'Complaints Workspace');
  },

  updateComplaintNotes: async (complaintId, notes) => {
    const { currentUser, logActivity } = get();
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'rit_chief' && currentUser.role !== 'monitor')) throw new Error("UNAUTHORIZED");
    await updateDoc(doc(db, "complaints", complaintId), { internalNotes: notes });
    await logActivity('UPDATE_COMPLAINT_NOTES', { id: complaintId }, undefined, undefined, 'Complaints Workspace');
  },

  deleteComplaint: async (complaintId) => {
    const { currentUser, logActivity } = get();
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'rit_chief' && currentUser.role !== 'monitor')) throw new Error("UNAUTHORIZED");
    await deleteDoc(doc(db, "complaints", complaintId));
    await logActivity('DELETE_COMPLAINT', { id: complaintId }, undefined, undefined, 'Complaints Workspace');
  },

  getOrCreateConversation: async (participantId) => {
    const { currentUser, directConversations } = get();
    if (!currentUser) throw new Error("UNAUTHORIZED");

    const existing = directConversations.find(c => c.participants.includes(participantId) && c.participants.includes(currentUser.id));
    if (existing) return existing.id;

    const id = uuidv4();
    await setDoc(doc(db, 'directConversations', id), {
      id,
      participants: [currentUser.id, participantId],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  },

  sendDirectMessage: async (conversationId, message) => {
    const { currentUser } = get();
    if (!currentUser) throw new Error("UNAUTHORIZED");
    
    await addDoc(collection(db, "directMessages"), {
      conversationId,
      senderUid: currentUser.id,
      message,
      createdAt: serverTimestamp(),
      seenBy: [currentUser.id]
    });
    
    await updateDoc(doc(db, "directConversations", conversationId), {
      lastMessage: message,
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  },
}));

// Manage subscriptions
let mainUnsubscribes: (() => void)[] = [];
let roleUnsubscribes: (() => void)[] = [];

let rolesUnsubscribe: (() => void) | null = null;
let voteUnsubscribes: Record<string, (() => void)[]> = {};

const clearMainListeners = () => {
  mainUnsubscribes.forEach(unsub => unsub());
  mainUnsubscribes = [];
  Object.values(voteUnsubscribes).forEach(unsubs => unsubs.forEach(u => u()));
  voteUnsubscribes = {};
};

const clearRoleListeners = () => {
  roleUnsubscribes.forEach(unsub => unsub());
  roleUnsubscribes = [];
};

let specialOpsUnsubscribes: (() => void)[] = [];
const clearSpecialOpsListeners = () => {
  specialOpsUnsubscribes.forEach(unsub => unsub());
  specialOpsUnsubscribes = [];
};

// Global Roles Config Listener (Always active to support login checks)
onSnapshot(doc(db, 'roles_config', 'global'), (docSnap) => {
  if (docSnap.exists()) {
    useStore.setState({ rolesConfig: docSnap.data() as RoleConfig });
  }
});

// Warning Rules Config Listener
onSnapshot(doc(db, 'systemConfig', 'warningRules'), (docSnap) => {
  if (docSnap.exists()) {
    const data = docSnap.data();
    if (data && data.rules) {
      useStore.setState({ warningRules: data.rules });
    }
  }
});

// Roles Collection Listener
onSnapshot(collection(db, 'roles'), (snapshot) => {
  const roles = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AppRole));
  useStore.setState({ roles });
  
  // Seed default roles if empty or if rit_chief is missing
  const currentUser = useStore.getState().currentUser;
  if (currentUser?.role === 'admin') {
    if (snapshot.empty) {
      const defaults = [
        { id: 'admin', roleName: 'Administrator', permissions: ['FULL_ACCESS'] },
        { id: 'rit_chief', roleName: 'RIT Chief', permissions: ['ALL_MONITOR_PERMISSIONS', 'ENFORCE_DECISIONS', 'MANAGE_CASES', 'VIEW_AUDIT'] },
        { id: 'monitor', roleName: 'Monitor', permissions: ['VIEW_AUDIT', 'MANAGE_CASES'] },
        { id: 'user', roleName: 'Standard User', permissions: ['BASIC_ACCESS'] }
      ];
      defaults.forEach(r => setDoc(doc(db, 'roles', r.id), r));
    } else {
      const hasRitChief = roles.some(r => r.id === 'rit_chief');
      if (!hasRitChief) {
        setDoc(doc(db, 'roles', 'rit_chief'), {
          id: 'rit_chief',
          roleName: 'RIT Chief',
          permissions: ['ALL_MONITOR_PERMISSIONS', 'ENFORCE_DECISIONS', 'MANAGE_CASES', 'VIEW_AUDIT']
        });
      }
    }
  }
});

onAuthStateChanged(auth, async (firebaseUser) => {
  let initialProfileHandled = false;
  
  try {
    clearMainListeners();
    clearRoleListeners();
    clearSpecialOpsListeners();

    if (firebaseUser) {
      if (!firebaseUser.uid) {
        console.error("User authenticated but UID is missing");
        useStore.setState({ isLoading: false });
        return;
      }
      
      // Force refresh token on initial session load to sync claims (requested)
      try {
        await firebaseUser.getIdToken(true);
      } catch (e) {
        console.warn("Token refresh silent fail:", e);
      }

      // 1. Fetch Roles Config sequentially before setting up profile listeners
      const rolesRef = doc(db, 'roles_config', 'global');
      const rolesSnap = await getDoc(rolesRef);
      
      if (!rolesSnap.exists()) {
        console.error("Critical System Configuration Error: roles_config document missing at path roles_config/global");
      } else {
        useStore.setState({ rolesConfig: rolesSnap.data() as RoleConfig });
      }

      // 2. User Profile Listener
      const docRef = doc(db, 'users', firebaseUser.uid);
      mainUnsubscribes.push(
        onSnapshot(docRef, async (docSnap) => {
          try {
            if (docSnap.exists()) {
              const data = docSnap.data() as UserProfile;
              const email = (data.email || firebaseUser.email || '').toLowerCase();
              const isBootstrapAdmin = bootstrapAdmins.includes(email) || firebaseUser.uid === 'K7MRkBbJtdSapnLfw2giwLzmhwA3';
              
              if (isBootstrapAdmin && data.role !== 'admin') {
                console.log(`[BOOTSTRAP_ADMIN] Auto-syncing admin status for ${email}`);
                await updateDoc(docRef, { role: 'admin' });
                return;
              }

              // STRICT ROLE CONTROL: Role is now a field on the user document
              const calculatedRole = (data.role?.toLowerCase() as UserRole) || 'user';
              
              const newUser = { ...data, role: calculatedRole };

              // DEBUG LOG (Requested)
              console.log(`[AUTH_SYNC] User: @${data.username} | Role: ${calculatedRole}`);
              
              useStore.setState({ currentUser: newUser });

              // 2.2 Special Ops / Spy Authority Listener
              const isOwner = firebaseUser.uid === SPY_OWNER_ID;
              useStore.setState({ isSpyOwner: isOwner });

              if (isOwner) {
                mainUnsubscribes.push(
                  onSnapshot(collection(db, 'spyNetwork'), (snap) => {
                    useStore.setState({ spyNetwork: snap.docs.map(d => d.data() as SpyOpsMember) });
                  })
                );
              }

              mainUnsubscribes.push(
                onSnapshot(doc(db, 'spyNetwork', firebaseUser.uid), (spySnap) => {
                  const hasAccess = data?.specialOpsAccess === true;
                  useStore.setState({ hasSpecialAccess: hasAccess });

                  if (hasAccess) {
                    clearSpecialOpsListeners();
                    specialOpsUnsubscribes.push(
                      onSnapshot(query(collection(db, 'specialOpsLogs'), orderBy('timestamp', 'desc'), limit(100)), (snap) => {
                        useStore.setState({ specialOpsLogs: snap.docs.map(d => d.data() as SpecialOpsLog) });
                      }),
                      onSnapshot(collection(db, 'internalNotes'), (snap) => {
                        useStore.setState({ internalNotes: snap.docs.map(d => d.data() as InternalNote) });
                      }),
                      onSnapshot(collection(db, 'recruitments'), (snap) => {
                        useStore.setState({ recruitments: snap.docs.map(d => d.data() as Recruitment) });
                      })
                    );
                  } else {
                    clearSpecialOpsListeners();
                    useStore.setState({ specialOpsLogs: [], internalNotes: [], recruitments: [], hasSpecialAccess: false });
                  }
                }, (err) => {
                  if (firebaseUser.uid === SPY_OWNER_ID) useStore.setState({ hasSpecialAccess: true });
                })
              );

              // Sub-listeners for warnings and per-role data
              const { currentUser: currentU } = useStore.getState();
              if (currentU) {
                // Clear and re-establish role listeners
                clearRoleListeners();
                
                roleUnsubscribes.push(
                  onSnapshot(collection(db, 'users', firebaseUser.uid, 'warnings'), (snapshot) => {
                    useStore.setState({ userWarnings: snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Warning)) });
                  }, (err) => console.warn("Warnings Listener Denied:", err.message))
                );

                if (calculatedRole === 'admin' || calculatedRole === 'monitor') {
                  roleUnsubscribes.push(
                    onSnapshot(collection(db, 'debts'), (snapshot) => {
                      useStore.setState({ debts: snapshot.docs.map(d => ({ id: d.id, ...d.data() } as NetDebt)) });
                    }, errorHandler('Debts')),
                    onSnapshot(collection(db, 'rewards'), (snapshot) => {
                       useStore.setState({ rewards: snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Reward)) });
                    }, errorHandler('Rewards')),
                    onSnapshot(query(collection(db, 'roleRequests'), where('status', '==', 'pending')), (snapshot) => {
                      useStore.setState({ roleRequests: snapshot.docs.map(d => ({ id: d.id, ...d.data() } as RoleRequest)) });
                    }, (err) => console.warn("Staff Listener - RoleRequests Denied:", err.message)),
                    onSnapshot(collectionGroup(db, 'warnings'), (snapshot) => {
                      useStore.setState({ allWarnings: snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Warning)) });
                    }, (err) => console.warn("Staff Listener - Global Warnings Access Denied:", err.message)),
                    onSnapshot(query(collection(db, 'complaints'), orderBy('createdAt', 'desc')), (snapshot) => {
                      const list = snapshot.docs.map(d => {
                        const data = d.data();
                        return {
                          id: d.id,
                          ...data,
                          category: data.subject || data.category || 'General',
                          message: data.complaint || data.message || '',
                          anonymousThreadId: data.assignedMonitorId ? d.id : null,
                        };
                      });
                      useStore.setState({ complaints: list as any[], anonymousComplaints: list });
                    }, (err) => console.warn("Staff Listener - Complaints Access Denied:", err.message)),
                    onSnapshot(query(collection(db, 'groups', 'monitoring', 'posts'), orderBy('timestamp', 'desc'), limit(50)), (snapshot) => {
                      const posts = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as GroupPost));
                      useStore.setState(state => ({ groupPosts: { ...state.groupPosts, monitoring: posts } }));
                    }, (err) => console.warn("Staff Listener - Monitoring Posts Access Denied:", err.message)),
                    onSnapshot(query(collection(db, 'debtAdjustments'), orderBy('requestedAt', 'desc')), (snapshot) => {
                      useStore.setState({ debtAdjustments: snapshot.docs.map(d => ({ id: d.id, ...d.data() } as DebtAdjustment)) });
                    }, (err) => console.warn("Staff Listener - Debt Adjustments Access Denied:", err.message)),
                    onSnapshot(query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'), limit(200)), (snapshot) => {
                      useStore.setState({ activityLogs: snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ActivityLog)) });
                    }, (err) => console.warn("Staff Listener - ActivityLogs Access Denied:", err.message))
                  );
                } else {
                  // Standard users only see their own debts, rewards, and anonymous complaints
                  roleUnsubscribes.push(
                    onSnapshot(query(collection(db, 'debts'), or(where('user1Id', '==', firebaseUser.uid), where('user2Id', '==', firebaseUser.uid))), (snapshot) => {
                      useStore.setState({ debts: snapshot.docs.map(d => ({ id: d.id, ...d.data() } as NetDebt)) });
                    }, errorHandler('Debts-Personal')),
                    onSnapshot(query(collection(db, 'rewards'), where('userId', '==', firebaseUser.uid)), (snapshot) => {
                       useStore.setState({ rewards: snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Reward)) });
                    }, errorHandler('Rewards-Personal')),
                    onSnapshot(query(collection(db, 'complaints'), where('createdByUid', '==', firebaseUser.uid), orderBy('createdAt', 'desc')), (snapshot) => {
                      const list = snapshot.docs.map(d => {
                        const data = d.data();
                        return {
                          id: d.id,
                          ...data,
                          category: data.subject || data.category || 'General',
                          message: data.complaint || data.message || '',
                          anonymousThreadId: data.assignedMonitorId ? d.id : null,
                        };
                      });
                      useStore.setState({ anonymousComplaints: list, complaints: list as any[] });
                    }, (err) => console.warn("User Listener - Complaints Access Denied:", err.message))
                  );
                }

                if (calculatedRole === 'admin') {
                  roleUnsubscribes.push(
                    onSnapshot(query(collection(db, 'pendingAccountRequests'), where('status', '==', 'pending')), (snapshot) => {
                      console.log("Validation listener active");
                      console.log("Pending requests:", snapshot.docs.length);
                      useStore.setState({ pendingAccountRequests: snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PendingAccountRequest)) });
                    }, (err) => console.warn("Admin Listener - PendingAccountRequests Denied:", err.message)),
                    onSnapshot(query(collection(db, 'systemBackups')), (snapshot) => {
                      useStore.setState({ systemBackups: snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any)) });
                    }, (err) => console.warn("Admin Listener - systemBackups Denied:", err.message))
                  );
                }
              }
            } else {
              // AUTO-PROVISION if document missing
              const email = (firebaseUser.email || '').toLowerCase();
              const usernameFromEmail = email.split('@')[0] || 'user';
              const isBootstrapAdmin = bootstrapAdmins.includes(email);
              
              const { serverTimestamp } = await import('firebase/firestore');
              
              const profile: UserProfile = {
                id: firebaseUser.uid,
                uid: firebaseUser.uid,
                username: usernameFromEmail,
                email: email,
                role: isBootstrapAdmin ? 'admin' : 'user',
                requestedRole: null,
                status: 'active',
                warningCount: 0,
                warnings: 0,
                integrityScore: 100,
                integrity: 100,
                integrityLevel: 0,
                debtOwed: 0,
                debtToMe: 0,
                ratingAverage: 5,
                ratingCount: 0,
                rating: 5,
                totalLendingTransactions: 0,
                isPermanentlyRemoved: false,
                communityServicesNeeded: 0,
                isCommunityServiceParticipant: false,
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp()
              };
              await setDoc(docRef, profile);
            }
          } catch (snapshotError: any) {
            console.error("User Profile Snapshot Error:", snapshotError.message);
          } finally {
            if (!initialProfileHandled) {
              initialProfileHandled = true;
              useStore.setState({ isLoading: false });
            }
          }
        }, (err) => {
           console.error("User Profile Listener Error:", err);
           useStore.setState({ isLoading: false });
        })
      );

      // 3. Core Collection Listeners
      const errorHandler = (name: string) => (err: any) => console.error(`Snapshot [${name}] Denied:`, err.message);

      mainUnsubscribes.push(
        onSnapshot(collection(db, 'users'), (snapshot) => {
          useStore.setState({ users: snapshot.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile)) });
        }, errorHandler('Users')),
        onSnapshot(query(collection(db, 'transactions'), orderBy('timestamp', 'desc')), (snapshot) => {
          useStore.setState({ transactions: snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)) });
        }, errorHandler('Transactions')),
        onSnapshot(query(collection(db, 'announcements'), orderBy('timestamp', 'desc'), limit(50)), (snapshot) => {
          useStore.setState({ announcements: snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Announcement)) });
        }, errorHandler('Announcements')),
        onSnapshot(query(collection(db, 'resolvingDeck'), orderBy('timestamp', 'desc')), (snapshot) => {
          useStore.setState({ resolvingDeck: snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ResolvingCase)) });
        }, errorHandler('ResolvingDeck')),

        onSnapshot(doc(db, 'systemStatus', 'current'), (snapshot) => {
          if (snapshot.exists()) useStore.setState({ systemStatus: snapshot.data() as SystemStatus });
        }, errorHandler('SystemStatus')),
        onSnapshot(query(collection(db, 'bills'), orderBy('timestamp', 'desc')), (snapshot) => {
           useStore.setState({ bills: snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Bill)) });
        }, errorHandler('Bills')),
        onSnapshot(collection(db, 'forgivenessLogs'), (snapshot) => {
           useStore.setState({ forgivenessLogs: snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ForgivenessLog)) });
        }, errorHandler('ForgivenessLogs')),
        onSnapshot(doc(db, 'leaderboard', 'current'), (snapshot) => {
           if (snapshot.exists()) useStore.setState({ currentLeaderboard: snapshot.data() as Leaderboard });
        }, errorHandler('Leaderboard')),
        onSnapshot(collection(db, 'votes'), (snapshot) => {
          useStore.setState({ votes: snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Vote)) });
          snapshot.docs.forEach(vDoc => {
            const vId = vDoc.id;
            if (!voteUnsubscribes[vId]) {
              voteUnsubscribes[vId] = [];
              voteUnsubscribes[vId].push(
                // Listener for current user's vote
                onSnapshot(doc(db, 'votes', vId, 'responses', firebaseUser.uid), (resSnap) => {
                  const userVotedOption = resSnap.exists() ? resSnap.data().selectedOption : null;
                  useStore.setState(state => ({
                    votes: state.votes.map(v => v.id === vId ? { ...v, userVotedOption } : v)
                  }));
                }),
                // Live participation count
                onSnapshot(collection(db, 'votes', vId, 'responses'), (resSnap) => {
                   useStore.setState(state => ({
                     votes: state.votes.map(v => v.id === vId && v.status === 'active' ? { ...v, totalVotes: resSnap.size } : v)
                   }));
                })
              );
            }
          });
        }, errorHandler('Votes')),
        onSnapshot(query(collection(db, 'transactionRequests'), where('status', '==', 'pending')), (snapshot) => {
          useStore.setState({ transactionRequests: snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TransactionRequest)) });
        }, errorHandler('TransactionRequests')),
        onSnapshot(collection(db, 'ratings'), (snapshot) => {
          useStore.setState({ ratings: snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Rating)) });
        }, errorHandler('Ratings'))
      );

      // 4. Public Group Listeners
      const publicGroups: GroupId[] = ['studying', 'chatting', 'resolving', 'complaints'];
      publicGroups.forEach(gid => {
        mainUnsubscribes.push(
          onSnapshot(query(collection(db, 'groups', gid, 'posts'), orderBy('timestamp', 'desc'), limit(50)), (snapshot) => {
            const posts = snapshot.docs.map(d => d.data() as GroupPost);
            useStore.setState(state => ({ groupPosts: { ...state.groupPosts, [gid]: posts } }));
          }, errorHandler(`Group:${gid}`))
        );
      });

    } else {
      useStore.setState({ currentUser: null, isLoading: false });
    }
  } catch (authError: any) {
    console.error("System Auth Listener Error:", authError.message);
    useStore.setState({ isLoading: false });
  }
});
