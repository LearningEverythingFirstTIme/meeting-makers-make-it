"use client";

import { useState } from "react";
import { FirebaseError } from "firebase/app";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/auth-provider";

type Mode = "login" | "register";

const friendlyAuthError = (error: unknown): string => {
  if (!(error instanceof FirebaseError)) {
    return "SYSTEM ERROR: UNKNOWN FAILURE";
  }

  switch (error.code) {
    case "auth/invalid-email":
      return "INVALID EMAIL FORMAT";
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "CREDENTIALS NOT RECOGNIZED";
    case "auth/email-already-in-use":
      return "USER ALREADY EXISTS";
    case "auth/weak-password":
      return "PASSWORD TOO WEAK (MIN 6 CHARS)";
    default:
      return "AUTHENTICATION FAILURE";
  }
};

export const AuthForm = () => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password);
      }
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md"
    >
      <div className="panel border-2 border-[#404040] p-1 mb-6">
        <div className="panel-inset p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="led bg-[#fbbf24]"></div>
            <div className="led bg-[#fbbf24]"></div>
            <div className="led bg-[#10b981]"></div>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-[#e5e5e5] leading-none">
            MEETING<br />TRACKER<br /><span className="text-[#fbbf24]">v2.0</span>
          </h1>
        </div>
      </div>

      <div className="panel border-2 border-[#404040] p-8">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#404040]">
          <span className="font-mono text-xs text-[#fbbf24]">{'//'}</span>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#888]">
            {mode === "login" ? "AUTHENTICATE_USER" : "CREATE_NEW_USER"}
          </span>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#888]">
              &gt; EMAIL_ADDRESS
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="industrial-input"
              placeholder="USER@DOMAIN.COM"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#888]">
              &gt; PASSWORD
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={6}
              className="industrial-input"
              placeholder="********"
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="panel-inset border-2 border-[#ef4444] p-3"
              >
                <div className="flex items-center gap-2">
                  <div className="led bg-[#ef4444]"></div>
                  <span className="text-xs font-bold uppercase text-[#ef4444]">{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={submitting}
            className="industrial-button industrial-button-primary w-full py-4 text-base tracking-widest"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="status-indicator text-[#fbbf24] bg-[#fbbf24] w-3 h-3"></span>
                PROCESSING...
              </span>
            ) : (
              mode === "login" ? "[ ENTER SYSTEM ]" : "[ INITIALIZE USER ]"
            )}
          </motion.button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#404040]">
          <button
            type="button"
            onClick={() => {
              setMode((prev) => (prev === "login" ? "register" : "login"));
              setError(null);
            }}
            className="w-full text-center font-bold uppercase tracking-wider text-[#888] hover:text-[#fbbf24] transition-colors"
          >
            {mode === "login" 
              ? "[ NO ACCOUNT? REGISTER ]" 
              : "[ HAS ACCOUNT? LOGIN ]"
            }
          </button>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="font-mono text-xs text-[#555] uppercase tracking-widest">
          SECURE // ENCRYPTED // LOGGED
        </p>
      </div>
    </motion.div>
  );
};
