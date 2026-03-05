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

const formVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 16 },
  show: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] as const }
  },
};

const errorVariants = {
  hidden: { height: 0, opacity: 0 },
  show: { 
    height: "auto", 
    opacity: 1,
    transition: { duration: 0.2 }
  },
  exit: { 
    height: 0, 
    opacity: 0,
    transition: { duration: 0.15 }
  },
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

  const toggleMode = () => {
    setMode((prev) => (prev === "login" ? "register" : "login"));
    setError(null);
  };

  return (
    <motion.div
      variants={formVariants}
      initial="hidden"
      animate="show"
      className="w-full max-w-md"
    >
      <motion.div 
        className="panel border-2 border-[#404040] p-1 mb-6"
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.15 }}
      >
        <div className="panel-inset p-4">
          <div className="flex items-center gap-3 mb-2">
            <motion.div 
              className="led bg-[#fbbf24]"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div 
              className="led bg-[#fbbf24]"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
            />
            <motion.div 
              className="led bg-[#10b981]"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
            />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-[#e5e5e5] leading-none">
            MEETING<br />TRACKER<br /><span className="text-[#fbbf24]">v2.0</span>
          </h1>
        </div>
      </motion.div>

      <motion.div 
        className="panel border-2 border-[#404040] p-8"
        variants={formVariants}
      >
        <motion.div 
          className="flex items-center gap-2 mb-6 pb-4 border-b border-[#404040]"
          key={mode}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          <span className="font-mono text-xs text-[#fbbf24]">{'//'}</span>
          <motion.span 
            className="font-mono text-xs font-bold uppercase tracking-wider text-[#888]"
            key={mode}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            {mode === "login" ? "AUTHENTICATE_USER" : "CREATE_NEW_USER"}
          </motion.span>
        </motion.div>

        <form onSubmit={onSubmit} className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
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
          </motion.div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                variants={errorVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="panel-inset border-2 border-[#ef4444] p-3"
              >
                <motion.div
                  initial={{ x: -4 }}
                  animate={{ x: [0, -3, 3, -2, 2, 0] }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center gap-2">
                    <div className="led bg-[#ef4444]"></div>
                    <span className="text-xs font-bold uppercase text-[#ef4444]">{error}</span>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={!submitting ? { scale: 1.015 } : {}}
            whileTap={!submitting ? { scale: 0.985 } : {}}
            type="submit"
            disabled={submitting}
            className={`industrial-button industrial-button-primary w-full py-4 text-base tracking-widest ${
              submitting ? "breathe" : ""
            }`}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span 
                  className="status-indicator text-[#fbbf24] bg-[#fbbf24] w-3 h-3"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
                PROCESSING...
              </span>
            ) : (
              mode === "login" ? "[ ENTER SYSTEM ]" : "[ INITIALIZE USER ]"
            )}
          </motion.button>
        </form>

        <motion.div 
          className="mt-8 pt-6 border-t border-[#404040]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={toggleMode}
            className="w-full text-center font-bold uppercase tracking-wider text-[#888] hover:text-[#fbbf24] transition-colors"
          >
            {mode === "login" 
              ? "[ NO ACCOUNT? REGISTER ]" 
              : "[ HAS ACCOUNT? LOGIN ]"
            }
          </motion.button>
        </motion.div>
      </motion.div>

      <motion.div 
        className="mt-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <p className="font-mono text-xs text-[#555] uppercase tracking-widest">
          SECURE {'//'} ENCRYPTED {'//'} LOGGED
        </p>
      </motion.div>
    </motion.div>
  );
};
