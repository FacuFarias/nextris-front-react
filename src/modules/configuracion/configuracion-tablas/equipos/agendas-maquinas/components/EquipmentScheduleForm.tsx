import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PrimaryButton, SecondaryButton } from "@/components";
import type { EquipmentScheduleFormData } from "../types/equipment-schedules.types";
import { useEquipment } from "../../maquinas/hooks/useEquipment";

interface EquipmentScheduleFormProps {
    onSubmit: (data: EquipmentScheduleFormData) => void;
    onCancel: () => void;
    initialData?: Partial<EquipmentScheduleFormData>;
    isLoading?: boolean;
}

const DAYS = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo"
];

export const EquipmentScheduleForm = ({
    onSubmit,
    onCancel,
    initialData,
    isLoading = false,
}: EquipmentScheduleFormProps) => {
    const [formData, setFormData] = useState<EquipmentScheduleFormData>({
        equipment_id: initialData?.equipment_id || "",
        day: initialData?.day || "",
        time_from: initialData?.time_from || "",
        time_to: initialData?.time_to || "",
    });

    const { equipment } = useEquipment();

    useEffect(() => {
        if (initialData) {
            setFormData({
                equipment_id: initialData.equipment_id || "",
                day: initialData.day || "",
                time_from: initialData.time_from || "",
                time_to: initialData.time_to || "",
            });
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const handleChange = (field: keyof EquipmentScheduleFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                    <Label htmlFor="equipment_id">
                        Máquina <span className="text-red-500">*</span>
                    </Label>
                    <Select
                        value={formData.equipment_id}
                        onValueChange={(value) => handleChange("equipment_id", value)}
                        required
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccione una máquina" />
                        </SelectTrigger>
                        <SelectContent>
                            {equipment?.data?.map((equip) => (
                                <SelectItem key={equip.guid} value={equip.guid}>
                                    {equip.description}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="col-span-2 space-y-2">
                    <Label htmlFor="day">
                        Día <span className="text-red-500">*</span>
                    </Label>
                    <Select
                        value={formData.day}
                        onValueChange={(value) => handleChange("day", value)}
                        required
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccione un día" />
                        </SelectTrigger>
                        <SelectContent>
                            {DAYS.map((day) => (
                                <SelectItem key={day} value={day}>
                                    {day}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="time_from">
                        Hora Inicio <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="time_from"
                        type="time"
                        value={formData.time_from}
                        onChange={(e) => handleChange("time_from", e.target.value)}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="time_to">
                        Hora Fin <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="time_to"
                        type="time"
                        value={formData.time_to}
                        onChange={(e) => handleChange("time_to", e.target.value)}
                        required
                    />
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
