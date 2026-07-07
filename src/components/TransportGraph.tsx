import { Allocation, TransportProblem } from "@/lib/transport/core";

interface TransportGraphProps {
  problem: TransportProblem;
  allocations: Allocation[];
  showCosts?: boolean;
  showPotentials?: boolean;
  potentials?: { u: (number | null)[]; v: (number | null)[] };
}

export function TransportGraph({
  problem,
  allocations,
  showCosts = true,
  showPotentials = false,
  potentials,
}: TransportGraphProps) {
  const { supply, demand, costs, rowLabels, colLabels } = problem;
  const m = supply.length;
  const n = demand.length;

  // Layout parameters
  const svgWidth = 800;
  const svgHeight = 500;
  const sourceX = 100;
  const destX = 600;
  const startY = 80;
  const verticalSpacing = (svgHeight - 2 * startY) / Math.max(m, n - 1);

  // Calculate node positions
  const sourceNodes = supply.map((s, i) => ({
    id: rowLabels?.[i] || String.fromCharCode(65 + i),
    x: sourceX,
    y: startY + i * verticalSpacing,
    value: s,
    index: i,
  }));

  const destNodes = demand.map((d, j) => ({
    id: colLabels?.[j] || `D${j + 1}`,
    x: destX,
    y: startY + j * verticalSpacing,
    value: d,
    index: j,
  }));

  // Build allocation map
  const allocMap = new Map<string, Allocation>();
  for (const alloc of allocations) {
    allocMap.set(`${alloc.row},${alloc.col}`, alloc);
  }

  // Create edges for allocations
  const edges = allocations
    .filter((a) => a.quantity > 0 && !a.isEpsilon)
    .map((alloc, idx) => {
      const source = sourceNodes[alloc.row];
      const dest = destNodes[alloc.col];
      const cost = costs[alloc.row][alloc.col];
      const midX = (source.x + dest.x) / 2;
      const midY = (source.y + dest.y) / 2;
      
      // Position label at the middle of the arrow with slight offset
      const labelX = midX;
      const labelY = midY - 10;
      
      return {
        source,
        dest,
        quantity: alloc.quantity,
        cost,
        midX,
        midY,
        labelX,
        labelY,
      };
    });

  return (
    <div className="w-full overflow-x-auto">
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="bg-card rounded-lg border border-border"
      >

        {/* Draw edges (arrows) */}
        {edges.map((edge, idx) => {
          const dx = edge.dest.x - edge.source.x;
          const dy = edge.dest.y - edge.source.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          const nx = dx / length;
          const ny = dy / length;
          const offset = 30; // Distance from node center

          const startX = edge.source.x + offset * nx;
          const startY = edge.source.y + offset * ny;
          const endX = edge.dest.x - offset * nx;
          const endY = edge.dest.y - offset * ny;

          return (
            <g key={idx}>
              {/* Arrow line */}
              <line
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke="black"
                strokeWidth={1.5}
                markerEnd="url(#arrowhead)"
              />

              {/* Quantity label on arrow with background */}
              <rect
                x={edge.labelX - 20}
                y={edge.labelY - 12}
                width={40}
                height={24}
                fill="#fef3c7"
                stroke="black"
                strokeWidth={1}
                rx={4}
              />
              <text
                x={edge.labelX}
                y={edge.labelY + 5}
                textAnchor="middle"
                className="fill-black font-sans text-sm font-medium"
              >
                {edge.quantity}
              </text>
            </g>
          );
        })}

        {/* Arrow marker definition */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="7"
            refX="7"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 8 3.5, 0 7"
              fill="black"
            />
          </marker>
        </defs>

        {/* Draw source nodes */}
        {sourceNodes.map((node) => (
          <g key={`source-${node.index}`}>
            <circle
              cx={node.x}
              cy={node.y}
              r={25}
              fill="white"
              stroke="black"
              strokeWidth={1.5}
            />
            <text
              x={node.x}
              y={node.y + 5}
              textAnchor="middle"
              className="fill-black font-sans text-sm font-medium"
            >
              {node.id}
            </text>
            <text
              x={node.x - 35}
              y={node.y + 5}
              textAnchor="end"
              className="fill-black font-sans text-sm"
            >
              {node.value}
            </text>
          </g>
        ))}

        {/* Draw destination nodes */}
        {destNodes.map((node) => (
          <g key={`dest-${node.index}`}>
            <circle
              cx={node.x}
              cy={node.y}
              r={25}
              fill="white"
              stroke="black"
              strokeWidth={1.5}
            />
            <text
              x={node.x}
              y={node.y + 5}
              textAnchor="middle"
              className="fill-black font-sans text-sm font-medium"
            >
              {node.id}
            </text>
            <text
              x={node.x + 35}
              y={node.y + 5}
              textAnchor="start"
              className="fill-black font-sans text-sm"
            >
              {node.value}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
