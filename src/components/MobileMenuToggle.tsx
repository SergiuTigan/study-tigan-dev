import { useState } from "preact/hooks";

export default function MobileMenuToggle() {
  const [open, setOpen] = useState(false);

  function toggle() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    if (!sidebar || !overlay) return;

    const next = !open;
    setOpen(next);

    if (next) {
      sidebar.classList.remove("-translate-x-full");
      sidebar.classList.add("translate-x-0");
      overlay.classList.remove("hidden");
    } else {
      sidebar.classList.add("-translate-x-full");
      sidebar.classList.remove("translate-x-0");
      overlay.classList.add("hidden");
    }
  }

  // Close sidebar when overlay clicked
  if (typeof document !== "undefined") {
    const overlay = document.getElementById("sidebar-overlay");
    overlay?.addEventListener("click", () => {
      if (open) toggle();
    });
  }

  return (
    <button
      onClick={toggle}
      class="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
      aria-label="Toggle menu"
    >
      <svg
        class="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width={2}
      >
        {open ? (
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        ) : (
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M4 6h16M4 12h16M4 18h16"
          />
        )}
      </svg>
    </button>
  );
}
