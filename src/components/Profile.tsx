import React, { useState, useEffect } from "react";
import { useStore, Transaction, TransactionType, UserRole } from "../store";
import {
  History,
  Wallet,
  Receipt,
  Star,
  AlertTriangle,
  CheckCircle2,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ThumbsUp,
  Ban,
  ShieldAlert,
  ShieldCheck,
  Clock,
  UserCog,
  Lock,
  Key,
  RefreshCw,
  MessageSquare,
  EyeOff,
} from "lucide-react";
import { motion } from "motion/react";
import { BlackBox } from "./BlackBox";
import { AnonymousChatTerminal } from "./AnonymousChatTerminal";

export default function Profile() {
  const {
    currentUser,
    users,
    transactions,
    addTransaction,
    issueWarning,
    postAnnouncement,
    activityLogs,
    calculateDebt,
    userWarnings,
    debts,
    requestRole,
    updateUsername,
    updatePassword,
    anonymousComplaints,
  } = useStore();

  const [newUsername, setNewUsername] = useState(currentUser?.username || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<
    "info" | "security" | "role"
  >("info");
  const [targetRole, setTargetRole] = useState<UserRole | "">("");
  const [selectedComplainantThreadId, setSelectedComplainantThreadId] =
    useState<string | null>(null);

  useEffect(() => {
    if (currentUser) setNewUsername(currentUser.username);
  }, [currentUser?.username]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [pages, setPages] = useState(1);
  const [targetAskerId, setTargetAskerId] = useState("");
  const [isCommunityServiceTx, setIsCommunityServiceTx] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [ratingInput, setRatingInput] = useState<{
    txId: string;
    value: number;
  } | null>(null);

  // Derive People in Debt and People I Owe from the global state/ledgers
  const peopleWhoOweMe = debts
    .filter((d) => {
      if (d.user1Id === currentUser?.id) return d.netBalance > 0;
      if (d.user2Id === currentUser?.id) return d.netBalance < 0;
      return false;
    })
    .map((d) => {
      const otherId = d.user1Id === currentUser?.id ? d.user2Id : d.user1Id;
      const absBalance = Math.abs(d.netBalance);
      const user = users.find((u) => u.id === otherId);
      return { user, balance: absBalance };
    })
    .filter((item) => item.user);

  const peopleIOwe = debts
    .filter((d) => {
      if (d.user1Id === currentUser?.id) return d.netBalance < 0;
      if (d.user2Id === currentUser?.id) return d.netBalance > 0;
      return false;
    })
    .map((d) => {
      const otherId = d.user1Id === currentUser?.id ? d.user2Id : d.user1Id;
      const absBalance = Math.abs(d.netBalance);
      const user = users.find((u) => u.id === otherId);
      return { user, balance: absBalance };
    })
    .filter((item) => item.user);

  const totalOwedByMe = peopleIOwe.reduce((acc, curr) => acc + curr.balance, 0);
  const totalOwedToMe = peopleWhoOweMe.reduce(
    (acc, curr) => acc + curr.balance,
    0,
  );

  const myTransactions = transactions
    .filter(
      (t) => t.askerId === currentUser?.id || t.senderId === currentUser?.id,
    )
    .sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || a.createdAt || 0;
      const dateB = b.createdAt?.toDate?.() || b.createdAt || 0;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

  // Rating requests for me as Asker (Borrower)
  const pendingRatings = transactions.filter(
    (t) => t.askerId === currentUser?.id && t.status === "approved",
  );

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAskerId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addTransaction(targetAskerId, pages, isCommunityServiceTx);
      setShowAddModal(false);
      setPages(1);
      setTargetAskerId("");
      setIsCommunityServiceTx(false);
    } catch (err) {
      console.error("Submission UI Error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgiveness = async (borrowerId: string) => {
    const amount = prompt("Enter amount to forgive:");
    if (!amount) return;
    const num = parseInt(amount);
    if (!isNaN(num) && num > 0) {
      await useStore.getState().forgiveDebt(borrowerId, num);
      alert(`RESOLVED: ${num} debt forgiven.`);
    }
  };

  const getIntegrityColor = (level: number) => {
    switch (level) {
      case 0:
        return "text-green-500";
      case 1:
        return "text-lime-400";
      case 2:
        return "text-yellow-500";
      case 3:
        return "text-orange-500";
      case 4:
        return "text-red-400";
      case 5:
        return "text-red-600";
      default:
        return "text-neutral-400";
    }
  };

  const getIntegrityBg = (level: number) => {
    switch (level) {
      case 0:
        return "bg-green-500";
      case 1:
        return "bg-lime-400";
      case 2:
        return "bg-yellow-500";
      case 3:
        return "bg-orange-500";
      case 4:
        return "bg-red-400";
      case 5:
        return "bg-red-600";
      default:
        return "bg-neutral-800";
    }
  };

  const currentWarningDescription = () => {
    if (!currentUser) return null;
    const level = currentUser.integrityLevel;
    if (level === 0) return "Account is in good standing.";
    if (level === 1) return "Just warning issued. No penalties.";
    if (level === 2)
      return `Must complete ${currentUser.communityServicesNeeded} community services. Cannot gain new debts.`;
    if (level === 3)
      return `Restricted until ${new Date(currentUser.restrictedUntil || "").toLocaleDateString()}. Cannot request work or run for admin.`;
    if (level === 4) return "All debts reset. Removed from group for 1 month.";
    if (level === 5) return "Permanent removal assigned.";
    return "No active warnings.";
  };

  const handleUsernameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || isUpdatingProfile) return;
    setIsUpdatingProfile(true);
    try {
      await updateUsername(newUsername);
      alert("IDENTITY UPDATED: Username change successful.");
    } catch (err: any) {
      alert(`UPDATE FAILED: ${err.message}`);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || isUpdatingProfile) return;
    setIsUpdatingProfile(true);
    try {
      await updatePassword(currentPassword, newPassword);
      alert("SECURITY UPDATED: Password change successful.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      alert(`SECURITY FAILED: ${err.message}`);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Operator Deck header and stealthy access button */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-900">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-center relative">
            <UserCog size={22} className="text-neutral-500" />

            {/* OPTION 2 - Stealthy hidden red indicator dot for classified entry */}
            {currentUser?.specialOpsAccess === true && (
              <button
                onClick={() => {
                  useStore.getState().setSpecialOpsMode(true);
                  alert(
                    "SECURE HANDSHAKE COMPLETED: Initializing Classified Special Ops Session.",
                  );
                }}
                className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-650/40 rounded-full hover:bg-red-500 hover:shadow-[0_0_8px_rgba(239,68,68,0.8)] border border-black/40 transition-all cursor-pointer"
                title="..."
              />
            )}
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-widest italic text-neutral-200">
              Operator Deck
            </h2>
            <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest mt-0.5">
              Node access coordinates & cryptographic status
            </p>
          </div>
        </div>
      </div>

      {/* User Stats Card */}
      <div className="grid sm:grid-cols-3 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ArrowUpRight size={100} />
          </div>
          <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mb-4">
            Investments
          </p>
          <p className="text-4xl font-black italic mb-2 text-green-500">
            {totalOwedToMe}
          </p>
          <p className="text-neutral-400 text-sm">Debt people owe you</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ArrowDownRight size={100} />
          </div>
          <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mb-4">
            Liabilities
          </p>
          <p className="text-4xl font-black italic mb-2 text-red-500">
            {totalOwedByMe}
          </p>
          <p className="text-neutral-400 text-sm">Debt you owe others</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ShieldAlert
              size={100}
              className={getIntegrityColor(currentUser?.integrityLevel || 0)}
            />
          </div>
          <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mb-4">
            Integrity Level
          </p>
          <div className="flex items-end gap-3 mb-2">
            <p
              className={`text-4xl font-black italic ${getIntegrityColor(currentUser?.integrityLevel || 0)}`}
            >
              LVL {currentUser?.integrityLevel ?? 0}
            </p>
            <p className="text-neutral-500 text-[10px] font-bold uppercase mb-1">
              {currentUser?.integrityScore}% Score
            </p>
          </div>
          <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full transition-all duration-1000 ${getIntegrityBg(currentUser?.integrityLevel || 0)}`}
              style={{ width: `${currentUser?.integrityScore ?? 100}%` }}
            />
          </div>
          <p className="text-neutral-400 text-[10px] truncate font-medium uppercase tracking-tighter">
            {currentWarningDescription()}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Actions & Transactions */}
        <div className="space-y-8">
          {/* Identity & Security Section */}
          <section className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden">
            <div className="flex border-b border-neutral-800">
              <button
                onClick={() => setActiveSettingsTab("info")}
                className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeSettingsTab === "info" ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-neutral-300"}`}
              >
                <span className="flex items-center justify-center gap-2">
                  <UserCog size={14} />
                  Identity
                </span>
              </button>
              <button
                onClick={() => setActiveSettingsTab("security")}
                className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeSettingsTab === "security" ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-neutral-300"}`}
              >
                <span className="flex items-center justify-center gap-2">
                  <Lock size={14} />
                  Security
                </span>
              </button>
              <button
                onClick={() => setActiveSettingsTab("role")}
                className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeSettingsTab === "role" ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-neutral-300"}`}
              >
                <span className="flex items-center justify-center gap-2">
                  <ShieldCheck size={14} />
                  Authority
                </span>
              </button>
            </div>

            <div className="p-8">
              {activeSettingsTab === "info" ? (
                <form onSubmit={handleUsernameUpdate} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">
                      Display Username
                    </label>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-200 focus:outline-none focus:border-blue-500 transition-all text-sm font-bold shadow-inner"
                      placeholder="New identifier..."
                    />
                    <p className="text-[9px] text-neutral-600 mt-2 italic">
                      Requires uniqueness protocol check before validation.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={
                      isUpdatingProfile || newUsername === currentUser?.username
                    }
                    className="w-full bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-200 text-[10px] font-black py-3 rounded-xl uppercase tracking-widest transition-all border border-neutral-700"
                  >
                    {isUpdatingProfile ? "Processing..." : "Update Identity"}
                  </button>
                </form>
              ) : activeSettingsTab === "security" ? (
                <form onSubmit={handlePasswordUpdate} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <Key
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-700"
                          size={14}
                        />
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-11 pr-4 py-3 text-neutral-200 focus:outline-none focus:border-red-500/50 transition-all text-sm font-bold shadow-inner"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">
                        New Password Secret
                      </label>
                      <div className="relative">
                        <Lock
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-700"
                          size={14}
                        />
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-11 pr-4 py-3 text-neutral-200 focus:outline-none focus:border-blue-500 transition-all text-sm font-bold shadow-inner"
                          placeholder="Min. 6 characters"
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={
                      isUpdatingProfile ||
                      !currentPassword ||
                      newPassword.length < 6
                    }
                    className="w-full bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-200 text-[10px] font-black py-3 rounded-xl uppercase tracking-widest transition-all border border-neutral-700"
                  >
                    {isUpdatingProfile
                      ? "Rotatings Keys..."
                      : "Rotate Secret Key"}
                  </button>
                </form>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="p-6 bg-blue-600/5 border border-blue-600/10 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <ShieldCheck size={48} />
                    </div>
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2">
                      Authority Status
                    </p>
                    <p className="text-sm font-bold text-neutral-200 uppercase tracking-tighter">
                      Current Rank:{" "}
                      <span className="text-blue-400">{currentUser?.role}</span>
                    </p>
                    {currentUser?.requestedRole && (
                      <div className="mt-4 flex items-center gap-2 text-orange-500">
                        <Clock size={12} className="animate-spin" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">
                          Validation Pending: {currentUser.requestedRole}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">
                      Apply for Authority Level
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {(["monitor", "admin"] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setTargetRole(r)}
                          className={`py-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                            targetRole === r
                              ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20"
                              : "bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-700"
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                    <p className="text-[9px] text-neutral-600 italic">
                      Administrators will manually verify your profile history
                      and integrity scores before granting access.
                    </p>
                  </div>

                  <button
                    onClick={async () => {
                      if (targetRole) {
                        await requestRole(targetRole);
                        alert(
                          "APPLICATION SUBMITTED: Your request is now in the validation queue.",
                        );
                      }
                    }}
                    disabled={
                      !targetRole ||
                      currentUser?.requestedRole === targetRole ||
                      currentUser?.role === targetRole
                    }
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-600 disabled:border-neutral-700 disabled:opacity-50 text-white text-[10px] font-black py-4 rounded-xl uppercase tracking-widest transition-all border border-blue-500 shadow-lg shadow-blue-600/20"
                  >
                    {currentUser?.requestedRole
                      ? "Update Request"
                      : "Submit Access Request"}
                  </button>
                </div>
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold italic flex items-center gap-2">
                <Receipt className="text-blue-500" size={20} />
                Transaction Center
              </h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/20"
              >
                <Plus size={16} />
                Add Transaction
              </button>
            </div>

            {/* Pending actions for Asker (Rating Prompt) */}
            {pendingRatings.length > 0 && (
              <div className="mb-8 space-y-4">
                <h3 className="text-xs font-bold text-orange-500 uppercase tracking-widest flex items-center gap-2">
                  <AlertTriangle size={14} />
                  Pending Work Ratings
                </h3>
                {pendingRatings.map((tx) => (
                  <div
                    key={tx.id}
                    className="bg-orange-500/5 border border-orange-500/10 p-5 rounded-2xl"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-neutral-100">
                            {users.find((u) => u.id === tx.senderId)?.username}{" "}
                            lended you work
                          </p>
                          {tx.isCommunityService && (
                            <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">
                              CS
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-neutral-500">
                          Wait for your feedback...
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black italic text-orange-500">
                          {tx.isCommunityService ? "0 (CS)" : tx.debt} DEBT
                        </p>
                        <p className="text-[10px] text-neutral-500">
                          {tx.pages} pages
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest text-center">
                        Rate out of 5
                      </p>
                      <div className="flex items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((v) => (
                            <button
                              key={v}
                              onClick={async () => {
                                await useStore
                                  .getState()
                                  .submitRating(tx.id, v);
                              }}
                              className="p-1 hover:text-yellow-500 text-neutral-600 transition-colors"
                            >
                              <Star
                                size={28}
                                fill="currentColor"
                                strokeWidth={1}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden">
              <div className="p-6 border-b border-neutral-800 bg-neutral-950/50">
                <h3 className="text-sm font-bold opacity-60 uppercase tracking-widest">
                  Recent Activity
                </h3>
              </div>
              <div className="divide-y divide-neutral-800">
                {myTransactions.slice(0, 10).map((tx) => (
                  <div
                    key={tx.id}
                    className="p-6 flex items-center justify-between hover:bg-neutral-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-neutral-950 rounded-xl">
                        <History className="text-neutral-500" size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-neutral-200">
                          Transfer of {tx.pages} pages
                          {tx.isCommunityService && (
                            <span className="ml-2 text-[8px] text-blue-500 font-bold border border-blue-500/30 px-1 rounded">
                              CS
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-neutral-500">
                          {tx.senderId === currentUser?.id
                            ? `Lended work to @${users.find((u) => u.id === tx.askerId)?.username}`
                            : `Received work from @${users.find((u) => u.id === tx.senderId)?.username}`}
                          <span
                            className={`ml-2 uppercase font-black px-1 rounded text-[8px] ${
                              tx.status === "pending"
                                ? "bg-yellow-500/10 text-yellow-500"
                                : tx.status === "approved"
                                  ? "bg-blue-500/10 text-blue-500"
                                  : tx.status === "rejected"
                                    ? "bg-red-500/10 text-red-500"
                                    : "bg-green-500/10 text-green-500"
                            }`}
                          >
                            [{tx.status}]
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black italic text-neutral-200">
                        {tx.senderId === currentUser?.id ? "+" : "-"}
                        {tx.isCommunityService ? 0 : tx.debt} DB
                      </p>
                      {tx.status === "completed" && (
                        <div className="flex items-center gap-1 justify-end text-[10px] text-yellow-500 font-bold">
                          <Star size={10} fill="currentColor" /> {tx.rating}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {myTransactions.length === 0 && (
                  <div className="p-10 text-center text-neutral-600 text-sm italic">
                    No activity recorded yet.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* User Sidebar Details */}
        <div className="space-y-8">
          {/* Active Debt Relations */}
          <section>
            <h2 className="text-md font-bold uppercase tracking-widest text-neutral-500 mb-6 flex items-center gap-2">
              <Wallet size={16} />
              Net Ledger
            </h2>
            <div className="space-y-6">
              {/* WHO OWES ME */}
              {peopleWhoOweMe.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-3">
                    People who owe me
                  </p>
                  <div className="space-y-2">
                    {peopleWhoOweMe.map((item) => (
                      <div
                        key={item.user?.id}
                        className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex items-center justify-between"
                      >
                        <p className="text-xs font-bold text-neutral-200">
                          @{item.user?.username}
                        </p>
                        <p className="text-xs font-black text-green-500">
                          {item.balance} DB
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* WHO I OWE */}
              {peopleIOwe.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-3">
                    People I owe
                  </p>
                  <div className="space-y-2">
                    {peopleIOwe.map((item) => (
                      <div
                        key={item.user?.id}
                        className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex items-center justify-between"
                      >
                        <p className="text-xs font-bold text-neutral-200">
                          @{item.user?.username}
                        </p>
                        <p className="text-xs font-black text-red-500">
                          {item.balance} DB
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {peopleWhoOweMe.length === 0 && peopleIOwe.length === 0 && (
                <div className="bg-neutral-900/50 border border-neutral-800 border-dashed p-6 rounded-2xl text-center">
                  <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest">
                    Balanced Ledger
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Forgiveness Area */}
          <section>
            <h2 className="text-md font-bold uppercase tracking-widest text-neutral-500 mb-6 flex items-center gap-2">
              <ThumbsUp size={16} />
              Forgiveness Area
            </h2>
            <div className="space-y-4">
              {transactions
                .filter(
                  (t) =>
                    t.senderId === currentUser?.id && t.status === "completed",
                )
                .slice(0, 3)
                .map((tx) => (
                  <div
                    key={tx.id}
                    className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl flex items-center justify-between group"
                  >
                    <div>
                      <p className="text-sm font-bold text-neutral-200">
                        {users.find((u) => u.id === tx.askerId)?.username}{" "}
                        repaid you {tx.debt} DB
                      </p>
                      <p className="text-[10px] text-neutral-500 italic mt-0.5">
                        Recorded on{" "}
                        {tx.createdAt?.toDate?.()?.toLocaleDateString() ||
                          new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => {}}
                      className="p-2 text-neutral-600 hover:text-green-500 hover:bg-green-500/10 rounded-lg transition-all"
                      title="Request Forgiveness"
                    >
                      <CheckCircle2 size={20} />
                    </button>
                  </div>
                ))}
              {transactions.filter(
                (t) =>
                  t.senderId === currentUser?.id && t.status === "completed",
              ).length === 0 && (
                <div className="bg-neutral-900/50 border border-neutral-800 border-dashed p-6 rounded-2xl text-center text-neutral-600 text-xs">
                  No debtors to forgive currently.
                </div>
              )}
            </div>
          </section>

          {/* Warning History */}
          <section>
            <h2 className="text-md font-bold uppercase tracking-widest text-neutral-500 mb-6 flex items-center gap-2">
              <ShieldAlert size={16} />
              Integrity Records
            </h2>
            <div className="space-y-4">
              {userWarnings
                .sort(
                  (a, b) =>
                    new Date(b.timestamp).getTime() -
                    new Date(a.timestamp).getTime(),
                )
                .map((warn) => (
                  <div
                    key={warn.id}
                    className="bg-neutral-900 border border-red-500/10 p-5 rounded-2xl border-l-4 border-l-red-500"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-xs font-black text-red-500 uppercase tracking-widest">
                        Level {warn.level} Violation
                      </p>
                      <p className="text-[10px] text-neutral-500 font-mono">
                        {new Date(warn.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm text-neutral-200 leading-relaxed font-medium">
                      "{warn.reason}"
                    </p>
                    <div className="mt-3 pt-3 border-t border-neutral-800 flex items-center justify-between">
                      <p className="text-[10px] text-neutral-500 uppercase tracking-widest">
                        Issued By:{" "}
                        {users.find((u) => u.id === warn.issuedBy)?.username ||
                          "System Admin"}
                      </p>
                      {warn.level >= 3 && (
                        <span className="text-[8px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-black uppercase">
                          RESTRICTED
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              {userWarnings.length === 0 && (
                <div className="bg-neutral-900/50 border border-neutral-800 border-dashed p-10 rounded-2xl text-center">
                  <ShieldCheck
                    size={32}
                    className="mx-auto text-green-500/30 mb-3"
                  />
                  <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">
                    No violations on record
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Role specifics */}
          {(currentUser?.role === "admin" ||
            currentUser?.role === "monitor" ||
            currentUser?.role === "add_admin") && (
            <section className="bg-blue-600/5 border border-blue-600/10 p-8 rounded-3xl">
              <h2 className="text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <ShieldCheck size={14} />
                Administrative Access
              </h2>
              <div className="grid gap-3">
                {(currentUser.role === "admin" ||
                  currentUser.role === "add_admin" ||
                  currentUser.role === "monitor") && (
                  <button
                    onClick={() => {
                      const title = prompt("Announcement Title:");
                      const content = prompt("Announcement Content:");
                      if (title && content) {
                        const section =
                          currentUser.role === "monitor"
                            ? "MONITORING"
                            : "GLOBAL";
                        postAnnouncement(title, content, section);
                      }
                    }}
                    className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-neutral-200 text-xs font-bold uppercase tracking-widest transition-all"
                  >
                    Push {currentUser.role === "monitor" ? "Monitor" : "System"}{" "}
                    Announcement
                  </button>
                )}
                <button
                  onClick={() => {
                    const user = prompt("Enter username to warn:");
                    if (user) {
                      const level = parseInt(
                        prompt("Enter warning level (1-5):") || "0",
                      );
                      const reason = prompt("Enter reason:");
                      if (level && reason) issueWarning(user, level, reason);
                    }
                  }}
                  className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-neutral-200 text-xs font-bold uppercase tracking-widest transition-all"
                >
                  Issue Quick Punishment
                </button>
              </div>
            </section>
          )}

          {/* Profile Black Box Form */}
          <section className="pt-6 border-t border-neutral-800">
            <h2 className="text-md font-bold uppercase tracking-widest text-neutral-500 mb-6 flex items-center gap-2">
              <Lock size={16} className="text-amber-500" />
              Private Grievance Link
            </h2>
            <BlackBox source="profile_blackbox" />
          </section>

          {/* Anonymous Complaint Threads / Correspondence Section */}
          <section className="pt-6 border-t border-neutral-800 space-y-4">
            <h2 className="text-md font-bold uppercase tracking-widest text-neutral-500 mb-2 flex items-center gap-2">
              <MessageSquare size={16} className="text-emerald-500" />
              Your Secure Complaint Channels
            </h2>
            <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-wider leading-relaxed pr-2 font-mono">
              COMMUNICATIONS ENCRYPTED. SENDER AND RECEIVER IDENTITY ARE COMPLETELY PROTECTED UNDER CONSTITUTIONAL PROTOCOLS.
            </p>

            <div className="space-y-3">
              {anonymousComplaints.map((c) => {
                const isActive = selectedComplainantThreadId === c.id;
                return (
                  <div
                    key={c.id}
                    className={`border rounded-2xl p-4 transition-all duration-200 ${
                      isActive
                        ? "bg-neutral-900 border-emerald-500/30"
                        : "bg-neutral-900/40 border-neutral-800 hover:border-neutral-750"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black uppercase text-orange-400 bg-orange-500/5 px-2 py-0.5 rounded border border-orange-500/10">
                            {c.category || "General"}
                          </span>
                          <span className="text-[8px] font-mono text-neutral-500">
                            Trans-ID: #{c.id.substring(0, 8)}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 line-clamp-2 italic pr-4">
                          "{c.message}"
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center">
                        {c.anonymousThreadId ? (
                          <button
                            onClick={() =>
                              setSelectedComplainantThreadId(
                                isActive ? null : c.id
                              )
                            }
                            className={`px-3.5 py-1.5 rounded-xl font-mono text-[9px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                              isActive
                                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/10 font-bold"
                                : "bg-neutral-800 text-emerald-400 border border-emerald-500/10 hover:bg-neutral-750"
                            }`}
                          >
                            {isActive ? "Close Channel" : "Open Secured Line"}
                          </button>
                        ) : (
                          <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-neutral-500 bg-neutral-950 px-2.5 py-1.5 rounded-xl border border-neutral-850 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                            Line Pending Monitor Claim
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Chat Drawer */}
                    {isActive && c.anonymousThreadId && (
                      <div className="mt-4 pt-4 border-t border-neutral-800/60 animate-in fade-in slide-in-from-top-2 duration-350">
                        <div className="p-3 bg-emerald-950/15 border border-emerald-500/10 rounded-xl mb-3 flex items-center gap-2 font-mono">
                          <EyeOff size={11} className="text-emerald-400" />
                          <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest animate-pulse">
                            Identity Encrypted / Secure Line Established
                          </span>
                        </div>
                        <AnonymousChatTerminal
                          threadId={c.id}
                          senderType="complainant"
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {anonymousComplaints.length === 0 && (
                <div className="bg-neutral-900/30 border border-neutral-850 border-dashed rounded-2xl p-8 py-10 text-center text-neutral-500 space-y-2">
                  <EyeOff size={24} className="mx-auto text-neutral-750" />
                  <p className="text-[10px] font-black uppercase tracking-wider">
                    No Active Grievance Lines
                  </p>
                  <p className="text-[9px] text-neutral-600 italic">
                    When you submit anonymous transmissions through the Black Box
                    systems, they will manifest here for communication.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="p-8">
              <h3 className="text-xl font-bold mb-6 italic">
                Record New Transaction
              </h3>
              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-neutral-950 border border-neutral-800 rounded-2xl mb-4">
                  <input
                    type="checkbox"
                    id="cs-check"
                    checked={isCommunityServiceTx}
                    onChange={(e) => setIsCommunityServiceTx(e.target.checked)}
                    className="w-4 h-4 bg-neutral-900 border-neutral-800 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor="cs-check"
                    className="text-xs font-bold text-blue-500 uppercase tracking-widest cursor-pointer"
                  >
                    Community Service Transaction
                  </label>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">
                    Asked By (Borrower)
                  </label>
                  <select
                    value={targetAskerId}
                    onChange={(e) => setTargetAskerId(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-200 focus:outline-none focus:border-blue-500 transition-all text-sm"
                    required
                  >
                    <option value="">Select a user...</option>
                    {users
                      .filter(
                        (u) =>
                          u.id !== currentUser?.id && !u.isPermanentlyRemoved,
                      )
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.username}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">
                    Number of Pages
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={pages}
                    onChange={(e) => setPages(parseInt(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-200 focus:outline-none focus:border-blue-500 transition-all text-sm font-mono text-center"
                    required
                  />
                </div>
                <div className="p-4 bg-blue-600/5 border border-blue-600/10 rounded-xl mb-4 text-center">
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">
                    Calculated Debt Value
                  </p>
                  <p className="text-3xl font-black italic">
                    {" "}
                    {calculateDebt(pages)} DB
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold py-3 rounded-xl transition-all text-xs uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!targetAskerId || !pages || isSubmitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-3 rounded-xl transition-all text-sm uppercase shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>Record Transaction</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
