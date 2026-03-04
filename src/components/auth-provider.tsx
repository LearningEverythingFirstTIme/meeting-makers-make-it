"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type User,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { getClientAuth } from "@/lib/firebase/client";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  configError: string | null;
  register: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const init = useMemo<{ auth: Auth | null; error: string | null }>(() => {
    try {
      return { auth: getClientAuth(), error: null };
    } catch (error) {
      if (error instanceof FirebaseError) {
        return { auth: null, error: error.message };
      }
      return { auth: null, error: "Firebase is not configured." };
    }
  }, []);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(() => Boolean(init.auth));

  useEffect(() => {
    if (!init.auth) return;

    const unsubscribe = onAuthStateChanged(init.auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });

    return unsubscribe;
  }, [init.auth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      configError: init.error,
      register: async (email, password) => {
        if (!init.auth) throw new Error("Firebase is not configured.");
        await createUserWithEmailAndPassword(init.auth, email, password);
      },
      login: async (email, password) => {
        if (!init.auth) throw new Error("Firebase is not configured.");
        await signInWithEmailAndPassword(init.auth, email, password);
      },
      logout: async () => {
        if (!init.auth) return;
        await signOut(init.auth);
      },
    }),
    [init.auth, init.error, user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};
