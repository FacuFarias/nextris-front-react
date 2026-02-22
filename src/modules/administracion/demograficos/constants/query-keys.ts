export const DEMOGRAFICOS_QUERY_KEYS = {
    all: ['demograficos'] as const,
    list: () => [...DEMOGRAFICOS_QUERY_KEYS.all, 'list'] as const,
};
