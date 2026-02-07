export const cargarEstudiosKeys = {
    all: ["cargar-estudios"] as const,
    listNoVinculados: () => [...cargarEstudiosKeys.all, "list-no-vinculados"] as const,
};
