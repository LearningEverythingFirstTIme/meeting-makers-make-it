"use client";

import { useEffect, useState } from "react";
import { getClientDb } from "@/lib/firebase/client";
import { motion, AnimatePresence } from "framer-motion";
import { collection, doc, onSnapshot, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { ClipboardList, Save, CheckCircle, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { useAuth } from "@/components/auth-provider";
import { toLocalDayKey } from "@/lib/date";
import { dailyInventorySchema, type DailyInventoryInput } from "@/lib/validators";
import type { DailyInventory } from "@/types";

const INVENTORY_PROMPTS = [
  {
    key: "resentments" as const,
    label: "RESENTMENTS",
    question: "Where was I resentful today?",
    placeholder: "e.g., at work, my neighbor...",
    color: "var(--coral)",
  },
  {
    key: "fears" as const,
    label: "FEARS",
    question: "Where was I afraid?",
    placeholder: "e.g., money, health, rejection...",
    color: "var(--butter)",
  },
  {
    key: "dishonesty" as const,
    label: "SELFISH / DISHONEST",
    question: "Where was I selfish or dishonest?",
    placeholder: "e.g., white lie, hid my feelings...",
    color: "var(--lavender)",
  },
  {
    key: "amends" as const,
    label: "AMENDS",
    question: "Do I owe anyone an amends?",
    placeholder: "e.g., said something harsh to...",
    color: "var(--sky)",
  },
  {
    key: "gratitude" as const,
    label: "GRATITUDE",
    question: "What am I grateful for today?",
    placeholder: "e.g., my health, a friend, a meeting...",
    color: "var(--mint)",
  },
];

export default function InventoryPage() {
  const { user } = useAuth();
  const [db, setDb] = useState<ReturnType<typeof getClientDb> | null>(null);
  const todayKey = toLocalDayKey();
  
  const [todayInventory, setTodayInventory] = useState<DailyInventory | null>(null);
  const [pastInventory, setPastInventory] = useState<DailyInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  
  // Form state
  const [values, setValues] = useState<DailyInventoryInput>({
    resentments: "",
    fears: "",
    dishonesty: "",
    amends: "",
    gratitude: "",
  });

  // Initialize Firebase DB on client side
  useEffect(() => {
    try {
      setDb(getClientDb());
    } catch {
      // Firebase not configured
    }
  }, []);

  // Subscribe to user's inventory entries
  useEffect(() => {
    if (!user || !db) return;

    const inventoryQuery = query(
      collection(db, "dailyInventory"),
      where("userId", "==", user.uid),
    );

    const unsub = onSnapshot(
      inventoryQuery,
      (snapshot) => {
        const entries = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            userId: data.userId,
            date: data.date,
            resentments: data.resentments,
            fears: data.fears,
            dishonesty: data.dishonesty,
            amends: data.amends,
            gratitude: data.gratitude,
            createdAt: data.createdAt?.toDate?.(),
            updatedAt: data.updatedAt?.toDate?.(),
          } satisfies DailyInventory;
        });

        // Sort by date descending
        entries.sort((a, b) => b.date.localeCompare(a.date));

        // Find today's entry
        const today = entries.find((e) => e.date === todayKey);
        setTodayInventory(today || null);
        
        // Set past entries (excluding today)
        setPastInventory(entries.filter((e) => e.date !== todayKey));

        // Pre-fill form if today's entry exists
        if (today) {
          setValues({
            resentments: today.resentments || "",
            fears: today.fears || "",
            dishonesty: today.dishonesty || "",
            amends: today.amends || "",
            gratitude: today.gratitude || "",
          });
        }

        setLoading(false);
      },
      () => {
        setError("Unable to load inventory.");
        setLoading(false);
      },
    );

    return () => unsub();
  }, [db, user, todayKey]);

  const handleSave = async () => {
    if (!user || !db) return;

    setSaving(true);
    setError(null);

    const parsed = dailyInventorySchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Invalid input");
      setSaving(false);
      return;
    }

    try {
      const docId = `${user.uid}_${todayKey}`;
      const docRef = doc(db, "dailyInventory", docId);

      await setDoc(docRef, {
        userId: user.uid,
        date: todayKey,
        ...parsed.data,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      }, { merge: true });

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    if (!todayInventory) {
      return Object.values(values).some(v => v && v.trim() !== "");
    }
    return (
      values.resentments !== (todayInventory.resentments || "") ||
      values.fears !== (todayInventory.fears || "") ||
      values.dishonesty !== (todayInventory.dishonesty || "") ||
      values.amends !== (todayInventory.amends || "") ||
      values.gratitude !== (todayInventory.gratitude || "")
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="neo-card p-12 text-center">
            <ClipboardList size={48} className="mx-auto mb-4 text-black/30" />
            <h1 className="font-['Archivo_Black'] text-2xl mb-2">Sign In Required</h1>
            <p className="neo-mono text-sm text-black/60">Please sign in to keep your daily inventory.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="neo-card p-6 mb-6"
          style={{ background: "var(--lavender)" }}
        >
          <div className="flex items-center gap-3 mb-2">
            <ClipboardList size={28} strokeWidth={3} />
            <h1 className="font-['Archivo_Black'] text-2xl uppercase">
              Step 10: Daily Inventory
            </h1>
          </div>
          <p className="neo-mono text-sm ml-11">
            "Continued to take personal inventory and when we were wrong promptly admitted it."
          </p>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-4 border-black bg-[var(--coral)] p-4 mb-6"
              style={{ boxShadow: "6px 6px 0px 0px black" }}
            >
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 bg-black" />
                <span className="neo-title text-sm text-black">{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Today's Inventory Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="neo-card p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-6 pb-4 border-b-4 border-black">
            <Calendar size={18} strokeWidth={3} />
            <span className="neo-title text-lg">TODAY: {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
            {todayInventory && (
              <span className="ml-auto flex items-center gap-1 neo-mono text-xs text-[var(--mint)]">
                <CheckCircle size={14} /> SAVED
              </span>
            )}
          </div>

          <div className="space-y-5">
            {INVENTORY_PROMPTS.map((prompt, index) => (
              <motion.div
                key={prompt.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <label className="block mb-2">
                  <span 
                    className="neo-mono text-xs px-2 py-0.5 border-2 border-black inline-block mb-1"
                    style={{ background: prompt.color }}
                  >
                    {prompt.label}
                  </span>
                  <span className="block neo-title text-sm">{prompt.question}</span>
                </label>
                <input
                  type="text"
                  value={values[prompt.key] || ""}
                  onChange={(e) => setValues(prev => ({ ...prev, [prompt.key]: e.target.value }))}
                  placeholder={prompt.placeholder}
                  maxLength={200}
                  className="neo-input w-full text-sm"
                />
              </motion.div>
            ))}
          </div>

          {/* Save Button */}
          <div className="mt-6 pt-4 border-t-2 border-dashed border-black/20">
            <motion.button
              whileHover={!saving ? { scale: 1.02 } : {}}
              whileTap={!saving ? { scale: 0.98 } : {}}
              onClick={handleSave}
              disabled={saving || !hasChanges()}
              className={`neo-button py-3 w-full ${
                saved 
                  ? "bg-[var(--mint)]" 
                  : hasChanges()
                    ? "neo-button-primary"
                    : "bg-gray-200 cursor-not-allowed"
              }`}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="inline-block h-4 w-4 border-2 border-black border-t-transparent"
                  />
                  SAVING...
                </span>
              ) : saved ? (
                <>
                  <CheckCircle size={16} strokeWidth={3} /> SAVED!
                </>
              ) : (
                <>
                  <Save size={16} strokeWidth={3} /> SAVE TODAY&apos;S INVENTORY
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Past Inventory */}
        {pastInventory.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="neo-card p-6"
          >
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between"
            >
              <span className="neo-title text-lg flex items-center gap-2">
                <Calendar size={18} strokeWidth={3} />
                PAST ENTRIES ({pastInventory.length})
              </span>
              {showHistory ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-4 space-y-3 overflow-hidden"
                >
                  {pastInventory.slice(0, 7).map((entry, idx) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="border-2 border-black bg-[var(--cream)] p-3"
                    >
                      <p className="neo-mono text-xs font-bold mb-2">
                        {new Date(entry.date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                      <div className="space-y-1">
                        {entry.resentments && (
                          <p className="neo-mono text-xs">
                            <span style={{ color: INVENTORY_PROMPTS[0].color }}>●</span> {entry.resentments}
                          </p>
                        )}
                        {entry.fears && (
                          <p className="neo-mono text-xs">
                            <span style={{ color: INVENTORY_PROMPTS[1].color }}>●</span> {entry.fears}
                          </p>
                        )}
                        {entry.amends && (
                          <p className="neo-mono text-xs">
                            <span style={{ color: INVENTORY_PROMPTS[3].color }}>●</span> Amends: {entry.amends}
                          </p>
                        )}
                        {entry.gratitude && (
                          <p className="neo-mono text-xs">
                            <span style={{ color: INVENTORY_PROMPTS[4].color }}>●</span> Grateful for: {entry.gratitude}
                          </p>
                        )}
                        {!entry.resentments && !entry.fears && !entry.amends && !entry.gratitude && (
                          <p className="neo-mono text-xs text-black/40">No entries</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
