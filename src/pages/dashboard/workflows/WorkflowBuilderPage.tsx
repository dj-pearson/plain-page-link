import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWorkflowBuilderStore } from "@/stores/useWorkflowBuilderStore";
import {
  WorkflowCanvas,
  WorkflowNodePalette,
  WorkflowNodeInspector,
  WorkflowToolbar,
} from "@/components/workflowBuilder";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft } from "lucide-react";
import type { WorkflowCategory, WorkflowNodeTemplate } from "@/types/workflow";

const CATEGORY_OPTIONS: { value: WorkflowCategory; label: string }[] = [
  { value: "lead_management", label: "Lead Management" },
  { value: "listing_automation", label: "Listing Automation" },
  { value: "marketing", label: "Marketing" },
  { value: "notifications", label: "Notifications" },
  { value: "integrations", label: "Integrations" },
  { value: "general", label: "General" },
];

export const WorkflowBuilderPage = () => {
  const { workflowId } = useParams();
  const navigate = useNavigate();
  const {
    workflow,
    loadWorkflow,
    createNewWorkflow,
    resetBuilder,
    updateWorkflowMeta,
  } = useWorkflowBuilderStore();

  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [draggedTemplate, setDraggedTemplate] = useState<WorkflowNodeTemplate | null>(null);

  useEffect(() => {
    const initWorkflow = async () => {
      setIsLoading(true);
      try {
        if (workflowId && workflowId !== "new") {
          await loadWorkflow(workflowId);
        } else {
          createNewWorkflow("Untitled Workflow");
        }
      } catch (error) {
        console.error("Failed to initialize workflow:", error);
        navigate("/dashboard/workflows");
      } finally {
        setIsLoading(false);
      }
    };

    initWorkflow();

    return () => {
      resetBuilder();
    };
  }, [workflowId]);

  const handleBack = () => {
    navigate("/dashboard/workflows");
  };

  const handleDragStart = (template: WorkflowNodeTemplate) => {
    setDraggedTemplate(template);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top bar */}
      <div className="h-12 bg-white border-b px-4 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="h-6 w-px bg-gray-200" />
        <span className="text-sm text-gray-600">Workflow Builder</span>
      </div>

      {/* Toolbar */}
      <WorkflowToolbar
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Node palette */}
        <WorkflowNodePalette onDragStart={handleDragStart} />

        {/* Canvas */}
        <WorkflowCanvas className="flex-1" />

        {/* Right sidebar - Node inspector */}
        <WorkflowNodeInspector />
      </div>

      {/* Settings dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Workflow Settings</DialogTitle>
            <DialogDescription>
              Configure your workflow settings and metadata
            </DialogDescription>
          </DialogHeader>

          {workflow && (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Workflow Name
                </label>
                <Input
                  value={workflow.name}
                  onChange={(e) =>
                    updateWorkflowMeta({ name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Description
                </label>
                <Textarea
                  value={workflow.description || ""}
                  onChange={(e) =>
                    updateWorkflowMeta({ description: e.target.value })
                  }
                  placeholder="Describe what this workflow does..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Category
                </label>
                <Select
                  value={workflow.category}
                  onValueChange={(value) =>
                    updateWorkflowMeta({ category: value as WorkflowCategory })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Tags
                </label>
                <Input
                  value={workflow.tags.join(", ")}
                  onChange={(e) =>
                    updateWorkflowMeta({
                      tags: e.target.value
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="Enter tags separated by commas"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <Button onClick={() => setShowSettings(false)}>Done</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkflowBuilderPage;
