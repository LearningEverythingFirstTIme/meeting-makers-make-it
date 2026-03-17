"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { meetingSchema, type MeetingInput } from "@/lib/validators";
import { useHaptics } from "@/components/haptics-provider";

interface MeetingFormProps {
  initialValues?: MeetingInput;
  submitLabel: string;
  onSubmit: (values: MeetingInput) => Promise<void>;
  onCancel?: () => void;
}

const inputVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3 }
  },
};

const errorVariants = {
  hidden: { height: 0, opacity: 0 },
  show: { 
    height: "auto", 
    opacity: 1,
    transition: { duration: 0.2 }
  },
  exit: { 
    height: 0, 
    opacity: 0,
    transition: { duration: 0.15 }
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
  const [shakeKey, setShakeKey] = useState(0);
  const { trigger, isSupported } = useHaptics();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsed = meetingSchema.safeParse(values);
    if (!parsed.success) {
      const errMsg = parsed.error.issues[0]?.message ?? "INPUT VALIDATION FAILED";
      setError(errMsg);
      setShakeKey(k => k + 1);
      if (isSupported) trigger('error');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(parsed.data);
      if (!initialValues.name) {
        setValues({ name: "", location: "", time: "" });
      }
      if (isSupported) trigger('success');
    } catch {
      setError("WRITE ERROR: COULD NOT SAVE");
      setShakeKey(k => k + 1);
      if (isSupported) trigger('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.form
      key={shakeKey}
      initial={{ opacity: 0, y: -10 }}
      animate={shakeKey > 0 ? { x: [-4, 4, -4, 4, 0] } : { opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: shakeKey > 0 ? 0.3 : 0.3 }}
      onSubmit={handleSubmit}
      className="neo-card p-6 neo-card-hover"
    >
      <div className="flex items-center gap-2 mb-5 pb-4 border-b-4 border-black">
        <motion.div 
          className="h-3 w-3 bg-[var(--butter)] border-3 border-black"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ boxShadow: '2px 2px 0 0 var(--black)' }}
        />
        <span className="neo-title text-sm" style={{ textShadow: '2px 2px 0 var(--butter)' }}>MEETING DATA</span>
      </div>

      <motion.div variants={inputVariants} initial="hidden" animate="show" transition={{ delay: 0.05 }}>
        <label className="neo-label">
          MEETING NAME
        </label>
        <input
          value={values.name}
          onChange={(e) => setValues((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="MORNING SERENITY"
          className="neo-input neo-input-mint mb-4"
          required
        />
      </motion.div>

      <motion.div variants={inputVariants} initial="hidden" animate="show" transition={{ delay: 0.1 }}>
        <label className="neo-label">
          LOCATION
        </label>
        <input
          value={values.location}
          onChange={(e) => setValues((prev) => ({ ...prev, location: e.target.value }))}
          placeholder="COMMUNITY CENTER - ROOM 2"
          className="neo-input neo-input-coral mb-4"
          required
        />
      </motion.div>

      <motion.div variants={inputVariants} initial="hidden" animate="show" transition={{ delay: 0.15 }}>
        <label className="neo-label">
          TIME
        </label>
        <input
          type="time"
          value={values.time}
          onChange={(e) => setValues((prev) => ({ ...prev, time: e.target.value }))}
          className="neo-input neo-input-lavender mb-4"
          required
        />
      </motion.div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            variants={errorVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="bg-[var(--coral)] border-4 border-black p-4 mb-4"
            style={{ boxShadow: '6px 6px 0 0 var(--black), 10px 10px 0 0 var(--coral)' }}
          >
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-black" style={{ boxShadow: '2px 2px 0 0 var(--coral)' }} />
              <span className="neo-mono text-xs uppercase text-[var(--white)]" style={{ textShadow: '1px 1px 0 var(--black)' }}>{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3 pt-2">
        <motion.button
          whileHover={!submitting ? { scale: 1.02 } : {}}
          whileTap={!submitting ? { scale: 0.98 } : {}}
          type="submit"
          disabled={submitting}
          className="neo-button neo-button-primary flex-1 py-3"
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
            `► ${submitLabel.toUpperCase()}`
          )}
        </motion.button>
        
        {onCancel ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => { if (isSupported) trigger('light'); onCancel(); }}
            className="neo-button flex-1 py-3 bg-[var(--gray-disabled)]"
          >
            CANCEL
          </motion.button>
        ) : null}
      </div>
    </motion.form>
  );
};
