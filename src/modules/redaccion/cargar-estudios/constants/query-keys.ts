
export const cargarEstudiosKeys = {
    all: ["cargar-estudios"] as const,
    listNoVinculados: (location_id?: string, include_linked?: boolean, include_pacs?: boolean) =>
        [...cargarEstudiosKeys.all, "list-no-vinculados", location_id, include_linked ? 1 : 0, include_pacs === false ? 0 : 1] as const,
    searchExams: (location_id?: string) => [...cargarEstudiosKeys.all, "search-examinations", location_id] as const,
    listLinkedStudies: (location_id?: string) => [...cargarEstudiosKeys.all, "list-linked-studies", location_id] as const,
};
