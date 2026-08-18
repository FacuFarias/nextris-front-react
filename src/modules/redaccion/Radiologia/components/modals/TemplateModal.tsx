import { Modal } from "@/components/Modal";
import { Input } from "@/components/ui/input";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SecondaryButton } from "@/components";
import { Search, ShieldCheck } from "lucide-react";
import type { Template } from "@/modules/redaccion/informe-predefinidos/types/informe-pred.types";

interface TemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    filteredTemplates: Template[];
    selectedTemplate: Template | null;
    setSelectedTemplate: (template: Template) => void;
    onAccept: () => void;
}

export const TemplateModal = ({
    isOpen,
    onClose,
    searchTerm,
    setSearchTerm,
    filteredTemplates,
    selectedTemplate,
    setSelectedTemplate,
    onAccept
}: TemplateModalProps) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Seleccionar informe predefinido"
            size="xxl"
        >
            <div className="space-y-4">
                {/* Filtros */}
                <div className="flex gap-4 items-center">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Buscar por tipo de estudio..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="w-64">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <input
                                type="checkbox"
                                className="rounded"
                            />
                            Mi tipo de estudio
                        </label>
                    </div>
                </div>

                {/* Lista de plantillas */}
                <div className="border rounded-lg max-h-[400px] overflow-y-auto">
                    {filteredTemplates.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No se encontraron plantillas
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filteredTemplates.map((template) => (
                                <div
                                    key={template.guid}
                                    className={`relative grid cursor-pointer grid-cols-1 gap-4 p-4 transition-all sm:grid-cols-2 ${selectedTemplate?.guid === template.guid
                                        ? 'bg-purple-100 border-2 border-brand-purple shadow-md'
                                        : 'hover:bg-gray-50 border-2 border-transparent'
                                        }`}
                                    onClick={() => setSelectedTemplate(template)}
                                >
                                    {selectedTemplate?.guid === template.guid && (
                                        <div className="absolute top-2 right-2 bg-brand-purple text-white rounded-full p-1">
                                            <ShieldCheck className="h-4 w-4" />
                                        </div>
                                    )}
                                    <div className={`font-medium ${selectedTemplate?.guid === template.guid ? 'text-brand-purple' : 'text-gray-700'}`}>
                                        {template.title}
                                    </div>
                                    <div className={`font-medium ${selectedTemplate?.guid === template.guid ? 'text-brand-purple' : 'text-gray-700'}`}>
                                        {template.study_type_description}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-2 justify-end">
                    <SecondaryButton onClick={onClose}>
                        Cancelar
                    </SecondaryButton>
                    <PrimaryButton
                        onClick={onAccept}
                        disabled={!selectedTemplate}
                    >
                        ACEPTAR
                    </PrimaryButton>
                </div>
            </div>
        </Modal>
    );
};
