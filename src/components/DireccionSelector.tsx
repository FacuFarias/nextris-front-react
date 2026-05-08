import { useEffect } from "react";
import { MapPin, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocationsInstitutional } from "@/hooks/use-locations";
import { Button } from "@/components/ui/button";
import { TablaDynamic } from "@/components/TableDynamic";
import type { TableColumn } from "@/types/table";

interface DireccionSelectorProps {
    selectedDireccion: string;
    onDireccionChange: (direccionId: string) => void;
    isPending?: boolean;
    isRow?: boolean;
    includeAllOption?: boolean;
    facilityId?: string;
}

type Location = { guid: string; name: string; [key: string]: any };

const locationColumns: TableColumn<Location>[] = [
    { key: "name", label: "Nombre", sortable: true },
];

export const DireccionSelector = ({
    selectedDireccion,
    onDireccionChange,
    isPending = false,
    isRow = false,
    includeAllOption = false,
    facilityId,
}: DireccionSelectorProps) => {
    const { data: locationsData, isLoading } = useLocationsInstitutional();

    const allLocations: Location[] = locationsData?.data ?? [];
    const locations: Location[] = facilityId
        ? allLocations.filter((location) => String(location?.facility_id || "") === facilityId)
        : allLocations;

    // Seleccionar automáticamente si solo hay una ubicación
    useEffect(() => {
        if (locations.length === 1 && selectedDireccion !== locations[0].guid) {
            onDireccionChange(locations[0].guid);
            return;
        }

        // Si cambia la institución y la ubicación actual ya no pertenece al filtro, limpiar.
        if (selectedDireccion && locations.length > 0 && !locations.some((location) => location.guid === selectedDireccion)) {
            onDireccionChange("");
        }
    }, [locations, selectedDireccion, onDireccionChange]);

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDireccionChange("");
    };

    const selectedLocation = locations.find((l) => l.guid === selectedDireccion) ?? null;

    if (!isRow) {
        return (
            <div className="bg-card dark:bg-[#1a1b24]/80 rounded-lg border border-blue-100 dark:border-blue-500/20 p-4">
                <div className="flex items-center gap-2 mb-4">
                    <div className="bg-blue-600 dark:bg-gradient-to-br dark:from-blue-500 dark:to-blue-800 p-2 rounded-lg dark:shadow-[0_0_12px_rgba(59,130,246,0.45)]">
                        <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-blue-700 dark:text-blue-300 font-semibold text-base">Seleccione una Ubicación</h3>
                </div>
                <TablaDynamic<Location>
                    data={locations}
                    columns={locationColumns}
                    loading={isLoading || isPending}
                    rowIdKey="guid"
                    selectedRow={selectedLocation}
                    onRowClick={(location) => onDireccionChange(location.guid)}
                    emptyMessage="No hay ubicaciones disponibles."
                />
            </div>
        );
    }

    return (
        <div className="bg-card dark:bg-[#141a2a]/90 rounded-lg p-4 shadow-lg border border-blue-200/60 dark:border-blue-500/30 flex items-center gap-10">
            <div className="flex items-center gap-3">
                <div className="bg-blue-100/80 dark:bg-blue-500/20 p-2 rounded-lg">
                    <MapPin className="w-4 h-4 text-blue-700 dark:text-blue-300" />
                </div>
                <div>
                    <h3 className="text-blue-700 dark:text-blue-300 font-bold text-lg">Seleccione una Ubicación</h3>
                </div>
            </div>
            <div className="relative flex-1">
                <Select
                    onValueChange={onDireccionChange}
                    value={selectedDireccion}
                    disabled={isPending}
                >
                    <SelectTrigger className="w-full bg-white dark:bg-[#0f1628] border-2 border-blue-200 dark:border-blue-500/40 hover:border-blue-300 dark:hover:border-blue-400 focus:border-blue-400 dark:focus:border-blue-300 focus:ring-2 focus:ring-blue-200/60 dark:focus:ring-blue-500/30 text-base font-medium py-5 cursor-pointer shadow-md pr-20">
                        <SelectValue placeholder={isPending ? "Cargando direcciones..." : "Seleccione una dirección para comenzar"} />
                    </SelectTrigger>
                    <SelectContent>
                        {includeAllOption && (
                            <SelectItem value="all" className="text-sm py-2 font-semibold">
                                Todas las ubicaciones
                            </SelectItem>
                        )}
                        {locations.map((location) => (
                            <SelectItem key={location.guid} value={location.guid} className="text-sm py-2">
                                {location.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {selectedDireccion && !isPending && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleClear}
                        className="absolute right-10 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors"
                        aria-label="Limpiar selección"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
};