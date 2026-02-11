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
  ExternalLink,
  type LucideIcon,
} from "lucide-react";

interface CustomLink {
  id: string;
  title: string;
  url: string;
  icon: string;
  position: number;
  is_active: boolean;
}

interface CustomLinksProps {
  links: CustomLink[];
  onLinkClick?: (link: CustomLink) => void;
}

const ICON_MAP: Record<string, LucideIcon> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  tiktok: Music,
  youtube: Youtube,
  zillow: Home,
  realtor: MapPin,
  calendar: Calendar,
  website: Globe,
  email: Mail,
  phone: Phone,
  whatsapp: MessageCircle,
  document: FileText,
  star: Star,
  video: Video,
  calculator: Calculator,
  map: Map,
  chart: BarChart3,
  search: Search,
  openhouse: DoorOpen,
  newsletter: Newspaper,
  link: LinkIcon,
};

// Platform-specific brand colors for link buttons
const ICON_COLORS: Record<string, string> = {
  instagram: "hover:border-pink-500 hover:text-pink-600",
  facebook: "hover:border-blue-600 hover:text-blue-600",
  linkedin: "hover:border-blue-700 hover:text-blue-700",
  tiktok: "hover:border-gray-900 hover:text-gray-900",
  youtube: "hover:border-red-600 hover:text-red-600",
  zillow: "hover:border-blue-500 hover:text-blue-600",
  realtor: "hover:border-red-600 hover:text-red-600",
  calendar: "hover:border-indigo-500 hover:text-indigo-600",
  whatsapp: "hover:border-green-500 hover:text-green-600",
  star: "hover:border-yellow-500 hover:text-yellow-600",
};

export default function CustomLinks({ links, onLinkClick }: CustomLinksProps) {
  // Only show active links, sorted by position
  const activeLinks = links
    .filter((link) => link.is_active)
    .sort((a, b) => a.position - b.position);

  if (activeLinks.length === 0) {
    return null;
  }

  const handleClick = (link: CustomLink) => {
    if (onLinkClick) {
      onLinkClick(link);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-4 sm:py-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 text-center mb-4">
        Quick Links
      </h2>
      <div className="space-y-2.5">
        {activeLinks.map((link) => {
          const IconComponent = ICON_MAP[link.icon] || LinkIcon;
          const hoverColor = ICON_COLORS[link.icon] || "hover:border-primary hover:text-primary";

          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleClick(link)}
              className={`group block w-full bg-white border-2 border-gray-200 rounded-xl px-5 py-3.5 transition-all hover:shadow-md hover:scale-[1.01] active:scale-[0.99] ${hoverColor}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 group-hover:bg-current/10 flex items-center justify-center flex-shrink-0 transition-colors">
                  <IconComponent className="h-5 w-5 text-gray-600 group-hover:text-current transition-colors" />
                </div>
                <span className="flex-1 font-semibold text-gray-900 text-sm sm:text-base">
                  {link.title}
                </span>
                <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-current transition-colors flex-shrink-0" />
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
