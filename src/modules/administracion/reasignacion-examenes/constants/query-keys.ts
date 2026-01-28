export const reasignacionExamenesKeys = {
    all: ["reasignacion-examenes"] as const,
    lists: () => [...reasignacionExamenesKeys.all, "lista"] as const,
    listsPacientes: () => [...reasignacionExamenesKeys.all, "lista-pacientes"] as const,
    postPacientes: () => [...reasignacionExamenesKeys.all, "post-pacientes"] as const,
};
