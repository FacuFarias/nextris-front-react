import TablaDynamic from "@/components/TableDynamic";
import { useLocations } from "./hooks/useLocations";
import { useState } from "react";
import { getLocationActions, locationColumns } from "./components/columns";
import { PrimaryButton } from "@/components";
import { LocationModal } from "./components/LocationModal";
import type { Location, LocationFormData } from "./types/locations.types";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

const isInactiveLocation = (status?: string): boolean =>
    String(status || "").trim().toLowerCase() === "inactive";

export const Locations = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [includeInactive, setIncludeInactive] = useState(false);

    const {
        locations,
        isLoading,
        createLocation,
        updateLocation,
        activateLocation,
        deactivateLocation,
    } = useLocations(includeInactive);

    const handleOpenModal = (location?: Location) => {
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
            const createPayload: LocationFormData = { ...data };
            delete createPayload.logo;
            delete createPayload.logo_path;
            createLocation(createPayload, {
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

    const handleActivate = (location: Location) => {
        activateLocation(location.guid, {
            onSuccess: () => {
                toast.success("Location activada exitosamente");
            },
            onError: (error: any) => {
                toast.error(error?.response?.data?.message || "Error al activar la location");
            },
        });
    };

    const handleDeactivate = (location: Location) => {
        if (!confirm(`¿Desea desactivar la location ${location.name}?`)) {
            return;
        }

        deactivateLocation(location.guid, {
            onSuccess: () => {
                toast.success("Location desactivada exitosamente");
            },
            onError: (error: any) => {
                toast.error(error?.response?.data?.message || "Error al desactivar la location");
            },
        });
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
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Checkbox
                            checked={includeInactive}
                            onCheckedChange={(checked) => setIncludeInactive(Boolean(checked))}
                        />
                        Ver inactivas
                    </label>
                    <PrimaryButton onClick={() => handleOpenModal()}>
                        Nueva Location
                    </PrimaryButton>
                </div>
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
                    actions={getLocationActions(
                        (location) => handleOpenModal(location),
                        (location) => handleActivate(location),
                        (location) => handleDeactivate(location)
                    )}
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
                    code: selectedLocation.code,
                    facility_id: selectedLocation.facility_id,
                    status: isInactiveLocation(selectedLocation.status) ? "Inactive" : "Active",
                    address: selectedLocation.address,
                    city: selectedLocation.city,
                    state: selectedLocation.state,
                    zip_code: selectedLocation.zip_code,
                    country: selectedLocation.country,
                    phone: selectedLocation.phone,
                    email: selectedLocation.email || selectedLocation.mail,
                    timezone: selectedLocation.timezone,
                    logo_path: selectedLocation.logo_path,
                    gateway_aet: selectedLocation.gateway_aet,
                    gateway_ip: selectedLocation.gateway_ip,
                    transmission_type: selectedLocation.transmission_type,
                    retention_days: selectedLocation.retention_days,
                } : undefined}
                isLoading={false}
            />
        </div>
    )
}
