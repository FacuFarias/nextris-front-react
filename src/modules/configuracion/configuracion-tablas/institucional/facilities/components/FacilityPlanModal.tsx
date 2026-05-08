import { useEffect, useMemo, useState } from "react";
import { Modal, PrimaryButton, SecondaryButton } from "@/components";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { FacilityPlan } from "../types/facilities.types";

interface FacilityPlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (planCode: string) => void;
    facilityName?: string;
    initialPlanCode?: string;
    plans?: FacilityPlan[];
    isLoading?: boolean;
}

export const FacilityPlanModal = ({
    isOpen,
    onClose,
    onSubmit,
    facilityName,
    initialPlanCode,
    plans = [],
    isLoading = false,
}: FacilityPlanModalProps) => {
    const normalizedInitial = (initialPlanCode || "free").toLowerCase();
    const [planCode, setPlanCode] = useState(normalizedInitial);

    useEffect(() => {
        setPlanCode(normalizedInitial);
    }, [normalizedInitial, isOpen]);

    const normalizedPlans = useMemo(
        () =>
            plans.map((plan) => ({
                ...plan,
                code: plan.code.toLowerCase(),
            })),
        [plans]
    );

    const hasPlans = normalizedPlans.length > 0;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Gestión del Plan"
            description={facilityName ? `Seleccione el plan para ${facilityName}` : "Seleccione el plan de la institución"}
            size="md"
        >
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Plan</label>
                    <Select
                        value={planCode}
                        onValueChange={setPlanCode}
                        disabled={isLoading}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccione un plan" />
                        </SelectTrigger>
                        <SelectContent>
                            {hasPlans ? (
                                normalizedPlans.map((plan) => (
                                    <SelectItem key={plan.guid} value={plan.code}>
                                        {plan.name}
                                    </SelectItem>
                                ))
                            ) : (
                                <>
                                    <SelectItem value="free">Free</SelectItem>
                                    <SelectItem value="standard">Standard</SelectItem>
                                    <SelectItem value="pro">Pro</SelectItem>
                                    <SelectItem value="enterprise">Enterprise</SelectItem>
                                </>
                            )}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t">
                    <SecondaryButton
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancelar
                    </SecondaryButton>
                    <PrimaryButton
                        type="button"
                        onClick={() => onSubmit(planCode)}
                        disabled={isLoading}
                    >
                        Guardar
                    </PrimaryButton>
                </div>
            </div>
        </Modal>
    );
};
