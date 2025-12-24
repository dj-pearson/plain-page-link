import { useState } from "react";
import {
    LinkStackLink,
    LinkBlockType,
    LinkStackLinkCreate,
    PREDEFINED_LINKS,
} from "@/types/linkstack";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    GripVertical,
    Plus,
    Edit2,
    Trash2,
    Eye,
    EyeOff,
    Link as LinkIcon,
    Minus,
    Heading as HeadingIcon,
    Type,
    Phone,
    Mail,
    Download,
    AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface LinkManagerProps {
    userId: number;
}

export default function LinkManager({ userId }: LinkManagerProps) {
    const [links, setLinks] = useState<LinkStackLink[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingLink, setEditingLink] = useState<LinkStackLink | null>(null);
    const [linkToDelete, setLinkToDelete] = useState<LinkStackLink | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Form state
    const [linkType, setLinkType] = useState<LinkBlockType>("link");
    const [formData, setFormData] = useState<LinkStackLinkCreate>({
        type: "link",
        title: "",
        link: "",
        custom_icon: "fa-external-link",
        custom_css: "",
        order: 0,
    });

    const handleAddLink = () => {
        const newLink: LinkStackLink = {
            id: Date.now(), // Temporary ID, backend will provide real ID
            user_id: userId,
            link: formData.link || null,
            title: formData.title || null,
            type: formData.type,
            type_params: formData.type_params || null,
            button_id: formData.button_id || null,
            custom_icon: formData.custom_icon || "fa-external-link",
            custom_css: formData.custom_css || "",
            order: links.length,
            up_link: "no",
            click_number: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        setLinks([...links, newLink]);
        setIsAddModalOpen(false);
        resetForm();
        toast.success("Link added successfully!");
    };

    const handleUpdateLink = () => {
        if (!editingLink) return;

        setLinks(
            links.map((link) =>
                link.id === editingLink.id
                    ? {
                          ...link,
                          ...formData,
                          updated_at: new Date().toISOString(),
                      }
                    : link
            )
        );
        setEditingLink(null);
        resetForm();
        toast.success("Link updated successfully!");
    };

    const handleDeleteLink = () => {
        if (!linkToDelete) return;
        setLinks(links.filter((link) => link.id !== linkToDelete.id));
        toast.success("Link deleted");
        setLinkToDelete(null);
    };

    const handleToggleVisibility = (id: number) => {
        setLinks(
            links.map((link) =>
                link.id === id
                    ? { ...link, up_link: link.up_link === "yes" ? "no" : "yes" }
                    : link
            )
        );
    };

    const handleReorder = (dragIndex: number, hoverIndex: number) => {
        const draggedLink = links[dragIndex];
        const newLinks = [...links];
        newLinks.splice(dragIndex, 1);
        newLinks.splice(hoverIndex, 0, draggedLink);
        setLinks(
            newLinks.map((link, index) => ({ ...link, order: index }))
        );
    };

    const resetForm = () => {
        setFormData({
            type: "link",
            title: "",
            link: "",
            custom_icon: "fa-external-link",
            custom_css: "",
            order: 0,
        });
        setLinkType("link");
    };

    const openAddModal = () => {
        resetForm();
        setIsAddModalOpen(true);
    };

    const openEditModal = (link: LinkStackLink) => {
        setFormData({
            type: link.type,
            title: link.title || "",
            link: link.link || "",
            custom_icon: link.custom_icon,
            custom_css: link.custom_css,
            type_params: link.type_params,
            button_id: link.button_id || undefined,
        });
        setLinkType(link.type);
        setEditingLink(link);
    };

    const getLinkTypeIcon = (type: LinkBlockType) => {
        const iconMap = {
            link: LinkIcon,
            predefined: LinkIcon,
            spacer: Minus,
            heading: HeadingIcon,
            text: Type,
            telephone: Phone,
            email: Mail,
            vcard: Download,
        };
        return iconMap[type];
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        Custom Links
                    </h2>
                    <p className="text-gray-600">
                        Manage your link-in-bio blocks with drag-and-drop ordering
                    </p>
                </div>
                <Button
                    onClick={openAddModal}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Block
                </Button>
            </div>

            {/* Links List */}
            {links.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                    <LinkIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2 font-semibold">
                        No links yet
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                        Add links, social media, text blocks, and more to your bio
                    </p>
                    <Button onClick={openAddModal} variant="outline">
                        Add Your First Block
                    </Button>
                </div>
            ) : (
                <div className="space-y-2">
                    {links.map((link, index) => {
                        const Icon = getLinkTypeIcon(link.type);
                        return (
                            <div
                                key={link.id}
                                className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
                            >
                                {/* Drag Handle */}
                                <button className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
                                    <GripVertical className="w-5 h-5" />
                                </button>

                                {/* Link Type Icon */}
                                <div className="flex-shrink-0">
                                    <Icon className="w-5 h-5 text-gray-600" />
                                </div>

                                {/* Link Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-gray-900 truncate">
                                        {link.title || "Untitled"}
                                    </div>
                                    <div className="text-sm text-gray-500 truncate">
                                        {link.type === "spacer"
                                            ? "Spacer Block"
                                            : link.link || "No URL"}
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="text-sm text-gray-600">
                                    {link.click_number} clicks
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleToggleVisibility(link.id)}
                                        className="p-2 hover:bg-gray-100 rounded-md"
                                        title={
                                            link.up_link === "yes" ? "Hide" : "Show"
                                        }
                                    >
                                        {link.up_link === "yes" ? (
                                            <Eye className="w-4 h-4 text-green-600" />
                                        ) : (
                                            <EyeOff className="w-4 h-4 text-gray-400" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => openEditModal(link)}
                                        className="p-2 hover:bg-gray-100 rounded-md"
                                    >
                                        <Edit2 className="w-4 h-4 text-blue-600" />
                                    </button>
                                    <button
                                        onClick={() => setLinkToDelete(link)}
                                        className="p-2 hover:bg-gray-100 rounded-md"
                                    >
                                        <Trash2 className="w-4 h-4 text-red-600" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add/Edit Modal */}
            <Dialog
                open={isAddModalOpen || !!editingLink}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsAddModalOpen(false);
                        setEditingLink(null);
                        resetForm();
                    }
                }}
            >
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingLink ? "Edit Block" : "Add New Block"}
                        </DialogTitle>
                        <DialogDescription>
                            Create custom links, text blocks, and more for your bio
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Block Type Selector */}
                        <div className="space-y-2">
                            <Label htmlFor="type">Block Type</Label>
                            <Select
                                value={linkType}
                                onValueChange={(value) => {
                                    setLinkType(value as LinkBlockType);
                                    setFormData({ ...formData, type: value as LinkBlockType });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select block type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="link">🔗 Link Button</SelectItem>
                                    <SelectItem value="predefined">
                                        📱 Social Media (Predefined)
                                    </SelectItem>
                                    <SelectItem value="heading">
                                        📰 Heading
                                    </SelectItem>
                                    <SelectItem value="text">📝 Text Block</SelectItem>
                                    <SelectItem value="spacer">
                                        ➖ Spacer
                                    </SelectItem>
                                    <SelectItem value="telephone">
                                        📞 Phone Number
                                    </SelectItem>
                                    <SelectItem value="email">
                                        ✉️ Email Address
                                    </SelectItem>
                                    <SelectItem value="vcard">
                                        💼 Contact Card (vCard)
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Dynamic Fields Based on Type */}
                        {linkType === "link" && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="title">Button Text</Label>
                                    <Input
                                        id="title"
                                        placeholder="e.g., Visit My Website"
                                        value={formData.title || ""}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                title: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="link">URL</Label>
                                    <Input
                                        id="link"
                                        type="url"
                                        placeholder="https://example.com"
                                        value={formData.link || ""}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                link: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="icon">
                                        Icon (FontAwesome class)
                                    </Label>
                                    <Input
                                        id="icon"
                                        placeholder="fa-solid fa-link"
                                        value={formData.custom_icon || ""}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                custom_icon: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </>
                        )}

                        {linkType === "heading" && (
                            <div className="space-y-2">
                                <Label htmlFor="heading">Heading Text</Label>
                                <Input
                                    id="heading"
                                    placeholder="Section Title"
                                    value={formData.title || ""}
                                    onChange={(e) =>
                                        setFormData({ ...formData, title: e.target.value })
                                    }
                                />
                            </div>
                        )}

                        {linkType === "text" && (
                            <div className="space-y-2">
                                <Label htmlFor="text">Text Content</Label>
                                <Textarea
                                    id="text"
                                    placeholder="Enter your text here..."
                                    rows={4}
                                    value={formData.title || ""}
                                    onChange={(e) =>
                                        setFormData({ ...formData, title: e.target.value })
                                    }
                                />
                            </div>
                        )}

                        {linkType === "spacer" && (
                            <div className="p-4 bg-gray-50 rounded-md">
                                <p className="text-sm text-gray-600">
                                    Spacer blocks add vertical space between other blocks
                                </p>
                            </div>
                        )}

                        {linkType === "telephone" && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="+1 (555) 123-4567"
                                        value={formData.link || ""}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                link: `tel:${e.target.value}`,
                                            })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone-label">Button Label</Label>
                                    <Input
                                        id="phone-label"
                                        placeholder="Call Me"
                                        value={formData.title || ""}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                title: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </>
                        )}

                        {linkType === "email" && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="hello@example.com"
                                        value={formData.link || ""}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                link: `mailto:${e.target.value}`,
                                            })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email-label">Button Label</Label>
                                    <Input
                                        id="email-label"
                                        placeholder="Email Me"
                                        value={formData.title || ""}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                title: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </>
                        )}

                        {linkType === "predefined" && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="service">Social Platform</Label>
                                    <Select
                                        value={formData.type_params?.service_name || ""}
                                        onValueChange={(value) =>
                                            setFormData({
                                                ...formData,
                                                type_params: {
                                                    ...formData.type_params,
                                                    service_name: value,
                                                },
                                            })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choose platform" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.values(PREDEFINED_LINKS).map((platform) => (
                                                <SelectItem
                                                    key={platform.name}
                                                    value={platform.name}
                                                >
                                                    {platform.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="username">Username/Handle</Label>
                                    <Input
                                        id="username"
                                        placeholder="@yourhandle"
                                        value={formData.type_params?.username || ""}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                type_params: {
                                                    ...formData.type_params,
                                                    username: e.target.value,
                                                },
                                            })
                                        }
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsAddModalOpen(false);
                                setEditingLink(null);
                                resetForm();
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={editingLink ? handleUpdateLink : handleAddLink}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {editingLink ? "Update Block" : "Add Block"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!linkToDelete} onOpenChange={(open) => !open && setLinkToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            Delete Link
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <span className="font-semibold text-foreground">{linkToDelete?.title || "this link"}</span>?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteLink}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            Delete Link
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

