"use client";

import { useEffect, useState, useMemo } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/client";
import { useAuth } from "@/components/auth-provider";
import type { Meeting } from "@/types";
import type { MeetingInput } from "@/lib/validators";

const safeDate = (value: unknown): Date | undefined => {
  if (!value || typeof value !== "object") return undefined;
  if ("toDate" in value && typeof (value as { toDate: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate();
  }
  return undefined;
};

export type UseMeetingsResult = {
  meetings: Meeting[];
  loading: boolean;
  error: string | null;
  createMeeting: (values: MeetingInput) => Promise<void>;
  updateMeeting: (meetingId: string, values: MeetingInput) => Promise<void>;
  removeMeeting: (meetingId: string) => Promise<void>;
};

export const useMeetings = (): UseMeetingsResult => {
  const { user } = useAuth();
  const db = getClientDb();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const meetingsQuery = query(
      collection(db, "meetings"),
      where("userId", "==", user.uid),
    );

    const unsubMeetings = onSnapshot(
      meetingsQuery,
      (snapshot) => {
        setMeetings(
          snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              userId: data.userId,
              name: data.name,
              location: data.location,
              time: data.time,
              createdAt: safeDate(data.createdAt),
              updatedAt: safeDate(data.updatedAt),
            } satisfies Meeting;
          }),
        );
        setLoading(false);
      },
      () => {
        setError("Unable to load meetings.");
        setLoading(false);
      },
    );

    return () => {
      unsubMeetings();
    };
  }, [db, user]);

  const createMeeting = async (values: MeetingInput) => {
    await addDoc(collection(db, "meetings"), {
      userId: user!.uid,
      name: values.name,
      location: values.location,
      time: values.time,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const updateMeeting = async (meetingId: string, values: MeetingInput) => {
    const meetingRef = doc(db, "meetings", meetingId);
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(meetingRef);
      if (!snap.exists() || snap.data().userId !== user!.uid) {
        throw new Error("Meeting not found.");
      }
      transaction.update(meetingRef, {
        ...values,
        updatedAt: serverTimestamp(),
      });
    });
  };

  const removeMeeting = async (meetingId: string) => {
    const confirmed = window.confirm("Delete this meeting? Existing check-ins will remain in history.");
    if (!confirmed) return;
    await deleteDoc(doc(db, "meetings", meetingId));
  };

  const meetingById = useMemo(
    () => new Map(meetings.map((meeting) => [meeting.id, meeting])),
    [meetings],
  );

  return {
    meetings,
    loading,
    error,
    createMeeting,
    updateMeeting,
    removeMeeting,
  };
};

export const useMeetingById = (meetings: Meeting[]) => {
  return useMemo(
    () => new Map(meetings.map((meeting) => [meeting.id, meeting])),
    [meetings],
  );
};
