import { useRef, useState, useCallback, useEffect } from "react";
import { useWorkflowBuilderStore } from "@/stores/useWorkflowBuilderStore";
import { WorkflowNode } from "./WorkflowNode";
import { cn } from "@/lib/utils";
import type { WorkflowNodeTemplate, WorkflowNode as WorkflowNodeType } from "@/types/workflow";

interface WorkflowCanvasProps {
  className?: string;
}

export const WorkflowCanvas = ({ className }: WorkflowCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    workflow,
    selectedNodeId,
    isConnecting,
    connectionStart,
    selectNode,
    addNode,
    updateNode,
    startConnection,
    completeConnection,
    cancelConnection,
    addEdge,
    updateViewport,
  } = useWorkflowBuilderStore();

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Handle node drag within canvas
  const handleNodeDrag = useCallback(
    (nodeId: string, e: React.DragEvent) => {
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - (workflow?.viewport.x || 0);
      const y = e.clientY - rect.top - (workflow?.viewport.y || 0);

      updateNode(nodeId, { position: { x, y } });
    },
    [workflow?.viewport, updateNode]
  );

  // Handle dropping new node from palette
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();

      if (!canvasRef.current) return;

      const templateData = e.dataTransfer.getData("application/workflow-node");
      if (!templateData) return;

      const template: WorkflowNodeTemplate = JSON.parse(templateData);

      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - (workflow?.viewport.x || 0) - 90; // Center node
      const y = e.clientY - rect.top - (workflow?.viewport.y || 0) - 30;

      addNode(template.type, template.subtype, { x, y }, template.defaultConfig);
    },
    [workflow?.viewport, addNode]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  // Handle canvas panning
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only pan with middle mouse button or when clicking on canvas background
    if (e.button === 1 || (e.button === 0 && e.target === canvasRef.current)) {
      setPanStart({ x: e.clientX, y: e.clientY });
      selectNode(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });

    if (panStart && canvasRef.current) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;

      updateViewport({
        x: (workflow?.viewport.x || 0) + dx,
        y: (workflow?.viewport.y || 0) + dy,
      });

      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setPanStart(null);
    if (isConnecting) {
      cancelConnection();
    }
  };

  // Handle wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();

      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const currentZoom = workflow?.viewport.zoom || 1;
      const newZoom = Math.max(0.25, Math.min(2, currentZoom * delta));

      updateViewport({ zoom: newZoom });
    }
  };

  // Draw edges as SVG paths
  const renderEdges = () => {
    if (!workflow) return null;

    return workflow.edges.map((edge) => {
      const sourceNode = workflow.nodes.find((n) => n.id === edge.source);
      const targetNode = workflow.nodes.find((n) => n.id === edge.target);

      if (!sourceNode || !targetNode) return null;

      // Calculate edge positions
      const sourceX = sourceNode.position.x + 90; // Center of node
      const sourceY = sourceNode.position.y + 60; // Bottom of node
      const targetX = targetNode.position.x + 90; // Center of node
      const targetY = targetNode.position.y; // Top of node

      // Create curved path
      const midY = (sourceY + targetY) / 2;
      const path = `M ${sourceX} ${sourceY} C ${sourceX} ${midY}, ${targetX} ${midY}, ${targetX} ${targetY}`;

      return (
        <g key={edge.id}>
          <path
            d={path}
            stroke="#94a3b8"
            strokeWidth={2}
            fill="none"
            className="transition-colors hover:stroke-blue-500"
          />
          {/* Arrow head */}
          <polygon
            points={`${targetX},${targetY} ${targetX - 5},${targetY - 10} ${targetX + 5},${targetY - 10}`}
            fill="#94a3b8"
          />
          {/* Label */}
          {edge.label && (
            <text
              x={(sourceX + targetX) / 2}
              y={(sourceY + targetY) / 2 - 10}
              textAnchor="middle"
              className="text-xs fill-gray-500"
            >
              {edge.label}
            </text>
          )}
        </g>
      );
    });
  };

  // Render connection line while connecting
  const renderConnectionLine = () => {
    if (!isConnecting || !connectionStart || !workflow || !canvasRef.current)
      return null;

    const sourceNode = workflow.nodes.find((n) => n.id === connectionStart);
    if (!sourceNode) return null;

    const rect = canvasRef.current.getBoundingClientRect();
    const sourceX = sourceNode.position.x + 90;
    const sourceY = sourceNode.position.y + 60;
    const targetX = mousePosition.x - rect.left - (workflow.viewport.x || 0);
    const targetY = mousePosition.y - rect.top - (workflow.viewport.y || 0);

    const midY = (sourceY + targetY) / 2;
    const path = `M ${sourceX} ${sourceY} C ${sourceX} ${midY}, ${targetX} ${midY}, ${targetX} ${targetY}`;

    return (
      <path
        d={path}
        stroke="#22c55e"
        strokeWidth={2}
        strokeDasharray="5,5"
        fill="none"
      />
    );
  };

  if (!workflow) {
    return (
      <div className={cn("flex items-center justify-center bg-gray-100", className)}>
        <p className="text-gray-500">No workflow loaded</p>
      </div>
    );
  }

  return (
    <div
      ref={canvasRef}
      className={cn(
        "relative overflow-hidden bg-gray-100",
        "bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]",
        panStart && "cursor-grabbing",
        className
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Zoom indicator */}
      <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm rounded px-2 py-1 text-xs text-gray-500 z-10">
        {Math.round((workflow.viewport.zoom || 1) * 100)}%
      </div>

      {/* Canvas content with viewport transform */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${workflow.viewport.x}px, ${workflow.viewport.y}px) scale(${workflow.viewport.zoom || 1})`,
          transformOrigin: "0 0",
        }}
      >
        {/* Edges SVG layer */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {renderEdges()}
          {renderConnectionLine()}
        </svg>

        {/* Nodes */}
        {workflow.nodes.map((node) => (
          <WorkflowNode
            key={node.id}
            node={node}
            isSelected={selectedNodeId === node.id}
            isConnecting={isConnecting}
            onSelect={() => selectNode(node.id)}
            onStartConnection={() => startConnection(node.id)}
            onCompleteConnection={() => completeConnection(node.id)}
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", node.id);
            }}
          />
        ))}
      </div>

      {/* Empty state */}
      {workflow.nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-gray-500 mb-2">
              Drag nodes from the palette to start building
            </p>
            <p className="text-sm text-gray-400">
              Start with a trigger node to define when your workflow runs
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowCanvas;
