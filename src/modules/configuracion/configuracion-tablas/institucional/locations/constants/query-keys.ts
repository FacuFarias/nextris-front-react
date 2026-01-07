export const locationsKeys = {
    all: ["locations"] as const,
    details: (guid: string | undefined) => [...locationsKeys.all, "detalle", guid] as const,
};