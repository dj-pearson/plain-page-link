import { memo } from "react";
import { cn } from "@/lib/utils";
import type { WorkflowNode as WorkflowNodeType } from "@/types/workflow";
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
} from "lucide-react";

interface WorkflowNodeProps {
  node: WorkflowNodeType;
  isSelected: boolean;
  isConnecting: boolean;
  onSelect: () => void;
  onStartConnection: () => void;
  onCompleteConnection: () => void;
  onDragStart: (e: React.DragEvent) => void;
}

const NODE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  manual: Play,
  schedule: Calendar,
  webhook: Link,
  lead_created: User,
  lead_updated: User,
  listing_created: Home,
  listing_updated: Home,
  send_email: Mail,
  send_sms: MessageSquare,
  update_lead: User,
  create_task: CheckSquare,
  webhook_call: Globe,
  add_tag: Tag,
  if_else: GitBranch,
  switch: GitBranch,
  filter: Filter,
  wait: Clock,
  wait_until: Calendar,
  for_each: Repeat,
  set_variable: Variable,
  format_data: Code,
};

const NODE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  trigger: { bg: "bg-green-50", border: "border-green-300", text: "text-green-700" },
  action: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700" },
  condition: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700" },
  delay: { bg: "bg-purple-50", border: "border-purple-300", text: "text-purple-700" },
  loop: { bg: "bg-teal-50", border: "border-teal-300", text: "text-teal-700" },
  transform: { bg: "bg-pink-50", border: "border-pink-300", text: "text-pink-700" },
};

export const WorkflowNode = memo(
  ({
    node,
    isSelected,
    isConnecting,
    onSelect,
    onStartConnection,
    onCompleteConnection,
    onDragStart,
  }: WorkflowNodeProps) => {
    const Icon = NODE_ICONS[node.subtype] || Zap;
    const colors = NODE_COLORS[node.type] || NODE_COLORS.action;

    const handleMouseDown = (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect();
    };

    const handleConnectionPoint = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isConnecting) {
        onCompleteConnection();
      } else {
        onStartConnection();
      }
    };

    return (
      <div
        className={cn(
          "absolute cursor-grab active:cursor-grabbing",
          "min-w-[180px] rounded-lg border-2 shadow-md transition-all",
          colors.bg,
          colors.border,
          isSelected && "ring-2 ring-blue-500 ring-offset-2",
          isConnecting && "ring-2 ring-green-400 ring-offset-1"
        )}
        style={{
          left: node.position.x,
          top: node.position.y,
        }}
        onMouseDown={handleMouseDown}
        draggable
        onDragStart={onDragStart}
      >
        {/* Input connection point */}
        {node.type !== "trigger" && (
          <div
            className={cn(
              "absolute -top-3 left-1/2 -translate-x-1/2",
              "w-4 h-4 rounded-full bg-white border-2 border-gray-300",
              "cursor-crosshair hover:border-green-500 hover:bg-green-50",
              "transition-colors"
            )}
            onClick={handleConnectionPoint}
          />
        )}

        {/* Node content */}
        <div className="p-3">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                colors.text,
                "bg-white/50"
              )}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-900 truncate">
                {node.label}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {node.type}
              </p>
            </div>
          </div>

          {node.description && (
            <p className="mt-2 text-xs text-gray-600 line-clamp-2">
              {node.description}
            </p>
          )}
        </div>

        {/* Output connection points */}
        {node.type === "condition" ? (
          <div className="flex justify-around pb-2">
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-green-600 font-medium">Yes</span>
              <div
                className={cn(
                  "w-4 h-4 rounded-full bg-white border-2 border-green-400",
                  "cursor-crosshair hover:border-green-600 hover:bg-green-50",
                  "transition-colors"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onStartConnection();
                }}
              />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-red-600 font-medium">No</span>
              <div
                className={cn(
                  "w-4 h-4 rounded-full bg-white border-2 border-red-400",
                  "cursor-crosshair hover:border-red-600 hover:bg-red-50",
                  "transition-colors"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onStartConnection();
                }}
              />
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "absolute -bottom-3 left-1/2 -translate-x-1/2",
              "w-4 h-4 rounded-full bg-white border-2 border-gray-300",
              "cursor-crosshair hover:border-green-500 hover:bg-green-50",
              "transition-colors"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onStartConnection();
            }}
          />
        )}
      </div>
    );
  }
);

WorkflowNode.displayName = "WorkflowNode";

export default WorkflowNode;
