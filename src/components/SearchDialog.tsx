import { useState, useEffect, useRef } from "preact/hooks";

interface SearchEntry {
  title: string;
  slug: string;
  section: string;
  preview: string;
  href: string;
}

export default function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchEntry[]>([]);
  const [index, setIndex] = useState<SearchEntry[]>([]);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load index on first open
  useEffect(() => {
    if (open && index.length === 0) {
      fetch("/search-index.json")
        .then((r) => r.json())
        .then((data) => setIndex(data))
        .catch(() => {});
    }
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  // Filter on query change
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelected(0);
      return;
    }
    const q = query.toLowerCase();
    const matched = index.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.preview.toLowerCase().includes(q)
    );
    setResults(matched.slice(0, 20));
    setSelected(0);
  }, [query, index]);

  // Keyboard shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Search trigger button
  useEffect(() => {
    const trigger = document.getElementById("search-trigger");
    if (trigger) {
      trigger.addEventListener("click", () => setOpen(true));
    }
  }, []);

  function navigate(href: string) {
    setOpen(false);
    setQuery("");
    window.location.href = href;
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && results[selected]) {
      navigate(results[selected].href);
    }
  }

  if (!open) return null;

  const sectionColors: Record<string, string> = {
    reference: "text-indigo-400",
    journal: "text-amber-400",
    templates: "text-purple-400",
    roadmap: "text-emerald-400",
  };

  return (
    <div
      class="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={() => setOpen(false)}
    >
      <div class="fixed inset-0 bg-black/60" />
      <div
        class="relative w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div class="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
          <svg
            class="w-5 h-5 text-zinc-500 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width={2}
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
            onKeyDown={onKeyDown}
            placeholder="Search content..."
            class="flex-1 bg-transparent text-white placeholder:text-zinc-500 outline-none text-sm"
          />
          <kbd class="text-[10px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">
            ESC
          </kbd>
        </div>

        {results.length > 0 && (
          <div class="max-h-80 overflow-y-auto py-2">
            {results.map((r, i) => (
              <button
                key={r.href}
                onClick={() => navigate(r.href)}
                class={`w-full text-left px-4 py-2.5 flex items-start gap-3 transition-colors ${
                  i === selected
                    ? "bg-zinc-800"
                    : "hover:bg-zinc-800/50"
                }`}
              >
                <span
                  class={`text-[10px] font-mono uppercase tracking-wider mt-0.5 shrink-0 ${
                    sectionColors[r.section] || "text-zinc-500"
                  }`}
                >
                  {r.section}
                </span>
                <div class="min-w-0">
                  <div class="text-sm text-zinc-200 truncate">{r.title}</div>
                  <div class="text-xs text-zinc-500 truncate mt-0.5">
                    {r.preview}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {query && results.length === 0 && (
          <div class="px-4 py-8 text-center text-sm text-zinc-500">
            No results for "{query}"
          </div>
        )}

        {!query && (
          <div class="px-4 py-6 text-center text-sm text-zinc-600">
            Type to search across all content
          </div>
        )}
      </div>
    </div>
  );
}
