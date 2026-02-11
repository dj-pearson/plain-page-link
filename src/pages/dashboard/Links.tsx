import { useState, useMemo, useCallback } from "react";
import {
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Instagram,
  Facebook,
  Home,
  Calendar,
  Link as LinkIcon,
  Linkedin,
  Music,
  Youtube,
  MapPin,
  Globe,
  Mail,
  Phone,
  MessageCircle,
  FileText,
  Star,
  Video,
  Calculator,
  Map,
  BarChart3,
  Search,
  DoorOpen,
  Newspaper,
  Eye,
  ArrowUp,
  ArrowDown,
  MousePointerClick,
} from "lucide-react";
import { AddLinkModal } from "@/components/modals/AddLinkModal";
import { EditLinkModal } from "@/components/modals/EditLinkModal";
import type { LinkFormData } from "@/components/modals/AddLinkModal";
import { useToast } from "@/hooks/use-toast";
import { useLinks, type Link } from "@/hooks/useLinks";
import { useSoftDelete } from "@/hooks/useSoftDelete";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { UpgradeModal } from "@/components/UpgradeModal";
import { LimitBanner } from "@/components/LimitBanner";
import { Switch } from "@/components/ui/switch";

const getIconComponent = (iconName: string) => {
  const iconMap: Record<string, any> = {
    calendar: Calendar,
    instagram: Instagram,
    facebook: Facebook,
    zillow: Home,
    link: LinkIcon,
    linkedin: Linkedin,
    tiktok: Music,
    youtube: Youtube,
    realtor: MapPin,
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
  };
  return iconMap[iconName] || LinkIcon;
};

export default function Links() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { toast } = useToast();
  const { links, isLoading, addLink, updateLink, deleteLink, toggleActive } = useLinks();
  const { subscription, canAdd, getLimit, getUsage } = useSubscriptionLimits();

  // Set up soft delete with undo
  const { softDelete, isPendingDeletion } = useSoftDelete<Link>({
    onDelete: async (id: string) => {
      await deleteLink.mutateAsync(id);
    },
    deleteDelay: 10000,
    resourceName: "link",
    undoMessage: (link) => `"${link.title}" will be deleted in 10 seconds. Click Undo to cancel.`,
  });

  // Filter out pending deletions from display
  const visibleLinks = useMemo(
    () => links.filter((link) => !isPendingDeletion(link.id)),
    [links, isPendingDeletion]
  );

  const activeCount = useMemo(
    () => visibleLinks.filter((l) => l.is_active).length,
    [visibleLinks]
  );

  const totalClicks = useMemo(
    () => visibleLinks.reduce((sum, l) => sum + l.click_count, 0),
    [visibleLinks]
  );

  const handleAddClick = () => {
    if (!canAdd('links')) {
      setShowUpgradeModal(true);
      return;
    }
    setIsAddModalOpen(true);
  };

  const handleAddLink = async (data: LinkFormData) => {
    try {
      await addLink.mutateAsync(data);
      toast({
        title: "Link added!",
        description: "Your custom link has been created successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add link. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditLink = (link: Link) => {
    setEditingLink(link);
    setIsEditModalOpen(true);
  };

  const handleUpdateLink = async (id: string, data: Partial<Link>) => {
    try {
      await updateLink.mutateAsync({ id, ...data });
      toast({
        title: "Link updated!",
        description: "Your link has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update link. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = useCallback(async (link: Link) => {
    try {
      await toggleActive.mutateAsync({ id: link.id, is_active: !link.is_active });
      toast({
        title: link.is_active ? "Link hidden" : "Link visible",
        description: link.is_active
          ? `"${link.title}" is now hidden from your profile.`
          : `"${link.title}" is now visible on your profile.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update link visibility.",
        variant: "destructive",
      });
    }
  }, [toggleActive, toast]);

  const handleMoveLink = useCallback(async (link: Link, direction: "up" | "down") => {
    const currentIndex = visibleLinks.findIndex((l) => l.id === link.id);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= visibleLinks.length) return;

    const targetLink = visibleLinks[targetIndex];

    try {
      // Swap positions
      await Promise.all([
        updateLink.mutateAsync({ id: link.id, position: targetLink.position }),
        updateLink.mutateAsync({ id: targetLink.id, position: link.position }),
      ]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reorder links.",
        variant: "destructive",
      });
    }
  }, [visibleLinks, updateLink, toast]);

  const handleDeleteClick = (link: Link) => {
    softDelete(link);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Custom Links</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-0.5 sm:mt-1">
            Add links to your profile for visitors to find you everywhere
          </p>
        </div>
        <button
          onClick={handleAddClick}
          className="inline-flex items-center gap-2 px-4 py-2.5 sm:py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 active:scale-95 transition-all font-medium min-h-[44px] w-full sm:w-auto justify-center shadow-sm"
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-sm sm:text-base">Add Link</span>
        </button>
      </div>

      {/* Limit Banner */}
      {subscription && getLimit('links') !== Infinity && (
        <LimitBanner
          feature="links"
          current={getUsage('links')}
          limit={getLimit('links')}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-card border border-border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-1">
            <LinkIcon className="h-4 w-4 text-muted-foreground hidden sm:block" />
            <div className="text-xl sm:text-2xl font-bold text-foreground">{visibleLinks.length}</div>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">Total Links</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-1">
            <Eye className="h-4 w-4 text-green-600 hidden sm:block" />
            <div className="text-xl sm:text-2xl font-bold text-green-600">{activeCount}</div>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">Active</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-1">
            <MousePointerClick className="h-4 w-4 text-primary hidden sm:block" />
            <div className="text-xl sm:text-2xl font-bold text-primary">{totalClicks}</div>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">Total Clicks</div>
        </div>
      </div>

      {/* Links List */}
      <div className="bg-card border border-border rounded-lg divide-y divide-border">
        {isLoading ? (
          <div className="p-6 sm:p-8 text-center text-muted-foreground text-sm sm:text-base">
            Loading links...
          </div>
        ) : visibleLinks.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <LinkIcon className="h-8 w-8 text-primary/60" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">No links yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
              Add links to your social profiles, Zillow page, scheduling tool, and more so visitors can find you everywhere.
            </p>
            <button
              onClick={handleAddClick}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 active:scale-95 transition-all font-medium text-sm"
            >
              <Plus className="h-4 w-4" />
              Add Your First Link
            </button>
          </div>
        ) : (
          visibleLinks.map((link, index) => {
            const IconComponent = getIconComponent(link.icon);
            return (
              <div
                key={link.id}
                className={`p-3 sm:p-4 flex items-center gap-2 sm:gap-3 hover:bg-accent/50 transition-colors ${
                  !link.is_active ? "opacity-60" : ""
                }`}
              >
                {/* Reorder buttons */}
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => handleMoveLink(link, "up")}
                    disabled={index === 0}
                    className="p-1 hover:bg-accent rounded disabled:opacity-20 disabled:cursor-not-allowed transition-opacity"
                    aria-label="Move up"
                  >
                    <ArrowUp className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => handleMoveLink(link, "down")}
                    disabled={index === visibleLinks.length - 1}
                    className="p-1 hover:bg-accent rounded disabled:opacity-20 disabled:cursor-not-allowed transition-opacity"
                    aria-label="Move down"
                  >
                    <ArrowDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>

                {/* Icon */}
                <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center bg-accent rounded-lg flex-shrink-0">
                  <IconComponent className="h-5 w-5 sm:h-5 sm:w-5 text-foreground" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 flex-wrap">
                    <h3 className="font-medium text-sm sm:text-base text-foreground truncate">
                      {link.title}
                    </h3>
                  </div>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:text-sm text-muted-foreground hover:text-primary flex items-center gap-1 truncate"
                  >
                    <span className="truncate">{link.url}</span>
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </a>
                  {/* Stats on mobile */}
                  <div className="sm:hidden mt-1 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{link.click_count}</span> clicks
                  </div>
                </div>

                {/* Stats - Desktop */}
                <div className="text-right hidden sm:block flex-shrink-0 min-w-[60px]">
                  <div className="text-lg font-semibold text-foreground">
                    {link.click_count}
                  </div>
                  <div className="text-xs text-muted-foreground">clicks</div>
                </div>

                {/* Active Toggle */}
                <div className="flex-shrink-0" title={link.is_active ? "Visible on profile" : "Hidden from profile"}>
                  <Switch
                    checked={link.is_active}
                    onCheckedChange={() => handleToggleActive(link)}
                    aria-label={link.is_active ? "Hide link" : "Show link"}
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => handleEditLink(link)}
                    className="p-2 hover:bg-accent rounded-lg transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Edit link"
                  >
                    <Edit className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(link)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Delete link"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Help Text */}
      {visibleLinks.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
            <strong>Tips:</strong> Use the arrow buttons to reorder links. Toggle the switch to show/hide links on your profile. The order here matches what visitors see.
          </p>
        </div>
      )}

      {/* Add Link Modal */}
      <AddLinkModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSave={handleAddLink}
      />

      {/* Edit Link Modal */}
      <EditLinkModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        link={editingLink}
        onSave={handleUpdateLink}
      />

      {/* Upgrade Modal */}
      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        feature="links"
        currentPlan={subscription?.plan_name || "Free"}
        requiredPlan="Starter"
      />
    </div>
  );
}
