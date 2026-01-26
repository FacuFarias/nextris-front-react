import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PrimaryButton, SecondaryButton } from "@/components";
import type { TipoEstudioFormData } from "../types/tipos-estudio.types";
import { useModalidades } from "../../modalidades/hooks/useModalidades";
import { useBodyParts } from "../../partes-cuerpo/hooks/useBodyParts";
import { useGrupoEstudio } from "../../grupos-estudio";

interface TipoEstudioFormProps {
    onSubmit: (data: TipoEstudioFormData) => void;
    onCancel: () => void;
    initialData?: Partial<TipoEstudioFormData>;
    isLoading?: boolean;
}

export const TipoEstudioForm = ({
    onSubmit,
    onCancel,
    initialData,
    isLoading = false,
}: TipoEstudioFormProps) => {
    const { modalidades } = useModalidades();
    const { bodyParts } = useBodyParts();
    const { gruposEstudio } = useGrupoEstudio();
    const [formData, setFormData] = useState<TipoEstudioFormData>({
        code: initialData?.code || "",
        description: initialData?.description || "",
        studygroup_id: initialData?.studygroup_id || "",
        bodypart_id: initialData?.bodypart_id || "",
        modality_id: initialData?.modality_id || "",
        rvu: initialData?.rvu || undefined,
        nofviews: initialData?.nofviews || undefined,
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                code: initialData.code || "",
                description: initialData.description || "",
                studygroup_id: initialData.studygroup_id || "",
                bodypart_id: initialData.bodypart_id || "",
                modality_id: initialData.modality_id || "",
                rvu: initialData.rvu,
                nofviews: initialData.nofviews,
            });
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="code">Código *</Label>
                    <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        placeholder="RX-001"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="modality_id">Modalidad *</Label>
                    <Select
                        value={formData.modality_id}
                        onValueChange={(value) => setFormData({ ...formData, modality_id: value })}
                        required
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccione modalidad" />
                        </SelectTrigger>
                        <SelectContent>
                            {modalidades?.data?.map((modality: any) => (
                                <SelectItem key={modality.guid} value={modality.guid}>
                                    {modality.description}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Descripción *</Label>
                <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Radiografía de Tórax"
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="studygroup_id">Grupo de Estudio *</Label>
                    <Select
                        value={formData.studygroup_id}
                        onValueChange={(value) => setFormData({ ...formData, studygroup_id: value })}
                        required
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccione grupo de estudio" />
                        </SelectTrigger>
                        <SelectContent>
                            {gruposEstudio?.data?.map((studygroup: any) => (
                                <SelectItem key={studygroup.guid} value={studygroup.guid}>
                                    {studygroup.description}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="bodypart_id">Parte del Cuerpo *</Label>
                    <Select
                        value={formData.bodypart_id}
                        onValueChange={(value) => setFormData({ ...formData, bodypart_id: value })}
                        required
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccione parte del cuerpo" />
                        </SelectTrigger>
                        <SelectContent>
                            {bodyParts?.data?.map((bodypart: any) => (
                                <SelectItem key={bodypart.guid} value={bodypart.guid}>
                                    {bodypart.description}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="rvu">RVU (Unidades de Valor Relativo)</Label>
                    <Input
                        id="rvu"
                        type="number"
                        step="0.1"
                        value={formData.rvu || ""}
                        onChange={(e) => setFormData({ ...formData, rvu: e.target.value ? parseFloat(e.target.value) : undefined })}
                        placeholder="1.5"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="nofviews">Número de Vistas</Label>
                    <Input
                        id="nofviews"
                        type="number"
                        value={formData.nofviews || ""}
                        onChange={(e) => setFormData({ ...formData, nofviews: e.target.value ? parseInt(e.target.value) : undefined })}
                        placeholder="2"
                    />
                </div>
            </div>

            <div className="flex gap-2 justify-end">
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
