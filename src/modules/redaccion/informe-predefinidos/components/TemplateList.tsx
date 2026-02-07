import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Plus, Search, Loader2, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useTemplates, useDeleteTemplate } from "../hooks/use-templates";
import { TemplateCard } from "./TemplateCard";
import { TemplateDetailModal } from "./TemplateDetailModal";
import type { Template } from "../types/informe-pred.types";
/* import { useEstudiosPorModalidad } from "@/hooks/use-global"; */
import { PrimaryButton } from "@/components";
import { Autocomplete } from "@/components/autocomplete";
import { useTiposEstudio } from "@/modules/configuracion/configuracion-tablas/examenes/tipos-estudio";
import { useModalidades } from "@/modules/configuracion/configuracion-tablas/examenes/modalidades";
import { useBodyParts } from "@/modules/configuracion/configuracion-tablas/examenes/partes-cuerpo";
import { useNavigate } from "react-router-dom";

interface TemplateListProps {
    onSelect?: (template: Template) => void;
    onEdit?: (template: Template) => void;
    modalityId?: string;
    bodypartId?: string;
    onModalityClick?: (modalityId: string) => void;
    onBodypartClick?: (bodypartId: string) => void;
}

export const TemplateList = ({
    modalityId,
    bodypartId,
    onModalityClick,
    onBodypartClick
}: TemplateListProps) => {
    const [studyTypeFilter, setStudyTypeFilter] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const navigate = useNavigate();
    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6; // 3x3 grid
    const { tiposEstudio } = useTiposEstudio();
    const { modalidades } = useModalidades();
    const { bodyParts } = useBodyParts();

    // Hooks
    const { data, isLoading, isError, error } = useTemplates(
        studyTypeFilter || undefined,
        modalityId,
        bodypartId
    );
    /* const { data: estudios } = useEstudiosPorModalidad(); */
    const deleteMutation = useDeleteTemplate();
    // Filtrar plantillas por búsqueda local
    const filteredTemplates = data?.data?.filter((template) => {
        const searchLower = searchTerm.toLowerCase();
        return (
            template.title.toLowerCase().includes(searchLower) ||
            template.study_type_description?.toLowerCase().includes(searchLower) ||
            template.findings.toLowerCase().includes(searchLower)
        );
    }) || [];

    // Calcular paginación
    const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedTemplates = filteredTemplates.slice(startIndex, endIndex);
    // Preparar opciones para el Autocomplete
    const tiposEstudioOptions = useMemo(() => {
        if (!Array.isArray(tiposEstudio?.data)) return [];
        return tiposEstudio.data.map((estudio: any) => ({
            value: estudio.guid,
            label: estudio.description
        }));
    }, [tiposEstudio]);

    const modalidadesOptions = useMemo(() => {
        if (!Array.isArray(modalidades?.data)) return [];
        return modalidades.data.map((modalidad: any) => ({
            value: modalidad.guid,
            label: modalidad.description
        }));
    }, [modalidades]);

    const bodyPartsOptions = useMemo(() => {
        if (!Array.isArray(bodyParts?.data)) return [];
        return bodyParts.data.map((bodyPart: any) => ({
            value: bodyPart.guid,
            label: bodyPart.description
        }));
    }, [bodyParts]);

    // Resetear página cuando cambian los filtros
    const handleFilterChange = (value: string) => {
        setStudyTypeFilter(value);
        setCurrentPage(1);
    };

    const handleModalityFilterChange = (value: string) => {
        if (onModalityClick) {
            onModalityClick(value);
        }
        setCurrentPage(1);
    };

    const handleBodyPartFilterChange = (value: string) => {
        if (onBodypartClick) {
            onBodypartClick(value);
        }
        setCurrentPage(1);
    };

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    // Verificar si hay filtros activos
    const hasActiveFilters = searchTerm || studyTypeFilter || modalityId || bodypartId;

    // Limpiar todos los filtros
    const handleClearFilters = () => {
        setSearchTerm("");
        setStudyTypeFilter("");
        if (onModalityClick) onModalityClick("");
        if (onBodypartClick) onBodypartClick("");
        setCurrentPage(1);
    };

    // Handlers
    const handleView = (template: Template) => {
        setSelectedTemplate(template);
        setIsDetailModalOpen(true);
    };



    const handleEdit = (template: Template) => {
        // Navegar a la página de edición con el ID de la plantilla
        navigate(`/estudios/editar-informe/${template.guid}`);
    };

    const handleDelete = async (template: Template) => {
        if (window.confirm(`¿Estás seguro de eliminar la plantilla "${template.title}"?`)) {
            try {
                await deleteMutation.mutateAsync(template.guid);
            } catch (error) {
                console.error("Error al eliminar plantilla:", error);
            }
        }
    };

    if (isError) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">
                    Error al cargar plantillas: {error instanceof Error ? error.message : "Error desconocido"}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filtros y búsqueda */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Búsqueda */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Buscar plantillas..."
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Filtro por tipo de estudio */}
                <Autocomplete
                    options={tiposEstudioOptions}
                    value={studyTypeFilter}
                    onValueChange={handleFilterChange}
                    placeholder="Filtrar por tipo de estudio"
                    emptyMessage="No se encontraron tipos de estudio."
                    searchPlaceholder="Buscar tipo de estudio..."
                />

                {/* Filtro por modalidad */}
                <Autocomplete
                    options={modalidadesOptions}
                    value={modalityId || ""}
                    onValueChange={handleModalityFilterChange}
                    placeholder="Filtrar por modalidad"
                    emptyMessage="No se encontraron modalidades."
                    searchPlaceholder="Buscar modalidad..."
                />

                {/* Filtro por parte del cuerpo */}
                <Autocomplete
                    options={bodyPartsOptions}
                    value={bodypartId || ""}
                    onValueChange={handleBodyPartFilterChange}
                    placeholder="Filtrar por parte del cuerpo"
                    emptyMessage="No se encontraron partes del cuerpo."
                    searchPlaceholder="Buscar parte del cuerpo..."
                />

                {/* Botón crear nueva plantilla */}
                <PrimaryButton onClick={() => navigate("/estudios/crear-informe")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Plantilla
                </PrimaryButton>
            </div>

            {/* Botón para limpiar filtros */}
            {hasActiveFilters && (
                <div className="flex justify-end">
                    <Button
                        onClick={handleClearFilters}
                        variant="outline"
                        size="sm"
                        className="text-gray-600 hover:text-gray-900"
                    >
                        <X className="h-4 w-4 mr-2" />
                        Limpiar filtros
                    </Button>
                </div>
            )}

            {/* Grid de Cards */}
            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-brand-purple mx-auto mb-4" />
                        <p className="text-gray-600">Cargando plantillas...</p>
                    </div>
                </div>
            ) : filteredTemplates.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <div className="max-w-md mx-auto">
                        <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            No se encontraron plantillas
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {searchTerm || studyTypeFilter
                                ? "Intenta ajustar tus filtros de búsqueda"
                                : "Aún no hay plantillas creadas"}
                        </p>
                        {!searchTerm && !studyTypeFilter && (
                            <PrimaryButton onClick={() => navigate("/redaccion/crear-informe")}>
                                <Plus className="h-4 w-4 mr-2" />
                                Crear primera plantilla
                            </PrimaryButton>

                        )}
                    </div>
                </div>
            ) : (
                <>
                    {/* Grid de Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedTemplates.map((template, index) => (
                            <TemplateCard
                                key={template.guid}
                                template={template}
                                index={index}
                                onView={handleView}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onModalityClick={onModalityClick}
                                onBodypartClick={onBodypartClick}
                                isModalityActive={modalityId === template.modality_id}
                                isBodypartActive={bodypartId === template.bodypart_id}
                            />
                        ))}
                    </div>

                    {/* Paginación */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-end pt-6 border-t border-gray-200">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="gap-1"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Anterior
                                </Button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                        // Mostrar solo algunas páginas alrededor de la actual
                                        if (
                                            page === 1 ||
                                            page === totalPages ||
                                            (page >= currentPage - 1 && page <= currentPage + 1)
                                        ) {
                                            return (
                                                <Button
                                                    key={page}
                                                    variant={currentPage === page ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setCurrentPage(page)}
                                                    className={currentPage === page ? "bg-brand-purple hover:bg-brand-purple/90" : ""}
                                                >
                                                    {page}
                                                </Button>
                                            );
                                        } else if (
                                            page === currentPage - 2 ||
                                            page === currentPage + 2
                                        ) {
                                            return <span key={page} className="px-2">...</span>;
                                        }
                                        return null;
                                    })}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="gap-1"
                                >
                                    Siguiente
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Modal de detalles */}
            <TemplateDetailModal
                template={selectedTemplate}
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
            />
        </div>
    );
};
