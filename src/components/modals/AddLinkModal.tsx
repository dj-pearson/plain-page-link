import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (data: LinkFormData) => void;
}

export interface LinkFormData {
  title: string;
  url: string;
  icon: string;
  active: boolean;
}

const SOCIAL_ICONS = [
  { value: "📷", label: "Instagram" },
  { value: "👤", label: "Facebook" },
  { value: "💼", label: "LinkedIn" },
  { value: "🎵", label: "TikTok" },
  { value: "▶️", label: "YouTube" },
  { value: "🏠", label: "Zillow" },
  { value: "📍", label: "Realtor.com" },
  { value: "📅", label: "Calendar" },
  { value: "🌐", label: "Website" },
  { value: "📧", label: "Email" },
  { value: "📱", label: "Phone" },
  { value: "💬", label: "WhatsApp" },
  { value: "📄", label: "Document" },
  { value: "🔗", label: "Link" },
];

export function AddLinkModal({ open, onOpenChange, onSave }: AddLinkModalProps) {
  const [formData, setFormData] = useState<LinkFormData>({
    title: "",
    url: "",
    icon: "🔗",
    active: true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave?.(formData);
    onOpenChange(false);
    // Reset form
    setFormData({
      title: "",
      url: "",
      icon: "🔗",
      active: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Custom Link</DialogTitle>
          <DialogDescription>
            Add a social media profile or custom link to your bio
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Link Title *</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Schedule a Consultation"
              required
            />
          </div>

          <div>
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              name="url"
              type="url"
              value={formData.url}
              onChange={handleChange}
              placeholder="https://example.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="icon">Icon</Label>
            <Select
              value={formData.icon}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, icon: value }))
              }
            >
              <SelectTrigger>
                <SelectValue>
                  <span className="flex items-center gap-2">
                    <span className="text-xl">{formData.icon}</span>
                    <span>
                      {SOCIAL_ICONS.find((i) => i.value === formData.icon)
                        ?.label || "Custom"}
                    </span>
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {SOCIAL_ICONS.map((icon) => (
                  <SelectItem key={icon.value} value={icon.value}>
                    <span className="flex items-center gap-2">
                      <span className="text-xl">{icon.value}</span>
                      <span>{icon.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, active: e.target.checked }))
              }
              className="rounded border-border"
            />
            <Label htmlFor="active" className="cursor-pointer">
              Active (visible on profile)
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Add Link</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
