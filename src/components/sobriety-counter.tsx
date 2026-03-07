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

const chipGlowByColor: Record<string, string> = {
  "#FFFFFF": "0 0 20px rgba(255,255,255,0.8)",
  "#C0C0C0": "0 0 20px rgba(192,192,192,0.6)",
  "#FF0000": "0 0 20px rgba(255,0,0,0.5)",
  "#4169E1": "0 0 20px rgba(65,105,225,0.5)",
  "#FFD700": "0 0 25px rgba(255,215,0,0.7)",
  "#228B22": "0 0 20px rgba(34,139,34,0.5)",
  "#CD7F32": "0 0 20px rgba(205,127,50,0.5)",
  "#A9A9A9": "0 0 20px rgba(169,169,169,0.5)",
  "#8B4513": "0 0 20px rgba(139,69,19,0.5)",
  "#B8860B": "0 0 20px rgba(184,134,11,0.5)",
  "#000000": "0 0 20px rgba(100,100,100,0.5)",
};

export const SobrietyCounter = ({ sobrietyDate, onEdit }: SobrietyCounterProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Use requestAnimationFrame to avoid setState in effect warning
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
        className="neo-card p-6 border-dashed border-4 border-[var(--coral)]"
        style={{ boxShadow: '8px 8px 0px 0px var(--coral)' }}
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
            className="inline-block mb-4"
          >
            <div className="h-16 w-16 bg-[var(--coral)] border-4 border-black mx-auto flex items-center justify-center">
              <Award size={32} strokeWidth={3} className="text-white" />
            </div>
          </motion.div>
          <h3 className="neo-title text-xl mb-2">TRACK YOUR SOBRIETY</h3>
          <p className="neo-mono text-xs mb-4 text-gray-600">
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
      <div className="neo-card p-6" style={{ boxShadow: '8px 8px 0px 0px black' }}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="h-16 bg-gray-200 rounded w-48"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="neo-card p-6"
      style={{ 
        boxShadow: currentMilestone 
          ? `8px 8px 0px 0px ${currentMilestone.chipColor === '#000000' ? 'var(--black)' : currentMilestone.chipColor}` 
          : '8px 8px 0px 0px black'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ 
              boxShadow: currentMilestone 
                ? [chipGlowByColor[currentMilestone.chipColor] || 'none', 'none', chipGlowByColor[currentMilestone.chipColor] || 'none']
                : 'none'
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="h-10 w-10 border-3 border-black flex items-center justify-center"
            style={{ 
              backgroundColor: currentMilestone?.chipColor || 'var(--butter)',
            }}
          >
            <Award 
              size={20} 
              strokeWidth={3} 
              className={currentMilestone?.chipColor === '#000000' ? 'text-white' : 'text-black'} 
            />
          </motion.div>
          <span className="neo-title text-sm">SOBRIETY COUNTER</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.1, rotate: -5 }}
          whileTap={{ scale: 0.9 }}
          onClick={onEdit}
          className="p-2 border-2 border-black hover:bg-[var(--butter)]"
          style={{ boxShadow: '2px 2px 0px 0px black' }}
        >
          <Edit3 size={14} strokeWidth={3} />
        </motion.button>
      </div>

      {/* Main Counter */}
      <div className="text-center mb-6">
        <motion.div
          key={daysSober}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <p className="neo-title text-6xl md:text-7xl text-black leading-none">
            {daysSober}
          </p>
          <p className="neo-mono text-sm text-gray-600 mt-1">DAYS SOBER</p>
        </motion.div>
        
        <motion.p 
          className="neo-title text-lg mt-3 text-[var(--mint)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {anniversaryText}
        </motion.p>
      </div>

      {/* Breakdown */}
      {(years > 0 || months > 0) && (
        <motion.div 
          className="flex justify-center gap-4 mb-6 pb-4 border-b-2 border-dashed border-black"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {years > 0 && (
            <div className="text-center">
              <p className="neo-title text-2xl">{years}</p>
              <p className="neo-mono text-[10px]">YEAR{years !== 1 ? 'S' : ''}</p>
            </div>
          )}
          {months > 0 && (
            <div className="text-center">
              <p className="neo-title text-2xl">{months}</p>
              <p className="neo-mono text-[10px]">MONTH{months !== 1 ? 'S' : ''}</p>
            </div>
          )}
          <div className="text-center">
            <p className="neo-title text-2xl">{days}</p>
            <p className="neo-mono text-[10px]">DAY{days !== 1 ? 'S' : ''}</p>
          </div>
        </motion.div>
      )}

      {/* Sobriety Date */}
      <div className="flex items-center justify-center gap-2 mb-4 text-gray-600">
        <Calendar size={12} strokeWidth={3} />
        <span className="neo-mono text-xs">SINCE {formatSobrietyDate(sobrietyDate).toUpperCase()}</span>
      </div>

      {/* Current Milestone */}
      {currentMilestone && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-[var(--cream)] border-3 border-black p-4 mb-4"
          style={{ boxShadow: '4px 4px 0px 0px black' }}
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                boxShadow: [
                  chipGlowByColor[currentMilestone.chipColor] || 'none',
                  `${chipGlowByColor[currentMilestone.chipColor] || 'none'} inset 0 0 10px`,
                  chipGlowByColor[currentMilestone.chipColor] || 'none'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="h-12 w-12 rounded-full border-3 border-black flex-shrink-0"
              style={{ backgroundColor: currentMilestone.chipColor }}
            />
            <div>
              <p className="neo-mono text-[10px] text-gray-600">CURRENT CHIP</p>
              <p className="neo-title text-lg" style={{ color: currentMilestone.chipColor === '#000000' ? 'var(--black)' : currentMilestone.chipColor }}>
                {currentMilestone.label}
              </p>
              <p className="neo-mono text-[10px] text-gray-500">{currentMilestone.description}</p>
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
            <span className="neo-mono text-[10px] text-gray-600">PROGRESS TO {nextMilestone.label}</span>
            <span className="neo-mono text-[10px]">{Math.round(progress.percent)}%</span>
          </div>
          <div className="h-3 bg-gray-200 border-2 border-black">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress.percent}%` }}
              transition={{ duration: 1, delay: 0.4, type: "spring" }}
              className="h-full bg-[var(--mint)] border-r-2 border-black"
            />
          </div>
          <p className="neo-mono text-[10px] text-center text-gray-500">
            {nextMilestone.days - daysSober} DAYS TO GO
          </p>
        </motion.div>
      )}

      {/* Milestone Grid */}
      <div className="mt-6 pt-4 border-t-2 border-dashed border-black">
        <p className="neo-mono text-[10px] text-gray-600 mb-3">MILESTONE CHIPS</p>
        <div className="flex flex-wrap gap-2">
          {SOBRIETY_MILESTONES.slice(0, 8).map((milestone, index) => {
            const isAchieved = daysSober >= milestone.days;
            const isNext = nextMilestone?.days === milestone.days;
            
            return (
              <motion.div
                key={milestone.days}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                className={`h-6 w-6 border-2 border-black ${isAchieved ? '' : 'grayscale opacity-40'}`}
                style={{ 
                  backgroundColor: milestone.chipColor,
                  boxShadow: isNext ? chipGlowByColor[milestone.chipColor] : 'none'
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
