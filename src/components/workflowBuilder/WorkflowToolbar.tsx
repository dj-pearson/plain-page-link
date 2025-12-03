import { useWorkflowBuilderStore } from "@/stores/useWorkflowBuilderStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Undo2,
  Redo2,
  Save,
  Play,
  Pause,
  Settings,
  Eye,
  Upload,
  Loader2,
  Power,
  PowerOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkflowToolbarProps {
  onOpenSettings?: () => void;
  onPreview?: () => void;
}

export const WorkflowToolbar = ({
  onOpenSettings,
  onPreview,
}: WorkflowToolbarProps) => {
  const {
    workflow,
    isSaving,
    isExecuting,
    canUndo,
    canRedo,
    undo,
    redo,
    saveWorkflow,
    publishWorkflow,
    activateWorkflow,
    executeWorkflow,
    updateWorkflowMeta,
  } = useWorkflowBuilderStore();

  if (!workflow) return null;

  const handleNameChange = (e: React.FocusEvent<HTMLInputElement>) => {
    const name = e.target.value.trim();
    if (name && name !== workflow.name) {
      updateWorkflowMeta({ name });
    }
  };

  const handleExecute = async () => {
    try {
      await executeWorkflow();
    } catch (error) {
      console.error("Execution failed:", error);
    }
  };

  const handleToggleActive = async () => {
    await activateWorkflow(!workflow.isActive);
  };

  return (
    <div className="h-14 bg-white border-b px-4 flex items-center justify-between">
      {/* Left section */}
      <div className="flex items-center gap-4">
        {/* Workflow name */}
        <Input
          defaultValue={workflow.name}
          onBlur={handleNameChange}
          className="w-64 font-medium border-0 bg-transparent hover:bg-gray-50 focus:bg-white"
          placeholder="Workflow name..."
        />

        {/* Status badges */}
        <div className="flex items-center gap-2">
          {workflow.isPublished && (
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
              Published
            </span>
          )}
          {workflow.isActive ? (
            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Active
            </span>
          ) : (
            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
              Inactive
            </span>
          )}
        </div>
      </div>

      {/* Center section - History controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={undo}
          disabled={!canUndo()}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={redo}
          disabled={!canRedo()}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Preview */}
        {onPreview && (
          <Button variant="ghost" size="sm" onClick={onPreview}>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
        )}

        {/* Settings */}
        {onOpenSettings && (
          <Button variant="ghost" size="sm" onClick={onOpenSettings}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        )}

        {/* Activate/Deactivate */}
        <Button
          variant={workflow.isActive ? "outline" : "secondary"}
          size="sm"
          onClick={handleToggleActive}
          disabled={!workflow.isPublished}
          title={!workflow.isPublished ? "Publish workflow first" : undefined}
        >
          {workflow.isActive ? (
            <>
              <PowerOff className="w-4 h-4 mr-2" />
              Deactivate
            </>
          ) : (
            <>
              <Power className="w-4 h-4 mr-2" />
              Activate
            </>
          )}
        </Button>

        {/* Test run */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleExecute}
          disabled={isExecuting || workflow.nodes.length === 0}
        >
          {isExecuting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Test Run
            </>
          )}
        </Button>

        {/* Save */}
        <Button
          variant="outline"
          size="sm"
          onClick={saveWorkflow}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save
            </>
          )}
        </Button>

        {/* Publish */}
        {!workflow.isPublished && (
          <Button size="sm" onClick={publishWorkflow} disabled={isSaving}>
            <Upload className="w-4 h-4 mr-2" />
            Publish
          </Button>
        )}
      </div>
    </div>
  );
};

export default WorkflowToolbar;
