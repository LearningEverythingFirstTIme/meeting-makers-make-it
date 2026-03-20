"use client";

import { motion } from "framer-motion";
import { calculateSummary, formatCurrency } from "@/lib/treasury-utils";
import type { TreasuryTransaction } from "@/types";

interface StatsPanelProps {
  transactions: TreasuryTransaction[];
}

export const StatsPanel = ({ transactions }: StatsPanelProps) => {
  const summary = calculateSummary(transactions);
  const isPositive = summary.net >= 0;

  return (
    <div className="border-4 border-[var(--on-background)] p-6 bg-[var(--surface-container-lowest)]" style={{ boxShadow: '6px 6px 0px 0px var(--on-background)' }}>
      <div className="flex items-center gap-2 mb-4 pb-3 border-b-4 border-[var(--on-background)]">
        <span className="neo-title text-sm text-[var(--tertiary)]">►</span>
        <span className="neo-title text-sm text-[var(--on-background)]">SUMMARY</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="neo-mono text-[10px] text-[var(--on-surface-variant)] mb-1">CONTRIBUTIONS</p>
          <p className="neo-title text-2xl text-[var(--primary)]">
            {formatCurrency(summary.contributions)}
          </p>
        </div>
        <div className="text-center">
          <p className="neo-mono text-[10px] text-[var(--on-surface-variant)] mb-1">EXPENSES</p>
          <p className="neo-title text-2xl text-[var(--tertiary)]">
            {formatCurrency(summary.expenses)}
          </p>
        </div>
        <div className="text-center">
          <p className="neo-mono text-[10px] text-[var(--on-surface-variant)] mb-1">NET</p>
          <p className={`neo-title text-2xl ${isPositive ? 'text-[var(--primary)]' : 'text-[var(--tertiary)]'}`}>
            {formatCurrency(summary.net)}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t-2 border-dashed border-[var(--outline-variant)] text-center">
        <span className="neo-mono text-[10px] text-[var(--on-surface-variant)]">
          {summary.transactionCount} TOTAL TRANSACTION{summary.transactionCount !== 1 ? 'S' : ''}
        </span>
      </div>
    </div>
  );
};
