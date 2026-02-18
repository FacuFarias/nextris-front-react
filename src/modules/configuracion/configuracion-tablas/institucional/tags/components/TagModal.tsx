import { Modal } from '@/components/Modal';
import { TagForm } from './TagForm';
import type { Tag, TagFormData } from '../types/tags.types';

interface TagModalProps {
  isOpen: boolean;
  onClose: () => void;
  facilityId: string;
  onSubmit: (data: TagFormData) => void;
  initialData?: Tag;
  isLoading?: boolean;
}

export const TagModal = ({
  isOpen,
  onClose,
  facilityId,
  onSubmit,
  initialData,
  isLoading = false,
}: TagModalProps) => {
  const isEditing = !!initialData;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Tag' : 'Nuevo Tag'}
      description={
        isEditing
          ? 'Modifique los datos del tag'
          : 'Complete los datos para crear un nuevo tag'
      }
      size="md"
    >
      <TagForm
        facilityId={facilityId}
        onSubmit={onSubmit}
        onCancel={onClose}
        initialData={
          initialData
            ? {
                description: initialData.description ?? '',
                is_active: initialData.is_active,
              }
            : undefined
        }
        isLoading={isLoading}
      />
    </Modal>
  );
};
