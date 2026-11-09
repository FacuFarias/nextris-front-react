import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    AlertTriangle,
    CalendarDays,
    CheckCircle2,
    Cloud,
    CloudUpload,
    HardDrive,
    Layers,
    RefreshCw,
    Scale,
    XOctagon,
} from "lucide-react";
import { MainLayout } from "@/layouts/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { storageService } from "./services";
import type { StatusLevel, StorageHistory, StorageOverview } from "./types";
import { formatAge, formatBytes, formatDay, formatDays, formatNumber } from "./format";
import { TrendChart, type TrendPoint } from "./components/TrendChart";

const RANGES = [
    { days: 30, label: "30 días" },
    { days: 90, label: "90 días" },
    { days: 365, label: "1 año" },
];

const STATUS: Record<StatusLevel, { label: string; icon: typeof CheckCircle2; className: string; fallback: string }> = {
    green: {
        label: "Normal",
        icon: CheckCircle2,
        className: "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-100",
        fallback: "Hay espacio suficiente y las copias a Backblaze B2 están al día.",
    },
    yellow: {
        label: "Atención",
        icon: AlertTriangle,
        className: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100",
        fallback: "",
    },
    red: {
        label: "Crítico",
        icon: XOctagon,
        className: "border-red-300 bg-red-50 text-red-900 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-100",
        fallback: "",
    },
};

const Kpi = ({ icon, label, value, children }: { icon: ReactNode; label: string; value: string; children?: ReactNode }) => (
    <Card className="gap-2 py-4">
        <CardHeader className="px-4">
            <CardDescription className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                <span className="text-brand-purple dark:text-purple-400">{icon}</span>
                {label}
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold tabular-nums">{value}</CardTitle>
        </CardHeader>
        {children && <CardContent className="space-y-2 px-4 text-xs text-muted-foreground">{children}</CardContent>}
    </Card>
);

const StatusBanner = ({ overview }: { overview: StorageOverview }) => {
    const { level, reasons } = overview.status;
    const status = STATUS[level];
    const Icon = status.icon;
    const { disk } = overview;
    return (
        <div role="status" className={cn("flex items-start gap-3 rounded-lg border p-4", status.className)}>
            <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <div className="space-y-1 text-sm">
                <p className="font-semibold">
                    {status.label}: {formatBytes(disk.free)} libres en el disco de fs1. El PACS empieza a retirar copias locales por debajo de{" "}
                    {formatBytes(disk.threshold, 0)}.
                </p>
                {(reasons.length ? reasons : [status.fallback]).filter(Boolean).map((reason) => (
                    <p key={reason}>{reason}</p>
                ))}
            </div>
        </div>
    );
};

const DiskBar = ({ disk }: { disk: StorageOverview["disk"] }) => {
    const usedPct = (disk.used / disk.total) * 100;
    // The marker sits where free space equals the purge threshold.
    const thresholdPct = Math.max(0, Math.min(100, ((disk.total - disk.threshold) / disk.total) * 100));
    return (
        <div className="space-y-1">
            <div className="relative h-3 w-full rounded-full bg-gray-200 dark:bg-white/10" aria-hidden>
                <div className="h-full rounded-full bg-brand-purple dark:bg-purple-400" style={{ width: `${usedPct}%` }} />
                <div className="absolute -top-1 h-5 w-0.5 bg-gray-700 dark:bg-gray-200" style={{ left: `${thresholdPct}%` }} />
            </div>
            <div className="flex justify-between">
                <span>{formatNumber(usedPct, 0)}% usado de {formatBytes(disk.total, 0)}</span>
                <span>| umbral</span>
            </div>
        </div>
    );
};

const ChartCard = ({ title, description, children }: { title: string; description: string; children: ReactNode }) => (
    <Card className="gap-3 py-4">
        <CardHeader className="px-4">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="px-4">{children}</CardContent>
    </Card>
);

const Charts = ({ history }: { history: StorageHistory }) => {
    const studies: TrendPoint[] = useMemo(
        () => history.daily.map((d) => ({
            key: d.date,
            label: formatDay(d.date),
            value: d.studies,
            detail: [formatDay(d.date), `${formatBytes(d.bytes)} ingresados`],
        })),
        [history.daily],
    );
    const growth: TrendPoint[] = useMemo(
        () => history.daily.map((d) => ({
            key: d.date,
            label: formatDay(d.date),
            value: d.cumulative_bytes,
            detail: [formatDay(d.date), `+${formatBytes(d.bytes)} ese día`, `${formatNumber(d.cumulative_studies)} estudios`],
        })),
        [history.daily],
    );
    const free: TrendPoint[] = useMemo(
        () => history.snapshots.map((s) => {
            const when = new Date(s.taken_at);
            const label = when.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
            const time = when.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
            return {
                key: s.taken_at,
                label,
                value: s.disk_free,
                detail: [`${label} ${time}`, `Caché PACS: ${formatBytes(s.local_bytes)}`, `Sin copia B2: ${formatBytes(s.pending_b2_bytes)}`],
            };
        }),
        [history.snapshots],
    );

    return (
        <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Estudios por día" description="Estudios recibidos por el PACS, por fecha de llegada.">
                <TrendChart kind="bar" points={studies} formatValue={(v) => formatNumber(v)} ariaLabel="Estudios recibidos por día" />
            </ChartCard>
            <ChartCard title="Crecimiento del archivo" description="Tamaño acumulado de los estudios archivados (una copia por imagen).">
                <TrendChart kind="line" points={growth} formatValue={(v) => formatBytes(v, 1)} ariaLabel="Tamaño acumulado del archivo" />
            </ChartCard>
            <div className="lg:col-span-2">
                <ChartCard title="Espacio libre en el disco de fs1" description="Medición horaria. La línea punteada marca el umbral de purga del PACS.">
                    {free.length ? (
                        <TrendChart
                            kind="line"
                            points={free}
                            formatValue={(v) => formatBytes(v, 0)}
                            reference={{ value: history.threshold, label: `Umbral de purga ${formatBytes(history.threshold, 0)}` }}
                            ariaLabel="Espacio libre del disco a lo largo del tiempo"
                        />
                    ) : (
                        <p className="py-10 text-center text-sm text-muted-foreground">
                            Todavía no hay mediciones. Se registra una por hora y aparecerán aquí a partir de la primera.
                        </p>
                    )}
                </ChartCard>
            </div>
            <details className="rounded-lg border bg-card p-4 text-sm lg:col-span-2">
                <summary className="cursor-pointer font-medium">Ver datos diarios en tabla</summary>
                <div className="mt-3 max-h-80 overflow-auto">
                    <table className="w-full text-left tabular-nums">
                        <thead className="sticky top-0 bg-card text-xs uppercase text-muted-foreground">
                            <tr>
                                <th className="py-1 pr-4">Fecha</th>
                                <th className="py-1 pr-4 text-right">Estudios</th>
                                <th className="py-1 pr-4 text-right">Ingresado</th>
                                <th className="py-1 text-right">Acumulado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...history.daily].reverse().map((d) => (
                                <tr key={d.date} className="border-t">
                                    <td className="py-1 pr-4">{d.date.split("-").reverse().join("/")}</td>
                                    <td className="py-1 pr-4 text-right">{formatNumber(d.studies)}</td>
                                    <td className="py-1 pr-4 text-right">{formatBytes(d.bytes)}</td>
                                    <td className="py-1 text-right">{formatBytes(d.cumulative_bytes)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </details>
        </div>
    );
};

const Content = ({ overview, history }: { overview: StorageOverview; history?: StorageHistory }) => {
    const { disk, local_cache, b2, pending_b2, today, study_size, projection } = overview;
    return (
        <div className="space-y-5">
            <StatusBanner overview={overview} />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Kpi icon={<HardDrive className="h-4 w-4" />} label="Libre en disco (fs1)" value={formatBytes(disk.free)}>
                    <DiskBar disk={disk} />
                    <p>
                        {disk.margin > 0
                            ? `${formatBytes(disk.margin)} de margen antes de que el PACS retire copias locales.`
                            : `${formatBytes(-disk.margin)} por debajo del umbral: el PACS está retirando copias locales.`}
                    </p>
                </Kpi>
                <Kpi icon={<Layers className="h-4 w-4" />} label="Caché local del PACS" value={formatBytes(local_cache.bytes)}>
                    <p>
                        Recepción (fs1): {formatBytes(local_cache.fs1.bytes)} · {formatNumber(local_cache.fs1.objects)} objetos
                    </p>
                    <p>
                        Recuperadas de B2: {formatBytes(local_cache.retrieve.bytes)} · {formatNumber(local_cache.retrieve.objects)} objetos
                    </p>
                </Kpi>
                <Kpi icon={<Cloud className="h-4 w-4" />} label="Backblaze B2" value={formatBytes(b2.bytes)}>
                    <p>{formatNumber(b2.objects)} objetos copiados según el catálogo del PACS.</p>
                    <p>No incluye versiones antiguas del bucket: el uso facturado puede ser mayor.</p>
                </Kpi>
                <Kpi icon={<CalendarDays className="h-4 w-4" />} label="Estudios hoy" value={formatNumber(today.studies)}>
                    <p>{formatBytes(today.bytes)} recibidos hoy.</p>
                    <p>Promedio: {formatNumber(projection.studies_per_day, 1)} estudios por día en {projection.window_days} días.</p>
                </Kpi>
                <Kpi icon={<Scale className="h-4 w-4" />} label="Tamaño medio por estudio" value={formatBytes(study_size.average_bytes)}>
                    <p>
                        Últimos {study_size.recent_days} días: {formatBytes(study_size.recent_average_bytes)} ({formatNumber(study_size.recent_studies)} estudios).
                    </p>
                    <p>
                        {formatNumber(study_size.studies)} estudios en total · el mayor ocupa {formatBytes(study_size.largest_bytes)}.
                    </p>
                </Kpi>
                <Kpi icon={<CloudUpload className="h-4 w-4" />} label="Pendientes de copia a B2" value={formatNumber(pending_b2.objects)}>
                    <p>
                        {pending_b2.objects
                            ? `${formatBytes(pending_b2.bytes)} esperando; el más antiguo hace ${formatAge(pending_b2.oldest_age_seconds)}.`
                            : "Todas las imágenes locales tienen copia en B2."}
                    </p>
                    <p>Sin copia en B2, el PACS no puede liberar esas imágenes de fs1.</p>
                </Kpi>
            </div>

            <Card className="gap-2 py-4">
                <CardHeader className="px-4">
                    <CardTitle className="text-base">Proyección</CardTitle>
                    <CardDescription>
                        Al ritmo de los últimos {projection.window_days} días ({formatBytes(projection.bytes_per_day)} por día) y sin contar la purga del PACS:
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2 px-4 text-sm sm:grid-cols-2">
                    <p>
                        <span className="font-semibold">Hasta el umbral de purga:</span> {formatDays(projection.days_to_threshold)}
                    </p>
                    <p>
                        <span className="font-semibold">Hasta llenar el disco:</span> {formatDays(projection.days_to_full)}
                    </p>
                </CardContent>
            </Card>

            {history ? <Charts history={history} /> : <p className="text-sm text-muted-foreground">Cargando historial…</p>}
        </div>
    );
};

export const Almacenamiento = () => {
    const [days, setDays] = useState(30);
    const overview = useQuery({
        queryKey: ["storage", "overview", days],
        queryFn: () => storageService.overview(days),
        refetchInterval: 60_000,
        staleTime: 30_000,
    });
    const history = useQuery({
        queryKey: ["storage", "history", days],
        queryFn: () => storageService.history(days),
        refetchInterval: 300_000,
        staleTime: 60_000,
    });
    const refreshing = overview.isFetching || history.isFetching;

    return (
        <MainLayout>
            <div className="page-dark-gradient flex h-full flex-col overflow-auto rounded-lg p-3 shadow-sm sm:p-6">
                <div className="mb-5 flex flex-wrap items-center gap-3">
                    <div className="rounded-lg bg-brand-purple p-2">
                        <HardDrive className="h-6 w-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-2xl font-bold text-brand-purple dark:text-purple-400">Gestión de almacenamiento</h1>
                        <p className="text-sm text-muted-foreground">Espacio del PACS en fs1 y Backblaze B2, ingresos y crecimiento.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex rounded-md border p-0.5" role="group" aria-label="Período">
                            {RANGES.map((range) => (
                                <Button
                                    key={range.days}
                                    size="sm"
                                    variant={days === range.days ? "default" : "ghost"}
                                    className={cn("h-7 px-3", days === range.days && "bg-brand-purple text-white hover:bg-brand-purple/90")}
                                    aria-pressed={days === range.days}
                                    onClick={() => setDays(range.days)}
                                >
                                    {range.label}
                                </Button>
                            ))}
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8"
                            onClick={() => {
                                overview.refetch();
                                history.refetch();
                            }}
                            disabled={refreshing}
                        >
                            <RefreshCw className={cn("mr-1 h-4 w-4", refreshing && "animate-spin")} />
                            Actualizar
                        </Button>
                    </div>
                </div>

                {overview.isError ? (
                    <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-100">
                        No se pudo obtener el estado del almacenamiento. Intentá actualizar en unos segundos.
                    </div>
                ) : overview.data ? (
                    <Content overview={overview.data} history={history.data} />
                ) : (
                    <p className="text-sm text-muted-foreground">Cargando estado del almacenamiento…</p>
                )}

                {overview.data && (
                    <p className="mt-4 text-xs text-muted-foreground">
                        Actualizado {new Date(overview.data.generated_at).toLocaleString("es-AR")} · se renueva cada minuto.
                    </p>
                )}
            </div>
        </MainLayout>
    );
};
