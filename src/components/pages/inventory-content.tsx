"use client";

import { Fragment, useEffect, useState } from "react";
import { getClientDb } from "@/lib/firebase/client";
import { motion, AnimatePresence } from "framer-motion";
import { collection, doc, onSnapshot, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { ClipboardList, Save, CheckCircle, Calendar, ChevronLeft, ChevronRight, History, Edit2, X } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { DailyReflection } from "@/components/daily-reflection";
import { useAuth } from "@/components/auth-provider";
import { toLocalDayKey } from "@/lib/date";
import { dailyInventorySchema, type DailyInventoryInput } from "@/lib/validators";
import type { DailyInventory } from "@/types";
import { useInventoryGrid, DAY_NAMES } from "@/hooks/useInventoryGrid";

const INVENTORY_PROMPTS = [
  {
    key: "resentments" as const,
    label: "RESENTMENTS",
    question: "Where was I resentful today?",
    placeholder: "e.g., at work, my neighbor...",
    color: "var(--tertiary)",
  },
  {
    key: "fears" as const,
    label: "FEARS",
    question: "Where was I afraid?",
    placeholder: "e.g., money, health, rejection...",
    color: "var(--primary)",
  },
  {
    key: "dishonesty" as const,
    label: "SELFISH / DISHONEST",
    question: "Where was I selfish or dishonest?",
    placeholder: "e.g., white lie, hid my feelings...",
    color: "var(--secondary)",
  },
  {
    key: "amends" as const,
    label: "AMENDS",
    question: "Do I owe anyone an amends?",
    placeholder: "e.g., said something harsh to...",
    color: "var(--on-surface-variant)",
  },
  {
    key: "gratitude" as const,
    label: "GRATITUDE",
    question: "What am I grateful for today?",
    placeholder: "e.g., my health, a friend, a meeting...",
    color: "var(--primary-container)",
  },
];

export function InventoryContent() {
  const { user } = useAuth();
  const [db, setDb] = useState<ReturnType<typeof getClientDb> | null>(null);
  const todayKey = toLocalDayKey();
  
  const [todayInventory, setTodayInventory] = useState<DailyInventory | null>(null);
  const [pastInventory, setPastInventory] = useState<DailyInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Date browser state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'today' | 'browse'>('today');
  const [editMode, setEditMode] = useState(false);
  
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

    // Determine which date we're saving for
    const targetDate = isViewingToday ? todayKey : (selectedDate || todayKey);

    try {
      const docId = `${user.uid}_${targetDate}`;
      const docRef = doc(db, "dailyInventory", docId);

      await setDoc(docRef, {
        userId: user.uid,
        date: targetDate,
        ...parsed.data,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      }, { merge: true });

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setEditMode(false);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    // Load the current viewing entry's values into the form
    const entryToEdit = viewingEntry;
    if (entryToEdit) {
      setValues({
        resentments: entryToEdit.resentments || "",
        fears: entryToEdit.fears || "",
        dishonesty: entryToEdit.dishonesty || "",
        amends: entryToEdit.amends || "",
        gratitude: entryToEdit.gratitude || "",
      });
    } else {
      // Start fresh if no entry exists
      setValues({
        resentments: "",
        fears: "",
        dishonesty: "",
        amends: "",
        gratitude: "",
      });
    }
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    // Reset to current entry's values
    const entryToEdit = viewingEntry;
    if (entryToEdit) {
      setValues({
        resentments: entryToEdit.resentments || "",
        fears: entryToEdit.fears || "",
        dishonesty: entryToEdit.dishonesty || "",
        amends: entryToEdit.amends || "",
        gratitude: entryToEdit.gratitude || "",
      });
    }
  };

  const hasChanges = () => {
    const compareEntry = isViewingToday ? todayInventory : viewingEntry;
    if (!compareEntry) {
      return Object.values(values).some(v => v && v.trim() !== "");
    }
    return (
      values.resentments !== (compareEntry.resentments || "") ||
      values.fears !== (compareEntry.fears || "") ||
      values.dishonesty !== (compareEntry.dishonesty || "") ||
      values.amends !== (compareEntry.amends || "") ||
      values.gratitude !== (compareEntry.gratitude || "")
    );
  };

  // Get all inventory entries sorted by date (including today)
  const allEntries = [todayInventory, ...pastInventory].filter(Boolean) as DailyInventory[];
  
  // Inventory grid
  const { inventoryGrid, inventoryWeeks, totalInventoryDays, currentStreak, longestStreak } = useInventoryGrid(allEntries);
  
  // Get current viewing entry
  const getViewingEntry = (): DailyInventory | null => {
    if (viewMode === 'today') return todayInventory;
    if (selectedDate) {
      return allEntries.find(e => e.date === selectedDate) || null;
    }
    return null;
  };

  const viewingEntry = getViewingEntry();
  const isViewingToday = viewMode === 'today' || selectedDate === todayKey;

  // Navigate to previous/next entry
  const navigateToEntry = (direction: 'prev' | 'next') => {
    const sortedEntries = [...allEntries].sort((a, b) => b.date.localeCompare(a.date));
    const currentIndex = selectedDate 
      ? sortedEntries.findIndex(e => e.date === selectedDate)
      : viewMode === 'today' ? 0 : -1;
    
    if (direction === 'prev' && currentIndex < sortedEntries.length - 1) {
      const nextEntry = sortedEntries[currentIndex + 1];
      setSelectedDate(nextEntry.date);
      setViewMode('browse');
      setEditMode(false);
    } else if (direction === 'next' && currentIndex > 0) {
      const prevEntry = sortedEntries[currentIndex - 1];
      setSelectedDate(prevEntry.date);
      setViewMode('browse');
      setEditMode(false);
    } else if (direction === 'next' && currentIndex === 0) {
      // Going forward from most recent goes to today
      setSelectedDate(null);
      setViewMode('today');
      setEditMode(false);
    }
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString(undefined, { 
      weekday: 'long', 
      year: 'numeric',
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Get days ago text
  const getDaysAgo = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const diffTime = today.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  if (!user) {
    return (
      <div className="min-h-screen zine-grid">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="border-4 border-[var(--on-background)] p-12 text-center bg-[var(--surface-container-lowest)]" style={{ boxShadow: '8px 8px 0px 0px var(--on-background)' }}>
            <ClipboardList size={48} className="mx-auto mb-4 text-[var(--on-surface-variant)]" />
            <h1 className="neo-title text-2xl mb-2 text-[var(--on-background)]">Sign In Required</h1>
            <p className="neo-mono text-sm text-[var(--on-surface-variant)]">Please sign in to keep your daily inventory.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen zine-grid">
      <Navigation />
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-4 border-[var(--on-background)] p-6 mb-6 bg-[var(--primary)]"
          style={{ boxShadow: '8px 8px 0px 0px var(--on-background)' }}
        >
          <div className="flex items-center gap-3 mb-2">
            <ClipboardList size={28} strokeWidth={3} className="text-[var(--on-primary)]" />
            <h1 className="neo-title text-2xl text-[var(--on-primary)]">
              Step 10: Daily Inventory
            </h1>
          </div>
          <p className="quote-text text-sm ml-11 text-[var(--on-primary)] opacity-90">
            &ldquo;Continued to take personal inventory and when we were wrong promptly admitted it.&rdquo;
          </p>
        </motion.div>

        {/* Daily Reflection */}
        <DailyReflection />

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-4 border-[var(--on-background)] bg-[var(--tertiary)] p-4 mb-6"
              style={{ boxShadow: "8px 8px 0px 0px var(--on-background)" }}
            >
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 bg-[var(--on-tertiary)]" />
                <span className="neo-title text-sm text-[var(--on-tertiary)]">{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Date Browser Navigation */}
        {allEntries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-4 border-[var(--on-background)] p-4 mb-6 bg-[var(--surface-container-lowest)]"
            style={{ boxShadow: '6px 6px 0px 0px var(--on-background)' }}
          >
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigateToEntry('prev')}
                disabled={selectedDate === allEntries[allEntries.length - 1]?.date && viewMode === 'browse'}
                className="neo-button py-2 px-3 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} strokeWidth={3} />
              </button>
              
              <div className="text-center">
                <p className="neo-title text-sm text-[var(--on-background)]">
                  {isViewingToday ? "TODAY" : formatDate(selectedDate || todayKey)}
                </p>
                {!isViewingToday && (
                  <p className="neo-mono text-xs text-[var(--on-surface-variant)]">
                    {getDaysAgo(selectedDate || '')}
                  </p>
                )}
              </div>
              
              <button
                onClick={() => navigateToEntry('next')}
                disabled={isViewingToday}
                className="neo-button py-2 px-3 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={20} strokeWidth={3} />
              </button>
            </div>

            {/* Date Quick Select */}
            <div className="mt-4 pt-4 border-t-2 border-dashed border-[var(--outline-variant)]">
              <p className="neo-mono text-xs mb-2 text-[var(--on-surface-variant)]">JUMP TO:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setViewMode('today'); setSelectedDate(null); setEditMode(false); }}
                  className={`neo-mono text-xs px-3 py-1.5 border-3 border-[var(--on-background)] ${
                    isViewingToday ? 'bg-[var(--on-background)] text-[var(--surface-container-lowest)]' : 'bg-[var(--surface-container-lowest)] hover:bg-[var(--surface-container)]'
                  }`}
                >
                  Today
                </button>
                {pastInventory.slice(0, 6).map((entry) => (
                  <button
                    key={entry.date}
                    onClick={() => { setSelectedDate(entry.date); setViewMode('browse'); setEditMode(false); }}
                    className={`neo-mono text-xs px-3 py-1.5 border-3 border-[var(--on-background)] ${
                      selectedDate === entry.date ? 'bg-[var(--on-background)] text-[var(--surface-container-lowest)]' : 'bg-[var(--surface-container-lowest)] hover:bg-[var(--surface-container)]'
                    }`}
                  >
                    {getDaysAgo(entry.date)}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Inventory Display (View or Edit) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-4 border-[var(--on-background)] p-6 mb-6 bg-[var(--surface-container-lowest)]"
          style={{ boxShadow: '6px 6px 0px 0px var(--on-background)' }}
        >
          <div className="flex items-center gap-2 mb-6 pb-4 border-b-4 border-[var(--on-background)]">
            <Calendar size={18} strokeWidth={3} />
            <span className="neo-title text-lg text-[var(--on-background)]">
              {isViewingToday ? "TODAY" : formatDate(selectedDate || todayKey)}
            </span>
            {viewingEntry && (
              <span className="ml-auto flex items-center gap-1 neo-mono text-xs text-[var(--primary)]">
                <CheckCircle size={14} /> SAVED
              </span>
            )}
            {!isViewingToday && !viewingEntry && (
              <span className="ml-auto neo-mono text-xs text-[var(--on-surface-variant)]">
                NO ENTRY
              </span>
            )}
          </div>

          {isViewingToday || editMode ? (
            /* Edit Form (for Today or Past Entries in Edit Mode) */
            <>
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
                        className="neo-mono text-xs px-2 py-0.5 border-3 border-[var(--on-background)] inline-block mb-1 text-[var(--on-background)]"
                        style={{ background: prompt.color }}
                      >
                        {prompt.label}
                      </span>
                      <span className="block neo-title text-sm text-[var(--on-background)]">{prompt.question}</span>
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

              {/* Save/Cancel Buttons */}
              <div className="mt-6 pt-4 border-t-2 border-dashed border-[var(--outline-variant)] flex gap-3">
                <motion.button
                  whileHover={!saving ? { scale: 1.02, y: -2 } : {}}
                  whileTap={!saving ? { scale: 0.98 } : {}}
                  onClick={handleSave}
                  disabled={saving || !hasChanges()}
                  className={`neo-button py-3 flex-1 ${
                    saved 
                      ? "bg-[var(--primary)] text-[var(--on-primary)]" 
                      : hasChanges()
                        ? "neo-button-primary"
                        : "bg-[var(--secondary-container)] cursor-not-allowed"
                  }`}
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.span 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="inline-block h-4 w-4 border-3 border-[var(--on-primary)] border-t-transparent"
                      />
                      SAVING...
                    </span>
                  ) : saved ? (
                    <>
                      <CheckCircle size={16} strokeWidth={3} /> SAVED!
                    </>
                  ) : (
                    <>
                      <Save size={16} strokeWidth={3} /> {isViewingToday ? "SAVE" : "UPDATE"}
                    </>
                  )}
                </motion.button>
                
                {!isViewingToday && (
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCancelEdit}
                    className="neo-button py-3 px-6 bg-[var(--secondary-container)]"
                  >
                    <X size={16} strokeWidth={3} /> CANCEL
                  </motion.button>
                )}
              </div>
            </>
          ) : (
            /* Past Entry View (Read Only with Edit Button) */
            <div className="space-y-5">
              {viewingEntry ? (
                <>
                  {INVENTORY_PROMPTS.map((prompt, index) => (
                    <motion.div
                      key={prompt.key}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={!viewingEntry[prompt.key] ? 'opacity-50' : ''}
                    >
                      <div className="flex items-start gap-3">
                        <span 
                          className="neo-mono text-xs px-2 py-0.5 border-3 border-[var(--on-background)] shrink-0 text-[var(--on-background)]"
                          style={{ background: prompt.color }}
                        >
                          {prompt.label}
                        </span>
                        <div className="flex-1">
                          <p className="neo-title text-sm mb-1 text-[var(--on-background)]">{prompt.question}</p>
                          <p className="neo-mono text-sm text-[var(--on-surface-variant)]">
                            {viewingEntry[prompt.key] || "—"}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Edit Button for Past Entries */}
                  <div className="pt-4 border-t-2 border-dashed border-[var(--outline-variant)]">
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleEdit}
                      className="neo-button py-3 w-full bg-[var(--primary)] text-[var(--on-primary)]"
                    >
                      <Edit2 size={16} strokeWidth={3} /> EDIT THIS ENTRY
                    </motion.button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center py-12">
                    <History size={48} className="mx-auto mb-4 text-[var(--on-surface-variant)]" />
                    <p className="neo-mono text-sm text-[var(--on-surface-variant)] mb-4">
                      No inventory was recorded for this day.
                    </p>
                  </div>
                  
                  {/* Create Entry Button for Empty Days */}
                  <div className="pt-4 border-t-2 border-dashed border-[var(--outline-variant)]">
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleEdit}
                      className="neo-button py-3 w-full neo-button-primary"
                    >
                      <Edit2 size={16} strokeWidth={3} /> ADD ENTRY FOR THIS DAY
                    </motion.button>
                  </div>
                </>
              )}
            </div>
          )}
        </motion.div>

        {/* Inventory Tracker */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="border-4 border-[var(--on-background)] p-6 bg-[var(--surface-container-lowest)]"
          style={{ boxShadow: '6px 6px 0px 0px var(--on-background)' }}
        >
          <div className="mb-4 flex items-center gap-2 border-b-4 border-[var(--on-background)] pb-3">
            <span className="neo-title text-sm text-[var(--primary)]">♥</span>
            <span className="neo-title text-sm text-[var(--on-background)]">INVENTORY TRACKER</span>
          </div>
          
          {/* Streak Stats */}
          <div className="flex gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="neo-mono text-xs text-[var(--on-surface-variant)]">CURRENT STREAK:</span>
              <span className="neo-title text-lg text-[var(--primary)]">{currentStreak}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="neo-mono text-xs text-[var(--on-surface-variant)]">BEST:</span>
              <span className="neo-title text-lg text-[var(--on-background)]">{longestStreak}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="neo-mono text-xs text-[var(--on-surface-variant)]">TOTAL:</span>
              <span className="neo-title text-lg text-[var(--on-background)]">{totalInventoryDays}</span>
            </div>
          </div>

          {/* Grid - Monochromatic burgundy scale */}
          <div className="w-full">
            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: `2.75rem repeat(${inventoryWeeks}, 1fr)` }}
            >
              {/* Month labels row */}
              <div />
              {inventoryGrid.map((week, weekIndex) => (
                <div
                  key={`month-${weekIndex}`}
                  className="neo-mono h-5 text-[10px] leading-tight text-[var(--on-surface-variant)]"
                >
                  {week.label}
                </div>
              ))}
              {/* Day rows */}
              {Array.from({ length: 7 }, (_, dayIndex) => (
                <Fragment key={dayIndex}>
                  <div className="neo-mono flex items-center justify-end pr-1 text-[10px] text-[var(--on-surface-variant)]">
                    {DAY_NAMES[dayIndex]}
                  </div>
                  {inventoryGrid.map((week, weekIndex) => {
                    const day = week.days[dayIndex];
                    return (
                      <motion.div
                        key={day.key}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: weekIndex * 0.02 }}
                        className={`aspect-square border-3 border-[var(--on-background)] ${day.isToday ? "ring-2 ring-[var(--tertiary)] ring-offset-1 ring-offset-[var(--surface-container-lowest)]" : ""}`}
                        style={{
                          backgroundColor: day.hasEntry ? "var(--primary)" : "var(--surface-container-lowest)",
                          boxShadow: day.hasEntry ? "2px 2px 0 0 var(--on-background)" : "none",
                        }}
                        title={day.hasEntry ? `Inventory completed` : "No entry"}
                      />
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>

          <p className="neo-mono text-[10px] text-center text-[var(--on-surface-variant)] mt-4">
            Last {inventoryWeeks} weeks of inventory entries.
          </p>
        </motion.section>
      </div>
    </div>
  );
}
