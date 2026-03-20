"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Edit3, Award, Calendar } from "lucide-react";
import {
  calculateDaysSober,
  getCurrentMilestone,
  getNextMilestone,
  getMilestoneProgress,
  formatSobrietyDate,
  getAnniversaryText,
  SOBRIETY_MILESTONES,
} from "@/lib/sobriety-utils";

interface SobrietyCounterProps {
  sobrietyDate: string | null;
  onEdit: () => void;
}

// Editorial Brutalism chip colors - mapped to the design system
const chipColorMap: Record<string, string> = {
  "#FFFFFF": "var(--surface-container-lowest)",
  "#C0C0C0": "var(--secondary-container)",
  "#FF0000": "var(--tertiary)",
  "#4169E1": "var(--secondary)",
  "#FFD700": "var(--primary)",
  "#228B22": "var(--primary-container)",
  "#CD7F32": "var(--tertiary-container)",
  "#A9A9A9": "var(--secondary)",
  "#8B4513": "var(--tertiary-container)",
  "#B8860B": "var(--primary-container)",
  "#000000": "var(--on-background)",
};

export const SobrietyCounter = ({ sobrietyDate, onEdit }: SobrietyCounterProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!sobrietyDate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-4 border-dashed border-[var(--tertiary)] bg-[var(--surface-container-lowest)] p-6"
        style={{ boxShadow: '8px 8px 0px 0px var(--tertiary)' }}
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
            className="inline-block mb-4"
          >
            <div className="h-16 w-16 bg-[var(--tertiary)] border-4 border-[var(--on-background)] mx-auto flex items-center justify-center">
              <Award size={32} strokeWidth={3} className="text-[var(--on-tertiary)]" />
            </div>
          </motion.div>
          <h3 className="neo-title text-xl mb-2 text-[var(--on-background)]">TRACK YOUR SOBRIETY</h3>
          <p className="neo-mono text-xs mb-4 text-[var(--on-surface-variant)]">
            Set your sobriety date to track progress and celebrate milestones.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onEdit}
            className="neo-button neo-button-primary w-full py-3"
          >
            <Calendar size={14} strokeWidth={3} className="inline mr-2" />
            SET SOBRIETY DATE
          </motion.button>
        </div>
      </motion.div>
    );
  }

  const daysSober = calculateDaysSober(sobrietyDate);
  const currentMilestone = getCurrentMilestone(daysSober);
  const nextMilestone = getNextMilestone(daysSober);
  const progress = getMilestoneProgress(daysSober);
  const anniversaryText = getAnniversaryText(daysSober);

  // Calculate years, months, days breakdown
  const years = Math.floor(daysSober / 365);
  const remainingAfterYears = daysSober % 365;
  const months = Math.floor(remainingAfterYears / 30);
  const days = remainingAfterYears % 30;

  if (!mounted) {
    return (
      <div className="bg-[var(--primary)] border-4 border-[var(--on-background)] p-6" style={{ boxShadow: '8px 8px 0px 0px var(--on-background)' }}>
        <div className="animate-pulse">
          <div className="h-8 bg-white/20 w-32 mb-4"></div>
          <div className="h-16 bg-white/20 w-48"></div>
        </div>
      </div>
    );
  }

  const chipBgColor = currentMilestone 
    ? (chipColorMap[currentMilestone.chipColor] || currentMilestone.chipColor)
    : 'var(--surface-container-lowest)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--primary)] border-4 border-[var(--on-background)] p-6 relative overflow-hidden"
      style={{ boxShadow: '8px 8px 0px 0px var(--on-background)' }}
    >
      {/* Est. date badge - top right */}
      <div className="absolute top-0 right-0 p-4 neo-mono text-xs opacity-50 uppercase tracking-[0.3em] text-[var(--on-primary)]">
        EST. {formatSobrietyDate(sobrietyDate).toUpperCase().replace(' ', '.').replace(',', '')}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="neo-title text-sm text-[var(--on-primary)] uppercase tracking-widest">CURRENT_STREAK</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.1, rotate: -5 }}
          whileTap={{ scale: 0.9 }}
          onClick={onEdit}
          className="p-2 border-3 border-[var(--on-primary)] hover:bg-white/10"
          style={{ boxShadow: '3px 3px 0px 0px var(--on-primary)' }}
        >
          <Edit3 size={14} strokeWidth={3} className="text-[var(--on-primary)]" />
        </motion.button>
      </div>

      {/* HERO Counter - Massive Typography */}
      <div className="mb-6">
        <motion.div
          key={daysSober}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="flex items-baseline gap-4"
        >
          <p className="headline-xl text-[var(--on-primary)] leading-none">
            {daysSober.toLocaleString()}
          </p>
          <span className="neo-title text-2xl italic text-[var(--on-primary)]">Days</span>
        </motion.div>
        
        <motion.p 
          className="quote-text text-lg mt-3 text-[var(--on-primary)] opacity-80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {anniversaryText}
        </motion.p>
      </div>

      {/* Breakdown Stats */}
      {(years > 0 || months > 0) && (
        <motion.div 
          className="flex gap-8 mb-6 pb-4 border-t-2 border-white/20 pt-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {years > 0 && (
            <div>
              <p className="neo-title text-3xl text-[var(--on-primary)]">{years}</p>
              <p className="neo-mono text-xs text-[var(--on-primary)] opacity-70">YEAR{years !== 1 ? 'S' : ''}</p>
            </div>
          )}
          {months > 0 && (
            <div>
              <p className="neo-title text-3xl text-[var(--on-primary)]">{months}</p>
              <p className="neo-mono text-xs text-[var(--on-primary)] opacity-70">MONTH{months !== 1 ? 'S' : ''}</p>
            </div>
          )}
          <div>
            <p className="neo-title text-3xl text-[var(--on-primary)]">{days}</p>
            <p className="neo-mono text-xs text-[var(--on-primary)] opacity-70">DAY{days !== 1 ? 'S' : ''}</p>
          </div>
        </motion.div>
      )}

      {/* Current Milestone - Editorial Card */}
      {currentMilestone && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-[var(--surface-container-lowest)] border-4 border-[var(--on-background)] p-4 mb-4"
          style={{ boxShadow: '4px 4px 0px 0px var(--on-background)' }}
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="h-12 w-12 border-3 border-[var(--on-background)] flex-shrink-0"
              style={{ backgroundColor: chipBgColor }}
            />
            <div>
              <p className="neo-mono text-xs text-[var(--on-surface-variant)]">CURRENT CHIP</p>
              <p className="neo-title text-lg text-[var(--on-background)]">
                {currentMilestone.label}
              </p>
              <p className="neo-mono text-xs text-[var(--on-surface-variant)]">{currentMilestone.description}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Progress to Next Milestone */}
      {nextMilestone && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="neo-mono text-xs text-[var(--on-primary)] opacity-70">PROGRESS TO {nextMilestone.label}</span>
            <span className="neo-mono text-xs text-[var(--on-primary)]">{Math.round(progress.percent)}%</span>
          </div>
          <div className="h-3 bg-white/20 border-2 border-[var(--on-primary)]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress.percent}%` }}
              transition={{ duration: 1, delay: 0.4, type: "spring" }}
              className="h-full bg-[var(--tertiary)]"
            />
          </div>
          <p className="neo-mono text-xs text-center text-[var(--on-primary)] opacity-70">
            {nextMilestone.days - daysSober} DAYS TO GO
          </p>
        </motion.div>
      )}

      {/* Milestone Grid */}
      <div className="mt-6 pt-4 border-t-2 border-white/20">
        <p className="neo-mono text-xs text-[var(--on-primary)] opacity-50 mb-3">MILESTONE CHIPS</p>
        <div className="flex flex-wrap gap-2">
          {SOBRIETY_MILESTONES.slice(0, 8).map((milestone, index) => {
            const isAchieved = daysSober >= milestone.days;
            const isNext = nextMilestone?.days === milestone.days;
            const bgColor = chipColorMap[milestone.chipColor] || milestone.chipColor;
            
            return (
              <motion.div
                key={milestone.days}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                className={`h-6 w-6 border-3 border-[var(--on-background)] ${isAchieved ? '' : 'opacity-30'}`}
                style={{ 
                  backgroundColor: bgColor,
                  boxShadow: isNext ? '2px 2px 0 0 var(--tertiary)' : 'none'
                }}
                title={`${milestone.label}: ${milestone.description}`}
              />
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
