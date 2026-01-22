import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFocusTrap, useEscapeKey } from "@/hooks/useAccessibility";

export interface EditLinkFormData {
  title: string;
  url: string;
  icon?: string;
}

interface EditLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EditLinkFormData) => void;
  initialData: EditLinkFormData;
}

export function EditLinkModal({ isOpen, onClose, onSubmit, initialData }: EditLinkModalProps) {
  const [formData, setFormData] = useState<EditLinkFormData>(initialData);
  const modalRef = useRef<HTMLDivElement>(null);

  // Accessibility hooks for focus trap and escape key
  useFocusTrap(modalRef, isOpen);
  useEscapeKey(onClose, isOpen);

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      aria-hidden="false"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-link-modal-title"
        className="bg-card border border-border rounded-lg w-full max-w-md"
      >
        <div className="border-b border-border p-4 flex items-center justify-between">
          <h2 id="edit-link-modal-title" className="text-xl font-semibold">Edit Link</h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 hover:bg-accent rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label htmlFor="edit-link-title">Link Title *</Label>
            <Input
              id="edit-link-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., My Website"
              required
              aria-required="true"
            />
          </div>

          <div>
            <Label htmlFor="edit-link-url">URL *</Label>
            <Input
              id="edit-link-url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://example.com"
              required
              aria-required="true"
            />
          </div>

          <div>
            <Label htmlFor="edit-link-icon">Icon (optional)</Label>
            <Input
              id="edit-link-icon"
              value={formData.icon || ''}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="e.g., link, globe, home"
              aria-describedby="edit-link-icon-help"
            />
            <p id="edit-link-icon-help" className="text-xs text-muted-foreground mt-1">
              Icon name from Lucide icons
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
