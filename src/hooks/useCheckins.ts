"use client";

import { useEffect, useState, useMemo } from "react";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  deleteDoc,
  where,
} from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { getClientDb } from "@/lib/firebase/client";
import { useAuth } from "@/components/auth-provider";
import { addDays, makeCheckinId, startOfWeek, toLocalDayKey } from "@/lib/date";
import { checkinUpdateSchema, type CheckinUpdateInput } from "@/lib/validators";
import type { Checkin, Meeting } from "@/types";

const safeDate = (value: unknown): Date | undefined => {
  if (!value || typeof value !== "object") return undefined;
  if ("toDate" in value && typeof (value as { toDate: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate();
  }
  return undefined;
};

export type UseCheckinsResult = {
  checkins: Checkin[];
  thisWeekCheckins: Checkin[];
  checkinsByMeeting: Map<string, Checkin[]>;
  loading: boolean;
  error: string | null;
  pendingCheckinId: string | null;
  checkinSuccessId: string | null;
  editingCheckinId: string | null;
  editingCheckinNote: string;
  editingCheckinDate: string;
  checkIn: (meeting: Meeting) => Promise<void>;
  alreadyCheckedInToday: (meetingId: string) => boolean;
  startEditingCheckin: (checkin: Checkin) => void;
  cancelEditingCheckin: () => void;
  saveCheckinEdit: (checkinId: string) => Promise<void>;
  deleteCheckin: (checkinId: string, meetingName: string) => Promise<void>;
  setEditingCheckinNote: (note: string) => void;
  setEditingCheckinDate: (date: string) => void;
  setError: (error: string | null) => void;
};

export const useCheckins = (): UseCheckinsResult => {
  const { user } = useAuth();
  const db = getClientDb();
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingCheckinId, setPendingCheckinId] = useState<string | null>(null);
  const [checkinSuccessId, setCheckinSuccessId] = useState<string | null>(null);
  
  // Check-in editing state
  const [editingCheckinId, setEditingCheckinId] = useState<string | null>(null);
  const [editingCheckinNote, setEditingCheckinNote] = useState("");
  const [editingCheckinDate, setEditingCheckinDate] = useState("");

  const todayKey = toLocalDayKey();

  useEffect(() => {
    if (!user) return;

    const checkinsQuery = query(
      collection(db, "checkins"),
      where("userId", "==", user.uid),
    );

    const unsubCheckins = onSnapshot(
      checkinsQuery,
      (snapshot) => {
        const parsed = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            userId: data.userId,
            meetingId: data.meetingId,
            meetingName: data.meetingName,
            dayKey: data.dayKey,
            note: data.note,
            createdAt: safeDate(data.createdAt),
          } satisfies Checkin;
        });

        parsed.sort((a, b) => {
          const aTime = a.createdAt?.getTime() ?? 0;
          const bTime = b.createdAt?.getTime() ?? 0;
          return bTime - aTime;
        });

        setCheckins(parsed);
        setLoading(false);
      },
      (err) => {
        if (err instanceof FirebaseError) {
          setError(`Unable to load check-ins (${err.code}).`);
        } else {
          setError("Unable to load check-ins.");
        }
        setLoading(false);
      },
    );

    return () => {
      unsubCheckins();
    };
  }, [db, user]);

  const thisWeekCheckins = useMemo(() => {
    const weekStart = startOfWeek();
    return checkins.filter((entry) => entry.createdAt && entry.createdAt >= weekStart);
  }, [checkins]);

  const checkinsByMeeting = useMemo(() => {
    const map = new Map<string, Checkin[]>();
    for (const checkin of checkins) {
      const list = map.get(checkin.meetingId) ?? [];
      list.push(checkin);
      map.set(checkin.meetingId, list);
    }
    return map;
  }, [checkins]);

  const alreadyCheckedInToday = (meetingId: string): boolean =>
    checkins.some((entry) => entry.meetingId === meetingId && entry.dayKey === todayKey);

  const checkIn = async (meeting: Meeting) => {
    const checkinId = makeCheckinId(user!.uid, meeting.id, todayKey);
    const meetingRef = doc(db, "meetings", meeting.id);
    const checkinRef = doc(db, "checkins", checkinId);
    setPendingCheckinId(meeting.id);
    setError(null);

    try {
      await user!.getIdToken();

      const existingCheckin = checkins.find(
        (entry) => entry.meetingId === meeting.id && entry.dayKey === todayKey,
      );

      if (existingCheckin) {
        throw new Error("already-checked-in");
      }

      const meetingSnap = await getDoc(meetingRef);

      if (!meetingSnap.exists() || meetingSnap.data().userId !== user!.uid) {
        throw new Error("Meeting no longer exists.");
      }

      await setDoc(checkinRef, {
        userId: user!.uid,
        meetingId: meeting.id,
        meetingName: meeting.name,
        dayKey: todayKey,
        createdAt: serverTimestamp(),
      });

      setCheckinSuccessId(meeting.id);
      setTimeout(() => setCheckinSuccessId(null), 600);
    } catch (err) {
      if (err instanceof Error && err.message === "already-checked-in") {
        setError(`Already checked in to ${meeting.name} today.`);
        return;
      }

      if (err instanceof FirebaseError && err.code === "permission-denied") {
        try {
          const existingCheckinSnap = await getDoc(checkinRef);
          const existingCheckinData = existingCheckinSnap.data();
          if (
            existingCheckinSnap.exists()
            && existingCheckinData?.userId === user!.uid
            && existingCheckinData?.meetingId === meeting.id
            && existingCheckinData?.dayKey === todayKey
          ) {
            setError(`Already checked in to ${meeting.name} today.`);
            return;
          }
        } catch {
          // Ignore follow-up read failures and fall through to the original error.
        }

        setError("Permission denied for this operation.");
        return;
      }

      setError("Check-in failed. Please retry.");
    } finally {
      setPendingCheckinId(null);
    }
  };

  const startEditingCheckin = (checkin: Checkin) => {
    setEditingCheckinId(checkin.id);
    setEditingCheckinNote(checkin.note || "");
    setEditingCheckinDate(checkin.dayKey);
  };

  const cancelEditingCheckin = () => {
    setEditingCheckinId(null);
    setEditingCheckinNote("");
    setEditingCheckinDate("");
  };

  const saveCheckinEdit = async (checkinId: string) => {
    setError(null);
    
    const parsed = checkinUpdateSchema.safeParse({
      dayKey: editingCheckinDate,
      note: editingCheckinNote,
    } as CheckinUpdateInput);

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    try {
      const checkinRef = doc(db, "checkins", checkinId);
      await setDoc(checkinRef, {
        dayKey: parsed.data.dayKey,
        note: parsed.data.note || null,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      cancelEditingCheckin();
    } catch (err) {
      if (err instanceof FirebaseError && err.code === "permission-denied") {
        setError("Permission denied. You can only edit your own check-ins.");
        return;
      }
      setError("Failed to update check-in.");
    }
  };

  const deleteCheckin = async (checkinId: string, meetingName: string) => {
    const confirmed = window.confirm(`Delete check-in for "${meetingName}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "checkins", checkinId));
    } catch (err) {
      if (err instanceof FirebaseError && err.code === "permission-denied") {
        setError("Permission denied. You can only delete your own check-ins.");
        return;
      }
      setError("Failed to delete check-in.");
    }
  };

  return {
    checkins,
    thisWeekCheckins,
    checkinsByMeeting,
    loading,
    error,
    pendingCheckinId,
    checkinSuccessId,
    editingCheckinId,
    editingCheckinNote,
    editingCheckinDate,
    checkIn,
    alreadyCheckedInToday,
    startEditingCheckin,
    cancelEditingCheckin,
    saveCheckinEdit,
    deleteCheckin,
    setEditingCheckinNote,
    setEditingCheckinDate,
    setError,
  };
};
