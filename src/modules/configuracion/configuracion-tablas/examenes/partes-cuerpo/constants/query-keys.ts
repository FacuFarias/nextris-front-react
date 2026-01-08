export const bodyPartsKeys = {
    all: ['body-parts'] as const,
    lists: () => [...bodyPartsKeys.all, 'list'] as const,
    list: (filters: string) => [...bodyPartsKeys.lists(), { filters }] as const,
    details: () => [...bodyPartsKeys.all, 'detail'] as const,
    detail: (id: string) => [...bodyPartsKeys.details(), id] as const,
};
