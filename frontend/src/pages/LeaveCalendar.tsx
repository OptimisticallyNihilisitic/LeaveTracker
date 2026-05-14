import { useState, useMemo, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { selectMyLeaves, selectLeavesStatus, fetchMyLeaves, invalidateLeaves } from "../store/leavesSlice";
import { useAuth } from "../context/AuthContext";
import { getHolidays } from "../api/admin";
import type { LeaveRequest, Holiday } from "../types";

// ─── Types ────────────────────────────────────────────────────────────────────

type LeaveTypeFilter = "all" | "casual" | "sick" | "floater";

interface DayInfo {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  leaves: LeaveRequest[];
  holidays: Holiday[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TYPE_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string; border: string }> = {
  casual:  { label: "Casual",  dot: "bg-emerald-400", bg: "bg-emerald-50",  text: "text-emerald-700", border: "border-emerald-200" },
  sick:    { label: "Sick",    dot: "bg-rose-400",    bg: "bg-rose-50",     text: "text-rose-700",    border: "border-rose-200"    },
  floater: { label: "Floater", dot: "bg-amber-400",   bg: "bg-amber-50",    text: "text-amber-700",   border: "border-amber-200"   },
};

const STATUS_BADGE: Record<string, string> = {
  pending_manager: "bg-amber-100 text-amber-700",
  pending_hr:      "bg-fuchsia-100 text-fuchsia-700",
  approved:        "bg-emerald-100 text-emerald-700",
};

const STATUS_LABEL: Record<string, string> = {
  pending_manager: "Pending (Manager)",
  pending_hr:      "Pending (HR)",
  approved:        "Approved",
};

// Statuses that should appear on the calendar
const VISIBLE_STATUSES = new Set(["approved", "pending_manager", "pending_hr"]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildCalendarDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const days: Date[] = [];
  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push(new Date(year, month, 1 - (firstDay.getDay() - i)));
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(year, month + 1, i));
    }
  }
  return days;
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateFull(d: Date): string {
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
}

function formatDateShort(s: string): string {
  return new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function isPending(status: string) {
  return status === "pending_manager" || status === "pending_hr";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-7 gap-1">
      {DAYS_OF_WEEK.map((d) => (
        <div key={d} className="text-center text-xs font-bold uppercase tracking-wider text-slate-400 py-2">{d}</div>
      ))}
      {Array.from({ length: 35 }).map((_, i) => (
        <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />
      ))}
    </div>
  );
}

function DayCell({
  info,
  isSelected,
  onClick,
}: {
  info: DayInfo;
  isSelected: boolean;
  onClick: () => void;
}) {
  const hasLeaves   = info.leaves.length > 0;
  const hasHolidays = info.holidays.length > 0;
  const hasPending  = info.leaves.some((l) => isPending(l.status));

  return (
    <button
      onClick={onClick}
      className={`
        relative min-h-[5rem] rounded-xl border p-2 text-left transition-all duration-150 w-full
        ${!info.isCurrentMonth ? "bg-slate-50 border-transparent opacity-40" : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"}
        ${isSelected ? "ring-2 ring-blue-400 border-blue-300 shadow-sm" : ""}
        ${(hasLeaves || hasHolidays) && info.isCurrentMonth ? "shadow-sm" : ""}
      `}
    >
      {/* Date number */}
      <span className={`
        text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full
        ${info.isToday ? "bg-blue-500 text-white" : info.isCurrentMonth ? "text-slate-700" : "text-slate-400"}
      `}>
        {info.date.getDate()}
      </span>

      {/* Pending indicator dot */}
      {hasPending && info.isCurrentMonth && (
        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white" title="Pending leave" />
      )}

      <div className="mt-1 space-y-0.5">
        {/* Holiday pills */}
        {info.holidays.slice(0, 2).map((h, i) => (
          <div
            key={`h-${i}`}
            className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 ${h.is_floater ? "bg-violet-50 text-violet-700" : "bg-red-50 text-red-700"}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${h.is_floater ? "bg-violet-400" : "bg-red-400"}`} />
            <span className="text-[10px] font-semibold truncate leading-tight">{h.name}</span>
          </div>
        ))}

        {/* Leave pills */}
        {info.leaves.slice(0, 2).map((leave, i) => {
          const cfg = TYPE_CONFIG[leave.leave_type] ?? { dot: "bg-slate-400", bg: "bg-slate-50", text: "text-slate-600" };
          return (
            <div
              key={`l-${i}`}
              className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 ${cfg.bg} ${cfg.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
              <span className="text-[10px] font-semibold capitalize truncate leading-tight">
                {leave.leave_type}
                {isPending(leave.status) && " · Pending"}
              </span>
            </div>
          );
        })}

        {/* Overflow */}
        {(info.leaves.length + info.holidays.length) > 4 && (
          <div className="text-[10px] text-slate-400 pl-1">+{info.leaves.length + info.holidays.length - 4} more</div>
        )}
      </div>
    </button>
  );
}

function DayPopover({
  date,
  leaves,
  holidays,
  onClose,
}: {
  date: Date;
  leaves: LeaveRequest[];
  holidays: Holiday[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Details</p>
            <p className="font-bold text-slate-800 mt-0.5">{formatDateFull(date)}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
          {/* Holiday entries */}
          {holidays.map((h) => (
            <div key={h.id} className="px-5 py-3.5 flex items-center gap-3">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${h.is_floater ? "bg-violet-400" : "bg-red-400"}`} />
              <div>
                <p className="font-semibold text-slate-800 text-sm">{h.name}</p>
                <p className={`text-xs font-medium mt-0.5 ${h.is_floater ? "text-violet-600" : "text-red-600"}`}>
                  {h.is_floater ? "Floater Holiday" : "Mandatory Holiday"}
                </p>
              </div>
            </div>
          ))}

          {/* Leave entries */}
          {leaves.map((leave) => {
            const cfg = TYPE_CONFIG[leave.leave_type];
            const pending = isPending(leave.status);
            return (
              <div key={leave.id} className="px-5 py-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg?.dot ?? "bg-slate-400"}`} />
                    <span className="font-semibold text-slate-800 capitalize">{leave.leave_type} Leave</span>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[leave.status] ?? "bg-slate-100 text-slate-500"}`}>
                    {pending ? (
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
                        {STATUS_LABEL[leave.status]}
                      </span>
                    ) : (STATUS_LABEL[leave.status] ?? leave.status)}
                  </span>
                </div>
                <div className="text-sm text-slate-500 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{formatDateShort(leave.start_date)} – {formatDateShort(leave.end_date)}</span>
                    <span className="text-slate-400">·</span>
                    <span className="font-semibold text-slate-700">{leave.days} day{leave.days !== 1 ? "s" : ""}</span>
                  </div>
                  {leave.reason && (
                    <div className="flex items-start gap-1.5">
                      <svg className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      <span className="italic text-slate-500">{leave.reason}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LeaveCalendar() {
  const { token } = useAuth();
  const dispatch   = useAppDispatch();
  const allLeaves  = useAppSelector(selectMyLeaves);
  const status     = useAppSelector(selectLeavesStatus);
  const loading    = status === "loading";

  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [holidaysLoading, setHolidaysLoading] = useState(true);

  const now = new Date();
  const [viewYear,  setViewYear]  = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [typeFilter, setTypeFilter] = useState<LeaveTypeFilter>("all");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Fetch org-wide holidays once
  useEffect(() => {
    if (!token) return;
    getHolidays(token)
      .then(setHolidays)
      .catch(console.error)
      .finally(() => setHolidaysLoading(false));
  }, [token]);

  // Only approved + pending leaves (no rejected / cancelled)
  const visibleLeaves = useMemo(
    () => allLeaves.filter((l) => VISIBLE_STATUSES.has(l.status)),
    [allLeaves]
  );

  // Build Map<dateKey, LeaveRequest[]> for fast lookup
  const dayLeaveMap = useMemo(() => {
    const map = new Map<string, LeaveRequest[]>();
    const filtered = typeFilter === "all" ? visibleLeaves : visibleLeaves.filter((l) => l.leave_type === typeFilter);
    for (const leave of filtered) {
      const start  = new Date(leave.start_date);
      const end    = new Date(leave.end_date);
      const cursor = new Date(start);
      while (cursor <= end) {
        const key = toDateKey(cursor);
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(leave);
        cursor.setDate(cursor.getDate() + 1);
      }
    }
    return map;
  }, [visibleLeaves, typeFilter]);

  // Build Map<dateKey, Holiday[]> for fast lookup
  const dayHolidayMap = useMemo(() => {
    const map = new Map<string, Holiday[]>();
    for (const h of holidays) {
      // Normalize: "YYYY-MM-DD" from server might include time
      const key = h.date.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(h);
    }
    return map;
  }, [holidays]);

  // Build calendar grid
  const calendarDays: DayInfo[] = useMemo(() => {
    const days = buildCalendarDays(viewYear, viewMonth);
    const todayKey = toDateKey(now);
    return days.map((date) => {
      const key = toDateKey(date);
      return {
        date,
        isCurrentMonth: date.getMonth() === viewMonth,
        isToday: key === todayKey,
        leaves:   dayLeaveMap.get(key)   ?? [],
        holidays: dayHolidayMap.get(key) ?? [],
      };
    });
  }, [viewYear, viewMonth, dayLeaveMap, dayHolidayMap]);

  const goToPrev = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
    setSelectedDate(null);
  };
  const goToNext = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
    setSelectedDate(null);
  };
  const goToToday = () => {
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setSelectedDate(null);
  };

  const handleRefresh = () => {
    if (!token) return;
    dispatch(invalidateLeaves());
    dispatch(fetchMyLeaves({ token, force: true }));
    setHolidaysLoading(true);
    getHolidays(token).then(setHolidays).catch(console.error).finally(() => setHolidaysLoading(false));
  };

  const selectedDateObj    = selectedDate ? new Date(selectedDate + "T00:00:00") : null;
  const selectedLeaves     = selectedDate ? (dayLeaveMap.get(selectedDate)   ?? []) : [];
  const selectedHolidays   = selectedDate ? (dayHolidayMap.get(selectedDate) ?? []) : [];

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const filterTabs: { key: LeaveTypeFilter; label: string }[] = [
    { key: "all",     label: "All"     },
    { key: "casual",  label: "Casual"  },
    { key: "sick",    label: "Sick"    },
    { key: "floater", label: "Floater" },
  ];

  const isPageLoading = loading || holidaysLoading;

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Leave Calendar</h2>
          <p className="text-sm text-slate-500 mt-0.5">Approved &amp; pending leaves · Organisation holidays</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isPageLoading}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-800 border border-slate-200 hover:border-slate-300 px-4 py-2 rounded-xl transition-colors bg-white hover:bg-slate-50 disabled:opacity-50 shadow-sm"
        >
          <svg className={`w-4 h-4 ${isPageLoading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isPageLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">

        {/* ── Controls row ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

          {/* Month navigation */}
          <div className="flex items-center gap-2">
            <button onClick={goToPrev} className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-colors shadow-sm">
              <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-base font-bold text-slate-800 min-w-[150px] text-center">{monthLabel}</span>
            <button onClick={goToNext} className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-colors shadow-sm">
              <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button onClick={goToToday} className="ml-1 text-xs font-semibold text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
              Today
            </button>
          </div>

          {/* Leave type filter tabs */}
          <div className="flex gap-1.5 bg-slate-100 rounded-xl p-1 self-start sm:self-auto">
            {filterTabs.map(({ key, label }) => {
              const cfg = key !== "all" ? TYPE_CONFIG[key] : null;
              return (
                <button
                  key={key}
                  onClick={() => { setTypeFilter(key); setSelectedDate(null); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    typeFilter === key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {cfg && <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />}
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Calendar grid ── */}
        {isPageLoading ? (
          <SkeletonGrid />
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {DAYS_OF_WEEK.map((d) => (
              <div key={d} className="text-center text-xs font-bold uppercase tracking-wider text-slate-400 py-2">
                {d}
              </div>
            ))}
            {calendarDays.map((info) => {
              const key = toDateKey(info.date);
              return (
                <DayCell
                  key={key}
                  info={info}
                  isSelected={selectedDate === key}
                  onClick={() => {
                    if (!info.isCurrentMonth) return;
                    setSelectedDate(selectedDate === key ? null : key);
                  }}
                />
              );
            })}
          </div>
        )}

        {/* ── Legend ── */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100">
          {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
            <div key={type} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
              <span className="text-xs text-slate-500 font-medium capitalize">{cfg.label} Leave</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="text-xs text-slate-500 font-medium">Mandatory Holiday</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-400" />
            <span className="text-xs text-slate-500 font-medium">Floater Holiday</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-xs text-slate-500 font-medium">Pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-[8px] text-white font-bold">T</span>
            </span>
            <span className="text-xs text-slate-500 font-medium">Today</span>
          </div>
        </div>
      </div>

      {/* ── Popover ── */}
      {selectedDate && (selectedLeaves.length > 0 || selectedHolidays.length > 0) && selectedDateObj && (
        <DayPopover
          date={selectedDateObj}
          leaves={selectedLeaves}
          holidays={selectedHolidays}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}
