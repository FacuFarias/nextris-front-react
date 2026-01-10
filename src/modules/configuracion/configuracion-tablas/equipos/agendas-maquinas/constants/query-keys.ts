export const equipmentScheduleKeys = {
    all: ['equipment-schedules'] as const,
    lists: () => [...equipmentScheduleKeys.all, 'list'] as const,
    list: (filters: string) => [...equipmentScheduleKeys.lists(), { filters }] as const,
    details: () => [...equipmentScheduleKeys.all, 'detail'] as const,
    detail: (id: string) => [...equipmentScheduleKeys.details(), id] as const,
};
