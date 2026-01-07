export const facilitiesKeys = {
    all: ["facilities"] as const,
    details: (guid: string | undefined) => [...facilitiesKeys.all, "detalle", guid] as const,
};