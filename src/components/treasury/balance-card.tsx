"use client";

import { motion } from "framer-motion";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { calculateSummary, formatCurrency } from "@/lib/treasury-utils";
import type { TreasuryTransaction } from "@/types";

interface BalanceCardProps {
  transactions: TreasuryTransaction[];
  showBreakdown?: boolean;
}

export const BalanceCard = ({ transactions, showBreakdown = true }: BalanceCardProps) => {
  const summary = calculateSummary(transactions);
  const isPositive = summary.net >= 0;

  return (
    <div className="neo-card p-6">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <DollarSign size={24} strokeWidth={3} className={isPositive ? "text-[var(--mint)]" : "text-[var(--coral)]"} />
          <span className="neo-title text-sm">TREASURY BALANCE</span>
        </div>
        <motion.p 
          className={`neo-title text-5xl ${isPositive ? "text-[var(--mint)]" : "text-[var(--coral)]"}`}
          key={summary.net}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {formatCurrency(summary.net)}
        </motion.p>
      </div>

      {showBreakdown && (
        <div className="border-t-4 border-black pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} strokeWidth={3} className="text-[var(--mint)]" />
              <span className="neo-mono text-xs">CONTRIBUTIONS</span>
            </div>
            <span className="neo-mono text-sm font-bold text-[var(--mint)]">
              {formatCurrency(summary.contributions)}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown size={14} strokeWidth={3} className="text-[var(--coral)]" />
              <span className="neo-mono text-xs">EXPENSES</span>
            </div>
            <span className="neo-mono text-sm font-bold text-[var(--coral)]">
              -{formatCurrency(summary.expenses)}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t-2 border-dashed border-black">
            <span className="neo-mono text-xs font-bold">NET</span>
            <span className={`neo-mono text-sm font-bold ${isPositive ? "text-[var(--mint)]" : "text-[var(--coral)]"}`}>
              {formatCurrency(summary.net)}
            </span>
          </div>

          <div className="text-center pt-2">
            <span className="neo-mono text-[10px] text-gray-500">
              {summary.transactionCount} TRANSACTION{summary.transactionCount !== 1 ? 'S' : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
