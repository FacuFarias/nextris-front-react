export const globalKeys = {
    all: ["global"] as const,

    // Partes del cuerpo
    partesDelCuerpo: () => [...globalKeys.all, "partes-del-cuerpo"] as const,

    // Modalidades
    modalidades: () => [...globalKeys.all, "modalidades"] as const,

    // Estudios
    estudios: () => [...globalKeys.all, "estudios-por-modalidad"] as const,

    // Por locación
    equiposPorLocacion: (locationGuid: string, modalityId?: string) =>
        [...globalKeys.all, "equipos-por-locacion", locationGuid, modalityId] as const,

    medicosPorLocacion: (locationGuid: string) =>
        [...globalKeys.all, "medicos-por-locacion", locationGuid] as const,
    medicosAll: () => [...globalKeys.all, "medicos-all"] as const,
    obrasSocialesPorLocacion: (locationGuid: string) =>
        [...globalKeys.all, "obras-sociales-por-locacion", locationGuid] as const,
};

export const locationsKeys = {
    all: ["locations"] as const,
    institutional: () => [...locationsKeys.all, "institutional"] as const,
};

export const patientDomainsKeys = {
    all: ["patients-domains"] as const,
};
