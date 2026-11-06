export interface LocalReport {
    signatures?: Array<{professional: string; image: string | null; stamp_image: string | null; registration?: string | null}>;
    id_informe: string | number;
    fecha?: string | null;
    profesional?: string | null;
    profesional2?: string | null;
    rad_id?: string | number | null;
    rad_id2?: string | number | null;
    procedimientos?: string | null;
    solicitante?: string | null;
    accession_number?: string | null;
    categoria?: string | null;
    modalidad?: string | null;
    materiales?: string | null;
    textos?: Record<string, { as?: string; contenido?: string }>;
    apendices?: Array<{ fecha?: string; motivo?: string; texto?: string }>;
}

interface HistoryEntry {
    id: string;
    guid: string | null;
    local_exam_id: string | null;
    accession_number: string;
    estudio: string;
    medico_autor: string;
    medico_referente: string;
    fecha: string;
    modalidad: string;
    con_imagen: string;
    isreported: number;
    report_available: boolean;
    hidden_in_portal: number;
    studyinstanceuid: string | null;
}

export type CombinedHistoryEntry = HistoryEntry & { source: 'nextris' };

export interface CombinedHistoryResponse {
    success: boolean;
    data: CombinedHistoryEntry[];
}
