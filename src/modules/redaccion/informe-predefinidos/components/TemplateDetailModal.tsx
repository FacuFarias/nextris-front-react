
import type { Template } from "../types/informe-pred.types";
import { Modal } from "@/components";
import { stripHtmlTags } from "@/lib/utils";

interface TemplateDetailModalProps {
    template: Template | null;
    isOpen: boolean;
    onClose: () => void;
}

export const TemplateDetailModal = ({ template, isOpen, onClose }: TemplateDetailModalProps) => {
    if (!template) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${template.study_type_description}`} description={template.title} size="xxl" className="sm:max-w-3xl">
            <div className="space-y-4 mt-4 max-h-[65vh] overflow-y-auto pr-1">
                <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Tipo de informe</h3>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {template.report_type === 'inteligente' ? 'Inteligente' : 'Simple'}
                        </p>
                    </div>
                </div>

                {/* Razón del estudio */}
                {template.study_reason && (
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Razón del estudio</h3>
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{stripHtmlTags(template.study_reason)}</p>
                        </div>
                    </div>
                )}

                {/* Contenido */}
                {template.content && (
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Contenido</h3>
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{stripHtmlTags(template.content)}</p>
                        </div>
                    </div>
                )}

                {/* Conclusión */}
                {template.conclusion && (
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Conclusión</h3>
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{stripHtmlTags(template.conclusion)}</p>
                        </div>
                    </div>
                )}
            </div>
        </Modal>



    );
};
