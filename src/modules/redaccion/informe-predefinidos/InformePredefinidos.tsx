import { useState } from "react";
import { MainLayout } from "@/layouts/layout"
import { FileText } from "lucide-react"
import { TemplateList } from "./components/TemplateList"
import type { Template } from "./types/informe-pred.types"

const getStoredRelationFilter = (key: "modalityId" | "bodypartId") => {
    try {
        const filters = JSON.parse(sessionStorage.getItem("informe-predefinidos-filters") || "{}");
        return filters[key] || undefined;
    } catch {
        return undefined;
    }
};

export const InformePredefinidos = () => {
    const [modalityId, setModalityId] = useState<string | undefined>(() => getStoredRelationFilter("modalityId"));
    const [bodypartId, setBodypartId] = useState<string | undefined>(() => getStoredRelationFilter("bodypartId"));

    // Handlers
    const handleSelectTemplate = (template: Template) => {
        console.log("Plantilla seleccionada:", template);
        // Aquí podrías navegar a otra vista o abrir un modal
    };

    const handleEditTemplate = (template: Template) => {
        console.log("Editar plantilla:", template);
        // Aquí podrías abrir un modal de edición
    };

    const handleModalityClick = (clickedModalityId: string) => {
        // Si el valor está vacío (cleared desde el autocomplete), deseleccionamos
        if (!clickedModalityId) {
            setModalityId(undefined);
            return;
        }
        // Si ya está seleccionado, lo deseleccionamos
        if (modalityId === clickedModalityId) {
            setModalityId(undefined);
        } else {
            setModalityId(clickedModalityId);
        }
    };

    const handleBodypartClick = (clickedBodypartId: string) => {
        // Si el valor está vacío (cleared desde el autocomplete), deseleccionamos
        if (!clickedBodypartId) {
            setBodypartId(undefined);
            return;
        }
        // Si ya está seleccionado, lo deseleccionamos
        if (bodypartId === clickedBodypartId) {
            setBodypartId(undefined);
        } else {
            setBodypartId(clickedBodypartId);
        }
    };
    return (
        <MainLayout isOverflow={false}>
            <div className="page-dark-gradient rounded-lg p-3 sm:p-6 shadow-sm h-full flex flex-col">
                {/* Header */}
                <div className="mb-4 sm:mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-brand-purple p-2.5 rounded-lg">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-brand-purple dark:text-purple-400 sm:text-2xl">Plantillas de Informes</h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                        Gestiona las plantillas predefinidas para agilizar la redacción de informes médicos
                    </p>
                </div>

                {/* Lista de plantillas */}
                <div className="min-h-0 flex-1">
                    <TemplateList
                        onSelect={handleSelectTemplate}
                        onEdit={handleEditTemplate}
                        modalityId={modalityId}
                        bodypartId={bodypartId}
                        onModalityClick={handleModalityClick}
                        onBodypartClick={handleBodypartClick}
                    />
                </div>
            </div>
        </MainLayout>
    )
}
