
export const cargarEstudiosKeys = {
    all: ["cargar-estudios"] as const,
    listNoVinculados: (location_id?: string) => [...cargarEstudiosKeys.all, "list-no-vinculados", location_id] as const,
    searchExams: (location_id?: string) => [...cargarEstudiosKeys.all, "search-examinations", location_id] as const,
};
