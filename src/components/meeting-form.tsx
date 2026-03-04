"use client";

import { useState } from "react";
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
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
          Meeting name
        </label>
        <input
          value={values.name}
          onChange={(e) => setValues((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Morning Serenity"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-sky-500 focus:ring"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
          Location
        </label>
        <input
          value={values.location}
          onChange={(e) => setValues((prev) => ({ ...prev, location: e.target.value }))}
          placeholder="Community Center - Room 2"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-sky-500 focus:ring"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
          Time
        </label>
        <input
          type="time"
          value={values.time}
          onChange={(e) => setValues((prev) => ({ ...prev, time: e.target.value }))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-sky-500 focus:ring"
          required
        />
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-sky-300"
        >
          {submitting ? "Saving..." : submitLabel}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
};
