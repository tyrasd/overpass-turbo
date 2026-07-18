// Light/dark theme handling.
// Bulma derives its colors from a `data-theme` attribute on the document
// element. Its `[data-theme=…]` rules are declared after the
// `prefers-color-scheme` block, so an explicit attribute always wins over the
// OS preference, and "auto" simply follows the media query.
import settings from "./settings";

export type Theme = "auto" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
const listeners: ((theme: ResolvedTheme) => void)[] = [];

export function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === "light" || theme === "dark") return theme;
  return prefersDark.matches ? "dark" : "light";
}

export function applyTheme(theme: Theme = settings.theme as Theme) {
  const resolved = resolveTheme(theme);
  document.documentElement.dataset.theme = resolved;
  listeners.forEach((callback) => callback(resolved));
}

// For components that cannot follow the theme through CSS alone, i.e.
// CodeMirror, which selects its theme via a JS option. The callback fires
// immediately with the current theme so callers can use it to initialize.
export function onThemeChange(callback: (theme: ResolvedTheme) => void) {
  listeners.push(callback);
  callback(resolveTheme(settings.theme as Theme));
}

prefersDark.addEventListener("change", () => {
  if (settings.theme === "auto") applyTheme("auto");
});
