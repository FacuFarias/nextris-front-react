export const admisionKeys = {
    all: ["admision"] as const,
    pacientesDireccion: () => [...admisionKeys.all, "pacientesDireccion"] as const,
    lists: () => [...admisionKeys.all, "lista"] as const,
    details: (guid: string | undefined) => [...admisionKeys.all, "detalle", guid] as const,

};
