import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tagsKeys } from '../constants/query-keys';
import { tagsService } from '../services/tags.service';
import type { TagFormData } from '../types/tags.types';

export const useTags = (facilityId: string, includeInactive = false) => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: tagsKeys.byFacility(facilityId),
    queryFn: () => tagsService.getByFacility(facilityId, includeInactive),
    enabled: !!facilityId,
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (formData: TagFormData) => tagsService.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagsKeys.byFacility(facilityId) });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TagFormData> }) =>
      tagsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagsKeys.byFacility(facilityId) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (tagId: string) => tagsService.delete(tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagsKeys.byFacility(facilityId) });
    },
  });

  return {
    tags: data?.data ?? [],
    isLoading,
    error,
    createTag: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateTag: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteTag: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
};
