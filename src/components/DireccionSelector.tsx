import { useEffect } from "react";
import { MapPin, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocationsInstitutional } from "@/hooks/use-locations";
import { Button } from "@/components/ui/button";

interface DireccionSelectorProps {
    selectedDireccion: string;
    onDireccionChange: (direccionId: string) => void;
    isPending?: boolean;
    isRow?: boolean;
}

export const DireccionSelector = ({
    selectedDireccion,
    onDireccionChange,
    isPending = false,
    isRow = false,
}: DireccionSelectorProps) => {
    const { data: locationsData } = useLocationsInstitutional();

    // Seleccionar automáticamente si solo hay una ubicación
    useEffect(() => {
        if (locationsData?.data?.length === 1 && !selectedDireccion) {
            onDireccionChange(locationsData.data[0].guid);
        }
    }, [locationsData, selectedDireccion, onDireccionChange]);

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDireccionChange("");
    };

    return (
        <div className={`bg-brand-purple rounded-lg p-4 shadow-lg ${isRow ? 'flex items-center gap-10' : ''}`}>
            <div className={`flex items-center gap-3  ${isRow ? '' : 'mb-4'}`}>
                <div className="bg-white/20 p-2 rounded-lg">
                    <MapPin className="w-4 h-4 text-white" />
                </div>
                <div>
                    <h3 className="text-white font-bold text-lg">Seleccione una Ubicación</h3>
                </div>
            </div>
            <div className={`relative ${isRow ? 'flex-1' : ''}`}>
                <Select
                    onValueChange={onDireccionChange}
                    value={selectedDireccion}
                    disabled={isPending}
                >
                    <SelectTrigger className="w-full bg-white border-2 border-white hover:border-purple-200 focus:border-white focus:ring-2 focus:ring-white/50 text-base font-medium py-5 cursor-pointer shadow-md pr-20">
                        <SelectValue placeholder={isPending ? "Cargando direcciones..." : "Seleccione una dirección para comenzar"} />
                    </SelectTrigger>
                    <SelectContent>
                        {locationsData?.data?.map((location: any) => (
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