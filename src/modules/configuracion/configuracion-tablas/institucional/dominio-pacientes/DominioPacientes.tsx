import { useState } from "react";
import TablaDynamic from "@/components/TableDynamic";
import { toast } from "sonner";
import { useDominioPacientes } from "./hooks/use-dominio-pacientes";
import { dominioPacienteColumns, getDominioPacienteActions } from "./components/columns";
import { DominioPacienteModal } from "./components/DominioPacienteModal";
import type { DominioPaciente, DominioPacienteFormData } from "./types/dominio-pacientes.types";

export const DominioPacientes = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selected, setSelected] = useState<DominioPaciente | null>(null);

    const { dominioPacientes, isLoading, createDominioPaciente, updateDominioPaciente } = useDominioPacientes();

    const handlePaginationChange = (newPage: number, newPageSize: number) => {
        setPage(newPage);
        setPageSize(newPageSize);
    };

    const handleOpenModal = (item?: DominioPaciente) => {
        setSelected(item || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelected(null);
    };

    const handleSubmit = (data: DominioPacienteFormData) => {
        if (selected) {
            updateDominioPaciente(
                { id: selected.guid, data },
                {
                    onSuccess: () => {
                        toast.success("Dominio actualizado exitosamente");
                        handleCloseModal();
                    },
                    onError: () => {
                        toast.error("Error al actualizar el dominio");
                    },
                }
            );
        } else {
            createDominioPaciente(data, {
                onSuccess: () => {
                    toast.success("Dominio creado exitosamente");
                    handleCloseModal();
                },
                onError: () => {
                    toast.error("Error al crear el dominio");
                },
            });
        }
    };

    const actions = getDominioPacienteActions(handleOpenModal);
    const data = Array.isArray(dominioPacientes?.data) ? dominioPacientes.data : [];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Dominio de Pacientes</h2>
                    <p className="text-muted-foreground">Gestion de dominios de pacientes</p>
                </div>
                <button
                    className="px-4 py-2 bg-brand-purple text-white rounded-md hover:bg-brand-purple/90"
                    onClick={() => handleOpenModal()}
                >
                    Nuevo Dominio
                </button>
            </div>

            <TablaDynamic
                data={data}
                columns={dominioPacienteColumns}
                showIndex
                actions={actions}
                loading={isLoading}
                pagination={{
                    page,
                    pageSize,
                    serverSide: false,
                    total: data.length,
                }}
                onPaginationChange={handlePaginationChange}
            />

            <DominioPacienteModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                initialData={
                    selected
                        ? {
                              description: selected.description,
                              externalcode: selected.externalcode ?? undefined,
                          }
                        : null
                }
                isLoading={false}
            />
        </div>
    );
};
