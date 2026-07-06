import React, {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Sector } from "recharts";
import { COLORS_VALUES } from "utils/dashboard";

const DONUT_COLORS = [
  "#00ADF0",
  "#6366F1",
  "#F59E0B",
  "#14B8A6",
  "#22C55E",
  "#EC4899",
  "#8B5CF6",
  "#94A3B8",
];

const OTHERS_LEGEND_COLOR = "#94A3B8";

const DISTRIBUTION_SCHEMAS = {
  region: {
    topFive: "topFiveRegions",
    all: "allRegions",
    overall: "overallRegionCount",
    name: "regionName",
    count: "regionCount",
    id: "regionId",
  },
  country: {
    topFive: "topFiveCountries",
    all: "allCountries",
    overall: "overallCountryCount",
    name: "countryName",
    count: "countryCount",
    id: "countryId",
  },
};

const WORKSPACE_HEALTH_SEGMENTS = [
  { id: "healthy", name: "Healthy", metricKey: "healthy", colorKey: "healthy" },
  {
    id: "needsAttention",
    name: "Needs Attention",
    metricKey: "needsAttention",
    colorKey: "needsAttention",
  },
  { id: "atRisk", name: "At Risk", metricKey: "atRisk", colorKey: "atRisk" },
];

const mapWorkspaceHealthRows = (data, dashboardMaterValue = []) => {
  if (!data || typeof data !== "object") return [];

  const colors = COLORS_VALUES(dashboardMaterValue);
  const overall = WORKSPACE_HEALTH_SEGMENTS.reduce(
    (sum, segment) => sum + getNumericMetric(data[segment.metricKey]),
    0,
  );

  if (!overall) return [];

  return WORKSPACE_HEALTH_SEGMENTS.map((segment) => {
    const count = getNumericMetric(data[segment.metricKey]);
    return {
      id: segment.id,
      name: segment.name,
      count,
      value: count,
      percentage: Math.round((count / overall) * 100),
      color: colors[segment.colorKey] || DONUT_COLORS[0],
    };
  }).filter((row) => row.count > 0);
};

const getNumericMetric = (value, fallback = 0) => {
  if (value == null) return fallback;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (
    typeof value === "string" &&
    value.trim() !== "" &&
    !Number.isNaN(Number(value))
  ) {
    return Number(value);
  }
  return fallback;
};

const resolveDistributionSource = (data, variant) => {
  const schema = DISTRIBUTION_SCHEMAS[variant];
  if (!schema || !data || typeof data !== "object") return null;

  const nested = data[variant];
  if (
    nested &&
    typeof nested === "object" &&
    (Array.isArray(nested[schema.topFive]) || Array.isArray(nested[schema.all]))
  ) {
    return { ...schema, source: nested };
  }

  if (Array.isArray(data[schema.topFive]) || Array.isArray(data[schema.all])) {
    return { ...schema, source: data };
  }

  return null;
};

const mapDistributionRows = (
  items = [],
  schema,
  overallCount,
  colorById = null,
) =>
  items
    .map((row, index) => {
      const count = getNumericMetric(row[schema.count]);
      const name = row[schema.name] ?? "—";
      const id = row[schema.id] ?? `${name}-${index}`;
      return {
        id,
        name,
        count,
        color:
          colorById?.get(String(id)) ??
          DONUT_COLORS[index % DONUT_COLORS.length],
      };
    })
    .filter((row) => row.count > 0)
    .map((row) => ({
      ...row,
      percentage:
        overallCount > 0 ? Math.round((row.count / overallCount) * 100) : 0,
      value: row.count,
    }));

const buildColorMap = (rows = []) => {
  const map = new Map();
  rows.forEach((row, index) => {
    map.set(String(row.id), DONUT_COLORS[index % DONUT_COLORS.length]);
  });
  return map;
};

const buildDistributionLegendItems = (
  topFiveRows = [],
  allRows = [],
  isExpanded = false,
) => {
  if (isExpanded) {
    return allRows;
  }

  if (!topFiveRows.length) {
    return allRows;
  }

  const topFiveIds = new Set(topFiveRows.map((row) => String(row.id)));
  const hiddenRows = allRows.filter((row) => !topFiveIds.has(String(row.id)));
  const othersCount = hiddenRows.reduce((sum, row) => sum + row.count, 0);

  if (hiddenRows.length === 0 || othersCount <= 0) {
    return topFiveRows;
  }

  return [
    ...topFiveRows,
    {
      id: "__distribution-others__",
      name: "+ Others",
      count: othersCount,
      value: othersCount,
      percentage: 0,
      color: OTHERS_LEGEND_COLOR,
      isOthers: true,
    },
  ];
};

const DONUT_HOVER_OFFSET = 8;
const DONUT_HOVER_ANIMATION_MS = 220;

const easeOutCubic = (t) => 1 - (1 - t) ** 3;

const useAnimatedHoverProgress = (isActive) => {
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);

  useEffect(() => {
    const target = isActive ? 1 : 0;
    const from = progressRef.current;
    if (from === target) return undefined;

    const start = performance.now();
    let frameId = 0;

    const tick = (now) => {
      const t = Math.min(1, (now - start) / DONUT_HOVER_ANIMATION_MS);
      const next = from + (target - from) * easeOutCubic(t);
      progressRef.current = next;
      setProgress(next);

      if (t < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isActive]);

  return progress;
};

const DonutSliceShape = ({
  cx,
  cy,
  innerRadius,
  outerRadius,
  startAngle,
  endAngle,
  fill,
  index,
  hoveredSliceIndex,
  hoverProgress,
  
}) => {
  const offset =
    index === hoveredSliceIndex ? DONUT_HOVER_OFFSET * hoverProgress : 0;

  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + offset}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      style={{ cursor: "pointer" }}
    />
  );
};

const blurChartFocus = () => {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
};

const DonutChart = ({
  title = "",
  centerLabel = "Total",
  variant = "region",
  data = null,
  loading = false,
  dashboardMaterValue = [],
  legendItems,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSliceIndex, setActiveSliceIndex] = useState(null);
  const [hoveredSliceIndex, setHoveredSliceIndex] = useState(null);
  const isWorkspaceHealth = variant === "workspaceHealth";

  const distribution = useMemo(
    () => (isWorkspaceHealth ? null : resolveDistributionSource(data, variant)),
    [data, variant, isWorkspaceHealth],
  );

  const allRows = useMemo(() => {
    if (isWorkspaceHealth) {
      return mapWorkspaceHealthRows(data, dashboardMaterValue);
    }

    if (!distribution) return [];
    const allItems = distribution.source[distribution.all] ?? [];
    const overallCount = getNumericMetric(
      distribution?.source?.[distribution?.overall],
    );
    const rows = mapDistributionRows(allItems, distribution, overallCount);
    const colorById = buildColorMap(rows);
    return rows.map((row) => ({
      ...row,
      color: colorById.get(String(row.id)) ?? row.color,
    }));
  }, [isWorkspaceHealth, data, dashboardMaterValue, distribution]);

  const topFiveRows = useMemo(() => {
    if (isWorkspaceHealth) return allRows;

    if (!distribution) return [];
    const topFive = distribution.source[distribution.topFive] ?? [];
    const overallCount = getNumericMetric(
      distribution?.source?.[distribution?.overall],
    );
    const colorById = buildColorMap(allRows);
    return mapDistributionRows(topFive, distribution, overallCount, colorById);
  }, [isWorkspaceHealth, allRows, distribution]);

  const overallCount = useMemo(() => {
    if (isWorkspaceHealth) {
      return allRows.reduce((sum, row) => sum + row.count, 0);
    }
    return getNumericMetric(distribution?.source?.[distribution?.overall]);
  }, [isWorkspaceHealth, allRows, distribution]);

  const isSliceHovered = activeSliceIndex != null;
  const hoverProgress = useAnimatedHoverProgress(isSliceHovered);
  const showEmptyState = isWorkspaceHealth
    ? !data || allRows.length === 0
    : !distribution || overallCount <= 0 || allRows.length === 0;

  const centerDisplay = useMemo(() => {
    if (isWorkspaceHealth) {
      if (activeSliceIndex != null && allRows[activeSliceIndex]) {
        const segment = allRows[activeSliceIndex];
        return {
          count: `${segment.count}%`,
          label: segment.name,
        };
      }

      const atRiskRow = allRows.find((row) => row.id === "atRisk");
      const atRiskValue = atRiskRow?.count ?? getNumericMetric(data?.atRisk);
      return {
        count: `${atRiskValue}%`,
        label: "At Risk",
      };
    }

    if (activeSliceIndex != null && allRows[activeSliceIndex]) {
      const segment = allRows[activeSliceIndex];
      return { count: segment.count, label: segment.name };
    }

    return { count: overallCount, label: centerLabel };
  }, [
    activeSliceIndex,
    allRows,
    overallCount,
    centerLabel,
    isWorkspaceHealth,
    data?.atRisk,
  ]);

  const handlePieEnter = useCallback((_, index) => {
    setActiveSliceIndex(index);
  }, []);

  const handlePieLeave = useCallback(() => {
    setActiveSliceIndex(null);
  }, []);

  const handleChartMouseLeave = useCallback(() => {
    blurChartFocus();
    setActiveSliceIndex(null);
  }, []);

  useEffect(() => {
    if (activeSliceIndex != null) {
      setHoveredSliceIndex(activeSliceIndex);
      return;
    }

    if (hoverProgress < 0.01) {
      setHoveredSliceIndex(null);
    }
  }, [activeSliceIndex, hoverProgress]);

  const renderDonutSliceShape = useCallback(
    (props) => (
      <DonutSliceShape
        {...props}
        hoveredSliceIndex={hoveredSliceIndex}
        hoverProgress={hoverProgress}
      />
    ),
    [hoveredSliceIndex, hoverProgress],
  );

  const donutSize = (expanded) => ({
    height: expanded ? 340 : 220,
    innerRadius: expanded ? 88 : 62,
    outerRadius: expanded ? 128 : 92,
  });

  return (
    <Fragment>
      {loading && (
        <div className="task-stage-distribution__loading" aria-busy="true">
          Loading chart…
        </div>
      )}
      {!loading && showEmptyState && (
        <div className="task-stage-distribution__empty">
          <p className="workspace-widget__no-data-found w-100">No Data Found</p>
        </div>
      )}
      {!loading && !showEmptyState && (
      <div
        className={`task-stage-distribution__performance`}
      >
        <div
          className="task-stage-distribution__donut-wrap"
          onMouseDown={(event) => {
            if (!event.target.closest(".recharts-sector")) {
              blurChartFocus();
            }
          }}
        >
          <ResponsiveContainer
            width="100%"
          >
            <PieChart onMouseLeave={handleChartMouseLeave}>
              <Pie
                data={allRows}
                dataKey="value"
                nameKey="name"
                paddingAngle={2}
                stroke="none"
                isAnimationActive
                animationDuration={450}
                animationEasing="ease-out"
                shape={renderDonutSliceShape}
                onMouseEnter={handlePieEnter}
                onMouseLeave={handlePieLeave}
                onClick={blurChartFocus}
              >
                {allRows.map((entry) => (
                  <Cell key={entry.id} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="task-stage-distribution__donut-center" aria-hidden>
            <strong>{centerDisplay.count}</strong>
            <span>{centerDisplay.label}</span>
          </div>
        </div>
        <ul
          className={`task-stage-distribution__legend`}
        >
          {legendItems?.map((row) => {
           
            return (
              <li
                key={row.id}
                className={`task-stage-distribution__legend-item${
                  row.isOthers
                    ? " task-stage-distribution__legend-item--others"
                    : ""
                }`}
               
              >
                <span
                  className="task-stage-distribution__legend-dot"
                  style={{ backgroundColor: row.color }}
                />
                <span className="task-stage-distribution__legend-label">
                  {row.name}
                </span>
                <span className="task-stage-distribution__legend-value">
                  {isWorkspaceHealth ? `${row.count}%` : row.count}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      )}
    </Fragment>
  );
};

export default memo(DonutChart);
