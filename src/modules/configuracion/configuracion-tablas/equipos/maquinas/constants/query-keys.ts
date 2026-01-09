export const equipmentKeys = {
    all: ['equipment'] as const,
    lists: () => [...equipmentKeys.all, 'list'] as const,
    list: (filters: string) => [...equipmentKeys.lists(), { filters }] as const,
    details: () => [...equipmentKeys.all, 'detail'] as const,
    detail: (id: string) => [...equipmentKeys.details(), id] as const,
};
