import { Modal } from "@/components";
import { LocationForm } from "./LocationForm";
import type { LocationFormData } from "../types/locations.types";

interface LocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: LocationFormData) => void;
    initialData?: Partial<LocationFormData>;
    isLoading?: boolean;
}

export const LocationModal = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    isLoading = false,
}: LocationModalProps) => {
    const isEditing = !!initialData;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Editar Location" : "Nueva Location"}
            description={isEditing ? "Modifique los datos de la ubicación" : "Complete los datos de la nueva ubicación"}
            size="lg"
        >
            <LocationForm
                onSubmit={onSubmit}
                onCancel={onClose}
                initialData={initialData}
                isLoading={isLoading}
            />
        </Modal>
    );
};
