"use client";

import { motion } from "framer-motion";
import { Edit2, Trash2 } from "lucide-react";
import { formatCurrency, getTransactionTypeLabel } from "@/lib/treasury-utils";
import type { TreasuryTransaction } from "@/types";

interface TransactionCardProps {
  transaction: TreasuryTransaction;
  onEdit: () => void;
  onDelete: () => void;
}

export const TransactionCard = ({ transaction, onEdit, onDelete }: TransactionCardProps) => {
  const typeLabel = getTransactionTypeLabel(transaction.type);
  const isContribution = transaction.type === 'contribution';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`border-3 border-[var(--on-background)] p-4 bg-[var(--surface-container-lowest)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isContribution ? 'border-l-4' : 'border-l-4'
      }`}
      style={{ 
        borderLeftColor: isContribution ? 'var(--primary)' : 'var(--tertiary)',
        boxShadow: '3px 3px 0 0 var(--on-background)' 
      }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span 
            className={`neo-badge text-xs ${isContribution ? 'bg-[var(--primary)] text-[var(--on-primary)]' : 'bg-[var(--tertiary)] text-[var(--on-tertiary)]'}`}
          >
            {typeLabel}
          </span>
          <span className="neo-mono text-xs text-[var(--on-surface-variant)]">
            {transaction.category.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end">
          <span className={`neo-title text-lg ${isContribution ? 'text-[var(--primary)]' : 'text-[var(--tertiary)]'}`}>
            {isContribution ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
          </span>
          {transaction.note && (
            <span className="neo-mono text-xs text-[var(--on-surface-variant)] truncate max-w-[200px]">
              {transaction.note}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={onEdit}
            className="border border-[var(--on-background)] p-1 hover:bg-[var(--surface-container-high)]"
            title="Edit"
          >
            <Edit2 size={12} strokeWidth={3} />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => void onDelete()}
            className="border border-[var(--on-background)] p-1 hover:bg-[var(--tertiary)]"
            title="Delete"
          >
            <Trash2 size={12} strokeWidth={3} />
          </motion.button>
        </div>

        <div className="neo-mono text-[10px] text-[var(--on-surface-variant)] hidden sm:block">
          {transaction.date}
        </div>
      </div>
    </motion.div>
  );
};
