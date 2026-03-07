"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Clock,
  Edit2,
  Trash2,
  CheckCircle,
  Plus,
  Activity,
  Calendar,
  GripVertical,
  LayoutGrid,
  Save,
  X,
} from "lucide-react";
import { getClientDb } from "@/lib/firebase/client";
import { useAuth } from "@/components/auth-provider";
import { Navigation } from "@/components/navigation";
import { MeetingForm } from "@/components/meeting-form";
import { TreasurySummary } from "@/components/treasury/treasury-summary";
import { SobrietyCounter } from "@/components/sobriety-counter";
import { SobrietySetup } from "@/components/sobriety-setup";
import { addDays, formatDateTime, formatShortDate, makeCheckinId, startOfWeek, toLocalDayKey } from "@/lib/date";
import { getTodayDate } from "@/lib/treasury-utils";
import { checkinUpdateSchema, dashboardLayoutSchema, normalizeDashboardLayout } from "@/lib/validators";
import { DASHBOARD_SECTION_IDS, type Checkin, type DashboardSectionId, type Meeting, type UserProfile } from "@/types";
import type { MeetingInput, SobrietyDateInput } from "@/lib/validators";

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

const ACTIVITY_WEEKS = 16;
const ACTIVITY_LEVELS = [0, 1, 2, 3, 4] as const;

const activityToneByLevel = [
  "var(--white)",
  "var(--butter)",
  "var(--sky)",
  "var(--mint)",
  "var(--coral)",
] as const;

const activityShadowByLevel = [
  "0 0 0 0 var(--black)",
  "2px 2px 0px 0px var(--black)",
  "2px 2px 0px 0px var(--black)",
  "2px 2px 0px 0px var(--black)",
  "2px 2px 0px 0px var(--black)",
] as const;

const activityLevelForCount = (count: number) => {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
};

const weekdayLabels = ["MON", "WED", "FRI"];

type DashboardSectionDefinition = {
  id: DashboardSectionId;
  label: string;
  hint: string;
  className?: string;
  content: ReactNode;
};

type SortableDashboardSectionProps = DashboardSectionDefinition & {
  isEditing: boolean;
};

const dashboardStatCardClass = "neo-dashboard-stat";

const SortableDashboardSection = ({
  id,
  label,
  hint,
  className,
  content,
  isEditing,
}: SortableDashboardSectionProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isEditing });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${className ?? ""} ${isDragging ? "z-20" : ""}`.trim()}
    >
      <div
        className={[
          "relative h-full",
          isEditing
            ? "rounded-[1.5rem] border-4 border-dashed border-black bg-[var(--cream)] p-3"
            : "",
          isDragging ? "opacity-95" : "",
        ].join(" ")}
        style={isEditing ? { boxShadow: "8px 8px 0px 0px black" } : undefined}
      >
        {isEditing ? (
          <div className="mb-3 flex items-center justify-between gap-3 border-b-2 border-dashed border-black pb-3">
            <div>
              <p className="neo-title text-sm text-black">{label}</p>
              <p className="neo-mono text-[10px] uppercase text-black/70">{hint}</p>
            </div>
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="neo-button flex items-center gap-2 px-3 py-2 text-[10px]"
              style={{ touchAction: "none" }}
              aria-label={`Drag ${label}`}
            >
              <GripVertical size={12} strokeWidth={3} /> DRAG
            </button>
          </div>
        ) : null}

        <div className={isEditing ? "pointer-events-none select-none" : ""}>{content}</div>
      </div>
    </div>
  );
};

export const Dashboard = () => {
  const { user } = useAuth();
  const db = getClientDb();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [pendingCheckinId, setPendingCheckinId] = useState<string | null>(null);
  const [checkinSuccessId, setCheckinSuccessId] = useState<string | null>(null);
  const [showSobrietySetup, setShowSobrietySetup] = useState(false);
  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const [isSavingLayout, setIsSavingLayout] = useState(false);
  const [savedLayout, setSavedLayout] = useState<DashboardSectionId[]>(() => [...DASHBOARD_SECTION_IDS]);
  const [draftLayout, setDraftLayout] = useState<DashboardSectionId[]>(() => [...DASHBOARD_SECTION_IDS]);
  
  // Check-in editing state
  const [editingCheckinId, setEditingCheckinId] = useState<string | null>(null);
  const [editingCheckinNote, setEditingCheckinNote] = useState("");
  const [editingCheckinDate, setEditingCheckinDate] = useState("");

  const profileRef = useMemo(
    () => (user ? doc(db, "userProfiles", user.uid) : null),
    [db, user],
  );

  useEffect(() => {
    if (!user || !profileRef) return;

    const meetingsQuery = query(
      collection(db, "meetings"),
      where("userId", "==", user.uid),
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
      },
      (err) => {
        if (err instanceof FirebaseError) {
          setError(`Unable to load check-ins (${err.code}).`);
          return;
        }
        setError("Unable to load check-ins.");
      },
    );

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
      unsubMeetings();
      unsubCheckins();
      unsubProfile();
    };
  }, [db, profileRef, user]);

  useEffect(() => {
    if (isEditingLayout) return;

    const nextLayout = normalizeDashboardLayout(userProfile?.dashboardLayout);
    setSavedLayout(nextLayout);
    setDraftLayout(nextLayout);
  }, [isEditingLayout, userProfile]);

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

  const activityGrid = useMemo(() => {
    const dayCounts = new Map<string, number>();
    for (const entry of checkins) {
      dayCounts.set(entry.dayKey, (dayCounts.get(entry.dayKey) ?? 0) + 1);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = startOfWeek(addDays(today, -(ACTIVITY_WEEKS - 1) * 7));
    const weeks = [] as Array<{
      label: string;
      days: Array<{
        key: string;
        date: Date;
        count: number;
        level: number;
        isToday: boolean;
      }>;
    }>;

    for (let weekIndex = 0; weekIndex < ACTIVITY_WEEKS; weekIndex += 1) {
      const weekStart = addDays(start, weekIndex * 7);
      const days = Array.from({ length: 7 }, (_, dayOffset) => {
        const date = addDays(weekStart, dayOffset);
        const key = toLocalDayKey(date);
        const count = dayCounts.get(key) ?? 0;
        return {
          key,
          date,
          count,
          level: activityLevelForCount(count),
          isToday: key === todayKey,
        };
      });

      weeks.push({
        label: weekStart.getDate() <= 7 ? weekStart.toLocaleString(undefined, { month: "short" }).toUpperCase() : "",
        days,
      });
    }

    return weeks;
  }, [checkins, todayKey]);

  if (!user) return null;

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

  const handleLayoutDragEnd = ({ active, over }: DragEndEvent) => {
    if (!isEditingLayout || !over || active.id === over.id) return;

    setDraftLayout((currentLayout) => {
      const oldIndex = currentLayout.indexOf(active.id as DashboardSectionId);
      const newIndex = currentLayout.indexOf(over.id as DashboardSectionId);

      if (oldIndex === -1 || newIndex === -1) {
        return currentLayout;
      }

      return arrayMove(currentLayout, oldIndex, newIndex);
    });
  };

  const saveLayout = async () => {
    if (!profileRef) return;

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
      const meetingRef = doc(db, "meetings", meeting.id);
      const checkinRef = doc(db, "checkins", checkinId);

      const existingCheckin = checkins.find(
        (entry) => entry.meetingId === meeting.id && entry.dayKey === todayKey,
      );

      if (existingCheckin) {
        throw new Error("already-checked-in");
      }

      const [meetingSnap, checkinSnap] = await Promise.all([
        getDoc(meetingRef),
        getDoc(checkinRef),
      ]);

      if (!meetingSnap.exists() || meetingSnap.data().userId !== user.uid) {
        throw new Error("Meeting no longer exists.");
      }

      if (checkinSnap.exists()) {
        throw new Error("already-checked-in");
      }

      await setDoc(checkinRef, {
        userId: user.uid,
        meetingId: meeting.id,
        meetingName: meeting.name,
        dayKey: todayKey,
        createdAt: serverTimestamp(),
      });

      const persistedCheckin = await getDoc(checkinRef);
      if (!persistedCheckin.exists()) {
        throw new Error("checkin-write-missing");
      }

      setCheckinSuccessId(meeting.id);
      setTimeout(() => setCheckinSuccessId(null), 600);
    } catch (err) {
      if (err instanceof Error && err.message === "already-checked-in") {
        setError(`Already checked in to ${meeting.name} today.`);
        return;
      }

      if (err instanceof Error && err.message === "checkin-write-missing") {
        setError("Check-in could not be confirmed. Please refresh and try again.");
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

  // Sobriety date functions
  const updateSobrietyDate = async (data: SobrietyDateInput) => {
    if (!user) return;
    
    const profileRef = doc(db, "userProfiles", user.uid);
    
    if (data.sobrietyDate) {
      await setDoc(profileRef, {
        userId: user.uid,
        sobrietyDate: data.sobrietyDate,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } else {
      // Clear sobriety date
      await setDoc(profileRef, {
        sobrietyDate: null,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
  };

  // Check-in edit/delete functions
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
    });

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

  const dashboardSections: Record<DashboardSectionId, DashboardSectionDefinition> = {
    sobrietyCounter: {
      id: "sobrietyCounter",
      label: "Sobriety Counter",
      hint: "Progress, milestones, and anniversaries",
      className: "md:col-span-2 lg:col-span-4",
      content: (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <SobrietyCounter
            sobrietyDate={userProfile?.sobrietyDate || null}
            onEdit={() => setShowSobrietySetup(true)}
          />
        </motion.div>
      ),
    },
    weeklyStat: {
      id: "weeklyStat",
      label: "Weekly Check-Ins",
      hint: "This week's total attendance",
      className: "lg:col-span-3",
      content: (
        <motion.article
          variants={statCardVariants}
          initial="hidden"
          animate="show"
          className={`${dashboardStatCardClass} bg-[var(--mint)]`}
        >
          <div className="mb-4 flex items-center gap-2">
            <Calendar size={20} strokeWidth={3} />
            <span className="neo-title text-sm">WEEKLY</span>
          </div>
          <div className="mt-auto">
            <motion.p
              className="neo-title text-6xl text-black"
              key={thisWeekCheckins.length}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {thisWeekCheckins.length}
            </motion.p>
            <p className="neo-mono mt-2 text-sm text-black">CHECK-INS</p>
          </div>
        </motion.article>
      ),
    },
    activeStat: {
      id: "activeStat",
      label: "Active Meetings",
      hint: "Current number of tracked meetings",
      className: "lg:col-span-3",
      content: (
        <motion.article
          variants={statCardVariants}
          initial="hidden"
          animate="show"
          className={`${dashboardStatCardClass} bg-[var(--butter)]`}
        >
          <div className="mb-4 flex items-center gap-2">
            <Activity size={20} strokeWidth={3} />
            <span className="neo-title text-sm">ACTIVE</span>
          </div>
          <div className="mt-auto">
            <p className="neo-title text-6xl text-black">{meetings.length}</p>
            <p className="neo-mono mt-2 text-sm text-black">MEETINGS</p>
          </div>
        </motion.article>
      ),
    },
    latestStat: {
      id: "latestStat",
      label: "Latest Check-In",
      hint: "Most recent activity timestamp",
      className: "lg:col-span-3",
      content: (
        <motion.article
          variants={statCardVariants}
          initial="hidden"
          animate="show"
          className={`${dashboardStatCardClass} bg-[var(--lavender)]`}
        >
          <div className="mb-4 flex items-center gap-2">
            <Clock size={20} strokeWidth={3} />
            <span className="neo-title text-sm">LATEST</span>
          </div>
          <div className="mt-auto space-y-2">
            <motion.p
              className="neo-mono text-sm leading-snug text-black"
              key={checkins[0]?.id || "none"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {checkins[0]?.createdAt ? formatDateTime(checkins[0].createdAt) : "NO DATA"}
            </motion.p>
            <p className="neo-mono text-sm text-black/75">
              {checkins[0]?.meetingName?.toUpperCase() ?? "NO RECENT CHECK-IN"}
            </p>
          </div>
        </motion.article>
      ),
    },
    treasurySummary: {
      id: "treasurySummary",
      label: "Treasury Snapshot",
      hint: "Quick jump to the treasury page",
      className: "lg:col-span-3",
      content: <TreasurySummary className={dashboardStatCardClass} />,
    },
    addMeeting: {
      id: "addMeeting",
      label: "Add Meeting",
      hint: "Create a new meeting card",
      className: "lg:col-span-6",
      content: (
        <div className="space-y-6">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-[var(--coral)] border-4 border-black p-1"
            style={{ boxShadow: "6px 6px 0px 0px black" }}
          >
            <div className="border-2 border-black bg-white p-4">
              <h2 className="neo-title flex items-center gap-2 text-xl text-black">
                <Plus size={24} strokeWidth={3} /> ADD MEETING
              </h2>
            </div>
          </motion.div>

          <MeetingForm submitLabel="Create" onSubmit={createMeeting} />
        </div>
      ),
    },
    recentCheckins: {
      id: "recentCheckins",
      label: "Recent Check-Ins",
      hint: "Edit and review your latest check-ins",
      className: "lg:col-span-6",
      content: (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="neo-card p-6"
        >
          <div className="mb-4 flex items-center gap-2 border-b-4 border-black pb-3">
            <span className="neo-title text-sm text-[var(--mint)]">►</span>
            <span className="neo-title text-sm">RECENT CHECK-INS</span>
          </div>
          <ul className="space-y-2">
            {checkins.slice(0, 8).map((entry) => (
              <motion.li
                variants={logItemVariants}
                key={entry.id}
                className="border-2 border-black bg-[var(--cream)] px-3 py-2"
              >
                {editingCheckinId === entry.id ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={editingCheckinDate}
                        onChange={(e) => setEditingCheckinDate(e.target.value)}
                        className="neo-input py-1 text-xs"
                        max={getTodayDate()}
                      />
                    </div>
                    <input
                      type="text"
                      value={editingCheckinNote}
                      onChange={(e) => setEditingCheckinNote(e.target.value)}
                      placeholder="Add a note..."
                      className="neo-input py-1 text-xs"
                      maxLength={200}
                    />
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => saveCheckinEdit(entry.id)}
                        className="neo-button bg-[var(--mint)] px-2 py-1 text-[10px]"
                      >
                        SAVE
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={cancelEditingCheckin}
                        className="neo-button bg-gray-200 px-2 py-1 text-[10px]"
                      >
                        CANCEL
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <span className="neo-mono block truncate text-xs uppercase">{entry.meetingName}</span>
                      {entry.note && (
                        <span className="neo-mono block truncate text-[10px] text-gray-500">&ldquo;{entry.note}&rdquo;</span>
                      )}
                    </div>
                    <div className="ml-2 flex items-center gap-2">
                      <span className="neo-mono whitespace-nowrap text-[10px]">
                        {entry.createdAt ? formatDateTime(entry.createdAt).split(" ")[0] : entry.dayKey}
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => startEditingCheckin(entry)}
                        className="border border-black p-1 hover:bg-[var(--butter)]"
                      >
                        <Edit2 size={10} strokeWidth={3} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => deleteCheckin(entry.id, entry.meetingName)}
                        className="border border-black p-1 hover:bg-[var(--coral)]"
                      >
                        <Trash2 size={10} strokeWidth={3} />
                      </motion.button>
                    </div>
                  </div>
                )}
              </motion.li>
            ))}
            {checkins.length === 0 ? (
              <li className="neo-mono text-xs text-gray-500">NO RECORDS</li>
            ) : null}
          </ul>
        </motion.div>
      ),
    },
    yourMeetings: {
      id: "yourMeetings",
      label: "Your Meetings",
      hint: "Manage meetings and daily check-ins",
      className: "md:col-span-2 lg:col-span-12",
      content: (
        <div className="space-y-6">
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="bg-[var(--sky)] border-4 border-black p-1"
            style={{ boxShadow: "6px 6px 0px 0px black" }}
          >
            <div className="border-2 border-black bg-white p-4">
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
                style={{ boxShadow: "4px 4px 0px 0px black" }}
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
                    className={`neo-card p-5 ${todaysCheckin ? "border-[var(--mint)]" : ""}`}
                    style={todaysCheckin ? { boxShadow: "10px 10px 0px 0px var(--mint)" } : {}}
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
                            <div className="mb-2 flex items-center gap-2">
                              <motion.div
                                className={`h-3 w-3 border-2 border-black ${todaysCheckin ? "bg-[var(--mint)]" : "bg-gray-400"}`}
                                animate={showSuccess ? { scale: [1, 1.5, 1] } : {}}
                                transition={{ duration: 0.4 }}
                              />
                              <h3 className="neo-title text-xl">{meeting.name}</h3>
                            </div>
                            <div className="neo-mono space-y-1 text-xs">
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
                              className="neo-button neo-button-primary py-2 text-xs"
                            >
                              <Edit2 size={12} strokeWidth={3} /> EDIT
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05, y: -2, x: [0, -2, 2, -1, 1, 0] }}
                              whileTap={{ scale: 0.95 }}
                              type="button"
                              onClick={() => void removeMeeting(meeting.id)}
                              className="neo-button neo-button-danger py-2 text-xs"
                            >
                              <Trash2 size={12} strokeWidth={3} /> DEL
                            </motion.button>
                            <motion.button
                              whileHover={!todaysCheckin ? { scale: 1.05, y: -2 } : {}}
                              whileTap={!todaysCheckin ? { scale: 0.95 } : {}}
                              type="button"
                              disabled={todaysCheckin || pendingCheckinId === meeting.id}
                              onClick={() => void checkIn(meeting)}
                              className={`neo-button py-2 text-xs ${
                                todaysCheckin
                                  ? "neo-button-success"
                                  : "bg-[var(--sky)] border-3 border-black text-black hover:bg-[#7DD3FC]"
                              }`}
                              style={!todaysCheckin ? { boxShadow: "4px 4px 0px 0px black" } : {}}
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

                        <div className="mt-4 border-t-2 border-dashed border-black pt-3">
                          <p className="neo-mono mb-2 text-[10px]">HISTORY ({history.length})</p>
                          <div className="flex flex-wrap gap-1">
                            {history.slice(0, 6).map((entry) => (
                              <span
                                key={entry.id}
                                className="neo-mono border border-black bg-[var(--cream)] px-2 py-1 text-[10px]"
                                title={entry.note || undefined}
                              >
                                {entry.createdAt ? formatDateTime(entry.createdAt).split(" ")[0] : entry.dayKey}
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
                className="neo-card border-dashed p-12 text-center"
              >
                <motion.div
                  className="mx-auto mb-4 h-6 w-6 border-2 border-black bg-[var(--coral)]"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
                <p className="neo-title text-lg">NO MEETINGS</p>
                <p className="neo-mono mt-2 text-xs">Add a meeting above to start tracking.</p>
              </motion.div>
            ) : null}
          </motion.div>
        </div>
      ),
    },
    activityTracker: {
      id: "activityTracker",
      label: "Activity Tracker",
      hint: "Heatmap of the last sixteen weeks",
      className: "md:col-span-2 lg:col-span-6",
      content: (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="neo-card p-6"
        >
          <div className="mb-4 flex items-center gap-2 border-b-4 border-black pb-3">
            <span className="neo-title text-sm text-[var(--sky)]">►</span>
            <span className="neo-title text-sm">ACTIVITY TRACKER</span>
          </div>
          <div className="overflow-x-auto pb-2">
            <div className="inline-flex min-w-full gap-3">
              <div className="flex flex-col pt-8 text-[10px]">
                {Array.from({ length: 7 }, (_, dayIndex) => (
                  <div key={dayIndex} className="neo-mono flex h-4 items-center justify-end pr-1 text-[10px] text-black/70">
                    {weekdayLabels.includes(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"][dayIndex])
                      ? ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"][dayIndex]
                      : ""}
                  </div>
                ))}
              </div>
              <div className="flex-1">
                <div className="mb-2 grid" style={{ gridTemplateColumns: `repeat(${activityGrid.length}, minmax(0, 1fr))` }}>
                  {activityGrid.map((week, index) => (
                    <div key={`${week.label}-${index}`} className="neo-mono h-6 px-[2px] text-[10px] text-black/70">
                      {week.label}
                    </div>
                  ))}
                </div>
                <div
                  className="grid gap-1"
                  style={{
                    gridTemplateColumns: `repeat(${activityGrid.length}, minmax(0, 1fr))`,
                    gridTemplateRows: "repeat(7, minmax(0, 1fr))",
                  }}
                >
                  {activityGrid.flatMap((week, weekIndex) =>
                    week.days.map((day, dayIndex) => (
                      <motion.div
                        key={day.key}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: weekIndex * 0.01 + dayIndex * 0.01 }}
                        className={`group relative h-4 w-4 border-2 border-black ${day.isToday ? "ring-2 ring-black ring-offset-2 ring-offset-[var(--cream)]" : ""}`}
                        style={{
                          backgroundColor: activityToneByLevel[day.level],
                          boxShadow: activityShadowByLevel[day.level],
                          gridColumn: weekIndex + 1,
                          gridRow: dayIndex + 1,
                        }}
                        aria-label={`${day.count} check-ins on ${formatShortDate(day.date)}`}
                        title={`${formatShortDate(day.date)} - ${day.count} check-in${day.count === 1 ? "" : "s"}`}
                      />
                    )),
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-3 border-t-2 border-dashed border-black pt-3 md:flex-row md:items-center md:justify-between">
            <p className="neo-mono text-[10px] uppercase text-black/80">
              Last {ACTIVITY_WEEKS} weeks of check-ins across all meetings.
            </p>
            <div className="neo-mono flex items-center gap-2 text-[10px] uppercase">
              <span>Less</span>
              {ACTIVITY_LEVELS.map((level) => (
                <span
                  key={level}
                  className="h-4 w-4 border-2 border-black"
                  style={{
                    backgroundColor: activityToneByLevel[level],
                    boxShadow: activityShadowByLevel[level],
                  }}
                />
              ))}
              <span>More</span>
            </div>
          </div>
        </motion.section>
      ),
    },
    weeklyLog: {
      id: "weeklyLog",
      label: "Weekly Log",
      hint: "Chronological check-ins from this week",
      className: "md:col-span-2 lg:col-span-6",
      content: (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="neo-card p-6"
        >
          <div className="mb-4 flex items-center gap-2 border-b-4 border-black pb-3">
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
                  className="flex items-center justify-between border-2 border-black bg-[var(--lavender)] px-4 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <span className="neo-mono block text-xs uppercase">{meeting?.name ?? entry.meetingName}</span>
                    {entry.note && (
                      <span className="neo-mono block truncate text-[10px] text-gray-600">&ldquo;{entry.note}&rdquo;</span>
                    )}
                  </div>
                  <span className="neo-mono ml-2 whitespace-nowrap text-[10px]">
                    {entry.createdAt ? formatDateTime(entry.createdAt) : entry.dayKey}
                  </span>
                </motion.li>
              );
            })}
            {thisWeekCheckins.length === 0 ? (
              <li className="neo-mono py-4 text-center text-xs">NO ACTIVITY</li>
            ) : null}
          </ul>
        </motion.section>
      ),
    },
  };

  return (
    <main className="min-h-screen">
      <Navigation />
      <div className="px-4 py-8 md:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-4 border-black bg-[var(--coral)] p-4"
                style={{ boxShadow: "6px 6px 0px 0px black" }}
              >
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 bg-black" />
                  <span className="neo-title text-sm text-black">ERROR: {error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.section
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-4 border-black bg-white p-1"
            style={{ boxShadow: "8px 8px 0px 0px black" }}
          >
            <div className="flex flex-col gap-4 border-2 border-black bg-[linear-gradient(135deg,var(--cream),white)] p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <LayoutGrid size={18} strokeWidth={3} />
                  <span className="neo-title text-base text-black">DASHBOARD LAYOUT</span>
                </div>
                <p className="neo-mono max-w-2xl text-xs text-black/70">
                  {isEditingLayout
                    ? "Drag cards by their handles, then save this order to keep it across refreshes, logouts, and future logins."
                    : "Turn on edit layout mode to rearrange the main dashboard cards and keep that order between sessions."}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {isEditingLayout ? (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.03, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      onClick={() => void saveLayout()}
                      disabled={isSavingLayout}
                      className="neo-button bg-[var(--mint)] text-xs"
                    >
                      <Save size={14} strokeWidth={3} /> {isSavingLayout ? "SAVING..." : "SAVE LAYOUT"}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.03, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      onClick={cancelLayoutEditing}
                      disabled={isSavingLayout}
                      className="neo-button bg-white text-xs"
                    >
                      <X size={14} strokeWidth={3} /> CANCEL
                    </motion.button>
                  </>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={beginLayoutEditing}
                    className="neo-button neo-button-primary text-xs"
                  >
                    <LayoutGrid size={14} strokeWidth={3} /> EDIT LAYOUT
                  </motion.button>
                )}
              </div>
            </div>
          </motion.section>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleLayoutDragEnd}
          >
            <SortableContext items={activeLayout} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-12">
                {activeLayout.map((sectionId) => (
                  <SortableDashboardSection
                    key={sectionId}
                    {...dashboardSections[sectionId]}
                    isEditing={isEditingLayout}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {/* Sobriety Setup Modal */}
      <AnimatePresence>
        {showSobrietySetup && (
          <SobrietySetup
            currentDate={userProfile?.sobrietyDate || null}
            onSubmit={updateSobrietyDate}
            onClose={() => setShowSobrietySetup(false)}
          />
        )}
      </AnimatePresence>
    </main>
  );
};
