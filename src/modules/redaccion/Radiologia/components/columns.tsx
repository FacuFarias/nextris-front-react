import type { TableAction, TableColumn } from "@/types/table";
import type { Informes } from "../types/informes.types";
import { fechaYhora, formatDate } from "@/lib/fechaYhora";
import { CalendarDays, ClipboardPlus, FileText, Hash, Image, KeyRound, Lock, LockOpen, CircleCheck, Clock, CheckCircle2, HelpCircle, Pencil, UserCheck, Share2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { FlagsCell } from "./FlagsCell";
import { TagsCell } from "./TagsCell";
import { GeneralNotesCell } from "./GeneralNotesCell";
import type { Tag } from "@/modules/configuracion/configuracion-tablas/institucional/tags";
import { useRef } from "react";

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
            <span>{value}</span>
        </div>
    ),
});

// Configuración de columnas para usuarios
const informeColumns: TableColumn<Informes>[] = [
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
        label: "ESTADO",
        className: "font-medium",
        headerClassName: "w-[68px]",
        hideOnMobile: true,
        mobile: { label: "Estado", order: 3, icon: <CircleCheck className="h-3.5 w-3.5" /> },
        sortable: true,
        filterable: true,
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
        label: "FECHA Y HORA DE ADMISION",
        className: "font-medium",
        headerClassName: "w-[130px]",
        sortable: true,
        filterable: true,
        mobile: { label: "Admisión", order: 6, icon: <CalendarDays className="h-3.5 w-3.5" /> },
        render: (value: string) => {
            return fechaYhora(value);
        }
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
): TableAction<Informes>[] => [
    {
        label: "Ver imágenes",
        icon: <Image className="h-4 w-4 text-green-900" />,
        onClick: onViewImagenes,
        hidden: (informe) => !informe.is_image,
    },
    {
        label: "Ver reporte",
        icon: <FileText className="h-4 w-4 text-red-900" />,
        onClick: onViewPdf,
        hidden: (informe) => !informe.report_available,
    },
    {
        label: "Compartir imágenes",
        icon: <Share2 className="h-4 w-4 text-blue-900" />,
        onClick: onShareImages,
        hidden: (informe) => !informe.is_image || !informe.study_instance_uid,
    },
    {
        label: "Compartir estudio",
        icon: <Share2 className="h-4 w-4 text-purple-900" />,
        onClick: onShareStudy,
        hidden: (informe) => !informe.study_instance_uid,
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
): TableAction<Informes>[] => [
        {
            label: (informe: Informes) => {
                if (!informe.blocked_by) return "Redactar Informe";
                if (isAdmin) return `Desbloquear informe (${informe.blocked_by_name || 'otro usuario'})`;
                return `Informe bloqueado por ${informe.blocked_by_name || 'otro usuario'}`;
            },
            icon: (informe: Informes) => {
                if (!informe.blocked_by) return <ClipboardPlus className="h-4 w-4 text-blue-900" />;
                return isAdmin
                    ? <LockOpen className="h-4 w-4 text-yellow-600" />
                    : <Lock className="h-4 w-4 text-yellow-600" />;
            },
            onClick: (informe: Informes) => {
                if (informe.blocked_by && isAdmin && onAdminUnlock) {
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
            hidden: (informe) => !informe.is_image, // Solo mostrar si is_image es true
        },
        {
            label: "Ver Pdf",
            icon: <FileText className="h-4 w-4 text-red-900" />,
            onClick: onViewPdf,
            hidden: (informe) => !informe.report_available,
        },
        {
            label: (informe: Informes) => {
                if (informe.w_order === 1 || informe.is_executed) return "Editar estudio";
                return onConfirmStudy ? "Confirmar estudio" : "Estudio sin confirmar";
            },
            icon: (informe: Informes) => (informe.w_order === 1 || informe.is_executed)
                ? <Pencil className="h-4 w-4 text-green-600" />
                : <HelpCircle className="h-4 w-4 text-amber-500" />,
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

export { informeColumns };
