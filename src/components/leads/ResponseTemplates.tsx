/**
 * Quick Response Templates Component
 * Pre-built templates for fast lead responses
 */

import { useState } from "react";
import { MessageSquare, Copy, Edit2, Trash2, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Template {
    id: string;
    name: string;
    subject: string;
    body: string;
    category: "initial" | "followup" | "showing" | "offer" | "general";
    variables: string[]; // e.g., ["leadName", "listingAddress", "price"]
}

interface ResponseTemplatesProps {
    templates: Template[];
    onSelectTemplate: (template: Template) => void;
    onCreateTemplate?: (template: Omit<Template, "id">) => void;
    onUpdateTemplate?: (id: string, template: Partial<Template>) => void;
    onDeleteTemplate?: (id: string) => void;
    className?: string;
}

export function ResponseTemplates({
    templates,
    onSelectTemplate,
    onCreateTemplate,
    onUpdateTemplate,
    onDeleteTemplate,
    className,
}: ResponseTemplatesProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const filteredTemplates = templates.filter((template) => {
        const matchesCategory =
            selectedCategory === "all" ||
            template.category === selectedCategory;
        const matchesSearch =
            searchQuery === "" ||
            template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.body.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const categories = [
        { value: "all", label: "All Templates" },
        { value: "initial", label: "Initial Response" },
        { value: "followup", label: "Follow-up" },
        { value: "showing", label: "Property Showing" },
        { value: "offer", label: "Offer Discussion" },
        { value: "general", label: "General" },
    ];

    return (
        <div className={cn("space-y-4", className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                    Quick Response Templates
                </h3>
                {onCreateTemplate && (
                    <Dialog open={isCreating} onOpenChange={setIsCreating}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="gap-2">
                                <Plus className="w-4 h-4" />
                                New Template
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Template</DialogTitle>
                            </DialogHeader>
                            <TemplateForm
                                onSave={(template) => {
                                    onCreateTemplate(template);
                                    setIsCreating(false);
                                    toast.success("Template created");
                                }}
                                onCancel={() => setIsCreating(false)}
                            />
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map((cat) => (
                    <Button
                        key={cat.value}
                        variant={
                            selectedCategory === cat.value
                                ? "default"
                                : "outline"
                        }
                        size="sm"
                        onClick={() => setSelectedCategory(cat.value)}
                    >
                        {cat.label}
                    </Button>
                ))}
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredTemplates.map((template) => (
                    <TemplateCard
                        key={template.id}
                        template={template}
                        onUse={() => onSelectTemplate(template)}
                        onEdit={
                            onUpdateTemplate
                                ? (updates) =>
                                      onUpdateTemplate(template.id, updates)
                                : undefined
                        }
                        onDelete={
                            onDeleteTemplate
                                ? () => onDeleteTemplate(template.id)
                                : undefined
                        }
                    />
                ))}
            </div>

            {filteredTemplates.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No templates found</p>
                </div>
            )}
        </div>
    );
}

// Template Card Component
interface TemplateCardProps {
    template: Template;
    onUse: () => void;
    onEdit?: (updates: Partial<Template>) => void;
    onDelete?: () => void;
}

function TemplateCard({
    template,
    onUse,
    onEdit,
    onDelete,
}: TemplateCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [copied, setCopied] = useState(false);

    const categoryColors = {
        initial: "bg-green-100 text-green-800",
        followup: "bg-blue-100 text-blue-800",
        showing: "bg-purple-100 text-purple-800",
        offer: "bg-orange-100 text-orange-800",
        general: "bg-gray-100 text-gray-800",
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(template.body);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Template copied to clipboard");
    };

    return (
        <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                    <h4 className="font-semibold mb-1">{template.name}</h4>
                    <Badge className={categoryColors[template.category]}>
                        {template.category}
                    </Badge>
                </div>
                <div className="flex gap-1">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCopy}
                        className="h-8 w-8 p-0"
                    >
                        {copied ? (
                            <Check className="w-4 h-4 text-green-600" />
                        ) : (
                            <Copy className="w-4 h-4" />
                        )}
                    </Button>
                    {onEdit && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setIsEditing(true)}
                            className="h-8 w-8 p-0"
                        >
                            <Edit2 className="w-4 h-4" />
                        </Button>
                    )}
                    {onDelete && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={onDelete}
                            className="h-8 w-8 p-0 text-red-600"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>

            <p className="text-sm text-gray-600 mb-1 font-medium">
                {template.subject}
            </p>

            <p className="text-sm text-gray-700 line-clamp-3 mb-3">
                {template.body}
            </p>

            {template.variables.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                    {template.variables.map((variable) => (
                        <Badge
                            key={variable}
                            variant="outline"
                            className="text-xs"
                        >
                            {`{${variable}}`}
                        </Badge>
                    ))}
                </div>
            )}

            <Button size="sm" onClick={onUse} className="w-full">
                Use Template
            </Button>

            {/* Edit Dialog */}
            {isEditing && onEdit && (
                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Template</DialogTitle>
                        </DialogHeader>
                        <TemplateForm
                            initialData={template}
                            onSave={(updates) => {
                                onEdit(updates);
                                setIsEditing(false);
                                toast.success("Template updated");
                            }}
                            onCancel={() => setIsEditing(false)}
                        />
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}

// Template Form Component
interface TemplateFormProps {
    initialData?: Partial<Template>;
    onSave: (template: Omit<Template, "id">) => void;
    onCancel: () => void;
}

function TemplateForm({ initialData, onSave, onCancel }: TemplateFormProps) {
    const [name, setName] = useState(initialData?.name || "");
    const [subject, setSubject] = useState(initialData?.subject || "");
    const [body, setBody] = useState(initialData?.body || "");
    const [category, setCategory] = useState<Template["category"]>(
        initialData?.category || "general"
    );

    const handleSave = () => {
        if (!name || !subject || !body) {
            toast.error("Please fill in all fields");
            return;
        }

        // Extract variables from body (anything in {brackets})
        const variables = [...body.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);

        onSave({
            name,
            subject,
            body,
            category,
            variables,
        });
    };

    return (
        <div className="space-y-4">
            <div>
                <Label>Template Name</Label>
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Initial Response - Listing Inquiry"
                />
            </div>

            <div>
                <Label>Category</Label>
                <select
                    value={category}
                    onChange={(e) =>
                        setCategory(e.target.value as Template["category"])
                    }
                    className="w-full p-2 border rounded"
                >
                    <option value="initial">Initial Response</option>
                    <option value="followup">Follow-up</option>
                    <option value="showing">Property Showing</option>
                    <option value="offer">Offer Discussion</option>
                    <option value="general">General</option>
                </select>
            </div>

            <div>
                <Label>Subject Line</Label>
                <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Re: {listingAddress}"
                />
            </div>

            <div>
                <Label>Message Body</Label>
                <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Use {variable} for dynamic fields like {leadName}, {listingAddress}, etc."
                    rows={8}
                />
                <p className="text-xs text-gray-500 mt-1">
                    Use curly braces for variables: {"{leadName}"},{" "}
                    {"{listingAddress}"}, {"{price}"}
                </p>
            </div>

            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button onClick={handleSave}>Save Template</Button>
            </div>
        </div>
    );
}

// Default templates
export const DEFAULT_TEMPLATES: Template[] = [
    {
        id: "1",
        name: "Initial Response - Listing Inquiry",
        subject: "Re: {listingAddress}",
        body: `Hi {leadName},

Thank you for your interest in {listingAddress}! I'd love to help you learn more about this property.

This {bedrooms}-bedroom, {bathrooms}-bathroom home is priced at {price} and features:
• {feature1}
• {feature2}
• {feature3}

I'm available to schedule a showing at your convenience. What days/times work best for you this week?

Best regards,
{agentName}
{agentPhone}`,
        category: "initial",
        variables: [
            "leadName",
            "listingAddress",
            "bedrooms",
            "bathrooms",
            "price",
            "feature1",
            "feature2",
            "feature3",
            "agentName",
            "agentPhone",
        ],
    },
    {
        id: "2",
        name: "Follow-up - No Response",
        subject: "Following up on {listingAddress}",
        body: `Hi {leadName},

I wanted to follow up on your interest in {listingAddress}. I know finding the right home can take time, and I'm here to help.

Are you still interested in viewing this property? Or would you like me to send you similar listings that might fit your needs?

Feel free to call/text me anytime at {agentPhone}.

Best regards,
{agentName}`,
        category: "followup",
        variables: ["leadName", "listingAddress", "agentPhone", "agentName"],
    },
    {
        id: "3",
        name: "Showing Confirmation",
        subject: "Confirmed: Property Showing at {listingAddress}",
        body: `Hi {leadName},

Great news! Your showing for {listingAddress} is confirmed for {showingDate} at {showingTime}.

Property Address:
{listingAddress}

I'll meet you at the property. If you need to reschedule, please let me know as soon as possible.

Looking forward to showing you this home!

Best regards,
{agentName}
{agentPhone}`,
        category: "showing",
        variables: [
            "leadName",
            "listingAddress",
            "showingDate",
            "showingTime",
            "agentName",
            "agentPhone",
        ],
    },
];
