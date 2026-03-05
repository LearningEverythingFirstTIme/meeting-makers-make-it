"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { meetingSchema, type MeetingInput } from "@/lib/validators";
import { clsx } from "clsx";

interface MeetingFormProps {
  initialValues?: MeetingInput;
  submitLabel: string;
  onSubmit: (values: MeetingInput) => Promise<void>;
  onCancel?: () => void;
}

export const MeetingForm = ({
  initialValues = { name: "", location: "", time: "" },
  submitLabel,
  onSubmit,
  onCancel,
}: MeetingFormProps) => {
  const [values, setValues] = useState<MeetingInput>(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsed = meetingSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your input.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(parsed.data);
      if (!initialValues.name) {
        setValues({ name: "", location: "", time: "" });
      }
    } catch {
      setError("Unable to save meeting right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onSubmit={handleSubmit}
      className="space-y-4 border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
    >
      <div className="relative">
        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-black">
          Meeting Name
        </label>
        <input
          value={values.name}
          onChange={(e) => setValues((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="MORNING SERENITY"
          className="w-full border-2 border-black bg-yellow-50 px-4 py-3 text-sm font-bold text-black placeholder:text-gray-400 focus:bg-yellow-100 focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
          required
        />
      </div>

      <div className="relative">
        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-black">
          Location
        </label>
        <input
          value={values.location}
          onChange={(e) => setValues((prev) => ({ ...prev, location: e.target.value }))}
          placeholder="COMMUNITY CENTER - ROOM 2"
          className="w-full border-2 border-black bg-cyan-50 px-4 py-3 text-sm font-bold text-black placeholder:text-gray-400 focus:bg-cyan-100 focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
          required
        />
      </div>

      <div className="relative">
        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-black">
          Time
        </label>
        <input
          type="time"
          value={values.time}
          onChange={(e) => setValues((prev) => ({ ...prev, time: e.target.value }))}
          className="w-full border-2 border-black bg-pink-50 px-4 py-3 text-sm font-bold text-black focus:bg-pink-100 focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
          required
        />
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-rose-200 px-3 py-2 text-sm font-bold text-rose-900 border-2 border-black"
          >
            ERROR: {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3 pt-2">
        <motion.button
          whileHover={{ scale: 1.02, x: 2, y: 2, boxShadow: "2px 2px 0px 0px rgba(0,0,0,1)" }}
          whileTap={{ scale: 0.98, x: 4, y: 4, boxShadow: "0px 0px 0px 0px rgba(0,0,0,1)" }}
          type="submit"
          disabled={submitting}
          className="flex-1 bg-black border-2 border-black px-4 py-3 text-sm font-black uppercase tracking-wide text-white shadow-[4px_4px_0px_0px_rgba(251,191,36,1)] hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "SAVING..." : submitLabel.toUpperCase()}
        </motion.button>
        
        {onCancel ? (
          <motion.button
            whileHover={{ scale: 1.02, x: 2, y: 2, boxShadow: "2px 2px 0px 0px rgba(0,0,0,1)" }}
            whileTap={{ scale: 0.98, x: 4, y: 4, boxShadow: "0px 0px 0px 0px rgba(0,0,0,1)" }}
            type="button"
            onClick={onCancel}
            className="flex-1 bg-white border-2 border-black px-4 py-3 text-sm font-black uppercase tracking-wide text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-50"
          >
            CANCEL
          </motion.button>
        ) : null}
      </div>
    </motion.form>
  );
};
