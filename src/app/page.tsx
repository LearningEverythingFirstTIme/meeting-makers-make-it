"use client";

import { motion } from "framer-motion";
import { AuthForm } from "@/components/auth-form";
import { Dashboard } from "@/components/dashboard";
import { useAuth } from "@/components/auth-provider";

export default function Home() {
  const { user, loading, configError } = useAuth();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
          className="neo-card p-12 text-center"
        >
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mx-auto mb-6 h-16 w-16 border-4 border-black bg-[var(--butter)]"
            style={{ boxShadow: '6px 6px 0px 0px black' }}
          />
          <p className="neo-title text-xl text-black animate-blink">
            INITIALIZING...
          </p>
        </motion.div>
      </main>
    );
  }

  if (configError) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-8">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
          className="neo-card border-[var(--coral)] max-w-lg p-8"
          style={{ boxShadow: '12px 12px 0px 0px var(--coral)' }}
        >
          <div className="mb-6 flex items-center gap-3 border-b-4 border-black pb-4">
            <div className="h-6 w-6 bg-[var(--coral)] border-2 border-black" />
            <h1 className="neo-title text-3xl text-black">ERROR</h1>
          </div>
          <p className="neo-mono text-sm mb-6 text-[var(--coral)]">
            {configError}
          </p>
          <div className="bg-[var(--cream)] border-3 border-black p-4">
            <p className="neo-mono text-xs text-black">
              COPY <span className="bg-black text-white px-2 py-1">.env.example</span> TO <span className="bg-black text-white px-2 py-1">.env.local</span>
            </p>
          </div>
        </motion.div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-8">
        <AuthForm />
      </main>
    );
  }

  return <Dashboard />;
}
