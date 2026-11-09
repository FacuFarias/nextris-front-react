import { useEffect, useMemo, useRef, useState } from "react";

export interface TrendPoint {
    key: string;
    /** Short x-axis label. */
    label: string;
    value: number;
    /** Tooltip lines below the value. */
    detail?: string[];
}

interface TrendChartProps {
    points: TrendPoint[];
    kind: "bar" | "line";
    formatValue: (value: number) => string;
    /** Optional horizontal reference line (e.g. purge threshold). */
    reference?: { value: number; label: string };
    height?: number;
    ariaLabel: string;
}

const PADDING = { top: 14, right: 12, bottom: 26, left: 64 };

/** 1, 2, 2.5, 5 × 10ⁿ ceiling, so the top gridline is a readable number. */
const niceCeil = (value: number) => {
    if (value <= 0) return 1;
    const power = 10 ** Math.floor(Math.log10(value));
    const step = [1, 2, 2.5, 5, 10].find((m) => m * power >= value) ?? 10;
    return step * power;
};

/** Bar with 4px rounded top corners, anchored square to the baseline. */
const barPath = (x: number, y: number, width: number, height: number) => {
    const r = Math.min(4, width / 2, height);
    return `M${x},${y + height}V${y + r}Q${x},${y} ${x + r},${y}H${x + width - r}Q${x + width},${y} ${x + width},${y + r}V${y + height}Z`;
};

const useWidth = () => {
    const ref = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);
    useEffect(() => {
        const element = ref.current;
        if (!element) return;
        const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
        observer.observe(element);
        return () => observer.disconnect();
    }, []);
    return [ref, width] as const;
};

export const TrendChart = ({ points, kind, formatValue, reference, height = 200, ariaLabel }: TrendChartProps) => {
    const [containerRef, width] = useWidth();
    const [hover, setHover] = useState<number | null>(null);

    const geometry = useMemo(() => {
        const plotWidth = Math.max(width - PADDING.left - PADDING.right, 10);
        const plotHeight = height - PADDING.top - PADDING.bottom;
        // At least 2 so a count axis never shows a half-study gridline.
        const maxValue = Math.max(niceCeil(Math.max(...points.map((p) => p.value), reference?.value ?? 0, 0)), 2);
        const step = plotWidth / Math.max(points.length, 1);
        const xCenter = (i: number) =>
            PADDING.left + (kind === "bar" ? step * i + step / 2 : points.length > 1 ? (plotWidth * i) / (points.length - 1) : plotWidth / 2);
        const y = (value: number) => PADDING.top + plotHeight - (value / maxValue) * plotHeight;
        return { plotWidth, plotHeight, maxValue, step, xCenter, y };
    }, [width, height, points, kind, reference]);

    const { plotWidth, plotHeight, maxValue, step, xCenter, y } = geometry;
    const baseline = PADDING.top + plotHeight;
    const ticks = [0, maxValue / 2, maxValue];
    const labelIndexes = points.length <= 1 ? [0] : [0, Math.floor((points.length - 1) / 2), points.length - 1];

    const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
        const box = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - box.left - PADDING.left;
        if (!points.length) return;
        const index = kind === "bar"
            ? Math.floor(x / step)
            : Math.round((x / plotWidth) * (points.length - 1));
        setHover(Math.min(Math.max(index, 0), points.length - 1));
    };

    const linePath = points.map((p, i) => `${i ? "L" : "M"}${xCenter(i)},${y(p.value)}`).join("");
    const hovered = hover !== null ? points[hover] : null;
    const tooltipLeft = hover !== null ? Math.min(Math.max(xCenter(hover) - 80, 0), Math.max(width - 160, 0)) : 0;

    return (
        <div ref={containerRef} className="relative w-full" style={{ height }}>
            {width > 0 && (
                <svg
                    width={width}
                    height={height}
                    role="img"
                    aria-label={ariaLabel}
                    className="touch-none select-none"
                    onPointerMove={onPointerMove}
                    onPointerLeave={() => setHover(null)}
                >
                    {ticks.map((tick) => (
                        <g key={tick}>
                            <line
                                x1={PADDING.left}
                                x2={PADDING.left + plotWidth}
                                y1={y(tick)}
                                y2={y(tick)}
                                className="stroke-gray-200 dark:stroke-white/10"
                                strokeWidth={1}
                            />
                            <text x={PADDING.left - 8} y={y(tick)} dy="0.32em" textAnchor="end" className="fill-muted-foreground text-[11px]">
                                {formatValue(tick)}
                            </text>
                        </g>
                    ))}

                    {kind === "bar" &&
                        points.map((p, i) => {
                            const barWidth = Math.max(step - 2, 1);
                            const top = y(p.value);
                            return p.value > 0 ? (
                                <path
                                    key={p.key}
                                    d={barPath(xCenter(i) - barWidth / 2, top, barWidth, baseline - top)}
                                    className={hover === null || hover === i ? "fill-brand-purple dark:fill-purple-400" : "fill-brand-purple/40 dark:fill-purple-400/40"}
                                />
                            ) : null;
                        })}

                    {kind === "line" && points.length > 0 && (
                        <>
                            <path d={linePath} fill="none" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" className="stroke-brand-purple dark:stroke-purple-400" />
                            {points.length === 1 && <circle cx={xCenter(0)} cy={y(points[0].value)} r={4} className="fill-brand-purple dark:fill-purple-400" />}
                        </>
                    )}

                    {reference && (
                        <g>
                            <line
                                x1={PADDING.left}
                                x2={PADDING.left + plotWidth}
                                y1={y(reference.value)}
                                y2={y(reference.value)}
                                strokeDasharray="4 4"
                                strokeWidth={1.5}
                                className="stroke-gray-500 dark:stroke-gray-400"
                            />
                            <text x={PADDING.left + plotWidth} y={y(reference.value) - 5} textAnchor="end" className="fill-muted-foreground text-[11px]">
                                {reference.label}
                            </text>
                        </g>
                    )}

                    {labelIndexes.map((i) =>
                        points[i] ? (
                            <text
                                key={`x-${i}`}
                                x={xCenter(i)}
                                y={height - 8}
                                textAnchor={i === 0 && points.length > 1 ? "start" : i === points.length - 1 && points.length > 1 ? "end" : "middle"}
                                className="fill-muted-foreground text-[11px]"
                            >
                                {points[i].label}
                            </text>
                        ) : null,
                    )}

                    {hover !== null && hovered && (
                        <g pointerEvents="none">
                            <line x1={xCenter(hover)} x2={xCenter(hover)} y1={PADDING.top} y2={baseline} className="stroke-gray-400 dark:stroke-gray-500" strokeWidth={1} />
                            {kind === "line" && (
                                <circle cx={xCenter(hover)} cy={y(hovered.value)} r={5} strokeWidth={2} className="fill-brand-purple stroke-white dark:fill-purple-400 dark:stroke-[#1a1b24]" />
                            )}
                        </g>
                    )}
                </svg>
            )}

            {hovered && (
                <div
                    className="pointer-events-none absolute top-0 z-10 w-40 rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md"
                    style={{ left: tooltipLeft }}
                >
                    <div className="font-medium text-muted-foreground">{hovered.detail?.[0] ?? hovered.label}</div>
                    <div className="text-sm font-semibold">{formatValue(hovered.value)}</div>
                    {hovered.detail?.slice(1).map((line) => (
                        <div key={line} className="text-muted-foreground">{line}</div>
                    ))}
                </div>
            )}
        </div>
    );
};
