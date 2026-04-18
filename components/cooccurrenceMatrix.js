import * as d3 from "d3";

const featureDefinitions = [
  { key: "stroke", label: "Stroke", test: (d) => d.stroke === "1" },
  { key: "heart_disease", label: "Heart Disease", test: (d) => d.heart_disease === "1" },
  { key: "hypertension", label: "Hypertension", test: (d) => d.hypertension === "1" },
  { key: "ever_married", label: "Ever Married", test: (d) => d.ever_married === "Yes" },
  { key: "never_married", label: "Never Married", test: (d) => d.ever_married === "No" },
  { key: "male", label: "Male", test: (d) => d.gender === "Male" },
  { key: "female", label: "Female", test: (d) => d.gender === "Female" },
];

function buildMatrix(data) {
  return featureDefinitions.map((rowFeature, rowIndex) =>
    featureDefinitions.map((colFeature, colIndex) => {
      const value = data.reduce((count, item) => {
        return rowFeature.test(item) && colFeature.test(item) ? count + 1 : count;
      }, 0);

      return {
        row: rowFeature.label,
        col: colFeature.label,
        rowIndex,
        colIndex,
        value,
        isDiagonal: rowIndex === colIndex,
      };
    })
  );
}

export function CooccurrenceMatrix({ margin, svg_width, svg_height, data }) {
  const matrix = buildMatrix(data);
  const labels = featureDefinitions.map((feature) => feature.label);
  const width = svg_width - margin.left - margin.right;
  const height = svg_height - margin.top - margin.bottom;
  const cellSize = Math.min(width / labels.length, height / labels.length);
  const gridWidth = cellSize * labels.length;
  const gridHeight = cellSize * labels.length;
  const offDiagonalCells = matrix.flat().filter((cell) => !cell.isDiagonal);
  const maxOffDiagonal = d3.max(offDiagonalCells, (d) => d.value) ?? 1;
  const color = d3.scaleSequential(d3.interpolateYlOrRd).domain([0, maxOffDiagonal]);

  return (
    <svg
      viewBox={`0 0 ${svg_width} ${svg_height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%", overflow: "visible" }}
    >
      <g transform={`translate(${margin.left}, ${margin.top})`}>
        <text x={0} y={-20} style={{ fontSize: "14px", fontWeight: 600, fill: "#1f2937" }}>
          Pairwise Co-occurrence Matrix
        </text>
        <text x={0} y={-2} style={{ fontSize: "11px", fill: "#6b7280" }}>
          Upper triangle highlights non-diagonal relationships; diagonal cells are muted self-counts.
        </text>

        {labels.map((label, index) => (
          <text
            key={`col-${label}`}
            x={index * cellSize + cellSize / 2}
            y={-10}
            textAnchor="start"
            transform={`rotate(-35, ${index * cellSize + cellSize / 2}, -10)`}
            style={{ fontSize: "11px", fill: "#374151" }}
          >
            {label}
          </text>
        ))}

        {labels.map((label, index) => (
          <text
            key={`row-${label}`}
            x={-12}
            y={index * cellSize + cellSize / 2}
            textAnchor="end"
            dominantBaseline="middle"
            style={{ fontSize: "11px", fill: "#374151" }}
          >
            {label}
          </text>
        ))}

        {matrix.flat().map((cell) => {
          if (cell.colIndex < cell.rowIndex) {
            return null;
          }

          const x = cell.colIndex * cellSize;
          const y = cell.rowIndex * cellSize;
          const fill = cell.isDiagonal ? "#e5e7eb" : color(cell.value);

          return (
            <g key={`${cell.row}-${cell.col}`} transform={`translate(${x}, ${y})`}>
              <rect
                width={cellSize}
                height={cellSize}
                fill={fill}
                stroke={cell.isDiagonal ? "#cbd5e1" : "#ffffff"}
                strokeWidth={1.5}
                rx={4}
              />
              <text
                x={cellSize / 2}
                y={cellSize / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{
                  fontSize: cellSize > 56 ? "11px" : "9px",
                  fontWeight: cell.isDiagonal ? 400 : 600,
                  fill: cell.value > maxOffDiagonal * 0.55 && !cell.isDiagonal ? "#ffffff" : "#1f2937",
                }}
              >
                {cell.value}
              </text>
            </g>
          );
        })}

        <g transform={`translate(${gridWidth + 18}, 10)`}>
          <text x={0} y={0} style={{ fontSize: "12px", fontWeight: 600, fill: "#1f2937" }}>
            Co-occurrence Count
          </text>
          {[0, 0.33, 0.66, 1].map((step, index) => {
            const value = Math.round(step * maxOffDiagonal);
            return (
              <g key={step} transform={`translate(0, ${18 + index * 24})`}>
                <rect width={18} height={18} rx={3} fill={color(value)} stroke="#e5e7eb" />
                <text x={26} y={9} dominantBaseline="middle" style={{ fontSize: "11px", fill: "#4b5563" }}>
                  {value}
                </text>
              </g>
            );
          })}
        </g>

        <rect width={gridWidth} height={gridHeight} fill="none" stroke="#d1d5db" strokeWidth={1} rx={6} />
      </g>
    </svg>
  );
}
