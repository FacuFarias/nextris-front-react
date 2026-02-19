import { useState } from 'react';
import { toast } from 'sonner';
import { TablaDynamic } from '@/components/TableDynamic';
import { PrimaryButton } from '@/components';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFacilities } from '../facilities/hooks/useFacilities';
import { useTags } from './hooks/useTags';
import { TagModal } from './components/TagModal';
import { tagColumns, getTagActions } from './components/columns';
import type { Tag, TagFormData } from './types/tags.types';

export const Tags = () => {
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);

  const { facilities, isLoading: isFacilitiesLoading } = useFacilities();
  const {
    tags,
    isLoading: isTagsLoading,
    createTag,
    isCreating,
    updateTag,
    isUpdating,
    deleteTag,
  } = useTags(selectedFacilityId, true);

  const handleOpenCreate = () => {
    setSelectedTag(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tag: Tag) => {
    setSelectedTag(tag);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTag(null);
  };

  const handleSubmit = (data: TagFormData) => {
    if (selectedTag) {
      updateTag(
        { id: selectedTag.guid, data },
        {
          onSuccess: () => {
            toast.success('Tag actualizado exitosamente');
            handleCloseModal();
          },
          onError: (err: unknown) => {
            const msg = err instanceof Error ? err.message : 'Error al actualizar el tag';
            toast.error(msg);
          },
        },
      );
    } else {
      createTag(data, {
        onSuccess: () => {
          toast.success('Tag creado exitosamente');
          handleCloseModal();
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Error al crear el tag';
          toast.error(msg);
        },
      });
    }
  };

  const handleDelete = (tag: Tag) => {
    if (!confirm(`¿Eliminar el tag "${tag.description}"? Esta acción no se puede deshacer.`)) return;
    deleteTag(tag.guid, {
      onSuccess: () => toast.success('Tag eliminado exitosamente'),
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : 'No se pudo eliminar el tag';
        toast.error(msg);
      },
    });
  };

  const facilityOptions = facilities?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 uppercase tracking-wide dark:text-foreground">Tags</h2>
        <PrimaryButton onClick={handleOpenCreate} disabled={!selectedFacilityId}>
          Nuevo Tag
        </PrimaryButton>
      </div>

      {/* Selector de facility */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700 whitespace-nowrap dark:text-foreground">
          Institución:
        </label>
        <Select
          value={selectedFacilityId}
          onValueChange={setSelectedFacilityId}
          disabled={isFacilitiesLoading}
        >
          <SelectTrigger className="min-w-60">
            <SelectValue placeholder="— Seleccione una institución —" />
          </SelectTrigger>
          <SelectContent>
            {facilityOptions.map((f) => (
              <SelectItem key={f.guid} value={f.guid}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      {selectedFacilityId ? (
        <TablaDynamic
          data={tags}
          columns={tagColumns}
          showIndex
          loading={isTagsLoading}
          actions={getTagActions(handleOpenEdit, handleDelete)}
          emptyMessage="No hay tags para esta institución. Cree el primero."
        />
      ) : (
        <div className="py-12 text-center text-gray-400 text-sm">
          Seleccione una institución para ver sus tags.
        </div>
      )}

      {/* Modal create/edit */}
      <TagModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        facilityId={selectedFacilityId}
        onSubmit={handleSubmit}
        initialData={selectedTag ?? undefined}
        isLoading={isCreating || isUpdating}
      />
    </div>
  );
};
