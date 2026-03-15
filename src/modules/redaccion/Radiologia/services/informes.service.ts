import { api } from "@/lib/api"

export const getInformes = async ({ page = 1, per_page = 8, search = "", show_reported = false, show_ready = false, show_no_image = false, show_only_with_notes = false, modality_id = "", bodypart_id = "", study_group_id = "", flag_filter = "", date_range = "all", date_field = "admision", sort_column = "", sort_direction = "desc" }) => {

    try {
        const response = await api.get(`/examinations/for-reporting?page=${page}&per_page=${per_page}&search=${search}&show_reported=${show_reported}&show_ready=${show_ready}&show_no_image=${show_no_image}&show_only_with_notes=${show_only_with_notes}&modality_id=${modality_id}&body_part_id=${bodypart_id}&study_group_id=${study_group_id}&flag_filter=${flag_filter}&date_range=${date_range}&date_field=${date_field}&sort_column=${sort_column}&sort_direction=${sort_direction}`);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const getInformeDetalle = async (guid: string | undefined) => {
    try {
        const response = await api.get(`/examinations/${guid}/report?debug_sr=1`);
        return response.data;
    } catch (error) {
        throw error;
    }
}


export interface UpdateReportPayload {
    findings?: string;
    impressions?: string;
    techniques?: string;
    conclusions?: string;
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

export const updateGeneralNotes = async (exam_id: string, general_notes: string) => {
    try {
        const response = await api.patch(`/examinations/${exam_id}/general-notes`, { general_notes });
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
