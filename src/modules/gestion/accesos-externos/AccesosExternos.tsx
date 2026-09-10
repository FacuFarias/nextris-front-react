import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Copy,
    ExternalLink,
    Eye,
    FileImage,
    Link2,
    LockKeyhole,
    RefreshCw,
    Share2,
} from "lucide-react";
import { toast } from "sonner";
import { MainLayout } from "@/layouts/layout";
import TablaDynamic from "@/components/TableDynamic";
import type { TableAction, TableColumn } from "@/types/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { sharedAccessService } from "./services";
import type {
    SharedAccessLink,
    SharedAccessStatus,
    SharedAccessType,
} from "./types";
import { formatDateTime } from "@/lib/fechaYhora";
import { DateTimeInput } from "@/components/ui/date-input";

const formatDate = (value: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "-" : formatDateTime(date);
};

const statusLabels: Record<Exclude<SharedAccessStatus, "all">, string> = {
    active: "Activo",
    active_or_revoked: "Activo y revocado",
    expired: "Vencido",
    revoked: "Revocado",
};

const statusClasses: Record<Exclude<SharedAccessStatus, "all">, string> = {
    active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    active_or_revoked: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    expired: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    revoked: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const toLocalDateTimeInput = (value: string | null) => {
    const date = value ? new Date(value) : new Date();
    const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
    const pad = (part: number) => String(part).padStart(2, "0");
    return `${safeDate.getFullYear()}-${pad(safeDate.getMonth() + 1)}-${pad(safeDate.getDate())}T${pad(safeDate.getHours())}:${pad(safeDate.getMinutes())}`;
};

const getErrorMessage = (error: unknown, fallback: string) => {
    const responseError = error as { response?: { data?: { message?: string } } };
    return responseError.response?.data?.message || fallback;
};

interface ExtendDialogProps {
    link: SharedAccessLink | null;
    open: boolean;
    isPending: boolean;
    onClose: () => void;
    onSubmit: (expiresAt: string) => void;
}

const ExtendDialog = ({ link, open, isPending, onClose, onSubmit }: ExtendDialogProps) => {
    const [expiresAt, setExpiresAt] = useState(() => toLocalDateTimeInput(link?.expires_at || null));

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) onClose();
    };

    const handleSubmit = () => {
        if (!expiresAt) {
            toast.error("Seleccione una fecha de vencimiento");
            return;
        }
        const date = new Date(expiresAt);
        if (Number.isNaN(date.getTime()) || date <= new Date()) {
            toast.error("La nueva fecha debe ser futura");
            return;
        }
        onSubmit(date.toISOString());
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Extender acceso compartido</DialogTitle>
                    <DialogDescription>
                        Elija una nueva fecha y hora de vencimiento. Los enlaces revocados no pueden reactivarse.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-2">
                    <label htmlFor="shared-access-expires-at" className="text-sm font-medium">
                        Vence el
                    </label>
                    <DateTimeInput
                        id="shared-access-expires-at"
                        value={expiresAt}
                        onChange={(value) => setExpiresAt(value)}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isPending}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={isPending} className="bg-brand-purple hover:bg-brand-purple/90">
                        {isPending ? "Guardando..." : "Guardar vencimiento"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const SharedAccessTable = ({ type }: { type: SharedAccessType }) => {
    const queryClient = useQueryClient();
    const [includeRevoked, setIncludeRevoked] = useState(false);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [selectedLink, setSelectedLink] = useState<SharedAccessLink | null>(null);

    const query = useQuery({
        queryKey: ["shared-access-links", type, includeRevoked, search, page, perPage],
        queryFn: () => sharedAccessService.list({
            type,
            status: "active",
            includeRevoked,
            search,
            page,
            perPage,
        }),
    });

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["shared-access-links", type] });
    const extendMutation = useMutation({
        mutationFn: ({ guid, expiresAt }: { guid: string; expiresAt: string }) => sharedAccessService.extend(guid, expiresAt),
        onSuccess: () => {
            toast.success("Fecha de vencimiento actualizada");
            setSelectedLink(null);
            invalidate();
        },
        onError: (error) => toast.error(getErrorMessage(error, "No se pudo extender el acceso")),
    });
    const revokeMutation = useMutation({
        mutationFn: (guid: string) => sharedAccessService.revoke(guid),
        onSuccess: () => {
            toast.success("Acceso revocado inmediatamente");
            invalidate();
        },
        onError: (error) => toast.error(getErrorMessage(error, "No se pudo revocar el acceso")),
    });

    const columns = useMemo<TableColumn<SharedAccessLink>[]>(() => [
        {
            key: "patient_name",
            label: "PACIENTE",
            className: "font-medium",
            sortable: false,
            filterable: false,
            render: (value, row) => (
                <div>
                    <div>{value || "-"}</div>
                    {row.patient_id && <div className="text-xs text-muted-foreground">{row.patient_id}</div>}
                </div>
            ),
        },
        {
            key: "study_description",
            label: "ESTUDIO",
            className: "max-w-[240px] truncate",
            render: (value, row) => (
                <div className="max-w-[240px] truncate" title={value || row.study_iuid}>
                    <div>{value || "-"}</div>
                    {row.accession_number && <div className="text-xs text-muted-foreground">Acceso: {row.accession_number}</div>}
                </div>
            ),
        },
        {
            key: "created_at",
            label: "CREADO",
            render: (value) => formatDate(value),
        },
        {
            key: "expires_at",
            label: "VENCE",
            render: (value) => formatDate(value),
        },
        {
            key: "revoked_at",
            label: "REVOCADO",
            render: (value) => formatDate(value),
        },
        {
            key: "status",
            label: "ESTADO",
            render: (value) => {
                const normalized = value as Exclude<SharedAccessStatus, "all">;
                return <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClasses[normalized]}`}>{statusLabels[normalized]}</span>;
            },
        },
        {
            key: "open_count",
            label: "APERTURAS",
            render: (value, row) => (
                <div title={row.last_opened_at ? `Última: ${formatDate(row.last_opened_at)}` : "Sin aperturas"} className="flex items-center gap-1">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    {value ?? 0}
                </div>
            ),
        },
    ], []);

    const actions = useMemo<TableAction<SharedAccessLink>[]>(() => [
        {
            label: "Abrir enlace",
            icon: <ExternalLink className="h-4 w-4 text-brand-purple" />,
            hidden: (row) => !row.public_url,
            onClick: (row) => row.public_url && window.open(row.public_url, "_blank", "noopener,noreferrer"),
        },
        {
            label: "Copiar enlace",
            icon: <Copy className="h-4 w-4 text-slate-600" />,
            hidden: (row) => !row.public_url,
            onClick: async (row) => {
                if (!row.public_url) return;
                try {
                    await navigator.clipboard.writeText(row.public_url);
                    toast.success("Enlace copiado");
                } catch {
                    toast.error("No se pudo copiar el enlace");
                }
            },
        },
        {
            label: "Extender acceso",
            icon: <RefreshCw className="h-4 w-4 text-blue-700" />,
            disabled: (row) => row.status === "revoked",
            onClick: (row) => setSelectedLink(row),
        },
        {
            label: "Revocar acceso",
            icon: <LockKeyhole className="h-4 w-4 text-red-700" />,
            disabled: (row) => row.status === "revoked",
            onClick: (row) => {
                if (!window.confirm("¿Desea revocar este acceso inmediatamente? El enlace dejará de funcionar.")) return;
                revokeMutation.mutate(row.guid);
            },
        },
    ], [revokeMutation]);

    const response = query.data?.data;

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-lg border bg-background/60 p-3 sm:flex-row sm:items-center sm:justify-between">
                <Input
                    value={search}
                    onChange={(event) => {
                        setSearch(event.target.value);
                        setPage(1);
                    }}
                    placeholder="Buscar paciente, estudio o acceso..."
                    className="sm:max-w-sm"
                />
                <div className="flex items-center gap-2">
                    <Checkbox
                        id={`shared-access-include-revoked-${type}`}
                        checked={includeRevoked}
                        onCheckedChange={(checked) => {
                            setIncludeRevoked(Boolean(checked));
                            setPage(1);
                        }}
                    />
                    <label htmlFor={`shared-access-include-revoked-${type}`} className="cursor-pointer text-sm text-muted-foreground">
                        Incluir revocados
                    </label>
                </div>
            </div>

            <TablaDynamic
                data={response?.items || []}
                columns={columns}
                actions={actions}
                showIndex
                rowIdKey="guid"
                loading={query.isLoading || revokeMutation.isPending}
                emptyMessage="No hay accesos compartidos para mostrar."
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

            <ExtendDialog
                key={selectedLink?.guid || "closed"}
                link={selectedLink}
                open={Boolean(selectedLink)}
                isPending={extendMutation.isPending}
                onClose={() => setSelectedLink(null)}
                onSubmit={(expiresAt) => selectedLink && extendMutation.mutate({ guid: selectedLink.guid, expiresAt })}
            />
        </div>
    );
};

export const AccesosExternos = () => {
    const [activeTab, setActiveTab] = useState<SharedAccessType>("case_link");

    return (
        <MainLayout>
            <div className="page-dark-gradient flex h-full flex-col overflow-auto rounded-lg p-3 shadow-sm sm:p-6">
                <div className="mb-5 flex items-center gap-3">
                    <div className="rounded-lg bg-brand-purple p-2">
                        <Share2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-brand-purple dark:text-purple-400">Accesos externos compartidos</h1>
                        <p className="text-sm text-muted-foreground">Administra enlaces públicos, vencimientos y aperturas.</p>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as SharedAccessType)} className="flex min-h-0 flex-1 flex-col">
                    <TabsList className="w-full justify-start rounded-none border-b border-gray-200 bg-transparent p-0 dark:border-gray-700">
                        <TabsTrigger value="case_link" className="gap-2 rounded-none border-b-2 border-transparent px-4 py-2.5 data-[state=active]:border-brand-purple data-[state=active]:text-brand-purple">
                            <Link2 className="h-4 w-4" />
                            Case Links
                        </TabsTrigger>
                        <TabsTrigger value="image_share" className="gap-2 rounded-none border-b-2 border-transparent px-4 py-2.5 data-[state=active]:border-brand-purple data-[state=active]:text-brand-purple">
                            <FileImage className="h-4 w-4" />
                            Imágenes compartidas
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="case_link" className="mt-0 min-h-0 flex-1 p-1 pt-4 sm:p-4">
                        <SharedAccessTable type="case_link" />
                    </TabsContent>
                    <TabsContent value="image_share" className="mt-0 min-h-0 flex-1 p-1 pt-4 sm:p-4">
                        <SharedAccessTable type="image_share" />
                    </TabsContent>
                </Tabs>
            </div>
        </MainLayout>
    );
};
