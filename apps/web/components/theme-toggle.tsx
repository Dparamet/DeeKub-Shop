"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { themeKey } from "@/lib/theme";

type Theme = "light" | "dark";
const changeEvent = "deekub-theme-change";
function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}
function subscribe(onChange: () => void) {
  const system = window.matchMedia("(prefers-color-scheme: light)");
  function refresh() {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(themeKey);
    } catch {}
    document.documentElement.dataset.theme =
      saved === "light" || saved === "dark"
        ? saved
        : system.matches
          ? "light"
          : "dark";
    onChange();
  }
  function storageChanged(event: StorageEvent) {
    if (event.key === themeKey || event.key === null) refresh();
  }
  window.addEventListener(changeEvent, onChange);
  window.addEventListener("storage", storageChanged);
  system.addEventListener("change", refresh);
  return () => {
    window.removeEventListener(changeEvent, onChange);
    window.removeEventListener("storage", storageChanged);
    system.removeEventListener("change", refresh);
  };
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, currentTheme, () => "dark");
  const label =
    theme === "dark" ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด";
  function toggle() {
    const next = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(themeKey, next);
    } catch {}
    window.dispatchEvent(new Event(changeEvent));
  }
  return (
    <button
      type="button"
      className="shop-icon theme-toggle"
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      <Sun size={20} className="theme-sun" aria-hidden="true" />
      <Moon size={20} className="theme-moon" aria-hidden="true" />
    </button>
  );
}
