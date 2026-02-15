// app/page.tsx
// Next.js (App Router) + Tailwind UI for a Telegram Mini App workout logger (UI-only, no backend).
// Drop this into a fresh Next.js project with Tailwind enabled.
// It uses Telegram theme CSS vars when available, with sensible fallbacks.

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { retrieveLaunchParams } from "@tma.js/sdk";

type Entry = {
  id: string;
  exercise: string;
  set: number;
  reps: number;
  time: string; // display time
};

function fmtTodayLabel() {
  const d = new Date();
  const fmt = d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
  });
  return `Today • ${fmt}`;
}

function uid() {
  // simple id; replace with crypto.randomUUID() if you want
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Telegram theme variables (used if running inside Telegram)
 * - --tg-theme-bg-color
 * - --tg-theme-secondary-bg-color
 * - --tg-theme-text-color
 * - --tg-theme-hint-color
 * - --tg-theme-button-color
 * - --tg-theme-button-text-color
 *
 * We map them into Tailwind with inline styles on the root container.
 */
const themeVars: React.CSSProperties = {
  background: "var(--tg-theme-bg-color, #0B0F14)",
  color: "var(--tg-theme-text-color, #E5E7EB)",
};

export default function Page() {
  const [exercise, setExercise] = useState("");
  const [setNum, setSetNum] = useState(1);
  const [reps, setReps] = useState(10);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [initData, setInitData] = useState<any>(null);

  // Edit sheet state
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editExercise, setEditExercise] = useState("");
  const [editSet, setEditSet] = useState(1);
  const [editReps, setEditReps] = useState(10);

  // Delete confirm state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const todayLabel = useMemo(() => fmtTodayLabel(), []);

  const canAdd = exercise.trim().length > 0 && setNum >= 1 && reps >= 1;
  useEffect(() => {
    try {
      const lp = retrieveLaunchParams();
      setInitData(lp);
      console.log("Launch params:", lp);
    } catch (err) {
      console.warn(
        "Not running inside Telegram, launch params unavailable:",
        err,
      );
      setInitData(null);
    }
  }, []);

  const testAuth = () => {
    fetch("https://2492-203-192-253-246.ngrok-free.app/new", {
      method: "POST",
      headers: {
        Authorization: `tma ${initData}`,
      },
    });
  };

  const exerciseChips = [
    "Bench Press",
    "Squat",
    "Deadlift",
    "Pull-up",
    "Shoulder Press",
  ];

  function addEntry() {
    if (!canAdd) return;

    const ex = exercise.trim();
    const now = new Date();
    const time = now.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });

    const newEntry: Entry = {
      id: uid(),
      exercise: ex,
      set: setNum,
      reps,
      time,
    };
    setEntries((prev) => [newEntry, ...prev]);

    // small pro UX: if previous entry is same exercise, auto increment set
    const prev = entries[0];
    if (prev && prev.exercise === ex) setSetNum((s) => s + 1);
    else setSetNum(1);

    // keep reps; clear exercise for quick logging
    setExercise("");
  }

  function openEdit(id: string) {
    const e = entries.find((x) => x.id === id);
    if (!e) return;
    setEditingId(id);
    setEditExercise(e.exercise);
    setEditSet(e.set);
    setEditReps(e.reps);
    setEditOpen(true);
  }

  function saveEdit() {
    if (!editingId) return;
    const ex = editExercise.trim();
    if (!ex) return;

    setEntries((prev) =>
      prev.map((e) =>
        e.id === editingId
          ? {
              ...e,
              exercise: ex,
              set: Math.max(1, editSet),
              reps: Math.max(1, editReps),
            }
          : e,
      ),
    );
    setEditOpen(false);
    setEditingId(null);
  }

  function openDelete(id: string) {
    setDeletingId(id);
    setDeleteOpen(true);
  }

  function confirmDelete() {
    if (!deletingId) return;
    setEntries((prev) => prev.filter((e) => e.id !== deletingId));
    setDeleteOpen(false);
    setDeletingId(null);
  }

  const deletingEntry = deletingId
    ? entries.find((e) => e.id === deletingId)
    : null;

  console.log("INITDATA", initData);
  return (
    <main style={themeVars} className="min-h-screen">
      <div
        className="
          mx-auto max-w-[520px]
          px-4 pb-24 pt-4
        "
      >
        {/* Topbar */}
        <div className="sticky top-0 z-10 -mx-4 px-4 pt-3 pb-2 backdrop-blur">
          <div
            className="absolute inset-0 -z-10"
            style={{
              background:
                "linear-gradient(to bottom, var(--tg-theme-bg-color, #0B0F14) 70%, rgba(0,0,0,0))",
            }}
          />
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[18px] font-bold tracking-tight">
                Workout Log
              </div>
              <div
                className="mt-1 text-xs"
                style={{ color: "var(--tg-theme-hint-color, #9CA3AF)" }}
              >
                {todayLabel}
              </div>
            </div>

            <button
              type="button"
              className="
                h-10 w-10 shrink-0
                rounded-full border
                bg-white/5
                active:translate-y-[1px]
              "
              style={{ borderColor: "rgba(255,255,255,.10)" }}
              aria-label="History (mock)"
              title="History (mock)"
              onClick={() => alert("export data and generate summary")}
            >
              📅
            </button>
          </div>
        </div>

        {/* Add Entry Card */}
        <SurfaceCard>
          <div>
            <Label>Exercise</Label>
            <Input
              value={exercise}
              onChange={(e) => setExercise(e.target.value)}
              placeholder="e.g., Bench Press"
            />

            <div className="mt-3 flex flex-wrap gap-2">
              {exerciseChips.map((c) => (
                <Chip key={c} onClick={() => setExercise(c)} label={c} />
              ))}
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <div className="flex-1">
              <Label>Set</Label>
              <Stepper
                value={setNum}
                onDec={() => setSetNum((v) => Math.max(1, v - 1))}
                onInc={() => setSetNum((v) => v + 1)}
              />
            </div>

            <div className="flex-1">
              <Label>Reps</Label>
              <Stepper
                value={reps}
                onDec={() => setReps((v) => Math.max(1, v - 1))}
                onInc={() => setReps((v) => v + 1)}
              />
            </div>
          </div>

          <div className="mt-4">
            <PrimaryButton disabled={!canAdd} onClick={testAuth}>
              Add Entry
            </PrimaryButton>
          </div>
        </SurfaceCard>

        {/* Entries */}
        <div
          className="mt-5 text-xs uppercase tracking-wider"
          style={{ color: "var(--tg-theme-hint-color, #9CA3AF)" }}
        >
          Entries
        </div>

        <SurfaceCard className="mt-2 p-3">
          {entries.length === 0 ? (
            <div className="py-5 text-center">
              <div className="text-xl">🏋️</div>
              <div
                className="mt-2 text-sm"
                style={{ color: "var(--tg-theme-hint-color, #9CA3AF)" }}
              >
                No entries yet. Add your first set above.
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {entries.map((e) => (
                <EntryRow
                  key={e.id}
                  entry={e}
                  onEdit={() => openEdit(e.id)}
                  onDelete={() => openDelete(e.id)}
                />
              ))}
            </div>
          )}
        </SurfaceCard>
      </div>

      {/* Edit Bottom Sheet */}
      <BottomSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit entry"
      >
        <div className="space-y-4">
          <div>
            <Label>Exercise</Label>
            <Input
              value={editExercise}
              onChange={(e) => setEditExercise(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <Label>Set</Label>
              <Stepper
                value={editSet}
                onDec={() => setEditSet((v) => Math.max(1, v - 1))}
                onInc={() => setEditSet((v) => v + 1)}
              />
            </div>
            <div className="flex-1">
              <Label>Reps</Label>
              <Stepper
                value={editReps}
                onDec={() => setEditReps((v) => Math.max(1, v - 1))}
                onInc={() => setEditReps((v) => v + 1)}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <GhostButton onClick={() => setEditOpen(false)}>Cancel</GhostButton>

            <PrimaryButton
              onClick={saveEdit}
              disabled={editExercise.trim().length === 0}
            >
              Save
            </PrimaryButton>
          </div>
        </div>
      </BottomSheet>

      {/* Delete Confirm Sheet */}
      <BottomSheet
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete entry?"
      >
        <div className="space-y-4">
          <div
            className="text-sm"
            style={{ color: "var(--tg-theme-hint-color, #9CA3AF)" }}
          >
            {deletingEntry
              ? `${deletingEntry.exercise} • Set ${deletingEntry.set} • Reps ${deletingEntry.reps}`
              : "This entry will be removed."}
          </div>

          <div className="flex gap-2 ">
            <GhostButton onClick={() => setDeleteOpen(false)}>
              Cancel
            </GhostButton>
            <DangerButton onClick={confirmDelete}>Delete</DangerButton>
          </div>
        </div>
      </BottomSheet>
    </main>
  );
}

/* ----------------------- UI primitives ----------------------- */

function SurfaceCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "mt-3 rounded-2xl border p-4 shadow-[0_10px_30px_rgba(0,0,0,.35)]",
        className,
      ].join(" ")}
      style={{
        background: "var(--tg-theme-secondary-bg-color, #111827)",
        borderColor: "rgba(255,255,255,.10)",
      }}
    >
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mb-1 text-xs"
      style={{ color: "var(--tg-theme-hint-color, #9CA3AF)" }}
    >
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "w-full rounded-xl border px-3 py-3 text-sm outline-none",
        "focus:ring-2 focus:ring-white/10",
        props.className ?? "",
      ].join(" ")}
      style={{
        borderColor: "rgba(255,255,255,.10)",
        background: "rgba(255,255,255,.03)",
        color: "var(--tg-theme-text-color, #E5E7EB)",
      }}
    />
  );
}

function Chip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border bg-white/5 px-3 py-2 text-xs active:translate-y-[1px]"
      style={{ borderColor: "rgba(255,255,255,.10)" }}
    >
      {label}
    </button>
  );
}

function Stepper({
  value,
  onDec,
  onInc,
}: {
  value: number;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="h-11 w-11 rounded-xl border bg-white/5 text-lg active:translate-y-[1px]"
        style={{ borderColor: "rgba(255,255,255,.10)" }}
        onClick={onDec}
        aria-label="decrease"
      >
        −
      </button>

      <div
        className="flex-1 rounded-xl border py-[10px] text-center text-sm font-semibold"
        style={{
          borderColor: "rgba(255,255,255,.10)",
          background: "rgba(255,255,255,.03)",
        }}
      >
        {value}
      </div>

      <button
        type="button"
        className="h-11 w-11 rounded-xl border bg-white/5 text-lg active:translate-y-[1px]"
        style={{ borderColor: "rgba(255,255,255,.10)" }}
        onClick={onInc}
        aria-label="increase"
      >
        +
      </button>
    </div>
  );
}

function PrimaryButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="w-full rounded-[14px] px-4 py-3 text-sm font-extrabold active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60"
      style={{
        background: "var(--tg-theme-button-color, #3B82F6)",
        color: "var(--tg-theme-button-text-color, #FFFFFF)",
      }}
    >
      {children}
    </button>
  );
}

function GhostButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-[14px] border bg-white/5 px-4 py-3 text-sm font-bold active:translate-y-[1px]"
      style={{ borderColor: "rgba(255,255,255,.10)" }}
    >
      {children}
    </button>
  );
}

function DangerButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-[14px] px-4 py-3 text-sm font-extrabold text-white active:translate-y-[1px]"
      style={{ background: "#EF4444" }}
    >
      {children}
    </button>
  );
}

function EntryRow({
  entry,
  onEdit,
  onDelete,
}: {
  entry: Entry;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="flex items-start justify-between gap-3 rounded-2xl border p-3"
      style={{
        borderColor: "rgba(255,255,255,.10)",
        background: "rgba(255,255,255,.02)",
      }}
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-extrabold">{entry.exercise}</div>
        <div
          className="mt-1 text-[13px]"
          style={{ color: "var(--tg-theme-hint-color, #9CA3AF)" }}
        >
          Set {entry.set} • Reps {entry.reps} • {entry.time}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="h-10 w-10 rounded-xl border bg-white/5 active:translate-y-[1px]"
          style={{ borderColor: "rgba(255,255,255,.10)" }}
          aria-label="Edit"
          title="Edit"
        >
          ✏️
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="h-10 w-10 rounded-xl border active:translate-y-[1px]"
          style={{
            borderColor: "rgba(239,68,68,.50)",
            background: "rgba(239,68,68,.12)",
          }}
          aria-label="Delete"
          title="Delete"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        // close if clicking overlay
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ background: "rgba(0,0,0,.55)" }}
    >
      <div
        className="w-full max-w-[520px] rounded-t-[18px] border p-4 shadow-[0_10px_30px_rgba(0,0,0,.35)]"
        style={{
          background: "var(--tg-theme-secondary-bg-color, #111827)",
          borderColor: "rgba(255,255,255,.10)",
        }}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/20" />
        <div className="mb-3 text-base font-extrabold">{title}</div>
        {children}
      </div>
    </div>
  );
}
