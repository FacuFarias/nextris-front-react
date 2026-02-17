import { useState, useEffect } from "react";
import { Modal } from "@/components";
import { PrimaryButton, SecondaryButton } from "@/components";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search, MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLocations } from "../../locations/hooks/useLocations";
import { useInsuranceLocations } from "../hooks/use-obras-sociales";
import type { ObraSocial } from "../types/obras-sociales.types";
import { toast } from "sonner";

interface ApiErrorPayload {
    message?: string;
    missing_location_ids?: string[];
}

interface LocationAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    obraSocial: ObraSocial | null;
}

export const LocationAssignmentModal = ({
    isOpen,
    onClose,
    obraSocial,
}: LocationAssignmentModalProps) => {
    const { locations, isLoading: loadingLocations } = useLocations();
    const { assignedLocations, isLoading: loadingAssigned, setLocations, isSaving } =
        useInsuranceLocations(obraSocial?.guid || null);

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState("");

    // Inicializar seleccionados cuando llegan los datos
    useEffect(() => {
        if (assignedLocations?.data) {
            setSelectedIds(new Set(assignedLocations.data.map((loc) => loc.location_id)));
        }
    }, [assignedLocations]);

    // Limpiar búsqueda al abrir
    useEffect(() => {
        if (isOpen) setSearch("");
    }, [isOpen]);

    const allLocations = Array.isArray(locations?.data) ? locations.data : [];

    const filteredLocations = allLocations.filter((loc) =>
        loc.name.toLowerCase().includes(search.toLowerCase()) ||
        loc.description?.toLowerCase().includes(search.toLowerCase())
    );

    const handleToggle = (locationId: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(locationId)) {
                next.delete(locationId);
            } else {
                next.add(locationId);
            }
            return next;
        });
    };

    const handleSelectAll = () => {
        if (selectedIds.size === allLocations.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(allLocations.map((loc) => loc.guid)));
        }
    };

    const handleSave = () => {
        if (!obraSocial) return;
        setLocations(
            { insuranceId: obraSocial.guid, locationIds: Array.from(selectedIds) },
            {
                onSuccess: () => {
                    toast.success("Ubicaciones actualizadas exitosamente");
                    onClose();
                },
                onError: (error: unknown) => {
                    const responseData =
                        (error as { response?: { data?: ApiErrorPayload } })?.response?.data;

                    const message = responseData?.message || "Error al actualizar las ubicaciones";
                    const missingIds = responseData?.missing_location_ids;

                    if (Array.isArray(missingIds) && missingIds.length > 0) {
                        toast.error(`${message}: ${missingIds.join(", ")}`);
                        return;
                    }

                    toast.error(message);
                },
            }
        );
    };

    const isLoading = loadingLocations || loadingAssigned;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Ubicaciones - ${obraSocial?.description || ""}`}
            description="Seleccione las ubicaciones asociadas a esta obra social"
            size="lg"
        >
            <div className="space-y-4">
                {/* Buscador */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Buscar ubicacion..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {/* Seleccionar todo */}
                {!isLoading && allLocations.length > 0 && (
                    <div className="flex items-center gap-2 pb-2 border-b">
                        <Checkbox
                            id="select-all"
                            checked={selectedIds.size === allLocations.length}
                            onCheckedChange={handleSelectAll}
                        />
                        <Label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                            Seleccionar todas ({selectedIds.size}/{allLocations.length})
                        </Label>
                    </div>
                )}

                {/* Lista de locations */}
                <div className="max-h-[300px] overflow-y-auto space-y-1">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-20">
                            <Loader2 className="h-6 w-6 animate-spin text-brand-purple" />
                        </div>
                    ) : filteredLocations.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            {search ? "No se encontraron ubicaciones" : "No hay ubicaciones disponibles"}
                        </p>
                    ) : (
                        filteredLocations.map((location) => (
                            <div
                                key={location.guid}
                                className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer"
                                onClick={() => handleToggle(location.guid)}
                            >
                                <Checkbox
                                    checked={selectedIds.has(location.guid)}
                                    onCheckedChange={() => handleToggle(location.guid)}
                                />
                                <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{location.name}</p>
                                    {location.address && (
                                        <p className="text-xs text-muted-foreground truncate">{location.address}</p>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Botones */}
                <div className="flex gap-2 justify-end pt-2 border-t">
                    <SecondaryButton type="button" onClick={onClose} disabled={isSaving}>
                        Cancelar
                    </SecondaryButton>
                    <PrimaryButton onClick={handleSave} disabled={isSaving || isLoading}>
                        {isSaving ? "Guardando..." : "Guardar"}
                    </PrimaryButton>
                </div>
            </div>
        </Modal>
    );
};
