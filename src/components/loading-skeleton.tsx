"use client";

import { motion } from "framer-motion";

export const PageLoadingSkeleton = () => (
  <div className="min-h-screen">
    <div className="px-4 py-8 md:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header skeleton */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="neo-card p-6"
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 animate-pulse border-4 border-black bg-[var(--gray-muted)]" />
            <div className="space-y-2">
              <div className="h-6 w-32 animate-pulse bg-[var(--gray-muted)]" />
              <div className="h-4 w-48 animate-pulse bg-[var(--gray-muted)]" />
            </div>
          </div>
        </motion.div>

        {/* Content skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="neo-card p-8 text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="mx-auto mb-4 h-12 w-12 border-4 border-black bg-[var(--butter)]"
            style={{ boxShadow: "6px 6px 0px 0px black" }}
          />
          <p className="neo-title animate-blink">LOADING...</p>
        </motion.div>
      </div>
    </div>
  </div>
);

export const ContentLoadingSpinner = () => (
  <div className="text-center py-8">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="mx-auto mb-4 h-10 w-10 border-4 border-black bg-[var(--butter)]"
      style={{ boxShadow: "6px 6px 0px 0px black" }}
    />
    <p className="neo-title animate-blink">LOADING...</p>
  </div>
);
