"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import Link from "next/link";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { getClientDb } from "@/lib/firebase/client";
import { useAuth } from "@/components/auth-provider";
import { calculateSummary, formatCurrency, sortByDateDesc } from "@/lib/treasury-utils";
import type { TreasuryTransaction } from "@/types";

export const TreasurySummary = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>([]);
  const [loading, setLoading] = useState(true);

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
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [user]);

  if (!user) return null;

  const summary = calculateSummary(transactions);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Link href="/treasury">
        <motion.div
          whileHover={{ scale: 1.01, y: -2 }}
          whileTap={{ scale: 0.99 }}
          className="neo-card p-6 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DollarSign size={18} strokeWidth={3} />
              <span className="neo-title text-xs">TREASURY</span>
            </div>
            <ArrowRight size={16} strokeWidth={3} className="text-black" />
          </div>

          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          ) : (
            <>
              <motion.p
                className={`neo-title text-5xl ${summary.net >= 0 ? 'text-black' : 'text-[var(--coral)]'}`}
                key={summary.net}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {formatCurrency(summary.net)}
              </motion.p>
              
              <div className="mt-4 pt-4 border-t-2 border-black grid grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <TrendingUp size={16} strokeWidth={3} className="text-[var(--mint)]" />
                  <div>
                    <p className="neo-mono text-xs text-black">CONTRIBUTIONS</p>
                    <p className="neo-mono text-base font-bold text-[var(--mint)]">
                      {formatCurrency(summary.contributions)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingDown size={16} strokeWidth={3} className="text-[var(--coral)]" />
                  <div>
                    <p className="neo-mono text-xs text-black">EXPENSES</p>
                    <p className="neo-mono text-base font-bold text-[var(--coral)]">
                      {formatCurrency(summary.expenses)}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </Link>
    </motion.div>
  );
};
