import { useState, useCallback } from "react";
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
  Star,
  Video,
  Calculator,
  Map,
  BarChart3,
  Search,
  DoorOpen,
  Newspaper,
  Sparkles,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";

const linkSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  url: z.string().min(1, "URL is required"),
  icon: z.string(),
  active: z.boolean(),
});

export type LinkFormData = z.infer<typeof linkSchema>;

interface AddLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (data: LinkFormData) => void;
}

export const SOCIAL_ICONS: { value: string; label: string; icon: LucideIcon }[] = [
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

interface LinkTemplate {
  title: string;
  icon: string;
  placeholder: string;
  category: string;
}

const QUICK_ADD_TEMPLATES: LinkTemplate[] = [
  // Social & Professional
  { title: "Instagram", icon: "instagram", placeholder: "https://instagram.com/yourusername", category: "Social" },
  { title: "Facebook Page", icon: "facebook", placeholder: "https://facebook.com/yourpage", category: "Social" },
  { title: "LinkedIn", icon: "linkedin", placeholder: "https://linkedin.com/in/yourprofile", category: "Social" },
  { title: "YouTube Channel", icon: "youtube", placeholder: "https://youtube.com/@yourchannel", category: "Social" },
  { title: "TikTok", icon: "tiktok", placeholder: "https://tiktok.com/@yourusername", category: "Social" },
  // Real Estate Platforms
  { title: "Zillow Profile", icon: "zillow", placeholder: "https://zillow.com/profile/youragent", category: "Real Estate" },
  { title: "Realtor.com Profile", icon: "realtor", placeholder: "https://realtor.com/realestateagents/yourprofile", category: "Real Estate" },
  { title: "MLS Search", icon: "search", placeholder: "https://yourmls.com/search", category: "Real Estate" },
  { title: "Open House Schedule", icon: "openhouse", placeholder: "https://youropenhouses.com", category: "Real Estate" },
  { title: "Virtual Tour", icon: "video", placeholder: "https://my.matterport.com/show/?m=...", category: "Real Estate" },
  // Scheduling & Contact
  { title: "Schedule a Showing", icon: "calendar", placeholder: "https://calendly.com/yourusername", category: "Contact" },
  { title: "Book a Consultation", icon: "calendar", placeholder: "https://cal.com/yourusername", category: "Contact" },
  { title: "WhatsApp", icon: "whatsapp", placeholder: "https://wa.me/1234567890", category: "Contact" },
  // Reviews & Trust
  { title: "Google Reviews", icon: "star", placeholder: "https://g.page/r/your-review-link", category: "Reviews" },
  { title: "Yelp Reviews", icon: "star", placeholder: "https://yelp.com/biz/your-business", category: "Reviews" },
  // Resources
  { title: "Home Valuation", icon: "calculator", placeholder: "https://yoursite.com/home-value", category: "Resources" },
  { title: "Mortgage Calculator", icon: "calculator", placeholder: "https://yoursite.com/mortgage-calculator", category: "Resources" },
  { title: "Neighborhood Guide", icon: "map", placeholder: "https://yoursite.com/neighborhoods", category: "Resources" },
  { title: "Market Report", icon: "chart", placeholder: "https://yoursite.com/market-report", category: "Resources" },
  { title: "Newsletter Signup", icon: "newsletter", placeholder: "https://yoursite.com/newsletter", category: "Resources" },
  { title: "My Website", icon: "website", placeholder: "https://yourwebsite.com", category: "Resources" },
];

// Platform detection patterns
const PLATFORM_PATTERNS: { pattern: RegExp; icon: string; title: string }[] = [
  { pattern: /instagram\.com/i, icon: "instagram", title: "Instagram" },
  { pattern: /facebook\.com|fb\.com/i, icon: "facebook", title: "Facebook" },
  { pattern: /linkedin\.com/i, icon: "linkedin", title: "LinkedIn" },
  { pattern: /tiktok\.com/i, icon: "tiktok", title: "TikTok" },
  { pattern: /youtube\.com|youtu\.be/i, icon: "youtube", title: "YouTube" },
  { pattern: /zillow\.com/i, icon: "zillow", title: "Zillow Profile" },
  { pattern: /realtor\.com/i, icon: "realtor", title: "Realtor.com Profile" },
  { pattern: /calendly\.com|cal\.com/i, icon: "calendar", title: "Schedule a Meeting" },
  { pattern: /matterport\.com/i, icon: "video", title: "Virtual Tour" },
  { pattern: /yelp\.com/i, icon: "star", title: "Yelp Reviews" },
  { pattern: /google\.com\/maps|g\.page/i, icon: "star", title: "Google Reviews" },
  { pattern: /wa\.me|whatsapp\.com/i, icon: "whatsapp", title: "WhatsApp" },
  { pattern: /mailto:/i, icon: "email", title: "Email Me" },
  { pattern: /tel:/i, icon: "phone", title: "Call Me" },
];

export function AddLinkModal({ open, onOpenChange, onSave }: AddLinkModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"templates" | "form">("templates");
  const [urlDetected, setUrlDetected] = useState(false);

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

  const detectPlatform = useCallback((url: string) => {
    for (const platform of PLATFORM_PATTERNS) {
      if (platform.pattern.test(url)) {
        return platform;
      }
    }
    return null;
  }, []);

  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    if (url.length > 8 && !urlDetected) {
      const detected = detectPlatform(url);
      if (detected) {
        setValue("icon", detected.icon);
        const currentTitle = watch("title");
        if (!currentTitle || currentTitle.length === 0) {
          setValue("title", detected.title);
        }
        setUrlDetected(true);
      }
    }
    if (url.length <= 8) {
      setUrlDetected(false);
    }
  }, [detectPlatform, setValue, watch, urlDetected]);

  const handleTemplateSelect = (template: LinkTemplate) => {
    setValue("title", template.title);
    setValue("icon", template.icon);
    setValue("url", "");
    setView("form");
  };

  const handleCustomLink = () => {
    reset({ title: "", url: "", icon: "link", active: true });
    setUrlDetected(false);
    setView("form");
  };

  const onSubmit = async (data: LinkFormData) => {
    try {
      setError(null);
      // Auto-prepend https:// if missing for non-special protocols
      let url = data.url.trim();
      if (url && !url.match(/^(https?:\/\/|mailto:|tel:)/i)) {
        url = `https://${url}`;
      }
      await onSave?.({ ...data, url });
      onOpenChange(false);
      reset();
      setView("templates");
      setUrlDetected(false);
    } catch (err) {
      console.error("Failed to add link:", err);
      setError("Failed to add link. Please try again.");
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setView("templates");
      setError(null);
      setUrlDetected(false);
      reset();
    }
  };

  // Group templates by category
  const categories = QUICK_ADD_TEMPLATES.reduce((acc, template) => {
    if (!acc[template.category]) acc[template.category] = [];
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, LinkTemplate[]>);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        {view === "templates" ? (
          <>
            <DialogHeader>
              <DialogTitle>Add Link</DialogTitle>
              <DialogDescription>
                Choose a template or create a custom link
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* Custom Link Button */}
              <button
                onClick={handleCustomLink}
                className="w-full flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-sm text-foreground">Custom Link</div>
                  <div className="text-xs text-muted-foreground">Add any URL with a custom title</div>
                </div>
              </button>

              {/* Template Categories */}
              {Object.entries(categories).map(([category, templates]) => (
                <div key={category}>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {category}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {templates.map((template) => {
                      const iconDef = SOCIAL_ICONS.find(i => i.value === template.icon);
                      const IconComponent = iconDef?.icon || LinkIcon;
                      return (
                        <button
                          key={template.title}
                          onClick={() => handleTemplateSelect(template)}
                          className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all text-left min-h-[44px]"
                        >
                          <IconComponent className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium text-foreground truncate">{template.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setView("templates")}
                  className="p-1 hover:bg-accent rounded transition-colors"
                  aria-label="Back to templates"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <DialogTitle>Add Link</DialogTitle>
                  <DialogDescription>
                    Fill in the details for your link
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <Label htmlFor="url">URL *</Label>
                <Input
                  id="url"
                  {...register("url", { onChange: handleUrlChange })}
                  placeholder="https://example.com"
                />
                {errors.url && (
                  <p className="text-sm text-red-600 mt-1">{errors.url.message}</p>
                )}
              </div>

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

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Add Link</Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
