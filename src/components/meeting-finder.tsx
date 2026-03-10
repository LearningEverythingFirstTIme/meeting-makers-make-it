"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Clock, Video, Phone, Users, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Navigation } from "@/components/navigation";
import type { NJMeeting, NJMeetingType } from "@/types";

const DAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const TYPE_INFO: Record<NJMeetingType, { label: string; color: string }> = {
  B:  { label: "Big Book",    color: "var(--butter)" },
  ST: { label: "Step",        color: "var(--mint)" },
  TR: { label: "Traditions",  color: "var(--sky)" },
  M:  { label: "Men",         color: "var(--lavender)" },
  W:  { label: "Women",       color: "var(--pink)" },
  VM: { label: "Virtual",     color: "var(--coral)" },
  PH: { label: "Phone",       color: "var(--lime)" },
};

function timeLabel(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function MeetingCard({ meeting }: { meeting: NJMeeting }) {
  const [expanded, setExpanded] = useState(false);
  const isZoom = meeting.types.includes("VM") || !!meeting.conference_url;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className="neo-card bg-white overflow-hidden"
    >
      <div
        className="p-4 cursor-pointer select-none"
        onClick={() => setExpanded((e) => !e)}
      >
        {/* Top row: day chip + time + expand toggle */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="neo-mono text-xs px-2 py-0.5 border-2 border-black font-bold"
              style={{ background: "var(--butter)" }}
            >
              {DAY_LABELS[meeting.day]}
            </span>
            <span className="flex items-center gap-1 neo-mono text-xs text-black">
              <Clock size={12} strokeWidth={3} />
              {timeLabel(meeting.time)}
            </span>
            {isZoom ? (
              <span
                className="flex items-center gap-1 neo-mono text-xs px-2 py-0.5 border-2 border-black"
                style={{ background: "var(--coral)", color: "black" }}
              >
                <Video size={10} strokeWidth={3} /> ZOOM
              </span>
            ) : (
              <span
                className="flex items-center gap-1 neo-mono text-xs px-2 py-0.5 border-2 border-black"
                style={{ background: "var(--mint)", color: "black" }}
              >
                <MapPin size={10} strokeWidth={3} /> IN-PERSON
              </span>
            )}
          </div>
          <div className="shrink-0 text-black">
            {expanded ? <ChevronUp size={16} strokeWidth={3} /> : <ChevronDown size={16} strokeWidth={3} />}
          </div>
        </div>

        {/* Meeting name */}
        <p className="font-['Archivo_Black'] text-sm text-black leading-snug mb-2">
          {meeting.name}
        </p>

        {/* City line */}
        {meeting.city && (
          <p className="neo-mono text-xs text-black/60">{meeting.city}, {meeting.state}</p>
        )}

        {/* Type badges */}
        {meeting.types.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {meeting.types.filter(t => t !== "VM").map((t) => {
              const info = TYPE_INFO[t];
              if (!info) return null;
              return (
                <span
                  key={t}
                  className="neo-mono text-xs px-1.5 py-0.5 border-2 border-black"
                  style={{ background: info.color }}
                >
                  {info.label}
                </span>
              );
            })}
          </div>
        )}
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
              {meeting.conference_url && (
                <div className="flex items-start gap-2">
                  <Video size={13} strokeWidth={3} className="mt-0.5 shrink-0" />
                  <a
                    href={meeting.conference_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="neo-mono text-xs text-black underline flex items-center gap-1 hover:text-[var(--coral)]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Join Zoom Meeting <ExternalLink size={10} />
                  </a>
                </div>
              )}
              {meeting.types.includes("PH") && (
                <div className="flex items-center gap-2">
                  <Phone size={13} strokeWidth={3} />
                  <span className="neo-mono text-xs">Phone Meeting</span>
                </div>
              )}
              {meeting.notes && (
                <p className="neo-mono text-xs text-black/70 border-t-2 border-black/20 pt-2">
                  {meeting.notes}
                </p>
              )}
              {meeting.wheelchair && (
                <span className="neo-mono text-xs px-2 py-0.5 border-2 border-black bg-[var(--sky)] inline-block">
                  ♿ WHEELCHAIR ACCESSIBLE
                </span>
              )}
              {meeting.group && (
                <p className="neo-mono text-xs text-black/50">Group: {meeting.group}</p>
              )}
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
  const [query, setQuery] = useState("");
  const [dayFilter, setDayFilter] = useState<number | null>(null);
  const [formatFilter, setFormatFilter] = useState<"all" | "in-person" | "zoom">("all");
  const [typeFilter, setTypeFilter] = useState<NJMeetingType | null>(null);
  const [page, setPage] = useState(0);

  const PAGE_SIZE = 30;

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

  const allTypes: NJMeetingType[] = ["B", "ST", "TR", "M", "W", "PH"];

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="neo-card p-6 mb-6"
          style={{ background: "var(--butter)" }}
        >
          <div className="flex items-center gap-3 mb-1">
            <div className="h-4 w-4 bg-black border-2 border-black" />
            <h1 className="font-['Archivo_Black'] text-3xl text-black uppercase tracking-tight">
              Find a Meeting
            </h1>
          </div>
          <p className="neo-mono text-xs text-black/70 ml-7">
            {meetings.length.toLocaleString()} NJ meetings — in-person &amp; Zoom
          </p>
        </motion.div>

        {/* Search + Filters */}
        <div className="neo-card p-5 mb-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search size={16} strokeWidth={3} className="absolute left-3 top-1/2 -translate-y-1/2 text-black" />
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
                  dayFilter === null ? "bg-black text-white" : "bg-white text-black hover:bg-[var(--cream)]"
                }`}
                style={{ boxShadow: dayFilter === null ? "none" : "3px 3px 0 0 black" }}
              >
                ALL
              </button>
              {DAY_LABELS.map((label, idx) => (
                <button
                  key={idx}
                  onClick={() => { setDayFilter(dayFilter === idx ? null : idx); resetPage(); }}
                  className={`neo-mono text-xs px-3 py-1.5 border-3 border-black cursor-pointer transition-all ${
                    dayFilter === idx ? "bg-black text-white" : "bg-white text-black hover:bg-[var(--cream)]"
                  }`}
                  style={{ boxShadow: dayFilter === idx ? "none" : "3px 3px 0 0 black" }}
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
                    formatFilter === f ? "bg-black text-white" : "bg-white text-black hover:bg-[var(--cream)]"
                  }`}
                  style={{ boxShadow: formatFilter === f ? "none" : "3px 3px 0 0 black" }}
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
                  typeFilter === null ? "bg-black text-white" : "bg-white text-black hover:bg-[var(--cream)]"
                }`}
                style={{ boxShadow: typeFilter === null ? "none" : "3px 3px 0 0 black" }}
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
                      boxShadow: active ? "none" : "3px 3px 0 0 black",
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
          <p className="neo-mono text-xs text-black">
            <span className="font-bold">{filtered.length.toLocaleString()}</span> MEETINGS FOUND
            {filtered.length !== meetings.length && (
              <span className="text-black/50"> (of {meetings.length.toLocaleString()})</span>
            )}
          </p>
          {(query || dayFilter !== null || formatFilter !== "all" || typeFilter !== null) && (
            <button
              onClick={() => {
                setQuery(""); setDayFilter(null); setFormatFilter("all");
                setTypeFilter(null); resetPage();
              }}
              className="neo-mono text-xs px-3 py-1 border-3 border-black bg-[var(--coral)] hover:bg-[var(--coral)]/80 cursor-pointer"
              style={{ boxShadow: "2px 2px 0 0 black" }}
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
            <Users size={32} className="mx-auto mb-4 text-black/30" strokeWidth={2} />
            <p className="font-['Archivo_Black'] text-lg text-black/50">NO MEETINGS FOUND</p>
            <p className="neo-mono text-xs text-black/30 mt-1">Try adjusting your search or filters</p>
          </motion.div>
        ) : (
          <>
            <motion.div
              layout
              className="grid gap-3 sm:grid-cols-2"
            >
              <AnimatePresence mode="popLayout">
                {displayedMeetings.map((meeting) => (
                  <MeetingCard key={meeting.slug} meeting={meeting} />
                ))}
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
