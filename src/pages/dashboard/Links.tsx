import { useState } from "react";
import { Plus, GripVertical, Edit, Trash2, ExternalLink, Instagram, Facebook, Home, Calendar, Link as LinkIcon, Linkedin, Music, Youtube, MapPin, Globe, Mail, Phone, MessageCircle, FileText } from "lucide-react";
import { AddLinkModal } from "@/components/modals/AddLinkModal";
import { EditLinkModal } from "@/components/modals/EditLinkModal";
import type { LinkFormData } from "@/components/modals/AddLinkModal";
import { useToast } from "@/hooks/use-toast";
import { useLinks, type Link } from "@/hooks/useLinks";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { UpgradeModal } from "@/components/UpgradeModal";
import { LimitBanner } from "@/components/LimitBanner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingLinkId, setDeletingLinkId] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { toast } = useToast();
  const { links, isLoading, addLink, updateLink, deleteLink, toggleActive } = useLinks();
  const { subscription, canAdd, getLimit, getUsage } = useSubscriptionLimits();

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

  const handleDeleteClick = (id: string) => {
    setDeletingLinkId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingLinkId) return;
    
    try {
      await deleteLink.mutateAsync(deletingLinkId);
      toast({
        title: "Link deleted",
        description: "Your link has been removed successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeletingLinkId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Custom Links</h1>
          <p className="text-muted-foreground mt-1">
            Manage your social and custom links
          </p>
        </div>
        <button
          onClick={handleAddClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          <Plus className="h-4 w-4" />
          Add Link
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-foreground">{links.length}</div>
          <div className="text-sm text-muted-foreground">Total Links</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">
            {links.filter((l) => l.is_active).length}
          </div>
          <div className="text-sm text-muted-foreground">Active</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-primary">
            {links.reduce((sum, l) => sum + l.click_count, 0)}
          </div>
          <div className="text-sm text-muted-foreground">Total Clicks</div>
        </div>
      </div>

      {/* Links List */}
      <div className="bg-card border border-border rounded-lg divide-y divide-border">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading links...
          </div>
        ) : links.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No links yet. Click "Add Link" to create your first link.
          </div>
        ) : (
          links.map((link) => (
          <div
            key={link.id}
            className="p-4 flex items-center gap-4 hover:bg-accent/50 transition-colors"
          >
            {/* Drag Handle */}
            <button className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded">
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </button>

            {/* Icon */}
            <div className="w-12 h-12 flex items-center justify-center bg-accent rounded-lg">
              {(() => {
                const IconComponent = getIconComponent(link.icon);
                return <IconComponent className="h-6 w-6 text-foreground" />;
              })()}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-foreground truncate">
                  {link.title}
                </h3>
                {link.is_active ? (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                    Active
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                    Inactive
                  </span>
                )}
              </div>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 truncate"
              >
                {link.url}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Stats */}
            <div className="text-right hidden sm:block">
              <div className="text-lg font-semibold text-foreground">
                {link.click_count}
              </div>
              <div className="text-xs text-muted-foreground">clicks</div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button 
                onClick={() => handleEditLink(link)}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <Edit className="h-4 w-4 text-muted-foreground" />
              </button>
              <button 
                onClick={() => handleDeleteClick(link.id)}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </button>
            </div>
          </div>
        ))
        )}
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          💡 <strong>Tip:</strong> Drag and drop links to reorder them. The order
          here will reflect on your public profile page.
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this link. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
