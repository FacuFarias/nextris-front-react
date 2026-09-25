import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    ArrowDownToLine,
    ArrowUpFromLine,
    Clock3,
    Eye,
    RefreshCw,
    Search,
    Waypoints,
} from "lucide-react";
import { MainLayout } from "@/layouts/layout";
import TablaDynamic from "@/components/TableDynamic";
import type { TableAction, TableColumn } from "@/types/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { clinicaParqueIntegrationService } from "./services";
import type { ClinicaParqueLog, ClinicaParqueLogDetail } from "./types";
import { formatDateTime } from "@/lib/fechaYhora";

const formatDate = (value: string | null) => {
    if (!value) return "-";
    return formatDateTime(value) || "-";
};

const formatJson = (value: string | null) => {
    if (!value) return "Sin contenido";
    try {
        return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
        return value;
    }
};

const ResultBadge = ({ log }: { log: ClinicaParqueLog }) => (
    <div className="flex flex-col items-start gap-1">
        <span className={log.success
            ? "rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
            : "rounded-full px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"}>
            {log.success ? "Exitoso" : "Error"}
        </span>
        {log.response_status !== null && (
            <span className="text-xs text-muted-foreground">HTTP {log.response_status}</span>
        )}
    </div>
);

const DirectionBadge = ({ direction }: { direction: ClinicaParqueLog["direction"] }) => {
    const sent = direction === "Enviado";
    return (
        <span className={sent
            ? "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
            : "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"}>
            {sent ? <ArrowUpFromLine className="h-3.5 w-3.5" /> : <ArrowDownToLine className="h-3.5 w-3.5" />}
            {direction}
        </span>
    );
};

const MessageDetailDialog = ({
    log,
    open,
    onClose,
}: {
    log: ClinicaParqueLog | null;
    open: boolean;
    onClose: () => void;
}) => {
    const detailQuery = useQuery({
        queryKey: ["clinicaparque-log-detail", log?.guid],
        queryFn: () => clinicaParqueIntegrationService.getLogDetail(log!.guid),
        enabled: open && Boolean(log?.guid),
    });
    const detail = detailQuery.data?.data as ClinicaParqueLogDetail | undefined;

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Detalle del mensaje</DialogTitle>
                    <DialogDescription>
                        {log?.api_endpoint || ""} · {formatDate(log?.received_at || null)}
                    </DialogDescription>
                </DialogHeader>
                {detailQuery.isLoading ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">Cargando mensaje...</div>
                ) : detailQuery.isError ? (
                    <div className="py-8 text-center text-sm text-red-600">No se pudo cargar el detalle.</div>
                ) : detail ? (
                    <div className="space-y-4">
                        <div className="grid gap-3 rounded-lg border bg-muted/20 p-3 text-sm sm:grid-cols-3">
                            <div><span className="text-muted-foreground">Tipo</span><div><DirectionBadge direction={detail.direction} /></div></div>
                            <div><span className="text-muted-foreground">Resultado</span><div className="mt-1"><ResultBadge log={detail} /></div></div>
                            <div><span className="text-muted-foreground">Duración</span><div className="mt-1">{detail.duration_ms ?? "-"} ms</div></div>
                        </div>
                        {detail.error_message && (
                            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
                                {detail.error_message}
                            </div>
                        )}
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <h3 className="mb-2 text-sm font-semibold">Mensaje recibido / enviado</h3>
                                <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-md bg-slate-950 p-3 text-xs text-slate-100">
                                    {formatJson(detail.request_body)}
                                </pre>
                            </div>
                            <div>
                                <h3 className="mb-2 text-sm font-semibold">Respuesta</h3>
                                <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-md bg-slate-950 p-3 text-xs text-slate-100">
                                    {formatJson(detail.response_body)}
                                </pre>
                            </div>
                        </div>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
};

export const IntegracionClinicaParque = () => {
    const [search, setSearch] = useState("");
    const [apiEndpoint, setApiEndpoint] = useState("");
    const [success, setSuccess] = useState<"" | "true" | "false">("");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [selectedLog, setSelectedLog] = useState<ClinicaParqueLog | null>(null);

    const query = useQuery({
        queryKey: ["clinicaparque-logs", search, apiEndpoint, success, page, perPage],
        queryFn: () => clinicaParqueIntegrationService.listLogs({ page, perPage, search, apiEndpoint, success }),
    });
    const response = query.data?.data;

    const columns = useMemo<TableColumn<ClinicaParqueLog>[]>(() => [
        {
            key: "api_endpoint",
            label: "API SOLICITADA",
            className: "font-medium",
            render: (value, row) => (
                <div className="max-w-[360px]">
                    <div className="truncate" title={value}>{value}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{row.http_method}</div>
                </div>
            ),
        },
        {
            key: "direction",
            label: "TIPO",
            render: (value) => <DirectionBadge direction={value} />,
        },
        {
            key: "success",
            label: "RESULTADO",
            render: (_value, row) => <ResultBadge log={row} />,
        },
        {
            key: "received_at",
            label: "FECHA Y HORA",
            render: (value) => (
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <Clock3 className="h-4 w-4 text-muted-foreground" />
                    {formatDate(value)}
                </div>
            ),
        },
        {
            key: "patient_name",
            label: "PACIENTE",
            hideOnMobile: true,
            render: (value, row) => (
                <div>
                    <div>{value || "-"}</div>
                    {row.patient_id && <div className="text-xs text-muted-foreground">{row.patient_id}</div>}
                </div>
            ),
        },
    ], []);

    const actions = useMemo<TableAction<ClinicaParqueLog>[]>(() => [
        {
            label: "Ver mensaje",
            icon: <Eye className="h-4 w-4 text-brand-purple" />,
            onClick: (row) => setSelectedLog(row),
        },
    ], []);

    return (
        <MainLayout>
            <div className="page-dark-gradient flex h-full flex-col overflow-auto rounded-lg p-3 shadow-sm sm:p-6">
                <div className="mb-5 flex items-center gap-3">
                    <div className="rounded-lg bg-brand-purple p-2">
                        <Waypoints className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-brand-purple dark:text-purple-400">Integración Clínica Parque</h1>
                        <p className="text-sm text-muted-foreground">Registro de mensajes recibidos y enviados a través de las APIs de Clínica Parque.</p>
                    </div>
                </div>

                <div className="mb-4 flex flex-col gap-3 rounded-lg border bg-background/60 p-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="relative w-full lg:max-w-md">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                            placeholder="Buscar API, paciente, acceso u orden..."
                            className="pl-9"
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            aria-label="Filtrar por API solicitada"
                            value={apiEndpoint}
                            onChange={(event) => {
                                setApiEndpoint(event.target.value);
                                setPage(1);
                            }}
                            className="h-9 max-w-full rounded-md border bg-background px-3 text-sm lg:max-w-[360px]"
                        >
                            <option value="">Todas las APIs solicitadas</option>
                            {(response?.available_endpoints || []).map((endpoint) => (
                                <option key={endpoint} value={endpoint}>{endpoint}</option>
                            ))}
                        </select>
                        <select
                            aria-label="Filtrar por resultado"
                            value={success}
                            onChange={(event) => {
                                setSuccess(event.target.value as "" | "true" | "false");
                                setPage(1);
                            }}
                            className="h-9 rounded-md border bg-background px-3 text-sm"
                        >
                            <option value="">Todos los resultados</option>
                            <option value="true">Exitosos</option>
                            <option value="false">Con error</option>
                        </select>
                        <Button variant="outline" size="icon-sm" onClick={() => query.refetch()} disabled={query.isFetching} title="Actualizar log">
                            <RefreshCw className={query.isFetching ? "animate-spin" : ""} />
                            <span className="sr-only">Actualizar log</span>
                        </Button>
                    </div>
                </div>

                <TablaDynamic
                    data={response?.items || []}
                    filterAnimationKey={JSON.stringify([search, apiEndpoint, success])}
                    refreshScopeKey={JSON.stringify([search, apiEndpoint, success, page, perPage])}
                    refreshing={query.isFetching && !query.isLoading}
                    refreshError={Boolean(query.error)}
                    columns={columns}
                    actions={actions}
                    showIndex
                    rowIdKey="guid"
                    loading={query.isLoading}
                    emptyMessage="No hay mensajes de Clínica Parque para mostrar."
                    pagination={{
                        page: response?.page || page,
                        pageSize: response?.per_page || perPage,
                        total: response?.total || 0,
                        serverSide: true,
                    }}
                    onPaginationChange={(nextPage, nextPerPage) => {
                        setPage(nextPage);
                        setPerPage(nextPerPage);
                    }}
                    perPageValue={perPage}
                    onPerPageChange={(value) => {
                        setPerPage(value);
                        setPage(1);
                    }}
                    perPageOptions={[10, 20, 50, 100]}
                    preserveTableHeight
                />
            </div>
            <MessageDetailDialog
                log={selectedLog}
                open={Boolean(selectedLog)}
                onClose={() => setSelectedLog(null)}
            />
        </MainLayout>
    );
};
