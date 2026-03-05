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
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, MapPin, Clock, Edit2, Trash2, CheckCircle, Plus, Activity, Calendar } from "lucide-react";
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
    <main className="min-h-screen bg-[var(--background)] px-4 py-8 md:px-8 overflow-hidden">
      <div className="mx-auto max-w-6xl space-y-8">
        <motion.header 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-col gap-6 border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] md:flex-row md:items-center md:justify-between"
        >
          <div>
            <p className="font-mono text-sm font-bold uppercase tracking-widest text-pink-500">Welcome back</p>
            <h1 className="text-3xl font-black uppercase tracking-tighter md:text-5xl">Meeting Makers<br/>Make It</h1>
            <p className="mt-2 font-mono text-xs font-bold uppercase text-gray-500">ID: {user.email}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => void logout()}
            className="self-start md:self-center flex items-center gap-2 border-2 border-black bg-rose-400 px-6 py-3 font-black uppercase tracking-widest text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-rose-300"
          >
            <LogOut size={16} strokeWidth={3} /> Sign out
          </motion.button>
        </motion.header>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-2 border-black bg-rose-100 px-4 py-3 font-bold text-rose-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              ⚠ ERROR: {error}
            </motion.div>
          )}
        </AnimatePresence>

        <section className="grid gap-6 md:grid-cols-3">
          <motion.article 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="border-2 border-black bg-cyan-200 p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest">
              <Calendar size={16} strokeWidth={3} /> Weekly Check-ins
            </div>
            <p className="mt-2 text-6xl font-black">{thisWeekCheckins.length}</p>
          </motion.article>
          <motion.article 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="border-2 border-black bg-yellow-300 p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest">
              <Activity size={16} strokeWidth={3} /> Active Meetings
            </div>
            <p className="mt-2 text-6xl font-black">{meetings.length}</p>
          </motion.article>
          <motion.article 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="border-2 border-black bg-lime-300 p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest">
              <Clock size={16} strokeWidth={3} /> Latest Activity
            </div>
            <p className="mt-2 text-sm font-bold uppercase truncate">
              {checkins[0]?.createdAt ? formatDateTime(checkins[0].createdAt) : "NO CHECK-INS YET"}
            </p>
          </motion.article>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.1fr_1.4fr]">
          <div className="space-y-6">
            <h2 className="flex items-center gap-3 border-b-4 border-black pb-2 text-2xl font-black uppercase tracking-tight">
              <Plus size={24} strokeWidth={4} /> Add Meeting
            </h2>
            <MeetingForm submitLabel="Create Meeting" onSubmit={createMeeting} />

            <div className="border-2 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="mb-4 font-mono text-sm font-black uppercase tracking-widest text-pink-600">// RECENT LOGS</h3>
              <ul className="space-y-3">
                {checkins.slice(0, 8).map((entry, i) => (
                  <motion.li 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    key={entry.id} 
                    className="flex items-center justify-between border-2 border-black bg-gray-50 px-3 py-3 text-sm font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <span className="uppercase text-black truncate max-w-[150px]">{entry.meetingName}</span>
                    <span className="font-mono text-xs text-gray-500 whitespace-nowrap">
                      {entry.createdAt ? formatDateTime(entry.createdAt) : entry.dayKey}
                    </span>
                  </motion.li>
                ))}
                {checkins.length === 0 ? (
                  <li className="font-mono text-sm font-bold text-gray-400">WAITING FOR DATA...</li>
                ) : null}
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="border-b-4 border-black pb-2 text-2xl font-black uppercase tracking-tight">Your Meetings</h2>
            {loading ? <p className="font-mono text-sm font-bold animate-pulse">LOADING DATA...</p> : null}
            <div className="space-y-6">
              <AnimatePresence>
              {meetings.map((meeting) => {
                const isEditing = editingMeetingId === meeting.id;
                const todaysCheckin = alreadyCheckedInToday(meeting.id);
                const history = checkinsByMeeting.get(meeting.id) ?? [];

                return (
                  <motion.article 
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={meeting.id} 
                    className={`border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-colors ${todaysCheckin ? 'bg-emerald-50' : ''}`}
                  >
                    {isEditing ? (
                      <MeetingForm
                        submitLabel="Update Meeting"
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
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div>
                            <h3 className="text-2xl font-black uppercase text-black">{meeting.name}</h3>
                            <div className="mt-2 flex flex-col gap-1 font-mono text-sm font-bold text-gray-600">
                              <span className="flex items-center gap-2">
                                <MapPin size={14} strokeWidth={3} />
                                {meeting.location.toUpperCase()}
                              </span>
                              <span className="flex items-center gap-2">
                                <Clock size={14} strokeWidth={3} />
                                {timeLabel(meeting.time)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3">
                            <motion.button
                              whileHover={{ scale: 1.05, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                              type="button"
                              onClick={() => setEditingMeetingId(meeting.id)}
                              className="flex items-center gap-1 border-2 border-black bg-yellow-300 px-3 py-2 text-xs font-black uppercase tracking-wider text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-200"
                            >
                              <Edit2 size={12} strokeWidth={3} /> Edit
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                              type="button"
                              onClick={() => void removeMeeting(meeting.id)}
                              className="flex items-center gap-1 border-2 border-black bg-rose-400 px-3 py-2 text-xs font-black uppercase tracking-wider text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-rose-300"
                            >
                              <Trash2 size={12} strokeWidth={3} /> Delete
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                              type="button"
                              disabled={todaysCheckin || pendingCheckinId === meeting.id}
                              onClick={() => void checkIn(meeting)}
                              className={`
                                flex items-center gap-2 border-2 border-black px-4 py-2 text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]
                                ${todaysCheckin 
                                  ? "bg-emerald-500 text-white cursor-default" 
                                  : "bg-blue-500 text-white hover:bg-blue-400"}
                                disabled:opacity-70
                              `}
                            >
                              {todaysCheckin ? (
                                <>
                                  <CheckCircle size={14} strokeWidth={3} /> Checked In
                                </>
                              ) : pendingCheckinId === meeting.id ? (
                                "Checking..."
                              ) : (
                                "Check In"
                              )}
                            </motion.button>
                          </div>
                        </div>

                        <div className="mt-6 border-t-2 border-dashed border-black pt-4">
                          <p className="font-mono text-xs font-black uppercase tracking-widest text-gray-500">
                            // History ({history.length})
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {history.slice(0, 5).map((entry) => (
                              <span key={entry.id} className="inline-block border border-black bg-white px-2 py-1 font-mono text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                {entry.createdAt ? formatDateTime(entry.createdAt).split(' ')[0] : entry.dayKey}
                              </span>
                            ))}
                            {history.length === 0 ? (
                              <span className="font-mono text-xs font-bold text-gray-400">NO RECORDS</span>
                            ) : null}
                          </div>
                        </div>
                      </>
                    )}
                  </motion.article>
                );
              })}
              </AnimatePresence>

              {!loading && meetings.length === 0 ? (
                <div className="border-2 border-dashed border-black bg-gray-50 p-12 text-center">
                  <p className="text-xl font-black uppercase text-gray-400">No Meetings Configured</p>
                  <p className="mt-2 font-mono text-sm text-gray-400">Add a meeting above to start tracking.</p>
                </div>
              ) : null}
            </div>

            <section className="border-2 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="mb-4 font-mono text-sm font-black uppercase tracking-widest text-indigo-600">// WEEKLY ACTIVITY LOG</h3>
              <ul className="space-y-3">
                {thisWeekCheckins.map((entry, i) => {
                  const meeting = meetingById.get(entry.meetingId);
                  return (
                    <motion.li 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      key={entry.id} 
                      className="flex items-center justify-between border-2 border-black bg-indigo-50 px-4 py-3 font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <span className="uppercase">{meeting?.name ?? entry.meetingName}</span>
                      <span className="font-mono text-xs text-gray-500">
                        {entry.createdAt ? formatDateTime(entry.createdAt) : entry.dayKey}
                      </span>
                    </motion.li>
                  );
                })}
                {thisWeekCheckins.length === 0 ? (
                  <li className="font-mono text-sm font-bold text-gray-400">NO ACTIVITY THIS WEEK.</li>
                ) : null}
              </ul>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
};
