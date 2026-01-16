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
  ConnectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Network, FileText } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { toast } from 'sonner';

interface MindMapCreatorProps {
  content: string;
  topic: string;
}

// Color palette for different levels
const LEVEL_COLORS = [
  { bg: 'from-pink-500 to-rose-500', border: 'border-pink-500', text: 'text-white' },
  { bg: 'from-purple-500 to-violet-500', border: 'border-purple-500', text: 'text-white' },
  { bg: 'from-blue-500 to-cyan-500', border: 'border-blue-500', text: 'text-white' },
  { bg: 'from-green-500 to-emerald-500', border: 'border-green-500', text: 'text-white' },
  { bg: 'from-yellow-500 to-amber-500', border: 'border-yellow-500', text: 'text-white' },
  { bg: 'from-orange-500 to-red-500', border: 'border-orange-500', text: 'text-white' },
];

// Custom node component
function MindMapNode({ data }: any) {
  const colorSet = LEVEL_COLORS[data.level % LEVEL_COLORS.length];
  
  return (
    <div
      className={`
        px-4 py-3 rounded-xl shadow-lg transition-all hover:scale-105 cursor-pointer
        ${data.level === 0 
          ? `bg-gradient-to-br ${colorSet.bg} ${colorSet.text} min-w-[180px] text-center` 
          : `bg-card border-2 ${colorSet.border} min-w-[140px]`
        }
      `}
    >
      <div className={`font-semibold text-sm ${data.level === 0 ? 'text-lg' : ''}`}>
        {data.label}
      </div>
      {data.description && (
        <div className="text-xs opacity-80 mt-1">{data.description}</div>
      )}
    </div>
  );
}

const nodeTypes = {
  mindMapNode: MindMapNode,
};

export function MindMapCreator({ content, topic }: MindMapCreatorProps) {
  const [viewMode, setViewMode] = useState<'graph' | 'text'>('graph');

  // Parse markdown content into nodes and edges
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    // Safety check for content
    if (!content || typeof content !== 'string') {
      return { initialNodes: nodes, initialEdges: edges };
    }
    
    const lines = content.split('\n');
    let nodeId = 0;
    const nodeStack: { id: string; level: number }[] = [];
    
    // Create central node for the topic
    const centralId = `node-${nodeId++}`;
    nodes.push({
      id: centralId,
      type: 'mindMapNode',
      position: { x: 400, y: 300 },
      data: { label: topic, level: 0 },
    });
    nodeStack.push({ id: centralId, level: 0 });

    const currentLevel = 0;
    const nodesAtLevel: { [level: number]: number } = { 0: 0 };
    const angleOffset: { [level: number]: number } = { 0: 0 };

    lines.forEach((line) => {
      // Match headers
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      // Match bullet points
      const bulletMatch = line.match(/^(\s*)[-*]\s+(.+)$/);
      
      let label = '';
      let level = 0;

      if (headerMatch) {
        level = headerMatch[1].length;
        label = headerMatch[2].trim();
      } else if (bulletMatch) {
        const indent = bulletMatch[1].length;
        level = Math.floor(indent / 2) + 2; // Bullets start at level 2
        label = bulletMatch[2].trim();
      }

      if (label) {
        const id = `node-${nodeId++}`;
        
        // Find parent node
        while (nodeStack.length > 0 && nodeStack[nodeStack.length - 1].level >= level) {
          nodeStack.pop();
        }
        const parentNode = nodeStack.length > 0 ? nodeStack[nodeStack.length - 1] : { id: centralId, level: 0 };

        // Calculate position in a radial layout
        if (!nodesAtLevel[level]) nodesAtLevel[level] = 0;
        if (!angleOffset[level]) angleOffset[level] = 0;

        const radius = 150 + (level * 120);
        const angleStep = (2 * Math.PI) / Math.max(8, nodesAtLevel[level] + 4);
        const angle = angleOffset[level] + (nodesAtLevel[level] * angleStep);
        
        const x = 400 + radius * Math.cos(angle);
        const y = 300 + radius * Math.sin(angle);

        nodes.push({
          id,
          type: 'mindMapNode',
          position: { x, y },
          data: { label, level },
        });

        // Create edge from parent to this node
        const colorSet = LEVEL_COLORS[level % LEVEL_COLORS.length];
        edges.push({
          id: `edge-${parentNode.id}-${id}`,
          source: parentNode.id,
          target: id,
          type: 'smoothstep',
          style: { stroke: getColorHex(level), strokeWidth: Math.max(1, 4 - level) },
          markerEnd: { type: MarkerType.ArrowClosed, color: getColorHex(level) },
        });

        nodeStack.push({ id, level });
        nodesAtLevel[level]++;
      }
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [content, topic]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'graph' | 'text')}>
          <TabsList>
            <TabsTrigger value="graph" className="gap-2">
              <Network className="w-4 h-4" />
              Graph View
            </TabsTrigger>
            <TabsTrigger value="text" className="gap-2">
              <FileText className="w-4 h-4" />
              Text View
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      {viewMode === 'graph' ? (
        <Card className="border-2 overflow-hidden">
          <div className="h-[600px] w-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              connectionMode={ConnectionMode.Loose}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.1}
              maxZoom={2}
              defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
            >
              <Background color="#444" gap={20} />
              <Controls>
                <button className="react-flow__controls-button">
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button className="react-flow__controls-button">
                  <ZoomOut className="w-4 h-4" />
                </button>
              </Controls>
              <MiniMap 
                nodeColor={(node) => getColorHex(node.data?.level || 0)}
                maskColor="rgba(0, 0, 0, 0.8)"
              />
            </ReactFlow>
          </div>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <MarkdownRenderer content={content} />
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      {viewMode === 'graph' && (
        <Card className="border-pink-500/20 bg-pink-500/5">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-2">
              💡 <strong>Tip:</strong> Drag nodes to rearrange. Use scroll to zoom. Double-click to edit.
            </p>
            <div className="flex flex-wrap gap-2">
              {LEVEL_COLORS.map((color, index) => (
                <div key={index} className="flex items-center gap-1 text-xs">
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${color.bg}`} />
                  <span>Level {index}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper function to get color hex for edges
function getColorHex(level: number): string {
  const colors = ['#ec4899', '#8b5cf6', '#3b82f6', '#22c55e', '#eab308', '#f97316'];
  return colors[level % colors.length];
}

export default MindMapCreator;
