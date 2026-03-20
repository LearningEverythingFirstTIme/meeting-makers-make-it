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

type TreasurySummaryProps = {
  className?: string;
};

export const TreasurySummary = ({ className }: TreasurySummaryProps) => {
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
      className="h-full"
    >
      <Link href="/treasury" className="block h-full">
        <motion.div
          whileHover={{ scale: 1.01, y: -2 }}
          whileTap={{ scale: 0.99 }}
          className={["border-4 border-[var(--on-background)] flex h-full cursor-pointer flex-col p-6 bg-[var(--surface-container-lowest)]", className].filter(Boolean).join(" ")}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DollarSign size={18} strokeWidth={3} className="text-[var(--primary)]" />
              <span className="neo-title text-xs text-[var(--on-background)]">TREASURY</span>
            </div>
            <ArrowRight size={16} strokeWidth={3} className="text-[var(--on-surface-variant)]" />
          </div>

          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-[var(--surface-container)] w-24 mb-2"></div>
              <div className="h-4 bg-[var(--surface-container)] w-16"></div>
            </div>
          ) : (
            <>
              <div className="mt-auto">
                <motion.p
                  className={`headline-lg ${summary.net >= 0 ? 'text-[var(--primary)]' : 'text-[var(--tertiary)]'}`}
                  key={summary.net}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {formatCurrency(summary.net)}
                </motion.p>

                <div className="mt-4 grid grid-cols-2 gap-6 border-t-2 border-[var(--on-background)] pt-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp size={16} strokeWidth={3} className="text-[var(--primary)]" />
                    <div>
                      <p className="neo-mono text-xs text-[var(--on-surface-variant)]">CONTRIBUTIONS</p>
                      <p className="neo-mono text-base font-bold text-[var(--primary)]">
                        {formatCurrency(summary.contributions)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <TrendingDown size={16} strokeWidth={3} className="text-[var(--tertiary)]" />
                    <div>
                      <p className="neo-mono text-xs text-[var(--on-surface-variant)]">EXPENSES</p>
                      <p className="neo-mono text-base font-bold text-[var(--tertiary)]">
                        {formatCurrency(summary.expenses)}
                      </p>
                    </div>
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
