export const locationsKeys = {
    all: ["locations"] as const,
    list: (includeInactive: boolean) => [...locationsKeys.all, "list", includeInactive ? "all" : "active"] as const,
    details: (guid: string | undefined) => [...locationsKeys.all, "detalle", guid] as const,
    create: () => [...locationsKeys.all, "create"] as const,
    update: (guid: string | undefined) => [...locationsKeys.all, "update", guid] as const,
};