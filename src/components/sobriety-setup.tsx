"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Award, AlertTriangle } from "lucide-react";
import { sobrietyDateSchema } from "@/lib/validators";
import type { SobrietyDateInput } from "@/lib/validators";
import { getTodayDate } from "@/lib/treasury-utils";

interface SobrietySetupProps {
  currentDate: string | null;
  onSubmit: (data: SobrietyDateInput) => Promise<void>;
  onClose: () => void;
}

export const SobrietySetup = ({ currentDate, onSubmit, onClose }: SobrietySetupProps) => {
  const [date, setDate] = useState(currentDate || "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = sobrietyDateSchema.safeParse({ sobrietyDate: date });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid date");
      return;
    }

    // Check if date is in the future
    const selectedDate = new Date(date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate > today) {
      setError("Sobriety date cannot be in the future");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(parsed.data);
      onClose();
    } catch {
      setError("Failed to save sobriety date");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClear = async () => {
    setSubmitting(true);
    try {
      await onSubmit({ sobrietyDate: "" });
      onClose();
    } catch {
      setError("Failed to clear sobriety date");
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
        className="w-full max-w-md bg-[var(--white)] border-4 border-black p-6"
        style={{ boxShadow: '12px 12px 0px 0px black' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b-4 border-black">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-[var(--butter)] border-3 border-black flex items-center justify-center">
              <Award size={20} strokeWidth={3} />
            </div>
            <div>
              <h2 className="neo-title text-xl">
                {currentDate ? "EDIT" : "SET"} SOBRIETY DATE
              </h2>
              <p className="neo-mono text-[10px] text-[var(--gray-muted)]">
                {currentDate ? "Update your clean date" : "Track your recovery journey"}
              </p>
            </div>
          </div>
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

        <AnimatePresence mode="wait">
          {showConfirmReset ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-[var(--coral)] bg-opacity-20 border-4 border-[var(--coral)] p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle size={24} strokeWidth={3} className="text-[var(--coral)]" />
                <h3 className="neo-title text-lg">RESET SOBRIETY DATE?</h3>
              </div>
              <p className="neo-mono text-sm mb-6">
                This will clear your current sobriety date and reset your counter. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowConfirmReset(false)}
                  className="flex-1 neo-button bg-[var(--gray-disabled)]"
                  disabled={submitting}
                >
                  CANCEL
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleClear}
                  disabled={submitting}
                  className="flex-1 neo-button bg-[var(--coral)] text-white"
                >
                  {submitting ? 'CLEARING...' : 'CLEAR DATE'}
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div>
                <label htmlFor="sobrietyDate" className="neo-label flex items-center gap-2">
                  <Calendar size={14} strokeWidth={3} />
                  SOBRIETY DATE
                </label>
                <input
                  id="sobrietyDate"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={getTodayDate()}
                  className="neo-input neo-input-mint"
                  required
                />
                <p className="neo-mono text-[10px] text-[var(--gray-muted)] mt-2">
                  Enter the date of your last drink/drug use.
                </p>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-[var(--coral)] border-4 border-black p-4"
                    style={{ boxShadow: '6px 6px 0px 0px black' }}
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={14} strokeWidth={3} />
                      <span className="neo-mono text-xs text-[var(--black)]">{error}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-3 pt-2">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="flex-1 neo-button bg-[var(--gray-disabled)]"
                  disabled={submitting}
                >
                  CANCEL
                </motion.button>
                {currentDate && (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowConfirmReset(true)}
                    disabled={submitting}
                    className="neo-button bg-[var(--coral)] text-white"
                  >
                    CLEAR
                  </motion.button>
                )}
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={submitting || !date}
                  className="flex-1 neo-button neo-button-primary"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="inline-block h-3 w-3 border-3 border-black border-t-transparent"
                      />
                      SAVING...
                    </span>
                  ) : (
                    currentDate ? "UPDATE" : "SET DATE"
                  )}
                </motion.button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
