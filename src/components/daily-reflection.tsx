"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar, RotateCcw, Sun } from "lucide-react";
import { getTodaysReflection, getReflectionByDay, getCurrentDayOfYear, type DailyReflection } from "@/lib/daily-reflections";

export function DailyReflection() {
  const [currentDay, setCurrentDay] = useState<number>(getCurrentDayOfYear());
  const [reflection, setReflection] = useState<DailyReflection | null>(null);
  const [isToday, setIsToday] = useState(true);
  const todayDay = getCurrentDayOfYear();

  useEffect(() => {
    setReflection(getReflectionByDay(currentDay));
    setIsToday(currentDay === todayDay);
  }, [currentDay, todayDay]);

  const goToPrevious = () => {
    setCurrentDay((prev) => (prev <= 1 ? 365 : prev - 1));
  };

  const goToNext = () => {
    setCurrentDay((prev) => (prev >= 365 ? 1 : prev + 1));
  };

  const goToToday = () => {
    setCurrentDay(todayDay);
  };

  if (!reflection) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-4 border-[var(--on-background)] mb-8 overflow-hidden bg-[var(--surface-container-lowest)]"
      style={{ 
        borderLeft: "6px solid var(--primary)"
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-[var(--surface-container)] border-b-3 border-[var(--on-background)]">
        <div className="flex items-center gap-3">
          <div className="p-2 border-3 border-[var(--on-background)] bg-[var(--surface-container-lowest)]">
            <Sun size={24} strokeWidth={3} className="text-[var(--primary)]" />
          </div>
          <div>
            <h2 className="neo-title text-xl text-[var(--on-background)]">DAILY REFLECTION</h2>
            <div className="flex items-center gap-2">
              <Calendar size={14} strokeWidth={3} className="text-[var(--on-surface-variant)]" />
              <span className="neo-mono text-xs text-[var(--on-surface-variant)]">
                DAY {currentDay} OF 365
              </span>
              {!isToday && (
                <span className="neo-badge text-xs bg-[var(--primary)] text-[var(--on-primary)] ml-2">
                  VIEWING PAST
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Navigation Controls */}
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={goToPrevious}
            className="neo-button p-2 bg-[var(--surface-container-lowest)]"
            aria-label="Previous day"
          >
            <ChevronLeft size={20} strokeWidth={3} />
          </motion.button>
          
          {!isToday && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={goToToday}
              className="neo-button px-3 py-2 bg-[var(--primary)] text-[var(--on-primary)] text-sm flex items-center gap-1"
              aria-label="Go to today"
            >
              <RotateCcw size={14} strokeWidth={3} />
              TODAY
            </motion.button>
          )}
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={goToNext}
            className="neo-button p-2 bg-[var(--surface-container-lowest)]"
            aria-label="Next day"
          >
            <ChevronRight size={20} strokeWidth={3} />
          </motion.button>
        </div>
      </div>

      {/* Quote Content - Editorial Treatment */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentDay}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="p-6"
        >
          <blockquote className="relative editorial-border">
            <p className="quote-text text-xl md:text-2xl text-[var(--on-background)] leading-relaxed">
              {reflection.text}
            </p>
          </blockquote>
          
          {/* Attribution */}
          {(reflection.author || reflection.source) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-4 pt-4 border-t-3 border-[var(--outline-variant)] flex items-center justify-end gap-2"
            >
              <span className="neo-mono text-sm text-[var(--on-surface-variant)]">
                — {reflection.author || reflection.source}
              </span>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
