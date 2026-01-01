import { useState, useMemo } from "react";
import { Plus, GripVertical, Edit, Trash2, ExternalLink, Instagram, Facebook, Home, Calendar, Link as LinkIcon, Linkedin, Music, Youtube, MapPin, Globe, Mail, Phone, MessageCircle, FileText, Undo2 } from "lucide-react";
import { AddLinkModal } from "@/components/modals/AddLinkModal";
import { EditLinkModal } from "@/components/modals/EditLinkModal";
import type { LinkFormData } from "@/components/modals/AddLinkModal";
import { useToast } from "@/hooks/use-toast";
import { useLinks, type Link } from "@/hooks/useLinks";
import { useSoftDelete } from "@/hooks/useSoftDelete";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { UpgradeModal } from "@/components/UpgradeModal";
import { LimitBanner } from "@/components/LimitBanner";

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
  const { softDelete, isPendingDeletion, pendingCount } = useSoftDelete<Link>({
    onDelete: async (id: string) => {
      await deleteLink.mutateAsync(id);
    },
    deleteDelay: 10000, // 10 seconds
    resourceName: "link",
    undoMessage: (link) => `"${link.title}" will be deleted in 10 seconds. Click Undo to cancel.`,
  });

  // Filter out pending deletions from display
  const visibleLinks = useMemo(
    () => links.filter((link) => !isPendingDeletion(link.id)),
    [links, isPendingDeletion]
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
            Manage your social and custom links
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

      {/* Stats - Mobile optimized 3-column grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-card border border-border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="text-xl sm:text-2xl font-bold text-foreground">{visibleLinks.length}</div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">Total</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="text-xl sm:text-2xl font-bold text-green-600">
            {visibleLinks.filter((l) => l.is_active).length}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">Active</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="text-xl sm:text-2xl font-bold text-primary">
            {visibleLinks.reduce((sum, l) => sum + l.click_count, 0)}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">Clicks</div>
        </div>
      </div>

      {/* Links List - Mobile optimized */}
      <div className="bg-card border border-border rounded-lg divide-y divide-border">
        {isLoading ? (
          <div className="p-6 sm:p-8 text-center text-muted-foreground text-sm sm:text-base">
            Loading links...
          </div>
        ) : visibleLinks.length === 0 ? (
          <div className="p-6 sm:p-8 text-center text-muted-foreground text-sm sm:text-base">
            No links yet. Click "Add Link" to create your first link.
          </div>
        ) : (
          visibleLinks.map((link) => (
          <div
            key={link.id}
            className="p-3 sm:p-4 flex items-center gap-2 sm:gap-4 hover:bg-accent/50 active:bg-accent/70 transition-colors"
          >
            {/* Drag Handle - Hidden on mobile, shown on desktop */}
            <button
              className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-accent rounded hidden sm:block min-h-[44px]"
              aria-label="Drag to reorder"
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </button>

            {/* Icon */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-accent rounded-lg flex-shrink-0">
              {(() => {
                const IconComponent = getIconComponent(link.icon);
                return <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-foreground" />;
              })()}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1 flex-wrap">
                <h3 className="font-medium text-sm sm:text-base text-foreground truncate">
                  {link.title}
                </h3>
                {link.is_active ? (
                  <span className="px-1.5 sm:px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium flex-shrink-0">
                    Active
                  </span>
                ) : (
                  <span className="px-1.5 sm:px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full font-medium flex-shrink-0">
                    Inactive
                  </span>
                )}
              </div>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs sm:text-sm text-muted-foreground hover:text-primary active:text-primary flex items-center gap-1 truncate"
              >
                <span className="truncate">{link.url}</span>
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
              </a>
              {/* Stats on mobile - shown below URL */}
              <div className="sm:hidden mt-1.5 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{link.click_count}</span> clicks
              </div>
            </div>

            {/* Stats - Desktop only */}
            <div className="text-right hidden sm:block flex-shrink-0">
              <div className="text-lg font-semibold text-foreground">
                {link.click_count}
              </div>
              <div className="text-xs text-muted-foreground">clicks</div>
            </div>

            {/* Actions - Larger touch targets on mobile */}
            <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
              <button
                onClick={() => handleEditLink(link)}
                className="p-2 sm:p-2.5 hover:bg-accent active:bg-accent/80 rounded-lg transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Edit link"
              >
                <Edit className="h-4 w-4 text-muted-foreground" />
              </button>
              <button
                onClick={() => handleDeleteClick(link)}
                className="p-2 sm:p-2.5 hover:bg-red-50 active:bg-red-100 rounded-lg transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Delete link"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </button>
            </div>
          </div>
        ))
        )}
      </div>

      {/* Help Text - Mobile optimized */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-3 sm:p-4">
        <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
          <span role="img" aria-label="Tip">💡</span> <strong>Tip:</strong> <span className="hidden sm:inline">Drag and drop links to reorder them.</span><span className="sm:hidden">Use the edit option to change link details.</span> The order here will reflect on your public profile page.
        </p>
      </div>

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
