export const cargarEstudiosKeys = {
    all: ["cargar-estudios"] as const,
    listNoVinculados: (include_linked?: boolean, include_pacs?: boolean) =>
        [...cargarEstudiosKeys.all, "list-no-vinculados", include_linked ? 1 : 0, include_pacs === false ? 0 : 1] as const,
    searchExams: () => [...cargarEstudiosKeys.all, "search-examinations"] as const,
    listLinkedStudies: () => [...cargarEstudiosKeys.all, "list-linked-studies"] as const,
};
