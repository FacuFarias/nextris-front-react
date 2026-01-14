import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Eye,
    Edit,
    Trash2,
    FileCheck,
    FileText,
    Microscope,
    ClipboardList
} from "lucide-react";
import type { Template } from "../types/informe-pred.types";
import { stripHtmlTags } from "@/lib/utils";

interface TemplateCardProps {
    template: Template;
    onView: (template: Template) => void;
    onEdit: (template: Template) => void;
    onDelete: (template: Template) => void;
    onModalityClick?: (modalityId: string) => void;
    onBodypartClick?: (bodypartId: string) => void;
    isModalityActive?: boolean;
    isBodypartActive?: boolean;
}

export const TemplateCard = ({
    template,
    onView,
    onEdit,
    onDelete,
    onModalityClick,
    onBodypartClick,
    isModalityActive,
    isBodypartActive
}: TemplateCardProps) => {
    return (
        <Card className="group hover:shadow-lg transition-all duration-300 border-gray-200 hover:border-brand-purple/50">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="bg-brand-purple/10 p-2 rounded-lg">
                                <FileText className="h-5 w-5 text-brand-purple" />
                            </div>
                            <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-brand-purple transition-colors">
                                {template.title}
                            </h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {template.study_type_description && (
                                <Badge
                                    variant="outline"
                                    className="bg-purple-50 text-purple-700 border-purple-200"
                                >
                                    <Microscope className="h-3 w-3 mr-1" />
                                    {template.study_type_description}
                                </Badge>
                            )}

                            <Badge
                                variant="outline"
                                className={`transition-all cursor-pointer hover:shadow-md ${isModalityActive
                                    ? 'bg-green-600 text-white border-green-600 ring-2 ring-green-300'
                                    : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                    }`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onModalityClick) {
                                        onModalityClick(template.modality_id);
                                    }
                                }}
                            >
                                <Microscope className="h-3 w-3 mr-1" />
                                {template.modality_description}
                            </Badge>

                            <Badge
                                variant="outline"
                                className={`transition-all cursor-pointer hover:shadow-md ${isBodypartActive
                                    ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-300'
                                    : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                    }`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onBodypartClick) {
                                        onBodypartClick(template.bodypart_id);
                                    }
                                }}
                            >
                                <Microscope className="h-3 w-3 mr-1" />
                                {template.bodypart_description}
                            </Badge>
                        </div>

                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Preview de contenido */}
                <div className="space-y-2">
                    {template.findings && (
                        <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <ClipboardList className="h-4 w-4 text-gray-500" />
                                <span className="text-xs font-medium text-gray-600">Hallazgos</span>
                            </div>
                            <p className="text-sm text-gray-700 line-clamp-2">
                                {stripHtmlTags(template.findings)}
                            </p>
                        </div>
                    )}

                    {template.impression && (
                        <div className="bg-blue-50/50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <FileCheck className="h-4 w-4 text-blue-600" />
                                <span className="text-xs font-medium text-blue-600">Impresión</span>
                            </div>
                            <p className="text-sm text-gray-700 line-clamp-2">
                                {stripHtmlTags(template.impression)}
                            </p>
                        </div>
                    )}
                </div>

                {/* Acciones */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onView(template)}
                        className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors"
                    >
                        <Eye className="h-4 w-4 mr-1.5" />
                        Ver Detalles
                    </Button>

                    {/*  <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSelect(template)}
                        className="hover:bg-green-50 hover:text-green-700 hover:border-green-300 transition-colors"
                    >
                        <FileCheck className="h-4 w-4 mr-1.5" />
                        Seleccionar
                    </Button> */}

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(template)}
                        className="hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 transition-colors"
                    >
                        <Edit className="h-4 w-4 mr-1.5" />
                        Editar
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(template)}
                        className="hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors"
                    >
                        <Trash2 className="h-4 w-4 mr-1.5" />
                        Eliminar
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
