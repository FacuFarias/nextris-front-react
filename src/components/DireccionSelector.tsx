import { MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocationsInstitutional } from "@/hooks/use-locations";

interface DireccionSelectorProps {
    selectedDireccion: string;
    onDireccionChange: (direccionId: string) => void;
    isPending?: boolean;
}

export const DireccionSelector = ({
    selectedDireccion,
    onDireccionChange,
    isPending = false,
}: DireccionSelectorProps) => {
    const { data: locationsData } = useLocationsInstitutional();

    return (
        <div className="bg-brand-purple rounded-lg p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-white/20 p-2 rounded-lg">
                    <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 className="text-white font-bold text-lg">Seleccione una Dirección</h3>
                </div>
            </div>
            <Select
                onValueChange={onDireccionChange}
                value={selectedDireccion}
                disabled={isPending}
            >
                <SelectTrigger className="w-full bg-white border-2 border-white hover:border-purple-200 focus:border-white focus:ring-2 focus:ring-white/50 text-base font-medium py-6 cursor-pointer shadow-md">
                    <SelectValue placeholder={isPending ? "Cargando direcciones..." : "Seleccione una dirección para comenzar"} />
                </SelectTrigger>
                <SelectContent>
                    {locationsData?.data?.map((location: any) => (
                        <SelectItem key={location.guid} value={location.guid} className="text-base py-3">
                            {location.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};
