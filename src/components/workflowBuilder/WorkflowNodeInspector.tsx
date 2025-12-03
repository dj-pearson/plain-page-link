import { useState, useEffect } from "react";
import { useWorkflowBuilderStore } from "@/stores/useWorkflowBuilderStore";
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
import { X, Trash2, Copy, Settings2 } from "lucide-react";
import { NODE_CONFIG_SCHEMAS } from "@/types/workflow";
import type { WorkflowNode } from "@/types/workflow";

export const WorkflowNodeInspector = () => {
  const {
    workflow,
    selectedNodeId,
    selectNode,
    updateNode,
    removeNode,
    duplicateNode,
  } = useWorkflowBuilderStore();

  const selectedNode = workflow?.nodes.find((n) => n.id === selectedNodeId);
  const [localConfig, setLocalConfig] = useState<Record<string, any>>({});

  useEffect(() => {
    if (selectedNode) {
      setLocalConfig(selectedNode.config || {});
    }
  }, [selectedNode?.id, selectedNode?.config]);

  if (!selectedNode) {
    return (
      <div className="w-80 bg-white border-l flex flex-col items-center justify-center p-8 text-center">
        <Settings2 className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-500">
          Select a node to configure its properties
        </p>
      </div>
    );
  }

  const configSchema = NODE_CONFIG_SCHEMAS[selectedNode.subtype] || {};

  const handleConfigChange = (key: string, value: any) => {
    const newConfig = { ...localConfig, [key]: value };
    setLocalConfig(newConfig);
    updateNode(selectedNodeId!, { config: newConfig });
  };

  const handleLabelChange = (label: string) => {
    updateNode(selectedNodeId!, { label });
  };

  const handleDescriptionChange = (description: string) => {
    updateNode(selectedNodeId!, { description });
  };

  const renderConfigField = (key: string, schema: Record<string, any>) => {
    const value = localConfig[key] ?? schema.default ?? "";

    switch (schema.type) {
      case "string":
        return (
          <Input
            value={value}
            onChange={(e) => handleConfigChange(key, e.target.value)}
            placeholder={schema.placeholder}
          />
        );

      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleConfigChange(key, Number(e.target.value))}
            min={schema.min}
            max={schema.max}
          />
        );

      case "textarea":
        return (
          <Textarea
            value={value}
            onChange={(e) => handleConfigChange(key, e.target.value)}
            placeholder={schema.placeholder}
            rows={4}
            maxLength={schema.maxLength}
          />
        );

      case "select":
        return (
          <Select
            value={value}
            onValueChange={(v) => handleConfigChange(key, v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${schema.label}`} />
            </SelectTrigger>
            <SelectContent>
              {(schema.options || []).map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "json":
        return (
          <Textarea
            value={typeof value === "string" ? value : JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                handleConfigChange(key, JSON.parse(e.target.value));
              } catch {
                // Keep as string if not valid JSON
                handleConfigChange(key, e.target.value);
              }
            }}
            placeholder="{}"
            rows={4}
            className="font-mono text-sm"
          />
        );

      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleConfigChange(key, e.target.value)}
          />
        );
    }
  };

  return (
    <div className="w-80 bg-white border-l flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Node Settings</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => selectNode(null)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Label</label>
            <Input
              value={selectedNode.label}
              onChange={(e) => handleLabelChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Description
            </label>
            <Textarea
              value={selectedNode.description || ""}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Add a description..."
              rows={2}
            />
          </div>
        </div>

        {/* Type Info */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Type</span>
            <span className="font-medium capitalize">{selectedNode.type}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-500">Action</span>
            <span className="font-medium capitalize">
              {selectedNode.subtype.replace(/_/g, " ")}
            </span>
          </div>
        </div>

        {/* Configuration Fields */}
        {Object.keys(configSchema).length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Configuration</h4>
            {Object.entries(configSchema).map(([key, schema]: [string, any]) => (
              <div key={key} className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {schema.label}
                  {schema.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                {renderConfigField(key, schema)}
                {schema.help && (
                  <p className="text-xs text-gray-500">{schema.help}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Variables help */}
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-blue-700 font-medium mb-1">
            Using Variables
          </p>
          <p className="text-xs text-blue-600">
            Use double curly braces to insert variables:
            <code className="bg-blue-100 px-1 mx-1 rounded">
              {"{{lead.email}}"}
            </code>
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t space-y-2">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => duplicateNode(selectedNodeId!)}
            className="flex-1"
          >
            <Copy className="w-4 h-4 mr-2" />
            Duplicate
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              removeNode(selectedNodeId!);
              selectNode(null);
            }}
            className="flex-1"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WorkflowNodeInspector;
