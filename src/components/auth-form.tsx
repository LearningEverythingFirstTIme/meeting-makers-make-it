"use client";

import { useState } from "react";
import { FirebaseError } from "firebase/app";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/auth-provider";

type Mode = "login" | "register";

const friendlyAuthError = (error: unknown): string => {
  if (!(error instanceof FirebaseError)) {
    return "Something went wrong. Please try again.";
  }

  switch (error.code) {
    case "auth/invalid-email":
      return "Please provide a valid email address.";
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Email or password is incorrect.";
    case "auth/email-already-in-use":
      return "That email is already in use. Try signing in instead.";
    case "auth/weak-password":
      return "Use a stronger password (at least 6 characters).";
    default:
      return "Authentication failed. Please try again.";
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
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="mx-auto w-full max-w-md border-4 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
    >
      <div className="mb-8 border-b-4 border-black pb-4">
        <h1 className="text-4xl font-black uppercase tracking-tighter text-black leading-none">
          Meeting<br />Makers<br /><span className="text-pink-500">Make It</span>
        </h1>
      </div>
      
      <p className="mb-6 font-mono text-sm font-bold uppercase tracking-wider text-gray-500">
        // {mode === "login" ? "AUTHENTICATE" : "INITIALIZE_USER"}
      </p>

      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="mb-2 block text-xs font-black uppercase tracking-widest text-black">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            className="w-full border-2 border-black bg-yellow-50 px-4 py-3 font-bold text-black placeholder:text-gray-400 focus:bg-yellow-100 focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
            placeholder="USER@EXAMPLE.COM"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-xs font-black uppercase tracking-widest text-black">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={6}
            className="w-full border-2 border-black bg-cyan-50 px-4 py-3 font-bold text-black placeholder:text-gray-400 focus:bg-cyan-100 focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
            placeholder="••••••••"
          />
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-2 border-black bg-rose-500 p-3 text-sm font-bold text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              ⚠ {error.toUpperCase()}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.02, x: 2, y: 2, boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)" }}
          whileTap={{ scale: 0.98, x: 6, y: 6, boxShadow: "0px 0px 0px 0px rgba(0,0,0,1)" }}
          type="submit"
          disabled={submitting}
          className="w-full border-2 border-black bg-lime-400 px-4 py-4 text-base font-black uppercase tracking-widest text-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "PROCESSING..." : mode === "login" ? "ENTER SYSTEM" : "CREATE USER"}
        </motion.button>
      </form>

      <div className="mt-8 text-center">
        <button
          type="button"
          onClick={() => {
            setMode((prev) => (prev === "login" ? "register" : "login"));
            setError(null);
          }}
          className="group relative inline-block font-bold uppercase tracking-wider text-black"
        >
          <span className="relative z-10 border-b-2 border-black pb-0.5 group-hover:text-pink-600 transition-colors">
            {mode === "login" ? "Need an account? Register" : "Have an account? Sign in"}
          </span>
          <span className="absolute bottom-0 left-0 -z-0 h-2 w-full bg-pink-300 transition-all group-hover:h-full"></span>
        </button>
      </div>
    </motion.div>
  );
};
