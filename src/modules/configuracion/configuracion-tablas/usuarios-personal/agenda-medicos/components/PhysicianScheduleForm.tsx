import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PrimaryButton, SecondaryButton } from "@/components";
import type { PhysicianScheduleFormData } from "../types/physician-schedules.types";
import { useRequestingPhysicians } from "../../medicos-solicitantes/hooks/useRequestingPhysicians";
import { useLocations } from "../../../institucional/locations";
import { DateInput } from "@/components/ui/date-input";

interface PhysicianScheduleFormProps {
    onSubmit: (data: PhysicianScheduleFormData) => void;
    onCancel: () => void;
    initialData?: Partial<PhysicianScheduleFormData>;
    isLoading?: boolean;
}

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const;

export const PhysicianScheduleForm = ({
    onSubmit,
    onCancel,
    initialData,
    isLoading = false,
}: PhysicianScheduleFormProps) => {
    const { locations } = useLocations();
    const { physicians } = useRequestingPhysicians();

    const [formData, setFormData] = useState<PhysicianScheduleFormData>({
        physician_id: initialData?.physician_id || "",
        day: initialData?.day || "Lunes",
        time_from: initialData?.time_from || "",
        time_to: initialData?.time_to || "",
        init_day: initialData?.init_day || "",
        finish_day: initialData?.finish_day || "",
        location_id: initialData?.location_id || "",
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                physician_id: initialData.physician_id || "",
                day: initialData.day || "Lunes",
                time_from: initialData.time_from || "",
                time_to: initialData.time_to || "",
                init_day: initialData.init_day || "",
                finish_day: initialData.finish_day || "",
                location_id: initialData.location_id || "",
            });
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const handleChange = (field: keyof PhysicianScheduleFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1 w-full space-y-2">
                    <Label htmlFor="physician_id">
                        Médico <span className="text-red-500">*</span>
                    </Label>
                    <Select
                        value={formData.physician_id}
                        onValueChange={(value) => handleChange("physician_id", value)}
                        required
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccione médico" />
                        </SelectTrigger>
                        <SelectContent >
                            {physicians?.data?.map((physician) => (
                                <SelectItem key={physician.guid} value={physician.guid}>
                                    {physician.description}
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
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccione día" />
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
                        Hora Desde <span className="text-red-500">*</span>
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
                        Hora Hasta <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="time_to"
                        type="time"
                        value={formData.time_to}
                        onChange={(e) => handleChange("time_to", e.target.value)}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="init_day">Fecha Inicio</Label>
                    <DateInput
                        id="init_day"
                        value={formData.init_day}
                        onChange={(value) => handleChange("init_day", value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="finish_day">Fecha Fin</Label>
                    <DateInput
                        id="finish_day"
                        value={formData.finish_day}
                        onChange={(value) => handleChange("finish_day", value)}
                    />
                </div>

                <div className="col-span-2   space-y-2">
                    <Label htmlFor="location_id">Localización</Label>
                    <Select
                        value={formData.location_id}
                        onValueChange={(value) => handleChange("location_id", value)}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccione localización" />
                        </SelectTrigger>
                        <SelectContent >
                            {locations?.data?.map((location) => (
                                <SelectItem key={location.guid} value={location.guid}>
                                    {location.name}
                                </SelectItem>
                            ))}
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
