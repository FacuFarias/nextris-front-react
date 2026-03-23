import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getTemplates,
    getTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    selectTemplate
} from '../services/informe-pred.service';
import type { CreateTemplateRequest, UpdateTemplateRequest } from '../types/informe-pred.types';

/**
 * Hook para obtener la lista de plantillas
 * @param studyTypeId - UUID del tipo de estudio (opcional)
 * @param modalityId - UUID de la modalidad (opcional)
 * @param bodypartId - UUID de la parte del cuerpo (opcional)
 * @returns Query con la lista de plantillas
 */
export const useTemplates = (
    studyTypeId?: string,
    modalityId?: string,
    bodypartId?: string,
    reportType?: string
) => {
    return useQuery({
        queryKey: ['templates', studyTypeId, modalityId, bodypartId, reportType],
        queryFn: () => getTemplates(studyTypeId, modalityId, bodypartId, reportType),
        staleTime: 5 * 60 * 1000, // 5 minutos
    });
};

/**
 * Hook para obtener una plantilla específica
 * @param templateId - UUID de la plantilla
 * @returns Query con los datos de la plantilla
 */
export const useTemplate = (templateId: string) => {
    return useQuery({
        queryKey: ['template', templateId],
        queryFn: () => getTemplateById(templateId),
        enabled: !!templateId,
    });
};

/**
 * Hook para crear una nueva plantilla
 * @returns Mutation para crear plantilla
 */
export const useCreateTemplate = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateTemplateRequest) => createTemplate(data),
        onSuccess: () => {
            // Invalida todas las queries de plantillas para recargar la lista
            queryClient.invalidateQueries({ queryKey: ['templates'] });
        },
    });
};

/**
 * Hook para actualizar una plantilla existente
 * @returns Mutation para actualizar plantilla
 */
export const useUpdateTemplate = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateTemplateRequest }) =>
            updateTemplate(id, data),
        onSuccess: (_, variables) => {
            // Invalida la query de la plantilla específica y la lista
            queryClient.invalidateQueries({ queryKey: ['template', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['templates'] });
        },
    });
};

/**
 * Hook para eliminar una plantilla
 * @returns Mutation para eliminar plantilla
 */
export const useDeleteTemplate = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (templateId: string) => deleteTemplate(templateId),
        onSuccess: () => {
            // Invalida la lista de plantillas
            queryClient.invalidateQueries({ queryKey: ['templates'] });
        },
    });
};

/**
 * Hook para seleccionar una plantilla
 * @returns Mutation para seleccionar plantilla
 */
export const useSelectTemplate = () => {
    return useMutation({
        mutationFn: (templateId: string) => selectTemplate(templateId),
    });
};
