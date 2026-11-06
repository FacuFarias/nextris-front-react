export type AssistantWorklistState = {
    search: string;
    reported: boolean;
    ready: boolean;
    assigned: boolean;
    noImage: boolean;
    withoutOrder: boolean;
    onlyNotes: boolean;
    modality?: string;
    bodyPart?: string;
    studyGroup?: string;
    flags: string[];
    dateRange: string;
    dateField: string;
    page: number;
};

let pending: AssistantWorklistState | null = null;

export function rememberAssistantWorklist(state: AssistantWorklistState) { pending = state; }
export function takeAssistantWorklist() {
    const value = pending;
    pending = null;
    return value;
}
