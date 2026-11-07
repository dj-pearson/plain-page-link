import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  areaPath,
  bandWidth,
  bandX,
  innerSize,
  labelIndices,
  linePath,
  nearestIndex,
  niceTicks,
  pointX,
  yScale,
  type ChartBox,
} from '@/lib/chartGeometry';

/**
 * The agent dashboard's time-series chart, drawn as plain SVG (US-395).
 *
 * This used to be recharts. It was the only recharts chart on any agent-facing
 * route, and it pulled charts-vendor (402 KB minified, 107 KB gzip) onto
 * /dashboard/analytics — more than everything else that route needed beyond
 * the entry put together. The admin screens still use recharts; this does not.
 *
 * The props are unchanged. Values are also rendered as a visually hidden table,
 * which recharts never offered a screen reader.
 */

export type ChartType = 'line' | 'area' | 'bar';

interface DataPoint {
  name: string; // x-axis label (e.g., date)
  [key: string]: string | number; // dynamic keys for multiple series
}

interface Series {
  dataKey: string;
  name: string;
  color: string;
}

interface AnalyticsChartProps {
  title: string;
  description?: string;
  data: DataPoint[];
  series: Series[];
  type?: ChartType;
  height?: number;
  showLegend?: boolean;
  yAxisLabel?: string;
}

const MARGIN = { top: 8, right: 16, bottom: 28, left: 44 };
const DEFAULT_WIDTH = 600;

function valueOf(point: DataPoint | undefined, key: string): number {
  const raw = point?.[key];
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setWidth(Math.round(w));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}

export function AnalyticsChart({
  title,
  description,
  data,
  series,
  type = 'line',
  height = 300,
  showLegend = true,
  yAxisLabel,
}: AnalyticsChartProps) {
  const { ref, width } = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const gradientId = useId().replace(/:/g, '');

  const box: ChartBox = useMemo(
    () => ({ width, height, ...MARGIN, left: yAxisLabel ? 56 : MARGIN.left }),
    [width, height, yAxisLabel]
  );
  const inner = innerSize(box);
  const count = data.length;
  const mode = type === 'bar' ? 'band' : 'point';

  const ticks = useMemo(() => {
    let max = 0;
    for (const d of data) for (const s of series) max = Math.max(max, valueOf(d, s.dataKey));
    return niceTicks(max);
  }, [data, series]);
  const yMax = ticks[ticks.length - 1] ?? 1;
  const y = yScale(box, yMax);
  const baseline = box.top + inner.height;
  const xAt = (i: number) => (mode === 'band' ? bandX(box, i, count) : pointX(box, i, count));
  const xLabels = labelIndices(count, inner.width);

  const handlePointer = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (count === 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setActive(nearestIndex(box, event.clientX - rect.left, count, mode));
  };

  const activePoint = active !== null ? data[active] : undefined;
  const tooltipLeft =
    active !== null ? Math.min(Math.max(xAt(active), 80), Math.max(80, width - 80)) : 0;

  const renderSeries = () => {
    if (count === 0) return null;
    if (type === 'bar') {
      const band = bandWidth(box, count);
      const groupWidth = band * 0.7;
      const barWidth = groupWidth / Math.max(1, series.length);
      return data.map((d, i) =>
        series.map((s, si) => {
          const top = y(valueOf(d, s.dataKey));
          return (
            <rect
              key={`${s.dataKey}-${i}`}
              x={bandX(box, i, count) - groupWidth / 2 + si * barWidth}
              y={top}
              width={Math.max(1, barWidth - 1)}
              height={Math.max(0, baseline - top)}
              rx={Math.min(4, barWidth / 4)}
              fill={s.color}
            />
          );
        })
      );
    }
    return series.map((s, si) => {
      const points = data.map(
        (d, i) => [pointX(box, i, count), y(valueOf(d, s.dataKey))] as [number, number]
      );
      return (
        <g key={s.dataKey}>
          {type === 'area' && (
            <path d={areaPath(points, baseline)} fill={`url(#${gradientId}-${si})`} stroke="none" />
          )}
          <path
            d={linePath(points)}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {(type === 'line' || count === 1) &&
            points.map(([px, py], i) => (
              <circle key={i} cx={px} cy={py} r={count > 31 ? 2 : 3} fill={s.color} />
            ))}
        </g>
      );
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div ref={ref} className="relative w-full" style={{ height }}>
          <svg
            width={width}
            height={height}
            className="block select-none overflow-visible text-muted-foreground"
            aria-hidden="true"
            focusable="false"
            onPointerMove={handlePointer}
            onPointerDown={handlePointer}
            onPointerLeave={() => setActive(null)}
          >
            {type === 'area' && (
              <defs>
                {series.map((s, si) => (
                  <linearGradient
                    key={s.dataKey}
                    id={`${gradientId}-${si}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={s.color} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
            )}

            {ticks.map((t) => (
              <g key={t}>
                <line
                  x1={box.left}
                  x2={box.left + inner.width}
                  y1={y(t)}
                  y2={y(t)}
                  stroke="currentColor"
                  strokeOpacity={0.15}
                  strokeDasharray="3 3"
                />
                <text
                  x={box.left - 8}
                  y={y(t)}
                  dy="0.32em"
                  textAnchor="end"
                  fontSize={12}
                  fill="currentColor"
                  className="tabular-nums"
                >
                  {t.toLocaleString()}
                </text>
              </g>
            ))}

            {yAxisLabel && (
              <text
                transform={`translate(12 ${box.top + inner.height / 2}) rotate(-90)`}
                textAnchor="middle"
                fontSize={12}
                fill="currentColor"
              >
                {yAxisLabel}
              </text>
            )}

            {xLabels.map((i) => (
              <text
                key={i}
                x={xAt(i)}
                y={baseline + 18}
                textAnchor={
                  mode === 'band' || count === 1
                    ? 'middle'
                    : i === 0
                      ? 'start'
                      : i === count - 1
                        ? 'end'
                        : 'middle'
                }
                fontSize={12}
                fill="currentColor"
              >
                {data[i]?.name}
              </text>
            ))}

            {renderSeries()}

            {active !== null && mode === 'point' && (
              <g>
                <line
                  x1={xAt(active)}
                  x2={xAt(active)}
                  y1={box.top}
                  y2={baseline}
                  stroke="currentColor"
                  strokeOpacity={0.3}
                />
                {series.map((s) => (
                  <circle
                    key={s.dataKey}
                    cx={xAt(active)}
                    cy={y(valueOf(activePoint, s.dataKey))}
                    r={5}
                    fill={s.color}
                    stroke="hsl(var(--card))"
                    strokeWidth={2}
                  />
                ))}
              </g>
            )}

            {/* Captures the pointer across the whole plot, including gaps between bars. */}
            <rect
              x={box.left}
              y={box.top}
              width={inner.width}
              height={inner.height}
              fill="transparent"
            />
          </svg>

          {activePoint && (
            <div
              className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground"
              style={{ left: tooltipLeft }}
              data-testid="analytics-chart-tooltip"
            >
              <div className="mb-1 font-medium">{activePoint.name}</div>
              {series.map((s) => (
                <div key={s.dataKey} className="flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  <span>{s.name}</span>
                  <span className="ml-auto pl-3 font-medium tabular-nums">
                    {valueOf(activePoint, s.dataKey).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {showLegend && series.length > 0 && (
          <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {series.map((s) => (
              <li key={s.dataKey} className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: s.color }}
                  aria-hidden="true"
                />
                {s.name}
              </li>
            ))}
          </ul>
        )}

        <table className="sr-only">
          <caption>{title}</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              {series.map((s) => (
                <th key={s.dataKey} scope="col">
                  {s.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={`${d.name}-${i}`}>
                <th scope="row">{d.name}</th>
                {series.map((s) => (
                  <td key={s.dataKey}>{valueOf(d, s.dataKey)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
