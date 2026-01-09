import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PrimaryButton, SecondaryButton } from "@/components";
import type { EquipmentFormData } from "../types/equipment.types";
import { useLocations } from "../../../institucional/locations/hooks/useLocations";
import { useModalidades } from "../../../examenes/modalidades";

interface EquipmentFormProps {
    onSubmit: (data: EquipmentFormData) => void;
    onCancel: () => void;
    initialData?: Partial<EquipmentFormData>;
    isLoading?: boolean;
}

export const EquipmentForm = ({
    onSubmit,
    onCancel,
    initialData,
    isLoading = false,
}: EquipmentFormProps) => {
    const [formData, setFormData] = useState<EquipmentFormData>({
        description: initialData?.description || "",
        modality_id: initialData?.modality_id || "",
        location_id: initialData?.location_id || "",
        aetitle: initialData?.aetitle || "",
        ip: initialData?.ip || "",
        port: initialData?.port || undefined,
        status: initialData?.status || "active",
    });

    const { modalidades } = useModalidades();
    const { locations } = useLocations();

    useEffect(() => {
        if (initialData) {
            setFormData({
                description: initialData.description || "",
                modality_id: initialData.modality_id || "",
                location_id: initialData.location_id || "",
                aetitle: initialData.aetitle || "",
                ip: initialData.ip || "",
                port: initialData.port || undefined,
                status: initialData.status || "active",
            });
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const handleChange = (field: keyof EquipmentFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                    <Label htmlFor="description">
                        Descripción <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleChange("description", e.target.value)}
                        placeholder="Ej: Tomógrafo Siemens"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="modality_id">
                        Modalidad <span className="text-red-500">*</span>
                    </Label>
                    <Select
                        value={formData.modality_id}
                        onValueChange={(value) => handleChange("modality_id", value)}
                        required
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccione modalidad" />
                        </SelectTrigger>
                        <SelectContent>
                            {modalidades?.data?.map((modality) => (
                                <SelectItem key={modality.guid} value={modality.guid}>
                                    {modality.description}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="location_id">Ubicación</Label>
                    <Select
                        value={formData.location_id}
                        onValueChange={(value) => handleChange("location_id", value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccione ubicación" />
                        </SelectTrigger>
                        <SelectContent>
                            {locations?.data?.map((location) => (
                                <SelectItem key={location.guid} value={location.guid}>
                                    {location.description}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="aetitle">AE Title</Label>
                    <Input
                        id="aetitle"
                        value={formData.aetitle}
                        onChange={(e) => handleChange("aetitle", e.target.value)}
                        placeholder="Ej: CT_SIEMENS_01"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="ip">Dirección IP</Label>
                    <Input
                        id="ip"
                        value={formData.ip}
                        onChange={(e) => handleChange("ip", e.target.value)}
                        placeholder="Ej: 192.168.1.100"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="port">Puerto</Label>
                    <Input
                        id="port"
                        type="number"
                        value={formData.port || ""}
                        onChange={(e) => handleChange("port", e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="Ej: 104"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="status">Estado</Label>
                    <Select
                        value={formData.status}
                        onValueChange={(value) => handleChange("status", value)}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Activo</SelectItem>
                            <SelectItem value="inactive">Inactivo</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
                <SecondaryButton type="button" onClick={onCancel} disabled={isLoading}>
                    Cancelar
                </SecondaryButton>
                <PrimaryButton type="submit" disabled={isLoading}>
                    {isLoading ? "Guardando..." : "Guardar"}
                </PrimaryButton>
            </div>
        </form>
    );
};
