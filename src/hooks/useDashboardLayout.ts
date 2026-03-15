"use client";

import { useEffect, useState, useMemo } from "react";
import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { getClientDb } from "@/lib/firebase/client";
import { useAuth } from "@/components/auth-provider";
import { dashboardLayoutSchema, normalizeDashboardLayout } from "@/lib/validators";
import type { DashboardSectionId, UserProfile } from "@/types";

const safeDate = (value: unknown): Date | undefined => {
  if (!value || typeof value !== "object") return undefined;
  if ("toDate" in value && typeof (value as { toDate: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate();
  }
  return undefined;
};

export type UseDashboardLayoutResult = {
  userProfile: UserProfile | null;
  savedLayout: DashboardSectionId[];
  draftLayout: DashboardSectionId[];
  activeLayout: DashboardSectionId[];
  isEditingLayout: boolean;
  isSavingLayout: boolean;
  error: string | null;
  beginLayoutEditing: () => void;
  cancelLayoutEditing: () => void;
  handleLayoutDragEnd: (event: { active: { id: string }; over: { id: string } | null }) => void;
  saveLayout: () => Promise<void>;
  setError: (error: string | null) => void;
};

export const useDashboardLayout = (): UseDashboardLayoutResult => {
  const { user } = useAuth();
  const db = getClientDb();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const [isSavingLayout, setIsSavingLayout] = useState(false);
  const [savedLayout, setSavedLayout] = useState<DashboardSectionId[]>([]);
  const [draftLayout, setDraftLayout] = useState<DashboardSectionId[]>([]);
  const [error, setError] = useState<string | null>(null);

  const profileRef = useMemo(
    () => (user ? doc(db, "userProfiles", user.uid) : null),
    [db, user],
  );

  useEffect(() => {
    if (!user || !profileRef) return;

    // Subscribe to user profile
    const unsubProfile = onSnapshot(
      profileRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setUserProfile({
            userId: snapshot.id,
            sobrietyDate: data.sobrietyDate,
            dashboardLayout: normalizeDashboardLayout(data.dashboardLayout),
            updatedAt: safeDate(data.updatedAt),
          });
        } else {
          setUserProfile(null);
        }
      },
      () => {
        // Profile might not exist yet, that's okay
        setUserProfile(null);
      }
    );

    return () => {
      unsubProfile();
    };
  }, [profileRef, user]);

  useEffect(() => {
    if (isEditingLayout) return;

    const nextLayout = normalizeDashboardLayout(userProfile?.dashboardLayout);
    setSavedLayout(nextLayout);
    setDraftLayout(nextLayout);
  }, [isEditingLayout, userProfile]);

  const activeLayout = isEditingLayout ? draftLayout : savedLayout;

  const beginLayoutEditing = () => {
    setError(null);
    setDraftLayout(savedLayout);
    setIsEditingLayout(true);
  };

  const cancelLayoutEditing = () => {
    setDraftLayout(savedLayout);
    setIsEditingLayout(false);
  };

  const handleLayoutDragEnd = ({ active, over }: { active: { id: string }; over: { id: string } | null }) => {
    if (!isEditingLayout || !over || active.id === over.id) return;

    setDraftLayout((currentLayout) => {
      const oldIndex = currentLayout.indexOf(active.id as DashboardSectionId);
      const newIndex = currentLayout.indexOf(over.id as DashboardSectionId);

      if (oldIndex === -1 || newIndex === -1) {
        return currentLayout;
      }

      // arrayMove replacement
      const result = [...currentLayout];
      const [removed] = result.splice(oldIndex, 1);
      result.splice(newIndex, 0, removed);
      return result;
    });
  };

  const saveLayout = async () => {
    if (!profileRef || !user) return;

    setError(null);
    setIsSavingLayout(true);

    const parsed = dashboardLayoutSchema.safeParse(draftLayout);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Layout is invalid.");
      setIsSavingLayout(false);
      return;
    }

    try {
      await setDoc(profileRef, {
        userId: user.uid,
        dashboardLayout: parsed.data,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setSavedLayout(parsed.data);
      setDraftLayout(parsed.data);
      setIsEditingLayout(false);
    } catch (err) {
      if (err instanceof FirebaseError && err.code === "permission-denied") {
        setError("Permission denied. Unable to save your layout.");
      } else {
        setError("Failed to save layout. Please try again.");
      }
    } finally {
      setIsSavingLayout(false);
    }
  };

  return {
    userProfile,
    savedLayout,
    draftLayout,
    activeLayout,
    isEditingLayout,
    isSavingLayout,
    error,
    beginLayoutEditing,
    cancelLayoutEditing,
    handleLayoutDragEnd,
    saveLayout,
    setError,
  };
};

// Export for use in other components (e.g., SobrietySetup)
export const useUserProfile = () => {
  const { user } = useAuth();
  const db = getClientDb();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const profileRef = useMemo(
    () => (user ? doc(db, "userProfiles", user.uid) : null),
    [db, user],
  );

  useEffect(() => {
    if (!user || !profileRef) return;

    const unsubProfile = onSnapshot(
      profileRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setUserProfile({
            userId: snapshot.id,
            sobrietyDate: data.sobrietyDate,
            dashboardLayout: normalizeDashboardLayout(data.dashboardLayout),
            updatedAt: safeDate(data.updatedAt),
          });
        } else {
          setUserProfile(null);
        }
      },
      () => {
        setUserProfile(null);
      }
    );

    return () => {
      unsubProfile();
    };
  }, [profileRef, user]);

  return { userProfile, profileRef };
};
