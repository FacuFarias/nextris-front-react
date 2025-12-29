export const citasKeys = {
    all: ["citas"] as const,
    lists: () => [...citasKeys.all, "list"] as const,
    list: (page: number, perPage: number, search: string) =>
        [...citasKeys.lists(), { page, perPage, search }] as const,
    details: () => [...citasKeys.all, "detail"] as const,
    detail: (id: string) => [...citasKeys.details(), id] as const,
    calendar: () => [...citasKeys.all, "calendar"] as const,
    calendarEventos: () => [...citasKeys.calendar(), "eventos"] as const,
};
