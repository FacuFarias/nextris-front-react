import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Edit,
    Trash2,
    FileText,
    Microscope,
    Lock,
    Star,
} from "lucide-react";
import type { Template } from "../types/informe-pred.types";
import { stripHtmlTags } from "@/lib/utils";
import DOMPurify from "dompurify";
import "./TemplateCard.css";

const RichTemplateContent = ({ content }: { content: string }) => (
    <div
        className="whitespace-pre-wrap break-words text-sm leading-relaxed [&_br]:block [&_li]:ml-5 [&_ol]:list-decimal [&_p:not(:last-child)]:mb-2 [&_strong]:font-bold [&_ul]:list-disc [&_u]:underline"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
    />
);

interface TemplateCardProps {
    template: Template;
    index?: number;
    onEdit: (template: Template) => void;
    onDelete: (template: Template) => void;
    onToggleUserDefault?: (template: Template) => void;
    onModalityClick?: (modalityId: string) => void;
    onBodypartClick?: (bodypartId: string) => void;
    isModalityActive?: boolean;
    isBodypartActive?: boolean;
}

export const TemplateCard = ({
    template,
    index = 0,
    onEdit,
    onDelete,
    onToggleUserDefault,
    onModalityClick,
    onBodypartClick,
    isModalityActive,
    isBodypartActive
}: TemplateCardProps) => {
    return (
        <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
                <Card
                    tabIndex={0}
                    title={template.can_edit ? "Doble clic para editar" : undefined}
                    onDoubleClick={(event) => {
                        const target = event.target as HTMLElement;
                        if (!template.can_edit || target.closest('button, [data-card-control]')) return;
                        onEdit(template);
                    }}
                    className={`template-card group h-full gap-0 border-gray-200 py-0 hover:border-brand-purple/50 hover:shadow-lg animate-in fade-in slide-in-from-bottom-3 zoom-in-95 duration-500 ease-out ${template.can_edit ? 'cursor-pointer' : ''}`}
                    style={{
                        animationDelay: `${index * 80}ms`,
                        animationFillMode: 'both'
                    }}
                >
            <CardHeader className="template-card__header px-3 py-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-1.5">
                            <div className="template-card__icon flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-purple/10">
                                <FileText className="h-4 w-4 text-brand-purple dark:text-purple-400" />
                            </div>
                            <h3 className="template-card__title line-clamp-2 text-[15px] font-semibold leading-snug text-gray-900 transition-colors group-hover:text-brand-purple dark:text-gray-200">
                                {template.title}
                            </h3>
                        </div>
                        {template.study_type_code && (
                            <p
                                className="template-card__code mb-2 truncate font-mono text-[11px] font-medium text-purple-600 dark:text-purple-400"
                                title={`Código del tipo de estudio: ${template.study_type_code}`}
                            >
                                Código: {template.study_type_code}
                            </p>
                        )}
                        <div className="template-card__badges flex flex-wrap items-center gap-1.5">
                            <Badge
                                variant="outline"
                                className={`template-card__badge template-card__badge--report ${template.report_type === 'inteligente'
                                        ? 'template-card__badge--intelligent'
                                        : 'template-card__badge--simple'
                                    } text-xs py-0 px-1.5 h-5 ${template.report_type === 'inteligente'
                                        ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-700'
                                        : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600'
                                    }`}
                            >
                                {template.report_type === 'inteligente' ? 'Inteligente' : 'Simple'}
                            </Badge>

                            {template.owner_id === 'nextris' && (
                                <Badge
                                    variant="outline"
                                    className="template-card__badge template-card__badge--system bg-gray-100 text-gray-500 border-gray-300 text-xs py-0 px-1.5 h-5 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600"
                                    title="Plantilla del sistema. Solo lectura."
                                >
                                    <Lock className="h-2.5 w-2.5 mr-0.5" />
                                    Sistema
                                </Badge>
                            )}

                            {template.is_system_default && (
                                <Badge
                                    variant="outline"
                                    className="template-card__badge template-card__badge--system-default bg-amber-50 text-amber-600 border-amber-300 text-xs py-0 px-1.5 h-5 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700"
                                    title="Plantilla predeterminada del sistema para este tipo de estudio"
                                >
                                    <Star className="h-2.5 w-2.5 mr-0.5 fill-amber-500" />
                                    Por defecto
                                </Badge>
                            )}

                            {template.is_user_default && (
                                <Badge
                                    variant="outline"
                                    className="template-card__badge template-card__badge--user-default bg-purple-50 text-purple-600 border-purple-300 text-xs py-0 px-1.5 h-5 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700"
                                    title="Tu plantilla predeterminada personal para este tipo de estudio"
                                >
                                    <Star className="h-2.5 w-2.5 mr-0.5 fill-purple-500" />
                                    Mi defecto
                                </Badge>
                            )}

                            {template.study_type_description && (
                                <Badge
                                    variant="outline"
                                    className="template-card__badge template-card__badge--study bg-purple-50 text-purple-700 border-purple-200 text-xs py-0 px-1.5 h-5 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700"
                                >
                                    <Microscope className="h-2.5 w-2.5 mr-0.5" />
                                    {template.study_type_description}
                                </Badge>
                            )}

                            <Badge
                                variant="outline"
                                data-card-control
                                className={`template-card__badge template-card__badge--modality transition-all cursor-pointer text-xs py-0 px-1.5 h-5 ${isModalityActive
                                    ? 'template-card__badge--active bg-green-600 text-white border-green-600 ring-2 ring-green-300 dark:bg-green-700 dark:border-green-700'
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
                                data-card-control
                                className={`template-card__badge template-card__badge--bodypart transition-all cursor-pointer text-xs py-0 px-1.5 h-5 ${isBodypartActive
                                    ? 'template-card__badge--active bg-blue-600 text-white border-blue-600 ring-2 ring-blue-300 dark:bg-blue-700 dark:border-blue-700'
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

            {(template.can_edit || template.can_delete) && (
                <CardContent className="template-card__footer mt-auto px-3 pb-3 pt-2">
                    {/* Acciones */}
                    <div className="template-card__actions grid grid-cols-2 gap-1.5 border-t border-gray-100 pt-2 dark:border-gray-700">
                    {template.can_edit && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(template)}
                            className={`template-card__action template-card__action--edit hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 transition-colors h-7 text-xs px-2 ${template.can_delete ? '' : 'col-span-2'}`}
                        >
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                        </Button>
                    )}

                    {template.can_delete && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDelete(template)}
                            className={`template-card__action template-card__action--delete hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors h-7 text-xs px-2 ${template.can_edit ? '' : 'col-span-2'}`}
                        >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Eliminar
                        </Button>
                    )}

                    {/* Botón de default personal: visible solo en plantillas propias del usuario */}
                    {template.can_edit && template.owner_id !== 'nextris' && onToggleUserDefault && (
                        <Button
                            variant="outline"
                            size="sm"
                            title={template.is_user_default ? 'Quitar como mi plantilla por defecto' : 'Establecer como mi plantilla por defecto'}
                            onClick={(e) => { e.stopPropagation(); onToggleUserDefault(template); }}
                            className={`template-card__action template-card__action--default col-span-2 h-7 text-xs px-2 transition-colors ${
                                template.is_user_default
                                    ? 'template-card__action--default-active bg-purple-50 text-purple-700 border-purple-300 hover:bg-purple-100'
                                    : 'hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300'
                            }`}
                        >
                            <Star className={`h-3 w-3 mr-1 ${template.is_user_default ? 'fill-purple-500' : ''}`} />
                            {template.is_user_default ? 'Mi plantilla por defecto' : 'Poner como mi defecto'}
                        </Button>
                    )}
                    </div>
                </CardContent>
            )}
                </Card>
            </TooltipTrigger>
            <TooltipContent
                side="top"
                sideOffset={10}
                className="table-scrollbar-purple z-[100] w-[min(34rem,calc(100vw-2rem))] max-h-[24rem] overflow-y-auto rounded-xl border border-purple-400 bg-white p-4 pr-3 text-gray-900 shadow-[0_16px_40px_rgba(88,28,135,0.28)] dark:border-purple-500 dark:bg-[#202328] dark:text-gray-100"
            >
                <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                        <FileText className="h-4 w-4 shrink-0 text-brand-purple dark:text-purple-400" />
                        <div className="min-w-0">
                            <p className="font-semibold leading-snug">{template.title}</p>
                            <p className="mt-0.5 text-xs font-normal text-gray-500 dark:text-gray-400">
                                {[
                                    template.study_type_description,
                                    template.modality_description,
                                    template.bodypart_description,
                                    template.report_type === 'inteligente' ? 'Informe inteligente' : 'Informe simple',
                                ].filter(Boolean).join(' · ')}
                            </p>
                        </div>
                    </div>
                    {template.technique && (
                        <section>
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-400">
                                Técnica
                            </p>
                            <RichTemplateContent content={template.technique} />
                        </section>
                    )}
                    {template.findings && (
                        <section>
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                Hallazgos
                            </p>
                            <RichTemplateContent content={template.findings} />
                        </section>
                    )}
                    {template.impression && (
                        <section>
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                                Impresión
                            </p>
                            <RichTemplateContent content={template.impression} />
                        </section>
                    )}
                    {template.conclusion && (
                        <section>
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                                Conclusión
                            </p>
                            <RichTemplateContent content={template.conclusion} />
                        </section>
                    )}
                    {template.structured_variables && (
                        <section>
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                                Variables estructuradas
                            </p>
                            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                                {stripHtmlTags(template.structured_variables)}
                            </p>
                        </section>
                    )}
                    {template.criteria && (
                        <section>
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-orange-600 dark:text-orange-400">
                                Criterios
                            </p>
                            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                                {stripHtmlTags(template.criteria)}
                            </p>
                        </section>
                    )}
                    {!template.technique && !template.findings && !template.impression && !template.conclusion && !template.structured_variables && !template.criteria && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Esta plantilla no tiene contenido para mostrar.
                        </p>
                    )}
                </div>
            </TooltipContent>
        </Tooltip>
    );
};
