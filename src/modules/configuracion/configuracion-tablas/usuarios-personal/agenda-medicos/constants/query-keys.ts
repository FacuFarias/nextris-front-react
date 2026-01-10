export const physicianScheduleKeys = {
    all: ['physician-schedules'] as const,
    lists: () => [...physicianScheduleKeys.all, 'list'] as const,
    list: (filters: string) => [...physicianScheduleKeys.lists(), { filters }] as const,
    details: () => [...physicianScheduleKeys.all, 'detail'] as const,
    detail: (id: string) => [...physicianScheduleKeys.details(), id] as const,
};
