export type AssistantCommand = {
    id: string;
    kind: 'context' | 'worklist' | 'filter' | 'reports' | 'sort' | 'select' | 'layout' | 'layout_set' | 'layout_save' | 'editor' | 'report_header' | 'report_context' | 'report_edit' | 'report_undo' | 'report_save' | 'report_sign';
    args: Record<string, unknown>;
};

export type AssistantResult = {
    status: string;
    view?: string;
    total?: number;
    selectedCount?: number;
    page?: number;
    pageSize?: number;
    visibleCount?: number;
    position?: number;
    sortColumn?: string;
    sortDirection?: 'asc' | 'desc';
    visibleColumns?: string[];
    availableColumns?: string[];
    reported?: boolean;
    ready?: boolean;
    assignedToMe?: boolean;
    modality?: string;
    dateRange?: string;
    hasUnsavedChanges?: boolean;
    revision?: string;
    fields?: Record<string, Array<{ blockId: string; kind: string; text: string; placeholders: string[] }>>;
    header?: Record<string, string>;
    signed?: boolean;
    readOnly?: boolean;
    editCount?: number;
    browserMs?: number;
};

export type AssistantHandler = (command: AssistantCommand) => Promise<AssistantResult> | AssistantResult;
const handlers = new Map<string, AssistantHandler>();
const completions = new Map<string, () => void | Promise<void>>();

export function onAssistantCommandAcknowledged(id: string, callback: () => void | Promise<void>) {
    completions.set(id, callback);
}

export function acknowledgeAssistantCommand(id: string) {
    const callback = completions.get(id);
    completions.delete(id);
    if (callback) void callback();
}

export function registerAssistantHandler(view: string, handler: AssistantHandler) {
    handlers.set(view, handler);
    return () => { if (handlers.get(view) === handler) handlers.delete(view); };
}

export async function callAssistantHandler(view: string, command: AssistantCommand): Promise<AssistantResult> {
    for (let attempt = 0; attempt < 100; attempt += 1) {
        const handler = handlers.get(view);
        if (handler) return handler(command);
        await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return { status: 'view_unavailable' };
}

export function currentAssistantView(pathname: string) {
    if (pathname.startsWith('/worklist/redactar-informe/')) return 'editor';
    if (pathname === '/worklist') return 'worklist';
    return 'other';
}
