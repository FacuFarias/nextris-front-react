import type { TableAction, TableColumn } from "@/types/table";
import type { Informes } from "../types/informes.types";
import { fechaYhora } from "@/lib/fechaYhora";
import { ClipboardPlus, FileText, Image, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Configuración de columnas para usuarios
const informeColumns: TableColumn<Informes>[] = [
    {
        key: "patient_name",
        label: "PACIENTE",
        className: "font-medium",
        sortable: true,
        filterable: true,
        render: (value: string, informe: Informes) => (
            <div className="flex items-center gap-2">
                {informe.blocked_by && informe.blocked_by_name && (
                    <div className="relative group">
                        <Lock className="w-4 h-4 text-yellow-600" />
                    </div>
                )}
                <span>{value}</span>
            </div>
        ),
    },
    {
        key: "patient_dni",
        label: "DNI",
        className: "font-medium",
        sortable: true,
        filterable: true,
    },
    {
        key: "study_type",
        label: "EXAMEN",
        className: "font-medium",
        hideOnMobile: true,
        sortable: true,
        filterable: true,
    },
    {
        key: "status",
        label: "ESTADO",
        className: "font-medium",
        hideOnMobile: true,
        sortable: true,
        filterable: true,
    },
    {
        key: "admission_number",
        label: "ADM. Nº",
        className: "font-medium",
        sortable: true,
        filterable: true,
    },
    {
        key: "accession_number",
        label: "ACC. Nº",
        className: "font-medium",
        sortable: true,
        filterable: true,
    },
    {
        key: "created_on",
        label: "FECHA Y HORA DE ADMISION",
        className: "font-medium",
        sortable: true,
        filterable: true,
        render: (value: string) => {
            return fechaYhora(value);
        }
    },
    {
        key: "is_reported",
        label: "REPORTADO",
        className: "font-medium",
        sortable: true,
        filterable: true,
        render: (value) => (
            <div className="flex justify-center">
                {value ? (
                    <Badge className="" variant="success">FINALIZADO</Badge>
                ) : (
                    <Badge className="bg-yellow-500 hover:bg-yellow-600">PENDIENTE</Badge>
                )}
            </div>
        ),
    },
];

// Función que genera las acciones con handlers personalizados
export const getInformesActions = (
    onViewInforme: (informe: Informes) => void,
    onViewImagenes: (informe: Informes) => void,
    onViewPdf: (informe: Informes) => void,
): TableAction<Informes>[] => [
        {
            label: "Redactar Informe",
            icon: <ClipboardPlus className="h-4 w-4 text-blue-900" />,
            onClick: (informe: Informes) => onViewInforme(informe),
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
            hidden: (informe) => !(informe.pdf_path), // Solo mostrar si is_image es true
        }
    ];

export { informeColumns };
