export const informesKeys = {
    all: ["informes"] as const,
    lists: () => [...informesKeys.all, "list"] as const,
    list: (page: number, per_page: number, search: string, show_reported: boolean, show_ready: boolean) =>
        [...informesKeys.lists(), { page, per_page, search, show_reported, show_ready }] as const,
    listDetalle: (guid: string | undefined) => [...informesKeys.all, "list-detalle", guid] as const,
};
