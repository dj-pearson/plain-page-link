import { useState, useEffect } from "react";
import { useWorkflowBuilderStore } from "@/stores/useWorkflowBuilderStore";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Play,
  Mail,
  MessageSquare,
  Clock,
  GitBranch,
  Repeat,
  Globe,
  User,
  Tag,
  CheckSquare,
  Zap,
  Calendar,
  Link,
  Home,
  Bell,
  Filter,
  Variable,
  Code,
  Search,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { WorkflowNodeTemplate } from "@/types/workflow";

interface WorkflowNodePaletteProps {
  onDragStart: (template: WorkflowNodeTemplate) => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  play: Play,
  mail: Mail,
  "message-square": MessageSquare,
  clock: Clock,
  "git-branch": GitBranch,
  repeat: Repeat,
  globe: Globe,
  user: User,
  tag: Tag,
  "check-square": CheckSquare,
  zap: Zap,
  calendar: Calendar,
  link: Link,
  home: Home,
  bell: Bell,
  filter: Filter,
  variable: Variable,
  code: Code,
};

const CATEGORY_ORDER = [
  "triggers",
  "communication",
  "crm",
  "productivity",
  "integrations",
  "organization",
  "logic",
  "timing",
  "data",
  "iteration",
];

const CATEGORY_LABELS: Record<string, string> = {
  triggers: "Triggers",
  communication: "Communication",
  crm: "CRM",
  productivity: "Productivity",
  integrations: "Integrations",
  organization: "Organization",
  logic: "Logic",
  timing: "Timing",
  data: "Data",
  iteration: "Iteration",
};

export const WorkflowNodePalette = ({ onDragStart }: WorkflowNodePaletteProps) => {
  const { nodeTemplates, loadNodeTemplates } = useWorkflowBuilderStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["triggers"])
  );

  useEffect(() => {
    loadNodeTemplates();
  }, [loadNodeTemplates]);

  // Group templates by category
  const templatesByCategory = nodeTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, WorkflowNodeTemplate[]>);

  // Filter templates by search
  const filteredCategories = Object.entries(templatesByCategory)
    .map(([category, templates]) => ({
      category,
      templates: templates.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description?.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((c) => c.templates.length > 0)
    .sort(
      (a, b) =>
        CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)
    );

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleDragStart = (
    e: React.DragEvent,
    template: WorkflowNodeTemplate
  ) => {
    e.dataTransfer.setData("application/workflow-node", JSON.stringify(template));
    e.dataTransfer.effectAllowed = "copy";
    onDragStart(template);
  };

  return (
    <div className="w-64 bg-white border-r flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="font-semibold text-gray-900 mb-2">Workflow Nodes</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Node list */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredCategories.map(({ category, templates }) => {
          const isExpanded =
            expandedCategories.has(category) || searchQuery.length > 0;

          return (
            <div key={category} className="mb-2">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                {CATEGORY_LABELS[category] || category}
                <span className="ml-auto text-xs text-gray-400">
                  {templates.length}
                </span>
              </button>

              {isExpanded && (
                <div className="mt-1 space-y-1">
                  {templates.map((template) => {
                    const Icon = ICON_MAP[template.icon] || Zap;

                    return (
                      <div
                        key={template.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, template)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg",
                          "cursor-grab active:cursor-grabbing",
                          "border border-transparent hover:border-gray-200",
                          "hover:bg-gray-50 transition-colors",
                          template.isPremium && "opacity-75"
                        )}
                        style={{
                          borderLeftColor: template.color,
                          borderLeftWidth: "3px",
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded flex items-center justify-center"
                          style={{ backgroundColor: `${template.color}20` }}
                        >
                          <Icon
                            className="w-4 h-4"
                            style={{ color: template.color }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {template.name}
                          </p>
                          {template.description && (
                            <p className="text-xs text-gray-500 truncate">
                              {template.description}
                            </p>
                          )}
                        </div>
                        {template.isPremium && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                            Pro
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {filteredCategories.length === 0 && (
          <p className="text-center text-sm text-gray-500 py-8">
            No nodes found
          </p>
        )}
      </div>

      {/* Help text */}
      <div className="p-3 border-t bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          Drag nodes onto the canvas to build your workflow
        </p>
      </div>
    </div>
  );
};

export default WorkflowNodePalette;
