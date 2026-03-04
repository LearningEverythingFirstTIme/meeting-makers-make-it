"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { getClientDb } from "@/lib/firebase/client";
import { useAuth } from "@/components/auth-provider";
import { MeetingForm } from "@/components/meeting-form";
import { formatDateTime, makeCheckinId, startOfWeek, toLocalDayKey } from "@/lib/date";
import type { Checkin, Meeting } from "@/types";
import type { MeetingInput } from "@/lib/validators";

const safeDate = (value: unknown): Date | undefined => {
  if (!value || typeof value !== "object") return undefined;
  if ("toDate" in value && typeof (value as { toDate: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate();
  }
  return undefined;
};

const timeLabel = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
};

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const db = getClientDb();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [pendingCheckinId, setPendingCheckinId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const meetingsQuery = query(
      collection(db, "meetings"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
    );

    const checkinsQuery = query(
      collection(db, "checkins"),
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
            createdAt: safeDate(data.createdAt),
          } satisfies Checkin;
        });

        parsed.sort((a, b) => {
          const aTime = a.createdAt?.getTime() ?? 0;
          const bTime = b.createdAt?.getTime() ?? 0;
          return bTime - aTime;
        });

        setCheckins(parsed);
      },
      (err) => {
        if (err instanceof FirebaseError) {
          setError(`Unable to load check-ins (${err.code}).`);
          return;
        }
        setError("Unable to load check-ins.");
      },
    );

    return () => {
      unsubMeetings();
      unsubCheckins();
    };
  }, [db, user]);

  const meetingById = useMemo(
    () => new Map(meetings.map((meeting) => [meeting.id, meeting])),
    [meetings],
  );

  const todayKey = toLocalDayKey();

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

  if (!user) return null;

  const createMeeting = async (values: MeetingInput) => {
    await addDoc(collection(db, "meetings"), {
      userId: user.uid,
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
      if (!snap.exists() || snap.data().userId !== user.uid) {
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

  const checkIn = async (meeting: Meeting) => {
    const checkinId = makeCheckinId(user.uid, meeting.id, todayKey);
    setPendingCheckinId(meeting.id);
    setError(null);

    try {
      await runTransaction(db, async (transaction) => {
        const meetingRef = doc(db, "meetings", meeting.id);
        const checkinRef = doc(db, "checkins", checkinId);

        const [meetingSnap, checkinSnap] = await Promise.all([
          transaction.get(meetingRef),
          transaction.get(checkinRef),
        ]);

        if (!meetingSnap.exists() || meetingSnap.data().userId !== user.uid) {
          throw new Error("Meeting no longer exists.");
        }

        if (checkinSnap.exists()) {
          throw new Error("already-checked-in");
        }

        transaction.set(checkinRef, {
          userId: user.uid,
          meetingId: meeting.id,
          meetingName: meeting.name,
          dayKey: todayKey,
          createdAt: serverTimestamp(),
        });
      });
    } catch (err) {
      if (err instanceof Error && err.message === "already-checked-in") {
        setError(`Already checked in to ${meeting.name} today.`);
        return;
      }

      if (err instanceof FirebaseError && err.code === "permission-denied") {
        setError("You do not have permission to check in to this meeting.");
        return;
      }

      setError("Could not check in right now. Please try again.");
    } finally {
      setPendingCheckinId(null);
    }
  };

  const alreadyCheckedInToday = (meetingId: string): boolean =>
    checkins.some((entry) => entry.meetingId === meetingId && entry.dayKey === todayKey);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-sky-700 to-indigo-700 p-6 text-white shadow-lg md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-sky-100">Welcome back</p>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Meeting Makers Make It</h1>
            <p className="mt-1 text-sm text-sky-100">Signed in as {user.email}</p>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-lg bg-white/15 px-4 py-2 text-sm font-medium hover:bg-white/25"
          >
            Sign out
          </button>
        </header>

        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">This week check-ins</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{thisWeekCheckins.length}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Meetings tracked</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{meetings.length}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Latest check-in</p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              {checkins[0]?.createdAt ? formatDateTime(checkins[0].createdAt) : "No check-ins yet"}
            </p>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_1.4fr]">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Add meeting</h2>
            <MeetingForm submitLabel="Save meeting" onSubmit={createMeeting} />

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Latest check-ins</h3>
              <ul className="mt-3 space-y-2">
                {checkins.slice(0, 8).map((entry) => (
                  <li key={entry.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    <span className="font-medium text-slate-900">{entry.meetingName}</span>
                    <span className="ml-2 text-slate-500">
                      {entry.createdAt ? formatDateTime(entry.createdAt) : entry.dayKey}
                    </span>
                  </li>
                ))}
                {checkins.length === 0 ? (
                  <li className="text-sm text-slate-500">No check-ins recorded yet.</li>
                ) : null}
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Your meetings</h2>
            {loading ? <p className="text-sm text-slate-500">Loading meetings...</p> : null}
            <div className="space-y-3">
              {meetings.map((meeting) => {
                const isEditing = editingMeetingId === meeting.id;
                const todaysCheckin = alreadyCheckedInToday(meeting.id);
                const history = checkinsByMeeting.get(meeting.id) ?? [];

                return (
                  <article key={meeting.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    {isEditing ? (
                      <MeetingForm
                        submitLabel="Update meeting"
                        initialValues={{
                          name: meeting.name,
                          location: meeting.location,
                          time: meeting.time,
                        }}
                        onSubmit={async (values) => {
                          await updateMeeting(meeting.id, values);
                          setEditingMeetingId(null);
                        }}
                        onCancel={() => setEditingMeetingId(null)}
                      />
                    ) : (
                      <>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900">{meeting.name}</h3>
                            <p className="text-sm text-slate-600">{meeting.location}</p>
                            <p className="text-sm text-slate-600">{timeLabel(meeting.time)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingMeetingId(meeting.id)}
                              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => void removeMeeting(meeting.id)}
                              className="rounded-lg border border-rose-300 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50"
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              disabled={todaysCheckin || pendingCheckinId === meeting.id}
                              onClick={() => void checkIn(meeting)}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
                            >
                              {todaysCheckin
                                ? "Checked in today"
                                : pendingCheckinId === meeting.id
                                  ? "Checking in..."
                                  : "Check in"}
                            </button>
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Meeting history ({history.length})
                          </p>
                          <ul className="mt-2 space-y-1">
                            {history.slice(0, 5).map((entry) => (
                              <li key={entry.id} className="text-sm text-slate-700">
                                {entry.createdAt ? formatDateTime(entry.createdAt) : entry.dayKey}
                              </li>
                            ))}
                            {history.length === 0 ? (
                              <li className="text-sm text-slate-500">No check-ins for this meeting yet.</li>
                            ) : null}
                          </ul>
                        </div>
                      </>
                    )}
                  </article>
                );
              })}

              {!loading && meetings.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                  Add your first meeting to start tracking attendance.
                </div>
              ) : null}
            </div>

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">This week activity</h3>
              <ul className="mt-3 space-y-2">
                {thisWeekCheckins.map((entry) => {
                  const meeting = meetingById.get(entry.meetingId);
                  return (
                    <li key={entry.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                      <span className="font-medium text-slate-900">{meeting?.name ?? entry.meetingName}</span>
                      <span className="text-slate-500">
                        {entry.createdAt ? formatDateTime(entry.createdAt) : entry.dayKey}
                      </span>
                    </li>
                  );
                })}
                {thisWeekCheckins.length === 0 ? (
                  <li className="text-sm text-slate-500">No check-ins this week yet.</li>
                ) : null}
              </ul>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
};
