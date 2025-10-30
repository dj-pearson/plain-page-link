import { useState, useEffect } from "react";
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
import {
  Instagram,
  Facebook,
  Linkedin,
  Music,
  Youtube,
  Home,
  MapPin,
  Calendar,
  Globe,
  Mail,
  Phone,
  MessageCircle,
  FileText,
  Link as LinkIcon,
  type LucideIcon,
} from "lucide-react";
import type { Link } from "@/hooks/useLinks";

interface EditLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  link: Link | null;
  onSave?: (id: string, data: Partial<Link>) => void;
}

const SOCIAL_ICONS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "instagram", label: "Instagram", icon: Instagram },
  { value: "facebook", label: "Facebook", icon: Facebook },
  { value: "linkedin", label: "LinkedIn", icon: Linkedin },
  { value: "tiktok", label: "TikTok", icon: Music },
  { value: "youtube", label: "YouTube", icon: Youtube },
  { value: "zillow", label: "Zillow", icon: Home },
  { value: "realtor", label: "Realtor.com", icon: MapPin },
  { value: "calendar", label: "Calendar", icon: Calendar },
  { value: "website", label: "Website", icon: Globe },
  { value: "email", label: "Email", icon: Mail },
  { value: "phone", label: "Phone", icon: Phone },
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { value: "document", label: "Document", icon: FileText },
  { value: "link", label: "Link", icon: LinkIcon },
];

export function EditLinkModal({ open, onOpenChange, link, onSave }: EditLinkModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    icon: "link",
    is_active: true,
  });

  useEffect(() => {
    if (link) {
      setFormData({
        title: link.title,
        url: link.url,
        icon: link.icon,
        is_active: link.is_active,
      });
    }
  }, [link]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (link) {
      onSave?.(link.id, formData);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Link</DialogTitle>
          <DialogDescription>
            Update your link information
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
                  {(() => {
                    const selected = SOCIAL_ICONS.find((i) => i.value === formData.icon);
                    const IconComponent = selected?.icon || LinkIcon;
                    return (
                      <span className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        <span>{selected?.label || "Custom"}</span>
                      </span>
                    );
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {SOCIAL_ICONS.map((iconItem) => {
                  const IconComponent = iconItem.icon;
                  return (
                    <SelectItem key={iconItem.value} value={iconItem.value}>
                      <span className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        <span>{iconItem.label}</span>
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, is_active: e.target.checked }))
              }
              className="rounded border-border"
            />
            <Label htmlFor="is_active" className="cursor-pointer">
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
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
