import type { TableAction, TableColumn } from "@/types/table";
import type { Informes } from "../types/informes.types";
import { fechaYhora, formatDate, formatDateTime } from "@/lib/fechaYhora";
import { CalendarDays, FileText, Hash, Image, KeyRound, Lock, LockOpen, CircleCheck, Clock, CheckCircle2, UserCheck, Share2, PencilOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { FlagsCell } from "./FlagsCell";
import { TagsCell } from "./TagsCell";
import { GeneralNotesCell } from "./GeneralNotesCell";
import type { Tag } from "@/modules/configuracion/configuracion-tablas/institucional/tags";
import { useRef, type ReactNode } from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { formatPatientName } from "@/lib/formatPatientName";

const formatStudyTime = (timeValue: string | null | undefined) => {
    if (!timeValue) return "—";
    const digits = timeValue.replace(/\D/g, "");
    if (digits.length < 4) return timeValue;

    const hh = digits.slice(0, 2);
    const mm = digits.slice(2, 4);
    const ss = digits.length >= 6 ? digits.slice(4, 6) : "00";
    return `${hh}:${mm}:${ss}`;
};

const DateTimeCell = ({ value }: { value: string | null | undefined }) => {
    if (!value) return <span className="text-gray-400 text-xs">—</span>;

    const [date, time] = fechaYhora(value).split(" ");
    return (
        <div>
            <div>{date}</div>
            <div className="text-xs text-muted-foreground">{time || "—"}</div>
        </div>
    );
};

const ImmediateSelectionCheckbox = ({
    checked,
    onToggle,
}: {
    checked: boolean;
    onToggle: () => void;
}) => {
    const pointerHandledRef = useRef(false);

    return (
        <Checkbox
            checked={checked}
            onPointerDown={(event) => {
                if (event.button !== 0) return;
                pointerHandledRef.current = true;
                onToggle();
            }}
            onCheckedChange={() => {
                // El click de Radix llega después de pointerdown. Evita
                // alternar dos veces cuando ya actualizamos la selección.
                if (pointerHandledRef.current) {
                    pointerHandledRef.current = false;
                    return;
                }
                onToggle();
            }}
            onClick={(event) => event.stopPropagation()}
        />
    );
};

export const getSelectionColumn = (
    selectedIds: Set<string>,
    onToggle: (id: string) => void,
    onToggleAll: () => void,
    totalCount: number,
): TableColumn<Informes> => ({
    key: "_selection",
    trackChanges: false,
    label: "",
    headerClassName: "w-10",
    sortable: false,
    filterable: false,
    headerRender: () => (
        <Checkbox
            checked={totalCount > 0 && selectedIds.size === totalCount}
            ref={(el) => {
                if (el) {
                    (el as HTMLButtonElement & { indeterminate?: boolean }).indeterminate =
                        selectedIds.size > 0 && selectedIds.size < totalCount;
                }
            }}
            onCheckedChange={onToggleAll}
            onClick={(e) => e.stopPropagation()}
        />
    ),
    render: (_value: unknown, informe: Informes) => (
        <ImmediateSelectionCheckbox
            checked={selectedIds.has(informe.guid)}
            onToggle={() => onToggle(informe.guid)}
        />
    ),
});

export const getPatientNameColumn = (): TableColumn<Informes> => ({
    key: "patient_name",
    label: "PACIENTE",
    className: "font-medium",
    sortable: true,
    filterable: true,
    mobile: { role: "title", order: 1 },
    render: (value: string) => (
        <div className="flex items-center gap-2">
            <span>{formatPatientName(value)}</span>
        </div>
    ),
});

const WorkflowStateBadge = ({ state }: { state?: Informes['workflow_state'] }) => {
    if (!state || state === 'pending') return <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">Ready</span>;
    const cancelled = state === 'cancelled';
    return <span className={cancelled
        ? "rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-300"
        : "rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"}>
        {cancelled ? 'Cancelado' : 'Ya leído'}
    </span>;
};

const WorkflowTooltip = ({ informe, children }: { informe: Informes; children: ReactNode }) => {
    const cancelled = informe.workflow_state === 'cancelled';
    const ready = Boolean(informe.is_image) && !informe.is_reported && (!informe.workflow_state || informe.workflow_state === 'pending');
    const label = cancelled ? 'Cancelado' : ready ? 'Ready' : informe.status || 'Pendiente';
    const details = [
        { label: 'Estado original', value: informe.status },
        { label: 'Fecha y hora', value: informe.workflow_state_at ? formatDateTime(informe.workflow_state_at) : null },
        { label: 'Origen', value: informe.workflow_state_source },
    ].filter((detail) => detail.value);

    return (
        <Tooltip delayDuration={250}>
            <TooltipTrigger asChild>
                <div tabIndex={0} className="w-fit rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-purple-500">{children}</div>
            </TooltipTrigger>
            <TooltipContent
                side="top"
                sideOffset={8}
                className="w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-purple-100 bg-white p-0 text-left text-gray-800 shadow-xl shadow-purple-950/15 dark:border-purple-800 dark:bg-gray-900 dark:text-gray-100 [&>svg]:bg-white [&>svg]:fill-white dark:[&>svg]:bg-gray-900 dark:[&>svg]:fill-gray-900"
            >
                <div className={`flex items-center gap-2 border-b px-4 py-3 font-semibold ${cancelled ? 'border-red-100 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300' : ready ? 'border-green-100 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300' : 'border-purple-100 bg-purple-50 text-purple-800 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-200'}`}>
                    <CircleCheck className="size-4 shrink-0" />
                    {label}
                </div>
                <dl className="space-y-2 px-4 py-3">
                    {details.map((detail) => (
                        <div key={detail.label} className="grid grid-cols-[6rem_1fr] gap-3">
                            <dt className="font-normal text-gray-500 dark:text-gray-400">{detail.label}</dt>
                            <dd className="min-w-0 break-words font-medium">{detail.value}</dd>
                        </div>
                    ))}
                    {informe.cancellation_reason && (
                        <div className="border-t border-gray-100 pt-2 dark:border-gray-800">
                            <dt className="mb-1 font-normal text-gray-500 dark:text-gray-400">Motivo de cancelación</dt>
                            <dd className="whitespace-pre-wrap break-words leading-relaxed">{informe.cancellation_reason}</dd>
                        </div>
                    )}
                </dl>
            </TooltipContent>
        </Tooltip>
    );
};

// Configuración de columnas para usuarios
export const getInformeColumns = (
    onMissingImageClick?: (informe: Informes) => void,
): TableColumn<Informes>[] => [
    {
        key: "patient_id",
        label: "PATIENT ID",
        className: "font-medium",
        sortable: true,
        filterable: true,
        mobile: { label: "Patient ID", order: 3, icon: <Hash className="h-3.5 w-3.5" /> },
    },
    {
        key: "patient_dni",
        label: "DNI",
        className: "font-medium",
        headerClassName: "w-[88px]",
        sortable: true,
        filterable: true,
        mobile: { label: "DNI", order: 4, icon: <Hash className="h-3.5 w-3.5" /> },
    },
    {
        key: "assignto_name",
        label: "ASIGNADO",
        className: "font-medium",
        headerClassName: "w-[130px]",
        sortable: true,
        filterable: true,
        render: (value: string | null | undefined) => value || "Sin asignar",
    },
    {
        key: "study_type",
        label: "EXAMEN",
        className: "font-medium",
        headerClassName: "max-w-[250px]",
        hideOnMobile: true,
        mobile: { label: "Examen", order: 2, icon: <FileText className="h-3.5 w-3.5" /> },
        sortable: true,
        filterable: true,
        render: (value: string, _informe: Informes) => {
            return (
                <span className="block truncate max-w-[250px]" title={value}>{value}</span>
            );
        },
    },
    {
        key: "template_name",
        changeValue: (informe) => [informe.template_name, informe.template_source],
        label: "PLANTILLA",
        className: "font-medium",
        headerClassName: "max-w-[220px]",
        hideOnMobile: true,
        mobile: { role: "hidden" },
        sortable: true,
        filterable: true,
        render: (value: string | null | undefined, informe: Informes) => {
            const templateName = value || "—";
            return (
                <div className="max-w-[220px]" title={value || "Sin plantilla asociada"}>
                    <span className="block truncate">{templateName}</span>
                    {informe.template_source && value && (
                        <span className="block text-[10px] font-normal text-muted-foreground">
                            {informe.template_source}
                        </span>
                    )}
                </div>
            );
        },
    },
    {
        key: "status",
        changeValue: (informe) => [informe.status, informe.is_image, informe.workflow_state, informe.workflow_state_at, informe.workflow_state_source, informe.cancellation_reason],
        label: "ESTADO",
        className: "font-medium",
        headerClassName: "w-[68px]",
        hideOnMobile: true,
        mobile: { label: "Estado", order: 3, icon: <CircleCheck className="h-3.5 w-3.5" /> },
        sortable: true,
        filterable: true,
        render: (value: string, informe: Informes) => {
            const hasNoImages = !informe.is_image;
            const statusLabel = hasNoImages ? "Sin imagenes" : (value || "—");

            return (
                <WorkflowTooltip informe={informe}>
                    {informe.workflow_state && informe.workflow_state !== "pending" ? (
                        <WorkflowStateBadge state={informe.workflow_state} />
                    ) : !hasNoImages && !informe.is_reported ? (
                        <WorkflowStateBadge state="pending" />
                    ) : hasNoImages && onMissingImageClick ? (
                        <button
                            type="button"
                            className="w-fit cursor-pointer text-left font-medium text-amber-700 underline decoration-dotted underline-offset-2 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100"
                            title="Buscar estudios PACS para vincular"
                            onClick={(event) => {
                                event.stopPropagation();
                                onMissingImageClick(informe);
                            }}
                        >
                            {statusLabel}
                        </button>
                    ) : (
                        <span>{statusLabel}</span>
                    )}

                </WorkflowTooltip>
            );
        },
    },
    {
        key: "admission_number",
        label: "ADM. Nº",
        className: "font-medium",
        headerClassName: "w-[80px]",
        sortable: true,
        filterable: true,
        mobile: { role: "hidden" },
    },
    {
        key: "accession_number",
        label: "ACC. Nº",
        className: "font-medium",
        headerClassName: "w-[100px] min-w-[100px]",
        sortable: true,
        filterable: true,
        mobile: { label: "Acceso", order: 5, icon: <KeyRound className="h-3.5 w-3.5" /> },
    },
    {
        key: "created_on",
        label: "FYH ADMISION",
        className: "font-medium",
        headerClassName: "w-[130px]",
        sortable: true,
        filterable: true,
        mobile: { label: "Admisión", order: 6, icon: <CalendarDays className="h-3.5 w-3.5" /> },
        render: (value: string) => <DateTimeCell value={value} />
    },
    {
        key: "study_date",
        changeValue: (informe) => [informe.study_date, informe.study_time],
        label: "FYH ESTUDIO",
        className: "font-medium",
        headerClassName: "w-[130px]",
        sortable: true,
        filterable: false,
        mobile: { label: "Estudio", order: 7, icon: <CalendarDays className="h-3.5 w-3.5" /> },
        render: (value: string | null, informe: Informes) => (
            <div>
                <div>{value ? formatDate(value) : "—"}</div>
                <div className="text-xs text-muted-foreground">
                    {formatStudyTime(informe.study_time)}
                </div>
            </div>
        ),
    },
    {
        key: "arrival_time",
        label: "FYH LLEGADA",
        className: "font-medium",
        headerClassName: "w-[130px]",
        sortable: true,
        filterable: false,
        mobile: { label: "Llegada", order: 8, icon: <CalendarDays className="h-3.5 w-3.5" /> },
        render: (value: string | null) => <DateTimeCell value={value} />,
    },
    {
        key: "num_instances",
        label: "INS",
        className: "font-medium text-center",
        headerClassName: "w-[64px]",
        sortable: true,
        filterable: true,
        render: (value: number | null | undefined) => value ?? 0,
    },
    {
        key: "is_reported",
        label: "",
        headerClassName: "w-10",
        sortable: false,
        filterable: false,
        mobile: { label: "Estado", order: 7 },
        render: (value) => (
            <div className="flex justify-center">
                {value ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                    <Clock className="h-5 w-5 text-yellow-500" />
                )}
            </div>
        ),
    },
    {
        key: "report_date",
        label: "FECHA REPORTE",
        className: "font-medium",
        sortable: true,
        filterable: true,
        mobile: { role: "hidden" },
        render: (value: string | null) => {
            if (!value) return <span className="text-gray-400 text-xs">—</span>;
            return formatDate(value);
        }
    },
];

// Columna de banderas: generada dinámicamente para incluir el handler de actualización
export const getFlagsColumn = (
    onUpdateFlags: (examId: string, flags: string[]) => void,
    isUpdating?: boolean,
): TableColumn<Informes> => ({
    key: "flags",
    label: "BANDERAS",
    className: "font-medium",
    headerClassName: "w-[85px]",
    sortable: false,
    filterable: false,
    mobile: { role: "hidden" },
    render: (_value: string[], informe: Informes) => (
        <FlagsCell
            examId={informe.guid}
            currentFlags={informe.flags ?? []}
            onUpdate={onUpdateFlags}
            isUpdating={isUpdating}
        />
    ),
});

// Columna de tags: generada dinámicamente para incluir los tags disponibles y el handler
export const getTagsColumn = (
    availableTags: Tag[],
    onUpdateTags: (examId: string, tagIds: string[]) => void,
    isUpdating?: boolean,
): TableColumn<Informes> => ({
    key: "tag_ids",
    label: "TAGS",
    className: "font-medium",
    headerClassName: "w-[100px]",
    sortable: false,
    filterable: false,
    mobile: { role: "hidden" },
    render: (_value: string[], informe: Informes) => (
        <TagsCell
            examId={informe.guid}
            currentTagIds={informe.tag_ids ?? []}
            availableTags={availableTags}
            onUpdate={onUpdateTags}
            isUpdating={isUpdating}
        />
    ),
});

// Acción de notas generales: renderiza un componente Popover propio
export const getGeneralNotesAction = (
    onUpdateNotes: (examId: string, notes: string) => void,
    onDeleteNote: (examId: string, noteId: string) => void,
    canDeleteNotes: boolean,
    isPending?: boolean,
    isDeletePending?: boolean,
): TableAction<Informes> => ({
    label: "Ver notas",
    component: (informe: Informes) => (
        <GeneralNotesCell
            examId={informe.guid}
            recentNotes={informe.recent_notes ?? []}
            notesCount={informe.notes_count ?? 0}
            onUpdate={onUpdateNotes}
            onDelete={onDeleteNote}
            canDeleteNotes={canDeleteNotes}
            isPending={isPending}
            isDeletePending={isDeletePending}
        />
    ),
});

export const getAdministrativeInformesActions = (
    onViewImagenes: (informe: Informes) => void,
    onViewPdf: (informe: Informes) => void,
    onShareImages: (informe: Informes) => void,
    onShareStudy: (informe: Informes) => void,
    generalNotesAction: TableAction<Informes>,
    canViewImages = true,
    canShareImages = true,
): TableAction<Informes>[] => [
    {
        label: "Ver imágenes",
        icon: <Image className="h-4 w-4 text-green-900" />,
        onClick: onViewImagenes,
        hidden: (informe) => !canViewImages || !informe.is_image,
    },
    {
        label: "Ver reporte",
        icon: <i className="fi fi-rr-document-signed text-[16px] text-red-900" aria-hidden="true" />,
        onClick: onViewPdf,
        hidden: (informe) => !informe.report_available,
    },
    {
        label: "Compartir imágenes",
        icon: <Share2 className="h-4 w-4 text-blue-900" />,
        onClick: onShareImages,
        hidden: (informe) => !canShareImages || !informe.is_image || !informe.study_instance_uid,
    },
    {
        label: "Compartir estudio",
        icon: <Share2 className="h-4 w-4 text-purple-900" />,
        onClick: onShareStudy,
        hidden: (informe) => !canShareImages || !informe.study_instance_uid,
    },
    generalNotesAction,
];

// Función que genera las acciones con handlers personalizados
export const getInformesActions = (
    onViewInforme: (informe: Informes) => void,
    onViewImagenes: (informe: Informes) => void,
    onViewPdf: (informe: Informes) => void,
    generalNotesAction?: TableAction<Informes>,
    canWrite: boolean = false,
    onAssign?: (informe: Informes) => void,
    onConfirmStudy?: (informe: Informes) => void,
    onAdminUnlock?: (examId: string) => void,
    isAdmin: boolean = false,
    canViewImages = true,
): TableAction<Informes>[] => [
        {
            label: (informe: Informes) => {
                if (informe.workflow_state === 'cancelled') return "Estudio cancelado";
                if (!informe.blocked_by) return "Redactar Informe";
                if (isAdmin) return `Desbloquear informe (${informe.blocked_by_name || 'otro usuario'})`;
                return `Informe bloqueado por ${informe.blocked_by_name || 'otro usuario'}`;
            },
            icon: (informe: Informes) => {
                if (informe.workflow_state === 'cancelled') {
                    return <PencilOff className="h-4 w-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />;
                }
                if (!informe.blocked_by) return <i className="fi fi-rs-pencil text-[16px] text-blue-900" aria-hidden="true" />;
                return isAdmin
                    ? <LockOpen className="h-4 w-4 text-yellow-600" />
                    : <Lock className="h-4 w-4 text-yellow-600" />;
            },
            onClick: (informe: Informes) => {
                if (informe.blocked_by && isAdmin && onAdminUnlock && informe.workflow_state !== 'cancelled') {
                    onAdminUnlock(informe.guid);
                    return;
                }
                onViewInforme(informe);
            },
            hidden: () => !canWrite,
            mobilePrimary: true,
        },
        {
            label: "Ver Imágenes",
            icon: <Image className="h-4 w-4 text-green-900" />,
            onClick: onViewImagenes,
            hidden: (informe) => !canViewImages || !informe.is_image,
        },
        {
            label: "Ver informe",
            icon: <i className="fi fi-rr-document-signed text-[16px] text-red-900" aria-hidden="true" />,
            onClick: onViewPdf,
            hidden: (informe) => !informe.report_available,
        },
        {
            label: (informe: Informes) => {
                if (informe.w_order === 1 || informe.is_executed) return "Editar confirmación";
                return onConfirmStudy ? "Confirmar estudio" : "Estudio sin confirmar";
            },
            icon: <i className="fi fi-rr-search-alt text-[16px] text-green-600" aria-hidden="true" />,
            onClick: (informe: Informes) => {
                if (onConfirmStudy) {
                    onConfirmStudy(informe);
                }
            },
            hidden: () => !onConfirmStudy,
        },
        ...(onAssign ? [{
            label: "Asignar",
            icon: <UserCheck className="h-4 w-4 text-purple-900" />,
            onClick: onAssign,
        }] : []),
        ...(generalNotesAction ? [generalNotesAction] : []),
    ];

const informeColumns = getInformeColumns();

export { informeColumns };
