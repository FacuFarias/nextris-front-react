import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { hasAnyPermission } from "@/lib/permissions";
import { storageService } from "../services";
import type { CacheCopy, CacheStudy } from "../types";
import { formatBytes, formatNumber } from "../format";

const storageLabel = (storage: CacheCopy["storage"]) => storage === "fs1" ? "Recepción inicial" : "Recuperado de B2";
const retentionLabel = (seconds: number) => seconds >= 172800 && seconds % 86400 === 0
    ? `${seconds / 86400} días` : `${seconds / 3600} h`;
const errorMessage = (error: unknown) => isAxiosError(error)
    ? error.response?.data?.message || "No se pudo consultar el PACS. Volvé a intentar."
    : "No se pudo completar la operación.";

export function CacheStudiesDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const { authData } = useAuth();
    const canManage = hasAnyPermission(authData?.user.permissions, ["storage.manage"]);
    const client = useQueryClient();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [selection, setSelection] = useState<{ study: CacheStudy; copy: CacheCopy } | null>(null);
    const cache = useQuery({
        queryKey: ["storage", "cache", page, search],
        queryFn: () => storageService.cache(page, search),
        enabled: open,
        staleTime: 0,
        refetchInterval: open ? 10_000 : false,
    });
    const remove = useMutation({
        mutationFn: ({ study, copy }: { study: CacheStudy; copy: CacheCopy }) => storageService.removeCache(study.study_pk, copy.storage),
        onSuccess: () => {
            setSelection(null);
            toast.success("Eliminación de caché programada. La copia en Backblaze B2 se conserva.");
            void client.invalidateQueries({ queryKey: ["storage"] });
        },
        onError: (error) => {
            toast.error(errorMessage(error));
            void cache.refetch();
        },
    });
    const data = cache.data;
    const dateTime = (value: string) => new Date(value).toLocaleString("es-AR", {
        timeZone: data?.timezone, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
    });

    return <>
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-6xl [&>button]:text-foreground">
                <DialogHeader className="pr-8">
                    <DialogTitle>Estudios disponibles en caché</DialogTitle>
                    <DialogDescription>
                        Copias locales del PACS. Al eliminarlas de caché, el estudio se conserva en Backblaze B2 y puede recuperarse al abrirlo.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-wrap items-center gap-3">
                    <Input aria-label="Buscar estudios en caché" placeholder="Buscar por animal, descripción, acceso o UID…"
                        className="min-w-48 flex-1" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} />
                    <Button variant="outline" size="sm" onClick={() => void cache.refetch()} disabled={cache.isFetching}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${cache.isFetching ? "animate-spin" : ""}`} />Actualizar
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                    {data && <>Horario: {data.timezone}. </>}
                    La hora es estimada: depende de la cola del PACS y del respaldo en B2. La presión de espacio puede adelantar el retiro.
                </p>
                {data && !data.policy_enabled && <p role="status" className="rounded border border-amber-400 bg-amber-50 p-3 text-sm text-amber-900">
                    La política automática está desactivada. Los vencimientos se muestran como referencia.
                </p>}
                {!!data?.items.length && <p className="text-xs text-muted-foreground sm:hidden">Deslizá la tabla hacia los lados para ver el vencimiento y las acciones.</p>}
                {cache.isError ? <div role="alert" className="text-sm text-destructive">{errorMessage(cache.error)}</div>
                    : cache.isPending ? <p role="status" className="py-8 text-center text-sm text-muted-foreground">Cargando estudios en caché…</p>
                    : data?.items.length === 0 ? <p role="status" className="py-10 text-center text-sm text-muted-foreground">
                        {search ? "No hay estudios en caché que coincidan con la búsqueda." : "No hay estudios disponibles en la caché local. Los estudios archivados permanecen en Backblaze B2."}
                    </p> : <div className="max-h-[55vh] overflow-auto rounded-md border">
                        <table className="w-full min-w-[860px] text-left text-sm">
                            <thead className="sticky top-0 z-10 bg-muted text-xs text-muted-foreground">
                                <tr><th className="p-3">Estudio / animal</th><th className="p-3">Copia local</th><th className="p-3">Tamaño</th>
                                    <th className="p-3">Eliminación estimada</th><th className="p-3">Acción</th></tr>
                            </thead>
                            <tbody>
                                {data?.items.flatMap(study => study.copies.map((copy, index) => {
                                    const isQueued = copy.queue_status === "queued";
                                    return <tr key={`${study.study_pk}:${copy.storage}`} className="border-t align-top">
                                        <td className="max-w-72 p-3">
                                            {index === 0 ? <>
                                                <p className="font-medium">{study.patient_name.replace(/\^/g, " ") || "Sin nombre DICOM"}</p>
                                                <p>{study.description || "Sin descripción"}</p>
                                                <p className="mt-1 text-xs text-muted-foreground">Acceso: {study.accession || "—"}</p>
                                                <p className="break-all text-xs text-muted-foreground">{study.study_uid}</p>
                                            </> : <span className="text-muted-foreground">Mismo estudio</span>}
                                        </td>
                                        <td className="p-3"><p>{storageLabel(copy.storage)}</p>
                                            <p className="text-xs text-muted-foreground">{formatNumber(copy.instances)} {copy.instances === 1 ? "imagen" : "imágenes"} · plazo {retentionLabel(copy.ttl_seconds)}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">Desde {dateTime(copy.entered_at)}</p>
                                        </td>
                                        <td className="whitespace-nowrap p-3 tabular-nums">{formatBytes(copy.bytes)}</td>
                                        <td className="max-w-64 p-3">
                                            <p className="whitespace-nowrap font-medium tabular-nums">{dateTime(copy.expires_at)}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">{isQueued ? "Eliminación solicitada; esperando al PACS." : copy.blocked_reason
                                                || (copy.queue_status === "failed" ? "El PACS no completó el retiro. Podés volver a solicitarlo." : null)
                                                || (copy.expired ? "Plazo vencido; pendiente de procesamiento del PACS." : "Programada según la política de caché.")}</p>
                                        </td>
                                        <td className="p-3">{canManage ? <Button size="sm" variant="outline"
                                            disabled={!copy.can_remove || isQueued || remove.isPending}
                                            title={copy.blocked_reason || "Eliminar solo esta copia local"}
                                            onClick={() => { remove.reset(); setSelection({ study, copy }); }}>
                                            <Trash2 className="mr-1 h-4 w-4" />{isQueued ? "Solicitada" : "Eliminar de caché"}
                                        </Button> : <span className="text-xs text-muted-foreground">Solo lectura</span>}</td>
                                    </tr>;
                                }))}
                            </tbody>
                        </table>
                    </div>}
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                    <p>{formatNumber(data?.total ?? 0)} estudios en caché{data ? ` · Página ${page} de ${Math.max(1, Math.ceil(data.total / data.per_page))}` : ""}</p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={page <= 1 || cache.isFetching} onClick={() => setPage(page - 1)}>Anterior</Button>
                        <Button variant="outline" size="sm" disabled={!data || page * data.per_page >= data.total || cache.isFetching} onClick={() => setPage(page + 1)}>Siguiente</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
        <Dialog open={selection !== null} onOpenChange={value => { if (!value && !remove.isPending) setSelection(null); }}>
            <DialogContent className="[&>button]:text-foreground">
                <DialogHeader>
                    <DialogTitle>Eliminar copia de caché</DialogTitle>
                    <DialogDescription>
                        {selection && <>Se retirará la copia local de {storageLabel(selection.copy.storage).toLowerCase()} de <strong>{selection.study.patient_name.replace(/\^/g, " ") || selection.study.description || "este estudio"}</strong> ({formatBytes(selection.copy.bytes)}).</>}
                        {" "}El estudio y sus imágenes se conservarán en Backblaze B2. La próxima apertura puede demorar mientras se recuperan.
                    </DialogDescription>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">El PACS procesará la solicitud en segundo plano; el espacio no se libera inmediatamente.</p>
                {remove.isError && <p role="alert" className="text-sm text-destructive">{errorMessage(remove.error)}</p>}
                <DialogFooter>
                    <Button variant="outline" disabled={remove.isPending} onClick={() => setSelection(null)}>Cancelar</Button>
                    <Button variant="destructive" disabled={remove.isPending || !selection} onClick={() => selection && remove.mutate(selection)}>
                        {remove.isPending ? "Solicitando…" : "Confirmar eliminación de caché"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </>;
}
