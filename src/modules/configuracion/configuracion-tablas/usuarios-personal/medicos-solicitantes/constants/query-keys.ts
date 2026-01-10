export const requestingPhysicianKeys = {
    all: ['requesting-physicians'] as const,
    lists: () => [...requestingPhysicianKeys.all, 'list'] as const,
    list: (filters: string) => [...requestingPhysicianKeys.lists(), { filters }] as const,
    details: () => [...requestingPhysicianKeys.all, 'detail'] as const,
    detail: (id: string) => [...requestingPhysicianKeys.details(), id] as const,
};
