export const obrasSocialesKeys = {
    all: ["obrasSociales"] as const,
    locations: (insuranceId: string) => ["obrasSociales", "locations", insuranceId] as const,
};
