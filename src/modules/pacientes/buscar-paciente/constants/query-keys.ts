export const patientsKeys = {
    all: ["patients"] as const,
    lists: () => [...patientsKeys.all, "list"] as const,
    list: (page: number, perPage: number, search: string, hideWithoutStudies: boolean = false, columnFilters: string = "{}") =>
        [...patientsKeys.lists(), { page, perPage, search, hideWithoutStudies, columnFilters }] as const,
    details: () => [...patientsKeys.all, "detail"] as const,
    detail: (id: string) => [...patientsKeys.details(), id] as const,
    histories: () => [...patientsKeys.all, "history"] as const,
    history: (patientId: string) => [...patientsKeys.histories(), patientId] as const,
};
