import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkflowBuilderStore } from "@/stores/useWorkflowBuilderStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Workflow,
  Play,
  Pause,
  MoreVertical,
  Trash2,
  Copy,
  Settings,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Workflow as WorkflowType, WorkflowCategory } from "@/types/workflow";

const CATEGORY_LABELS: Record<WorkflowCategory, string> = {
  lead_management: "Lead Management",
  listing_automation: "Listing Automation",
  marketing: "Marketing",
  notifications: "Notifications",
  integrations: "Integrations",
  general: "General",
};

export const WorkflowsListPage = () => {
  const navigate = useNavigate();
  const { loadUserWorkflows } = useWorkflowBuilderStore();

  const [workflows, setWorkflows] = useState<WorkflowType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const fetchWorkflows = async () => {
      setIsLoading(true);
      try {
        const data = await loadUserWorkflows();
        setWorkflows(data);
      } catch (error) {
        console.error("Failed to load workflows:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkflows();
  }, []);

  const filteredWorkflows = workflows.filter((workflow) => {
    // Search filter
    if (
      searchQuery &&
      !workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !workflow.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    // Category filter
    if (categoryFilter !== "all" && workflow.category !== categoryFilter) {
      return false;
    }

    // Status filter
    if (statusFilter === "active" && !workflow.isActive) return false;
    if (statusFilter === "inactive" && workflow.isActive) return false;
    if (statusFilter === "draft" && workflow.isPublished) return false;

    return true;
  });

  const handleCreateNew = () => {
    navigate("/dashboard/workflows/new");
  };

  const handleEditWorkflow = (workflowId: string) => {
    navigate(`/dashboard/workflows/${workflowId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflows</h1>
          <p className="text-gray-600 mt-1">
            Automate your real estate operations with visual workflows
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="w-4 h-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Workflows list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : filteredWorkflows.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border">
          <Workflow className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {workflows.length === 0
              ? "No workflows yet"
              : "No matching workflows"}
          </h3>
          <p className="text-gray-600 mb-6">
            {workflows.length === 0
              ? "Create your first workflow to automate your operations"
              : "Try adjusting your filters"}
          </p>
          {workflows.length === 0 && (
            <Button onClick={handleCreateNew}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Workflow
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredWorkflows.map((workflow) => (
            <div
              key={workflow.id}
              className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleEditWorkflow(workflow.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {workflow.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      {workflow.isActive ? (
                        <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                          Active
                        </span>
                      ) : workflow.isPublished ? (
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                          Inactive
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                          Draft
                        </span>
                      )}
                      <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded">
                        {CATEGORY_LABELS[workflow.category]}
                      </span>
                    </div>
                  </div>

                  {workflow.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {workflow.description}
                    </p>
                  )}

                  <div className="flex items-center gap-6 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Updated {formatDate(workflow.updatedAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Play className="w-3.5 h-3.5" />
                      {workflow.executionCount} runs
                    </div>
                    {workflow.executionCount > 0 && (
                      <>
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-3.5 h-3.5" />
                          {workflow.successCount} success
                        </div>
                        {workflow.failureCount > 0 && (
                          <div className="flex items-center gap-1 text-red-600">
                            <XCircle className="w-3.5 h-3.5" />
                            {workflow.failureCount} failed
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditWorkflow(workflow.id);
                      }}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => e.stopPropagation()}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkflowsListPage;
