"use client";

import { AuthForm } from "@/components/auth-form";
import { Dashboard } from "@/components/dashboard";
import { useAuth } from "@/components/auth-provider";

export default function Home() {
  const { user, loading, configError } = useAuth();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm text-slate-600 shadow-sm">
          Loading...
        </div>
      </main>
    );
  }

  if (configError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-lg rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900 shadow-sm">
          <h1 className="text-base font-semibold">Firebase configuration required</h1>
          <p className="mt-2">
            {configError}
          </p>
          <p className="mt-2">
            Copy <code>.env.example</code> to <code>.env.local</code> and set your Firebase values.
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <AuthForm />
      </main>
    );
  }

  return <Dashboard />;
}
