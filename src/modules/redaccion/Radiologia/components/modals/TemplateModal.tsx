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
    hasStudyType: boolean;
    onlyStudyType: boolean;
    setOnlyStudyType: (value: boolean) => void;
    isLoading: boolean;
    hasError: boolean;
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
    hasStudyType,
    onlyStudyType,
    setOnlyStudyType,
    isLoading,
    hasError,
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
                <div className="flex flex-col gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Buscar por título o tipo de estudio..."
                            aria-label="Buscar informes predefinidos"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div role="group" aria-label="Filtrar informes predefinidos" className="flex flex-wrap gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
                        <button
                            type="button"
                            aria-pressed={!onlyStudyType}
                            onClick={() => setOnlyStudyType(false)}
                            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple ${!onlyStudyType
                                ? 'bg-brand-purple text-white shadow-sm'
                                : 'text-gray-700 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700'}`}
                        >
                            Mostrar todo
                        </button>
                        <button
                            type="button"
                            aria-pressed={onlyStudyType}
                            disabled={!hasStudyType}
                            onClick={() => setOnlyStudyType(true)}
                            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple disabled:cursor-not-allowed disabled:opacity-50 ${onlyStudyType
                                ? 'bg-brand-purple text-white shadow-sm'
                                : 'text-gray-700 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700'}`}
                        >
                            Solo este tipo de estudio
                        </button>
                    </div>
                    {!hasStudyType && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Este estudio no tiene un tipo asignado. Se muestran todos los informes predefinidos.
                        </p>
                    )}
                </div>

                {/* Lista de plantillas */}
                <div className="border rounded-lg max-h-[400px] overflow-y-auto" aria-busy={isLoading}>
                    {isLoading ? (
                        <div role="status" className="p-8 text-center text-gray-500">
                            Cargando informes predefinidos...
                        </div>
                    ) : hasError ? (
                        <div role="alert" className="p-8 text-center text-red-600">
                            No se pudieron cargar los informes predefinidos. Intente nuevamente.
                        </div>
                    ) : filteredTemplates.length === 0 ? (
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
                        disabled={isLoading || hasError || !selectedTemplate || !filteredTemplates.some((template) => template.guid === selectedTemplate.guid)}
                    >
                        ACEPTAR
                    </PrimaryButton>
                </div>
            </div>
        </Modal>
    );
};
