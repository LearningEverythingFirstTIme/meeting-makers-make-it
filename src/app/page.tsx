"use client";

import { motion } from "framer-motion";
import { AuthForm } from "@/components/auth-form";
import { Dashboard } from "@/components/dashboard";
import { useAuth } from "@/components/auth-provider";

export default function Home() {
  const { user, loading, configError } = useAuth();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="h-16 w-16 border-4 border-black bg-yellow-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        />
      </main>
    );
  }

  if (configError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
        <div className="w-full max-w-lg border-4 border-black bg-rose-400 p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="text-2xl font-black uppercase tracking-tight text-black">Configuration Error</h1>
          <p className="mt-4 font-mono text-sm font-bold text-black">
            {configError}
          </p>
          <p className="mt-4 font-mono text-sm font-bold text-black">
            Copy <code className="bg-black px-1 py-0.5 text-white">.env.example</code> to <code className="bg-black px-1 py-0.5 text-white">.env.local</code> and set your Firebase values.
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-8">
        <AuthForm />
      </main>
    );
  }

  return <Dashboard />;
}
