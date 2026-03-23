
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
        <Modal isOpen={isOpen} onClose={onClose} title={`${template.study_type_description}`} description={template.title}>
            <div className="space-y-6 mt-4">
                <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Tipo de informe</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-700 whitespace-pre-wrap">
                            {template.report_type === 'inteligente' ? 'Inteligente' : 'Simple'}
                        </p>
                    </div>
                </div>

                {/* Técnica */}
                {template.technique && (
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Técnica</h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-gray-700 whitespace-pre-wrap">{stripHtmlTags(template.technique)}</p>
                        </div>
                    </div>
                )}

                {/* Hallazgos */}
                {template.findings && (
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Hallazgos</h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-gray-700 whitespace-pre-wrap">{stripHtmlTags(template.findings)}</p>
                        </div>
                    </div>
                )}

                {/* Impresión */}
                {template.impression && (
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Impresión</h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-gray-700 whitespace-pre-wrap">{stripHtmlTags(template.impression)}</p>
                        </div>
                    </div>
                )}

                {/* Conclusión */}
                {template.conclusion && (
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Conclusión</h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-gray-700 whitespace-pre-wrap">{stripHtmlTags(template.conclusion)}</p>
                        </div>
                    </div>
                )}
            </div>
        </Modal>



    );
};
