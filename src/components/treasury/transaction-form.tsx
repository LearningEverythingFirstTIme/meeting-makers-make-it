"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus } from "lucide-react";
import { transactionSchema, type TransactionInput } from "@/lib/validators";
import { CONTRIBUTION_CATEGORIES, EXPENSE_CATEGORIES, getTodayDate } from "@/lib/treasury-utils";
import type { TreasuryTransaction, TransactionType, ContributionCategory, ExpenseCategory } from "@/types";

interface TransactionFormProps {
  transaction?: TreasuryTransaction;
  onSubmit: (data: TransactionInput) => Promise<void>;
  onCancel: () => void;
  onClose: () => void;
}

export const TransactionForm = ({ transaction, onSubmit, onCancel, onClose }: TransactionFormProps) => {
  const [type, setType] = useState<TransactionType>(transaction?.type ?? 'contribution');
  const [amount, setAmount] = useState(transaction?.amount?.toString() ?? '');
  const [category, setCategory] = useState(transaction?.category ?? 'seventh_tradition');
  const [date, setDate] = useState(transaction?.date ?? getTodayDate());
  const [note, setNote] = useState(transaction?.note ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const categories = type === 'contribution' ? CONTRIBUTION_CATEGORIES : EXPENSE_CATEGORIES;

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategory(newType === 'contribution' ? 'seventh_tradition' : 'rent');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = transactionSchema.safeParse({
      date,
      amount: parseFloat(amount),
      type,
      category,
      note: note || (type === 'contribution' ? 'Contribution' : 'Expense'),
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(parsed.data);
      onClose();
    } catch {
      setError('Failed to save transaction');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-md bg-white border-4 border-black p-6"
        style={{ boxShadow: '12px 12px 0px 0px black' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6 pb-4 border-b-4 border-black">
          <h2 className="neo-title text-xl">
            {transaction ? 'EDIT TRANSACTION' : 'NEW TRANSACTION'}
          </h2>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={onClose}
            className="p-2 border-3 border-black hover:bg-[var(--coral)]"
          >
            <X size={16} strokeWidth={3} />
          </motion.button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="neo-label">TYPE</label>
            <div className="flex gap-2">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTypeChange('contribution')}
                className={`flex-1 py-3 border-3 border-black neo-title text-sm flex items-center justify-center gap-2 ${
                  type === 'contribution'
                    ? 'bg-[var(--mint)] text-black'
                    : 'bg-white text-black hover:bg-[var(--cream)]'
                }`}
                style={{ boxShadow: type === 'contribution' ? 'none' : '4px 4px 0px 0px black' }}
              >
                <Plus size={14} strokeWidth={3} /> CONTRIBUTION
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTypeChange('expense')}
                className={`flex-1 py-3 border-3 border-black neo-title text-sm flex items-center justify-center gap-2 ${
                  type === 'expense'
                    ? 'bg-[var(--coral)] text-white'
                    : 'bg-white text-black hover:bg-[var(--cream)]'
                }`}
                style={{ boxShadow: type === 'expense' ? 'none' : '4px 4px 0px 0px black' }}
              >
                <Minus size={14} strokeWidth={3} /> EXPENSE
              </motion.button>
            </div>
          </div>

          <div>
            <label htmlFor="amount" className="neo-label">AMOUNT ($)</label>
            <input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="neo-input"
              required
            />
          </div>

          <div>
            <label htmlFor="category" className="neo-label">CATEGORY</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ContributionCategory | ExpenseCategory)}
              className="neo-input"
              required
            >
              {Object.entries(categories).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="date" className="neo-label">DATE</label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={getTodayDate()}
              className="neo-input"
              required
            />
          </div>

          <div>
            <label htmlFor="note" className="neo-label">NOTE (OPTIONAL)</label>
            <input
              id="note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              maxLength={200}
              className="neo-input"
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-[var(--coral)] border-4 border-black p-3"
              >
                <span className="neo-mono text-xs text-black">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-3 pt-2">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCancel}
              className="flex-1 neo-button bg-gray-200"
              disabled={submitting}
            >
              CANCEL
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={submitting}
              className="flex-1 neo-button neo-button-primary"
            >
              {submitting ? 'SAVING...' : transaction ? 'UPDATE' : 'ADD'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
