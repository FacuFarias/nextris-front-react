import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { Template } from "../types/informe-pred.types";

interface TemplateDetailModalProps {
    template: Template | null;
    isOpen: boolean;
    onClose: () => void;
}

export const TemplateDetailModal = ({ template, isOpen, onClose }: TemplateDetailModalProps) => {
    if (!template) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl text-brand-purple">
                        {template.title}
                    </DialogTitle>
                    <DialogDescription>
                        <Badge variant="outline" className="mt-2">
                            {template.study_type_description || "Sin tipo de estudio"}
                        </Badge>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Técnica */}
                    {template.technique && (
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Técnica</h3>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-gray-700 whitespace-pre-wrap">{template.technique}</p>
                            </div>
                        </div>
                    )}

                    {/* Hallazgos */}
                    {template.findings && (
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Hallazgos</h3>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-gray-700 whitespace-pre-wrap">{template.findings}</p>
                            </div>
                        </div>
                    )}

                    {/* Impresión */}
                    {template.impression && (
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Impresión</h3>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-gray-700 whitespace-pre-wrap">{template.impression}</p>
                            </div>
                        </div>
                    )}

                    {/* Conclusión */}
                    {template.conclusion && (
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Conclusión</h3>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-gray-700 whitespace-pre-wrap">{template.conclusion}</p>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
