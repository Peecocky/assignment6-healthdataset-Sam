import { treemap, hierarchy, scaleOrdinal, schemeDark2, format, treemapDice, treemapSlice } from "d3";

function TreeMapText({ node }) {
  const width = node.x1 - node.x0;
  const height = node.y1 - node.y0;
  const parentValue = node.parent?.value || node.value || 1;
  const ratio = node.value / parentValue;
  const canShowValue = width > 80 && height > 42;
  const canShowLabel = width > 70 && height > 18;

  if (!canShowLabel) {
    return null;
  }

  return (
    <text x={8} y={22} style={{ fontSize: "11px", fill: "#ffffff", pointerEvents: "none" }}>
      <tspan x={8} dy={0}>{`${node.data.attr}:${node.data.name}`}</tspan>
      {canShowValue ? <tspan x={8} dy={18}>{`Value: ${format(".1%")(ratio)}`}</tspan> : null}
    </text>
  );
}

function getNodePath(node) {
  return node.ancestors().reverse().slice(1).map((item) => `${item.data.attr}:${item.data.name}`).join("|");
}

export function TreeMap(props) {
  const { margin, svg_width, svg_height, tree, selectedCell, setSelectedCell } = props;
  const legendHeight = 28;

  const innerWidth = svg_width - margin.left - margin.right;
  const innerHeight = svg_height - margin.top - margin.bottom - legendHeight;

  const root = hierarchy(tree)
    .sum((d) => (d.children ? 0 : (d.value || 0)))
    .sort((a, b) => (b.value || 0) - (a.value || 0));

  const responsiveTile = (node, x0, y0, x1, y1) => {
    const width = x1 - x0;
    const height = y1 - y0;
    if (width >= height) {
      treemapDice(node, x0, y0, x1, y1);
      return;
    }
    treemapSlice(node, x0, y0, x1, y1);
  };

  const treeLayout = treemap()
    .size([innerWidth, innerHeight])
    .tile(responsiveTile)
    .padding(0)
    .round(true);

  treeLayout(root);

  const leaves = root.leaves();
  const firstLayer = root.children || [];
  const parentGroups = leaves
    .map((d) => d.parent?.data)
    .filter((d, index, arr) => d && arr.findIndex((item) => item.name === d.name && item.attr === d.attr) === index);
  const color = scaleOrdinal(schemeDark2).domain(parentGroups.map((d) => `${d.attr}:${d.name}`));

  const tooltipStyle = {
    position: "fixed",
    left: selectedCell?.x ?? -9999,
    top: selectedCell?.y ?? -9999,
    background: "rgba(17, 24, 39, 0.92)",
    color: "#ffffff",
    padding: "8px 10px",
    borderRadius: "6px",
    fontSize: "12px",
    lineHeight: 1.4,
    pointerEvents: "none",
    boxShadow: "0 6px 18px rgba(0, 0, 0, 0.18)",
    whiteSpace: "pre-line",
    zIndex: 1000,
  };

  return (
    <div style={{ position: "relative" }}>
      <svg
        viewBox={`0 0 ${svg_width} ${svg_height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: "100%", height: "100%" }}
      >
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {parentGroups.map((group, index) => (
            <g key={`${group.attr}-${group.name}`} transform={`translate(${index * 165}, 0)`}>
              <rect width={18} height={18} fill={color(`${group.attr}:${group.name}`)} opacity={0.85} />
              <text x={26} y={14} style={{ fontSize: "11px", fill: "#111827" }}>
                {`${group.attr}: ${group.name}`}
              </text>
            </g>
          ))}

          <g transform={`translate(0, ${legendHeight})`}>
          {leaves.map((node, index) => {
            const width = node.x1 - node.x0;
            const height = node.y1 - node.y0;
            const baseColor = color(`${node.parent?.data.attr}:${node.parent?.data.name}`);
            const nodePath = getNodePath(node);
            const isSelected = selectedCell?.path === nodePath;
            const fillColor = isSelected ? "#ef5747" : baseColor;
            const parentValue = node.parent?.value || node.value || 1;
            const ratio = format(".1%")(node.value / parentValue);
            const tooltipText = `${nodePath.replaceAll("|", "\n")}\nValue: ${ratio}`;

            return (
              <g
                key={`${node.data.attr}-${node.data.name}-${index}`}
                transform={`translate(${node.x0}, ${node.y0})`}
              >
                <rect
                  width={width}
                  height={height}
                  fill={fillColor}
                  fillOpacity={0.88}
                  stroke={isSelected ? "#111827" : "#ffffff"}
                  strokeWidth={isSelected ? 3 : 2}
                  onMouseOver={(event) => setSelectedCell({
                    path: nodePath,
                    x: event.clientX + 12,
                    y: event.clientY - 12,
                    text: tooltipText,
                  })}
                  onMouseMove={(event) => setSelectedCell((current) => current ? {
                    ...current,
                    x: event.clientX + 12,
                    y: event.clientY - 12,
                  } : current)}
                  onMouseOut={() => setSelectedCell(null)}
                />
                <TreeMapText node={node} />
              </g>
            );
          })}
          {firstLayer.map((node, index) => {
            const width = node.x1 - node.x0;
            const height = node.y1 - node.y0;
            const label = `${node.data.attr}:${node.data.name}`;
            const rotate = width > height ? 0 : 90;
            const centerX = width / 2;
            const centerY = height / 2;

            return (
              <g key={`${label}-${index}`} transform={`translate(${node.x0}, ${node.y0})`}>
                <rect width={width} height={height} fill={"none"} stroke={"#111111"} strokeWidth={1.5} />
                <text
                  x={centerX}
                  y={centerY}
                  textAnchor={"middle"}
                  dominantBaseline={"middle"}
                  opacity={0.28}
                  style={{ fontSize: "3rem", fontWeight: 700, fill: "#111111", pointerEvents: "none" }}
                  transform={`rotate(${rotate}, ${centerX}, ${centerY})`}
                >
                  {label}
                </text>
              </g>
            );
          })}
          </g>

          {leaves.length === 0 ? (
            <text x={12} y={24} style={{ fontSize: "13px", fill: "#6b7280" }}>
              Select at least one attribute to build the treemap.
            </text>
          ) : null}
        </g>
      </svg>
      {selectedCell?.text ? <div style={tooltipStyle}>{selectedCell.text}</div> : null}
    </div>
  );
}
