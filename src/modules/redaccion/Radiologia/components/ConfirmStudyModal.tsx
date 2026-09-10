import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2, X } from "lucide-react";
import { Modal } from "@/components/Modal";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SecondaryButton } from "@/components/SecondaryButton";
import { Checkbox } from "@/components/ui/checkbox";
import { Autocomplete } from "@/components/autocomplete";
import { getMedicosAll } from "@/services/api-global.service";
import { api } from "@/lib/api";
import { requestingPhysicianService } from "@/modules/configuracion/configuracion-tablas/usuarios-personal/medicos-solicitantes/services/requesting-physicians.service";
import type { ConfirmStudyPayload } from "../services/informes.service";

interface ConfirmStudyModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientName?: string;
    isEditing?: boolean;
    initialData: {
        referring_physician_id: string | null;
        requesting_physician_id: string | null;
        requesting_physician_name: string;
        studytype_id: string;
        clinical_question: string;
        modality_id: string | null;
        modality_description: string;
        other_details: string;
        laterality_id: string | null;
    };
    onConfirm: (data: ConfirmStudyPayload) => Promise<void>;
}

export const ConfirmStudyModal = ({
    isOpen,
    onClose,
    patientName,
    isEditing = false,
    initialData,
    onConfirm,
}: ConfirmStudyModalProps) => {
    const [referringPhysicianId, setReferringPhysicianId] = useState("");
    const [requestingPhysicianId, setRequestingPhysicianId] = useState("");
    const [isOtherRequestingPhysician, setIsOtherRequestingPhysician] = useState(false);
    const [requestingPhysicianName, setRequestingPhysicianName] = useState("");
    const [studytypeId, setStudytypeId] = useState("");
    const [sameModality, setSameModality] = useState(true);
    const [clinicalQuestion, setClinicalQuestion] = useState("");
    const [otherDetails, setOtherDetails] = useState("");
    const [lateralityId, setLateralityId] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data: medicos = [], isLoading: loadingMedicos } = useQuery({
        queryKey: ["medicos-all"],
        queryFn: getMedicosAll,
        enabled: isOpen,
        staleTime: 5 * 60 * 1000,
    });

    const { data: requestingPhysiciansResponse, isLoading: loadingRequestingPhysicians } = useQuery({
        queryKey: ["requesting-physicians-all"],
        queryFn: () => requestingPhysicianService.getAll(),
        enabled: isOpen,
        staleTime: 5 * 60 * 1000,
    });

    const { data: studyTypesResponse, isLoading: loadingStudyTypes } = useQuery({
        queryKey: ["study-types-all", sameModality ? initialData.modality_id : "all"],
        queryFn: () => fetchStudyTypes(sameModality ? initialData.modality_id || undefined : undefined),
        enabled: isOpen,
        staleTime: 10 * 60 * 1000,
    });

    useEffect(() => {
        if (!isOpen) return;
        setReferringPhysicianId(initialData.referring_physician_id || "");
        setRequestingPhysicianId(initialData.requesting_physician_id || "");
        setRequestingPhysicianName(initialData.requesting_physician_name || "");
        setIsOtherRequestingPhysician(Boolean(initialData.requesting_physician_name && !initialData.requesting_physician_id));
        setStudytypeId(initialData.studytype_id || "");
        setSameModality(true);
        setClinicalQuestion(initialData.clinical_question || "");
        setOtherDetails(initialData.other_details || "");
        setLateralityId(initialData.laterality_id || "");
    }, [isOpen, initialData]);

    const requestingPhysicians = requestingPhysiciansResponse?.data || [];
    const studyTypes = studyTypesResponse?.data || [];
    const studyTypeOptions = studyTypes.map((studyType: { guid: string; description: string }) => ({
        value: studyType.guid,
        label: studyType.description,
    }));
    const loading = loadingMedicos || loadingRequestingPhysicians || loadingStudyTypes;

    const handleSubmit = async () => {
        if (!studytypeId) return;
        setIsSubmitting(true);
        try {
            await onConfirm({
                referring_physician_id: referringPhysicianId || null,
                requesting_physician_id: isOtherRequestingPhysician ? null : requestingPhysicianId || null,
                requesting_physician_name: isOtherRequestingPhysician ? requestingPhysicianName.trim() || null : null,
                studytype_id: studytypeId,
                clinical_question: clinicalQuestion,
                other_details: otherDetails,
                laterality_id: lateralityId || null,
            });
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Editar estudio" : "Confirmar estudio"}
            description={patientName ? `Paciente: ${patientName}` : "Complete los datos del estudio antes de confirmarlo."}
            size="full"
            className="w-[min(95vw,1100px)] sm:max-w-5xl"
        >
            <div className="space-y-6">
                {loading ? (
                    <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Cargando catálogos...
                    </div>
                ) : (
                    <div className="grid gap-5 md:grid-cols-2">
                        <Field label="Médico referente">
                            <select
                                value={referringPhysicianId}
                                onChange={(event) => setReferringPhysicianId(event.target.value)}
                                className={selectClassName}
                            >
                                <option value="">Sin médico referente</option>
                                {medicos.map((medico: { guid: string; name: string }) => (
                                    <option key={medico.guid} value={medico.guid}>{medico.name}</option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Médico solicitante">
                            <div className="space-y-3">
                                {!isOtherRequestingPhysician ? (
                                    <select
                                        value={requestingPhysicianId}
                                        onChange={(event) => setRequestingPhysicianId(event.target.value)}
                                        className={selectClassName}
                                    >
                                        <option value="">Sin médico solicitante</option>
                                        {requestingPhysicians.map((physician: { guid: string; description: string }) => (
                                            <option key={physician.guid} value={physician.guid}>{physician.description}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        value={requestingPhysicianName}
                                        onChange={(event) => setRequestingPhysicianName(event.target.value)}
                                        placeholder="Ingrese el nombre del médico solicitante..."
                                        className={selectClassName}
                                    />
                                )}
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Checkbox
                                        id="confirm-study-other-requesting-physician"
                                        checked={isOtherRequestingPhysician}
                                        onCheckedChange={(checked) => {
                                            const isOther = checked === true;
                                            setIsOtherRequestingPhysician(isOther);
                                            if (isOther) {
                                                setRequestingPhysicianId("");
                                            } else {
                                                setRequestingPhysicianName("");
                                            }
                                        }}
                                    />
                                    <label htmlFor="confirm-study-other-requesting-physician" className="cursor-pointer">Otro</label>
                                </div>
                            </div>
                        </Field>

                        <Field label="Razón del estudio">
                            <textarea
                                value={clinicalQuestion}
                                onChange={(event) => setClinicalQuestion(event.target.value)}
                                placeholder="Ingrese la razón o pregunta clínica del estudio..."
                                className="min-h-32 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
                            />
                        </Field>

                        <Field label="Otros detalles">
                            <textarea
                                value={otherDetails}
                                onChange={(event) => setOtherDetails(event.target.value)}
                                placeholder="Ingrese otros detalles del estudio..."
                                className="min-h-28 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
                            />
                        </Field>

                        <Field label="Tipo de estudio" required>
                            <div className="space-y-3">
                                <Autocomplete
                                    options={studyTypeOptions}
                                    value={studytypeId}
                                    onValueChange={setStudytypeId}
                                    placeholder="Seleccione un tipo de estudio..."
                                    searchPlaceholder="Buscar tipo de estudio..."
                                    emptyMessage="No se encontraron tipos de estudio."
                                    isLoading={loadingStudyTypes}
                                />
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Checkbox
                                        id="confirm-study-same-modality"
                                        checked={sameModality}
                                        disabled={!initialData.modality_id}
                                        onCheckedChange={(checked) => setSameModality(checked === true)}
                                    />
                                    <label htmlFor="confirm-study-same-modality" className="cursor-pointer">
                                        Misma modalidad{initialData.modality_id && initialData.modality_description ? ` (${initialData.modality_description})` : ""}
                                    </label>
                                </div>
                            </div>
                        </Field>

                        <Field label="Lateralidad (opcional)">
                            <select
                                value={lateralityId}
                                onChange={(event) => setLateralityId(event.target.value)}
                                className={selectClassName}
                            >
                                <option value="">Sin lateralidad</option>
                                {lateralityOptions.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </Field>
                    </div>
                )}

                <div className="flex flex-col-reverse justify-end gap-3 border-t pt-4 sm:flex-row">
                    <SecondaryButton onClick={onClose}>
                        <X className="mr-2 h-5 w-5" />
                        Cancelar
                    </SecondaryButton>
                    <PrimaryButton onClick={handleSubmit} disabled={!studytypeId || loading || isSubmitting}>
                        {isSubmitting ? (
                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" />{isEditing ? "Guardando..." : "Confirmando..."}</>
                        ) : (
                            <><CheckCircle2 className="mr-2 h-5 w-5" />{isEditing ? "Guardar cambios" : "Confirmar estudio"}</>
                        )}
                    </PrimaryButton>
                </div>
            </div>
        </Modal>
    );
};

const selectClassName = "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20";

const lateralityOptions = [
    { value: "7b2f0a7e-4cb0-4c54-9e32-000000000001", label: "IZQUIERDA" },
    { value: "7b2f0a7e-4cb0-4c54-9e32-000000000002", label: "DERECHA" },
    { value: "7b2f0a7e-4cb0-4c54-9e32-000000000003", label: "BILATERAL" },
];

const Field = ({
    label,
    required = false,
    className = "",
    children,
}: {
    label: string;
    required?: boolean;
    className?: string;
    children: React.ReactNode;
}) => (
    <label className={`space-y-2 ${className}`}>
        <span className="block text-sm font-semibold text-foreground">
            {label} {required && <span className="text-red-500">*</span>}
        </span>
        {children}
    </label>
);

const fetchStudyTypes = async (modalityId?: string) => {
    const response = await api.get("/config/study-types", {
        params: modalityId ? { modality_id: modalityId } : undefined,
    });
    return response.data as { success: boolean; data: Array<{ guid: string; description: string }> };
};
