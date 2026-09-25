import { api } from "@/lib/api"
import type { ExaminationNotesResponse } from "../types/informes.types"

export const getInformes = async ({ page = 1, per_page = 8, search = "", show_reported = false, show_ready = false, assigned_to_me = false, show_no_image = false, show_without_order = false, show_only_with_notes = false, modality_id = "", bodypart_id = "", study_group_id = "", flag_filter = "", date_range = "all", date_field = "admision", sort_column = "", sort_direction = "desc" }) => {

    try {
        const params = new URLSearchParams({
            page: String(page),
            per_page: String(per_page),
            search,
            show_reported: String(show_reported),
            show_ready: String(show_ready),
            assigned_to_me: String(assigned_to_me),
            show_no_image: String(show_no_image),
            show_without_order: String(show_without_order),
            show_only_with_notes: String(show_only_with_notes),
            modality_id: modality_id || "",
            body_part_id: bodypart_id || "",
            study_group_id: study_group_id || "",
            flag_filter,
            date_range,
            date_field,
            sort_column,
            sort_direction,
        });
        const response = await api.get(`/examinations/for-reporting?${params.toString()}`);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const createImageShareLink = async (
    study_iuid: string,
    options: { reason?: string; patient_email?: string } = {},
) => {
    const response = await api.post('/general/viewer-share-links', {
        study_iuid,
        expires_hours: 720,
        ...options,
    });
    return response.data as {
        success: boolean;
        data: { share_url: string; expires_at: string; expires_hours: number; email_sent?: boolean };
        message?: string;
    };
};

export const createCaseLink = async (exam_id: string) => {
    const response = await api.post(`/reports/${exam_id}/case-link`);
    return response.data as {
        success: boolean;
        data: { case_url: string; share_url: string; expires_at: string; expires_hours: number };
        message?: string;
    };
};

export const getInformeDetalle = async (guid: string | undefined) => {
    try {
        const response = await api.get(`/examinations/${guid}/report`);
        return response.data;
    } catch (error) {
        throw error;
    }
}


export interface UpdateReportPayload {
    study_reason?: string;
    content?: string;
    conclusion?: string;
    /** @deprecated aliases accepted by backend */
    findings?: string;
    impressions?: string;
    techniques?: string;
    conclusions?: string;
    template_id?: string;
    mark_as_reported?: boolean;
}

export const putRedactarInforme = async (exam_id: string, data: UpdateReportPayload) => {
    try {
        const response = await api.put(`/examinations/${exam_id}/report`, data);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const blockExam = async (exam_id: string) => {
    try {
        const response = await api.post(`/examinations/${exam_id}/block`);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const unblockExam = async (exam_id: string) => {
    try {
        const response = await api.post(`/examinations/${exam_id}/unblock`);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const updateExaminationFlags = async (exam_id: string, flags: string[]) => {
    try {
        const response = await api.patch(`/examinations/${exam_id}/flags`, { flags });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const updateExaminationTagIds = async (exam_id: string, tag_ids: string[]) => {
    try {
        const response = await api.patch(`/examinations/${exam_id}/tag_ids`, { tag_ids });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const assignExamBatch = async (exam_ids: string[], user_id: string) => {
    try {
        const results = await Promise.allSettled(
            exam_ids.map(exam_id =>
                api.post(`/reports/${exam_id}/assign`, { user_id })
            )
        );
        const failed = results.filter(r => r.status === 'rejected').length;
        if (failed > 0) {
            throw new Error(`${failed} de ${exam_ids.length} estudios no pudieron ser asignados`);
        }
        return { success: true, message: `${exam_ids.length} estudios asignados correctamente` };
    } catch (error) {
        throw error;
    }
};

export const addTagsToExamsBatch = async (exam_ids: string[], tag_ids: string[]) => {
    try {
        const results = await Promise.allSettled(
            exam_ids.map(exam_id =>
                api.patch(`/examinations/${exam_id}/tag_ids`, { tag_ids })
            )
        );
        const failed = results.filter(r => r.status === 'rejected').length;
        if (failed > 0) {
            throw new Error(`${failed} de ${exam_ids.length} estudios no pudieron ser actualizados`);
        }
        return { success: true, message: `${exam_ids.length} estudios actualizados correctamente` };
    } catch (error) {
        throw error;
    }
};

export const addFlagsToExamsBatch = async (exam_ids: string[], flags: string[]) => {
    try {
        const results = await Promise.allSettled(
            exam_ids.map(exam_id =>
                api.patch(`/examinations/${exam_id}/flags`, { flags })
            )
        );
        const failed = results.filter(r => r.status === 'rejected').length;
        if (failed > 0) {
            throw new Error(`${failed} de ${exam_ids.length} estudios no pudieron ser actualizados`);
        }
        return { success: true, message: `${exam_ids.length} estudios actualizados correctamente` };
    } catch (error) {
        throw error;
    }
};

export const createGeneralNote = async (exam_id: string, message: string) => {
    try {
        const response = await api.post(`/examinations/${exam_id}/notes`, { message });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const getExaminationNotes = async (exam_id: string) => {
    try {
        const response = await api.get<ExaminationNotesResponse>(`/examinations/${exam_id}/notes`);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const deleteExaminationNote = async (exam_id: string, note_id: string) => {
    try {
        const response = await api.delete(`/examinations/${exam_id}/notes/${note_id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const getAllTags = async () => {
    try {
        const response = await api.get('/tags/all');
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const getPatientHistory = async (patientId: string) => {
    try {
        const response = await api.get(`/patients/${patientId}/history`);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const assignExam = async (exam_id: string, user_id: string) => {
    try {
        const response = await api.post(`/reports/${exam_id}/assign`, { user_id });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export interface ConfirmStudyPayload {
    referring_physician_id: string | null;
    requesting_physician_id: string | null;
    requesting_physician_name: string | null;
    studytype_id: string;
    clinical_question: string;
    other_details: string;
    laterality_id: string | null;
}

export const confirmStudy = async (exam_id: string, data: ConfirmStudyPayload) => {
    const response = await api.post(`/examinations/${exam_id}/confirm-study`, data);
    return response.data;
};

export type CancellationReason = {
    guid: string;
    code: string;
    description: string;
    sort_order: number;
    active: boolean;
};

export const getCancellationReasons = async () => {
    const response = await api.get<{ success: boolean; data: CancellationReason[] }>('/config/cancellation-reasons');
    return response.data;
};

export const cancelStudy = async (exam_id: string, reason_code: string, detail?: string) => {
    const response = await api.post(`/examinations/${exam_id}/cancel`, { reason_code, detail });
    return response.data;
};

export const markStudyAlreadyRead = async (exam_id: string) => {
    const response = await api.post(`/examinations/${exam_id}/already-read`);
    return response.data;
};

// Versión para desbloquear al cerrar la ventana - usa fetch con keepalive
export const unblockExamOnUnload = (exam_id: string): void => {
    // Obtener baseURL de manera más confiable
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    const url = `${baseURL}/examinations/${exam_id}/unblock`;

    try {
        // fetch con keepalive: true garantiza que el request se complete incluso si la página se cierra
        // A diferencia de sendBeacon, SÍ permite headers personalizados
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: JSON.stringify({}),
            keepalive: true // Esta es la clave - mantiene la request viva al cerrar la página
        })
            .then(response => {
                if (response.ok) {
                    console.log('✅ Informe desbloqueado exitosamente');
                } else {
                    console.error('❌ Error al desbloquear. Status:', response.status);
                }
            })
            .catch(error => {
                console.error('❌ Error en fetch:', error);
            });

    } catch (error) {
        console.error('❌ Excepción al desbloquear:', error);
    }
}
