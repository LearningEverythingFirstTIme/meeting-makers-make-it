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
    <div className="border-4 border-[var(--on-background)] p-6 bg-[var(--surface-container-lowest)]" style={{ boxShadow: '6px 6px 0px 0px var(--on-background)' }}>
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <DollarSign size={24} strokeWidth={3} className={isPositive ? "text-[var(--primary)]" : "text-[var(--tertiary)]"} />
          <span className="neo-title text-sm text-[var(--on-background)]">TREASURY BALANCE</span>
        </div>
        <motion.p 
          className={`headline-lg ${isPositive ? "text-[var(--primary)]" : "text-[var(--tertiary)]"}`}
          key={summary.net}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {formatCurrency(summary.net)}
        </motion.p>
      </div>

      {showBreakdown && (
        <div className="border-t-4 border-[var(--on-background)] pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} strokeWidth={3} className="text-[var(--primary)]" />
              <span className="neo-mono text-xs text-[var(--on-surface-variant)]">CONTRIBUTIONS</span>
            </div>
            <span className="neo-mono text-sm font-bold text-[var(--primary)]">
              {formatCurrency(summary.contributions)}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown size={14} strokeWidth={3} className="text-[var(--tertiary)]" />
              <span className="neo-mono text-xs text-[var(--on-surface-variant)]">EXPENSES</span>
            </div>
            <span className="neo-mono text-sm font-bold text-[var(--tertiary)]">
              -{formatCurrency(summary.expenses)}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t-2 border-dashed border-[var(--outline-variant)]">
            <span className="neo-mono text-xs font-bold text-[var(--on-background)]">NET</span>
            <span className={`neo-mono text-sm font-bold ${isPositive ? "text-[var(--primary)]" : "text-[var(--tertiary)]"}`}>
              {formatCurrency(summary.net)}
            </span>
          </div>

          <div className="text-center pt-2">
            <span className="neo-mono text-[10px] text-[var(--on-surface-variant)]">
              {summary.transactionCount} TRANSACTION{summary.transactionCount !== 1 ? 'S' : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
