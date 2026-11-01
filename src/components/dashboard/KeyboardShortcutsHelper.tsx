/**
 * Keyboard Shortcuts Helper Component
 * Displays available shortcuts and handles registration
 */

import { useState, useEffect, useRef, useCallback, useId } from 'react';
import { Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  isHelpKey,
  isSingleCharacterKey,
  readSingleKeyShortcutsEnabled,
  shouldIgnoreShortcut,
  writeSingleKeyShortcutsEnabled,
} from '@/lib/keyboardShortcuts';

interface Shortcut {
  key: string;
  description: string;
  action: () => void;
  category?: string;
}

interface KeyboardShortcutsProps {
  shortcuts: Shortcut[];
  className?: string;
}

function findShortcut(shortcuts: Shortcut[], key: string): Shortcut | undefined {
  return shortcuts.find((s) => s.key.toLowerCase() === key.toLowerCase());
}

export function KeyboardShortcutsHelper({ shortcuts, className }: KeyboardShortcutsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [recentlyUsed, setRecentlyUsed] = useState<string>('');
  const [singleKeyEnabled, setSingleKeyEnabled] = useState(readSingleKeyShortcutsEnabled);
  const switchId = useId();

  // Read through refs so the window listener is registered once and never
  // acts on a stale open/enabled state or a stale shortcut list.
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;
  const singleKeyRef = useRef(singleKeyEnabled);
  singleKeyRef.current = singleKeyEnabled;
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const recentTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(recentTimer.current), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // While the help panel is open it owns the keyboard: "?" closes it
      // (Escape is handled by the dialog) and nothing fires underneath.
      if (isOpenRef.current) {
        if (isHelpKey(e) && !e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          setIsOpen(false);
        }
        return;
      }

      // Chords, fields and widgets that take keys, and open dialogs (US-252).
      if (shouldIgnoreShortcut(e)) return;

      const singleKeyAllowed = singleKeyRef.current;

      // "?" is Shift+/ on most layouts; the old `!e.shiftKey` check meant it
      // could never open the panel from the keyboard.
      if (isHelpKey(e)) {
        if (!singleKeyAllowed) return;
        e.preventDefault();
        setIsOpen(true);
        return;
      }

      const shortcut = findShortcut(shortcutsRef.current, e.key);
      if (!shortcut) return;
      if (isSingleCharacterKey(shortcut.key) && !singleKeyAllowed) return;

      e.preventDefault();
      shortcut.action();
      setRecentlyUsed(shortcut.key);
      clearTimeout(recentTimer.current);
      recentTimer.current = setTimeout(() => setRecentlyUsed(''), 1000);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSingleKeyChange = useCallback((enabled: boolean) => {
    setSingleKeyEnabled(enabled);
    writeSingleKeyShortcutsEnabled(enabled);
  }, []);

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce(
    (acc, shortcut) => {
      const category = shortcut.category || 'General';
      if (!acc[category]) acc[category] = [];
      acc[category].push(shortcut);
      return acc;
    },
    {} as Record<string, Shortcut[]>
  );

  return (
    <>
      {/* Floating Help Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        aria-label="Keyboard shortcuts"
        className={cn(
          'fixed bottom-4 right-4 md:bottom-6 md:right-6 z-30',
          'shadow-lg gap-2',
          className
        )}
      >
        <Keyboard className="w-4 h-4" aria-hidden="true" />
        <span className="hidden md:inline">Shortcuts</span>
        <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 rounded border" aria-hidden="true">
          ?
        </kbd>
      </Button>

      {/* Recently Used Indicator */}
      {recentlyUsed && (
        <div
          role="status"
          className="fixed top-20 right-4 bg-primary text-white px-4 py-2 rounded-lg shadow-lg animate-in slide-in-from-top-5 duration-300 z-50"
        >
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-white/20 rounded text-sm font-mono">{recentlyUsed}</kbd>
            <span className="text-sm">Shortcut used</span>
          </div>
        </div>
      )}

      {/* Shortcuts Panel */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="max-w-2xl"
          // Escape closes the panel; stop it here so it does not also reach a
          // page shortcut bound to Escape (clearing a selection, say).
          onEscapeKeyDown={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="w-5 h-5" aria-hidden="true" />
              Keyboard shortcuts
            </DialogTitle>
            <DialogDescription>
              Press ? (Shift+/) to open this panel. Shortcuts never fire while you type in a field,
              hold Cmd, Ctrl or Alt, or have a dialog open.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between gap-4 rounded-lg bg-gray-50 p-3">
            <Label htmlFor={switchId} className="text-sm font-medium leading-snug">
              Single-key shortcuts
              <span className="block text-xs font-normal text-gray-600">
                Turn off if you use a screen reader or speech input. Escape still works.
              </span>
            </Label>
            <Switch
              id={switchId}
              checked={singleKeyEnabled}
              onCheckedChange={handleSingleKeyChange}
            />
          </div>

          <div className="space-y-6">
            {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
              <section key={category}>
                <h4 className="font-semibold text-sm text-gray-900 mb-3">{category}</h4>
                <ul className="space-y-2">
                  {categoryShortcuts.map((shortcut) => (
                    <li
                      key={shortcut.key}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <kbd className="px-3 py-1.5 bg-white border border-gray-300 rounded font-mono text-sm">
                        {isSingleCharacterKey(shortcut.key)
                          ? shortcut.key.toUpperCase()
                          : shortcut.key}
                      </kbd>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Hook to manage keyboard shortcuts
export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (shouldIgnoreShortcut(e)) return;

      const shortcut = findShortcut(shortcuts, e.key);
      if (!shortcut) return;
      if (isSingleCharacterKey(shortcut.key) && !readSingleKeyShortcutsEnabled()) return;

      e.preventDefault();
      shortcut.action();
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [shortcuts]);
}
