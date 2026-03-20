"use client";

import { motion } from "framer-motion";
import { Phone, Heart, Users, AlertCircle, ExternalLink } from "lucide-react";
import { Navigation } from "@/components/navigation";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, type: "spring" as const, stiffness: 150 }
  },
};

export function HelpContent() {
  return (
    <div className="min-h-screen zine-grid">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-4 border-[var(--on-background)] p-6 mb-6 bg-[var(--tertiary)]"
          style={{ boxShadow: "8px 8px 0px 0px var(--on-background)" }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 bg-[var(--on-background)] border-3 border-[var(--on-background)] flex items-center justify-center">
              <Heart size={20} className="text-[var(--tertiary)] strokeWidth={3}" />
            </div>
            <h1 className="neo-title text-3xl text-[var(--on-tertiary)]">
              You Are Not Alone
            </h1>
          </div>
          <p className="neo-mono text-sm text-[var(--on-tertiary)] ml-11 opacity-90">
            If you&apos;re struggling right now, please reach out. Alcoholics help other alcoholics.
          </p>
        </motion.div>

        {/* Phone Numbers */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid gap-6 md:grid-cols-2 mb-8"
        >
          {/* National AA Hotline */}
          <motion.a
            variants={cardVariants}
            href="tel:1-800-252-6463"
            className="border-4 border-[var(--on-background)] p-6 bg-[var(--surface-container-lowest)] hover:scale-[1.02] transition-transform cursor-pointer block"
            style={{ boxShadow: "8px 8px 0px 0px var(--on-background)" }}
          >
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 bg-[var(--tertiary)] border-4 border-[var(--on-background)] flex items-center justify-center shrink-0">
                <Phone size={24} strokeWidth={3} className="text-[var(--on-tertiary)]" />
              </div>
              <div className="flex-1">
                <h2 className="neo-title text-xl mb-1 text-[var(--on-background)]">
                  National AA Hotline
                </h2>
                <p className="neo-mono text-2xl font-bold text-[var(--on-background)] mb-2">
                  1-800-252-6463
                </p>
                <p className="neo-mono text-xs text-[var(--on-surface-variant)]">
                  Available 24 hours a day, 7 days a week
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t-2 border-dashed border-[var(--outline-variant)]">
              <p className="neo-mono text-xs text-[var(--on-surface-variant)]">
                Talk to a sober alcoholic who understands what you&apos;re going through.
              </p>
            </div>
          </motion.a>

          {/* New Jersey Intergroup */}
          <motion.a
            variants={cardVariants}
            href="tel:1-800-992-6363"
            className="border-4 border-[var(--on-background)] p-6 bg-[var(--surface-container-lowest)] hover:scale-[1.02] transition-transform cursor-pointer block"
            style={{ boxShadow: "8px 8px 0px 0px var(--on-background)" }}
          >
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 bg-[var(--primary)] border-4 border-[var(--on-background)] flex items-center justify-center shrink-0">
                <Users size={24} strokeWidth={3} className="text-[var(--on-primary)]" />
              </div>
              <div className="flex-1">
                <h2 className="neo-title text-xl mb-1 text-[var(--on-background)]">
                  NJ Intergroup
                </h2>
                <p className="neo-mono text-2xl font-bold text-[var(--on-background)] mb-2">
                  1-800-992-6363
                </p>
                <p className="neo-mono text-xs text-[var(--on-surface-variant)]">
                  New Jersey Statewide Hotline
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t-2 border-dashed border-[var(--outline-variant)]">
              <p className="neo-mono text-xs text-[var(--on-surface-variant)]">
                Connect with AA members in New Jersey who can help you find a meeting.
              </p>
            </div>
          </motion.a>
        </motion.div>

        {/* Crisis Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="border-4 border-[var(--tertiary)] p-6 mb-8 bg-[var(--surface-container-lowest)]"
          style={{ boxShadow: '8px 8px 0px 0px var(--tertiary)' }}
        >
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 bg-[var(--tertiary)] border-3 border-[var(--on-background)] flex items-center justify-center shrink-0">
              <AlertCircle size={20} strokeWidth={3} className="text-[var(--on-tertiary)]" />
            </div>
            <div>
              <h3 className="neo-title text-lg mb-2 text-[var(--on-background)]">
                Having Thoughts of Drinking?
              </h3>
              <p className="neo-mono text-sm text-[var(--on-surface-variant)] mb-3">
                You don&apos;t have to go through this alone. Pick up the phone before you pick up a drink. 
                An alcoholic on the other end of the line wants to help you stay sober today.
              </p>
              <p className="neo-mono text-xs text-[var(--on-surface-variant)]">
                This too shall pass. Just don&apos;t drink today. One day at a time.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Additional Resources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="border-4 border-[var(--on-background)] p-6 bg-[var(--surface-container-lowest)]"
          style={{ boxShadow: '6px 6px 0px 0px var(--on-background)' }}
        >
          <h3 className="neo-title text-lg mb-4 flex items-center gap-2 text-[var(--on-background)]">
            <ExternalLink size={18} strokeWidth={3} /> MORE RESOURCES
          </h3>
          
          <div className="space-y-3">
            <a 
              href="https://www.aa.org/find-aa" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 border-3 border-[var(--on-background)] bg-[var(--surface-container-lowest)] hover:bg-[var(--surface-container)] transition-colors"
            >
              <span className="neo-mono text-sm text-[var(--on-background)]">AA.org Meeting Finder</span>
              <ExternalLink size={14} strokeWidth={3} className="text-[var(--on-surface-variant)]" />
            </a>
            
            <a 
              href="https://www.nj-aa.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 border-3 border-[var(--on-background)] bg-[var(--surface-container-lowest)] hover:bg-[var(--surface-container)] transition-colors"
            >
              <span className="neo-mono text-sm text-[var(--on-background)]">New Jersey AA Website</span>
              <ExternalLink size={14} strokeWidth={3} className="text-[var(--on-surface-variant)]" />
            </a>

            <div className="p-3 border-3 border-[var(--on-background)] bg-[var(--primary)]">
              <p className="neo-mono text-xs text-[var(--on-primary)]">
                <strong>Remember:</strong> The only requirement for AA membership is a desire to stop drinking. 
                You don&apos;t have to believe in God. You don&apos;t have to do the steps perfectly. 
                You just have to not drink today, and try to help another alcoholic.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
