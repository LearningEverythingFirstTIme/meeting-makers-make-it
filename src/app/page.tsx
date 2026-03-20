"use client";

import { motion } from "framer-motion";
import { AuthForm } from "@/components/auth-form";
import { Dashboard } from "@/components/dashboard";
import { useAuth } from "@/components/auth-provider";

export default function Home() {
  const { user, loading, configError } = useAuth();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 zine-grid">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
          className="border-4 border-[var(--on-background)] p-12 text-center bg-[var(--surface-container-lowest)]"
          style={{ boxShadow: '8px 8px 0px 0px var(--on-background)' }}
        >
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mx-auto mb-6 h-16 w-16 border-4 border-[var(--on-background)] bg-[var(--primary)]"
            style={{ boxShadow: '8px 8px 0px 0px var(--on-background)' }}
          />
          <p className="neo-title text-xl text-[var(--on-background)] animate-blink">
            INITIALIZING...
          </p>
        </motion.div>
      </main>
    );
  }

  if (configError) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-8 zine-grid">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
          className="border-4 border-[var(--tertiary)] max-w-lg p-8 bg-[var(--surface-container-lowest)]"
          style={{ boxShadow: '12px 12px 0px 0px var(--tertiary)' }}
        >
          <div className="mb-6 flex items-center gap-3 border-b-4 border-[var(--on-background)] pb-4">
            <div className="h-6 w-6 bg-[var(--tertiary)] border-3 border-[var(--on-background)]" />
            <h1 className="neo-title text-3xl text-[var(--on-background)]">ERROR</h1>
          </div>
          <p className="neo-mono text-sm mb-6 text-[var(--tertiary)]">
            {configError}
          </p>
          <div className="bg-[var(--surface-container)] border-4 border-[var(--on-background)] p-4">
            <p className="neo-mono text-xs text-[var(--on-background)]">
              COPY <span className="bg-[var(--on-background)] text-[var(--surface-container-lowest)] px-2 py-1">.env.example</span> TO <span className="bg-[var(--on-background)] text-[var(--surface-container-lowest)] px-2 py-1">.env.local</span>
            </p>
          </div>
        </motion.div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-8 zine-grid">
        <AuthForm />
      </main>
    );
  }

  return <Dashboard />;
}
