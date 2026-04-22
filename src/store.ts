import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { db, auth } from './firebase';
import { 
  collection, doc, setDoc, onSnapshot, updateDoc, writeBatch, 
  getDoc, query, where, orderBy, limit, Timestamp, getDocs,
  DocumentData, QueryDocumentSnapshot
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  signOut, onAuthStateChanged, User as FirebaseUser,
  reauthenticateWithCredential, updatePassword as updateAuthPassword, 
  EmailAuthProvider, updateEmail
} from 'firebase/auth';

export type UserRole = 'USER' | 'ADMIN' | 'ADD_ADMIN' | 'MONITOR';

export type UserProfile = {
  id: string;
  username: string;
  role: UserRole;
  warningLevel: number;
  integrityScore: number; // 0-100 where 100 is perfect
  integrityLevel: number; // 0-5
  debtOwed: number;
  debtToMe: number;
  ratingAverage: number;
  ratingCount: number;
  totalLendingTransactions: number;
  isPermanentlyRemoved: boolean;
  restrictedUntil?: string;
  communityServicesNeeded: number;
  isCommunityServiceParticipant?: boolean;
};

export type Warning = {
  id: string;
  level: number;
  reason: string;
  issuedBy: string;
  timestamp: string;
};

export type TransactionStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';

export type TransactionType = 'lend' | 'pay';

export type Transaction = {
  id: string;
  senderId: string;
  receiverId: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  workName: string;
  pages: number;
  isCommunityService: boolean;
  timestamp: string; // ISO for client sort
  createdAt: any; // Server timestamp for rules
  rating?: number;
  isForgiven?: boolean;
};

export type ActivityLog = {
  id: string;
  userId: string;
  username: string;
  action: string;
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
  timestamp: string;
};

export type Verdict = {
  id: string; // matches caseId
  verdict: string;
  actionTaken: string;
  resolvedBy: string;
  timestamp: string;
};

export type GroupId = 'studying' | 'monitoring' | 'chatting' | 'resolving' | 'complaints';

export type GroupPost = {
  id: string;
  groupId: GroupId;
  authorId: string;
  content: string;
  timestamp: string;
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

export type Bill = {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  lastEditedBy?: string;
  timestamp: string;
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

type State = {
  currentUser: UserProfile | null;
  users: UserProfile[];
  debts: NetDebt[];
  transactions: Transaction[];
  announcements: Announcement[];
  complaints: Complaint[];
  resolvingDeck: ResolvingCase[];
  justiceNexus: Verdict[];
  systemStatus: SystemStatus | null;
  activityLogs: ActivityLog[];
  debtAdjustments: DebtAdjustment[];
  userWarnings: Warning[];
  groupPosts: Record<GroupId, GroupPost[]>;
  rolesConfig: RoleConfig;
  bills: Bill[];
  billComments: BillComment[];
  billStaffComments: BillStaffComment[];
  
  isLoading: boolean;
  authError: string | null;
  
  // Auth
  login: (username: string, password: string) => Promise<boolean>;
  signUp: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  
  // Core Actions
  addTransaction: (borrowerId: string, workName: string, pages: number, type: TransactionType, isCommunityService?: boolean) => Promise<void>;
  approveTransaction: (txId: string) => Promise<void>;
  rejectTransaction: (txId: string) => Promise<void>;
  finalizeTransaction: (txId: string, rating: number) => Promise<void>;
  requestForgiveness: (txId: string) => Promise<void>;
  resolveForgiveness: (adjustmentId: string, approved: boolean) => Promise<void>;
  
  // Admin Actions
  postAnnouncement: (title: string, content: string, section: AnnouncementSection) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  issueWarning: (username: string, level: number, reason: string) => Promise<void>;
  postVerdict: (caseId: string, verdictText: string, actionTaken: string) => Promise<void>;
  createResolvingCase: (description: string, involvedUsers: string[]) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  updateUsername: (newUsername: string) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateSystemStatus: (level: 1 | 2 | 3) => Promise<void>;
  updateRolesConfig: (admins: string[], monitors: string[]) => Promise<void>;
  
  // Monitor Deck Bills
  createBill: (title: string, description: string) => Promise<void>;
  updateBill: (billId: string, title: string, description: string) => Promise<void>;
  postBillComment: (billId: string, message: string) => Promise<void>;
  postBillStaffComment: (billId: string, message: string) => Promise<void>;

  resetSystem: () => Promise<void>;
  
  // Complaints
  addComplaint: (content: string) => Promise<void>;
  reviewComplaint: (complaintId: string) => Promise<void>;
  
  // Groups
  postToGroup: (groupId: GroupId, content: string) => Promise<void>;
  
  // Helpers
  calculateDebt: (pages: number) => number;
  logActivity: (action: string, details: any, userId?: string, username?: string) => Promise<void>;
};

export const useStore = create<State>()((set, get) => ({
  currentUser: null,
  users: [],
  debts: [],
  transactions: [],
  announcements: [],
  complaints: [],
  resolvingDeck: [],
  justiceNexus: [],
  systemStatus: null,
  activityLogs: [],
  debtAdjustments: [],
  userWarnings: [],
  bills: [],
  billComments: [],
  billStaffComments: [],
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

  logActivity: async (action, details, userId, username) => {
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
        action,
        details,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Activity Logging Failed:", error);
    }
  },

  calculateDebt: (pages) => {
    if (pages >= 1 && pages <= 5) return 1;
    if (pages >= 6 && pages <= 10) return 2;
    if (pages >= 11 && pages <= 15) return 3;
    if (pages >= 16 && pages <= 20) return 4;
    return 5; // 20+
  },

  login: async (username, password) => {
    set({ authError: null });
    
    if (!username || !password || !username.trim() || !password.trim()) {
      set({ authError: "Missing credentials" });
      return false;
    }
    
    const uname = username.trim().toLowerCase();
    const email = `${uname}@debtflow.com`;
    const pass = password.trim();

    console.log("LOGIN REQUEST - EMAIL:", email);
    // Do not log raw password in production usually, but keeping for debug as requested
    console.log("LOGIN REQUEST - PASSWORD:", pass);

    try {
      const { user } = await signInWithEmailAndPassword(auth, email, pass);
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        await get().logActivity('LOGIN', `User @${userData.username} logged in`, user.uid, userData.username);
      }
      return true;
    } catch (error: any) {
      console.error("Firebase Login Error Code:", error.code);
      console.error("Firebase Login Error Message:", error.message);
      
      let message = "Invalid credentials";
      if (error.code === 'auth/network-request-failed') message = "Network error";
      else if (error.code === 'auth/too-many-requests') message = "Too many attempts. Try later.";
      
      set({ authError: message });
      return false;
    }
  },

  signUp: async (username, password) => {
    const { logActivity } = get();
    set({ authError: null });
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      set({ authError: "Username is required." });
      return false;
    }
    if (trimmedUsername.length < 3) {
      set({ authError: "Username must be at least 3 characters." });
      return false;
    }
    if (password.length < 6) {
      set({ authError: "Password too short (min 6 characters)." });
      return false;
    }

    try {
      // 1. Explicit Uniqueness Check in Firestore
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', trimmedUsername));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        set({ authError: "Username already taken" });
        return false;
      }

      // 2. Create Auth Account
      const email = `${trimmedUsername.toLowerCase()}@debtflow.com`;
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // 3. Store Profile
      const profile: UserProfile = {
        id: user.uid,
        username: trimmedUsername,
        role: 'USER', 
        warningLevel: 0,
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
      
      await setDoc(doc(db, 'users', user.uid), profile);
      await logActivity('SIGNUP', `New account created: @${trimmedUsername}`, user.uid, trimmedUsername);
      return true;
    } catch (error: any) {
      let message = "Account creation failed";
      if (error.code === 'auth/email-already-in-use') {
        message = "Username already taken";
      } else if (error.code === 'auth/operation-not-allowed') {
        message = "Authentication service issue. Please check your Firebase project configuration.";
      } else if (error.code === 'auth/network-request-failed') {
        message = "Network error. Please check your connection.";
      } else if (error.message) {
        message = error.message;
      }
      set({ authError: message });
      return false;
    }
  },

  logout: async () => {
    const { currentUser, logActivity } = get();
    if (currentUser) {
      await logActivity('LOGOUT', `User @${currentUser.username} logged out`);
    }
    await signOut(auth);
    set({ currentUser: null });
  },

  addTransaction: async (receiverId, workName, pages, type, isCommunityService) => {
    const { currentUser, users, calculateDebt, logActivity } = get();
    if (!currentUser) {
      console.error("CREATE_TRANSACTION_ERROR: No current user");
      return;
    }

    const receiver = users.find(u => u.id === receiverId);
    if (!receiver) {
      console.error("CREATE_TRANSACTION_ERROR: Receiver not found", receiverId);
      return;
    }

    if (receiver.isPermanentlyRemoved) {
      alert("This user is permanently removed from the system.");
      return;
    }

    if (receiver.restrictedUntil && new Date(receiver.restrictedUntil) > new Date()) {
      alert(`This user is currently restricted and cannot request work until ${new Date(receiver.restrictedUntil).toLocaleDateString()}.`);
      return;
    }
    
    const id = uuidv4();
    const amount = calculateDebt(pages);
    
    try {
      const { serverTimestamp } = await import('firebase/firestore');
      
      const transaction: Transaction = {
        id,
        senderId: currentUser.id,
        receiverId,
        type,
        workName,
        pages,
        amount,
        status: 'pending',
        isCommunityService: !!isCommunityService,
        timestamp: new Date().toISOString(),
        createdAt: serverTimestamp()
      };
      
      console.log("RECORIDNG_TRANSACTION_PAYLOAD:", transaction);
      await setDoc(doc(db, 'transactions', id), transaction);
      await logActivity('CREATE_TRANSACTION', { workName, type, pages, receiver: receiver.username });
      console.log("TRANSACTION_CREATED_SUCCESSFULLY:", id);
    } catch (error: any) {
      console.error("TRANSACTION_CREATE_FAILED:", error);
      alert(`System Error: Failed to record transaction. ${error.message}`);
    }
  },

  approveTransaction: async (txId) => {
    const { currentUser, logActivity, transactions, users } = get();
    if (!currentUser || (currentUser.role !== 'MONITOR' && currentUser.role !== 'ADMIN' && currentUser.role !== 'ADD_ADMIN')) return;
    
    const tx = transactions.find(t => t.id === txId);
    if (!tx || tx.status !== 'pending') return;

    try {
      const batch = writeBatch(db);
      
      // 1. Update status
      batch.update(doc(db, 'transactions', txId), { status: 'approved' });

      // 2. Net Ledger Update (Mandatory after approval)
      if (!tx.isCommunityService) {
        // We define u1, u2 for consistent mapping.
        // User's requested flow: "Recalculate balance between users after approval"
        // lend: sender is lender, receiver is borrower.
        // pay: sender is borrower, receiver is lender.
        const lenderId = tx.type === 'lend' ? tx.senderId : tx.receiverId;
        const borrowerId = tx.type === 'lend' ? tx.receiverId : tx.senderId;

        const u1 = lenderId < borrowerId ? lenderId : borrowerId;
        const u2 = lenderId < borrowerId ? borrowerId : lenderId;
        const debtId = `${u1}_${u2}`;
        
        const debtRef = doc(db, 'debts', debtId);
        const debtSnap = await getDoc(debtRef);
        
        let currentBalance = 0;
        if (debtSnap.exists()) {
          currentBalance = (debtSnap.data() as NetDebt).netBalance;
        }
        
        // If lenderId is u1, 'lend' increases netBalance (user2 owes user1 more)
        // If lenderId is u2, 'lend' decreases netBalance (user1 owes user2 more)
        const change = tx.type === 'lend' ? tx.amount : -tx.amount;
        const balanceChange = lenderId === u1 ? change : -change;
        const newBalance = currentBalance + balanceChange;

        batch.set(debtRef, {
          id: debtId,
          user1Id: u1,
          user2Id: u2,
          netBalance: newBalance,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        // Update User Profile cache (as in previous version)
        const sender = users.find(u => u.id === tx.senderId);
        const receiver = users.find(u => u.id === tx.receiverId);
        
        if (sender && receiver) {
          if (tx.type === 'lend') {
             batch.update(doc(db, 'users', sender.id), { debtToMe: (sender.debtToMe || 0) + tx.amount });
             batch.update(doc(db, 'users', receiver.id), { debtOwed: (receiver.debtOwed || 0) + tx.amount });
          } else {
             batch.update(doc(db, 'users', sender.id), { debtOwed: Math.max(0, (sender.debtOwed || 0) - tx.amount) });
             batch.update(doc(db, 'users', receiver.id), { debtToMe: Math.max(0, (receiver.debtToMe || 0) - tx.amount) });
          }
        }
      } else {
        // Community Service check
        const receiver = users.find(u => u.id === tx.receiverId);
        if (receiver && receiver.communityServicesNeeded > 0) {
           batch.update(doc(db, 'users', receiver.id), {
             communityServicesNeeded: Math.max(0, receiver.communityServicesNeeded - 1)
           });
        }
      }

      await batch.commit();
      await logActivity('APPROVE_TRANSACTION', { txId, receiver: tx.receiverId });
    } catch (error) {
      console.error("Monitor Approval Error:", error);
    }
  },

  rejectTransaction: async (txId) => {
    const { currentUser, logActivity, transactions } = get();
    if (!currentUser || (currentUser.role !== 'MONITOR' && currentUser.role !== 'ADMIN' && currentUser.role !== 'ADD_ADMIN')) return;
    
    const tx = transactions.find(t => t.id === txId);
    if (!tx || tx.status !== 'pending') return;

    await updateDoc(doc(db, 'transactions', txId), { status: 'rejected' });
    await logActivity('REJECT_TRANSACTION', { txId, receiver: tx.receiverId });
  },

  finalizeTransaction: async (txId, rating) => {
    const { currentUser, transactions, users, logActivity } = get();
    if (!currentUser) return;
    
    const tx = transactions.find(t => t.id === txId);
    // borrower acknowledges it
    const borrowerId = tx?.type === 'lend' ? tx.receiverId : tx.senderId;
    const lenderId = tx?.type === 'lend' ? tx.senderId : tx.receiverId;

    if (!tx || borrowerId !== currentUser.id || tx.status !== 'approved') return;
    
    const lender = users.find(u => u.id === lenderId);
    if (!lender) return;

    const batch = writeBatch(db);
    
    // Update Transaction
    batch.update(doc(db, 'transactions', txId), { status: 'completed', rating });
    
    const newCount = lender.ratingCount + 1;
    const newAvg = (lender.ratingAverage * lender.ratingCount + rating) / newCount;
    
    batch.update(doc(db, 'users', lender.id), {
      totalLendingTransactions: lender.totalLendingTransactions + 1,
      ratingAverage: newAvg,
      ratingCount: newCount
    });
    
    await batch.commit();
    await logActivity('WORK_ASSIGNED', { txId, workName: tx.workName, rating });
  },

  requestForgiveness: async (txId) => {
    const { currentUser, transactions, logActivity } = get();
    if (!currentUser) return;
    
    const tx = transactions.find(t => t.id === txId);
    const lenderId = tx?.type === 'lend' ? tx.senderId : tx.receiverId;
    const borrowerId = tx?.type === 'lend' ? tx.receiverId : tx.senderId;

    if (!tx || lenderId !== currentUser.id || tx.status !== 'completed' || tx.isForgiven) return;
    
    const id = uuidv4();
    await setDoc(doc(db, 'debtAdjustments', id), {
      id,
      transactionId: txId,
      borrowerId,
      lenderId: currentUser.id,
      amount: tx.amount,
      status: 'REQUESTED',
      requestedAt: new Date().toISOString()
    } as DebtAdjustment);

    await logActivity('REQUEST_FORGIVENESS', { txId, borrowerId });
  },

  resolveForgiveness: async (adjustmentId, approved) => {
    const { currentUser, debtAdjustments, users, logActivity } = get();
    if (!currentUser || currentUser.role !== 'ADMIN') return;

    const adj = debtAdjustments.find(a => a.id === adjustmentId);
    if (!adj || adj.status !== 'REQUESTED') return;

    const lender = users.find(u => u.id === adj.lenderId);
    const borrower = users.find(u => u.id === adj.borrowerId);

    if (!lender || !borrower) return;

    const batch = writeBatch(db);
    const status: AdjustmentStatus = approved ? 'APPROVED' : 'REJECTED';

    batch.update(doc(db, 'debtAdjustments', adjustmentId), {
      status,
      resolvedAt: new Date().toISOString(),
      resolvedBy: currentUser.id
    });

    if (approved) {
      batch.update(doc(db, 'transactions', adj.transactionId), { isForgiven: true });
      
      const u1 = adj.lenderId < adj.borrowerId ? adj.lenderId : adj.borrowerId;
      const u2 = adj.lenderId < adj.borrowerId ? adj.borrowerId : adj.lenderId;
      const debtId = `${u1}_${u2}`;
      
      const debtRef = doc(db, 'debts', debtId);
      const debtSnap = await getDoc(debtRef);
      
      if (debtSnap.exists()) {
        const currentBalance = (debtSnap.data() as NetDebt).netBalance;
        // Forgiveness is like a 'pay' from the lender back to borrower (reducing the debt)
        // Or essentially reversing a 'lend'.
        const change = -adj.amount;
        const balanceChange = adj.lenderId === u1 ? change : -change;
        
        batch.update(debtRef, {
          netBalance: currentBalance + balanceChange,
          updatedAt: new Date().toISOString()
        });
      }

      batch.update(doc(db, 'users', adj.lenderId), {
        debtToMe: Math.max(0, lender.debtToMe - adj.amount)
      });
      batch.update(doc(db, 'users', adj.borrowerId), {
        debtOwed: Math.max(0, borrower.debtOwed - adj.amount)
      });
    }

    await batch.commit();
    await logActivity('RESOLVE_FORGIVENESS', { adjustmentId, approved, borrower: borrower.username });
  },

  postAnnouncement: async (title, content, section) => {
    const { currentUser, logActivity } = get();
    if (!currentUser) return;
    
    // Monitors can only post to Monitoring or Resolving sections
    if (currentUser.role === 'MONITOR' && section === 'GLOBAL') return;
    if (currentUser.role === 'USER') return;
    
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
    await logActivity('ANNOUNCEMENT_CREATED', { title, section });
  },

  deleteAnnouncement: async (id) => {
    const { currentUser, logActivity, announcements } = get();
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'ADD_ADMIN')) return;
    
    const ann = announcements.find(a => a.id === id);
    if (!ann) return;

    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'announcements', id));
    
    await logActivity('ANNOUNCEMENT_DELETED', { title: ann.title });
  },

  resetSystem: async () => {
    const { currentUser, logActivity } = get();
    if (!currentUser || currentUser.role !== 'ADMIN') return;

    const { getDocs, query, collection, writeBatch, deleteDoc } = await import('firebase/firestore');
    
    const collectionsToReset = [
      'transactions', 'debts', 'announcements', 'resolvingDeck', 
      'justiceNexus', 'debtAdjustments', 'activityLogs', 'users'
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

    await logActivity('DATA_CLEARED', `Master reset executed by ${currentUser.username}`);
  },

  issueWarning: async (username, level, reason) => {
    const { currentUser, users, logActivity } = get();
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'MONITOR')) return;
    
    const target = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!target) {
      alert("User not found.");
      return;
    }

    const warningId = uuidv4();
    const newCount = (target.warningLevel || 0) + 1;
    const derivedLevel = Math.min(newCount, 5);

    const warning: Warning = {
      id: warningId,
      level: derivedLevel,
      reason,
      issuedBy: currentUser.id,
      timestamp: new Date().toISOString()
    };

    const updates: Partial<UserProfile> = { 
      warningLevel: newCount,
      integrityLevel: derivedLevel,
      integrityScore: Math.max(0, 100 - (derivedLevel * 20))
    };
    
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
      
      // Net Ledger Reset
      const debtorRelations = get().debts.filter(d => d.user1Id === target.id || d.user2Id === target.id);
      debtorRelations.forEach(rel => {
        batch.update(doc(db, 'debts', rel.id), { netBalance: 0, updatedAt: new Date().toISOString() });
      });
    } else if (derivedLevel >= 5) {
      updates.isPermanentlyRemoved = true;
    }
    
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', target.id), updates);
    batch.set(doc(db, 'users', target.id, 'warnings', warningId), warning);
    
    await batch.commit();
    await logActivity('WARNING_ISSUED', { level: derivedLevel, reason, target: target.username });
  },

  postVerdict: async (caseId, verdictText, actionTaken) => {
    const { currentUser, logActivity } = get();
    if (!currentUser || currentUser.role !== 'ADMIN') return;

    const batch = writeBatch(db);
    batch.set(doc(db, 'justiceNexus', caseId), {
      id: caseId,
      verdict: verdictText,
      actionTaken,
      resolvedBy: currentUser.id,
      timestamp: new Date().toISOString()
    });
    batch.update(doc(db, 'resolvingDeck', caseId), { status: 'resolved' });

    await batch.commit();
    await logActivity('POST_VERDICT', { caseId });
  },

  createResolvingCase: async (description, involvedUsers) => {
    const { currentUser, logActivity } = get();
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'MONITOR')) return;

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
      await logActivity('CREATE_CASE', { caseId: id, involvedUsers });
    } catch (error: any) {
      console.error("CREATE_CASE_ERROR:", error);
      throw error;
    }
  },

  updateSystemStatus: async (level) => {
    const { currentUser, logActivity } = get();
    if (!currentUser || currentUser.role !== 'ADMIN') return;

    await setDoc(doc(db, 'systemStatus', 'current'), {
      emergencyLevel: level,
      updatedBy: currentUser.id,
      timestamp: new Date().toISOString()
    });
    await logActivity('UPDATE_SYSTEM_STATUS', { emergencyLevel: level });
  },

  createBill: async (title, description) => {
    const { currentUser, logActivity } = get();
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'MONITOR')) return;

    try {
      const billId = uuidv4();
      const bill: Bill = {
        id: billId,
        title,
        description,
        createdBy: currentUser.id,
        timestamp: new Date().toISOString()
      };

      await setDoc(doc(db, 'bills', billId), bill);
      await logActivity('BILL_CREATED', { title });
    } catch (error: any) {
      console.error("CREATE_BILL_ERROR:", error);
      throw error;
    }
  },

  updateBill: async (billId, title, description) => {
    const { currentUser, logActivity } = get();
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'MONITOR')) return;

    try {
      await updateDoc(doc(db, 'bills', billId), {
        title,
        description,
        lastEditedBy: currentUser.id,
        timestamp: new Date().toISOString()
      });
      await logActivity('BILL_EDITED', { title });
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
    await get().logActivity('BILL_COMMENT', { billId, preview: message.substring(0, 30) });
  },

  postBillStaffComment: async (billId, message) => {
    const { currentUser } = get();
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'MONITOR')) return;

    const commentId = uuidv4();
    const comment: BillStaffComment = {
      id: commentId,
      userId: currentUser.id,
      role: currentUser.role,
      message,
      timestamp: new Date().toISOString()
    };

    await setDoc(doc(db, 'bills', billId, 'staffComments', commentId), comment);
    await get().logActivity('BILL_STAFF_COMMENT', { billId, preview: message.substring(0, 30) });
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
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'MONITOR')) return;
    
    const complaint = get().complaints.find(c => c.id === complaintId);
    if (!complaint) return;
    
    if (!complaint.reviewedBy.includes(currentUser.id)) {
      await updateDoc(doc(db, 'complaints', complaintId), {
        reviewedBy: [...complaint.reviewedBy, currentUser.id]
      });
      await logActivity('REVIEW_COMPLAINT', { complaintId });
    }
  },

  deleteUser: async (userId) => {
    const { currentUser, logActivity, users } = get();
    if (!currentUser || currentUser.role !== 'ADMIN') throw new Error("UNAUTHORIZED: Access Denied.");
    
    const target = users.find(u => u.id === userId);
    if (!target) throw new Error("NOT_FOUND: Subject not identified.");

    const batch = writeBatch(db);
    batch.delete(doc(db, 'users', userId));
    await batch.commit();
    
    await logActivity('USER_DELETED', { 
      subject: target.username, 
      id: userId,
      executor: currentUser.username 
    });
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

      await logActivity('USERNAME_CHANGED', { old: currentUser.username, new: trimmed });
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
      await logActivity('PASSWORD_CHANGED', `Password updated for @${currentUser.username}`);
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        throw new Error("Current password incorrect");
      }
      throw error;
    }
  },

  updateRolesConfig: async (admins, monitors) => {
    const { currentUser, logActivity } = get();
    if (!currentUser || currentUser.role !== 'ADMIN') return;
    
    await setDoc(doc(db, 'roles_config', 'global'), {
      admins,
      monitors
    });
    await logActivity('ROLES_CONFIG_UPDATED', { admins, monitors });
  },

  postToGroup: async (groupId, content) => {
    const { currentUser, logActivity } = get();
    if (!currentUser) return;
    
    if (groupId === 'monitoring' && currentUser.role !== 'MONITOR' && currentUser.role !== 'ADMIN') return;
    
    const id = uuidv4();
    await setDoc(doc(db, 'groups', groupId, 'posts', id), {
      id,
      groupId,
      authorId: currentUser.id,
      content,
      timestamp: new Date().toISOString()
    });
    await logActivity('GROUP_POST', `Posted to ${groupId}`);
  }
}));

// Manage subscriptions
let mainUnsubscribes: (() => void)[] = [];
let roleUnsubscribes: (() => void)[] = [];

const clearMainListeners = () => {
  mainUnsubscribes.forEach(unsub => unsub());
  mainUnsubscribes = [];
};

const clearRoleListeners = () => {
  roleUnsubscribes.forEach(unsub => unsub());
  roleUnsubscribes = [];
};

// Global Roles Config Listener (Always active to support login checks)
onSnapshot(doc(db, 'roles_config', 'global'), (docSnap) => {
  if (docSnap.exists()) {
    useStore.setState({ rolesConfig: docSnap.data() as RoleConfig });
  }
});

onAuthStateChanged(auth, async (firebaseUser) => {
  try {
    clearMainListeners();
    clearRoleListeners();

    if (firebaseUser) {
      if (!firebaseUser.uid) {
        console.error("User authenticated but UID is missing");
        useStore.setState({ isLoading: false });
        return;
      }

      // 1. Fetch Roles Config sequentially before setting up profile listeners
      const rolesRef = doc(db, 'roles_config', 'global');
      const rolesSnap = await getDoc(rolesRef);
      
      if (!rolesSnap.exists()) {
        console.error("Critical System Configuration Error: roles_config document missing at path roles_config/global");
        useStore.setState({ isLoading: false });
      } else {
        useStore.setState({ rolesConfig: rolesSnap.data() as RoleConfig });
      }

      // 2. User Profile Listener
      const docRef = doc(db, 'users', firebaseUser.uid);
      mainUnsubscribes.push(
        onSnapshot(docRef, async (docSnap) => {
          try {
            const { rolesConfig, currentUser: prevUser } = useStore.getState();
            
            if (docSnap.exists()) {
              const data = docSnap.data() as UserProfile;
              let calculatedRole: UserRole = 'USER';
              
              const admins = rolesConfig.admins || [];
              const monitors = rolesConfig.monitors || [];
              const uname = (data.username || '').toLowerCase();
              
              if (admins.map(a => a.toLowerCase()).includes(uname)) {
                calculatedRole = 'ADMIN';
              } else if (monitors.map(m => m.toLowerCase()).includes(uname)) {
                calculatedRole = 'MONITOR';
              }
              
              const newUser = { ...data, role: calculatedRole };
              useStore.setState({ currentUser: newUser });

              // 2.1 Warnings Listener for the user
              roleUnsubscribes.push(
                onSnapshot(collection(db, 'users', firebaseUser.uid, 'warnings'), (snapshot) => {
                  const userWarnings = snapshot.docs.map(d => d.data() as Warning);
                  useStore.setState({ userWarnings });
                }, (err) => console.warn("Warnings Listener Denied:", err.message))
              );

              // Start/Update Role-Specific Listeners
              if (!prevUser || prevUser.role !== calculatedRole) {
                clearRoleListeners();
                
                // Admin specific listeners
                if (calculatedRole === 'ADMIN') {
                  roleUnsubscribes.push(
                    onSnapshot(query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'), limit(100)), (snapshot) => {
                      const activityLogs = snapshot.docs.map(d => d.data() as ActivityLog);
                      useStore.setState({ activityLogs });
                    }, (err) => console.warn("Admin Listener - ActivityLogs Denied:", err.message))
                  );
                }

                // Admin or Monitor specific listeners
                if (calculatedRole === 'ADMIN' || calculatedRole === 'MONITOR') {
                  roleUnsubscribes.push(
                    onSnapshot(query(collection(db, 'complaints'), orderBy('timestamp', 'desc')), (snapshot) => {
                      const complaints = snapshot.docs.map(d => d.data() as Complaint);
                      useStore.setState({ complaints });
                    }, (err) => console.warn("Staff Listener - Complaints Access Denied:", err.message)),
                    onSnapshot(query(collection(db, 'groups', 'monitoring', 'posts'), orderBy('timestamp', 'desc'), limit(50)), (snapshot) => {
                      const posts = snapshot.docs.map(d => d.data() as GroupPost);
                      useStore.setState(state => ({
                        groupPosts: { ...state.groupPosts, monitoring: posts }
                      }));
                    }, (err) => console.warn("Staff Listener - Monitoring Posts Access Denied:", err.message)),
                    onSnapshot(query(collection(db, 'debtAdjustments'), orderBy('requestedAt', 'desc')), (snapshot) => {
                      const debtAdjustments = snapshot.docs.map(d => d.data() as DebtAdjustment);
                      useStore.setState({ debtAdjustments });
                    }, (err) => console.warn("Staff Listener - Debt Adjustments Access Denied:", err.message))
                  );
                }
              }
            } else {
              // AUTO-PROVISION
              const email = firebaseUser.email || '';
              const usernameFromEmail = email.split('@')[0] || 'user';
              
              const admins = rolesConfig.admins || [];
              const monitors = rolesConfig.monitors || [];
              
              const isKnownAdmin = admins.map(a => a.toLowerCase()).includes(usernameFromEmail.toLowerCase());
              const isKnownMonitor = monitors.map(m => m.toLowerCase()).includes(usernameFromEmail.toLowerCase());

              const profile: UserProfile = {
                id: firebaseUser.uid,
                username: usernameFromEmail,
                role: isKnownAdmin ? 'ADMIN' : (isKnownMonitor ? 'MONITOR' : 'USER'),
                warningLevel: 0,
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
          }
        })
      );

      // 3. Core Collection Listeners
      const errorHandler = (name: string) => (err: any) => console.error(`Snapshot [${name}] Denied:`, err.message);

      mainUnsubscribes.push(
        onSnapshot(collection(db, 'users'), (snapshot) => {
          const users = snapshot.docs.map(d => d.data() as UserProfile);
          useStore.setState({ users });
        }, errorHandler('Users')),
        onSnapshot(collection(db, 'debts'), (snapshot) => {
          const debts = snapshot.docs.map(d => d.data() as NetDebt);
          useStore.setState({ debts });
        }, errorHandler('Debts')),
        onSnapshot(query(collection(db, 'transactions'), orderBy('timestamp', 'desc')), (snapshot) => {
          const transactions = snapshot.docs.map(d => d.data() as Transaction);
          useStore.setState({ transactions });
        }, errorHandler('Transactions')),
        onSnapshot(query(collection(db, 'announcements'), orderBy('timestamp', 'desc'), limit(50)), (snapshot) => {
          const announcements = snapshot.docs.map(d => d.data() as Announcement);
          useStore.setState({ announcements });
        }, errorHandler('Announcements')),
        onSnapshot(query(collection(db, 'resolvingDeck'), orderBy('timestamp', 'desc')), (snapshot) => {
          const resolvingDeck = snapshot.docs.map(d => d.data() as ResolvingCase);
          useStore.setState({ resolvingDeck });
        }, errorHandler('ResolvingDeck')),
        onSnapshot(query(collection(db, 'justiceNexus'), orderBy('timestamp', 'desc')), (snapshot) => {
          const justiceNexus = snapshot.docs.map(d => d.data() as Verdict);
          useStore.setState({ justiceNexus });
        }, errorHandler('JusticeNexus')),
        onSnapshot(doc(db, 'systemStatus', 'current'), (snapshot) => {
          if (snapshot.exists()) {
            useStore.setState({ systemStatus: snapshot.data() as SystemStatus });
          } else {
            // Initializing if doc not found
            useStore.setState({ systemStatus: { emergencyLevel: 1, updatedBy: 'system', timestamp: new Date().toISOString() } });
          }
        }, errorHandler('SystemStatus')),
        onSnapshot(query(collection(db, 'bills'), orderBy('timestamp', 'desc')), (snapshot) => {
           const bills = snapshot.docs.map(d => d.data() as Bill);
           useStore.setState({ bills });
        }, errorHandler('Bills')),
        // Standard users can also see their own adjustments
        onSnapshot(query(collection(db, 'debtAdjustments'), where('borrowerId', '==', firebaseUser.uid), orderBy('requestedAt', 'desc')), (snapshot) => {
           const debtAdjustments = snapshot.docs.map(d => d.data() as DebtAdjustment);
           const current = useStore.getState().debtAdjustments;
           // Merge or replace based on staff status logic is handled in role listeners
           if (useStore.getState().currentUser?.role === 'USER') {
             useStore.setState({ debtAdjustments });
           }
        }, errorHandler('UserAdjustments'))
      );

      // 4. Public Group Listeners
      const publicGroups: GroupId[] = ['studying', 'chatting', 'resolving', 'complaints'];
      publicGroups.forEach(gid => {
        mainUnsubscribes.push(
          onSnapshot(query(collection(db, 'groups', gid, 'posts'), orderBy('timestamp', 'desc'), limit(50)), (snapshot) => {
            const posts = snapshot.docs.map(d => d.data() as GroupPost);
            useStore.setState(state => ({
              groupPosts: { ...state.groupPosts, [gid]: posts }
            }));
          }, errorHandler(`Group:${gid}`))
        );
      });

    } else {
      useStore.setState({ currentUser: null });
    }
  } catch (authError: any) {
    console.error("System Auth Listener Error:", authError.message);
  } finally {
    useStore.setState({ isLoading: false });
  }
});
