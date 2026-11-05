import { useState, useCallback } from "react";
import { Modal, PrimaryButton, SecondaryButton } from "@/components";
import TablaDynamic from "@/components/TableDynamic";
import type { TableColumn } from "@/types/table";
import type { StudyType } from "../types/detalle-ejecucion.type";

interface StudyTypeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (studyType: StudyType) => void;
    studyTypes: StudyType[];
    isLoading?: boolean;
    currentStudyTypeId?: string | null;
}

const studyTypeColumns: TableColumn<StudyType>[] = [
    {
        key: "code",
        label: "CÓDIGO",
        className: "font-medium",
        headerClassName: "w-[120px]",
        sortable: true,
        filterable: true,
    },
    {
        key: "description",
        label: "DESCRIPCIÓN",
        className: "font-medium",
        sortable: true,
        filterable: true,
    },
    {
        key: "modality",
        label: "MODALIDAD",
        className: "font-medium",
        headerClassName: "w-[120px]",
        sortable: true,
        filterable: true,
    },
    {
        key: "bodypart",
        label: "PARTE DEL CUERPO",
        className: "font-medium",
        headerClassName: "w-[150px]",
        sortable: true,
        filterable: true,
    },
];

export const StudyTypeModal = ({
    isOpen,
    onClose,
    onSelect,
    studyTypes,
    isLoading = false,
    currentStudyTypeId,
}: StudyTypeModalProps) => {
    const [selectedStudyType, setSelectedStudyType] = useState<StudyType | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [sortColumn, setSortColumn] = useState("");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

    const handleSelectRow = (studyType: StudyType) => {
        setSelectedStudyType(studyType);
    };

    const handleConfirm = () => {
        if (selectedStudyType) {
            onSelect(selectedStudyType);
            setSelectedStudyType(null);
        }
    };

    const handleClose = () => {
        setSelectedStudyType(null);
        setSortColumn("");
        setSortDirection("asc");
        setPage(1);
        onClose();
    };

    const handleSortChange = useCallback((column: string, direction: "asc" | "desc") => {
        setSortColumn(column);
        setSortDirection(direction);
        setPage(1);
    }, []);

    const handlePaginationChange = (newPage: number, newPageSize: number) => {
        setPage(newPage);
        setPageSize(newPageSize);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Seleccionar Tipo de Estudio"
            description="Seleccione el tipo de estudio para este examen"
            size="xl"
            className="!w-fit !max-w-[900px]"
            contentClassName="flex flex-col max-h-[70vh]"
        >
            <div className="flex flex-col flex-1 min-h-0 space-y-4">
                {/* Tabla de tipos de estudio con scroll interno */}
                <TablaDynamic<StudyType>
                    data={studyTypes}
                    columns={studyTypeColumns}
                    showIndex
                    loading={isLoading}
                    onRowClick={handleSelectRow}
                    selectedRow={selectedStudyType ?? studyTypes.find((studyType) => studyType.guid === currentStudyTypeId) ?? null}
                    rowIdKey="guid"
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSortChange={handleSortChange}
                    className="flex-1 min-h-0"
                    maxHeight="100%"
                    pagination={{
                        page,
                        pageSize,
                        serverSide: false,
                        total: studyTypes.length,
                    }}
                    onPaginationChange={handlePaginationChange}
                    perPageValue={pageSize}
                    onPerPageChange={(value) => {
                        setPageSize(value);
                        setPage(1);
                    }}
                    perPageOptions={[20, 50, 100]}
                    emptyMessage="No se encontraron tipos de estudio"
                />

                {/* Información de selección */}
                {selectedStudyType && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 px-1">
                        Seleccionado: <span className="font-medium text-brand-purple">{selectedStudyType.description}</span>
                    </div>
                )}

                {/* Botones de acción */}
                <div className="flex justify-end gap-3 pt-2 border-t">
                    <SecondaryButton
                        type="button"
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        Cancelar
                    </SecondaryButton>
                    <PrimaryButton
                        type="button"
                        onClick={handleConfirm}
                        disabled={!selectedStudyType || isLoading}
                    >
                        Seleccionar
                    </PrimaryButton>
                </div>
            </div>
        </Modal>
    );
};
