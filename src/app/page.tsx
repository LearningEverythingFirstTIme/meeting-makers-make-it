"use client";

import { AuthForm } from "@/components/auth-form";
import { Dashboard } from "@/components/dashboard";
import { useAuth } from "@/components/auth-provider";

export default function Home() {
  const { user, loading, configError } = useAuth();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#1a1a1a] px-4">
        <div className="panel p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="status-indicator bg-[#fbbf24] text-[#fbbf24]"></div>
          </div>
          <p className="font-mono text-sm font-bold uppercase tracking-widest text-[#fbbf24] animate-pulse">
            INITIALIZING SYSTEM...
          </p>
        </div>
      </main>
    );
  }

  if (configError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#1a1a1a] px-4">
        <div className="industrial-card border-[#ef4444] max-w-lg p-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="led bg-[#ef4444]"></div>
            <h1 className="text-2xl font-black uppercase tracking-tight">SYSTEM ERROR</h1>
          </div>
          <p className="font-mono text-sm font-bold text-[#ef4444] mb-4">
            ERROR: {configError}
          </p>
          <p className="font-mono text-xs text-[#888]">
            Copy <code className="bg-[#1f1f1f] px-2 py-1 text-[#fbbf24]">[.env.example]</code> to <code className="bg-[#1f1f1f] px-2 py-1 text-[#fbbf24]">[.env.local]</code> and configure Firebase values.
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#1a1a1a] px-4 py-8">
        <AuthForm />
      </main>
    );
  }

  return <Dashboard />;
}
