"use client";

import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { getClientDb } from "@/lib/firebase/client";
import { useAuth } from "@/components/auth-provider";
import { Navigation } from "@/components/navigation";
import { BalanceCard } from "@/components/treasury/balance-card";
import { StatsPanel } from "@/components/treasury/stats-panel";
import { TransactionCard } from "@/components/treasury/transaction-card";
import { TransactionForm } from "@/components/treasury/transaction-form";
import { sortByDateDesc } from "@/lib/treasury-utils";
import type { TreasuryTransaction } from "@/types";
import type { TransactionInput } from "@/lib/validators";

export function TreasuryContent() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TreasuryTransaction | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    let db;
    try {
      db = getClientDb();
    } catch {
      return;
    }

    const transactionsQuery = query(
      collection(db, "transactions"),
      where("userId", "==", user.uid),
    );

    const unsubscribe = onSnapshot(
      transactionsQuery,
      (snapshot) => {
        const parsed = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            userId: data.userId,
            date: data.date,
            amount: Number(data.amount) || 0,
            type: data.type,
            category: data.category,
            note: data.note ?? "",
            createdAt: data.createdAt?.toDate?.(),
            updatedAt: data.updatedAt?.toDate?.(),
          } satisfies TreasuryTransaction;
        });

        parsed.sort(sortByDateDesc);
        setTransactions(parsed);
        setLoading(false);
      },
      () => {
        setError("Failed to load transactions");
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [user]);

  if (!user) return null;

  const addTransaction = async (data: TransactionInput) => {
    const db = getClientDb();
    const id = crypto.randomUUID();
    const ref = doc(db, "transactions", id);
    await setDoc(ref, {
      userId: user.uid,
      date: data.date,
      amount: Number(data.amount),
      type: data.type,
      category: data.category,
      note: data.note,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const updateTransaction = async (id: string, data: TransactionInput) => {
    const db = getClientDb();
    const ref = doc(db, "transactions", id);
    await setDoc(ref, {
      userId: user.uid,
      date: data.date,
      amount: Number(data.amount),
      type: data.type,
      category: data.category,
      note: data.note,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  };

  const deleteTransaction = async (id: string) => {
    const confirmed = window.confirm("Delete this transaction?");
    if (!confirmed) return;
    const db = getClientDb();
    await deleteDoc(doc(db, "transactions", id));
  };

  const handleEdit = (transaction: TreasuryTransaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleSubmit = async (data: TransactionInput) => {
    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, data);
    } else {
      await addTransaction(data);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };

  return (
    <main className="min-h-screen">
      <Navigation />
      
      <div className="px-4 py-8 md:px-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-[var(--lavender)] border-4 border-black p-1"
            style={{ boxShadow: '8px 8px 0px 0px black' }}
          >
            <div className="bg-[var(--white)] border-3 border-black p-6 flex items-center justify-between">
              <h1 className="neo-title text-3xl text-[var(--black)]">TREASURY</h1>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => setShowForm(true)}
                className="neo-button neo-button-primary flex items-center gap-2"
              >
                <Plus size={14} strokeWidth={3} /> ADD
              </motion.button>
            </div>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-[var(--coral)] border-4 border-black p-4"
                style={{ boxShadow: '8px 8px 0px 0px black' }}
              >
                <span className="neo-title text-sm text-[var(--black)]">ERROR: {error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <BalanceCard transactions={transactions} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <StatsPanel transactions={transactions} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="neo-card p-6"
          >
            <div className="flex items-center gap-2 mb-4 pb-3 border-b-4 border-black">
              <span className="neo-title text-sm text-[var(--lavender)]">►</span>
              <span className="neo-title text-sm">TRANSACTIONS</span>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="mx-auto mb-4 h-10 w-10 border-4 border-black bg-[var(--butter)]"
                  style={{ boxShadow: '6px 6px 0px 0px black' }}
                />
                <p className="neo-title animate-blink">LOADING...</p>
              </div>
            ) : transactions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <motion.div
                  className="h-6 w-6 bg-[var(--lavender)] border-3 border-black mx-auto mb-4"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <p className="neo-title text-lg">NO TRANSACTIONS</p>
                <p className="neo-mono text-xs mt-2">Click ADD to record your first transaction.</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {transactions.map((t) => (
                    <TransactionCard
                      key={t.id}
                      transaction={t}
                      onEdit={() => handleEdit(t)}
                      onDelete={() => void deleteTransaction(t.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <TransactionForm
            transaction={editingTransaction ?? undefined}
            onSubmit={handleSubmit}
            onCancel={handleCloseForm}
            onClose={handleCloseForm}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
