import { Modal } from "@/components";
import { FacilityForm } from "./FacilityForm";
import type { FacilityFormData, FacilityPlan, FacilityPlanChangeLog, FacilityUsageMonthly } from "../types/facilities.types";

interface FacilityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: FacilityFormData) => void;
    initialData?: Partial<FacilityFormData>;
    isLoading?: boolean;
    plans?: FacilityPlan[];
    usageHistory?: FacilityUsageMonthly[];
    planChangeLogs?: FacilityPlanChangeLog[];
}

export const FacilityModal = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    isLoading = false,
    plans = [],
    usageHistory = [],
    planChangeLogs = [],
}: FacilityModalProps) => {
    const isEditing = !!initialData;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Editar Facility" : "Nueva Facility"}
            description={isEditing ? "Modifique los datos de la facility" : "Complete los datos de la nueva facility"}
            size="xxl"
        >
            <FacilityForm
                onSubmit={onSubmit}
                onCancel={onClose}
                initialData={initialData}
                isLoading={isLoading}
                plans={plans}
                usageHistory={usageHistory}
                planChangeLogs={planChangeLogs}
            />
        </Modal>
    );
};
