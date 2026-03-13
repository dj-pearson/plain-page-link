import { useState, useEffect, useCallback, useRef } from "react";
import {
  Accessibility,
  X,
  ZoomIn,
  ZoomOut,
  Contrast,
  MousePointer,
  Underline,
  Focus,
  RotateCcw,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFocusTrap, useEscapeKey } from "@/hooks/useAccessibility";

interface A11yPreferences {
  textScale: number;
  highContrast: boolean;
  underlineLinks: boolean;
  focusHighlight: boolean;
  reducedMotion: boolean;
}

const STORAGE_KEY = "agentbio-a11y-preferences";
const TEXT_SCALES = [100, 125, 150, 175, 200];

function loadPreferences(): A11yPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore parse errors
  }
  return {
    textScale: 100,
    highContrast: false,
    underlineLinks: false,
    focusHighlight: false,
    reducedMotion: false,
  };
}

function savePreferences(prefs: A11yPreferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore storage errors
  }
}

function applyPreferences(prefs: A11yPreferences) {
  const root = document.documentElement;

  // Text scale
  TEXT_SCALES.forEach((scale) => {
    root.classList.remove(`a11y-text-scale-${scale}`);
  });
  if (prefs.textScale !== 100) {
    root.classList.add(`a11y-text-scale-${prefs.textScale}`);
  }

  // High contrast
  root.classList.toggle("a11y-high-contrast", prefs.highContrast);

  // Underline links
  root.classList.toggle("a11y-underline-links", prefs.underlineLinks);

  // Focus highlight
  root.classList.toggle("a11y-focus-highlight", prefs.focusHighlight);

  // Reduced motion
  if (prefs.reducedMotion) {
    root.style.setProperty("--a11y-reduced-motion", "reduce");
    root.classList.add("a11y-reduced-motion");
  } else {
    root.style.removeProperty("--a11y-reduced-motion");
    root.classList.remove("a11y-reduced-motion");
  }
}

/**
 * AccessibilityWidget Component
 *
 * A floating accessibility toolbar that allows users to customize their
 * viewing experience. Persists preferences to localStorage.
 *
 * Features:
 * - Text size scaling (100%-200%) - WCAG 1.4.4 Resize Text
 * - High contrast mode - WCAG 1.4.3 Contrast
 * - Underline links - WCAG 1.4.1 Use of Color
 * - Enhanced focus indicators - WCAG 2.4.7 Focus Visible
 * - Reduced motion - WCAG 2.3.3 Animation from Interactions
 *
 * @example
 * // In App.tsx
 * <AccessibilityWidget />
 */
export function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [prefs, setPrefs] = useState<A11yPreferences>(loadPreferences);
  const [announcement, setAnnouncement] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  useFocusTrap(panelRef as React.RefObject<HTMLElement>, isOpen);
  useEscapeKey(() => setIsOpen(false), isOpen);

  // Apply preferences on mount and when they change
  useEffect(() => {
    applyPreferences(prefs);
    savePreferences(prefs);
  }, [prefs]);

  const announce = useCallback((message: string) => {
    setAnnouncement(message);
    setTimeout(() => setAnnouncement(""), 1500);
  }, []);

  const updatePref = useCallback(
    <K extends keyof A11yPreferences>(key: K, value: A11yPreferences[K], label: string) => {
      setPrefs((prev) => ({ ...prev, [key]: value }));
      announce(label);
    },
    [announce]
  );

  const increaseTextSize = useCallback(() => {
    setPrefs((prev) => {
      const idx = TEXT_SCALES.indexOf(prev.textScale);
      const next = idx < TEXT_SCALES.length - 1 ? TEXT_SCALES[idx + 1] : prev.textScale;
      if (next !== prev.textScale) {
        announce(`Text size increased to ${next}%`);
      }
      return { ...prev, textScale: next };
    });
  }, [announce]);

  const decreaseTextSize = useCallback(() => {
    setPrefs((prev) => {
      const idx = TEXT_SCALES.indexOf(prev.textScale);
      const next = idx > 0 ? TEXT_SCALES[idx - 1] : prev.textScale;
      if (next !== prev.textScale) {
        announce(`Text size decreased to ${next}%`);
      }
      return { ...prev, textScale: next };
    });
  }, [announce]);

  const resetAll = useCallback(() => {
    const defaults: A11yPreferences = {
      textScale: 100,
      highContrast: false,
      underlineLinks: false,
      focusHighlight: false,
      reducedMotion: false,
    };
    setPrefs(defaults);
    announce("All accessibility settings reset to defaults");
  }, [announce]);

  const hasChanges =
    prefs.textScale !== 100 ||
    prefs.highContrast ||
    prefs.underlineLinks ||
    prefs.focusHighlight ||
    prefs.reducedMotion;

  return (
    <>
      {/* Screen reader announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-20 md:bottom-6 right-4 z-[90]",
          "w-12 h-12 rounded-full shadow-lg",
          "bg-blue-600 text-white hover:bg-blue-700",
          "flex items-center justify-center",
          "transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
          hasChanges && "ring-2 ring-orange-400 ring-offset-2"
        )}
        aria-label={isOpen ? "Close accessibility settings" : "Open accessibility settings"}
        aria-expanded={isOpen}
        aria-controls="a11y-widget-panel"
      >
        {isOpen ? (
          <X className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Accessibility className="h-5 w-5" aria-hidden="true" />
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          id="a11y-widget-panel"
          role="dialog"
          aria-label="Accessibility settings"
          aria-modal="true"
          className={cn(
            "fixed bottom-36 md:bottom-20 right-4 z-[90]",
            "w-80 max-h-[70vh] overflow-y-auto",
            "bg-white dark:bg-gray-900 rounded-xl shadow-2xl",
            "border border-gray-200 dark:border-gray-700",
            "p-4"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Accessibility Settings
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Close accessibility settings"
            >
              <X className="h-4 w-4 text-gray-500" aria-hidden="true" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Text Size */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300" id="text-size-label">
                Text Size: {prefs.textScale}%
              </label>
              <div
                className="flex items-center gap-2"
                role="group"
                aria-labelledby="text-size-label"
              >
                <button
                  onClick={decreaseTextSize}
                  disabled={prefs.textScale <= 100}
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-lg border",
                    "transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                    prefs.textScale <= 100
                      ? "border-gray-200 text-gray-300 cursor-not-allowed"
                      : "border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                  )}
                  aria-label="Decrease text size"
                >
                  <ZoomOut className="h-4 w-4" aria-hidden="true" />
                </button>

                {/* Visual scale indicator */}
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden" role="presentation">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-200"
                    style={{ width: `${((prefs.textScale - 100) / 100) * 100}%` }}
                  />
                </div>

                <button
                  onClick={increaseTextSize}
                  disabled={prefs.textScale >= 200}
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-lg border",
                    "transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                    prefs.textScale >= 200
                      ? "border-gray-200 text-gray-300 cursor-not-allowed"
                      : "border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                  )}
                  aria-label="Increase text size"
                >
                  <ZoomIn className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Toggle Options */}
            <div className="space-y-2">
              <ToggleOption
                icon={<Contrast className="h-4 w-4" aria-hidden="true" />}
                label="High Contrast"
                description="Increase color contrast for better readability"
                checked={prefs.highContrast}
                onChange={(v) => updatePref("highContrast", v, v ? "High contrast enabled" : "High contrast disabled")}
              />
              <ToggleOption
                icon={<Underline className="h-4 w-4" aria-hidden="true" />}
                label="Underline Links"
                description="Underline all links for easier identification"
                checked={prefs.underlineLinks}
                onChange={(v) => updatePref("underlineLinks", v, v ? "Links underlined" : "Link underlines removed")}
              />
              <ToggleOption
                icon={<Focus className="h-4 w-4" aria-hidden="true" />}
                label="Enhanced Focus"
                description="Show prominent focus indicators on interactive elements"
                checked={prefs.focusHighlight}
                onChange={(v) => updatePref("focusHighlight", v, v ? "Enhanced focus enabled" : "Enhanced focus disabled")}
              />
              <ToggleOption
                icon={<Minus className="h-4 w-4" aria-hidden="true" />}
                label="Reduce Motion"
                description="Minimize animations and transitions"
                checked={prefs.reducedMotion}
                onChange={(v) => updatePref("reducedMotion", v, v ? "Reduced motion enabled" : "Reduced motion disabled")}
              />
            </div>

            {/* Reset */}
            {hasChanges && (
              <button
                onClick={resetAll}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-2 px-4",
                  "text-sm text-gray-600 dark:text-gray-400",
                  "border border-gray-200 dark:border-gray-700 rounded-lg",
                  "hover:bg-gray-50 dark:hover:bg-gray-800",
                  "transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                )}
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Reset All Settings
              </button>
            )}

            {/* Info */}
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Settings are saved automatically and persist across visits.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

interface ToggleOptionProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleOption({ icon, label, description, checked, onChange }: ToggleOptionProps) {
  const id = `a11y-toggle-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        checked
          ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
          : "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-md flex-shrink-0",
          checked
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
        )}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className={cn(
          "text-sm font-medium",
          checked ? "text-blue-900 dark:text-blue-100" : "text-gray-900 dark:text-white"
        )}>
          {label}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{description}</div>
      </div>
      {/* Visual toggle indicator */}
      <div
        className={cn(
          "w-10 h-6 rounded-full transition-colors flex-shrink-0 relative",
          checked ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
        )}
        aria-hidden="true"
      >
        <div
          className={cn(
            "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm",
            checked ? "translate-x-5" : "translate-x-1"
          )}
        />
      </div>
    </button>
  );
}
