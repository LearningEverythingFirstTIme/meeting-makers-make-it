"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Clock, Video, Phone, Users, ChevronDown, ChevronUp, ExternalLink, CheckCircle } from "lucide-react";
import { collection, query as firestoreQuery, where, onSnapshot, setDoc, doc, serverTimestamp, getDoc } from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { Navigation } from "@/components/navigation";
import { useAuth } from "@/components/auth-provider";
import { getClientDb } from "@/lib/firebase/client";
import { makeCheckinId, toLocalDayKey } from "@/lib/date";
import type { NJMeeting, NJMeetingType, Checkin } from "@/types";

const DAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function cleanMeetingName(name: string, day: number, time: string): string {
  const dayName = DAY_NAMES[day];
  // Strip "DayName HH:MM " prefix (the format used in the JSON data)
  const prefix = `${dayName} ${time} `;
  if (name.startsWith(prefix)) return name.slice(prefix.length).trim();
  // Also handle times without leading zero (e.g. "7:00" vs "07:00")
  const [h, m] = time.split(":");
  const altPrefix = `${dayName} ${parseInt(h)}:${m} `;
  if (name.startsWith(altPrefix)) return name.slice(altPrefix.length).trim();
  return name;
}

const TYPE_INFO: Record<NJMeetingType, { label: string; color: string }> = {
  B:   { label: "Big Book",    color: "var(--butter)" },
  ST:  { label: "Step",        color: "var(--mint)" },
  TR:  { label: "Traditions",  color: "var(--sky)" },
  M:   { label: "Men",         color: "var(--lavender)" },
  W:   { label: "Women",       color: "var(--pink)" },
  VM:  { label: "Virtual",     color: "var(--coral)" },
  PH:  { label: "Phone",       color: "var(--lime)" },
  C:   { label: "Closed",      color: "var(--cream)" },
  D:   { label: "Discussion",  color: "var(--sky)" },
  MED: { label: "Meditation",  color: "var(--mint)" },
  O:   { label: "Open",        color: "var(--lavender)" },
  S:   { label: "Speaker",     color: "var(--butter)" },
  X:   { label: "Special",     color: "var(--coral)" },
};

function timeLabel(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
}

// Generate a stable meeting ID for NJ meetings (since they're from static JSON)
function makeNJMeetingId(meeting: NJMeeting): string {
  // Use slug if available, otherwise create a deterministic ID from meeting properties
  if (meeting.slug) {
    return `nj_${meeting.slug}`;
  }
  // Fallback: create ID from name, day, time, and location
  const base = `${meeting.name}_${meeting.day}_${meeting.time}_${meeting.location}`.toLowerCase();
  return `nj_${btoa(base).replace(/[^a-zA-Z0-9]/g, "").substring(0, 32)}`;
}

interface MeetingCardProps {
  meeting: NJMeeting;
  checkedInToday: boolean;
  pendingCheckin: boolean;
  showSuccess: boolean;
  onCheckIn: (meeting: NJMeeting) => void;
}

function MeetingCard({ meeting, checkedInToday, pendingCheckin, showSuccess, onCheckIn }: MeetingCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isZoom = meeting.types.includes("VM") || !!meeting.conference_url;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className={`neo-card bg-[var(--white)] overflow-hidden ${checkedInToday ? "border-[var(--mint)]" : ""}`}
      style={checkedInToday ? { boxShadow: "10px 10px 0px 0px var(--mint)" } : {}}
    >
      <div
        className="p-4 cursor-pointer select-none"
        onClick={() => setExpanded((e) => !e)}
      >
        {/* Top row: day chip + time + expand toggle */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="neo-mono text-xs px-2 py-0.5 border-3 border-black font-bold"
              style={{ background: "var(--butter)" }}
            >
              {DAY_LABELS[meeting.day]}
            </span>
            <span className="flex items-center gap-1 neo-mono text-xs text-[var(--black)]">
              <Clock size={12} strokeWidth={3} />
              {timeLabel(meeting.time)}
            </span>
            {isZoom ? (
              <span
                className="flex items-center gap-1 neo-mono text-xs px-2 py-0.5 border-3 border-black"
                style={{ background: "var(--coral)", color: "black" }}
              >
                <Video size={10} strokeWidth={3} /> ZOOM
              </span>
            ) : (
              <span
                className="flex items-center gap-1 neo-mono text-xs px-2 py-0.5 border-3 border-black"
                style={{ background: "var(--mint)", color: "black" }}
              >
                <MapPin size={10} strokeWidth={3} /> IN-PERSON
              </span>
            )}
          </div>
          <div className="shrink-0 text-[var(--black)]">
            {expanded ? <ChevronUp size={16} strokeWidth={3} /> : <ChevronDown size={16} strokeWidth={3} />}
          </div>
        </div>

        {/* Meeting name */}
        <p className="neo-title text-sm leading-snug mb-2">
          {cleanMeetingName(meeting.name, meeting.day, meeting.time)}
        </p>

        {/* City line */}
        {meeting.city && (
          <p className="neo-mono text-xs text-[var(--black)]/60">{meeting.city}, {meeting.state}</p>
        )}

        {/* Type badges and check-in indicator */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex flex-wrap gap-1">
            {meeting.types.filter(t => t !== "VM").map((t) => {
              const info = TYPE_INFO[t];
              if (!info) return null;
              return (
                <span
                  key={t}
                  className="neo-mono text-xs px-1.5 py-0.5 border-3 border-black"
                  style={{ background: info.color }}
                >
                  {info.label}
                </span>
              );
            })}
          </div>
          {/* Small indicator when checked in */}
          {checkedInToday && (
            <span className="flex items-center gap-1 neo-mono text-xs text-[var(--mint)]">
              <CheckCircle size={12} strokeWidth={3} /> DONE
            </span>
          )}
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t-3 border-black"
          >
            <div className="p-4 bg-[var(--cream)] space-y-2">
              {/* Physical address — show whenever a location exists */}
              {meeting.location && (
                <div className="flex items-start gap-2">
                  <MapPin size={13} strokeWidth={3} className="mt-0.5 shrink-0" />
                  <span className="neo-mono text-xs">
                    {meeting.location}
                    {meeting.address ? `, ${meeting.address}` : ""}
                    {meeting.city ? `, ${meeting.city}` : ""}
                    {meeting.state ? ` ${meeting.state}` : ""}
                  </span>
                </div>
              )}
              {/* Zoom join button */}
              {meeting.conference_url ? (
                <div className="pb-1">
                  <a
                    href={meeting.conference_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="neo-button flex items-center justify-center gap-2 py-3 text-sm w-full border-3 border-black"
                    style={{ background: "var(--coral)", boxShadow: "4px 4px 0px 0px black" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Video size={15} strokeWidth={3} />
                    JOIN ZOOM MEETING
                    <ExternalLink size={12} strokeWidth={3} />
                  </a>
                  <p className="neo-mono text-xs text-[var(--black)]/50 mt-1.5 break-all px-0.5">
                    {meeting.conference_url}
                  </p>
                </div>
              ) : isZoom && (
                <div className="flex items-center gap-2 text-[var(--black)]/50">
                  <Video size={13} strokeWidth={3} />
                  <span className="neo-mono text-xs">No Zoom link on file for this meeting</span>
                </div>
              )}
              {meeting.types.includes("PH") && (
                <div className="flex items-center gap-2">
                  <Phone size={13} strokeWidth={3} />
                  <span className="neo-mono text-xs">Phone Meeting</span>
                </div>
              )}
              {meeting.notes && (
                <p className="neo-mono text-xs text-[var(--black)]/70 border-t-2 border-black/20 pt-2">
                  {meeting.notes}
                </p>
              )}
              {meeting.wheelchair && (
                <span className="neo-mono text-xs px-2 py-0.5 border-3 border-black bg-[var(--sky)] inline-block">
                  ♿ WHEELCHAIR ACCESSIBLE
                </span>
              )}
              {meeting.group && (
                <p className="neo-mono text-xs text-[var(--black)]/50">Group: {meeting.group}</p>
              )}
              
              {/* Check-in button - moved to expanded dropdown */}
              <div className="pt-3 border-t-2 border-black/20">
                <motion.button
                  whileHover={!checkedInToday ? { scale: 1.02 } : {}}
                  whileTap={!checkedInToday ? { scale: 0.98 } : {}}
                  type="button"
                  disabled={checkedInToday || pendingCheckin}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCheckIn(meeting);
                  }}
                  className={`neo-button py-2.5 text-xs w-full ${
                    checkedInToday
                      ? "neo-button-success"
                      : "bg-[var(--sky)] border-3 border-black text-[var(--black)] hover:bg-[#7DD3FC]"
                  }`}
                  style={!checkedInToday ? { boxShadow: "4px 4px 0px 0px black" } : {}}
                >
                  {checkedInToday ? (
                    <>
                      <CheckCircle size={14} strokeWidth={3} /> ✓ CHECKED IN TODAY
                    </>
                  ) : pendingCheckin ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.span 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="inline-block h-3 w-3 border-3 border-black border-t-transparent"
                      />
                      CHECKING IN...
                    </span>
                  ) : (
                    "CHECK IN TO THIS MEETING"
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface MeetingFinderProps {
  meetings: NJMeeting[];
}

export function MeetingFinder({ meetings }: MeetingFinderProps) {
  const { user } = useAuth();
  const [db, setDb] = useState<ReturnType<typeof getClientDb> | null>(null);
  
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [pendingCheckinId, setPendingCheckinId] = useState<string | null>(null);
  const [checkinSuccessId, setCheckinSuccessId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [query, setQuery] = useState("");
  const [dayFilter, setDayFilter] = useState<number | null>(null);
  const [formatFilter, setFormatFilter] = useState<"all" | "in-person" | "zoom">("all");
  const [typeFilter, setTypeFilter] = useState<NJMeetingType | null>(null);
  const [page, setPage] = useState(0);

  const PAGE_SIZE = 30;
  const todayKey = toLocalDayKey();

  // Initialize Firebase DB on client side
  useEffect(() => {
    try {
      setDb(getClientDb());
    } catch {
      // Firebase not configured, will show auth error
    }
  }, []);

  // Subscribe to user's checkins
  useEffect(() => {
    if (!user || !db) return;

    const checkinsQuery = firestoreQuery(
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
            createdAt: data.createdAt?.toDate?.() || undefined,
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
      unsubCheckins();
    };
  }, [db, user]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return meetings.filter((m) => {
      if (dayFilter !== null && m.day !== dayFilter) return false;
      if (formatFilter === "zoom" && !m.conference_url && !m.types.includes("VM")) return false;
      if (formatFilter === "in-person" && (m.conference_url || m.types.includes("VM"))) return false;
      if (typeFilter && !m.types.includes(typeFilter)) return false;
      if (q) {
        const haystack = [m.name, m.location, m.city, m.address, m.notes, m.group]
          .join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [meetings, query, dayFilter, formatFilter, typeFilter]);

  // Reset pagination when filters change
  const displayedMeetings = filtered.slice(0, (page + 1) * PAGE_SIZE);
  const hasMore = displayedMeetings.length < filtered.length;

  const resetPage = () => setPage(0);

  const allTypes: NJMeetingType[] = ["B", "ST", "TR", "M", "W", "PH", "C", "D", "MED", "O", "S", "X"];

  // Check if user has already checked in to a specific meeting today
  const alreadyCheckedInToday = (meetingId: string): boolean =>
    checkins.some((entry) => entry.meetingId === meetingId && entry.dayKey === todayKey);

  // Handle check-in for NJ meetings
  const checkIn = async (meeting: NJMeeting) => {
    if (!user) {
      setError("You must be signed in to check in.");
      return;
    }

    if (!db) {
      setError("Database not available. Please try again later.");
      return;
    }

    const meetingId = makeNJMeetingId(meeting);
    const checkinId = makeCheckinId(user.uid, meetingId, todayKey);
    const checkinRef = doc(db, "checkins", checkinId);
    
    setPendingCheckinId(meetingId);
    setError(null);

    try {
      await user.getIdToken();

      // Check if already checked in today
      const existingCheckin = checkins.find(
        (entry) => entry.meetingId === meetingId && entry.dayKey === todayKey,
      );

      if (existingCheckin) {
        throw new Error("already-checked-in");
      }

      // Create check-in document
      await setDoc(checkinRef, {
        userId: user.uid,
        meetingId: meetingId,
        meetingName: meeting.name,
        dayKey: todayKey,
        createdAt: serverTimestamp(),
      });

      setCheckinSuccessId(meetingId);
      setTimeout(() => setCheckinSuccessId(null), 600);
    } catch (err) {
      if (err instanceof Error && err.message === "already-checked-in") {
        setError(`Already checked in to ${meeting.name} today.`);
        return;
      }

      if (err instanceof FirebaseError && err.code === "permission-denied") {
        // Double-check if already exists
        try {
          const existingCheckinSnap = await getDoc(checkinRef);
          const existingCheckinData = existingCheckinSnap.data();
          if (
            existingCheckinSnap.exists()
            && existingCheckinData?.userId === user.uid
            && existingCheckinData?.meetingId === meetingId
            && existingCheckinData?.dayKey === todayKey
          ) {
            setError(`Already checked in to ${meeting.name} today.`);
            return;
          }
        } catch {
          // Ignore follow-up read failures
        }

        setError("Permission denied for this operation.");
        return;
      }

      setError("Check-in failed. Please retry.");
    } finally {
      setPendingCheckinId(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="neo-card p-12 text-center"
          >
            <Users size={48} className="mx-auto mb-4 text-[var(--black)]/30" strokeWidth={2} />
            <h1 className="neo-title text-2xl mb-2">Sign In Required</h1>
            <p className="neo-mono text-sm text-[var(--black)]/60">
              Please sign in to find meetings and track your attendance.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Error display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-4 border-black bg-[var(--coral)] p-4 mb-6"
              style={{ boxShadow: "8px 8px 0px 0px black" }}
            >
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 bg-black" />
                <span className="neo-title text-sm text-[var(--black)]">ERROR: {error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="neo-card p-6 mb-6"
          style={{ background: "var(--butter)" }}
        >
          <div className="flex items-center gap-3 mb-1">
            <div className="h-4 w-4 bg-black border-3 border-black" />
            <h1 className="neo-title text-3xl">
              Find a Meeting
            </h1>
          </div>
          <p className="neo-mono text-xs text-[var(--black)]/70 ml-7">
            {meetings.length.toLocaleString()} NJ meetings — in-person &amp; Zoom
          </p>
        </motion.div>

        {/* Search + Filters */}
        <div className="neo-card p-6 mb-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search size={16} strokeWidth={3} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--black)]" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); resetPage(); }}
              placeholder="SEARCH BY NAME, CITY, OR LOCATION..."
              className="neo-input neo-input-mint w-full pl-10"
            />
          </div>

          {/* Day filter */}
          <div>
            <p className="neo-label mb-2">DAY</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => { setDayFilter(null); resetPage(); }}
                className={`neo-mono text-xs px-3 py-1.5 border-3 border-black cursor-pointer transition-all ${
                  dayFilter === null ? "bg-black text-white" : "bg-[var(--white)] text-[var(--black)] hover:bg-[var(--cream)]"
                }`}
                style={{ boxShadow: dayFilter === null ? "none" : "4px 4px 0 0 black" }}
              >
                ALL
              </button>
              {DAY_LABELS.map((label, idx) => (
                <button
                  key={idx}
                  onClick={() => { setDayFilter(dayFilter === idx ? null : idx); resetPage(); }}
                  className={`neo-mono text-xs px-3 py-1.5 border-3 border-black cursor-pointer transition-all ${
                    dayFilter === idx ? "bg-black text-white" : "bg-[var(--white)] text-[var(--black)] hover:bg-[var(--cream)]"
                  }`}
                  style={{ boxShadow: dayFilter === idx ? "none" : "4px 4px 0 0 black" }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Format filter */}
          <div>
            <p className="neo-label mb-2">FORMAT</p>
            <div className="flex gap-1.5">
              {(["all", "in-person", "zoom"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => { setFormatFilter(f); resetPage(); }}
                  className={`neo-mono text-xs px-3 py-1.5 border-3 border-black cursor-pointer uppercase transition-all ${
                    formatFilter === f ? "bg-black text-white" : "bg-[var(--white)] text-[var(--black)] hover:bg-[var(--cream)]"
                  }`}
                  style={{ boxShadow: formatFilter === f ? "none" : "4px 4px 0 0 black" }}
                >
                  {f === "all" ? "All" : f === "in-person" ? "In-Person" : "Zoom"}
                </button>
              ))}
            </div>
          </div>

          {/* Type filter */}
          <div>
            <p className="neo-label mb-2">MEETING TYPE</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => { setTypeFilter(null); resetPage(); }}
                className={`neo-mono text-xs px-3 py-1.5 border-3 border-black cursor-pointer transition-all ${
                  typeFilter === null ? "bg-black text-white" : "bg-[var(--white)] text-[var(--black)] hover:bg-[var(--cream)]"
                }`}
                style={{ boxShadow: typeFilter === null ? "none" : "4px 4px 0 0 black" }}
              >
                ALL
              </button>
              {allTypes.map((t) => {
                const info = TYPE_INFO[t];
                const active = typeFilter === t;
                return (
                  <button
                    key={t}
                    onClick={() => { setTypeFilter(active ? null : t); resetPage(); }}
                    className="neo-mono text-xs px-3 py-1.5 border-3 border-black cursor-pointer transition-all"
                    style={{
                      background: active ? "black" : info.color,
                      color: active ? "white" : "black",
                      boxShadow: active ? "none" : "4px 4px 0 0 black",
                    }}
                  >
                    {info.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="neo-mono text-xs text-[var(--black)]">
            <span className="font-bold">{filtered.length.toLocaleString()}</span> MEETINGS FOUND
            {filtered.length !== meetings.length && (
              <span className="text-[var(--black)]/50"> (of {meetings.length.toLocaleString()})</span>
            )}
          </p>
          {(query || dayFilter !== null || formatFilter !== "all" || typeFilter !== null) && (
            <button
              onClick={() => {
                setQuery(""); setDayFilter(null); setFormatFilter("all");
                setTypeFilter(null); resetPage();
              }}
              className="neo-mono text-xs px-3 py-1 border-3 border-black bg-[var(--coral)] hover:bg-[var(--coral)]/80 cursor-pointer"
              style={{ boxShadow: "4px 4px 0 0 black" }}
            >
              CLEAR FILTERS
            </button>
          )}
        </div>

        {/* Meeting cards */}
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="neo-card p-12 text-center"
          >
            <Users size={32} className="mx-auto mb-4 text-[var(--black)]/30" strokeWidth={2} />
            <p className="neo-title text-lg text-[var(--black)]/50">NO MEETINGS FOUND</p>
            <p className="neo-mono text-xs text-[var(--black)]/30 mt-1">Try adjusting your search or filters</p>
          </motion.div>
        ) : (
          <>
            <motion.div
              layout
              className="grid gap-3 sm:grid-cols-2"
            >
              <AnimatePresence mode="popLayout">
                {displayedMeetings.map((meeting) => {
                  const meetingId = makeNJMeetingId(meeting);
                  return (
                    <MeetingCard 
                      key={meeting.slug} 
                      meeting={meeting} 
                      checkedInToday={alreadyCheckedInToday(meetingId)}
                      pendingCheckin={pendingCheckinId === meetingId}
                      showSuccess={checkinSuccessId === meetingId}
                      onCheckIn={checkIn}
                    />
                  );
                })}
              </AnimatePresence>
            </motion.div>

            {hasMore && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 text-center"
              >
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="neo-button neo-button-primary px-8 py-3"
                >
                  LOAD MORE ({filtered.length - displayedMeetings.length} remaining)
                </button>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
