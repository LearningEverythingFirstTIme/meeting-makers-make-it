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

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
} as const;

const statCardVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  show: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.5, type: "spring" as const, stiffness: 200 }
  },
};

const meetingCardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { duration: 0.4, type: "spring" as const, stiffness: 150 }
  },
  exit: { 
    opacity: 0, 
    scale: 0.9,
    transition: { duration: 0.2 }
  },
};

const logItemVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3 }
  },
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
  const [checkinSuccessId, setCheckinSuccessId] = useState<string | null>(null);

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
      setCheckinSuccessId(meeting.id);
      setTimeout(() => setCheckinSuccessId(null), 600);
    } catch (err) {
      if (err instanceof Error && err.message === "already-checked-in") {
        setError(`Already checked in to ${meeting.name} today.`);
        return;
      }

      if (err instanceof FirebaseError && err.code === "permission-denied") {
        setError("Permission denied for this operation.");
        return;
      }

      setError("Check-in failed. Please retry.");
    } finally {
      setPendingCheckinId(null);
    }
  };

  const alreadyCheckedInToday = (meetingId: string): boolean =>
    checkins.some((entry) => entry.meetingId === meetingId && entry.dayKey === todayKey);

  return (
    <main className="min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <motion.header 
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 150 }}
          className="bg-white border-4 border-black"
          style={{ boxShadow: '8px 8px 0px 0px black' }}
        >
          <div className="neo-stripe p-1">
            <div className="bg-white border-2 border-black p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <motion.div 
                    className="h-3 w-3 bg-[var(--mint)] border-2 border-black"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <p className="neo-title text-sm text-black">● ONLINE</p>
                </div>
                <h1 className="neo-title text-4xl md:text-5xl text-black">MEETING<br/>MAKERS</h1>
                <p className="neo-mono text-xs mt-2 text-black">{user.email}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05, rotate: -2 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => void logout()}
                className="neo-button neo-button-danger self-start md:self-center flex items-center gap-2"
              >
                <LogOut size={16} strokeWidth={3} /> LOGOUT
              </motion.button>
            </div>
          </div>
        </motion.header>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-[var(--coral)] border-4 border-black p-4"
              style={{ boxShadow: '6px 6px 0px 0px black' }}
            >
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 bg-black" />
                <span className="neo-title text-sm text-black">ERROR: {error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.section 
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid gap-4 md:grid-cols-3"
        >
          <motion.article 
            variants={statCardVariants}
            className="bg-[var(--mint)] border-4 border-black p-5"
            style={{ boxShadow: '6px 6px 0px 0px black' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={18} strokeWidth={3} />
              <span className="neo-title text-xs">WEEKLY</span>
            </div>
            <motion.p 
              className="neo-title text-5xl text-black"
              key={thisWeekCheckins.length}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {thisWeekCheckins.length}
            </motion.p>
            <p className="neo-mono text-xs text-black mt-1">CHECK-INS</p>
          </motion.article>

          <motion.article 
            variants={statCardVariants}
            className="bg-[var(--butter)] border-4 border-black p-5"
            style={{ boxShadow: '6px 6px 0px 0px black' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Activity size={18} strokeWidth={3} />
              <span className="neo-title text-xs">ACTIVE</span>
            </div>
            <p className="neo-title text-5xl text-black">{meetings.length}</p>
            <p className="neo-mono text-xs text-black mt-1">MEETINGS</p>
          </motion.article>

          <motion.article 
            variants={statCardVariants}
            className="bg-[var(--lavender)] border-4 border-black p-5"
            style={{ boxShadow: '6px 6px 0px 0px black' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Clock size={18} strokeWidth={3} />
              <span className="neo-title text-xs">LATEST</span>
            </div>
            <motion.p 
              className="neo-mono text-sm text-black truncate"
              key={checkins[0]?.id || 'none'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {checkins[0]?.createdAt ? formatDateTime(checkins[0].createdAt) : "NO DATA"}
            </motion.p>
          </motion.article>
        </motion.section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
          <div className="space-y-6">
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-[var(--coral)] border-4 border-black p-1"
              style={{ boxShadow: '6px 6px 0px 0px black' }}
            >
              <div className="bg-white border-2 border-black p-4">
                <h2 className="neo-title text-xl text-black flex items-center gap-2">
                  <Plus size={24} strokeWidth={3} /> ADD MEETING
                </h2>
              </div>
            </motion.div>
            
            <MeetingForm submitLabel="Create" onSubmit={createMeeting} />

            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="neo-card p-6"
            >
              <div className="flex items-center gap-2 mb-4 pb-3 border-b-4 border-black">
                <span className="neo-title text-sm text-[var(--mint)]">►</span>
                <span className="neo-title text-sm">RECENT</span>
              </div>
              <ul className="space-y-2">
                {checkins.slice(0, 8).map((entry) => (
                  <motion.li 
                    variants={logItemVariants}
                    key={entry.id} 
                    className="bg-[var(--cream)] border-2 border-black px-3 py-2 flex items-center justify-between"
                  >
                    <span className="neo-mono text-xs uppercase truncate max-w-[150px]">{entry.meetingName}</span>
                    <span className="neo-mono text-[10px]">
                      {entry.createdAt ? formatDateTime(entry.createdAt) : entry.dayKey}
                    </span>
                  </motion.li>
                ))}
                {checkins.length === 0 ? (
                  <li className="neo-mono text-xs text-gray-500">NO RECORDS</li>
                ) : null}
              </ul>
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="bg-[var(--sky)] border-4 border-black p-1"
              style={{ boxShadow: '6px 6px 0px 0px black' }}
            >
              <div className="bg-white border-2 border-black p-4">
                <h2 className="neo-title text-xl text-black">YOUR MEETINGS</h2>
              </div>
            </motion.div>
            
            {loading ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="neo-card p-8 text-center"
              >
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="mx-auto mb-4 h-12 w-12 border-4 border-black bg-[var(--butter)]"
                  style={{ boxShadow: '4px 4px 0px 0px black' }}
                />
                <p className="neo-title animate-blink">LOADING...</p>
              </motion.div>
            ) : null}
            
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              <AnimatePresence mode="popLayout">
              {meetings.map((meeting) => {
                const isEditing = editingMeetingId === meeting.id;
                const todaysCheckin = alreadyCheckedInToday(meeting.id);
                const history = checkinsByMeeting.get(meeting.id) ?? [];
                const showSuccess = checkinSuccessId === meeting.id;

                return (
                  <motion.article 
                    layout
                    variants={meetingCardVariants}
                    key={meeting.id} 
                    className={`neo-card p-5 ${todaysCheckin ? 'border-[var(--mint)]' : ''}`}
                    style={todaysCheckin ? { boxShadow: '10px 10px 0px 0px var(--mint)' } : {}}
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isEditing ? (
                      <MeetingForm
                        submitLabel="Update"
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
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <motion.div 
                                className={`h-3 w-3 border-2 border-black ${todaysCheckin ? 'bg-[var(--mint)]' : 'bg-gray-400'}`}
                                animate={showSuccess ? { scale: [1, 1.5, 1] } : {}}
                                transition={{ duration: 0.4 }}
                              />
                              <h3 className="neo-title text-xl">{meeting.name}</h3>
                            </div>
                            <div className="neo-mono text-xs space-y-1">
                              <div className="flex items-center gap-2">
                                <MapPin size={12} strokeWidth={3} />
                                <span className="uppercase">{meeting.location}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock size={12} strokeWidth={3} />
                                <span className="uppercase">{timeLabel(meeting.time)}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            <motion.button
                              whileHover={{ scale: 1.05, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                              type="button"
                              onClick={() => setEditingMeetingId(meeting.id)}
                              className="neo-button neo-button-primary text-xs py-2"
                            >
                              <Edit2 size={12} strokeWidth={3} /> EDIT
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05, y: -2, x: [0, -2, 2, -1, 1, 0] }}
                              whileTap={{ scale: 0.95 }}
                              type="button"
                              onClick={() => void removeMeeting(meeting.id)}
                              className="neo-button neo-button-danger text-xs py-2"
                            >
                              <Trash2 size={12} strokeWidth={3} /> DEL
                            </motion.button>
                            <motion.button
                              whileHover={!todaysCheckin ? { scale: 1.05, y: -2 } : {}}
                              whileTap={!todaysCheckin ? { scale: 0.95 } : {}}
                              type="button"
                              disabled={todaysCheckin || pendingCheckinId === meeting.id}
                              onClick={() => void checkIn(meeting)}
                              className={`neo-button text-xs py-2 ${
                                todaysCheckin 
                                  ? "neo-button-success animate-stamp" 
                                  : "bg-[var(--sky)] border-3 border-black text-black hover:bg-[#7DD3FC]"
                              }`}
                              style={!todaysCheckin ? { boxShadow: '4px 4px 0px 0px black' } : {}}
                            >
                              {todaysCheckin ? (
                                <>
                                  <CheckCircle size={12} strokeWidth={3} /> ✓ DONE
                                </>
                              ) : pendingCheckinId === meeting.id ? (
                                "..."
                              ) : (
                                "CHECK IN"
                              )}
                            </motion.button>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t-2 border-dashed border-black">
                          <p className="neo-mono text-[10px] mb-2">HISTORY ({history.length})</p>
                          <div className="flex flex-wrap gap-1">
                            {history.slice(0, 6).map((entry) => (
                              <span 
                                key={entry.id} 
                                className="bg-[var(--cream)] border border-black px-2 py-1 neo-mono text-[10px]"
                              >
                                {entry.createdAt ? formatDateTime(entry.createdAt).split(' ')[0] : entry.dayKey}
                              </span>
                            ))}
                            {history.length === 0 ? (
                              <span className="neo-mono text-[10px] text-gray-400">NO DATA</span>
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
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="neo-card p-12 text-center border-dashed"
                >
                  <motion.div 
                    className="h-6 w-6 bg-[var(--coral)] border-2 border-black mx-auto mb-4"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  />
                  <p className="neo-title text-lg">NO MEETINGS</p>
                  <p className="neo-mono text-xs mt-2">Add a meeting above to start tracking.</p>
                </motion.div>
              ) : null}
            </motion.div>

            <motion.section 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="neo-card p-6"
            >
              <div className="flex items-center gap-2 mb-4 pb-3 border-b-4 border-black">
                <span className="neo-title text-sm text-[var(--lavender)]">►</span>
                <span className="neo-title text-sm">WEEKLY LOG</span>
              </div>
              <ul className="space-y-2">
                {thisWeekCheckins.map((entry, i) => {
                  const meeting = meetingById.get(entry.meetingId);
                  return (
                    <motion.li 
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 + 0.5 }}
                      key={entry.id} 
                      className="bg-[var(--lavender)] border-2 border-black px-4 py-2 flex items-center justify-between"
                    >
                      <span className="neo-mono text-xs uppercase">{meeting?.name ?? entry.meetingName}</span>
                      <span className="neo-mono text-[10px]">
                        {entry.createdAt ? formatDateTime(entry.createdAt) : entry.dayKey}
                      </span>
                    </motion.li>
                  );
                })}
                {thisWeekCheckins.length === 0 ? (
                  <li className="neo-mono text-xs text-center py-4">NO ACTIVITY</li>
                ) : null}
              </ul>
            </motion.section>
          </div>
        </section>
      </div>
    </main>
  );
};
