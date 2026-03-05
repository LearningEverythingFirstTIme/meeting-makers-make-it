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
      staggerChildren: 0.06,
      delayChildren: 0.12,
    },
  },
} as const;

const statCardVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  show: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] as const }
  },
};

const meetingCardVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const }
  },
  exit: { 
    opacity: 0, 
    scale: 0.98,
    transition: { duration: 0.18 }
  },
} as const;

const logItemVariants = {
  hidden: { opacity: 0, x: -6 },
  show: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.2, ease: "easeOut" as const }
  },
};

const historyItemVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.18 }
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
      setTimeout(() => setCheckinSuccessId(null), 500);
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
    <main className="min-h-screen bg-[#1a1a1a] px-4 py-8 md:px-8 overflow-hidden">
      <div className="mx-auto max-w-6xl space-y-6">
        <motion.header 
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
          className="panel border-2 border-[#404040] p-6 flex flex-col gap-6 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="led led-pulse bg-[#10b981]"></div>
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#10b981]">{'//'} SYSTEM ONLINE</p>
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter md:text-5xl text-[#e5e5e5]">MEETING<br/>TRACKER</h1>
            <p className="mt-2 font-mono text-xs font-bold uppercase text-[#555]">USER: {user.email}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02, x: 2 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => void logout()}
            className="industrial-button industrial-button-danger self-start md:self-center flex items-center gap-2"
          >
            <LogOut size={14} strokeWidth={3} /> [ LOGOUT ]
          </motion.button>
        </motion.header>

        <AnimatePresence mode="sync">
          {error && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="panel-inset border-2 border-[#ef4444] px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="led bg-[#ef4444]"></div>
                <span className="font-mono text-sm font-bold uppercase text-[#ef4444]">ERROR: {error}</span>
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
            className="panel border-2 border-[#404040] p-5"
          >
            <div className="flex items-center gap-2 mb-3 font-mono text-xs font-bold uppercase tracking-widest text-[#3b82f6]">
              <Calendar size={14} strokeWidth={3} /> WEEKLY_CHECKINS
            </div>
            <div className="flex items-end gap-2">
              <motion.p 
                className="text-5xl font-black text-[#3b82f6]"
                key={thisWeekCheckins.length}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 0.35 }}
              >
                {thisWeekCheckins.length}
              </motion.p>
              <p className="mb-2 font-mono text-xs text-[#555]">/ 7 DAYS</p>
            </div>
          </motion.article>
          <motion.article 
            variants={statCardVariants}
            className="panel border-2 border-[#404040] p-5"
          >
            <div className="flex items-center gap-2 mb-3 font-mono text-xs font-bold uppercase tracking-widest text-[#fbbf24]">
              <Activity size={14} strokeWidth={3} /> ACTIVE_MEETINGS
            </div>
            <div className="flex items-end gap-2">
              <p className="text-5xl font-black text-[#fbbf24]">{meetings.length}</p>
              <p className="mb-2 font-mono text-xs text-[#555]">CONFIGURED</p>
            </div>
          </motion.article>
          <motion.article 
            variants={statCardVariants}
            className="panel border-2 border-[#404040] p-5"
          >
            <div className="flex items-center gap-2 mb-3 font-mono text-xs font-bold uppercase tracking-widest text-[#10b981]">
              <Clock size={14} strokeWidth={3} /> LAST_ACTIVITY
            </div>
            <motion.p 
              className="text-sm font-bold uppercase truncate text-[#10b981]"
              key={checkins[0]?.id || 'none'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {checkins[0]?.createdAt ? formatDateTime(checkins[0].createdAt) : "NO DATA"}
            </motion.p>
          </motion.article>
        </motion.section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.28, delay: 0.08 }}
              className="panel border-2 border-[#404040] p-1"
            >
              <div className="panel-inset p-4">
                <h2 className="flex items-center gap-3 text-xl font-black uppercase tracking-tight text-[#fbbf24]">
                  <Plus size={20} strokeWidth={4} /> ADD_MEETING
                </h2>
              </div>
            </motion.div>
            <MeetingForm submitLabel="Create Meeting" onSubmit={createMeeting} />

            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="panel border-2 border-[#404040] p-6"
            >
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#404040]">
                <span className="font-mono text-xs text-[#10b981]">{'//'}</span>
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#10b981]">RECENT_LOGS</span>
              </div>
              <ul className="space-y-2">
                {checkins.slice(0, 8).map((entry) => (
                  <motion.li 
                    variants={logItemVariants}
                    key={entry.id} 
                    className="panel-inset border border-[#404040] px-3 py-3 text-xs font-bold flex items-center justify-between"
                  >
                    <span className="uppercase text-[#e5e5e5] truncate max-w-[160px]">{entry.meetingName}</span>
                    <span className="font-mono text-[10px] text-[#555] whitespace-nowrap">
                      {entry.createdAt ? formatDateTime(entry.createdAt) : entry.dayKey}
                    </span>
                  </motion.li>
                ))}
                {checkins.length === 0 ? (
                  <motion.li 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-mono text-xs text-[#555] float"
                  >
                    NO_RECORDS_FOUND
                  </motion.li>
                ) : null}
              </ul>
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.28, delay: 0.12 }}
              className="panel border-2 border-[#404040] p-1"
            >
              <div className="panel-inset p-4">
                <h2 className="text-xl font-black uppercase tracking-tight text-[#e5e5e5]">YOUR_MEETINGS</h2>
              </div>
            </motion.div>
            
            {loading ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="panel-inset border-2 border-[#404040] p-6 text-center"
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="status-indicator status-indicator-fast text-[#fbbf24] bg-[#fbbf24]"></span>
                  <p className="font-mono text-sm font-bold animate-pulse text-[#fbbf24]">LOADING_DATA...</p>
                </div>
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
                    className={`panel border-2 border-[#404040] p-5 ${todaysCheckin ? 'border-[#10b981]' : ''}`}
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
                            <div className="flex items-center gap-2 mb-2">
                              {todaysCheckin ? (
                                <motion.div 
                                  className="led bg-[#10b981]"
                                  animate={showSuccess ? { scale: [1, 1.6, 1] } : {}}
                                  transition={{ duration: 0.4 }}
                                />
                              ) : (
                                <div className="led bg-[#555]"></div>
                              )}
                              <h3 className="text-xl font-black uppercase text-[#e5e5e5]">{meeting.name}</h3>
                            </div>
                            <div className="flex flex-col gap-1 font-mono text-xs font-bold text-[#888]">
                              <span className="flex items-center gap-2">
                                <MapPin size={12} strokeWidth={3} />
                                <span className="uppercase">{meeting.location}</span>
                              </span>
                              <span className="flex items-center gap-2">
                                <Clock size={12} strokeWidth={3} />
                                <span className="uppercase">{timeLabel(meeting.time)}</span>
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2">
                            <motion.button
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              type="button"
                              onClick={() => setEditingMeetingId(meeting.id)}
                              className="industrial-button text-xs py-2"
                            >
                              <Edit2 size={10} strokeWidth={3} /> EDIT
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.03, x: [0, -1.5, 1.5, -1, 1, 0] }}
                              whileTap={{ scale: 0.97 }}
                              type="button"
                              onClick={() => void removeMeeting(meeting.id)}
                              className="industrial-button industrial-button-danger text-xs py-2"
                            >
                              <Trash2 size={10} strokeWidth={3} /> DEL
                            </motion.button>
                            <motion.button
                              whileHover={!todaysCheckin && !pendingCheckinId ? { scale: 1.03 } : {}}
                              whileTap={!todaysCheckin && !pendingCheckinId ? { scale: 0.97 } : {}}
                              type="button"
                              disabled={todaysCheckin || pendingCheckinId === meeting.id}
                              onClick={() => void checkIn(meeting)}
                              className={`industrial-button text-xs py-2 ${
                                todaysCheckin 
                                  ? "industrial-button-success checkin-success" 
                                  : "bg-[#3b82f6] border-[#2563eb] text-white hover:bg-[#60a5fa]"
                              }`}
                            >
                              {todaysCheckin ? (
                                <>
                                  <CheckCircle size={10} strokeWidth={3} /> DONE
                                </>
                              ) : pendingCheckinId === meeting.id ? (
                                <span className="flex items-center gap-1">
                                  <span className="status-indicator text-white bg-white w-2 h-2"></span>
                                  ...
                                </span>
                              ) : (
                                "CHECK_IN"
                              )}
                            </motion.button>
                          </div>
                        </div>

                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.18 }}
                          className="mt-5 pt-4 border-t border-dashed border-[#404040]"
                        >
                          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#555] mb-3">
                            {'//'} HISTORY ({history.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {history.slice(0, 6).map((entry) => (
                              <motion.span 
                                key={entry.id}
                                variants={historyItemVariants}
                                className="panel-inset border border-[#404040] px-2 py-1 font-mono text-[10px] font-bold text-[#888]"
                              >
                                {entry.createdAt ? formatDateTime(entry.createdAt).split(' ')[0] : entry.dayKey}
                              </motion.span>
                            ))}
                            {history.length === 0 ? (
                              <span className="font-mono text-[10px] text-[#444]">NO_DATA</span>
                            ) : null}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </motion.article>
                );
              })}
              </AnimatePresence>

              {!loading && meetings.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="panel-inset border-2 border-dashed border-[#404040] p-12 text-center"
                >
                  <motion.div 
                    className="led bg-[#555] mb-4 mx-auto"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  ></motion.div>
                  <p className="text-lg font-black uppercase text-[#555]">NO_MEETINGS_CONFIGURED</p>
                  <p className="mt-2 font-mono text-xs text-[#444]">Add a meeting to begin tracking.</p>
                </motion.div>
              ) : null}
            </motion.div>

            <motion.section 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
              className="panel border-2 border-[#404040] p-6"
            >
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#404040]">
                <span className="font-mono text-xs text-[#8b5cf6]">{'//'}</span>
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#8b5cf6]">WEEKLY_ACTIVITY_LOG</span>
              </div>
              <ul className="space-y-2">
                {thisWeekCheckins.map((entry, i) => {
                  const meeting = meetingById.get(entry.meetingId);
                  return (
                    <motion.li 
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 + 0.32 }}
                      key={entry.id} 
                      className="panel-inset border border-[#404040] px-4 py-3 text-xs font-bold flex items-center justify-between"
                    >
                      <span className="uppercase text-[#e5e5e5]">{meeting?.name ?? entry.meetingName}</span>
                      <span className="font-mono text-[10px] text-[#555]">
                        {entry.createdAt ? formatDateTime(entry.createdAt) : entry.dayKey}
                      </span>
                    </motion.li>
                  );
                })}
                {thisWeekCheckins.length === 0 ? (
                  <motion.li 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35 }}
                    className="font-mono text-xs text-[#444] text-center py-4"
                  >
                    NO_ACTIVITY_THIS_WEEK
                  </motion.li>
                ) : null}
              </ul>
            </motion.section>
          </div>
        </section>
      </div>
    </main>
  );
};
