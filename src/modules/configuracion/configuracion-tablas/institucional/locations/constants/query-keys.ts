export const locationsKeys = {
    all: ["locations"] as const,
    details: (guid: string | undefined) => [...locationsKeys.all, "detalle", guid] as const,
    create: () => [...locationsKeys.all, "create"] as const,
    update: (guid: string | undefined) => [...locationsKeys.all, "update", guid] as const,
};