"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Edit2, Trash2, Clock } from "lucide-react";
import { formatCurrency, formatDate, getCategoryLabel } from "@/lib/treasury-utils";
import type { TreasuryTransaction } from "@/types";

interface TransactionCardProps {
  transaction: TreasuryTransaction;
  onEdit: () => void;
  onDelete: () => void;
}

export const TransactionCard = ({ transaction, onEdit, onDelete }: TransactionCardProps) => {
  const isContribution = transaction.type === 'contribution';
  const categoryLabel = getCategoryLabel(transaction.type, transaction.category);
  const amount = Number(transaction.amount) || 0;
  const isPending = transaction.synced === false;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={`border-4 border-black p-4 ${
        isContribution 
          ? 'bg-[var(--mint)] bg-opacity-10 border-[var(--mint)]' 
          : 'bg-[var(--coral)] bg-opacity-10 border-[var(--coral)]'
      }`}
      style={{ boxShadow: '6px 6px 0px 0px black' }}
      whileHover={{ scale: 1.01, y: -1 }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isContribution ? (
              <TrendingUp size={16} strokeWidth={3} className="text-[var(--mint)]" />
            ) : (
              <TrendingDown size={16} strokeWidth={3} className="text-[var(--coral)]" />
            )}
            <span className="neo-title text-sm uppercase">{categoryLabel}</span>
            {isPending && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="neo-badge bg-[var(--butter)] text-[var(--black)] flex items-center gap-1"
              >
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Clock size={10} strokeWidth={3} />
                </motion.span>
                PENDING
              </motion.span>
            )}
          </div>
          
          <p className={`neo-mono text-lg font-bold text-[var(--black)]`}>
            {isContribution ? '+' : '-'}{formatCurrency(amount)}
          </p>

          {transaction.note && (
            <p className="neo-mono text-xs text-[var(--black)] truncate mt-1">
              {transaction.note}
            </p>
          )}

          <p className="neo-mono text-[10px] text-[var(--gray-muted)] mt-1">
            {formatDate(transaction.date)}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={onEdit}
            className="p-2 bg-[var(--white)] border-3 border-black hover:bg-[var(--butter)]"
            style={{ boxShadow: '4px 4px 0px 0px black' }}
          >
            <Edit2 size={12} strokeWidth={3} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={onDelete}
            className="p-2 bg-[var(--white)] border-3 border-black hover:bg-[var(--coral)] hover:text-white"
            style={{ boxShadow: '4px 4px 0px 0px black' }}
          >
            <Trash2 size={12} strokeWidth={3} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
