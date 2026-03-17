"use client";

import { useState } from "react";
import { FirebaseError } from "firebase/app";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/auth-provider";
import { useHaptics } from "@/components/haptics-provider";

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
  hidden: { scale: 0.8, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: { duration: 0.5, type: "spring" as const, stiffness: 150, damping: 15 }
  },
};

const inputVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: { x: 0, opacity: 1 }
};

const errorVariants = {
  hidden: { height: 0, opacity: 0 },
  visible: { height: "auto", opacity: 1 },
  exit: { height: 0, opacity: 0 }
};

export const AuthForm = () => {
  const { login, register } = useAuth();
  const { trigger, isSupported } = useHaptics();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [shake, setShake] = useState(false);

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
      if (isSupported) trigger('success');
    } catch (err) {
      const msg = friendlyAuthError(err);
      setError(msg);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      if (isSupported) trigger('error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMode = () => {
    if (isSupported) trigger('light');
    setMode((prev) => (prev === "login" ? "register" : "login"));
    setError(null);
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={formVariants}
      className="w-full max-w-md"
    >
      <motion.div 
        className="neo-card mb-6 p-2 neo-card-hover"
        whileHover={{ scale: 1.02, rotate: 0.5 }}
        transition={{ duration: 0.2 }}
      >
        <div className="bg-[var(--lavender)] border-4 border-black p-6" style={{ boxShadow: '6px 6px 0 0 var(--black)' }}>
          <div className="flex items-center gap-3 mb-4">
            <motion.div 
              className="h-4 w-4 bg-[var(--butter)] border-3 border-black"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              style={{ boxShadow: '2px 2px 0 0 var(--black)' }}
            />
            <motion.div 
              className="h-4 w-4 bg-[var(--coral)] border-3 border-black"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
              style={{ boxShadow: '2px 2px 0 0 var(--black)' }}
            />
            <motion.div 
              className="h-4 w-4 bg-[var(--mint)] border-3 border-black"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
              style={{ boxShadow: '2px 2px 0 0 var(--black)' }}
            />
          </div>
          <h1 className="neo-title text-5xl text-[var(--black)] leading-none" style={{ textShadow: '4px 4px 0 var(--black)' }}>
            MEETING<br/>
            MAKERS<br/>
            <span className="text-[var(--white)]" style={{ textShadow: '3px 3px 0 var(--black)' }}>
              v2.0
            </span>
          </h1>
        </div>
      </motion.div>

      <motion.div 
        className="neo-card p-8 neo-card-hover"
        animate={shake ? { x: [-8, 8, -8, 8, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        <motion.div 
          key={mode}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 pb-4 border-b-4 border-black flex items-center gap-2"
        >
          <span className="neo-title text-sm text-[var(--coral)]" style={{ textShadow: '2px 2px 0 var(--black)' }}>►</span>
          <span className="neo-title text-lg text-[var(--black)]" style={{ textShadow: '2px 2px 0 var(--coral)' }}>
            {mode === "login" ? "AUTHENTICATE" : "REGISTER"}
          </span>
        </motion.div>

        <form onSubmit={onSubmit} className="space-y-5">
          <motion.div variants={inputVariants} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
            <label htmlFor="email" className="neo-label">
              EMAIL ADDRESS
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="neo-input neo-input-sky"
              placeholder="USER@EXAMPLE.COM"
            />
          </motion.div>

          <motion.div variants={inputVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
            <label htmlFor="password" className="neo-label">
              PASSWORD
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={6}
              className="neo-input neo-input-lavender"
              placeholder="••••••••"
            />
          </motion.div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                variants={errorVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-[var(--coral)] border-4 border-black p-4"
                style={{ boxShadow: '6px 6px 0 0 var(--black), 10px 10px 0 0 var(--coral)' }}
              >
                <span className="neo-mono text-xs text-[var(--white)] uppercase" style={{ textShadow: '1px 1px 0 var(--black)' }}>
                  ⚠ {error}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={submitting}
            className="neo-button neo-button-primary w-full py-4 text-lg"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="inline-block h-4 w-4 border-3 border-black border-t-transparent"
                />
                PROCESSING...
              </span>
            ) : (
              mode === "login" ? "► ENTER SYSTEM" : "► CREATE USER"
            )}
          </motion.button>
        </form>

        <motion.div 
          className="mt-8 pt-6 border-t-4 border-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: 'var(--coral)' }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={toggleMode}
            className="neo-button w-full py-3 text-sm"
          >
            {mode === "login" ? "NO ACCOUNT? REGISTER" : "HAS ACCOUNT? LOGIN"}
          </motion.button>
        </motion.div>
      </motion.div>

      <motion.div 
        className="mt-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <p className="neo-mono text-xs text-[var(--black)] bg-[var(--white)] border-3 border-black px-4 py-2 inline-block" style={{ boxShadow: '4px 4px 0 0 var(--black), 6px 6px 0 0 var(--mint)' }}>
          🔒 SECURE // ENCRYPTED // LOGGED
        </p>
      </motion.div>
    </motion.div>
  );
};
