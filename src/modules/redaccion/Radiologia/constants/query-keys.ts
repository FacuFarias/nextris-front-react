export const informesKeys = {
    all: ["informes"] as const,
    lists: () => [...informesKeys.all, "list"] as const,
    list: (page: number, per_page: number, search: string, show_reported: boolean, show_ready: boolean, bodypart_id: string, modality_id: string, study_group_id: string) =>
        [...informesKeys.lists(), { page, per_page, search, show_reported, show_ready, bodypart_id, modality_id, study_group_id }] as const,
    listDetalle: (guid: string | undefined) => [...informesKeys.all, "list-detalle", guid] as const,
    quitarFirm: (examId: string | undefined) => [...informesKeys.all, "quitar-firm", examId] as const,
};
