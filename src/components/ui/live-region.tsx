import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * LiveRegion Priority Levels:
 * - polite: Waits for user to be idle before announcing (default)
 * - assertive: Interrupts current speech to announce immediately
 * - off: Does not announce (for hidden content that shouldn't be read)
 */
type LiveRegionPoliteness = "polite" | "assertive" | "off";

interface LiveRegionProps {
  /** The message to announce to screen readers */
  children: React.ReactNode;
  /**
   * The politeness level for the announcement
   * @default "polite"
   */
  politeness?: LiveRegionPoliteness;
  /**
   * Whether changes are atomic (whole region is re-read) or not
   * @default true
   */
  atomic?: boolean;
  /**
   * Whether to visually hide the region
   * @default true
   */
  visuallyHidden?: boolean;
  /**
   * Optional role for the region
   * - "status": For status messages (polite)
   * - "alert": For important messages (assertive)
   * - "log": For chat or logs
   * - "timer": For countdown timers
   * - "marquee": For scrolling text
   */
  role?: "status" | "alert" | "log" | "timer" | "marquee";
  /** Additional CSS classes */
  className?: string;
  /**
   * Unique ID for the region
   * Useful when you have multiple live regions
   */
  id?: string;
}

/**
 * LiveRegion Component
 *
 * Provides accessible announcements to screen readers for dynamic content changes.
 * This is essential for WCAG 2.1 Success Criterion 4.1.3 Status Messages.
 *
 * @example
 * // Basic usage - announce a status message
 * const [message, setMessage] = useState("");
 *
 * return (
 *   <>
 *     <LiveRegion>{message}</LiveRegion>
 *     <button onClick={() => setMessage("Form submitted successfully!")}>
 *       Submit
 *     </button>
 *   </>
 * );
 *
 * @example
 * // Assertive announcement for errors
 * <LiveRegion politeness="assertive" role="alert">
 *   {errorMessage}
 * </LiveRegion>
 */
export function LiveRegion({
  children,
  politeness = "polite",
  atomic = true,
  visuallyHidden = true,
  role,
  className,
  id,
}: LiveRegionProps) {
  // Derive role from politeness if not explicitly set
  const derivedRole = role ?? (politeness === "assertive" ? "alert" : "status");

  return (
    <div
      id={id}
      role={derivedRole}
      aria-live={politeness}
      aria-atomic={atomic}
      className={cn(
        visuallyHidden && "sr-only",
        className
      )}
    >
      {children}
    </div>
  );
}

interface AnnouncerState {
  message: string;
  politeness: LiveRegionPoliteness;
  key: number;
}

interface UseAnnouncerReturn {
  announce: (message: string, politeness?: LiveRegionPoliteness) => void;
  AnnouncerPortal: React.FC;
}

/**
 * useAnnouncer Hook
 *
 * Provides a way to programmatically announce messages to screen readers
 * from anywhere in your application.
 *
 * @example
 * function MyComponent() {
 *   const { announce, AnnouncerPortal } = useAnnouncer();
 *
 *   const handleSave = async () => {
 *     try {
 *       await saveData();
 *       announce("Data saved successfully!");
 *     } catch (error) {
 *       announce("Failed to save data", "assertive");
 *     }
 *   };
 *
 *   return (
 *     <>
 *       <AnnouncerPortal />
 *       <button onClick={handleSave}>Save</button>
 *     </>
 *   );
 * }
 */
export function useAnnouncer(): UseAnnouncerReturn {
  const [state, setState] = React.useState<AnnouncerState>({
    message: "",
    politeness: "polite",
    key: 0,
  });

  const announce = React.useCallback((
    message: string,
    politeness: LiveRegionPoliteness = "polite"
  ) => {
    setState(prev => ({
      message,
      politeness,
      key: prev.key + 1,
    }));
  }, []);

  const AnnouncerPortal: React.FC = React.useCallback(() => (
    <LiveRegion
      key={state.key}
      politeness={state.politeness}
    >
      {state.message}
    </LiveRegion>
  ), [state]);

  return { announce, AnnouncerPortal };
}

// Context for global announcements
interface AnnouncerContextValue {
  announce: (message: string, politeness?: LiveRegionPoliteness) => void;
}

const AnnouncerContext = React.createContext<AnnouncerContextValue | null>(null);

interface AnnouncerProviderProps {
  children: React.ReactNode;
}

/**
 * AnnouncerProvider
 *
 * Provides a global announcement context that can be used anywhere in the app.
 * Wrap your app with this provider to enable global announcements.
 *
 * @example
 * // In App.tsx
 * function App() {
 *   return (
 *     <AnnouncerProvider>
 *       <Routes>...</Routes>
 *     </AnnouncerProvider>
 *   );
 * }
 *
 * // In any component
 * function MyComponent() {
 *   const { announce } = useGlobalAnnouncer();
 *
 *   return (
 *     <button onClick={() => announce("Hello!")}>
 *       Announce
 *     </button>
 *   );
 * }
 */
export function AnnouncerProvider({ children }: AnnouncerProviderProps) {
  const { announce, AnnouncerPortal } = useAnnouncer();

  return (
    <AnnouncerContext.Provider value={{ announce }}>
      {children}
      <AnnouncerPortal />
    </AnnouncerContext.Provider>
  );
}

/**
 * useGlobalAnnouncer Hook
 *
 * Access the global announcer from any component wrapped in AnnouncerProvider.
 *
 * @throws Error if used outside of AnnouncerProvider
 */
export function useGlobalAnnouncer(): AnnouncerContextValue {
  const context = React.useContext(AnnouncerContext);

  if (!context) {
    throw new Error(
      "useGlobalAnnouncer must be used within an AnnouncerProvider. " +
      "Wrap your app with <AnnouncerProvider> to use global announcements."
    );
  }

  return context;
}

interface LoadingAnnouncerProps {
  /** Whether the content is currently loading */
  isLoading: boolean;
  /** Message to announce when loading starts */
  loadingMessage?: string;
  /** Message to announce when loading completes */
  completeMessage?: string;
  /** Whether to show loading message (default: true) */
  announceLoading?: boolean;
  /** Whether to show complete message (default: true) */
  announceComplete?: boolean;
}

/**
 * LoadingAnnouncer Component
 *
 * Announces loading states to screen readers.
 *
 * @example
 * function DataList() {
 *   const { data, isLoading } = useQuery(...);
 *
 *   return (
 *     <>
 *       <LoadingAnnouncer
 *         isLoading={isLoading}
 *         loadingMessage="Loading your data..."
 *         completeMessage="Data loaded successfully"
 *       />
 *       {isLoading ? <Skeleton /> : <List data={data} />}
 *     </>
 *   );
 * }
 */
export function LoadingAnnouncer({
  isLoading,
  loadingMessage = "Loading...",
  completeMessage = "Content loaded",
  announceLoading = true,
  announceComplete = true,
}: LoadingAnnouncerProps) {
  const [message, setMessage] = React.useState("");
  const wasLoadingRef = React.useRef(false);

  React.useEffect(() => {
    if (isLoading && !wasLoadingRef.current && announceLoading) {
      setMessage(loadingMessage);
    } else if (!isLoading && wasLoadingRef.current && announceComplete) {
      setMessage(completeMessage);
    }

    wasLoadingRef.current = isLoading;
  }, [isLoading, loadingMessage, completeMessage, announceLoading, announceComplete]);

  if (!message) return null;

  return (
    <LiveRegion politeness="polite">
      {message}
    </LiveRegion>
  );
}

interface CountAnnouncer {
  /** Current count to announce */
  count: number;
  /** Label for what is being counted */
  label: string;
  /** Singular form of the item (optional, defaults to label) */
  singular?: string;
}

/**
 * CountAnnouncer Component
 *
 * Announces count changes to screen readers with proper pluralization.
 *
 * @example
 * <CountAnnouncer count={results.length} label="results" singular="result" />
 * // Announces: "5 results" or "1 result"
 */
export function CountAnnouncer({ count, label, singular }: CountAnnouncer) {
  const itemLabel = count === 1 ? (singular ?? label) : label;

  return (
    <LiveRegion politeness="polite">
      {`${count} ${itemLabel}`}
    </LiveRegion>
  );
}
