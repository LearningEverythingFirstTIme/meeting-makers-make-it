"use client";

import { Fragment, useState, type CSSProperties, type ReactNode } from "react";
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
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
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
import { useHaptics } from "@/components/haptics-provider";
import { Navigation } from "@/components/navigation";
import { MeetingForm } from "@/components/meeting-form";
import { TreasurySummary } from "@/components/treasury/treasury-summary";
import { SobrietyCounter } from "@/components/sobriety-counter";
import { SobrietySetup } from "@/components/sobriety-setup";
import { formatDateTime, formatShortDate, toLocalDayKey } from "@/lib/date";

const getTodayDate = () => toLocalDayKey();
import { useMeetings, useMeetingById } from "@/hooks/useMeetings";
import { useCheckins } from "@/hooks/useCheckins";
import { useDashboardLayout } from "@/hooks/useDashboardLayout";
import { useActivityGrid, DAY_NAMES } from "@/hooks/useActivityGrid";
import type { DashboardSectionId, Meeting } from "@/types";
import type { SobrietyDateInput } from "@/lib/validators";

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
            ? "border-4 border-dashed border-[var(--on-background)] bg-[var(--surface-container)] p-3"
            : "",
          isDragging ? "opacity-95" : "",
        ].join(" ")}
        style={isEditing ? { boxShadow: "8px 8px 0px 0px var(--on-background)" } : undefined}
      >
        {isEditing ? (
          <div className="mb-3 flex items-center justify-between gap-3 border-b-2 border-dashed border-[var(--on-background)] pb-3">
            <div>
              <p className="neo-title text-sm text-[var(--on-background)]">{label}</p>
              <p className="neo-mono text-[10px] uppercase text-[var(--on-surface-variant)]">{hint}</p>
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
  const { trigger, isSupported } = useHaptics();
  const db = getClientDb();
  
  // Custom hooks for data and operations
  const {
    meetings,
    loading: meetingsLoading,
    error: meetingsError,
    createMeeting,
    updateMeeting,
    removeMeeting,
  } = useMeetings();

  const {
    checkins,
    thisWeekCheckins,
    checkinsByMeeting,
    error: checkinsError,
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
    setError: setCheckinsError,
  } = useCheckins();

  const {
    userProfile,
    activeLayout,
    isEditingLayout,
    isSavingLayout,
    error: layoutError,
    beginLayoutEditing,
    cancelLayoutEditing,
    handleLayoutDragEnd,
    saveLayout,
    setError: setLayoutError,
  } = useDashboardLayout();

  const {
    activityGrid,
    activityToneByLevel,
    activityShadowByLevel,
    activityLevels,
    activityWeeks,
  } = useActivityGrid(checkins);

  const meetingById = useMeetingById(meetings);

  // Local UI state
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [showSobrietySetup, setShowSobrietySetup] = useState(false);

  // DnD sensors
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

  // Combine errors from hooks
  const error = meetingsError || checkinsError || layoutError;

  const setError = (err: string | null) => {
    setCheckinsError(err);
    setLayoutError(err);
  };

  if (!user) return null;

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
      await setDoc(profileRef, {
        sobrietyDate: null,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    handleLayoutDragEnd({
      active: { id: String(event.active.id) },
      over: event.over ? { id: String(event.over.id) } : null,
    });
  };

  // Activity grid colors using monochromatic burgundy scale
  const activityColors: Record<number, string> = {
    0: 'var(--surface-container-lowest)',
    1: 'var(--surface-container)',
    2: 'var(--primary-container)',
    3: 'var(--primary)',
    4: 'var(--on-background)',
  };

  const dashboardSections: Record<DashboardSectionId, DashboardSectionDefinition> = {
    sobrietyCounter: {
      id: "sobrietyCounter",
      label: "Sobriety Counter",
      hint: "Progress, milestones, and anniversaries",
      className: "md:col-span-6 lg:col-span-4",
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
          className={`${dashboardStatCardClass} bg-[var(--secondary-container)]`}
        >
          <div className="mb-4 flex items-center gap-2">
            <Calendar size={20} strokeWidth={3} />
            <span className="neo-title text-sm text-[var(--on-secondary-container)]">WEEKLY</span>
          </div>
          <div className="mt-auto">
            <motion.p
              className="neo-title text-6xl text-[var(--on-background)]"
              key={thisWeekCheckins.length}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {thisWeekCheckins.length}
            </motion.p>
            <p className="neo-mono mt-2 text-sm text-[var(--on-surface-variant)]">CHECK-INS</p>
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
          className={`${dashboardStatCardClass} bg-[var(--tertiary-fixed)]`}
        >
          <div className="mb-4 flex items-center gap-2">
            <Activity size={20} strokeWidth={3} />
            <span className="neo-title text-sm text-[var(--on-background)]">ACTIVE</span>
          </div>
          <div className="mt-auto">
            <p className="neo-title text-6xl text-[var(--on-background)]">{meetings.length}</p>
            <p className="neo-mono mt-2 text-sm text-[var(--on-surface-variant)]">MEETINGS</p>
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
          className={`${dashboardStatCardClass} bg-[var(--surface-container-high)]`}
        >
          <div className="mb-4 flex items-center gap-2">
            <Clock size={20} strokeWidth={3} />
            <span className="neo-title text-sm text-[var(--on-background)]">LATEST</span>
          </div>
          <div className="mt-auto space-y-3">
            <motion.p
              className="neo-mono text-2xl font-bold leading-snug text-[var(--on-background)]"
              key={checkins[0]?.id || "none"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {checkins[0]?.createdAt ? formatDateTime(checkins[0].createdAt) : "NO DATA"}
            </motion.p>
            <p className="neo-mono text-xl font-bold text-[var(--on-background)]">
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
      className: "md:col-span-6 lg:col-span-4",
      content: (
        <div className="space-y-6">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-[var(--tertiary)] border-4 border-[var(--on-background)] p-1"
            style={{ boxShadow: "8px 8px 0px 0px var(--on-background)" }}
          >
            <div className="border-3 border-[var(--on-background)] bg-[var(--surface-container-lowest)] p-4">
              <h2 className="neo-title flex items-center gap-2 text-xl text-[var(--on-background)]">
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
      className: "md:col-span-6 lg:col-span-4",
      content: (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="border-4 border-[var(--on-background)] p-6 bg-[var(--surface-container-lowest)]"
          style={{ boxShadow: '6px 6px 0px 0px var(--on-background)' }}
        >
          <div className="mb-4 flex items-center gap-2 border-b-4 border-[var(--on-background)] pb-3">
            <span className="neo-title text-sm text-[var(--primary)]">►</span>
            <span className="neo-title text-sm text-[var(--on-background)]">RECENT CHECK-INS</span>
          </div>
          <ul className="space-y-2">
            {checkins.slice(0, 8).map((entry) => (
              <motion.li
                variants={logItemVariants}
                key={entry.id}
                className="border-3 border-[var(--on-background)] bg-[var(--surface-container)] px-3 py-2"
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
                        onClick={() => { if (isSupported) trigger('success'); saveCheckinEdit(entry.id); }}
                        className="neo-button bg-[var(--primary)] text-[var(--on-primary)] px-2 py-1 text-[10px]"
                      >
                        SAVE
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { if (isSupported) trigger('light'); cancelEditingCheckin(); }}
                        className="neo-button bg-[var(--secondary-container)] px-2 py-1 text-[10px]"
                      >
                        CANCEL
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <span className="neo-mono block truncate text-xs uppercase text-[var(--on-background)]">{entry.meetingName}</span>
                      {entry.note && (
                        <span className="neo-mono block truncate text-[10px] text-[var(--on-surface-variant)]">&ldquo;{entry.note}&rdquo;</span>
                      )}
                    </div>
                    <div className="ml-2 flex items-center gap-2">
                      <span className="neo-mono whitespace-nowrap text-[10px] text-[var(--on-surface-variant)]">
                        {entry.createdAt ? formatDateTime(entry.createdAt).split(" ")[0] : entry.dayKey}
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => { if (isSupported) trigger('light'); startEditingCheckin(entry); }}
                        className="border border-[var(--on-background)] p-1 hover:bg-[var(--surface-container-high)]"
                      >
                        <Edit2 size={10} strokeWidth={3} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => { if (isSupported) trigger('warning'); deleteCheckin(entry.id, entry.meetingName); }}
                        className="border border-[var(--on-background)] p-1 hover:bg-[var(--tertiary)]"
                      >
                        <Trash2 size={10} strokeWidth={3} />
                      </motion.button>
                    </div>
                  </div>
                )}
              </motion.li>
            ))}
            {checkins.length === 0 ? (
              <li className="neo-mono text-xs text-[var(--on-surface-variant)]">NO RECORDS</li>
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
            className="bg-[var(--primary)] border-4 border-[var(--on-background)] p-1"
            style={{ boxShadow: "8px 8px 0px 0px var(--on-background)" }}
          >
            <div className="border-3 border-[var(--on-background)] bg-[var(--surface-container-lowest)] p-4">
              <h2 className="neo-title text-xl text-[var(--on-background)]">YOUR MEETINGS</h2>
            </div>
          </motion.div>

          {meetingsLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="border-4 border-[var(--on-background)] p-8 text-center bg-[var(--surface-container-lowest)]"
              style={{ boxShadow: '6px 6px 0px 0px var(--on-background)' }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="mx-auto mb-4 h-12 w-12 border-4 border-[var(--on-background)] bg-[var(--primary)]"
                style={{ boxShadow: '6px 6px 0px 0px var(--on-background)' }}
              />
              <p className="neo-title animate-blink text-[var(--on-background)]">LOADING...</p>
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
                    className={`border-4 border-[var(--on-background)] p-6 bg-[var(--surface-container-lowest)] ${todaysCheckin ? "border-[var(--primary)]" : ""}`}
                    style={todaysCheckin ? { boxShadow: "10px 10px 0px 0px var(--primary)" } : { boxShadow: '8px 8px 0px 0px var(--on-background)' }}
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
                                className={`h-3 w-3 border-3 border-[var(--on-background)] ${todaysCheckin ? "bg-[var(--primary)]" : "bg-[var(--on-surface-variant)]"}`}
                                animate={showSuccess ? { scale: [1, 1.5, 1] } : {}}
                                transition={{ duration: 0.4 }}
                              />
                              <h3 className="neo-title text-xl text-[var(--on-background)]">{meeting.name}</h3>
                            </div>
                            <div className="neo-mono space-y-1 text-xs text-[var(--on-surface-variant)]">
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
                              onClick={() => { if (isSupported) trigger('light'); setEditingMeetingId(meeting.id); }}
                              className="neo-button neo-button-primary py-2 text-xs"
                            >
                              <Edit2 size={12} strokeWidth={3} /> EDIT
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05, y: -2, x: [0, -2, 2, -1, 1, 0] }}
                              whileTap={{ scale: 0.95 }}
                              type="button"
                              onClick={() => { if (isSupported) trigger('warning'); void removeMeeting(meeting.id); }}
                              className="neo-button neo-button-danger py-2 text-xs"
                            >
                              <Trash2 size={12} strokeWidth={3} /> DEL
                            </motion.button>
                            <motion.button
                              whileHover={!todaysCheckin ? { scale: 1.05, y: -2 } : {}}
                              whileTap={!todaysCheckin ? { scale: 0.95 } : {}}
                              type="button"
                              disabled={todaysCheckin || pendingCheckinId === meeting.id}
                              onClick={() => { if (isSupported) trigger('success'); void checkIn(meeting); }}
                              className={`neo-button py-2 text-xs ${
                                todaysCheckin
                                  ? "neo-button-success"
                                  : "bg-[var(--secondary)] text-[var(--on-secondary)]"
                              }`}
                              style={!todaysCheckin ? { boxShadow: "4px 4px 0px 0px var(--on-background)" } : {}}
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

                        <div className="mt-4 border-t-2 border-dashed border-[var(--outline-variant)] pt-3">
                          <p className="neo-mono mb-2 text-[10px] text-[var(--on-surface-variant)]">HISTORY ({history.length})</p>
                          <div className="flex flex-wrap gap-1">
                            {history.slice(0, 6).map((entry) => (
                              <span
                                key={entry.id}
                                className="neo-mono border border-[var(--on-background)] bg-[var(--surface-container)] px-2 py-1 text-[10px] text-[var(--on-background)]"
                                title={entry.note || undefined}
                              >
                                {entry.createdAt ? formatDateTime(entry.createdAt).split(" ")[0] : entry.dayKey}
                              </span>
                            ))}
                            {history.length === 0 ? (
                              <span className="neo-mono text-[10px] text-[var(--on-surface-variant)]">NO DATA</span>
                            ) : null}
                          </div>
                        </div>
                      </>
                    )}
                  </motion.article>
                );
              })}
            </AnimatePresence>

            {!meetingsLoading && meetings.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-4 border-dashed border-[var(--on-background)] p-12 text-center bg-[var(--surface-container-lowest)]"
              >
                <motion.div
                  className="mx-auto mb-4 h-6 w-6 border-3 border-[var(--on-background)] bg-[var(--tertiary)]"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
                <p className="neo-title text-lg text-[var(--on-background)]">NO MEETINGS</p>
                <p className="neo-mono mt-2 text-xs text-[var(--on-surface-variant)]">Add a meeting above to start tracking.</p>
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
      className: "md:col-span-6 lg:col-span-6",
      content: (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="border-4 border-[var(--on-background)] p-6 bg-[var(--surface-container-lowest)]"
          style={{ boxShadow: '6px 6px 0px 0px var(--on-background)' }}
        >
          <div className="mb-4 flex items-center gap-2 border-b-4 border-[var(--on-background)] pb-3">
            <span className="neo-title text-sm text-[var(--tertiary)]">►</span>
            <span className="neo-title text-sm text-[var(--on-background)]">ACTIVITY TRACKER</span>
          </div>
          <div className="w-full">
            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: `2.75rem repeat(${activityWeeks}, 1fr)` }}
            >
              {/* Month labels row */}
              <div />
              {activityGrid.map((week, weekIndex) => (
                <div
                  key={`month-${weekIndex}`}
                  className="neo-mono h-5 text-[10px] leading-tight text-[var(--on-surface-variant)]"
                >
                  {week.label}
                </div>
              ))}
              {/* Day rows */}
              {Array.from({ length: 7 }, (_, dayIndex) => (
                <Fragment key={dayIndex}>
                  <div className="neo-mono flex items-center justify-end pr-1 text-[10px] text-[var(--on-surface-variant)]">
                    {DAY_NAMES[dayIndex]}
                  </div>
                  {activityGrid.map((week, weekIndex) => {
                    const day = week.days[dayIndex];
                    const bgColor = activityColors[day.level];
                    const shadow = day.level >= 2 ? `3px 3px 0 0 var(--on-background)` : 'none';
                    return (
                      <motion.div
                        key={day.key}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: weekIndex * 0.02 }}
                        className={`aspect-square border-3 border-[var(--on-background)] ${day.isToday ? "ring-2 ring-[var(--tertiary)] ring-offset-1 ring-offset-[var(--surface-container-lowest)]" : ""}`}
                        style={{
                          backgroundColor: bgColor,
                          boxShadow: shadow,
                        }}
                        aria-label={`${day.count} check-ins on ${formatShortDate(day.date)}`}
                        title={`${formatShortDate(day.date)} - ${day.count} check-in${day.count === 1 ? "" : "s"}`}
                      />
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-3 border-t-2 border-dashed border-[var(--outline-variant)] pt-3 md:flex-row md:items-center md:justify-between">
            <p className="neo-mono text-[10px] uppercase text-[var(--on-surface-variant)]">
              Last {activityWeeks} weeks of check-ins across all meetings.
            </p>
            <div className="neo-mono flex items-center gap-2 text-[10px] uppercase text-[var(--on-surface-variant)]">
              <span>Less</span>
              {activityLevels.map((level) => (
                <span
                  key={level}
                  className="h-4 w-4 border-3 border-[var(--on-background)]"
                  style={{
                    backgroundColor: activityColors[level],
                    boxShadow: level >= 2 ? '2px 2px 0 0 var(--on-background)' : 'none',
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
      className: "md:col-span-6 lg:col-span-6",
      content: (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="border-4 border-[var(--on-background)] p-6 bg-[var(--surface-container-lowest)]"
          style={{ boxShadow: '6px 6px 0px 0px var(--on-background)' }}
        >
          <div className="mb-4 flex items-center gap-2 border-b-4 border-[var(--on-background)] pb-3">
            <span className="neo-title text-sm text-[var(--primary)]">►</span>
            <span className="neo-title text-sm text-[var(--on-background)]">WEEKLY LOG</span>
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
                  className="flex items-center justify-between border-3 border-[var(--on-background)] bg-[var(--surface-container-high)] px-4 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <span className="neo-mono block text-xs uppercase text-[var(--on-background)]">{meeting?.name ?? entry.meetingName}</span>
                    {entry.note && (
                      <span className="neo-mono block truncate text-[10px] text-[var(--on-surface-variant)]">&ldquo;{entry.note}&rdquo;</span>
                    )}
                  </div>
                  <span className="neo-mono ml-2 whitespace-nowrap text-[10px] text-[var(--on-surface-variant)]">
                    {entry.createdAt ? formatDateTime(entry.createdAt) : entry.dayKey}
                  </span>
                </motion.li>
              );
            })}
            {thisWeekCheckins.length === 0 ? (
              <li className="neo-mono py-4 text-center text-xs text-[var(--on-surface-variant)]">NO ACTIVITY</li>
            ) : null}
          </ul>
        </motion.section>
      ),
    },
  };

  return (
    <main className="min-h-screen zine-grid">
      <Navigation />
      <div className="px-4 py-8 md:px-8">
        <div className="mx-auto max-w-[1400px] space-y-6">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-4 border-[var(--on-background)] bg-[var(--tertiary)] p-4"
                style={{ boxShadow: "8px 8px 0px 0px var(--on-background)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 bg-[var(--on-tertiary)]" />
                  <span className="neo-title text-sm text-[var(--on-tertiary)]">ERROR: {error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.section
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-4 border-[var(--on-background)] bg-[var(--surface-container-lowest)] p-1"
            style={{ boxShadow: "8px 8px 0px 0px var(--on-background)" }}
          >
            <div className="flex flex-col gap-4 border-2 border-[var(--on-background)] bg-[var(--surface-container)] p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <LayoutGrid size={18} strokeWidth={3} />
                  <span className="neo-title text-base text-[var(--on-background)]">DASHBOARD LAYOUT</span>
                </div>
                <p className="neo-mono max-w-2xl text-xs text-[var(--on-surface-variant)]">
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
                      onClick={() => { if (isSupported) trigger('success'); void saveLayout(); }}
                      disabled={isSavingLayout}
                      className="neo-button bg-[var(--primary)] text-[var(--on-primary)] text-xs"
                    >
                      <Save size={14} strokeWidth={3} /> {isSavingLayout ? "SAVING..." : "SAVE LAYOUT"}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.03, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      onClick={() => { if (isSupported) trigger('light'); cancelLayoutEditing(); }}
                      disabled={isSavingLayout}
                      className="neo-button bg-[var(--surface-container-lowest)] text-xs"
                    >
                      <X size={14} strokeWidth={3} /> CANCEL
                    </motion.button>
                  </>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => { if (isSupported) trigger('light'); beginLayoutEditing(); }}
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
            onDragEnd={onDragEnd}
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
