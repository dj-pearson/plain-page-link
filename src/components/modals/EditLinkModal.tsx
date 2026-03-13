import { useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
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
  Star,
  Video,
  Calculator,
  Map,
  BarChart3,
  Search,
  DoorOpen,
  Newspaper,
  type LucideIcon,
} from "lucide-react";
import type { Link } from "@/hooks/useLinks";

const editLinkSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  url: z.string().min(1, "URL is required"),
  icon: z.string(),
  is_active: z.boolean(),
});

export type EditLinkFormData = z.infer<typeof editLinkSchema>;

interface EditLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  link: Link | null;
  onSave: (id: string, data: Partial<Link>) => void;
}

const ICON_OPTIONS: { value: string; label: string; icon: LucideIcon }[] = [
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
  { value: "star", label: "Reviews", icon: Star },
  { value: "video", label: "Video/Tour", icon: Video },
  { value: "calculator", label: "Calculator", icon: Calculator },
  { value: "map", label: "Map/Area", icon: Map },
  { value: "chart", label: "Market Report", icon: BarChart3 },
  { value: "search", label: "MLS Search", icon: Search },
  { value: "openhouse", label: "Open House", icon: DoorOpen },
  { value: "newsletter", label: "Newsletter", icon: Newspaper },
  { value: "link", label: "Link", icon: LinkIcon },
];

export function EditLinkModal({ open, onOpenChange, link, onSave }: EditLinkModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<EditLinkFormData>({
    resolver: zodResolver(editLinkSchema),
    defaultValues: {
      title: "",
      url: "",
      icon: "link",
      is_active: true,
    },
  });

  const icon = watch("icon");
  const isActive = watch("is_active");

  // Reset form when link changes
  useEffect(() => {
    if (link) {
      reset({
        title: link.title,
        url: link.url,
        icon: link.icon || "link",
        is_active: link.is_active,
      });
    }
  }, [link, reset]);

  const onSubmit = async (data: EditLinkFormData) => {
    if (!link) return;
    onSave(link.id, {
      title: data.title,
      url: data.url,
      icon: data.icon,
      is_active: data.is_active,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Link</DialogTitle>
          <DialogDescription>
            Update your link details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="edit-title">Link Title *</Label>
            <Input
              id="edit-title"
              {...register("title")}
              placeholder="Schedule a Consultation"
            />
            {errors.title && (
              <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="edit-url">URL *</Label>
            <Input
              id="edit-url"
              {...register("url")}
              placeholder="https://example.com"
            />
            {errors.url && (
              <p className="text-sm text-red-600 mt-1">{errors.url.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="edit-icon">Icon</Label>
            <Select
              value={icon}
              onValueChange={(value) => setValue("icon", value)}
            >
              <SelectTrigger>
                <SelectValue>
                  {(() => {
                    const selected = ICON_OPTIONS.find((i) => i.value === icon);
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
                {ICON_OPTIONS.map((iconItem) => {
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

          <div className="flex items-center justify-between py-2">
            <Label htmlFor="edit-active" className="cursor-pointer">
              Visible on profile
            </Label>
            <Switch
              id="edit-active"
              checked={isActive}
              onCheckedChange={(checked) => setValue("is_active", checked)}
            />
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
