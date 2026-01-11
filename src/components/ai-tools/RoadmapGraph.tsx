import { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { CheckCircle2, Circle } from 'lucide-react';

interface RoadmapGraphProps {
  content: string;
  onNodeComplete?: (nodeId: string, completed: boolean) => void;
}

// Custom node component
function RoadmapNode({ data }: any) {
  const handleClick = () => {
    if (data.onToggle) {
      data.onToggle(data.id);
    }
  };

  return (
    <div
      className={`px-6 py-4 rounded-xl border-2 shadow-lg min-w-[200px] max-w-[280px] cursor-pointer transition-all hover:scale-105 ${
        data.completed
          ? 'border-green-500 bg-green-500/10'
          : 'border-primary/30 bg-card'
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {data.completed ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : (
            <Circle className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm mb-1 break-words">{data.label}</div>
          {data.description && (
            <div className="text-xs text-muted-foreground break-words">{data.description}</div>
          )}
          {data.duration && (
            <div className="text-xs text-primary mt-2">⏱️ {data.duration}</div>
          )}
        </div>
      </div>
    </div>
  );
}

const nodeTypes = {
  roadmapNode: RoadmapNode,
};

export function RoadmapGraph({ content, onNodeComplete }: RoadmapGraphProps) {
  const [completedNodes, setCompletedNodes] = useState<Set<string>>(new Set());

  // Parse the markdown content into nodes and edges
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    // Safety check for content
    if (!content || typeof content !== 'string') {
      return { initialNodes: nodes, initialEdges: edges };
    }
    
    // Parse markdown structure
    const lines = content.split('\n');
    let nodeId = 0;
    let lastNodeByLevel: { [level: number]: string } = {};
    let yOffset = 0;

    lines.forEach((line, index) => {
      // Match headers (# ## ###) or numbered lists (1. 2. 3.)
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      const listMatch = line.match(/^(\d+)\.\s+(.+)$/);
      const bulletMatch = line.match(/^[-*]\s+(.+)$/);
      
      if (headerMatch) {
        const level = headerMatch[1].length;
        const label = headerMatch[2].trim();
        const id = `node-${nodeId++}`;
        
        // Extract duration if present
        const durationMatch = label.match(/\(([^)]+)\)/);
        const duration = durationMatch ? durationMatch[1] : undefined;
        const cleanLabel = label.replace(/\([^)]+\)/, '').trim();
        
        nodes.push({
          id,
          type: 'roadmapNode',
          position: { x: (level - 1) * 300, y: yOffset },
          data: {
            id,
            label: cleanLabel,
            duration,
            completed: false,
            onToggle: (nodeId: string) => {
              setCompletedNodes(prev => {
                const newSet = new Set(prev);
                if (newSet.has(nodeId)) {
                  newSet.delete(nodeId);
                } else {
                  newSet.add(nodeId);
                }
                if (onNodeComplete) {
                  onNodeComplete(nodeId, !newSet.has(nodeId));
                }
                return newSet;
              });
            },
          },
        });
        
        // Create edge from parent
        if (level > 1 && lastNodeByLevel[level - 1]) {
          edges.push({
            id: `edge-${lastNodeByLevel[level - 1]}-${id}`,
            source: lastNodeByLevel[level - 1],
            target: id,
            type: 'smoothstep',
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
          });
        }
        
        lastNodeByLevel[level] = id;
        yOffset += 120;
        
      } else if (listMatch || bulletMatch) {
        const label = (listMatch ? listMatch[2] : bulletMatch![1]).trim();
        const id = `node-${nodeId++}`;
        
        // Determine level based on indentation
        const indent = line.search(/\S/);
        const level = Math.floor(indent / 2) + 1;
        
        const durationMatch = label.match(/\(([^)]+)\)/);
        const duration = durationMatch ? durationMatch[1] : undefined;
        const cleanLabel = label.replace(/\([^)]+\)/, '').trim();
        
        nodes.push({
          id,
          type: 'roadmapNode',
          position: { x: level * 300, y: yOffset },
          data: {
            id,
            label: cleanLabel,
            duration,
            completed: false,
            onToggle: (nodeId: string) => {
              setCompletedNodes(prev => {
                const newSet = new Set(prev);
                if (newSet.has(nodeId)) {
                  newSet.delete(nodeId);
                } else {
                  newSet.add(nodeId);
                }
                if (onNodeComplete) {
                  onNodeComplete(nodeId, !newSet.has(nodeId));
                }
                return newSet;
              });
            },
          },
        });
        
        // Connect to previous node at same or parent level
        const parentLevel = level - 1;
        if (lastNodeByLevel[parentLevel]) {
          edges.push({
            id: `edge-${lastNodeByLevel[parentLevel]}-${id}`,
            source: lastNodeByLevel[parentLevel],
            target: id,
            type: 'smoothstep',
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
          });
        }
        
        lastNodeByLevel[level] = id;
        yOffset += 120;
      }
    });
    
    // If no nodes parsed, create a simple linear flow
    if (nodes.length === 0) {
      const sections = content.split('\n\n').filter(s => s.trim());
      sections.forEach((section, index) => {
        const id = `node-${index}`;
        const lines = section.split('\n');
        const label = lines[0].replace(/^[#\-*\d.]+\s*/, '').trim();
        const description = lines.slice(1).join(' ').trim().substring(0, 50);
        
        nodes.push({
          id,
          type: 'roadmapNode',
          position: { x: (index % 3) * 300, y: Math.floor(index / 3) * 150 },
          data: {
            id,
            label: label || `Step ${index + 1}`,
            description: description || undefined,
            completed: false,
            onToggle: (nodeId: string) => {
              setCompletedNodes(prev => {
                const newSet = new Set(prev);
                if (newSet.has(nodeId)) {
                  newSet.delete(nodeId);
                } else {
                  newSet.add(nodeId);
                }
                if (onNodeComplete) {
                  onNodeComplete(nodeId, !newSet.has(nodeId));
                }
                return newSet;
              });
            },
          },
        });
        
        if (index > 0) {
          edges.push({
            id: `edge-${nodes[index - 1].id}-${id}`,
            source: nodes[index - 1].id,
            target: id,
            type: 'smoothstep',
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
          });
        }
      });
    }
    
    return { initialNodes: nodes, initialEdges: edges };
  }, [content]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update node completion status
  useMemo(() => {
    setNodes(nds =>
      nds.map(node => ({
        ...node,
        data: {
          ...node.data,
          completed: completedNodes.has(node.id),
        },
      }))
    );
  }, [completedNodes, setNodes]);

  const completedCount = completedNodes.size;
  const totalCount = nodes.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Progress stats */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div>
          <div className="text-sm font-semibold">
            {completedCount} / {totalCount} Steps Completed
          </div>
          <div className="text-xs text-muted-foreground">
            Click on nodes to mark as complete
          </div>
        </div>
        <div className="text-2xl font-bold text-primary">
          {progressPercent.toFixed(0)}%
        </div>
      </div>

      {/* Graph */}
      <div className="w-full h-[600px] border rounded-xl overflow-hidden bg-muted/30">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.5}
          maxZoom={1.5}
        >
          <Background />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              if (node.data.completed) return '#22c55e';
              return '#6366f1';
            }}
          />
        </ReactFlow>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Circle className="w-4 h-4" />
          <span>Not Started</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span>Completed</span>
        </div>
      </div>
    </div>
  );
}
