import { Mail, Send, Eye, Image } from "lucide-react";
import type { TableAction } from "@/types/table";
import type { Examen } from "../types/distribucion.types";

export const getDistribucionActions = (
    onUpdateEmail: (examen: Examen) => void,
    onSendReport: (examen: Examen) => void,
    onViewReport: (examen: Examen) => void,
    onOpenDicomViewer: (examen: Examen) => void,
    sendDisabled: boolean = false,
): TableAction<Examen>[] => [
        {
            label: "Ver Informe",
            icon: <Eye className="h-4 w-4 text-blue-600" />,
            onClick: onViewReport,
        },
        {
            label: "Visor DICOM",
            icon: <Image className="h-4 w-4 text-green-600" />,
            onClick: onOpenDicomViewer,
            hidden: (examen) => !(examen.isimage),
        },
        {
            label: "Actualizar Email",
            icon: <Mail className="h-4 w-4 text-orange-600" />,
            onClick: onUpdateEmail,
        },
        {
            label: "Enviar Informe",
            icon: <Send className="h-4 w-4 text-green-600" />,
            onClick: onSendReport,
            disabled: () => sendDisabled,
        },
    ];
