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

const inputVariants = {
  hidden: { opacity: 0, x: -8 },
  show: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.25, ease: "easeOut" as const }
  },
};

const errorVariants = {
  hidden: { height: 0, opacity: 0 },
  show: { 
    height: "auto", 
    opacity: 1,
    transition: { duration: 0.18 }
  },
  exit: { 
    height: 0, 
    opacity: 0,
    transition: { duration: 0.12 }
  },
};

export const MeetingForm = ({
  initialValues = { name: "", location: "", time: "" },
  submitLabel,
  onSubmit,
  onCancel,
}: MeetingFormProps) => {
  const [values, setValues] = useState<MeetingInput>(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [shakeError, setShakeError] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsed = meetingSchema.safeParse(values);
    if (!parsed.success) {
      const errMsg = parsed.error.issues[0]?.message ?? "INPUT VALIDATION FAILED";
      setError(errMsg);
      setShakeError(true);
      setTimeout(() => setShakeError(false), 400);
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
      setShakeError(true);
      setTimeout(() => setShakeError(false), 400);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      onSubmit={handleSubmit}
      className="space-y-4 panel border-2 border-[#404040] p-6"
    >
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#404040]">
        <motion.div 
          className="led bg-[#fbbf24]"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#fbbf24]">
          {'//'} MEETING_DATA
        </span>
      </div>

      <motion.div variants={inputVariants} initial="hidden" animate="show" transition={{ delay: 0.05 }}>
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
      </motion.div>

      <motion.div variants={inputVariants} initial="hidden" animate="show" transition={{ delay: 0.1 }}>
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
      </motion.div>

      <motion.div variants={inputVariants} initial="hidden" animate="show" transition={{ delay: 0.15 }}>
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
      </motion.div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            variants={errorVariants}
            initial="hidden"
            animate={shakeError ? { ...errorVariants.show, x: [0, -3, 3, -2, 2, 0] } : "show"}
            exit="exit"
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
          whileHover={!submitting ? { scale: 1.015 } : {}}
          whileTap={!submitting ? { scale: 0.985 } : {}}
          type="submit"
          disabled={submitting}
          className="industrial-button industrial-button-primary flex-1 py-3"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <motion.span 
                className="status-indicator text-[#000] bg-[#000] w-3 h-3"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
              SAVING...
            </span>
          ) : (
            `[ ${submitLabel.toUpperCase()} ]`
          )}
        </motion.button>
        
        {onCancel ? (
          <motion.button
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
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
