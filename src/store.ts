import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { db, auth } from './firebase';
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
  username: string;
  role: UserRole;
  requestedRole?: UserRole | null;
  status: 'active' | 'restricted' | 'suspended';
  warningCount: number;
  integrityScore: number;
  integrityLevel: number;
  debtOwed: number;
  debtToMe: number;
  ratingAverage: number;
  ratingCount: number;
  totalLendingTransactions: number;
  isPermanentlyRemoved: boolean;
  restrictedUntil?: string;
  communityServicesNeeded: number;
  isCommunityServiceParticipant?: boolean;
  createdAt?: any;
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

export type TransactionStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';

export type TransactionType = 'lend' | 'pay';

export type Transaction = {
  id: string;
  senderId: string;
  askerId: string;
  pages: number;
  debt: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  isCommunityService: boolean;
  rating?: number;
  validatedBy?: string; // monitor username
  validatedAt?: string; // ISO timestamp
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

export type Complaint = {
  id: string;
  content: string;
  timestamp: string;
  reviewedBy: string[];
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

export type MonitoringPillar = {
  id: string;
  billId?: string;
  caseId?: string;
  title: string;
  verdict: string;
  caseNumber: string;
  issuedBy: string;
  timestamp: string;
};

export type Verdict = MonitoringPillar; // For backward compatibility if needed

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

type State = {
  currentUser: UserProfile | null;
  users: UserProfile[];
  debts: NetDebt[];
  transactions: Transaction[];
  announcements: Announcement[];
  complaints: Complaint[];
  roleRequests: RoleRequest[];
  resolvingDeck: ResolvingCase[];
  monitoringPillars: MonitoringPillar[];
  justiceNexus: MonitoringPillar[]; // Deprecated, but keeping for listener
  systemStatus: SystemStatus | null;
  activityLogs: ActivityLog[];
  debtAdjustments: DebtAdjustment[];
  userWarnings: Warning[];
  allWarnings: Warning[];
  roles: AppRole[];
  specialOpsLogs: SpecialOpsLog[];
  internalNotes: InternalNote[];
  recruitments: Recruitment[];
  rewards: Reward[];
  spyNetwork: SpyOpsMember[];
  forgivenessLogs: ForgivenessLog[];
  votes: Vote[];
  currentLeaderboard: Leaderboard | null;
  hasSpecialAccess: boolean;
  isSpyOwner: boolean;
  groupPosts: Record<GroupId, GroupPost[]>;
  rolesConfig: RoleConfig;
  bills: Bill[];
  billComments: BillComment[];
  billStaffComments: BillStaffComment[];
  warningRules: WarningRule[];
  
  isLoading: boolean;
  authError: string | null;
  
  // Auth
  login: (email: string, password: string) => Promise<boolean>;
  signUp: (username: string, email: string, password: string, requestedRole?: UserRole) => Promise<boolean>;
  logout: () => Promise<void>;
  
  // Core Actions
  addTransaction: (askerId: string, pages: number, isCommunityService: boolean) => Promise<string | void>;
  approveTransaction: (txId: string) => Promise<void>;
  rejectTransaction: (txId: string) => Promise<void>;
  submitRating: (txId: string, rating: number) => Promise<void>;
  forgiveDebt: (borrowerId: string, amount: number) => Promise<void>;
  
  // Admin Actions
  postAnnouncement: (title: string, content: string, section: AnnouncementSection) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  issueWarning: (username: string, level: number, reason: string) => Promise<void>;
  postVerdict: (caseId: string, verdictText: string, actionTaken: string) => Promise<void>;
  resolveBill: (billId: string, verdictText: string) => Promise<void>;
  migrateOldVerdicts: () => Promise<void>;
  createResolvingCase: (description: string, involvedUsers: string[]) => Promise<void>;
  revertVerdict: (caseId: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  updateUsername: (newUsername: string) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  revokeWarning: (userId: string, warningId: string) => Promise<void>;
  updateWarningRules: (rules: WarningRule[]) => Promise<void>;
  updateSystemStatus: (level: 1 | 2 | 3) => Promise<void>;
  updateRolesConfig: (admins: string[], monitors: string[]) => Promise<void>;
  updateUserRole: (userId: string, newRole: string) => Promise<void>;
  updateRolePermissions: (roleId: string, permissions: string[]) => Promise<void>;
 
  // Special Ops
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
 
  // Monitor Deck Bills
  createBill: (title: string, category: string, description: string, priority: string) => Promise<void>;
  updateBill: (billId: string, title: string, description: string) => Promise<void>;
  postBillComment: (billId: string, message: string) => Promise<void>;
  postBillStaffComment: (billId: string, message: string) => Promise<void>;
 
  resetSystem: () => Promise<void>;
  recalculateLeaderboard: () => Promise<void>;
  
  // Complaints
  addComplaint: (content: string) => Promise<void>;
  reviewComplaint: (complaintId: string) => Promise<void>;
  
  // Role Transition
  requestRole: (role: UserRole) => Promise<void>;
  resolveRoleRequest: (requestId: string, approved: boolean) => Promise<void>;
  
  // Vote System
  createVote: (title: string, type: VoteType, options: string[], isAnonymous: boolean) => Promise<void>;
  submitVote: (voteId: string, option: string) => Promise<void>;
  closeVote: (voteId: string) => Promise<void>;

  // Groups
  postToGroup: (groupId: GroupId, content: string) => Promise<void>;
  
  // Helpers
  calculateDebt: (pages: number) => number;
  logActivity: (action: string, details: any, userId?: string, username?: string, type?: string, location?: string) => Promise<void>;
};

export const useStore = create<State>()((set, get) => ({
  currentUser: null,
  users: [],
  debts: [],
  transactions: [],
  announcements: [],
  complaints: [],
  roleRequests: [],
  resolvingDeck: [],
  monitoringPillars: [],
  justiceNexus: [],
  systemStatus: null,
  activityLogs: [],
  debtAdjustments: [],
  userWarnings: [],
  allWarnings: [],
  roles: [],
  specialOpsLogs: [],
  internalNotes: [],
  recruitments: [],
  rewards: [],
  spyNetwork: [],
  forgivenessLogs: [],
  votes: [],
  currentLeaderboard: null,
  hasSpecialAccess: false,
  isSpyOwner: false,
  bills: [],
  billComments: [],
  billStaffComments: [],
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

    if (!finalUserId || !finalUsername) {
      const { currentUser } = get();
      if (!currentUser) return;
      finalUserId = currentUser.id;
      finalUsername = currentUser.username;
    }
    
    try {
      const { serverTimestamp } = await import('firebase/firestore');
      const id = uuidv4();
      await setDoc(doc(db, 'activityLogs', id), {
        id,
        userId: finalUserId,
        username: finalUsername,
        type: type || 'system',
        action,
        location: location || 'System',
        details,
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
    
    const input = usernameOrEmail.trim().toLowerCase();
    const pass = password.trim();

    // Migration support: if input contains @, use it as is. Otherwise, append domain.
    const email = input.includes('@') ? input : `${input}@debtflow.com`;

    try {
      await signInWithEmailAndPassword(auth, email, pass);
      return true;
    } catch (error: any) {
      console.error("Login Error:", error);
      set({ authError: "Invalid username or password" });
      return false;
    }
  },

  signUp: async (username, _unusedEmail, password, requestedRole) => {
    const { logActivity } = get();
    set({ authError: null });
    const trimmedUsername = username.trim().toLowerCase();

    if (!trimmedUsername || !password) {
      set({ authError: "All fields are required." });
      return false;
    }

    // Validation: lowercase, numbers, underscores, no spaces, no @
    const usernameRegex = /^[a-z0-9_]{3,30}$/;
    if (!usernameRegex.test(trimmedUsername)) {
      set({ authError: "Username must be 3-30 characters, lowercase letters, numbers, or underscores only." });
      return false;
    }

    const derivedEmail = `${trimmedUsername}@debtflow.com`;

    try {
      // 1. Explicit Uniqueness Check in Firestore for Username
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', trimmedUsername));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        set({ authError: "Username already taken" });
        return false;
      }

      // 2. Create Auth Account
      const { user } = await createUserWithEmailAndPassword(auth, derivedEmail, password);
      
      // Force token refresh to include potential custom claims (if configured)
      await user.getIdToken(true);

      // 3. Store Profile
      const { serverTimestamp } = await import('firebase/firestore');
      
      // INTERCEPT HIGH-PRIVILEGE REQUESTS
      const initialRole: UserRole = 'user';
      const actualRequestedRole = requestedRole as UserRole | null;
      
      const profile: UserProfile = {
        id: user.uid,
        username: trimmedUsername,
        role: initialRole, 
        requestedRole: actualRequestedRole,
        status: 'active',
        warningCount: 0,
        integrityScore: 100,
        integrityLevel: 0,
        debtOwed: 0,
        debtToMe: 0,
        ratingAverage: 0,
        ratingCount: 0,
        totalLendingTransactions: 0,
        isPermanentlyRemoved: false,
        communityServicesNeeded: 0,
        isCommunityServiceParticipant: false,
        createdAt: serverTimestamp()
      };
      
      await setDoc(doc(db, 'users', user.uid), profile);

      // Create Request Entry if needed
      if (actualRequestedRole && (actualRequestedRole === 'admin' || actualRequestedRole === 'monitor')) {
        await setDoc(doc(db, 'roleRequests', uuidv4()), {
          id: uuidv4(),
          userId: user.uid,
          username: trimmedUsername,
          requestedRole: actualRequestedRole,
          status: 'pending',
          timestamp: new Date().toISOString()
        });
      }

      await logActivity('SIGNUP', `New account created: @${trimmedUsername}`, user.uid, trimmedUsername, 'Auth');
      return true;
    } catch (error: any) {
      let message = "Account creation failed";
      if (error.code === 'auth/email-already-in-use') {
        message = "Account already exists";
      } else if (error.code === 'auth/weak-password') {
        message = "Password is too weak";
      }
      set({ authError: message });
      return false;
    }
  },

  logout: async () => {
    const { currentUser, logActivity } = get();
    if (currentUser) {
      await logActivity('LOGOUT', `User @${currentUser.username} logged out`, undefined, undefined, 'Auth');
    }
    await signOut(auth);
    set({ currentUser: null });
  },

  addTransaction: async (askerId, pages, isCommunityService) => {
    const { currentUser, users, calculateDebt, logActivity } = get();
    if (!currentUser) throw new Error("UNAUTHORIZED");

    const asker = users.find(u => u.id === askerId);
    if (!asker) throw new Error("USER_NOT_FOUND");
    
    const debt = calculateDebt(pages);
    
    try {
      const transactionData = {
        senderId: currentUser.id,
        askerId,
        pages,
        debt,
        status: 'pending',
        isCommunityService,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'transactions'), transactionData);
      await logActivity('CREATE_TRANSACTION', { transactionId: docRef.id, pages, debt, asker: asker.username }, undefined, undefined, 'Profile');
      return docRef.id;
    } catch (error: any) {
      console.error("TRANSACTION_FAILED:", error);
      throw error;
    }
  },

  approveTransaction: async (txId) => {
    const { currentUser, logActivity, transactions, users } = get();
    if (!currentUser || (currentUser.role !== 'monitor' && currentUser.role !== 'admin')) return;
    
    const tx = transactions.find(t => t.id === txId);
    if (!tx || tx.status !== 'pending') return;

    try {
      const batch = writeBatch(db);
      
      batch.update(doc(db, 'transactions', txId), { 
        status: 'approved',
        approvedAt: new Date().toISOString(),
        approvedBy: currentUser.id,
        validatedBy: currentUser.username,
        validatedAt: new Date().toISOString()
      });

      if (!tx.isCommunityService) {
        const lenderId = tx.senderId;
        const borrowerId = tx.askerId;

        const u1 = lenderId < borrowerId ? lenderId : borrowerId;
        const u2 = lenderId < borrowerId ? borrowerId : lenderId;
        const debtId = `${u1}_${u2}`;
        
        const debtRef = doc(db, 'debts', debtId);
        const debtSnap = await getDoc(debtRef);
        
        let currentBalance = 0;
        if (debtSnap.exists()) {
          currentBalance = (debtSnap.data() as NetDebt).netBalance;
        }
        
        // user2 owes user1 if positive.
        // lenderId is giving debt worth tx.debt to borrowerId.
        // If lenderId is u1, then u2 (borrower) owes u1 more -> balance increases.
        // If lenderId is u2, then u2 owes u1 less (or u1 owes u2 more) -> balance decreases.
        const balanceChange = lenderId === u1 ? tx.debt : -tx.debt;
        const newBalance = currentBalance + balanceChange;

        batch.set(debtRef, {
          id: debtId,
          user1Id: u1,
          user2Id: u2,
          netBalance: newBalance,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        // Update User Profile cache for quick display
        const lender = users.find(u => u.id === lenderId);
        const borrower = users.find(u => u.id === borrowerId);
        
        if (lender && borrower) {
           batch.update(doc(db, 'users', lender.id), { debtToMe: (lender.debtToMe || 0) + tx.debt });
           batch.update(doc(db, 'users', borrower.id), { debtOwed: (borrower.debtOwed || 0) + tx.debt });
        }
      }
      
      const { recalculateLeaderboard } = get();
      await batch.commit();
      await recalculateLeaderboard();
      await logActivity('APPROVE_TRANSACTION', { txId, debt: tx.debt }, undefined, undefined, 'Monitor Workspace');
    } catch (error: any) {
      console.error("APPROVE_ERROR:", error);
    }
  },

  rejectTransaction: async (txId) => {
    const { currentUser, logActivity } = get();
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'monitor')) throw new Error("UNAUTHORIZED");

    try {
      await updateDoc(doc(db, 'transactions', txId), { status: 'rejected' });
      await logActivity('REJECT_TRANSACTION', { txId }, undefined, undefined, 'Monitor Workspace');
    } catch (error) {
      console.error("REJECT_ERROR:", error);
    }
  },

  submitRating: async (txId, rating) => {
    const { currentUser, transactions, users, logActivity } = get();
    if (!currentUser) return;
    
    const tx = transactions.find(t => t.id === txId);
    if (!tx || tx.askerId !== currentUser.id || tx.status !== 'approved') return;
    
    const lender = users.find(u => u.id === tx.senderId);
    if (!lender) return;

    const batch = writeBatch(db);
    batch.update(doc(db, 'transactions', txId), { status: 'completed', rating });
    
    const newCount = lender.ratingCount + 1;
    const newAvg = (lender.ratingAverage * lender.ratingCount + rating) / newCount;
    
    batch.update(doc(db, 'users', lender.id), {
      ratingAverage: newAvg,
      ratingCount: newCount
    });
    
    const { recalculateLeaderboard } = get();
    await batch.commit();
    await recalculateLeaderboard();
    await logActivity('RATE_TRANSACTION', { txId, rating }, undefined, undefined, 'Transaction Center');
  },

  forgiveDebt: async (borrowerId, amount) => {
    const { currentUser, users, logActivity } = get();
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
    await logActivity('FORGIVE_DEBT', { borrowerId, amount }, undefined, undefined, 'Profile');
  },

  postAnnouncement: async (title, content, section) => {
    const { currentUser, logActivity } = get();
    if (!currentUser) return;
    
    // Monitors can only post to Monitoring or Resolving sections
    if (currentUser.role === 'monitor' && section === 'GLOBAL') return;
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
      'monitoringPillars', 'forgivenessLogs', 'leaderboard',
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

  issueWarning: async (username, level, reason) => {
    const { currentUser, users, logActivity, warningRules } = get();
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'monitor')) return;
    
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

  postVerdict: async (caseId, verdictText, actionTaken) => {
    const { currentUser, logActivity, resolvingDeck } = get();
    if (!currentUser || currentUser.role !== 'admin') return;

    const caseToResolve = resolvingDeck.find(c => c.id === caseId);
    if (!caseToResolve) return;

    const batch = writeBatch(db);
    const pillarId = uuidv4();
    const caseNumber = `CASE-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Create monitoring pillar
    batch.set(doc(db, 'monitoringPillars', pillarId), {
      id: pillarId,
      caseId: caseId,
      title: `Dispute: ${caseToResolve.description.substring(0, 30)}...`,
      verdict: verdictText,
      caseNumber,
      issuedBy: currentUser.id,
      timestamp: new Date().toISOString()
    });

    // Update original case
    batch.update(doc(db, 'resolvingDeck', caseId), { 
      status: 'resolved',
      resolvedAt: new Date().toISOString()
    });

    await batch.commit();
    await logActivity('POST_VERDICT', { caseId, pillarId }, undefined, undefined, 'Monitor Workspace');
  },

  resolveBill: async (billId, verdictText) => {
    const { currentUser, logActivity, bills } = get();
    if (!currentUser || currentUser.role !== 'admin') return;

    const bill = bills.find(b => b.id === billId);
    if (!bill) return;

    const batch = writeBatch(db);
    const pillarId = uuidv4();
    const caseNumber = `BILL-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Create monitoring pillar
    batch.set(doc(db, 'monitoringPillars', pillarId), {
      id: pillarId,
      billId: billId,
      title: bill.title,
      verdict: verdictText,
      caseNumber,
      issuedBy: currentUser.id,
      timestamp: new Date().toISOString()
    });

    // Update original bill
    batch.update(doc(db, 'bills', billId), { 
      status: 'resolved',
      verdict: verdictText
    });

    await batch.commit();
    await logActivity('RESOLVE_BILL', { billId, pillarId }, undefined, undefined, 'Monitor Workspace');
  },

  migrateOldVerdicts: async () => {
    const { currentUser, resolvingDeck } = get();
    if (!currentUser || currentUser.role !== 'admin') return;

    // Direct migration: Find resolved cases that haven't been archived in pillars yet
    const resolvedCases = resolvingDeck.filter(c => c.status === 'resolved' && !c.resolvedAt);
    
    for (const c of resolvedCases) {
      const pillarId = uuidv4();
      const caseNumber = `LEGACY-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      const batch = writeBatch(db);
      batch.set(doc(db, 'monitoringPillars', pillarId), {
        id: pillarId,
        caseId: c.id,
        title: `Migrated: ${c.description.substring(0, 40)}...`,
        verdict: "Legacy verdict migration required detailed review.",
        caseNumber,
        issuedBy: 'SYSTEM',
        timestamp: new Date().toISOString()
      });
      batch.update(doc(db, 'resolvingDeck', c.id), {
        resolvedAt: new Date().toISOString()
      });
      await batch.commit();
    }
  },

  recalculateLeaderboard: async () => {
    try {
      const { transactions, forgivenessLogs, users } = get();
      
      const approvedTx = transactions.filter(t => t.status === 'approved' || t.status === 'completed');
      const approvedCS = approvedTx.filter(t => t.isCommunityService);
      
      // Community Carer
      const carerMap: Record<string, number> = {};
      approvedCS.forEach(t => {
        carerMap[t.senderId] = (carerMap[t.senderId] || 0) + t.debt;
      });
      forgivenessLogs.forEach(f => {
        carerMap[f.forgiverId] = (carerMap[f.forgiverId] || 0) + f.debtsForgiven;
      });
      
      // Sender of the Month (Total Approved Debts Sent)
      const monthlyMap: Record<string, number> = {};
      approvedTx.forEach(t => {
        monthlyMap[t.senderId] = (monthlyMap[t.senderId] || 0) + t.debt;
      });

      // Find tops
      let topCarerId: string | null = null;
      let maxCarer = 0;
      Object.entries(carerMap).forEach(([uid, val]) => {
        if (val > maxCarer) {
          maxCarer = val;
          topCarerId = uid;
        }
      });

      let topMonthlyId: string | null = null;
      let maxMonthly = 0;
      Object.entries(monthlyMap).forEach(([uid, val]) => {
        if (val > maxMonthly) {
          maxMonthly = val;
          topMonthlyId = uid;
        }
      });

      // Best Rating
      let topRatingId: string | null = null;
      let maxRating = 0;
      users.forEach(u => {
        if (u.ratingCount > 0 && u.ratingAverage > maxRating) {
          maxRating = u.ratingAverage;
          topRatingId = u.id;
        }
      });

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
        senderOfTheMonth: topMonthlyId ? {
          userId: topMonthlyId,
          username: users.find(u => u.id === topMonthlyId)?.username || 'Unknown',
          totalDebts: maxMonthly
        } : null,
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'leaderboard', 'current'), lbDoc);
    } catch (e) {
      console.error("Leaderboard Recalculation Failed:", e);
    }
  },

  revertVerdict: async (caseId) => {
    const { currentUser, logActivity } = get();
    if (!currentUser || currentUser.role !== 'admin') throw new Error("UNAUTHORIZED");

    const batch = writeBatch(db);
    batch.delete(doc(db, 'justiceNexus', caseId));
    batch.update(doc(db, 'resolvingDeck', caseId), { 
      status: 'under_investigation',
      resolvedAt: deleteField()
    });

    await batch.commit();
    await logActivity('VERDICT_REVERTED', { caseId }, undefined, undefined, 'Monitor Workspace');
  },

  createResolvingCase: async (description, involvedUsers) => {
    const { currentUser, logActivity } = get();
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'monitor')) return;

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
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'monitor')) return;

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
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'monitor')) return;

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
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'monitor')) return;

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

  addComplaint: async (content) => {
    const id = uuidv4();
    await setDoc(doc(db, 'complaints', id), {
      id,
      content,
      timestamp: new Date().toISOString(),
      reviewedBy: []
    });
    // Complaints are anonymous, no user activity log linked to author
  },

  reviewComplaint: async (complaintId) => {
    const { currentUser, logActivity } = get();
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'monitor')) return;
    
    const complaint = get().complaints.find(c => c.id === complaintId);
    if (!complaint) return;
    
    if (!complaint.reviewedBy.includes(currentUser.id)) {
      await updateDoc(doc(db, 'complaints', complaintId), {
        reviewedBy: [...complaint.reviewedBy, currentUser.id]
      });
      await logActivity('REVIEW_COMPLAINT', { complaintId }, undefined, undefined, 'Monitor Workspace');
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

  updateRolePermissions: async (roleId, permissions) => {
    const { currentUser, logActivity } = get();
    if (!currentUser || currentUser.role !== 'admin') throw new Error("UNAUTHORIZED");

    await setDoc(doc(db, 'roles', roleId), { permissions }, { merge: true });
    await logActivity('PERMISSIONS_UPDATED', { roleId, permissions }, undefined, undefined, 'Monitor Workspace');
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
    
    if (groupId === 'monitoring' && currentUser.role !== 'monitor' && currentUser.role !== 'admin') return;
    
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
  
  // Seed default roles if empty
  if (snapshot.empty && useStore.getState().currentUser?.role === 'admin') {
    const defaults = [
      { id: 'admin', roleName: 'Administrator', permissions: ['FULL_ACCESS'] },
      { id: 'monitor', roleName: 'Monitor', permissions: ['VIEW_AUDIT', 'MANAGE_CASES'] },
      { id: 'user', roleName: 'Standard User', permissions: ['BASIC_ACCESS'] }
    ];
    defaults.forEach(r => setDoc(doc(db, 'roles', r.id), r));
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
                  const spyData = spySnap.data() as SpyOpsMember | undefined;
                  const isActiveMember = spySnap.exists() && spyData?.active === true;
                  const hasAccess = isOwner || isActiveMember;
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
                    useStore.setState({ userWarnings: snapshot.docs.map(d => d.data() as Warning) });
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
                    onSnapshot(query(collection(db, 'complaints'), orderBy('timestamp', 'desc')), (snapshot) => {
                      useStore.setState({ complaints: snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Complaint)) });
                    }, (err) => console.warn("Staff Listener - Complaints Access Denied:", err.message)),
                    onSnapshot(query(collection(db, 'groups', 'monitoring', 'posts'), orderBy('timestamp', 'desc'), limit(50)), (snapshot) => {
                      const posts = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as GroupPost));
                      useStore.setState(state => ({ groupPosts: { ...state.groupPosts, monitoring: posts } }));
                    }, (err) => console.warn("Staff Listener - Monitoring Posts Access Denied:", err.message)),
                    onSnapshot(query(collection(db, 'debtAdjustments'), orderBy('requestedAt', 'desc')), (snapshot) => {
                      useStore.setState({ debtAdjustments: snapshot.docs.map(d => ({ id: d.id, ...d.data() } as DebtAdjustment)) });
                    }, (err) => console.warn("Staff Listener - Debt Adjustments Access Denied:", err.message))
                  );
                } else {
                  // Standard users only see their own debts and rewards
                  roleUnsubscribes.push(
                    onSnapshot(query(collection(db, 'debts'), or(where('user1Id', '==', firebaseUser.uid), where('user2Id', '==', firebaseUser.uid))), (snapshot) => {
                      useStore.setState({ debts: snapshot.docs.map(d => ({ id: d.id, ...d.data() } as NetDebt)) });
                    }, errorHandler('Debts-Personal')),
                    onSnapshot(query(collection(db, 'rewards'), where('userId', '==', firebaseUser.uid)), (snapshot) => {
                       useStore.setState({ rewards: snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Reward)) });
                    }, errorHandler('Rewards-Personal'))
                  );
                }

                if (calculatedRole === 'admin') {
                  roleUnsubscribes.push(
                    onSnapshot(query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'), limit(100)), (snapshot) => {
                      useStore.setState({ activityLogs: snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ActivityLog)) });
                    }, (err) => console.warn("Admin Listener - ActivityLogs Denied:", err.message))
                  );
                }
              }
            } else {
              // AUTO-PROVISION if document missing
              const email = (firebaseUser.email || '').toLowerCase();
              const usernameFromEmail = email.split('@')[0] || 'user';
              const bootstrapAdmins = ['patty@debtflow.com', 'chiti@debtflow.com', 'simbaplayzofficial@gmail.com', 'simba@debtflow.com'];
              const isBootstrapAdmin = bootstrapAdmins.includes(email);
              
              const profile: UserProfile = {
                id: firebaseUser.uid,
                username: usernameFromEmail,
                role: isBootstrapAdmin ? 'admin' : 'user',
                requestedRole: null,
                status: 'active',
                warningCount: 0,
                integrityScore: 100,
                integrityLevel: 0,
                debtOwed: 0,
                debtToMe: 0,
                ratingAverage: 0,
                ratingCount: 0,
                totalLendingTransactions: 0,
                isPermanentlyRemoved: false,
                communityServicesNeeded: 0,
                isCommunityServiceParticipant: false
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
        onSnapshot(query(collection(db, 'monitoringPillars'), orderBy('timestamp', 'desc')), (snapshot) => {
          const monitoringPillars = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MonitoringPillar));
          useStore.setState({ monitoringPillars, justiceNexus: monitoringPillars });
        }, errorHandler('MonitoringPillars')),
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
        }, errorHandler('Votes'))
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
