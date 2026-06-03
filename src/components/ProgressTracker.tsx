/** Client-side progress tracker using localStorage */
import { useStore } from "@nanostores/preact";
import { atom } from "nanostores";
import { useEffect, useState } from "preact/hooks";

// ── Store ────────────────────────────────────────────────────────────
const STORAGE_KEY = "study_progress";

function loadProgress(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveProgress(completed: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]));
  // Dispatch custom event so other components can react
  window.dispatchEvent(new CustomEvent("progress-changed"));
}

export const $completed = atom<Set<string>>(new Set());

export function initProgress() {
  $completed.set(loadProgress());
}

export function toggleLesson(lessonId: string) {
  const current = new Set($completed.get());
  if (current.has(lessonId)) {
    current.delete(lessonId);
  } else {
    current.add(lessonId);
  }
  $completed.set(current);
  saveProgress(current);
}

export function clearModule(lessonIds: string[]) {
  const current = new Set($completed.get());
  for (const id of lessonIds) current.delete(id);
  $completed.set(current);
  saveProgress(current);
}

export function clearCourse(lessonIds: string[]) {
  const current = new Set($completed.get());
  for (const id of lessonIds) current.delete(id);
  $completed.set(current);
  saveProgress(current);
}

export function isCompleted(lessonId: string): boolean {
  return $completed.get().has(lessonId);
}

// ── Lesson completion toggle (used on lesson pages) ──────────────────
interface LessonToggleProps {
  lessonId: string;
  color: string;
}

export function LessonToggle({ lessonId, color }: LessonToggleProps) {
  const completed = useStore($completed);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initProgress();
    setReady(true);
  }, []);

  if (!ready) return null;

  const done = completed.has(lessonId);

  const colorMap: Record<string, { active: string; hover: string }> = {
    red: { active: "bg-rose-500/20 border-rose-500/40 text-rose-300", hover: "hover:border-rose-500/30" },
    blue: { active: "bg-blue-500/20 border-blue-500/40 text-blue-300", hover: "hover:border-blue-500/30" },
    purple: { active: "bg-purple-500/20 border-purple-500/40 text-purple-300", hover: "hover:border-purple-500/30" },
  };
  const c = colorMap[color] || colorMap.purple;

  return (
    <button
      onClick={() => toggleLesson(lessonId)}
      class={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
        done
          ? `${c.active}`
          : `border-zinc-700 text-zinc-400 ${c.hover} hover:text-zinc-200`
      }`}
    >
      {done ? (
        <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ) : (
        <div class="w-3.5 h-3.5 rounded-full border-2 border-current" />
      )}
      {done ? "Completed" : "Mark complete"}
    </button>
  );
}

// ── Module clear button ──────────────────────────────────────────────
interface ClearModuleProps {
  lessonIds: string[];
  label: string;
}

export function ClearButton({ lessonIds, label }: ClearModuleProps) {
  const completed = useStore($completed);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initProgress();
    setReady(true);
  }, []);

  if (!ready) return null;

  const completedCount = lessonIds.filter((id) => completed.has(id)).length;
  if (completedCount === 0) return null;

  return (
    <button
      onClick={() => {
        if (confirm(`Clear progress for ${label}? (${completedCount} lessons)`)) {
          clearModule(lessonIds);
        }
      }}
      class="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors underline"
    >
      Clear ({completedCount})
    </button>
  );
}

// ── Sidebar lesson link with completion dot ──────────────────────────
interface SidebarLessonProps {
  lessonId: string;
  href: string;
  title: string;
  isActive: boolean;
  order: number;
}

export function SidebarLesson({ lessonId, href, title, isActive, order }: SidebarLessonProps) {
  const completed = useStore($completed);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initProgress();
    setReady(true);
  }, []);

  const done = ready && completed.has(lessonId);

  return (
    <a
      href={href}
      class={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
        isActive
          ? "text-indigo-400 bg-indigo-500/10"
          : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
      }`}
    >
      {done ? (
        <svg class="w-3 h-3 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ) : (
        <span class="font-mono text-[10px] text-zinc-600 w-3 shrink-0 text-center">
          {order}
        </span>
      )}
      <span class="truncate">{title}</span>
    </a>
  );
}

// ── Module progress counter for sidebar ──────────────────────────────
interface ModuleProgressProps {
  lessonIds: string[];
}

export function ModuleProgress({ lessonIds }: ModuleProgressProps) {
  const completed = useStore($completed);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initProgress();
    setReady(true);
  }, []);

  if (!ready) return null;

  const count = lessonIds.filter((id) => completed.has(id)).length;
  if (count === 0) return null;

  return (
    <span class={`text-[10px] font-mono ml-auto shrink-0 ${
      count === lessonIds.length ? "text-emerald-500" : "text-zinc-600"
    }`}>
      {count}/{lessonIds.length}
    </span>
  );
}
