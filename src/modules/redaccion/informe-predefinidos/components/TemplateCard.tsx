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
    index?: number;
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
    index = 0,
    onView,
    onEdit,
    onDelete,
    onModalityClick,
    onBodypartClick,
    isModalityActive,
    isBodypartActive
}: TemplateCardProps) => {
    return (
        <Card
            className="group hover:shadow-lg transition-all border-gray-200 hover:border-brand-purple/50 animate-in fade-in slide-in-from-bottom-3 zoom-in-95 duration-500 ease-out dark:bg-[#2a2e32]"
            style={{
                animationDelay: `${index * 80}ms`,
                animationFillMode: 'both'
            }}
        >
            <CardHeader className="pb-2 pt-3 px-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                            <div className="bg-brand-purple/10 p-1.5 rounded-lg">
                                <FileText className="h-4 w-4 text-brand-purple dark:text-purple-400" />
                            </div>
                            <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 group-hover:text-brand-purple transition-colors dark:text-gray-200 group-hover:dark:text-purple-400">
                                {template.title}
                            </h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                            <Badge
                                variant="outline"
                                className={`text-xs py-0 px-1.5 h-5 ${template.report_type === 'inteligente'
                                        ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-700'
                                        : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600'
                                    }`}
                            >
                                {template.report_type === 'inteligente' ? 'Inteligente' : 'Simple'}
                            </Badge>

                            {template.study_type_description && (
                                <Badge
                                    variant="outline"
                                    className="bg-purple-50 text-purple-700 border-purple-200 text-xs py-0 px-1.5 h-5 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700"
                                >
                                    <Microscope className="h-2.5 w-2.5 mr-0.5" />
                                    {template.study_type_description}
                                </Badge>
                            )}

                            <Badge
                                variant="outline"
                                className={`transition-all cursor-pointer hover:shadow-md text-xs py-0 px-1.5 h-5 ${isModalityActive
                                    ? 'bg-green-600 text-white border-green-600 ring-2 ring-green-300 dark:bg-green-700 dark:border-green-700'
                                    : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                    }`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onModalityClick) {
                                        onModalityClick(template.modality_id);
                                    }
                                }}
                            >
                                <Microscope className="h-2.5 w-2.5 mr-0.5 dark:text-green-400" />
                                {template.modality_description}
                            </Badge>

                            <Badge
                                variant="outline"
                                className={`transition-all cursor-pointer hover:shadow-md text-xs py-0 px-1.5 h-5 ${isBodypartActive
                                    ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-300 dark:bg-blue-700 dark:border-blue-700'
                                    : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                    }`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onBodypartClick) {
                                        onBodypartClick(template.bodypart_id);
                                    }
                                }}
                            >
                                <Microscope className="h-2.5 w-2.5 mr-0.5 dark:text-blue-400" />
                                {template.bodypart_description}
                            </Badge>
                        </div>

                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-2 p-3">
                {/* Preview de contenido */}
                <div className="space-y-1.5">
                    {template.findings && (
                        <div className="bg-gray-50 dark:bg-[#2a2a2a] rounded-lg p-2">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <ClipboardList className="h-3 w-3 text-gray-500" />
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Hallazgos</span>
                            </div>
                            <p className="text-xs text-gray-700 line-clamp-2 dark:text-gray-400">
                                {stripHtmlTags(template.findings)}
                            </p>
                        </div>
                    )}

                    {template.impression && (
                        <div className="bg-blue-50/50 dark:bg-[#2a2a2a] rounded-lg p-2">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <FileCheck className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Impresión</span>
                            </div>
                            <p className="text-xs text-gray-700 line-clamp-2 dark:text-gray-400">
                                {stripHtmlTags(template.impression)}
                            </p>
                        </div>
                    )}
                </div>

                {/* Acciones */}
                <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-gray-100">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onView(template)}
                        className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors h-7 text-xs px-2 dark:hover:bg-blue-600 dark:hover:text-blue-100 dark:hover:border-blue-500"
                    >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
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
                        className="hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 transition-colors h-7 text-xs px-2 dark:hover:bg-purple-600 dark:hover:text-purple-100 dark:hover:border-purple-500"
                    >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(template)}
                        className="hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors h-7 text-xs px-2 dark:hover:bg-red-600 dark:hover:text-red-100 dark:hover:border-red-500"
                    >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Eliminar
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
