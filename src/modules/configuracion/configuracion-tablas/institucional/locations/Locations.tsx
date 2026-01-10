import TablaDynamic from "@/components/TableDynamic";
import { useLocations } from "./hooks/useLocations";
import { useState } from "react";
import { getLocationActions, locationColumns } from "./components/columns";
import { PrimaryButton } from "@/components";
import { LocationModal } from "./components/LocationModal";
import type { LocationFormData } from "./types/locations.types";
import { toast } from "sonner";

export const Locations = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<any>(null);

    const { locations, isLoading, createLocation, updateLocation } = useLocations();

    const handleOpenModal = (location?: any) => {
        setSelectedLocation(location || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedLocation(null);
    };

    const handleSubmit = (data: LocationFormData) => {
        if (selectedLocation) {
            // Actualizar
            updateLocation(
                { id: selectedLocation.guid, data },
                {
                    onSuccess: () => {
                        toast.success("Location actualizada exitosamente");
                        handleCloseModal();
                    },
                    onError: () => {
                        toast.error("Error al actualizar la location");
                    },
                }
            );
        } else {
            // Crear
            createLocation(data, {
                onSuccess: () => {
                    toast.success("Location creada exitosamente");
                    handleCloseModal();
                },
                onError: () => {
                    toast.error("Error al crear la location");
                },
            });
        }
    };

    const handlePaginationChange = (newPage: number, newPageSize: number) => {
        setPage(newPage);
        setPageSize(newPageSize);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">UBICACIONES</h2>
                    <p className="text-muted-foreground">Gestión de ubicaciones</p>
                </div>
                <PrimaryButton onClick={() => handleOpenModal()}>
                    Nueva Location
                </PrimaryButton>
            </div>

            {isLoading ? (
                <div className='flex justify-center items-center h-40'>
                    <span className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500'></span>
                </div>
            ) : (
                <TablaDynamic
                    data={locations?.data || []}
                    columns={locationColumns}
                    showIndex
                    actions={getLocationActions((location) => handleOpenModal(location))}
                    pagination={{
                        page,
                        pageSize,
                        serverSide: false,
                        total: locations?.data.length || 0,
                    }}
                    onPaginationChange={handlePaginationChange}
                />
            )}

            {/* Modal de Crear/Editar */}
            <LocationModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                initialData={selectedLocation ? {
                    name: selectedLocation.name,
                    facility_id: selectedLocation.facility_id,
                    status: selectedLocation.status,
                    address: selectedLocation.address,
                    city: selectedLocation.city,
                    state: selectedLocation.state,
                    zip_code: selectedLocation.zip_code,
                    country: selectedLocation.country,
                    phone: selectedLocation.phone,
                    email: selectedLocation.email,
                    timezone: selectedLocation.timezone,
                } : undefined}
                isLoading={false}
            />
        </div>
    )
}
