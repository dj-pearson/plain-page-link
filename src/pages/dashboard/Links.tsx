import { useState } from "react";
import { Plus, GripVertical, Edit, Trash2, ExternalLink } from "lucide-react";
import { AddLinkModal } from "@/components/modals/AddLinkModal";
import type { LinkFormData } from "@/components/modals/AddLinkModal";
import { useToast } from "@/hooks/use-toast";

export default function Links() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { toast } = useToast();

  const handleAddLink = (data: LinkFormData) => {
    // TODO: Save to backend
    console.log("New link:", data);
    toast({
      title: "Link added!",
      description: "Your custom link has been created successfully.",
    });
  };

  // Mock data
  const links = [
    {
      id: 1,
      title: "Schedule a Consultation",
      url: "https://calendly.com/agent",
      icon: "📅",
      clicks: 156,
      active: true,
    },
    {
      id: 2,
      title: "Instagram",
      url: "https://instagram.com/agent",
      icon: "📷",
      clicks: 423,
      active: true,
    },
    {
      id: 3,
      title: "Request Home Valuation",
      url: "https://example.com/valuation",
      icon: "🏠",
      clicks: 89,
      active: true,
    },
    {
      id: 4,
      title: "Facebook",
      url: "https://facebook.com/agent",
      icon: "👤",
      clicks: 267,
      active: false,
    },
  ];

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
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          <Plus className="h-4 w-4" />
          Add Link
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-foreground">{links.length}</div>
          <div className="text-sm text-muted-foreground">Total Links</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">
            {links.filter((l) => l.active).length}
          </div>
          <div className="text-sm text-muted-foreground">Active</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-primary">
            {links.reduce((sum, l) => sum + l.clicks, 0)}
          </div>
          <div className="text-sm text-muted-foreground">Total Clicks</div>
        </div>
      </div>

      {/* Links List */}
      <div className="bg-card border border-border rounded-lg divide-y divide-border">
        {links.map((link) => (
          <div
            key={link.id}
            className="p-4 flex items-center gap-4 hover:bg-accent/50 transition-colors"
          >
            {/* Drag Handle */}
            <button className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded">
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </button>

            {/* Icon */}
            <div className="w-12 h-12 flex items-center justify-center bg-accent rounded-lg text-2xl">
              {link.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-foreground truncate">
                  {link.title}
                </h3>
                {link.active ? (
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
                {link.clicks}
              </div>
              <div className="text-xs text-muted-foreground">clicks</div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button className="p-2 hover:bg-accent rounded-lg transition-colors">
                <Edit className="h-4 w-4 text-muted-foreground" />
              </button>
              <button className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="h-4 w-4 text-red-500" />
              </button>
            </div>
          </div>
        ))}
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
    </div>
  );
}
