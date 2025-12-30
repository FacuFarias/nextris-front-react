export const ejecucionKeys = {
    all: ["ejecucion"] as const,
    lists: () => [...ejecucionKeys.all, "list"] as const,
    details: () => [...ejecucionKeys.all, "detail"] as const,
    detail: (guid: string) => [...ejecucionKeys.details(), guid] as const,
    /*  list: (page: number, perPage: number, search: string) =>
         [...ejecucionKeys.lists(), { page, perPage, search }] as const,
     histories: () => [...ejecucionKeys.all, "history"] as const,
     history: (patientId: string) => [...ejecucionKeys.histories(), patientId] as const, */
};