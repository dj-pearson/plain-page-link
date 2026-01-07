import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

const linkSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  url: z.string().url("Please enter a valid URL"),
  icon: z.string(),
  active: z.boolean(),
});

export type LinkFormData = z.infer<typeof linkSchema>;

interface AddLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (data: LinkFormData) => void;
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

export function AddLinkModal({ open, onOpenChange, onSave }: AddLinkModalProps) {
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<LinkFormData>({
    resolver: zodResolver(linkSchema),
    defaultValues: {
      title: "",
      url: "",
      icon: "link",
      active: true,
    },
  });

  const icon = watch("icon");
  const active = watch("active");

  const onSubmit = async (data: LinkFormData) => {
    try {
      setError(null);
      await onSave?.(data);
      onOpenChange(false);
      reset();
    } catch (err) {
      console.error("Failed to add link:", err);
      setError("Failed to add link. Please try again.");
    }
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="title">Link Title *</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="Schedule a Consultation"
            />
            {errors.title && (
              <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              {...register("url")}
              placeholder="https://example.com"
            />
            {errors.url && (
              <p className="text-sm text-red-600 mt-1">{errors.url.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="icon">Icon</Label>
            <Select
              value={icon}
              onValueChange={(value) => setValue("icon", value)}
            >
              <SelectTrigger>
                <SelectValue>
                  {(() => {
                    const selected = SOCIAL_ICONS.find((i) => i.value === icon);
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
              id="active"
              checked={active}
              onChange={(e) => setValue("active", e.target.checked)}
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
