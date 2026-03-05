"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { meetingSchema, type MeetingInput } from "@/lib/validators";

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
      setError(parsed.error.issues[0]?.message ?? "INPUT VALIDATION FAILED");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(parsed.data);
      if (!initialValues.name) {
        setValues({ name: "", location: "", time: "" });
      }
    } catch {
      setError("WRITE ERROR: COULD NOT SAVE");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      onSubmit={handleSubmit}
      className="space-y-4 panel border-2 border-[#404040] p-6"
    >
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#404040]">
        <div className="led bg-[#fbbf24]"></div>
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#fbbf24]">
          {'//'} MEETING_DATA
        </span>
      </div>

      <div className="relative">
        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#888]">
          &gt; MEETING_NAME
        </label>
        <input
          value={values.name}
          onChange={(e) => setValues((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="MORNING_SERENITY"
          className="industrial-input"
          required
        />
      </div>

      <div className="relative">
        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#888]">
          &gt; LOCATION
        </label>
        <input
          value={values.location}
          onChange={(e) => setValues((prev) => ({ ...prev, location: e.target.value }))}
          placeholder="COMMUNITY_CENTER_ROOM_2"
          className="industrial-input"
          required
        />
      </div>

      <div className="relative">
        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#888]">
          &gt; TIME
        </label>
        <input
          type="time"
          value={values.time}
          onChange={(e) => setValues((prev) => ({ ...prev, time: e.target.value }))}
          className="industrial-input"
          required
        />
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="panel-inset border-2 border-[#ef4444] p-3"
          >
            <div className="flex items-center gap-2">
              <div className="led bg-[#ef4444]"></div>
              <span className="text-xs font-bold uppercase text-[#ef4444]">{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3 pt-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={submitting}
          className="industrial-button industrial-button-primary flex-1 py-3"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="status-indicator text-[#000] bg-[#000] w-3 h-3"></span>
              SAVING...
            </span>
          ) : (
            `[ ${submitLabel.toUpperCase()} ]`
          )}
        </motion.button>
        
        {onCancel ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onCancel}
            className="industrial-button flex-1 py-3"
          >
            [ CANCEL ]
          </motion.button>
        ) : null}
      </div>
    </motion.form>
  );
};
